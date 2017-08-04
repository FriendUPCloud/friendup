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
/**
 *  @file fs_manager.c
 *  Filesystem Web handler
 *
 *  @author PS (Pawel Stefanski)
 *  @date created on 2016
 */

#include "fs_manager_web.h"
#include <system/fsys/device_handling.h>
#include <network/mime.h>
#include <util/md5.h>
#include <system/fsys/door_notification.h>
#include <stdlib.h>

/**
 * Filesystem web calls handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @param result pointer to integer where http error will be set
 * @return pointer to new Http structure (response) or NULL when error appear
 */
Http *FSMWebRequest( void *m, char **urlpath, Http *request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	char *path = NULL;
	char *originalPath = NULL;
	char *origDecodedPath = NULL;
	char *targetPath = NULL;
	FBOOL freeTargetPath = FALSE;
	FBOOL freePath = FALSE;
	
	INFO("[FSMWebRequest] FILE pointer %p  url %p  request %p session %p\n", m, urlpath, request, loggedSession );
	
	if( l->sl_ActiveAuthModule == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMWebRequest] User library is NULL!\n" );
		HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"authmodule is not opened!\"}" );
		goto done;
	}
	
	DEBUG2("[FSMWebRequest] -------------------------------------------------file func %s\n", urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMWebRequest] URL path is NULL!\n" );
		HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"second part of url is null!\"}" );
		
		goto done;
	}
	
	HashmapElement *el = HttpGetPOSTParameter( request, "path" );
	if( el == NULL ) el = HashmapGet( request->query, "path" );
	
	// Make sure we have a valid disk path!
	if( el != NULL )
	{
		path = (char *)el->data;
	}
	
	// Must have valid path
	if( path )
	{
		char *tmpPath = UrlDecodeToMem( path );
		if( tmpPath != NULL )
		{
			if( ColonPosition( tmpPath ) <= 0 )
			{
				path = NULL;
			}
			FFree( tmpPath );
		}
	}
	
	// Some commands take "files" instead of path
	if( !path )
	{
		HashmapElement *el = HttpGetPOSTParameter( request, "files" );
		if( el == NULL ) el = HashmapGet( request->query, "files" );
		if( el != NULL ) path = ( char *)el->data;
	}
	
	// Target (for upload f.ex.) Home:MyPath/myfile.zip
	el = HttpGetPOSTParameter( request, "target" );
	if( el == NULL ) el = HashmapGet( request->query, "target" );
	if( el != NULL ) targetPath = ( char *)el->data;
	
	// Urldecode target
	if( targetPath )
	{
		char *ntp = FCalloc( strlen( targetPath ) + 1, sizeof( char ) );
		UrlDecode( ntp, targetPath );
		targetPath = ntp;
		freeTargetPath = TRUE; // this one needs to be freed
	}
	
	if( path != NULL )
	{
		DEBUG( "[FSMWebRequest] Checking path: %s\n", path );
	}
	// Hogne, please use braces, this code will not work in release mode!!!
	
	
	if( strcmp( urlpath[ 1 ], "copy" ) == 0 )
	{
		el = HttpGetPOSTParameter( request, "from" );
		if( el == NULL ) el = HashmapGet( request->query, "from" );
		
		if( el != NULL )
		{
			path = (char *)el->data;
		}
	}
	
	if( path == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		//DEBUG("No session id or path %p %p\n", sessionid, path );
		HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Path is empty\"}" );
	}
	else
	{
		if( loggedSession->us_User == NULL )
		{
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"User not logged in\"}" );
			
			*result = 200;
			goto done;
		}
		
		DEBUG("[FSMWebRequest] Checking mounted devices\n");
		
		File *lDev = loggedSession->us_User->u_MountedDevs;
		
		File *actDev = NULL;
		char devname[ 256 ];
		memset( devname, '\0', sizeof(devname) );
		char *locpath = NULL;
		
		if( ( locpath = FCalloc( strlen( path ) + 10, sizeof(char) ) ) != NULL && ( originalPath = FCalloc( strlen( path ) + 10, sizeof(char) ) ) != NULL )
		{
			UrlDecode( locpath, path );
			DEBUG("[FSMWebRequest] original path %s\n", path );
			strcpy( originalPath, path );

			// Need a decoded one
			origDecodedPath = UrlDecodeToMem( originalPath );
			DEBUG("[FSMWebRequest] Decoded path %s\n", origDecodedPath );
			
			int dpos = ColonPosition( origDecodedPath );

			strncpy( devname, origDecodedPath, dpos );
			devname[ dpos ] = 0;
			
			DEBUG( "[FSMWebRequest] Device name '%s' Logguser name %s- path %s\n", devname, loggedSession->us_User->u_Name, path );

			path = locpath;
			freePath = 1;
		}
		// Should never happen
		else
		{
			if( locpath ) FFree( locpath ); locpath = NULL;
			if( originalPath ) FFree( originalPath ); originalPath = NULL;
		}
		//
		
		DEBUG( "[FSMWebRequest] Check if device is mounted for user\n" );
		
		// Special case! System reverts to mod calls
		FBOOL systemCalled = FALSE;
		if( strcmp( devname, "System" ) == 0 )
		{
			unsigned long resultLength = 0;
			char *lrequest = FCalloc( 512, sizeof(char) );
			char *returnData = NULL;
			
			if( lrequest != NULL )
			{
				snprintf( lrequest, 512, "module=system&command=systempath&sessionid=%s&path=%s", loggedSession->us_User->u_MainSessionID, path );
				
				returnData = l->RunMod( l, "php", "modules/system/module.php", lrequest, &resultLength );
				
				FFree( lrequest );
			}
			
			if( returnData != NULL )
			{
				//DEBUG("returnData != NULL resultLength %lu\n", resultLength );
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				
				HttpSetContent( response, returnData, resultLength );
				
				*result = 200;
			}
			else
			{
				FERROR("RunMod return null!\n");
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				
				HttpAddTextContent( response, "Runmodule return null" );
			}
			systemCalled = TRUE;
		}
		
		if( systemCalled == FALSE )
		{
			//
			// Check mounted devices for user
			DEBUG("[FSMWebRequest] Find device by name %s\n", devname );
			
			actDev = GetRootDeviceByName( loggedSession->us_User, devname );
			
			// TODO: Custom stuff (should probably be in the actual FS)

			if( actDev != NULL )
			{
				actDev->f_Operations++;
				
				if( ( locpath = FCalloc( strlen( path ) + 255, sizeof(char) ) ) != NULL )
				{
					UrlDecode( locpath, path );
					
					int dpos = ColonPosition( locpath );
					
					strcpy( path, &locpath[ dpos + 1 ] );
					
					DEBUG( "[FSMWebRequest] Get real path: \'%s\'\n", path );
					FFree( locpath );
					locpath = NULL;
				}
				
				//
				// checking file commands
				//
				
				DEBUG( "[FSMWebRequest] Checking 3rd part from path '%s' - path '%s'\n", urlpath[ 0 ], path );
				
				//
				// INFO
				//
				
				if( strcmp( urlpath[ 1 ], "info" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;

					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
					if( have == TRUE )
					{
						BufString *resp = actFS->Info( actDev, path );
						DEBUG("info command on FSYS: %s called\n", actFS->GetPrefix() );
					
						if( resp != NULL )
						{
							HttpAddTextContent( response, resp->bs_Buffer );
						
							BufStringDelete( resp );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Response was empty\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"No access to delete directory\"}" );
					}
				}
				//
				// Call a library
				//
				else if( strcmp( urlpath[ 1 ], "call" ) == 0 && request )
				{
					char *args = NULL;
					el = HttpGetPOSTParameter( request, "args" );
					if( el == NULL ) el = HashmapGet( request->query, "args" );
					if( el != NULL ) 
					{
						args = (char *)el->data;
					}
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "---E--" );
					if( have == TRUE )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						if( actFS != NULL )
						{
							DEBUG("[FSMWebRequest] Filesystem taken from file, doing call\n");
							BufString *resp = actFS->Call( actDev, path, args );
						
							if( resp != NULL )
							{
								HttpAddTextContent( response, resp->bs_Buffer );
							
								BufStringDelete( resp );
							}
							else
							{
								HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Response was empty\"}" );
							}
						} // actFS = NULL
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Filesystem not found\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"No access to delete directory\"}" );
					}
				}
				
				//
				// DIR
				//
				else if( strcmp( urlpath[ 1 ], "dir" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					DEBUG( "[FSMWebRequest] Filesystem taken from file, doing dir on %s\n", path );
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
					if( have == TRUE )
					{
						FBOOL details = FALSE;
						el = HttpGetPOSTParameter( request, "details" );
						if( el == NULL ) el = HashmapGet( request->query, "details" );
						if( el != NULL ) 
						{
							if( (char *)el->data != NULL )
							{
								if( strcmp( (char *)el->data, "true" ) == 0 )
								{
									details = TRUE;
								}
							}
						}
						
						BufString *resp = actFS->Dir( actDev, path );

						if( resp != NULL)
						{
							if( resp->bs_Size > 0 )
							{
								if( details == TRUE )
								{
									resp = FSManagerAddPermissionsToDir( l->sl_FSM, resp, actDev->f_ID, loggedSession->us_User );
								}

								HttpSetContent( response, resp->bs_Buffer, resp->bs_Size );
								//DEBUG("DIR set response to: %s\n", resp->bs_Buffer );
								resp->bs_Buffer = NULL;
							}
							else
							{
								HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Response was empty\"}" );
							}
							BufStringDelete( resp );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Response was empty\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"No access to delete directory\"}" );
					}
					
					//
					// Rename
					//
					
				}
				else if( strcmp( urlpath[ 1 ], "rename" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					char *nname = NULL;
					el = HttpGetPOSTParameter( request, "newname" );
					if( el == NULL ) el = HashmapGet( request->query, "newname" );
					if( el != NULL )
					{
						nname = (char *)el->data;
					}
					
					if( nname != NULL )
					{
						char tmpname[ 512 ];
						UrlDecode( tmpname, nname );
						
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("[FSMWebRequest] Filesystem RENAME\n");
						
						char tmp[ 128 ];
						
						FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "--W---" );
						if( have == TRUE )
						{
							int error = actFS->Rename( actDev, path, tmpname );
							sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
						
							DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
						}
						else
						{
							strcpy( tmp, "fail<!--separate-->{ \"response\": \"No write access to folder\"}" );
						}
						
						DEBUG("[FSMWebRequest] info command on FSYS: %s RENAME\n", actFS->GetPrefix() );
						
						HttpAddTextContent( response, tmp );
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"nname parameter is missing\" }" );
					}
					
					//
					// Delete
					//
					
				}
				else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					DEBUG("[FSMWebRequest] Filesystem DELETE\n");
					
					char tmp[ 128 ];
					
					FBOOL have = TRUE;
					
					if( request->h_RequestSource == HTTP_SOURCE_FC && l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User )
					{
						have = FALSE;
					}
					else
					{
						have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "----D-" );
					}
					
					if( have == TRUE )
					{
						int error = actFS->Delete( actDev, path );
						if( error == 0 )
						{
							sprintf( tmp, "ok<!--separate-->{\"response\":\"%d\"}", error );
							DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
						}
						else
						{
							sprintf( tmp, "fail<!--separate-->{\"response\":\"%d\"}", error );
						}
						DEBUG("[FSMWebRequest] info command on FSYS: %s DELETE\n", actFS->GetPrefix() );
					}
					else
					{
						strcpy( tmp, "fail<!--separate-->{\"response\":\"No access to delete file/directory\"}" );
					}
						
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						 HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					HttpAddTextContent( response, tmp );
				}
				
				//
				// MakeDir
				//
				else if( strcmp( urlpath[ 1 ], "makedir" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					DEBUG("[FSMWebRequest] Filesystem MAKEDIR: %s\n", path );
					
					char tmp[ 100 ];
					
					char *lpath = UrlDecodeToMem( path );
					if( lpath != NULL )
					{
						FBOOL have = TRUE;
						
						if( request->h_RequestSource == HTTP_SOURCE_FC && l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User )
						{
							have = FALSE;
						}
						else
						{
							have = FSManagerCheckAccess( l->sl_FSM, lpath, actDev->f_ID, loggedSession->us_User, "--W---" );
						}
						
						if( have == TRUE )
						{
							int error = actFS->MakeDir( actDev, lpath );
						
							if( error != 1 )
							{
								sprintf( tmp, "fail<!--separate-->{ \"response\": \"%d\" }", error );
							}
							else
							{
								/*
								// Create parent path
								int w = strlen( path );
								char *parentPath = FCalloc( w + 1, sizeof( char ) );
								for( ; w > 0; w-- )
								{
									if( ( path[w] == '/' || path[w] == ':' ) )
									{
										memcpy( parentPath, path, w );
										break;
									}
								}*/
							
								sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
								DEBUG( "[FSMWebRequest] /Makedir] Notifying %s  pointer to SB %p\n", path, l );
								DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
								
								//FFree( parentPath );
							}
							HttpAddTextContent( response, tmp );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to directory\" }" );
						}
						FFree( lpath );
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot allocate memory for path\" }" );
					}
				}
				//
				// Execute
				//
				else if( strcmp( urlpath[ 1 ], "exec" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "---E--" );
					if( have == TRUE )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						DEBUG("[FSMWebRequest] Filesystem EXEC\n");
						char *resp = (char *)actFS->Execute( actDev, path, NULL, NULL );	// last parameter is arguments
					
						if( resp != NULL )
						{
							HttpAddTextContent( response, resp );
						
							FFree( resp );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Response was empty\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to directory\" }" );
					}
				}
				
				//
				// file read
				//
				
				else if( strcmp( urlpath[ 1 ], "read" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					
					char *mode = NULL;
					char *offset = NULL;
					char *bytes = NULL;
					char *fallbackMime = NULL;
					FBOOL returnStreamOnly =  FALSE;
					FBOOL downloadMode  = FALSE;
					
					fallbackMime = GetMIMEByFilename( path );
					
					DEBUG("[FSMWebRequest] Filesystem taken from file mime %s\n", fallbackMime );
					
					el = HttpGetPOSTParameter( request, "mode" );
					if( el == NULL ) el = HashmapGet( request->query, "mode" );
					if( el != NULL )
					{
						mode = (char *)el->data;
					}
					
					el = HttpGetPOSTParameter( request, "offset" );
					if( el == NULL ) el = HashmapGet( request->query, "offset" );
					if( el != NULL )
					{
						offset = (char *)el->data;
					}
					
					el = HttpGetPOSTParameter( request, "bytes" );
					if( el == NULL ) el = HashmapGet( request->query, "bytes" );
					if( el != NULL )
					{
						bytes = (char *)el->data;
					}
					
					el = HttpGetPOSTParameter( request, "download" );
					if( el == NULL ) el = HashmapGet( request->query, "download" );
					if( el != NULL )
					{
						int val = 0;
						val = atoi( el->data );
						if( val == 1 )
						{
							downloadMode = TRUE;
						}
					}
					
					if( downloadMode == TRUE )
					{
						char temp[ 512 ];
						unsigned int i, namepos = 0;
						unsigned int slen = strlen( path );
						for( i = 0; i < slen; i++ )
						{
							if( path[ i ] == '/' )
							{
								namepos = i + 1;
							}
						}
						
						snprintf( temp, sizeof( temp ), "attachment; filename=%s", &path[ namepos ] );
						
						response = HttpNewSimpleA( HTTP_200_OK, request,  
												   HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "application/octet-stream" ),
												   HTTP_HEADER_CONTENT_DISPOSITION, (FULONG)StringDuplicate( temp ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
												   TAG_DONE, TAG_DONE );
					}
					else
					{
						response = HttpNewSimpleA( HTTP_200_OK, request,  
												   HTTP_HEADER_CONTENT_TYPE, (FULONG)( fallbackMime ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
												   TAG_DONE, TAG_DONE );
					}
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
					if( have == TRUE )
					{
						if( mode != NULL && strcmp( mode, "rs" ) == 0 )		// read stream
						{ 
							File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
							// Success?
							if( fp != NULL )
							{
								int dataread = 0;
							
								response->h_RequestSource = request->h_RequestSource;
								response->h_Stream = TRUE;
								response->h_ResponseID = request->h_ResponseID;
								HttpWrite( response, request->h_Socket );
							
								fp->f_Stream = request->h_Stream;
								fp->f_Socket = request->h_Socket;
								fp->f_WSocket =  request->h_WSocket;
							
								#define FS_READ_BUFFER 262144
								int readbytes = 0;// FS_READ_BUFFER;
								char *dataBuffer = FCalloc( FS_READ_BUFFER + 1, sizeof( char ) ); 
							
								if( dataBuffer != NULL )
								{
									dataBuffer[ FS_READ_BUFFER ] = 0;
								
									fp->f_Stream = TRUE;
								
									while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
									{
										if( request->h_ShutdownPtr != NULL && *(request->h_ShutdownPtr) == TRUE )
										{
											break;
										}
										
										if( dataread == 0 )
										{
											continue;
										}
										readbytes += dataread;
									}	// end of reading part or whole file
									FFree( dataBuffer );
								}
								actFS->FileClose( actDev, fp );
							}
							else
							{
								HttpFree( response );
								response = NULL;
							
								response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
									HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
							
								HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"cannot open file for reading\"}" );
							}
						}
					
						//
						// read only part of file
						//
					
						else if( mode != NULL && mode[0] == 'r' )
						{
							DEBUG( "[FSMWebRequest] Reading path: %s\n", path );
							File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
							// Success?
							if( fp != NULL )
							{
								int dataread = 0;
							
								//struct stringPart *head = NULL;
								//struct stringPart *curr = NULL;
							
								fp->f_Raw = 0;
								if( strcmp( mode, "rb" ) == 0 )
								{
									fp->f_Raw = 1;
								}
							
								//we want to read only part of data
#define FS_READ_BUFFER 262144

								int totalBytes = 0;
								
								ListString *ls = ListStringNew();
							
								if( offset != NULL && bytes != NULL )
								{
									int offsetint = atoi( offset );
									int bytesint = atoi( bytes );
								
									if( actFS->FileSeek( fp, offsetint ) != -1 )
									{
										int readbytes = FS_READ_BUFFER;
										if( bytesint < readbytes )
										{
											readbytes = bytesint;
										}
									
										char *dataBuffer = FCalloc( readbytes, sizeof( char ) );
									
										while( ( dataread = actFS->FileRead( fp, dataBuffer, readbytes ) ) != -1 )
										{
											if( request->h_ShutdownPtr != NULL && *(request->h_ShutdownPtr) == TRUE )
											{
												break;
											}
											
											if( dataread == 0 )
											{
												continue;
											}
										
											ListStringAdd( ls, dataBuffer, dataread );
										
											// Make sure we only read as much as we need
											bytesint -= dataread;
											if( bytesint > 0 ) 
											{
												break;
											}
											if( bytesint < readbytes )
											{
												readbytes = bytesint;
											}
											totalBytes += readbytes;
										}
										
										if( dataBuffer )
										{
											FFree( dataBuffer );
										}
									}
								}
							
								//
								// we want to read whole file
								//
							
								else 
								{
									int readbytes = FS_READ_BUFFER;
									char *dataBuffer = FCalloc( readbytes, sizeof( char ) ); 
								
									while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
									{
										if( request->h_ShutdownPtr != NULL && *(request->h_ShutdownPtr) == TRUE )
										{
											break;
										}
										
										if( dataread == 0 )
										{
											continue;
										}
									
										ListStringAdd( ls, dataBuffer, dataread );
										totalBytes += dataread;
									}
									
									if( dataBuffer )
									{
										FFree( dataBuffer );
									}
								}	// end of reading part or whole file
							
								// Close the file
								actFS->FileClose( actDev, fp );
							
								if( ls->ls_Size > 0 && totalBytes > 0 )
								{
									// Combine all parts into one buffer
									
									ListStringJoin( ls );
									
									char *finalBuffer = ls->ls_Data;
									ls->ls_Data = NULL;
									char *outputBuf = finalBuffer;
									
									int offBuf = 0;
								
									// Try to skip embedded headers
									char *ptr = strstr( finalBuffer, "---http-headers-end---\n" );
									if( ptr != NULL )
									{
										// With the diff, move offset and set correct size
										int diff = ( ptr - finalBuffer ) + 23;
										totalBytes = (int)( ( (FULONG)finalBuffer) - diff) + 1;
										outputBuf = FCalloc( totalBytes, sizeof( char ) );
										memcpy( outputBuf, ptr + 23, totalBytes );
										FFree( finalBuffer );
									}
								
								/*
								 *								// Correct mime from data
								 *								const char *mime = NULL;
								 *								char *fallbackMime = NULL;
								 *								
								 *								
								 *								if( l->sl_Magic != NULL && outputBuf != NULL )
								 *								{
								 *									//INFO("FILE READ BYTE %c %c %c %c\n", outputBuf[ 0 ], outputBuf[ 1 ], outputBuf[ 2 ], outputBuf[ 3 ] );
								 *									int bytes = totalBytes;
								 # *define MAGIC_SIZE (1024*6)
								 
								 if( bytes > MAGIC_SIZE ){ bytes = MAGIC_SIZE; }
								 mime = magic_buffer( l->sl_Magic, outputBuf, bytes );

								 //FERROR("\n\n\n\n\n\n\nHELLO\n");
							}
							// Just in case!
							if( mime == NULL )
							{
							fallbackMime = getMIMEByFilename( path );
							}
							
							INFO("READ RETURN BYTES %d  - %s\n", totalBytes, mime );
							*/
									HttpSetContent( response, outputBuf, totalBytes );
								}
								else
								{
									HttpFree( response );
									response = NULL;
								
									response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
										HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
								
									//
									HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot allocate memory for file.\" }" );
								}
								
								ListStringDelete( ls );
							}
							else
							{
								HttpFree( response );
								response = NULL;
							
								response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
									HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
							
								HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"nCannot open file\" }" );
							}
							DEBUG("[FSMWebRequest] Open command on FSYS: %s called\n", actFS->GetPrefix() );
						}
						else
						{
							HttpFree( response );
							response = NULL;
						
							response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
						
							HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"mode parameter is missing\" }" );
						}
					}
					else
					{
						HttpFree( response );
						response = NULL;
						
						response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
						
						HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to directory\" }" );
					}
				}
				
				//
				// file write
				//
				
				else if( strcmp( urlpath[ 1 ], "write" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					char *mode = NULL;
					char *fdata = NULL;
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					el = HashmapGet( request->parsedPostContent, "mode" );
					if( el == NULL ) el = HashmapGet( request->query, "mode" );
					if( el != NULL )
					{
						mode = (char *)el->data;
					}
					
					el =  HashmapGet( request->parsedPostContent, "data" );
					if( el == NULL ) el = HashmapGet( request->query, "data" );
					if( el != NULL )
					{
						fdata = (char *)el->data;
					}
					
					// Urldecode if need 
					el = HashmapGet( request->parsedPostContent, "encoding" );
					int flength = 0;
					if( !el ) el = HashmapGet( request->query, "encoding" );
					if( el && strcmp( el->data, "url" ) == 0 && fdata != NULL )
					{
						char *destf = FCalloc( strlen( fdata ) + 1, sizeof( char ) );
						int l = UrlDecode( destf, fdata );
						memset( fdata, 0, strlen( fdata ) );
						sprintf( fdata, "%s", destf );
						FFree( destf );
					}
					// TODO: Test UNSTABLE CODE
					/*// Base64 instead
					else if( el && strcmp( el->data, "base64" ) == 0 )
					{
					fdata = Base64Decode( fdata, strlen( fdata ), &flength );
				}
				int dataSize = flength > 0 ? flength : strlen( fdata );
				*/
					
					if( mode != NULL && fdata != NULL )
					{
						FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "--W---" );
						if( have == TRUE )
						{
							int dataSize = strlen( fdata );

							File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
							if( fp != NULL )
							{
								int size = actFS->FileWrite( fp, fdata, dataSize );
								if( size > 0 )
								{
									char tmp[ 128 ];
									sprintf( tmp, "ok<!--separate-->{ \"FileDataStored\" : \"%d\" } ", size );
									HttpAddTextContent( response, tmp );
								}
								else
								{
									HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot allocate memory for File\" }" );
								}
								actFS->FileClose( actDev, fp );
							
								DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
							}
							else
							{
								HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"Cannot open file\" }" );
							}
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to file\" }" );
						}
					}
					else
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"response\": \"nmode parameter is missing\" }" );
					}
				}
				
				//
				// copy
				//
				
				else if( strcmp( urlpath[ 1 ], "copy" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					char *topath = NULL;
					el = HashmapGet( request->parsedPostContent, "to" );
					if( el == NULL ) el = HashmapGet( request->query, "to" );
					if( el != NULL )
					{
						topath = (char *)el->data;
						
						char *tpath;
						if( ( tpath = FCalloc( strlen( topath ) + 10 + 256, sizeof(char) ) ) != NULL )
						{
							UrlDecode( tpath, topath );
							strcpy( topath, tpath );
							FFree( tpath );
						}

						FHandler *dsthand;
						char *srcpath, *dstpath;
						
						File *copyFile;
						
						//srchand = GetHandlerByPath( dbusr, &dstpath, path );
						File *dstrootf = GetFileByPath( loggedSession->us_User, &dstpath, topath );
						
						DEBUG("[FSMWebRequest] COPY from %s TO %s\n", path, topath );
						
						if( dstrootf != NULL )
						{
							FBOOL havesrc = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
							
							if( havesrc == TRUE )
							{
								FBOOL havedst = FSManagerCheckAccess( l->sl_FSM, dstpath, actDev->f_ID, loggedSession->us_User, "--W---" );
								if( havedst == TRUE )
								{
									dstrootf->f_Operations++;
							
									dsthand = dstrootf->f_FSys;
									FHandler *actFS = (FHandler *)actDev->f_FSys;
									int rsize = 0;
							
									if( dstpath[ strlen( dstpath ) - 1 ] != '/' )	// simple copy file
									{
										int written = 0;
										File *rfp = (File *)actFS->FileOpen( actDev, path, "rb" );
										File *wfp = (File *)dsthand->FileOpen( dstrootf, dstpath, "w+" );
										if( rfp != NULL && wfp != NULL )
										{
											// Using a big buffer!
											char *dataBuffer = FCalloc( 524288, sizeof(char) );
											if( dataBuffer != NULL )
											{
												DEBUG("[FSMWebRequest] file/copy - files opened, copy in progress\n");
										
												int dataread = 0, written = 0;

												while( ( dataread = actFS->FileRead( rfp, dataBuffer, 524288 ) ) > 0 )
												{
													if( request->h_ShutdownPtr != NULL &&  *(request->h_ShutdownPtr) == TRUE )
													{
														break;
													}
													if( dataread > 0 )
													{
														written += dsthand->FileWrite( wfp, dataBuffer, dataread );
													}
												}
												FFree( dataBuffer );
											}
											DEBUG( "[FSMWebRequest] Wrote %d bytes.\n", written );
										}
										else
										{
											DEBUG( "[FSMWebRequest] We could not do anything with the bad file pointers..\n" );
										}
										if( rfp )
										{
											actFS->FileClose( actDev, rfp );
										}
										if( wfp )
										{
											dsthand->FileClose( dstrootf, wfp );
										}
								
										char tmp[ 128 ];
										sprintf( tmp, "ok<!--separate-->{ \"response\": \"0\", \"Written\": \"%d\"}", written );

										HttpAddTextContent( response, tmp );
									}
									else		// make directory
									{
										FHandler *dsthand = (FHandler *)dstrootf->f_FSys;

										char tmp[ 128 ];
								
										// cutting device name
										unsigned int i;
										for( i=0 ; i < strlen(topath ); i++ )
										{
											if( topath[ i ] == '/' )
											{
												topath += i+1;
												break;
											}
										}
								
										int error = dsthand->MakeDir( dstrootf, topath );
										sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
								
										HttpAddTextContent( response, tmp );
									}
							
									dstrootf->f_Operations--;
								}
								else
								{
									HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to destination\" }" );
								}
							}
							else
							{
								HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"No access to source\" }" );
							}
						}
					}
				}	// file copy
				
				//
				// file upload
				//
				
				else if( strcmp( urlpath[ 1 ], "upload" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					response = HttpNewSimpleA(
						HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
						TAG_DONE, TAG_DONE 
					);
					
					INFO("[FSMWebRequest] Uploading file\n");
					int uploadedFiles = 0;
					char *tmpPath;
					if( path == NULL )
					{
						FERROR( "PATH == NULL\n" );
					}
					
					if( ( tmpPath = (char *) FCalloc( strlen(path) + 2048, sizeof(char) ) ) != NULL )
					{
						HttpFile *file = request->h_FileList;
						
						// Mind situations where hf_FileName is uploaded filename, where
						// path has target filename built in..
						FBOOL fileNameIsTmpPath = FALSE;
						if( file->hf_FileName && strlen( file->hf_FileName ) > 5 )
						{
							char *tmpF = FCalloc( 1, 6 );
							sprintf( tmpF, "%.*s", 5, file->hf_FileName );
							fileNameIsTmpPath = strcmp( tmpF, "/tmp/" ) == 0 ? TRUE : FALSE;
							FFree( tmpF );
						}
						
						while( file != NULL )
						{
							if( targetPath )
							{
								sprintf( tmpPath, "%s", targetPath );
							}
							else if( !fileNameIsTmpPath )
							{
								sprintf( tmpPath, "%s%s", path, file->hf_FileName );
							}
							else
							{
								sprintf( tmpPath, "%s", path );
							}
							
							char *dstPath  = tmpPath;
							int dpos = ColonPosition( tmpPath );
							if( dpos ==  0 )
							{
								dstPath =  tmpPath;
							}
							else
							{
								dstPath =  &tmpPath[ dpos + 1 ] ;
							}
							
							DEBUG( "[FSMWebRequest] Trying to save file %s (path: %s, devname: %s)\n", dstPath, path, devname );
							
							FBOOL have = FSManagerCheckAccess( l->sl_FSM, tmpPath, actDev->f_ID, loggedSession->us_User, "--W---" );
							if( have == TRUE )
							{
								File *fp = (File *)actFS->FileOpen( actDev, tmpPath, "wb" );
								if( fp != NULL )
								{
									actFS->FileWrite( fp, file->hf_Data, file->hf_FileSize );
									actFS->FileClose( actDev, fp );
								
									uploadedFiles++;
								}
								else
								{
									FERROR("Cannot open file to store %s\n", path );
								}
							}
							else
							{
								FERROR("No access to: %s\n", tmpPath );
							}
							
							pthread_yield(); // Let's yield a little
							
							file = (HttpFile *) file->node.mln_Succ;
						} // while, goging through files
						
						FFree( tmpPath );
					}
					else
					{
						FERROR("Cannot allocate memory for path buffer\n");
					}
					
					{
						char tmp[ 1024 ];
						
						sprintf( tmp, "ok<!--separate-->{ \"Uploaded files\": \"%d\"}", uploadedFiles );
						
						HttpAddTextContent( response, tmp );
						*result = 200;
					}
					
					DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
					
					DEBUG("[FSMWebRequest] Upload done\n");
				}		// file/upload
				
				//
				// file sharing
				//
				
				#define SHARING_BUFFER_SIZE 10240
				
				else if( strcmp( urlpath[ 1 ], "expose" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					char tbuffer[ SHARING_BUFFER_SIZE ];
					char userid[ 512 ];
					char name[ 256 ];
					char dstfield[10];
					
					strcpy( dstfield, "Public" );
					
					{
						int i = strlen( path );
						//struct time_t t;
						//int r;
						
						//gettime(&t);
						//r = t.ti_sec % 0xefffffff;
						//r = rand() % 0xefffffff;
						
						for( ; i >= 0 ; i-- )
						{
							if( path[ i ] == '/' )
							{
								
								break;
							}
						}
						i++;
						
						sprintf( userid, "%ld", loggedSession->us_User->u_ID );
						sprintf( name, "%s", &path[ i ] );
					}
					
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					FBOOL sharedFile = FALSE;
					FBOOL alreadyExist = FALSE;
					
					//HashmapElement *el = HttpGetPOSTParameter( request, "path" );
					//if( el == NULL ) el = HashmapGet( request->query, "path" );
					
					char fortestpurp[ 2048 ];
					sprintf( fortestpurp, "%s:%s", devname, path );
					
					FileShared *tmpfs = FileSharedNew( fortestpurp, name );
					char hashmap[ 512 ];
					
					if( tmpfs != NULL )
					{
						tmpfs->fs_IDUser = loggedSession->us_User->u_ID;
						
						//tmpfs->fs_Name = name;
						tmpfs->fs_DeviceName = StringDuplicate( devname );
						
						//tmpfs->fs_Path = fortestpurp;// path;
						tmpfs->fs_DstUsers = StringDuplicate( dstfield );
						
						// Make a unique hash
						char tmp[512];
						sprintf( tmp, "%s%d%d%d", path, rand() % 999, rand() % 999, rand() % 999 );
						StrToMD5Str( hashmap, 512, tmp, strlen( tmp ) );
						tmpfs->fs_Hash = StringDuplicate( hashmap );
						
						char check[ 2048 ];
						char dest[512]; UrlDecode( dest, path );
						// TODO: Check on device ID..
						sprintf( check, " FFileShared where `UserID`='%ld' AND `Path`='%s:%s'", loggedSession->us_User->u_ID, devname, dest );
						
						MYSQLLibrary *sqllib = l->LibraryMYSQLGet( l );
						tmpfs->fs_CreatedTime = time( NULL );
						if( sqllib != NULL )
						{
							int numR = sqllib->NumberOfRecords( sqllib, FileSharedTDesc, check );
							DEBUG( "[FSMWebRequest] Number of records is: %d (%s)\n", numR, check );
						
							struct tm* ti;
							ti = localtime( &(tmpfs->fs_CreatedTime) );
							tmpfs->fs_CreateTimeTM.tm_year = ti->tm_year + 1900;
							tmpfs->fs_CreateTimeTM.tm_mon = ti->tm_mon;
							tmpfs->fs_CreateTimeTM.tm_mday = ti->tm_mday;
							
							tmpfs->fs_CreateTimeTM.tm_hour = ti->tm_hour;
							tmpfs->fs_CreateTimeTM.tm_min = ti->tm_min;
							tmpfs->fs_CreateTimeTM.tm_sec = ti->tm_sec;
							
							{
								if( sqllib->Save( sqllib, FileSharedTDesc, tmpfs ) == 0 )
								{
									sharedFile = TRUE;
								}
							}
						
						/*
						 *						else
						 *						{
						 *							FileSharedDelete( tmpfs );
						 *							
						 *							int entries = 0;
						 *							if( ( tmpfs = sqllib->Load( sqllib, FileSharedTDesc, check, &entries ) ) )
						 *							{
						 *								sprintf( hashmap, "%s", tmpfs->fs_Hash );
					}
					alreadyExist = TRUE;
					}*/
						
							l->LibraryMYSQLDrop( l, sqllib );
						}
						
						FileSharedDeleteAll( tmpfs );
					}
					else
					{
						FERROR("Cannot allocate memory for shared file!\n");
					}
					
					{
						int size = 0;
						char *tmp = FCalloc( 2048, sizeof(char) );
						if( sharedFile == TRUE )
						{
							size = snprintf( tmp, 2048, "ok<!--separate-->{\"hash\":\"%s\", \"name\":\"%s\" }", hashmap, name );
						}
						else if( alreadyExist )
						{
							size = snprintf( tmp, 2048, "ok<!--separate-->{\"hash\":\"%s\", \"name\":\"%s\" }", hashmap, name );
						}
						else
						{
							size = snprintf( tmp, 2048, "fail<!--separate-->{ \"response\": \"Cannot share file\" }" );
						}
						
						HttpSetContent( response, tmp, size );
						*result = 200;
					}
				}
				
				//
				// file unsharing
				//
				
				else if( strcmp( urlpath[ 1 ], "conceal" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					
					if( sqllib != NULL )
					{
						char where[ 1024 ];
						
						snprintf( where, sizeof(where), " Path = '%s:%s' AND UserID = %ld", devname, path, loggedSession->us_User->u_ID );
						
						sqllib->DeleteWhere( sqllib, FileSharedTDesc, where );
						
						{
							char tmp[ 1024 ];
							sprintf( tmp, "ok<!--separate-->{\"response\":\"\" }" );
							HttpAddTextContent( response, tmp );
						}
						
						*result = 200;
						
						l->LibraryMYSQLDrop( l, sqllib );
					}
				}
				//
				// calls which needs original path
				// check access
				//
				
				else if( strcmp( urlpath[ 1 ], "checkaccess" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] Check access\n");
					char *perm = NULL;
					
					el = HttpGetPOSTParameter( request, "mode" );
					if( el == NULL ) el = HashmapGet( request->query, "mode" );
					if( el != NULL )
					{
						perm = (char *)el->data;
					}
					
					FBOOL access = FSManagerCheckAccess( l->sl_FSM, origDecodedPath, actDev->f_ID, loggedSession->us_User, perm );
					if( access == TRUE )
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"access\"}" );
					}
					
					// access = FALSE
					
					else
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"forbidden\"}" );
					}
				}
				
				//
				// get access
				//
				
				else if( strcmp( urlpath[ 1 ], "access" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] access\n");
					
					char *filepath = origDecodedPath;
					unsigned int i;
					for( i=0 ; i < strlen( origDecodedPath ) ; i++ )
					{
						if( origDecodedPath[ i ] == ':' )
						{
							filepath = &(origDecodedPath[ i+1 ]);
						}
					}
					
					BufString *bs = FSManagerGetAccess( l->sl_FSM, filepath, actDev->f_ID, loggedSession->us_User );
					if( bs != NULL )
					{
						HttpSetContent( response,  bs->bs_Buffer, bs->bs_Size );
						bs->bs_Buffer = NULL;
						BufStringDelete( bs );
					}
					else
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"no response\"}" );
					}
				}
				
				//
				// protect files or directories
				//
				
				else if( strcmp( urlpath[ 1 ], "protect" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] Protect\n");
					char *useracc = NULL;
					char *groupacc = NULL;
					char *othersacc = NULL;
					
					el = HttpGetPOSTParameter( request, "user" );
					if( el == NULL ) el = HashmapGet( request->query, "user" );
					if( el != NULL )
					{
						useracc = UrlDecodeToMem( (char *)el->data );
					}
					
					el = HttpGetPOSTParameter( request, "group" );
					if( el == NULL ) el = HashmapGet( request->query, "group" );
					if( el != NULL )
					{
						groupacc = UrlDecodeToMem( (char *)el->data );
					}
					
					el = HttpGetPOSTParameter( request, "others" );
					if( el == NULL ) el = HashmapGet( request->query, "others" );
					if( el != NULL )
					{
						othersacc = UrlDecodeToMem( (char *)el->data );
					}
					char *filepath = origDecodedPath;
					unsigned int i;
					for( i=0 ; i < strlen( origDecodedPath ) ; i++ )
					{
						if( origDecodedPath[ i ] == ':' )
						{
							filepath = &(origDecodedPath[ i+1 ]);
						}
					}
					
					int err = FSManagerProtect3( l->sl_FSM, loggedSession->us_User, filepath, actDev->f_ID, useracc, groupacc, othersacc );
					
					if( err == 0 )
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"access changed\"}" );
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"Result\": \"cannot change access\"}" );
					}
					
					/*
					char *access = NULL;
					
					el = HttpGetPOSTParameter( request, "access" );
					if( el == NULL ) el = HashmapGet( request->query, "access" );
					if( el != NULL )
					{
						access = (char *)el->data;
					}
					
					if( access != NULL )
					{
						int err = FSManagerProtect( l->sl_FSM, origDecodedPath, actDev->f_ID, access );
					
						if( err == 0 )
						{
							HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"access changed\"}" );
						}
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"Result\": \"cannot change access\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"Result\": \"Access parameter is missing\"}" );
					}
					*/
					
					if( useracc != NULL )
					{
						FFree( useracc );
					}
					if( groupacc != NULL )
					{
						FFree( groupacc );
					}
					if( othersacc != NULL )
					{
						FFree( othersacc );
					}
				}
				
				//
				// file locking
				//
				
				else if( strcmp( urlpath[ 1 ], "notificationstart" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					if( sqllib != NULL )
					{
						int err = 0;
						char answer[ 1024 ];
						FULONG id = 0;
						
						el = HttpGetPOSTParameter( request, "id" );
						if( el == NULL ) el = HashmapGet( request->query, "id" );
						if( el != NULL )
						{
							char *end;
							id = strtoull( (char *)el->data,  &end, 0 );
						}
						
						DEBUG( "[FSMWebRequest] notification start on path: %s\n", origDecodedPath );
						
						unsigned int pos = 0;
						unsigned int i = 0;
						for( i=0 ; i < strlen(origDecodedPath) ;  i++ )
						{
							if( origDecodedPath[ i ] == ':' )
							{
								pos = i+1;
							}
						}
						
						FULONG retVal = 0;
						//originalPath
						if( id != 0 )
						{
							if( DoorNotificationUpdateDB( sqllib, actDev, &origDecodedPath[ pos ], id ) == 0 )
							{
								retVal = id;
							}
							else
							{
								err = 1;
							}
						}
						else
						{
							retVal = DoorNotificationStartDB( sqllib, actDev, loggedSession, &origDecodedPath[ pos ], LOCK_READ );
						}
						
						if( err == 0 )
						{
							snprintf( answer, sizeof(answer),  "ok<!--separate-->{ \"Result\": \"%ld\"}", retVal );
						}
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Cannot update DoorNotification entry\"}" );
						}
						HttpAddTextContent( response, answer );
						
						l->LibraryMYSQLDrop( l, sqllib );
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Cannot get mysql.library\"}" );
					}
				}
				
				//
				// file unlocking
				//
				
				else if( strcmp( urlpath[ 1 ], "notificationremove" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
					if( sqllib != NULL )
					{
						char answer[ 1024 ];
						FULONG id = 0;
						
						el = HttpGetPOSTParameter( request, "id" );
						if( el == NULL ) el = HashmapGet( request->query, "id" );
						if( el != NULL )
						{
							char *end;
							id = strtoull( (char *)el->data,  &end, 0 );
						}
						
						int error = 0;
						//originalPath
						if( id > 0 )
						{
							error = DoorNotificationRemoveDB( sqllib, id );
							if( error == 0 )
							{
								snprintf( answer, sizeof(answer),  "ok<!--separate-->{ \"Result\": \"Entry removed\"}" );
							}
							else
							{
								snprintf( answer, sizeof(answer),  "fail<!--separate-->{ \"response\": \"Entry with provided id cannot be removed\"}" );
							}
						}
						else
						{
							snprintf( answer, sizeof(answer),  "fail<!--separate-->{ \"response\": \"id parameter is missing\"}" );
						}
						HttpAddTextContent( response, answer );
						
						l->LibraryMYSQLDrop( l, sqllib );
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Cannot get mysql.library\"}" );
					}
				}
				
				//
				// send notification to all UserSessions which listening changes on paths
				//
				
				else if( strcmp( urlpath[ 1 ], "notifychanges" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					int error = DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
					
					if( error == 0 )
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Notifications sent\"}" );
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Problems were meet during sending notifications\"}" );
					}
				}
				
				//
				// compress files or directories
				//
				
				else if( strcmp( urlpath[ 1 ], "compress" ) == 0 )
				{
					char *archiver = NULL;
					char *archpath = NULL;
					char *files    = NULL;
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				
					el = HttpGetPOSTParameter( request, "archiver" );
					if( el == NULL ) el = HashmapGet( request->query, "archiver" );
					if( el != NULL )
					{
						archiver = UrlDecodeToMem(( char *)el->data);
					}
					
					// Files to archive
					el = HttpGetPOSTParameter( request, "files" );
					if( el == NULL ) el = HashmapGet( request->query, "files" );
					if( el != NULL )
					{
						files = UrlDecodeToMem( (char *)el->data );
					}
					
					// Where archive should be stored
					el = HttpGetPOSTParameter( request, "destination" );
					if( el == NULL ) el = HashmapGet( request->query, "destination" );
					if( el != NULL )
					{
						archpath = UrlDecodeToMem( (char *)el->data );
					}
					
					if( archiver != NULL && files != NULL && archpath != NULL )
					{
						{
							char *dirname = FCalloc( 1024, sizeof(char) );
							snprintf( dirname, 1024, "/tmp/%s_decomp_%d%d", loggedSession->us_SessionID, rand()%9999, rand()%9999 );

							mkdir( dirname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
							char *dstname = FCalloc( 1024, sizeof(char) );
							snprintf( dstname, 1024, "%s.target/", dirname );
						
							mkdir( dstname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
							char *tmpfilename = FCalloc( 1024, sizeof(char) );
							snprintf( tmpfilename, 1024, "%s/%d%d.zip", dirname, rand()%9999, rand()%9999 );

							DEBUG("[FSMWebRequest] COMPRESS dirname %s dstname %s tmpfilename %s\n", dirname, dstname, tmpfilename );

							int numberOfFiles = 0;
							request->h_SB = l;
							int error = FileDownloadFilesOrFolder( request, loggedSession, dstname, files, &numberOfFiles );
						
							if( strcmp( archiver, "zip" ) == 0 )
							{
								char *command = FCalloc( 2048, sizeof(char) );
							
								ZLibrary *zlib = l->LibraryZGet( l );
								if( zlib != NULL )
								{
									DEBUG("[FSMWebRequest] pack archive %s to %s pack fnct poiter %p\n", tmpfilename, dstname, zlib->Pack );
									int compressedFiles = zlib->Pack( zlib, tmpfilename, dstname, strlen( dstname ), NULL, request, numberOfFiles );

									l->LibraryZDrop( l, zlib );
								}
							
								char *dstdevicename = StringDuplicate( archpath );
								if( dstdevicename != NULL )
								{
									unsigned int j = 0;
									for( j=0; j < strlen( dstdevicename ) ; j++ )
									{
										if( dstdevicename[ j ] == ':' )
										{
											dstdevicename[ j ] = 0;
											break;
										}
									}
								
									File *dstdevice = NULL;
									if( ( dstdevice = GetRootDeviceByName( loggedSession->us_User, dstdevicename ) ) != NULL )
									{
										char *buffer = FMalloc( 32768 * sizeof(char) );
									
										FILE *readfile = NULL;
										FHandler *fsys = dstdevice->f_FSys;
									
										if( ( readfile = fopen( tmpfilename, "rb" ) ) != NULL )
										{
											File *fp = (File *)fsys->FileOpen( dstdevice, archpath, "wb" );
											if( fp != NULL )
											{
												int bufferSize = 0;
												while( ( bufferSize = fread( buffer, 1, 32768, readfile ) ) > 0 )
												{
													fsys->FileWrite( fp, buffer, bufferSize );
												}
												fsys->FileClose( dstdevice, fp );
											
												char *msgpath = archpath;
												unsigned int k=0;
											
												for( k=0 ; k < strlen( archpath ) ; k++ )
												{
													if( archpath[ k ] == ':' )
													{
														msgpath = &archpath[ k+1 ];
													}
												}
											
												int err2 = DoorNotificationCommunicateChanges( l, loggedSession, dstdevice, archpath );
											
												HttpAddTextContent( response,  "ok<!--separate-->" );
											}
											else
											{
												FERROR("Cannot open file to store %s\n", archpath );
											}
											fclose( readfile );
										}
										else
										{
											FERROR("Cannot open file to read %s\n", tmpfilename );
										}
										FFree( buffer );
									}
									FFree( dstdevicename );
								}
								else
								{
									FERROR("Cannot allocate memory for path\n" );
								}
								FFree( command );
							}
							
							LocFileDeleteWithSubs( dirname );
							LocFileDeleteWithSubs( dstname );
							
							FFree( dstname );
							FFree( dirname );
							FFree( tmpfilename );
							
						}
						/*
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Error with files path!\"}" );
						}
						*/
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Parameter archiver is missing!\"}" );
					}
					
					// Clean up memory
					if( archiver != NULL )
					{
						FFree( archiver );
					}
					
					if( archpath != NULL )
					{
						FFree( archpath );
					}
					
					if( files != NULL )
					{
						FFree( files );
					}
				}
				
				//
				// decompress files or directories
				//
				
				else if( strcmp( urlpath[ 1 ], "decompress" ) == 0 )
				{
					char *archiver = NULL;
					
					//printf("--------------------------------------------------------------------------------------\n\ndecompress--------------------------------------------------------------------------------------\n\n");
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					el = HttpGetPOSTParameter( request, "archiver" );
					if( el == NULL ) el = HashmapGet( request->query, "archiver" );
					if( el != NULL )
					{
						archiver = (char *)el->data;
					}
					
					DEBUG("[FSMWebRequest] decompress %s\n", archiver );
					
					if( archiver != NULL )
					{
						//char dirname[ 756 ];
						char *dirname = FCalloc( 1024, sizeof(char ) );
						snprintf( dirname, 1024, "/tmp/%s_decomp_%d%d", loggedSession->us_SessionID, rand()%9999, rand()%9999 );
						
						mkdir( dirname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
						char *dstname = FCalloc( 1024, sizeof(char ) );
						snprintf( dstname, 1024, "%s.target", dirname );
						
						mkdir( dstname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
						char *tmpfilename = FCalloc( 1024, sizeof(char ) );
						snprintf( tmpfilename, 1024, "%s/%d%d.zip", dirname, rand()%9999, rand()%9999 );

						DEBUG("[FSMWebRequest] dirname %s dstname %s tmpfilename %s\n", dirname, dstname, tmpfilename );

						FILE *localfp = NULL;
						
						if( ( localfp = fopen( tmpfilename, "wb" ) ) != NULL )
						{
							// first we must copy file to local tmp folder

							FHandler *actFS = (FHandler *)actDev->f_FSys;
							int dataread = 0;
							int readbytes = 0;

							if( actFS != NULL )
							{
								File *fp = (File *)actFS->FileOpen( actDev, origDecodedPath, "rb" );
								// Success?
								if( fp != NULL )
								{
									response->h_Stream = FALSE;
							
									fp->f_Stream = request->h_Stream;
									fp->f_Socket = request->h_Socket;
									fp->f_WSocket =  request->h_WSocket;
									fp->f_Raw = 1;
							
									#define FS_READ_BUFFER 262144
								
									char *dataBuffer = FCalloc( FS_READ_BUFFER+1, sizeof( char ) ); 
							
									if( dataBuffer != NULL )
									{
										dataBuffer[ FS_READ_BUFFER ] = 0;
								
										while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
										{
											if( dataread == 0 )
											{
												continue;
											}
											fwrite( dataBuffer, 1, dataread, localfp );
											
											readbytes += dataread;
										}	// end of reading part or whole file
										FFree( dataBuffer );
									}
									actFS->FileClose( actDev, fp );
								}	// if( fp != NULL
							}	// actfs != NULL
							else
							{
								HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Filesystem not found!\"}" );
							}
							fclose( localfp );
							
							DEBUG("[FSMWebRequest] Archive readed, bytes %d\n", readbytes );
							
							// archive was stored on disk
							
							int filesExtracted = 0;
							
							if( readbytes > 0 )
							{
								char command[ 2048 ];
								command[ 0 ] = 0;
								
								DEBUG("[FSMWebRequest] arch '%s'  archsize %d  comp to '%s'\n", archiver, (int) strlen( archiver ), "zip" );
								
								if( strcmp( archiver, "zip" ) == 0 )
								{
									ZLibrary *zlib = l->LibraryZGet( l );
									if( zlib != NULL )
									{
										filesExtracted = zlib->Unpack( zlib, tmpfilename, dstname, NULL, request );
									 
										DEBUG("[FSMWebRequest] Unpack return %d\n", filesExtracted );
									 
										l->LibraryZDrop( l, zlib );
									}
								}

								char *dsttmp = StringDuplicate( origDecodedPath );
								if( dsttmp != NULL )
								{
									int i;
									for( i = strlen( dsttmp ) ; i >= 1 ; i-- )
									{
										if( dsttmp[ i ] == '/' || dsttmp[ i ] == ':' )
										{
											if( dsttmp[ i ] == '/' )
											{
												dsttmp[ i ] = 0;
											}
											else if( dsttmp[ i ] == ':' )
											{
												dsttmp[ i+1 ] = 0;
											}
											break;
										}
									}
									
									DEBUG("[FSMWebRequest] File upload %s\n", dsttmp );
									
									int error = FileUploadFileOrDirectory( request, loggedSession, dsttmp, dstname, filesExtracted );
								
									int err2 = DoorNotificationCommunicateChanges( l, loggedSession, actDev, dsttmp );
									
									FFree( dsttmp );
								}
								
								HttpAddTextContent( response,  "ok<!--separate-->" );
							}
							else
							{
								HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"File couldn't be readed!\"}" );
							}
						}
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Cannot create temporary file!\"}" );
						}
						
						// remove created directories
						
						LocFileDeleteWithSubs( dirname );
						LocFileDeleteWithSubs( dstname );
						
						FFree( dirname );
						FFree( dstname );
						FFree( tmpfilename );
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Parameter archiver is missing!\"}" );
					}
				}
				
				//
				// meta get
				//
				
				else if( strcmp( urlpath[ 1 ], "infoget" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] Info get\n");
					
					FHandler *actFS = (FHandler *)actDev->f_FSys;

					if( actFS != NULL )
					{
						char *key = NULL;
						
						el = HttpGetPOSTParameter( request, "key" );
						if( el == NULL ) el = HashmapGet( request->query, "key" );
						if( el != NULL )
						{
							key = UrlDecodeToMem( (char *)el->data );
						}
						
						if( key != NULL )
						{
							char *info = (char *)actFS->InfoGet( actDev, origDecodedPath, key );
							
							if( info != NULL )
							{
								HttpSetContent( response,  info, strlen(info) );
							}
							else
							{
								HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Return value is equal to NULL!\"}" );
							}
							
							FFree( key );
						}
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Key parameter is missing.\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Filesystem not found.\"}" );
					}
				}
				
				//
				// metdata set
				//
				
				else if( strcmp( urlpath[ 1 ], "infoset" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] info set\n");
					
					char *key = NULL;
					char *value = NULL;
					
					el = HttpGetPOSTParameter( request, "key" );
					if( el == NULL ) el = HashmapGet( request->query, "key" );
					if( el != NULL )
					{
						key = (char *) UrlDecodeToMem( el->data );
					}
					
					el = HttpGetPOSTParameter( request, "value" );
					if( el == NULL ) el = HashmapGet( request->query, "value" );
					if( el != NULL )
					{
						value = UrlDecodeToMem( (char *)el->data );
					}
					
					if( key != NULL && value != NULL )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						
						if( actFS != NULL )
						{
							int error = actFS->InfoSet( actDev, origDecodedPath, key, value );
						
							if( error == 0 )
							{
								HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Info Set for file!\"}" );
							}
							else
							{
								HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Cannot set comments, check FC logs!\"}" );
							}
						}	// actfs != NULL
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Filesystem not found!\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"key or value parameters is missing!\"}" );
					}
					
					if( key != NULL )
					{
						FFree( key );
					}
					if( value != NULL )
					{
						FFree( value );
					}
					
					/*
					char *param = NULL;
					
					el = HttpGetPOSTParameter( request, "data" );
					if( el == NULL ) el = HashmapGet( request->query, "data" );
					if( el != NULL )
					{
						param = (char *)el->data;
					}

					if( param != NULL )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						
						if( actFS != NULL )
						{
							int error = actFS->InfoSet( actDev, origDecodedPath, param, "rb" );
							
							if( error == 0 )
							{
								HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Info Set for file!\"}" );
=======
								HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Information was set.\"}" );
>>>>>>> 106da72c1d6a2196ae282c4449ea2ff1c782e696
							}
							else
							{
								HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Could not set information.\"}" );
							}
						}	// actfs != NULL
						else
						{
							HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Filesystem not found.\"}" );
						}
					}
					else
					{
						HttpAddTextContent( response,  "fail<!--separate-->{ \"response\": \"Key or value parameter missing.\"}" );
					}
					*/
				}
				
				//
				// no functionality avaiable
				//
				
				else
				{
					if( response == NULL)
					{
						response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					}
					HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Function not found\" }" );
				}
			}		// device not found
			else
			{
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Device not found\" }" );
			}
			
			if( actDev != NULL )
			{
				actDev->f_Operations--;
			}
		}	// special case
	}
	
	*result = 200;
	
	done:
	
	// Changed target path
	if( freeTargetPath == TRUE )
	{
		FFree( targetPath );
	}
	
	if( freePath == TRUE )
	{
		FFree( path );
	}
	
	if( originalPath != NULL )
	{
		FFree( originalPath );
	}
	
	if( origDecodedPath != NULL )
	{
		FFree( origDecodedPath );
	}
	
	return response;
}
