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
/** @file fs_remote_manager_web.c
 * 
 *  FSRemote definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#include "fs_manager_web.h"
#include <system/fsys/device_handling.h>
#include <network/mime.h>
#include <util/md5.h>
#include <system/fsys/door_notification.h>
#include <stdlib.h>

/**
 * Remote Filesystem web calls handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @param result pointer to integer where http error will be set
 * @return pointer to new Http structure (response) or NULL when error appear
 */
Http *FSMRemoteWebRequest( void *m, char **urlpath, Http *request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	char *path = NULL;
	char *originalPath = NULL;
	char *origDecodedPath = NULL;
	char *targetPath = NULL;
	INFO("[FSMRemoteWebRequest] pointer %p  url %p  request %p session %p\n", m, urlpath, request, loggedSession );
	
	if( l->sl_ActiveAuthModule == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"user.library is not opened!\"}" );
		
		goto error;
	}
	
	DEBUG2("[FSMRemoteWebRequest] -------------------------------------------------file func %s\n", urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMRemoteWebRequest] URL path is NULL!\n" );
		HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"second part of url is null!\"}" );
		
		goto error;
	}
	
	if( loggedSession->us_User == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"user not logged in\"}" );
		
		*result = 200;
		goto error;
	}
	
	if( strcmp( urlpath[ 1 ], "open" ) == 0 )
	{
		char *path = NULL;
		
		DEBUG("[FSMRemoteWebRequest] UFILE/OPEN\n");
		
		HashmapElement *el = HttpGetPOSTParameter( request, "path" );
		if( el == NULL ) el = HashmapGet( request->query, "path" );
		
		if( el != NULL )
		{
			path = (char *)el->data;
		}
		
		if( path == NULL )
		{
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			//DEBUG("No session id or path %p %p\n", sessionid, path );
			HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"path or sessionid is empty\"}" );
		}
		else		// sessionid or path = NULL
		{
			File *actDev = NULL;
			char devname[ 256 ];
			memset( devname, 0, 256 );
			char *lpath = NULL;
			
			if( ( lpath = FCalloc( strlen( path ) + 10, sizeof(char) ) ) != NULL )
			{
				UrlDecode( lpath, path );
				DEBUG("[FSMRemoteWebRequest] original path %s\n", path );
				
				unsigned int dpos = ColonPosition( lpath );
				if( dpos >= sizeof(devname) )
				{
					dpos = sizeof(devname)-1;
				}
				strncpy( devname, lpath, dpos );
				devname[ dpos ] = 0;
				
				DEBUG( "[FSMRemoteWebRequest] Device name '%s' Logguser name %s  ---- path %s\n", devname, loggedSession->us_User->u_Name, path );
				FFree( lpath );
				lpath = NULL;
			}
			
			actDev = GetRootDeviceByName( loggedSession->us_User, devname );
			
			// TODO: Custom stuff (should probably be in the actual FS)
			// TODO: devname is 0 in length. Why strlen it?
			if( actDev != NULL )
			{
				if( ( lpath = FCalloc( strlen( path ) + 255, sizeof(char) ) ) != NULL )
				{
					UrlDecode( lpath, path );
					
					int dpos = ColonPosition( lpath );
					
					strcpy( path, &lpath[ dpos + 1 ] );
					
					FFree( lpath );
					lpath = NULL;
				}
				
				FHandler *actFS = (FHandler *)actDev->f_FSys;
				
				char *mode = NULL;
				
				DEBUG("[FSMRemoteWebRequest] Filesystem taken from file\n");
				
				el = HttpGetPOSTParameter( request, "mode" );
				if( el == NULL ) el = HashmapGet( request->query, "mode" );
				if( el != NULL )
				{
					mode = (char *)el->data;
				}
				
				if( mode != NULL )//&& mode[0] == 'r' )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					// checking remote write access for Sentinel user
					if( l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User && mode[0] == 'w' )
					{
						HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"You are using sentinel user. No write access allowed\"}" );
					}
					else
					{
						File *fp = (File *)actFS->FileOpen( actDev, path, mode );
					
						if( fp != NULL )
						{
							DEBUG("[FSMRemoteWebRequest] UFILE/OPEN %s\n", fp->f_Path );
						}
					
					/*
					 * if( mode != NULL && strcmp( mode, "rs" ) == 0 )		// read stream
					 *			{
					 *				File *fp = (File *)actFS->FileOpen( actDev, path, mode );
					 *			
					 *				// Success?
					 *				if( fp != NULL )
					 *				{
					 *					int dataread = 0;
					 *					
					 *					response->h_RequestSource = request->h_RequestSource;
					 *					response->h_Stream = TRUE;
					 *					HttpWrite( response, request->h_Socket );
					 *					
					 *					fp->f_Stream = request->h_Stream;
					 *					fp->f_Socket = request->h_Socket;
					 *					fp->f_WSocket =  request->h_WSocket;
					 *					
					 # de*fine FS_READ_BUFFER 262144
					 int readbytes = 0;// FS_READ_BUFFER;
					 char *dataBuffer = FCalloc( FS_READ_BUFFER+1, sizeof( char ) ); 
					 
					 if( dataBuffer != NULL )
					 {
					 dataBuffer[ FS_READ_BUFFER ] = 0;
					 
					 fp->f_Stream = TRUE;
					 
					 while( ( dataread = actFS->FileRead( fp, dataBuffer, FS_READ_BUFFER ) ) != -1 )
					 {
					 if( dataread == 0 ) continue;
					 readbytes += dataread;
					 //FERROR("\n\n\n\n read bytes %d dataread %d\n\n\n", readbytes, dataread );
					 
				}	// end of reading part or whole file
				FFree( dataBuffer );
				}
				actFS->FileClose( actDev, fp );
				}
				
				// Free up
				//HttpFree( response );
				//response = -1; // Terminate because we used streaming
				}
				*/

						// Success?
						if( fp != NULL )
						{
							char tmp[ 512 ];
							fp->f_RootDevice = actDev;
							fp->f_Pointer = (FULONG)fp;
							
							if( mode[0] == 'r' && mode[1]  ==  's'  )
							{
								fp->f_Stream = TRUE;
							}
							else if( mode[0] == 'w' )
							{
								fp->f_OperationMode = MODE_WRITE;
							}
							fp->f_Socket = request->h_Socket;
						
							sprintf( tmp, "ok<!--separate-->{\"fileptr\":\"%p\"} ", fp );
							HttpAddTextContent( response, tmp );
						
							USMAddFile( l->sl_USM,  loggedSession, fp );
						}
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"cannot open file\"}" );
						}
					
					DEBUG("[FSMRemoteWebRequest] RAWpen command on FSYS: %s called\n", actFS->GetPrefix() );
					}
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"mode parameter is missing\"}" );
				}
			}
			else
			{
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"device not found\"}" );
			}
		}
	}
	else if( strcmp( urlpath[ 1 ], "close" ) == 0 )
	{
		{
			DEBUG("[FSMRemoteWebRequest] close\n");
			
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			FULONG pointer = 0;
			
			HashmapElement *el  = HashmapGet( request->parsedPostContent, "fptr" );
			if( el == NULL ) el = HashmapGet( request->query, "fptr" );
			if( el != NULL )
			{
				char *eptr;
				pointer = (FULONG)strtoul( (char *)el->data, &eptr, 0 );
			}
			
			DEBUG("[FSMRemoteWebRequest] Close\n");
			if( el != NULL )
			{
				File *f = USMGetFile( l->sl_USM, loggedSession, pointer );
				DEBUG("[FSMRemoteWebRequest] File %p mode %d\n", f, f->f_OperationMode );
				if( f != NULL && f->f_OperationMode == MODE_WRITE )
				{
					FERROR("[FSMRemoteWebRequest] Notification on path %s\n", f->f_Path );
					DoorNotificationCommunicateChanges( l, loggedSession, f->f_RootDevice, f->f_Path );
				}
				
				USMRemFile( l->sl_USM,  loggedSession, pointer );
			}
			else
			{
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"pointer parameter is missing\"}" );
			}
		}	// sessionid or path = NULL
	}		// close
	
	//
	// read
	//
	
	else if( strcmp( urlpath[ 1 ], "read" ) == 0 )
	{
		FULONG pointer = 0;
		FULONG size = 0;
		int error = 0;
		FBOOL streaming = FALSE;
		
		HashmapElement *el  = HashmapGet( request->parsedPostContent, "fptr" );
		if( el == NULL ) el = HashmapGet( request->query, "fptr" );
		if( el != NULL )
		{
			char *eptr;
			pointer = (FULONG)strtoul( (char *)el->data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->parsedPostContent, "size" );
		if( el == NULL ) el = HashmapGet( request->query, "size" );
		if( el != NULL )
		{
			char *eptr;
			size = (FULONG)strtoul( (char *)el->data, &eptr, 0 );
		}
		
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		response->h_ResponseID = request->h_ResponseID;
		
		int readsize = -2;
		DEBUG("[FSMRemoteWebRequest] Read   size %lu  pointer %lu\n", size,  pointer );
		if( size != 0 && pointer != 0 )
		{
			// finding opened file
			
			File *f = loggedSession->us_OpenedFiles;
			File *prevfile = f;
			while( f != NULL )
			{
				if( f->f_Pointer == pointer )
				{
					break;
				}
				
				prevfile = f;
				f = (File *)f->node.mln_Succ;
			}
			
			// check if device was opened
			
			if( f != NULL )
			{
				DEBUG("[FSMRemoteWebRequest] File found reading\n");
				char *buffer;
				streaming = f->f_Stream;
				
				if( ( buffer = FCalloc( size+1, sizeof(char) ) ) != NULL )
				{
					FHandler *actFS  =  f->f_RootDevice->f_FSys;
					readsize = actFS->FileRead( f, buffer, size );
					DEBUG2("[FSMRemoteWebRequest] Readed by native FS %d\n", readsize );
					if( readsize > 0 )
					{
						DEBUG2("[FSMRemoteWebRequest] Readed by native FS %d  last char %d\n", readsize, buffer[ readsize-1 ] );
						if( streaming == FALSE )
						{
							HttpSetContent( response, buffer, readsize );
						}
					}
					else
					{
						FFree( buffer );
						error = 1;
					}
				}
				else
				{
					FERROR("Cannot allocate memory for temporary buffer\n");
					error = 2;
				}
			}
			else
			{
				error = 3;
			}
		}
		else
		{
			error  = 4;
		}
		
		if( readsize < 1 )
		{
			char sizec[  256 ];
			FULONG sizei = (FULONG)sprintf( sizec, "{\"rb\":\"%d\"}", readsize );
			
			if( streaming == TRUE )
			{
				SocketWrite( request->h_Socket, sizec, sizei );
			}
			else
			{
				HttpAddTextContent( response, sizec );
			}
			//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Pointer parameter is missing\"}" );
		}
		/*
		 * if( error != 0 )
		 * {
		 *	//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"Pointer parameter is missing\"}" );
		 *	char *endbuf;
		 *	if( ( endbuf =  FCalloc( 4, sizeof(char) ) ) != NULL )
		 *	{
		 *		endbuf[ 0  ] =  endbuf[ 1 ] = endbuf[ 2 ] = -1;
		 *		HttpSetContent( response, endbuf, 3 );
	}
	}*/
	}
	
	//
	// write
	//
	
	else if( strcmp( urlpath[ 1 ], "write" ) == 0 )
	{
		FULONG pointer = 0;
		FULONG size = 0;
		char *data = NULL;
		int error = 0;
		
		HashmapElement *el  = HashmapGet( request->parsedPostContent, "fptr" );
		if( el == NULL ) el = HashmapGet( request->query, "fptr" );
		if( el != NULL )
		{
			char *eptr;
			pointer = (FULONG)strtoul( (char *)el->data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->parsedPostContent, "size" );
		if( el == NULL ) el = HashmapGet( request->query, "size" );
		if( el != NULL )
		{
			char *eptr;
			size = (FULONG)strtoul( (char *)el->data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->parsedPostContent, "data" );
		if( el == NULL ) el = HashmapGet( request->query, "data" );
		if( el != NULL )
		{
			data = (char *)el->data;
		}
		
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG("[FSMRemoteWebRequest] UFILE/write\n");
		if( pointer != 0 && size != 0 && data != NULL )
		{
			// finding opened file
			
			File *f = loggedSession->us_OpenedFiles;
			File *prevfile = f;
			while( f != NULL )
			{
				if( f->f_Pointer == pointer )
				{
					break;
				}
				
				prevfile = f;
				f = (File *)f->node.mln_Succ;
			}
			
			// check if device was opened
			
			if( f != NULL )
			{
				FHandler *actFS = f->f_RootDevice->f_FSys;
				DEBUG("[FSMRemoteWebRequest] Store data from PTR %p  - '%s' size %lu\n", data, data, size );
				int wrotesize = 0;
				
				if( f->f_RootDevice->f_Activity.fsa_StoredBytesLeft >= 0 )
				{
					wrotesize = actFS->FileWrite( f, data, (int) size );
					f->f_RootDevice->f_BytesStored += wrotesize;
					
					if( f->f_RootDevice->f_Activity.fsa_StoredBytesLeft != 0 )	// 0 == unlimited bytes to store
					{
						if( (f->f_RootDevice->f_Activity.fsa_StoredBytesLeft-wrotesize) <= 0 )
						{
							f->f_RootDevice->f_Activity.fsa_StoredBytesLeft = -1;
						}
						else
						{
							f->f_RootDevice->f_Activity.fsa_StoredBytesLeft -= wrotesize;
						}
					}
				}
				
				char temp[ 256 ];
				snprintf( temp, 256, "{\"filestored\":\"%d\"}", wrotesize );
				
				HttpAddTextContent( response, temp );
			}
			else
			{
				error = 3;
			}
		}
		else
		{
			error  = 4;
		}
		
		if( error != 0 )
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"pointer parameter is missing\"}" );
		}
	}
	
	error:
	*result = 200;
	
	return response;
}
