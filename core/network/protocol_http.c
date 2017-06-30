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
#include <system/handler/file.h>
#include <system/handler/device_handling.h>

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
	
	DEBUG("ReadServerFile path %s\n", locpath );
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
	
	//DEBUG("Readfiletemp multi%s\n", completePath->raw );
	
	FBOOL freeFile = FALSE;
	
	//DEBUG("Read file %s\n", completePath->raw );
					
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
				if( attr.st_mtime != file->info.st_mtime )
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
		if(  file->buffer == NULL )
		{
			Log( FLOG_ERROR,"File is empty %s\n", completePath->raw );
		}
		
		//DEBUG("File readed %d\n", file->bufferSize );
		
		// TODO: This shouldn't be needed by the way
		//       Make method to expand buffer size
		BufStringAddSize( dstbs, file->buffer, file->bufferSize );
		BufStringAdd( dstbs, "\n");

		if( freeFile == TRUE )
		{
			LocFileFree( file );
		}
		//DEBUG("File readed return 200\n");
		
		*result = 200;
	}
	else
	{
		//DEBUG( "[ReadServerFile] Going ahead with %s.\n", completePath->parts ? completePath->parts[0] : "No path part.." );
		
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
				INFO("File do not exist %s\n", locpath );

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
	Log( FLOG_DEBUG,"HTTP Callback called\n");
	
	if( length <= 0 )
	{
		Log( FLOG_DEBUG,"Message length<0 http400\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_400_BAD_REQUEST, tags );
	
		//HttpWriteAndFree( response );
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
	
	//DEBUG("Checking timeout, data %s\n", data );

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
	
	//INFO("\n\n\n\n\n\n==============================================\n\n\n\n");
	

	// Continue parsing the request
	int result = HttpParsePartialRequest( request, data, length );
	
	DEBUG("Parsepartial end %d\n", request->h_ContentType );
	
	partialRequest:
	
	//DEBUG("HTTPPARSEPARTIAL return %d on data size %d\n", result, length );
	// Protocol error
	if( result < 0 )
	{
		Log( FLOG_DEBUG, "RESULT < 0 http 400 will be returned\n");
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
		DEBUG( " <- (%d): Waiting for more data\n", sock->fd );
		HttpFreeRequest( request );
		return response;
	}
	// Request parsed without errors!
	else if( result == 1 && request->uri->path != NULL )
	{
		Log( FLOG_DEBUG, "Request parsed without errors\n");
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
			DEBUG("Want to parse path: %s (%d)\n", uri->path->raw, nlen );
			path = PathNew( uri->path->raw );
			if( path )
			{
				PathResolve( path );  // Resolve checks for "../"'s, and removes as many as it can.
			}
		}
		
		// Disallow proxy requests
		if( uri && ( uri->scheme || uri->authority ) )
		{
			DEBUG("Dissalow proxy\n");
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
				//DEBUG( "We have no path..\n" );
				struct TagItem tags[] = {
					{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{ TAG_DONE, TAG_DONE }
				};
		
				response = HttpNewSimple( HTTP_403_FORBIDDEN,  tags );
	
				result = 403;
			}
			else
			{
				//DEBUG( "We got through. %s\n", path->parts[ 0 ] );
				
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
						//DEBUG("systemlib found\n");
						//DEBUG("Calling systemlib\n");
					
						if( strcmp( path->parts[ 0 ], "system.library" ) == 0 )
						{
							DEBUG( "%s\n", path->parts[1] );
							DEBUG("------------------------------------------------------Calling SYSBASE via HTTP\n");
							response = SLIB->SysWebRequest( SLIB, &(path->parts[1]), &request, NULL );
						
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
							DEBUG("[PHPauthmod] call\n");
							FULONG res = 0;

							char command[ 1024 ];

							// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
							int cx = snprintf( command, sizeof(command), "php \"%s\" \"%s\" \"%s\" \"%s\";", "php/login.php", uri->path->raw, uri->queryRaw, request->content ); // SLIB->sl_ModuleNames
							if( !( cx >= 0 ) )
							{
								FERROR( "[PHPmod] snprintf\n" );;
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

										HttpSetContent( response, file->buffer, file->bufferSize );
						
										// write here and set data to NULL!!!!!
										// retusn response
										HttpWrite( response, sock );
										result = 200;
						
										//INFO("--------------------------------------------------------------%d\n", freeFile );
										if( freeFile == TRUE )
										{
											//ERROR("\n\n\n\nFREEEEEEFILE\n");
											LocFileFree( file );
										}
										response->content = NULL;
										response->sizeOfContent = 0;
						
										response->h_WriteType = FREE_ONLY;
									}
									//PathFree( completePath );
								}
								//PathFree( base );
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
						
						Log( FLOG_DEBUG, "Shared file hash %s name %s\n", path->parts[ 1 ], path->parts[ 2 ] );
						
						char dest[512];
						UrlDecode( dest, path->parts[2] );
						
						MYSQLLibrary *sqllib = SLIB->LibraryMYSQLGet( SLIB );
						
						if( sqllib != NULL )
						{
							//snprintf( query, 511, " `Hash` = '%s' AND `Name` = '%s'", path->parts[ 1 ], dest );
							sqllib->SNPrintF( sqllib, query, sizeof(query), " `Hash` = '%s' AND `Name` = '%s'", path->parts[ 1 ], dest );
							
							if( ( fs = sqllib->Load( sqllib, FileSharedTDesc, query, &entries ) ) != NULL )
							{
								// Immediately drop here..
								SLIB->LibraryMYSQLDrop( SLIB, sqllib );
								DEBUG("Shared file loaded from DB\n");
							
								char *mime = NULL;
							
								File *rootDev = GetUserDeviceByUserID( SLIB, sqllib, fs->fs_IDUser, fs->fs_DeviceName );
								
								DEBUG("Device taken from DB/Session , devicename %s\n", fs->fs_DeviceName );

								//DEBUG("ROOTDEV %p, UserID = %d\n", rootDev, fs->fs_IDUser );
								if( rootDev != NULL )
								{
									// We need to get the sessionId if we can!
									// currently from table we read UserID
									User *tuser = UMGetUserByID( SLIB->sl_UM, fs->fs_IDUser );

									if( tuser != NULL )
									{
										char *sess = USMUserGetActiveSessionID( SLIB->sl_USM, tuser );
										if( sess && rootDev->f_SessionID )
										{
											FFree( rootDev->f_SessionID );
											rootDev->f_SessionID = StringDuplicate( tuser->u_MainSessionID );
											DEBUG("Session %s tusr ptr %p\n", sess, tuser );
										}
									}
									// Done fetching sessionid =)
								
									FHandler *actFS = (FHandler *)rootDev->f_FSys;
									if( actFS != NULL )
									{
										//BufString *bs = BufStringNew();
										char *filePath = fs->fs_Path;
										unsigned int i;
									
										for( i = 0; i < strlen( fs->fs_Path ); i++ )
										{
											if( fs->fs_Path[i] == ':' )
											{
												filePath = &(fs->fs_Path[i+1]);
											}
										}
										
										DEBUG("File will be opened now %s\n", filePath );
									
										File *fp = ( File *)actFS->FileOpen( rootDev, filePath, "rs" );
										if( fp != NULL )
										{
											// Get extension
											char *reverse = FCalloc( 1, 16 ); // 16 characters extension!
											int cmode = 0, cz = 0;
											int len = strlen( fs->fs_Path ) - 1;
											for( cz = len; cz > 0 && cmode < 16; cz--, cmode++ )
											{
												if( fs->fs_Path[cz] == '.' )
												{
													break;
												}
												reverse[len-cz] = fs->fs_Path[cz];
											}
											len = strlen( reverse );
											char *extension = FCalloc( 1, len + 1 );
											for( cz = 0; cz < len; cz++ )
												extension[cz] = reverse[len-1-cz];
											free( reverse );
										
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
											
											fp->f_Stream = request->h_Stream;
											fp->f_Socket = request->h_Socket;
											fp->f_WSocket =  request->h_WSocket;
											fp->f_Stream = TRUE;
		
											response = HttpNewSimple( HTTP_200_OK, tags );
											
											DEBUG("Response set\n");
											
											HttpWrite( response, request->h_Socket );
										
											// Free the extension
											free( extension );
											
											int dataread;

											char tbuffer[ SHARING_BUFFER_SIZE ];
										
											while( ( dataread = actFS->FileRead( fp, tbuffer, SHARING_BUFFER_SIZE ) ) != -1 )
											{
												//BufStringAddSize( bs, tbuffer, dataread  );
											}
						
											//HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
										
											result = 200;
							
											// write here and set data to NULL!!!!!
											// retusn response
											//HttpWrite( response, sock );
											//bs->bs_Buffer = NULL;
										
											//BufStringDelete( bs );
										
											// Close it
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
								
									// Will free up memory (if not, bust!)
									/*
									int erra = 0;
									if( ( erra = actFS->UnMount( actFS, rootDev ) != 0 ) )
									{
										DEBUG( "UnMount, Here we are..\n" );
									}						
									else
									{
										DEBUG( "UnMount reported error: %d\n", erra );
									}*/
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
							Log( FLOG_DEBUG, "read static file %s size %d\n", path->raw, path->rawSize );
						
							for( i = 0; i < path->rawSize; i++ )
							{
								if( path->raw[ i ] == ';' )
								{
									pos = i;
									break;
								}
							}
						
							//DEBUG("Found ; in position %d\n",  pos );
						
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
								
									HttpSetContent( response, file->buffer, file->filesize );
								
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
										//DEBUG("Multiplepath\n");
								
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
								
										DEBUG("Found entries %d\n", entry );
								
										BufString *bs = BufStringNewSize( 1000 );
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
											
												DEBUG("FIND file %s\n", pathTable[ i ] );
									
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
									
												//DEBUG("Read file result %d\n", result );
									
												if( result == 200 )
												{
													resError = 200;
												}
											}
									
											FFree( extension );
								
											//DEBUG("ERROR: %d\n", resError );
								
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
													DEBUG("File created %s size %d\n", nlf->lf_Path, nlf->filesize );
													
													if( CacheManagerFilePut( SLIB->cm, nlf ) != 0 )
													{
														LocFileFree( nlf );
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
										//DEBUG("Before multipath free\n");
										FFree( multipath );
									}
								}	// file not found in cache
							}
							else		// only one file
							{
								Path *base = PathNew( "resources" );
								Path* completePath = PathJoin( base, path );
								FBOOL freeFile = FALSE;
							
								//DEBUG("Getting file %s\n", path->raw );
							
								if( completePath != NULL )
								{
									LocFile* file = NULL;
									
									if( pthread_mutex_lock( &SLIB->sl_ResourceMutex ) == 0 )
									{	
										char *decoded = UrlDecodeToMem( completePath->raw );
										if( SLIB->sl_CacheFiles == 1 )
										{
											
											Log( FLOG_DEBUG, "Read single file, first from cache %s\n", decoded );
											file = CacheManagerFileGet( SLIB->cm, decoded, FALSE );
											//DEBUG("Readfiletemp single%s    %p\n", completePath->raw, file );
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
												Log( FLOG_DEBUG, "File will be reloaded\n");
												if( attr.st_mtime != file->info.st_mtime )
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
									Log( FLOG_DEBUG, "Return file content\n");

									// Send reply
									if( file != NULL )
									{
										char* mime = NULL;
						
										if(  file->buffer == NULL )
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
						
										//DEBUG("Before returning data\n");
						
										HttpSetContent( response, file->buffer, file->bufferSize );
						
										// write here and set data to NULL!!!!!
										// retusn response
										HttpWrite( response, sock );
										result = 200;
						
										//INFO("--------------------------------------------------------------%d\n", freeFile );
										if( freeFile == TRUE )
										{
											//ERROR("\n\n\n\nFREEEEEEFILE\n");
											LocFileFree( file );
										}
										response->content = NULL;
										response->sizeOfContent = 0;
						
										response->h_WriteType = FREE_ONLY;
									
										Log( FLOG_DEBUG, "File returned to caller\n");
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
										
											Log( FLOG_DEBUG, "File do not exist as real file, getting it via Modules\n");
											//DEBUG( "[ProtocolHttp] Going ahead with %s.\n", path->parts ? path->parts[0] : "No path part.." );

											// Try to fall back on module
											// TODO: Make this behaviour configurable
											char *command = NULL;

											int clen = strlen( uri->path->raw ) + 256;

											if( ( command = FCalloc( clen, sizeof(char) ) ) != NULL )
											{
												snprintf( command, clen, "php \"php/catch_all.php\" \"%s\";", uri->path->raw ); 
												DEBUG( "[ProtocolHttp] Executing %s\n", command );

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
													
													//FERROR("CATCHALL\n\n\n\n\n\ncode %s\n\n\n", code );

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
														
														DEBUG("parsed %s code %d\n", code, errCode );
														
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

													SocketWrite( sock, resp, bs->ls_Size - (resp - bs->ls_Data) );
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
									Log( FLOG_DEBUG, "File delivered\n");
								}
								else
								{
									Log( FLOG_ERROR,"Cannot create completePath\n");
								}
							}		// one-many files read
							//DEBUG("Files delivered\n");
						}
					}
				}
			} // else WEBDAV
		}

		DEBUG("[ProtocolHttp] free requests\n");
		HttpFreeRequest( request );
		
		// The response pointer might be -1 temporarily (because it might be
		// the result of immediate streaming that has no response). Set to null.
		
		if( response != NULL )
		{
			DEBUG("Response pointer %p responseisstream %d\n", response != NULL, response->h_Stream );
		
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
		DEBUG("[ProtocolHttp] Return response\n");

		return response;
	}
	// Winter cleaning
	HttpFreeRequest( request );
	Log( FLOG_DEBUG, "HTTP parsed, returning response\n");
	return response;
}

