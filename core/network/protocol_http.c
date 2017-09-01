/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Protocol HTTP parser
 *
 *  @author HT
 *  @date pushed 14/10/2015
 */

#include <stdio.h>
#include <string.h>
#include <time.h>
#include "core/friend_core.h"
#include "core/library.h"

#include "util/string.h"
#include "util/murmurhash3.h"

#include "network/uri.h"
#include "network/http.h"
#include "network/mime.h"
#include "network/websocket.h"
#include "network/protocol_http.h"

#include <system/systembase.h>
#include <network/locfile.h>
#include <system/systembase.h>
#include <system/cache/cache_manager.h>
#include <util/tagitem.h>
#include <util/list_string.h>
#include <network/protocol_webdav.h>
#include <system/fsys/file.h>
#include <system/fsys/device_handling.h>

#include <system/user/user_sessionmanager.h>
#include <system/user/user_manager.h>
#include <system/web_util.h>

#define HTTP_REQUEST_TIMEOUT 2 * 60
#define SHARING_BUFFER_SIZE 262144

extern SystemBase *SLIB;

// 
//	TODO: This should be moved
//It is to help us with fallback PHP support
//
/**
 * Function runs php script via PHP
 *
 * @param command pointer to php command provided as string
 * @return new ListString structure or NULL when problem appear
 */
inline ListString *RunPHPScript( const char *command )
{
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		Log( FLOG_ERROR,"Cannot open pipe\n");
		return NULL;
	}
	
	FULONG size = 0;
	ListString *data = ListStringNew();

#define PHP_READ_SIZE 262144
	char buf[ PHP_READ_SIZE ]; memset( buf, '\0', PHP_READ_SIZE );
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		size = fread( buf, sizeof(char), PHP_READ_SIZE, pipe );
		
		if( size > 0 )
		{
			ListStringAdd( data, buf, size );
		}
		pthread_yield();
	}
	ListStringJoin( data );		
	
	// Free buffer if it's there
	pclose( pipe );
	
	return data;
}

/**
 * Read single local file
 * 
 * we assume that mime is not neccessary for many files in one
 *
 * @param uri pointer to Uri structure
 * @param locpath pointer to file path
 * @param dstbs pointer to BufString when data will be stored
 * @param result pointer to place where http status will be stored
 * @return 0 when success, otherwise NULL
 */
inline int ReadServerFile( Uri *uri, char *locpath, BufString *dstbs, int *result )
{
	Path *base = PathNew( "resources" );
	if( base == NULL )
	{
		Log( FLOG_ERROR,"Cannot create base path!\n");
		return -1;
	}
	
	DEBUG("[ReadServerFile] path %s\n", locpath );
	Path *convPath = PathNew( locpath );
	if( convPath == NULL )
	{
		PathFree( base );
		Log( FLOG_ERROR,"Cannot read file from server\n");
		return -2;
	}
		
	PathResolve( convPath ); 
	
	Path* completePath = PathJoin( base, convPath );
	if( completePath == NULL )
	{
		Log( FLOG_ERROR,"Cannot create completePath!\n");
		PathFree( base );
		PathFree( convPath );
		return -3;
	}
	
	FBOOL freeFile = FALSE;
	
	LocFile* file = NULL;
	if( pthread_mutex_lock( &SLIB->sl_ResourceMutex ) == 0 )
	{
		if( SLIB->sl_CacheFiles == 1 )
		{
			file = CacheManagerFileGet( SLIB->cm, completePath->raw, FALSE );
		
			//pthread_mutex_unlock( &SLIB->sl_ResourceMutex );
		
			if( file == NULL )
			{
				char *decoded = UrlDecodeToMem( completePath->raw );
				file = LocFileNew( decoded, FILE_READ_NOW | FILE_CACHEABLE );
				FFree( decoded );
				
				if( file != NULL )
				{
					//if( pthread_mutex_lock( &SLIB->sl_ResourceMutex ) == 0 )
					{
						if( CacheManagerFilePut( SLIB->cm, file ) != 0 )
						{
							freeFile = TRUE;
						}
						//pthread_mutex_unlock( &SLIB->sl_ResourceMutex );
					}
				}
				else
				{
					Log( FLOG_ERROR,"Cannot read file %s\n", completePath->raw );
				}
			}
			else
			{
				struct stat attr;
				stat( completePath->raw, &attr);
			
				// if file is new file, reload it
			
			
				//DEBUG1("\n\n\n\n\n SIZE %lld  stat %lld\n\n\n\n",attr.st_mtime ,file->info.st_mtime );
				if( attr.st_mtime != file->lf_Info.st_mtime )
				{
					LocFileReload( file, completePath->raw);
				}
			}
		}
		else
		{
			//pthread_mutex_unlock( &SLIB->sl_ResourceMutex );
			
			char *decoded = UrlDecodeToMem( completePath->raw );
			file = LocFileNew( decoded, FILE_READ_NOW | FILE_CACHEABLE );
			FFree( decoded );
			if( file == NULL )
			{
				Log( FLOG_ERROR,"Cannot load file in developer mode %s\n", completePath->raw );
			}
			else
			{
				freeFile = TRUE;
			}
		}
		pthread_mutex_unlock( &SLIB->sl_ResourceMutex );
	}

	// Send reply
	if( file != NULL )
	{
		if(  file->lf_Buffer == NULL )
		{
			Log( FLOG_ERROR,"File is empty %s\n", completePath->raw );
		}

		BufStringAddSize( dstbs, file->lf_Buffer, file->lf_FileSize );
		BufStringAdd( dstbs, "\n");

		if( freeFile == TRUE )
		{
			LocFileDelete( file );
		}

		*result = 200;
	}
	else
	{
		// Try to fall back on module
		// TODO: Make this behaviour configurable
		char *command;
		
		int loclen = strlen( locpath )+256;
		if( ( command = FCalloc( loclen, sizeof( char ) ) ) != NULL )
		{
			snprintf( command, loclen, "php \"php/catch_all.php\" \"%s\";", locpath ); 
			DEBUG( "[ReadServerFile] Executing %s\n", command );
			int phpRun = FALSE;
			ListString *bs = RunPHPScript( command );
			if( bs )
			{
				if( bs->ls_Size > 0 )
				{
					BufStringAddSize( dstbs, bs->ls_Data, bs->ls_Size );
					BufStringAdd( dstbs, "\n");
				}
			
				phpRun = TRUE;
				*result = 200;

				ListStringDelete( bs );
			}
		
			if( !phpRun )
			{
				INFO("[ReadServerFile] File do not exist %s\n", locpath );

				*result = 404;
			}
			
			FFree( command );
		}
	}
	PathFree( base );
	PathFree( completePath );
	PathFree( convPath );
	
	return 0;
}

