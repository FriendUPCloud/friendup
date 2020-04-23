/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
	
	INFO("[FSMRemoteWebRequest] pointer %p  url %p  request %p session %p\n", m, urlpath, request, loggedSession );
	
	if( l->sl_ActiveAuthModule == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		char buffer[ 256 ];
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
		HttpAddTextContent( response, buffer );
		
		goto error;
	}
	
	DEBUG2("[FSMRemoteWebRequest] -------------------------------------------------file func %s\n", urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMRemoteWebRequest] URL path is NULL!\n" );
		
		goto error;
	}
	
	if( loggedSession->us_User == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		char buffer[ 256 ];
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
		HttpAddTextContent( response, buffer );
		
		*result = 200;
		goto error;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/ufile/open</H2>Open file
	*
	* @param sessionid - (required) session id of logged user
	* @param path - (required) path with device name to file
	* @param mode - (required) mode in format "rb" - read binary, "wb" - write binary, "rs" - read stream
	* @return {fileptr:<number>} when success, otherwise error code
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "open" ) == 0 )
	{
		char *path = NULL;
		
		DEBUG("[FSMRemoteWebRequest] UFILE/OPEN\n");
		
		HashmapElement *el = HttpGetPOSTParameter( request, "path" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "path" );
		
		if( el != NULL )
		{
			path = (char *)el->hme_Data;
		}
		
		if( path == NULL )
		{
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "path, sessionid" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
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
				if( el == NULL ) el = HashmapGet( request->http_Query, "mode" );
				if( el != NULL )
				{
					mode = (char *)el->hme_Data;
				}
				
				if( mode != NULL )//&& mode[0] == 'r' )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					// checking remote write access for Sentinel user
					if( l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User && mode[0] == 'w' )
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SENTINEL_USER_REQUIRED] , DICT_SENTINEL_USER_REQUIRED );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
						
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
							fp->f_Socket = request->http_Socket;
						
							sprintf( tmp, "ok<!--separate-->{\"fileptr\":\"%p\"} ", fp );
							HttpAddTextContent( response, tmp );
						
							USMAddFile( l->sl_USM,  loggedSession, fp );
						}
						else
						{
							char buffer[ 256 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_CANNOT_OPEN_FILE], path );
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_CANNOT_OPEN_FILE );
							HttpAddTextContent( response, buffer );
						}
					
					DEBUG("[FSMRemoteWebRequest] RAWpen command on FSYS: %s called\n", actFS->GetPrefix() );
					}
				}
				else
				{
					char buffer[ 256 ];
					char buffer1[ 256 ];
					snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "mode" );
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], devname );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/ufile/close</H2>Close file
	*
	* @param sessionid - (required) session id of logged user
	* @param fptr - (required) pointer to opened file
	* @return {result:success} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "close" ) == 0 )
	{
		{
			DEBUG("[FSMRemoteWebRequest] close\n");
			
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			FULONG pointer = 0;
			
			HashmapElement *el  = HashmapGet( request->http_ParsedPostContent, "fptr" );
			if( el == NULL ) el = HashmapGet( request->http_Query, "fptr" );
			if( el != NULL )
			{
				char *eptr;
				pointer = (FULONG)strtoul( (char *)el->hme_Data, &eptr, 0 );
			}
			
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
				HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
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
				
				char tmp[ 256 ];
				sprintf( tmp, "ok<!--separate-->{\"result\":\"success\"}" );
				HttpAddTextContent( response, tmp );
			}
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "pointer" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}	// sessionid or path = NULL
	}		// close
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/ufile/read</H2>Read file
	*
	* @param sessionid - (required) session id of logged user
	* @param fptr - (required) pointer to opened file
	* @param size - (required) number of maximum bytes which you want to receive
	* @return received bytes when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "read" ) == 0 )
	{
		FULONG pointer = 0;
		FULONG size = 0;
		int error = 0;
		FBOOL streaming = FALSE;
		
		HashmapElement *el  = HashmapGet( request->http_ParsedPostContent, "fptr" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "fptr" );
		if( el != NULL )
		{
			char *eptr;
			pointer = (FULONG)strtoul( (char *)el->hme_Data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->http_ParsedPostContent, "size" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "size" );
		if( el != NULL )
		{
			char *eptr;
			size = (FULONG)strtoul( (char *)el->hme_Data, &eptr, 0 );
		}
		
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		response->http_ResponseID = request->http_ResponseID;
		
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
				SocketWrite( request->http_Socket, sizec, sizei );
			}
			else
			{
				HttpAddTextContent( response, sizec );
			}
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
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/ufile/write</H2>Write file
	*
	* @param sessionid - (required) session id of logged user
	* @param fptr - (required) pointer to opened file
	* @param size - (required) number of bytes which you want to send
	* @param data - (required) data which you want to send
	* @return {filestored:\<stored bytes\>} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "write" ) == 0 )
	{
		FULONG pointer = 0;
		FQUAD size = 0;
		char *data = NULL;
		int error = 0;
		
		HashmapElement *el  = HashmapGet( request->http_ParsedPostContent, "fptr" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "fptr" );
		if( el != NULL )
		{
			char *eptr;
			pointer = (FULONG)strtoul( (char *)el->hme_Data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->http_ParsedPostContent, "size" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "size" );
		if( el != NULL )
		{
			char *eptr;
			size = (FQUAD)strtoul( (char *)el->hme_Data, &eptr, 0 );
		}
		
		el  = HashmapGet( request->http_ParsedPostContent, "data" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "data" );
		if( el != NULL )
		{
			data = (char *)el->hme_Data;
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
				
				//if( f->f_RootDevice->f_Activity.fsa_StoredBytesLeft >= 0 )
				{
					size = FileSystemActivityCheckAndUpdate( l, &(f->f_RootDevice->f_Activity), (int)size );
					wrotesize = actFS->FileWrite( f, data, (int) size );
					f->f_RootDevice->f_BytesStored += wrotesize;
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
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "pointer" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
	}
	
	//
	// release
	//
	
	else if( strcmp( urlpath[ 1 ], "release" ) == 0 )
	{
		char *username = NULL;
		
		HashmapElement *el  = HashmapGet( request->http_ParsedPostContent, "username" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "username" );
		if( el != NULL )
		{
			username = (char *)el->hme_Data;
		}
	}
	
	//
	// unmount
	//
	
	else if( strcmp( urlpath[ 1 ], "unmount" ) == 0 )
	{
		
	}
	
	//
	// function not found
	//
	
	else
	{
		Log( FLOG_ERROR, "[FSRemoteManagerWeb]: Function not found '%s'\n", urlpath[ 0 ] );
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE unknown function\n");
		}
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
		
		char buffer[ 256 ];
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_NOT_FOUND] , DICT_FUNCTION_NOT_FOUND );
		HttpAddTextContent( response, buffer );
		*result = 404;
	
		return response;
	}
	error:
	*result = 200;
	
	return response;
}