/**
 * Http protocol parser
 *
 * @param sock pointer to Socket from which request will readed and which will be used to return response
 * @param data pointer to already received data
 * @param length length of already received data
 * @return new Http structrure when success, otherwise NULL
 */
extern inline Http *ProtocolHttp( Socket* sock, char* data, unsigned int length )
{
	Http *response = NULL;
	Log( FLOG_DEBUG,"[ProtocolHttp] HTTP Callback called\n");
	
	if( length <= 0 )
	{
		Log( FLOG_DEBUG,"[ProtocolHttp] Message length<0 http400\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_400_BAD_REQUEST, tags );
	
		return response;
	}
	
	// Get the current request we're working on, or start a new one
	Http* request = (Http*)sock->data;
	if( !request )
	{
		request = HttpNew( );
		request->timestamp = time( NULL );
		sock->data = (void*)request;
		request->h_Socket = sock;
	}

	//DEBUG("time %ld\nreqtimestamp %ld\nreqtimestamp %ld\n",
	//	  time( NULL ), request->timestamp, HTTP_REQUEST_TIMEOUT );
	// Timeout
	/*
	if( time( NULL ) > request->timestamp + HTTP_REQUEST_TIMEOUT )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/plain" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_408_REQUEST_TIME_OUT,  tags );
		
		HttpAddTextContent( response, "408 Request Timeout\n" );
		//HttpWriteAndFree( response );
		HttpFreeRequest( request );
		sock->data = NULL;
		DEBUG("HTTP TIMER\n");
		return response;
	}*/
	
	// Continue parsing the request
	int result = HttpParsePartialRequest( request, data, length );
	
	partialRequest:
	
	// Protocol error
	if( result < 0 )
	{
		Log( FLOG_DEBUG, "[ProtocolHttp] RESULT < 0 http 400 will be returned\n");
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_400_BAD_REQUEST, tags );
	
		//HttpWriteAndFree( response );
	}
	// Request not fully parsed yet. Return and wait for more data
	else if( result == -1 )
	{
		DEBUG( "[ProtocolHttp] <- (%d): Waiting for more data\n", sock->fd );
		HttpFreeRequest( request );
		return response;
	}
	// Request parsed without errors!
	else if( result == 1 && request->uri->path != NULL )
	{
		Log( FLOG_DEBUG, "[ProtocolHttp] Request parsed without errors\n");
		Uri *uri = request->uri;
		Path *path = NULL;
		if( uri->path->raw )
		{
			int nlen = 0;
			for( ; ; nlen++ )
			{
				if( !uri->path->raw[nlen] )
				{
					break;
				}
			}
			DEBUG("[ProtocolHttp] Want to parse path: %s (%d)\n", uri->path->raw, nlen );
			path = PathNew( uri->path->raw );
			if( path )
			{
				PathResolve( path );  // Resolve checks for "../"'s, and removes as many as it can.
			}
		}
		
		// Disallow proxy requests
		if( uri && ( uri->scheme || uri->authority ) )
		{
			DEBUG("[ProtocolHttp] Dissalow proxy\n");
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};
		
			response = HttpNewSimple( HTTP_403_FORBIDDEN, tags );
	
			result = 403;
		}
		
		//
		// WEBDAV
		//
		
		else if( strcmp( "webdav", path->parts[ 0 ] ) == 0 ) //if( (request->h_ContentType == HTTP_CONTENT_TYPE_APPLICATION_XML || request->h_ContentType == HTTP_CONTENT_TYPE_TEXT_XML ) &&
		{
			response = HandleWebDav( request, request->content, request->sizeOfContent );
			
			result = 200;
		}

		//
		// Cross-domain requests uses a pre-flight OPTIONS call
		//
		
		else if( !request->errorCode && request->method && strcmp( request->method, "OPTIONS" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTROL_ALLOW_ORIGIN, (FULONG)StringDuplicateN( "*", 1 ) },
				{ HTTP_HEADER_CONTROL_ALLOW_HEADERS, (FULONG)StringDuplicateN( "Origin, X-Requested-With, Content-Type, Accept, Method", 54 ) },
				{ HTTP_HEADER_CONTROL_ALLOW_METHODS,  (FULONG)StringDuplicateN( "GET, POST, OPTIONS", 18 ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
				{ TAG_DONE, TAG_DONE }
			};

			response = HttpNewSimple( HTTP_200_OK,  tags );

			result = 200;
		}		
		// Check for connection upgrade
		else if( !request->errorCode && HttpHeaderContains( request, "connection", "Upgrade", false ) )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};
		
			response = HttpNewSimple(  HTTP_400_BAD_REQUEST, tags );
	
		}
		else
		{
			if( !path || !path->resolved ) // If it cannot remove all, path->resolved == false.
			{
				FERROR("404 error\n");

				struct TagItem tags[] = {
					{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{ TAG_DONE, TAG_DONE }
				};
		
				response = HttpNewSimple( HTTP_403_FORBIDDEN,  tags );
	
				result = 403;
			}
			else
			{
				//
				// we must check if thats WEBDAV call and provide data
				//
				/*
				if( strcmp( "webdav", path->parts[ 0 ] ) == 0 )
				{
					response = HandleWebDav( request, request->content, request->sizeOfContent );
			
					result = 200;
				}*/
				//
				//
				//
				//else
				{
					if( path->size >= 2 && StringCheckExtension( path->parts[0], "library" ) == 0 )
					{
						// system.library is main library and should be use for most things
						// we open it and close in main

						if( strcmp( path->parts[ 0 ], "system.library" ) == 0 )
						{
							DEBUG("[ProtocolHttp] -----------------------------------------------------Calling SYSBASE via HTTP %s\n", path->parts[1] );
							
							int respcode = 0;
							response = SLIB->SysWebRequest( SLIB, &(path->parts[1]), &request, NULL, &respcode );
						
							if( response == NULL )
							{
								struct TagItem tags[] = {
									{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
									{ TAG_DONE, TAG_DONE }
								};	
		
								response = HttpNewSimple(  HTTP_500_INTERNAL_SERVER_ERROR,  tags );
	
								result = 500;
							}
						}
						else
						{
							UserSession *session = NULL;
							HashmapElement *tst = GetHEReq( request, "sessionid" );
							if( tst != NULL )
							{
								if( tst->data != NULL )
								{
									session = SLIB->sl_USM->usm_Sessions;
									while( session != NULL )
									{
										if(  strcmp( session->us_SessionID, (char *)tst->data ) == 0 )
										{
											break;
										}
										session = (UserSession *)session->node.mln_Succ;
									}
								}
							}
							UserLoggerStore( SLIB->sl_ULM, session, request->rawRequestPath, request->h_UserActionInfo );
							
							FriendCoreInstance_t *fci = (FriendCoreInstance_t *) sock->s_Data;
							Library* lib = FriendCoreGetLibrary( fci, path->parts[0], 1 );
							if( lib && lib->WebRequest )
							{
								response = lib->WebRequest( lib, path->parts[1], request );
								if( response == NULL )
								{
									struct TagItem tags[] = {
										{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
										{ TAG_DONE, TAG_DONE }
									};	
		
									response = HttpNewSimple( HTTP_500_INTERNAL_SERVER_ERROR,  tags );
	
									result = 500;
								}
							}
							else
							{
								struct TagItem tags[] = {
									{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
									{ TAG_DONE, TAG_DONE }
								};	
		
								response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
								result = 404;
							}
						}
					}
					
					//
					// login path file
					//
					
					else if( strcmp( path->parts[ 0 ], "loginprompt" ) == 0 )
					{
						//
						//
						if( strcmp( SLIB->sl_ActiveModuleName, "fcdb.authmod" ) != 0 )
						//if( strcmp( SLIB->sl_ActiveAuthModule->am_Name, "fcdb.authmod" ) != 0 )
						{
							FULONG res = 0;

							char command[ 1024 ];

							// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
							int cx = snprintf( command, sizeof(command), "php \"%s\" \"%s\" \"%s\" \"%s\";", "php/login.php", uri->path->raw, uri->queryRaw, request->content ); // SLIB->sl_ModuleNames
							if( !( cx >= 0 ) )
							{
								FERROR( "[ProtocolHttp] snprintf\n" );;
							}
							else
							{
								FILE *pipe = popen( command, "r" );
								ListString *ls = NULL;
	
								if( pipe != NULL )
								{
									ls = ListStringNew();
									char buffer[ 1024 ];
	
									while( !feof( pipe ) )
									{
										int reads = fread( buffer, sizeof( char ), 1024, pipe );
										if( reads > 0 )
										{
											ListStringAdd( ls, buffer, reads );
											res += reads;
										}
									}
									pclose( pipe );
								}

								ListStringJoin( ls );
								
								struct TagItem tags[] = {
									{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate("text/html") },
									{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
									{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
									{TAG_DONE, TAG_DONE}
								};
		
								response = HttpNewSimple( HTTP_200_OK, tags );

								if( ls->ls_Data != NULL )
								{
									HttpSetContent( response, ls->ls_Data, res );
								}
								else
								{
									HttpAddTextContent( response, "fail<!--separate-->PHP script return error" );
								}
						
								// write here and set data to NULL!!!!!
								// retusn response
								HttpWrite( response, sock );
								result = 200;

								ls->ls_Data = NULL;
								ListStringDelete( ls );
							}
						}
						
						//
						// default login page
						
						else
						{
							FBOOL freeFile = FALSE;
							//Path *base = PathNew( "resources" );
							//Path *base = PathNew( "resources/webclient/templates/login_prompt.html" );
							//Path *base = PathNew( "/webclient/templates/login_prompt.html" );
							//if( base != NULL )
							{
								//Path* completePath = PathJoin( base, "templates/login_prompt.html" );
								//if( completePath != NULL )
								{
									LocFile *file = LocFileNew( "resources/webclient/templates/login_prompt.html", FILE_READ_NOW | FILE_CACHEABLE );
									if( file != NULL )
									{
										freeFile = TRUE;

										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate("text/html") },
											{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
											{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
											{ TAG_DONE, TAG_DONE }
										};
		
										response = HttpNewSimple( HTTP_200_OK, tags );

										HttpSetContent( response, file->lf_Buffer, file->lf_FileSize );
						
										// write here and set data to NULL!!!!!
										// retusn response
										HttpWrite( response, sock );
										result = 200;
						
										//INFO("--------------------------------------------------------------%d\n", freeFile );
										if( freeFile == TRUE )
										{
											//ERROR("\n\n\n\nFREEEEEEFILE\n");
											LocFileDelete( file );
										}
										response->content = NULL;
										response->sizeOfContent = 0;
						
										response->h_WriteType = FREE_ONLY;
									}
								}
							}
						}
					}
					
					//
					// share file
					//
					
					else if( strcmp( path->parts[ 0 ], "sharedfile" ) == 0 )
					{
						FileShared *fs = NULL;
						char query[ 1024 ];
						int entries = 0;
						
						Log( FLOG_DEBUG, "[ProtocolHttp] Shared file hash %s name %s\n", path->parts[ 1 ], path->parts[ 2 ] );
						
						char dest[512];
						UrlDecode( dest, path->parts[2] );
						
						MYSQLLibrary *sqllib = SLIB->LibraryMYSQLGet( SLIB );
						
						if( sqllib != NULL )
						{
							sqllib->SNPrintF( sqllib, query, sizeof(query), " `Hash` = '%s' AND `Name` = '%s'", path->parts[ 1 ], dest );
							
							if( ( fs = sqllib->Load( sqllib, FileSharedTDesc, query, &entries ) ) != NULL )
							{
								// Immediately drop here..
								SLIB->LibraryMYSQLDrop( SLIB, sqllib );
								
								CacheFile *cf = NULL;
								
								char *mime = NULL;
							
								File *rootDev = GetUserDeviceByUserID( SLIB, sqllib, fs->fs_IDUser, fs->fs_DeviceName );
								
								DEBUG("[ProtocolHttp] Device taken from DB/Session , devicename %s\n", fs->fs_DeviceName );

								if( rootDev != NULL )
								{
									FHandler *actFS = (FHandler *)rootDev->f_FSys;
									int cacheState = CACHE_NOT_SUPPORTED;
									
									char *extension = GetExtension( fs->fs_Path );
									
									// Use the extension if possible
									if( strlen( extension ) )
									{
										mime = StringDuplicate( MimeFromExtension( extension ) );
									}
									else
									{
										mime = StringDuplicate( "application/octet-stream" );
									}
									
									//add mounting and reading files from FS
									struct TagItem tags[] = {
										{ HTTP_HEADER_CONTENT_TYPE, (FULONG)mime },
										{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
										{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
										{ TAG_DONE, TAG_DONE }
									};
									
									// 0 = filesystem do not provide modify timestamp
									time_t tim = actFS->GetChangeTimestamp( rootDev, fs->fs_Path );
									// there is no need to cache files which are stored on local disk
									if( tim == 0 ) //|| strcmp( actFS->GetPrefix(), "local" ) )
									{
										
									}
									else
									{
										cf = CacheUFManagerFileGet( SLIB->sl_CacheUFM, fs->fs_IDUser, rootDev->f_ID, fs->fs_Path );
										
										// if TRUE file must be reloaded
										if( cf != NULL )
										{
											cf->cf_ModificationTimestamp = tim;
											if( cf->cf_ModificationTimestamp != tim )
											{
												cacheState = CACHE_FILE_REQUIRE_REFRESH;		// we can use same pointer to file, but there is need to store it again
											}
											else
											{
												cacheState = CACHE_FILE_CAN_BE_USED;		// cache have last file, we can use it
											}
										}
										else
										{
											cacheState = CACHE_FILE_MUST_BE_CREATED;		// file do not exist in cache, we can create new one
										}
									}
									
									if( cacheState == CACHE_FILE_CAN_BE_USED )
									{
										response = HttpNewSimple( HTTP_200_OK, tags );
										
										HttpWrite( response, request->h_Socket );
										
										int dataread;

										cf->cf_Fp = fopen( cf->cf_StorePath, "rb" );
										if( cf->cf_Fp != NULL )
										{
											char *tbuffer = FMalloc( SHARING_BUFFER_SIZE );
											if( tbuffer != NULL )
											{
												while( !feof( cf->cf_Fp ) )
												{
													dataread = fread( tbuffer, 1, SHARING_BUFFER_SIZE, cf->cf_Fp );
													SocketWrite( request->h_Socket, tbuffer, dataread );
												}
												FFree( tbuffer );
											}
											fclose( cf->cf_Fp );
										}
										
										
										result = 200;

										HttpFree( response );
										response = NULL;
									}
									else
									{
										DEBUG("CACHE STATE: %d\n", cacheState );
										FILE *cffp = NULL;
										
										if( cacheState == CACHE_FILE_MUST_BE_CREATED )
										{
											cf = CacheFileNew( fs->fs_Path );
											cf->cf_Fp = fopen( cf->cf_StorePath, "wb" );
											cf->cf_ModificationTimestamp = tim;
											cf->cf_FileSize = 0;
											cffp = cf->cf_Fp;
										}
										else if( cacheState == CACHE_FILE_REQUIRE_REFRESH )
										{
											cf->cf_Fp = fopen( cf->cf_StorePath, "wb" );
											cf->cf_FileSize = 0;
											cffp = cf->cf_Fp;
										}
										
										
										// We need to get the sessionId if we can!
										// currently from table we read UserID
										User *tuser = UMGetUserByID( SLIB->sl_UM, fs->fs_IDUser );

										if( tuser != NULL )
										{
											char *sess = USMUserGetFirstActiveSessionID( SLIB->sl_USM, tuser );
											if( sess && rootDev->f_SessionID )
											{
												FFree( rootDev->f_SessionID );
												rootDev->f_SessionID = StringDuplicate( tuser->u_MainSessionID );
												DEBUG("[ProtocolHttp] Session %s tusr ptr %p\n", sess, tuser );
											}
										}
									
								
										if( actFS != NULL )
										{
											char *filePath = fs->fs_Path;
											unsigned int i;
									
											for( i = 0; i < strlen( fs->fs_Path ); i++ )
											{
												if( fs->fs_Path[i] == ':' )
												{
													filePath = &(fs->fs_Path[i+1]);
												}
											}
										
											DEBUG("[ProtocolHttp] File will be opened now %s\n", filePath );
									
											File *fp = ( File *)actFS->FileOpen( rootDev, filePath, "rs" );
											if( fp != NULL )
											{
												fp->f_Stream = request->h_Stream;
												fp->f_Socket = request->h_Socket;
												fp->f_WSocket =  request->h_WSocket;
												fp->f_Stream = TRUE;
		
												response = HttpNewSimple( HTTP_200_OK, tags );
											
												HttpWrite( response, request->h_Socket );

												int dataread;

												char *tbuffer = FMalloc( SHARING_BUFFER_SIZE );
												if( tbuffer != NULL )
												{
													while( ( dataread = actFS->FileRead( fp, tbuffer, SHARING_BUFFER_SIZE ) ) != -1 )
													{
														if( cffp != NULL )
														{
															DEBUG("Store %d\n", dataread );
															fwrite( tbuffer, 1, dataread, cffp );
															cf->cf_FileSize += dataread;
														}
													}
													FFree( tbuffer );
												}
						
												result = 200;

												HttpFree( response );
												response = NULL;
											
												actFS->FileClose( rootDev, fp );
											}
											else
											{
												result = 404;
												Log( FLOG_ERROR,"Cannot open file %s!\n", filePath );
											}
										}
										else
										{
											result = 404;
											Log( FLOG_ERROR,"Cannot find filesystem for device!\n");
										}
										
										if( cacheState == CACHE_FILE_MUST_BE_CREATED )
										{
											fclose( cf->cf_Fp );
											CacheUFManagerFilePut( SLIB->sl_CacheUFM, fs->fs_IDUser, rootDev->f_ID, cf );
										}
										else if( cacheState == CACHE_FILE_REQUIRE_REFRESH )
										{
											fclose( cf->cf_Fp );
										}
										
									} // cache support
									FFree( extension );
								}
								else
								{
									result = 404;
									Log( FLOG_ERROR,"Cannot get root device\n");
								}
								FileSharedDelete( fs );
							}
							else
							{
								SLIB->LibraryMYSQLDrop( SLIB, sqllib );
								result = 404;
								Log( FLOG_ERROR,"Fileshared entry not found in DB: sql %s\n", query );
							}
						}
					}
					
					//
					// We're calling on a static file.
					//
					
					else
					{
						UserSession *session = NULL;
						HashmapElement *tst = GetHEReq( request, "sessionid" );
						if( tst != NULL )
						{
							if( tst->data != NULL )
							{
								session = SLIB->sl_USM->usm_Sessions;
								while( session != NULL )
								{
									if(  strcmp( session->us_SessionID, (char *)tst->data ) == 0 )
									{
										break;
									}
									session = (UserSession *)session->node.mln_Succ;
								}
							}
						}
						UserLoggerStore( SLIB->sl_ULM, session, request->rawRequestPath, request->h_UserActionInfo );
						
						// Read the file
						
						unsigned int i = 0;
						int pos = -1;
						int flaw = 0;
						
						// Make sure we're not having an exploit here
						for( ; i < path->rawSize - 1; i++ )
						{
							if( path->raw[ i ] == '.' && path->raw[ i + 1 ] == '.' )
							{
								flaw = 1;
								break;
							}
						}
						// We don't allow directory traversals..
						if( flaw == 0 )
						{
							Log( FLOG_DEBUG, "[ProtocolHttp] read static file %s size %d\n", path->raw, path->rawSize );
						
							for( i = 0; i < path->rawSize; i++ )
							{
								if( path->raw[ i ] == ';' )
								{
									pos = i;
									break;
								}
							}

	#define MAX_FILES_TO_LOAD 256
						
							if( pos > 0 )
							{
								
								LocFile *file = CacheManagerFileGet( SLIB->cm, path->raw, TRUE );
								
								if( file != NULL )
								{
									char *extension = FCalloc( 7, sizeof( char ) );
									extension[ 3 ] = extension[ 4 ] = extension[ 5 ] = 0;
									int pos = 0;
									int max = 0;
									int ii = 0;
									
									for( ii = path->rawSize - 1; ii >= 0 ; ii-- )
									{
										if( path->raw[ ii ] == '.'  || max >= 5 )
										{
											pos = ii + 1;
											break;
										}
										max++;
									}
									
									for( ii = 0; ii < max; ii++ )
									{
										extension[ ii ] = path->raw[ pos++ ];
									}
									
									char *mime = StringDuplicate( MimeFromExtension( extension ) );
									
									FFree( extension );
									
									struct TagItem tags[] = {
										{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  mime },
										{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
										{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
										{ TAG_DONE, TAG_DONE }
									};
									
									response = HttpNewSimple( HTTP_200_OK, tags );
								
									HttpSetContent( response, file->lf_Buffer, file->lf_FileSize );
								
									// write here and set data to NULL!!!!!
									// return response
									HttpWrite( response, sock );
									result = 200;

									response->content = NULL;
									response->sizeOfContent = 0;
								
									response->h_WriteType = FREE_ONLY;
								}
								else // file not found in cache
									
								{
									char *multipath = NULL, *pathTable[ MAX_FILES_TO_LOAD ];
							
									memset( pathTable, 0, MAX_FILES_TO_LOAD );
									unsigned int pathSize = path->rawSize + 1;
							
									// split path 
							
									if( ( multipath = FCalloc( pathSize, sizeof( char ) ) ) != NULL )
									{
										memcpy( multipath, path->raw, pathSize );

										int entry = 0;
										pathTable[ entry ] = multipath;
								
										for( i = 0; i < pathSize; i++ )
										{
											if( multipath[ i ] == ';' )
											{
												multipath[ i ] = 0;
												pathTable[ ++entry ] = &(multipath[ i+1 ] );
											}
										}
								
										BufString *bs = BufStringNewSize( 10240 );
										if( bs != NULL )
										{
											int resError = 404, ce = 0, de = 0, dl = 0;
											unsigned int ent1 = entry + 1, err = 0;
									
											char *extension = FCalloc( 1, 16 );
											char *mime = NULL;
									
											for( i = 0; i < ent1; i++ )
											{
												// Don't allow directory traversal
												if( strstr( pathTable[ i ], ".." ) )
												{
													continue;
												}

												// Let's find the file extension
												dl = strlen( pathTable[i] );
												for( ce = 0, de = 0; ce < dl; ce++ )
												{
													if( pathTable[i][ce] == '.' )
													{ 
														de = 1;
													}
													else if( de > 0 )
													{
														extension[de++-1] = pathTable[i][ce];
													}
												}
											
												if( mime != NULL )
												{
													FFree( mime );
												}
												mime = StringDuplicate( MimeFromExtension( extension ) );

												err = ReadServerFile( request->uri, pathTable[ i ], bs, &result );
									
												if( result == 200 )
												{
													resError = 200;
												}
											}
									
											FFree( extension );
								
											if( resError == 200 )
											{
												struct TagItem tags[] = {
													{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( mime ) },
													{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
													{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "public, max-age=3600" ) },
													{ TAG_DONE, TAG_DONE }
												};
		
												response = HttpNewSimple( HTTP_200_OK, tags );

												HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
											
												LocFile* nlf = LocFileNewFromBuf( path->raw, bs );
												if( nlf != NULL )
												{
													DEBUG("[ProtocolHttp] File created %s size %d\n", nlf->lf_Path, nlf->lf_FileSize );
													
													if( CacheManagerFilePut( SLIB->cm, nlf ) != 0 )
													{
														LocFileDelete( nlf );
													}
												}

												bs->bs_Buffer = NULL;
									
												// write here and set data to NULL!!!!!
												// retusn response
												HttpWrite( response, sock );
									
												//BufStringDelete( bs );
									
												result = 200;
											}
											// error, cannot open any file
											else
											{
												Log( FLOG_ERROR,"File do not exist %s\n", path->raw);
							
												struct TagItem tags[] = {
													{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
													{TAG_DONE, TAG_DONE}
												};	
		
												response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
												result = 404;
											}
								
											FFree( mime );
											BufStringDelete( bs );
										}
										FFree( multipath );
									}
								}	// file not found in cache
							}
							else		// only one file
							{
								Path *base = PathNew( "resources" );
								Path* completePath = PathJoin( base, path );
								FBOOL freeFile = FALSE;
							
								if( completePath != NULL )
								{
									LocFile* file = NULL;
									
									if( pthread_mutex_lock( &SLIB->sl_ResourceMutex ) == 0 )
									{	
										char *decoded = UrlDecodeToMem( completePath->raw );
										if( SLIB->sl_CacheFiles == 1 )
										{
											
											Log( FLOG_DEBUG, "[ProtocolHttp] Read single file, first from cache %s\n", decoded );
											file = CacheManagerFileGet( SLIB->cm, decoded, FALSE );

											if( file == NULL )
											{
												// Don't allow directory traversal
												if( !strstr( decoded, ".." ) )
												{
													file = LocFileNew( decoded, FILE_READ_NOW | FILE_CACHEABLE );
												}
												
												if( file != NULL )
												{
													if( CacheManagerFilePut( SLIB->cm, file ) != 0 )
													{
														freeFile = TRUE;
													}
												}
											}
											else
											{
												struct stat attr;
												stat( decoded, &attr);
			
												// if file is new file, reload it
			
												//DEBUG1("\n\n\n\n\n SIZE %lld  stat %lld   NAME %s\n\n\n\n",attr.st_mtime ,file->info.st_mtime,completePath->raw );
												Log( FLOG_DEBUG, "[ProtocolHttp] File will be reloaded\n");
												if( attr.st_mtime != file->lf_Info.st_mtime )
												{
													LocFileReload( file, decoded );
												}
											}
										}
										else
										{
											// Don't allow directory traversal
											if( !strstr( decoded, ".." ) )
											{
												file = LocFileNew( decoded, FILE_READ_NOW | FILE_CACHEABLE );
											}
											freeFile = TRUE;
										}
										FFree( decoded );
										pthread_mutex_unlock( &SLIB->sl_ResourceMutex );
									}
									Log( FLOG_DEBUG, "[ProtocolHttp] Return file content\n");

									// Send reply
									if( file != NULL )
									{
										char* mime = NULL;
						
										if(  file->lf_Buffer == NULL )
										{
											Log( FLOG_ERROR,"File is empty %s\n", completePath->raw );
										}

										if( completePath->extension )
										{
											mime = StringDuplicate( MimeFromExtension( completePath->extension ) );
										}
										else
										{
											mime = StringDuplicate( "text/plain" );
										}
						
										struct TagItem tags[] = {
											{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  mime },
											{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
											{ HTTP_HEADER_CACHE_CONTROL, (FULONG )StringDuplicate( "max-age = 3600" ) },
											{ TAG_DONE, TAG_DONE }
										};
		
										response = HttpNewSimple( HTTP_200_OK, tags );
						
										HttpSetContent( response, file->lf_Buffer, file->lf_FileSize );
						
										// write here and set data to NULL!!!!!
										// return response
										HttpWrite( response, sock );
										result = 200;
						
										//INFO("--------------------------------------------------------------%d\n", freeFile );
										if( freeFile == TRUE )
										{
											LocFileDelete( file );
										}
										response->content = NULL;
										response->sizeOfContent = 0;
						
										response->h_WriteType = FREE_ONLY;
									
										Log( FLOG_DEBUG, "[ProtocolHttp] File returned to caller\n");
									}
									else
									{
										// First try to get tinyurl
										char *hash = path->parts[0];
										MYSQLLibrary *sqllib  = SLIB->LibraryMYSQLGet( SLIB );
										
										char url[ 2048 ]; 
										memset( url, '\0', 2048 );
										int hasUrl = 0;
										if( sqllib != NULL )
										{
											char qery[ 1024 ];
											sqllib->SNPrintF( sqllib, qery, sizeof(qery), "SELECT Source FROM FTinyUrl WHERE `Hash`=\"%s\"", hash ? hash : "-" );
											MYSQL_RES *res = sqllib->Query( sqllib, qery );
											if( res != NULL )
											{
												MYSQL_ROW row;
												if( ( row = sqllib->FetchRow( sqllib, res ) ) )
												{
													if( row[ 0 ] != NULL )
													{
														unsigned int len = strlen( row[ 0 ] ) + 1;
														if( len <= 2047 )
														{
															sprintf( url, "%.*s", len, row[ 0 ] );
															hasUrl = 1;
														}
													}
												}
												sqllib->FreeResult( sqllib, res );
											}
											SLIB->LibraryMYSQLDrop( SLIB, sqllib );
										}
										// We have tinyurl!
										if( hasUrl )
										{
											PathFree( path );
											PathFree( base );
											PathFree( completePath );
											
											UriFree( request->uri );
											request->uri = UriParse( url );
											if( request->uri->authority )
											{
												if( request->uri->authority->user )
													FFree( request->uri->authority->user );
												if( request->uri->authority->host )
													FFree( request->uri->authority->host );
												FFree( request->uri->authority );
											}
											if( request->uri->scheme )
											{
												FFree( request->uri->scheme );
											}
											request->uri->authority = NULL;
											request->uri->scheme = NULL;
											
											// Retry request with our new url
											goto partialRequest;
										}
										// No tiny url! Catch-all
										else
										{
										
											Log( FLOG_DEBUG, "[ProtocolHttp] File do not exist as real file, getting it via Modules\n");

											// Try to fall back on module
											// TODO: Make this behaviour configurable
											char *command = NULL;

											int clen = strlen( uri->path->raw ) + 256;

											if( ( command = FCalloc( clen, sizeof(char) ) ) != NULL )
											{
												snprintf( command, clen, "php \"php/catch_all.php\" \"%s\";", uri->path->raw ); 

												ListString *bs = RunPHPScript( command );

												if( bs && bs->ls_Data != NULL && bs->ls_Size > 0 )
												{
													// Check header and remove from data
													char *cntype = CheckEmbeddedHeaders( bs->ls_Data, bs->ls_Size, "Content-Type" );
													char *code = CheckEmbeddedHeaders( bs->ls_Data, bs->ls_Size, "Status Code" );

													if( cntype != NULL )
													{
														bs->ls_Size = StripEmbeddedHeaders( &bs->ls_Data, bs->ls_Size );
													}
													
													struct TagItem tags[] = {
														{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( cntype ? cntype : "text/html" ) },
														{ HTTP_HEADER_CONNECTION,   (FULONG)StringDuplicate( "close" ) },
														{ TAG_DONE, TAG_DONE }
													};

													if( code != NULL )
													{
														char *pEnd;
														int errCode = -1;
														
														char *next;
														errCode = strtol ( code, &next, 10);
														if( ( next == code ) || ( *next != '\0' ) ) 
														{
															errCode = -1;
														}
														
														if( errCode == -1 )
														{
															response = HttpNewSimple( HTTP_200_OK, tags );
														}
														else
														{
															response = HttpNewSimple( errCode, tags );
														}
													}
													else
													{
														response = HttpNewSimple( HTTP_200_OK, tags );
													}
													
													char *resp = bs->ls_Data;
													if( resp != NULL )
													{
														const char *hsearche = "---http-headers-end---\n";
														const int hsearchLene = 23;
														
														char *tmp = NULL;
														if( ( tmp = strstr( resp, hsearche ) ) != NULL )
														{
															resp = tmp + 23;
														}
													}
													
													HttpWrite( response, sock );
													
													response->content = NULL;
													response->sizeOfContent = 0;
													
													response->h_WriteType = FREE_ONLY;

													SocketWrite( sock, resp, (FQUAD)(bs->ls_Size - (resp - bs->ls_Data)) );
													//HttpSetContent( response, bs->ls_Data, bs->ls_Size );
													
													if( cntype != NULL ) FFree( cntype );
													if( code != NULL ) FFree( code );

													result = 200;

													//bs->ls_Data = NULL; 
													ListStringDelete( bs );
												}
												else 
												{
													Log( FLOG_ERROR,"File do not exist (PHPCall)\n");

													struct TagItem tags[] = {
														{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
														{ TAG_DONE, TAG_DONE }
													};	
		
													response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
													result = 404;
												}
												FFree( command );
											}
										}
									}
									PathFree( base );
									PathFree( completePath );
									Log( FLOG_DEBUG, "[ProtocolHttp] File delivered\n");
								}
								else
								{
									Log( FLOG_ERROR,"Cannot create completePath\n");
								}
							}		// one-many files read
						}
					}
				}
			} // else WEBDAV
		}

		
		HttpFreeRequest( request );
		
		// The response pointer might be -1 temporarily (because it might be
		// the result of immediate streaming that has no response). Set to null.
		
		if( response != NULL )
		{
			if( response != NULL && response->h_Stream == TRUE )
			{
				HttpFree( response );
				response = NULL;
			}
		}
		
		if( result != 101 )
		{
			sock->data = NULL;
		}
		PathFree( path );

		return response;
	}
	// Winter cleaning
	HttpFreeRequest( request );
	Log( FLOG_DEBUG, "HTTP parsed, returning response\n");
	return response;
}

