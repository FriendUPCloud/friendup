/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 *  
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
#include <system/cache/cache_user_files.h>
#include <system/cache/cache_manager.h>
#include <system/fsys/fsys_activity.h>

#define CHECK_BAD_CHARS( PTH, INT, RETVAL ) \
if( PTH[ INT ] == '/' || PTH[ INT ] == ':' || PTH[ INT ] == '\'' ) \
{ \
	RETVAL = TRUE; \
	break; \
}

//
// Internal function to cut path from path+filename
//

static inline char *CutNotificationPath( char *path )
{
	char *notifPath = StringDuplicate( path );
	if( notifPath != NULL )
	{
		int i, notifPathLen = strlen( notifPath );
		if( notifPath[ notifPathLen-1 ] == '/' )
		{
			notifPathLen-=2;
		}
		for( i=notifPathLen ; i >= 0 ; i-- )
		{
			if( notifPath[ i ] == '/' || notifPath[ i ] == ':' )
			{
				notifPath[ i+1 ] = 0;
				break;
			}
		}
	}
	return notifPath;
}

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
	
	if( l->sl_ActiveAuthModule == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMWebRequest] Auth module is NULL!\n" );
		
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
		HttpAddTextContent( response, dictmsgbuf );
		goto done;
	}
	
	DEBUG2("[FSMWebRequest] -------------------------------------------------file func %s\n", urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
		
		DEBUG( "[FSMWebRequest] URL path is NULL!\n" );
		
		char dictmsgbuf[ 256 ];
		char dictmsgbuf1[ 196 ];
		snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_MISSING_PART_OF_PATH], 2 );
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_MISSING_PART_OF_PATH );
		HttpAddTextContent( response, dictmsgbuf );
		
		goto done;
	}
	else
	{
		/// @cond WEB_CALL_DOCUMENTATION
		/**
		* 
		* <HR><H2>system.library/file/help</H2>Return available commands
		*
		* @param sessionid - (required) session id of logged user
		* @return avaiable file commands
		*/
		/// @endcond
	
		if( strcmp( urlpath[ 1 ], "help" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			HttpAddTextContent( response, "ok<!--separate-->{\"HELP\":\"commands: \"" 
				"info - get information about file/directory\n"
				",dir - get all files in directory\n"
				",rename - rename file or directory\n"
				",delete - delete all files or directory (and all data in directory)\n"
				",makedir - make new directory\n"
				",exec - run command\n"
				",read - read bytes from file\n"
				",write - write files to file\n"
				"\"}" );
		
			*result = 200;
			return response;
		}
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
			Log( FLOG_INFO, "File operation, path: %s\n", tmpPath );
			if( ColonPosition( tmpPath ) <= 0 )
			{
				path = NULL;
			}
			FFree( tmpPath );
		}
	}
	
	// Some commands take "files" instead of path
	/*
	if( !path )
	{
		HashmapElement *el = HttpGetPOSTParameter( request, "files" );
		if( el == NULL ) el = HashmapGet( request->query, "files" );
		if( el != NULL ) path = ( char *)el->data;
	}
	*/
	
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
		
		Log( FLOG_INFO, "File operation, target path: %s\n", targetPath );
	}
	
	DEBUG( "[FSMWebRequest] Checking path: %s\n", path );
	
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
		
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_PATH_PARAMETER_IS_EMPTY] , DICT_PATH_PARAMETER_IS_EMPTY );
		HttpAddTextContent( response, dictmsgbuf );
	}
	else
	{
		if( loggedSession == NULL || loggedSession->us_User == NULL )
		{
			response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USERSESSION_OR_USER_NOT_FOUND] , DICT_USERSESSION_OR_USER_NOT_FOUND );
			HttpAddTextContent( response, dictmsgbuf );
			
			*result = 200;
			goto done;
		}
		
		DEBUG("[FSMWebRequest] Checking mounted devices\n");
		
		//File *lDev = loggedSession->us_User->u_MountedDevs;
		
		File *actDev = NULL;
		char devname[ 256 ];
		memset( devname, '\0', sizeof(devname) );
		char *locpath = NULL;
		int pthl = strlen( path ) + 10;
		
		if( ( 
			locpath = FCalloc( pthl, sizeof(char) ) ) != NULL && 
			( originalPath = FCalloc( pthl, sizeof(char) ) ) != NULL 
		)
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
			if( locpath ){ FFree( locpath ); locpath = NULL; }
			if( originalPath ){ FFree( originalPath ); originalPath = NULL; }
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
				
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_MODULE_RETURNED_EMPTY_STRING] , DICT_MODULE_RETURNED_EMPTY_STRING );
				HttpAddTextContent( response, dictmsgbuf );
			}
			systemCalled = TRUE;
		}
		
		if( systemCalled == FALSE )
		{
			//
			// Check mounted devices for user
			//
			
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
					
					FFree( locpath );
					locpath = NULL;
				}
				
				//
				// checking file commands
				//
				
				DEBUG( "[FSMWebRequest] Checking 3rd part from path '%s' - path '%s'\n", urlpath[ 0 ], path );
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/info</H2>Get information about file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file with device name before ':' sign
				* @return return information about file in JSON format when success, otherwise error code
				*/
				/// @endcond
				if( strcmp( urlpath[ 1 ], "info" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					FBOOL details = FALSE;
					
					el = HttpGetPOSTParameter( request, "details" );
					if( el == NULL ) el = HashmapGet( request->query, "details" );
					if( el != NULL )
					{
						if( strcmp( (char *)el->data, "true" ) == 0 )
						{
							details = TRUE;
						}
					}

					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
					if( have == TRUE )
					{
						BufString *resp = actFS->Info( actDev, path );

						DEBUG("info command on FSYS: %s called\n", actFS->GetPrefix() );
						
						// we must check extension
						// if this is gfx file we can read details from it and put before ,\"Type\" string
						//  , "Details":[ "Width":xxx, "Height":yyyy ....
					
						if( resp != NULL )
						{
							if( details == TRUE )
							{
								char *extension = GetExtension( path );

								// Use the extension if possible
								if( extension != NULL && strlen( extension ) )
								{
									const char *type = MimeFromExtension( extension );
									if( strncmp( "image", type, 5 ) == 0 )
									{
										char *tmpfilename = FCalloc( 1024, sizeof(char) );
										if( tmpfilename != NULL )
										{
											snprintf( tmpfilename, 1024, "/tmp/Friendup/_file_info_%d%d.%s", rand()%9999, rand()%9999, extension );
										
											int readbytes = 10240;
											int dataread = 0;
											uint64_t totalBytes = 0;
											char *dataBuffer = FCalloc( readbytes, sizeof( char ) );
											FILE *dstFp;
									
											// download file to server to check it
											if( ( dstFp = fopen( tmpfilename, "wb" ) ) != NULL )
											{
												File *fp = (File *)actFS->FileOpen( actDev, origDecodedPath, "r" );
												if( fp != NULL )
												{
													while( ( dataread = actFS->FileRead( fp, dataBuffer, readbytes ) ) != -1 )
													{
														if( request->h_ShutdownPtr != NULL && *(request->h_ShutdownPtr) == TRUE )
														{
															break;
														}
												
														if( dataread == 0 )
														{
															break;
														}
														fwrite( dataBuffer, dataread, 1, dstFp );
										
														totalBytes += readbytes;
													}
													actFS->FileClose( actDev, fp );
													
													// image was created, getting details
												}
												fclose( dstFp );

												// trying to figure out what kind of image it is
												gdImagePtr img = NULL;
												dstFp = fopen( tmpfilename, "rb" );
												if( dstFp != NULL )
												{
													img = gdImageCreateFromPng( dstFp );
													if( img == NULL )
													{
														fseek( dstFp, 0, SEEK_SET );
														img = gdImageCreateFromJpeg( dstFp );
														if( img == NULL )
														{
															fseek( dstFp, 0, SEEK_SET );
															img = gdImageCreateFromBmp( dstFp );
															if( img == NULL )
															{
																fseek( dstFp, 0, SEEK_SET );
																img = gdImageCreateFromGif( dstFp );
																if( img == NULL )
																{
#ifdef USE_WEBP_LOADER
																	fseek( dstFp, 0, SEEK_SET );
																	img = gdImageCreateFromWebp( dstFp );
																	if( img == NULL )
																	{
#endif
																		fseek( dstFp, 0, SEEK_SET );
																		img = gdImageCreateFromTga( dstFp );
																		if( img == NULL )
																		{
																			fseek( dstFp, 0, SEEK_SET );
																			img = gdImageCreateFromTiff( dstFp );
																			if( img == NULL )
																			{
																				fseek( dstFp, 0, SEEK_SET );
																				img = gdImageCreateFromWBMP( dstFp );
																			}
																		}
#ifdef USE_WEBP_LOADER
																	}
#endif
																}
															}
														}
													}
													fclose( dstFp );
												}

												// add details to result string
												if( img != NULL )
												{
													char tmpBuffer[ 1024 ];
													BufString *dstBs = BufStringNew();
													
													DEBUG("Image found\n");
													
													int textLen = snprintf( tmpBuffer, sizeof( tmpBuffer ), "\"Details\":[\"type\":\"%s\",\"width\":%d,\"height\":%d],", type, img->sx, img->sy );
													char *textFound = strstr( resp->bs_Buffer, "\"Type\"" );
													if( textFound != NULL )
													{
														int len = textFound-resp->bs_Buffer;
														BufStringAddSize( dstBs, resp->bs_Buffer, len );
														BufStringAddSize( dstBs, tmpBuffer, textLen );
														BufStringAdd( dstBs, textFound );
														
														DEBUG("DSTString: %s\n", dstBs->bs_Buffer );
														
														BufStringDelete( resp );
														resp = dstBs;
													}

													gdImageDestroy( img );
												}
												
												// remove temporary file on the end
												remove( tmpfilename );
											}
											FFree( tmpfilename );
										}
									}
								}
								
								if( extension != NULL )
								{
									FFree( extension );
								}
							}
							
							// add FS id and FSType
							
							{
								char tmpBuffer[ 1024 ];
								BufString *dstBs = BufStringNew();
								//FHandler *fh = (FHandler *)actDev->f_FSys
								
								int textLen = snprintf( tmpBuffer, sizeof( tmpBuffer ), "\"fsid\":\"%lu\",\"fstype\":\"%s\",", actDev->f_ID, actDev->f_FSysName );
								char *textFound = strstr( resp->bs_Buffer, "\"Type\"" );
								if( textFound != NULL )
								{
									int len = textFound-resp->bs_Buffer;
									BufStringAddSize( dstBs, resp->bs_Buffer, len );
									BufStringAddSize( dstBs, tmpBuffer, textLen );
									BufStringAdd( dstBs, textFound );
									
									DEBUG("DSTString: %s\n", dstBs->bs_Buffer );
									
									BufStringDelete( resp );
									resp = dstBs;
								}
								else
								{
									BufStringDelete( dstBs );
								}
							}

							HttpAddTextContent( response, resp->bs_Buffer );
						
							BufStringDelete( resp );
						}
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING] , DICT_FUNCTION_RETURNED_EMPTY_STRING );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/call</H2>Call file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file with device name before ':' sign
				* @param args - (required) additional parameters to call function
				* @return return call response in JSON format when success, otherwise error code
				*/
				/// @endcond
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
								char dictmsgbuf[ 256 ];
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING] , DICT_FUNCTION_RETURNED_EMPTY_STRING );
								HttpAddTextContent( response, dictmsgbuf );
							}
						} // actFS = NULL
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/dir</H2>Get directory content
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to directory
				* @return return directory entries in JSON format when success, otherwise error code
				*/
				/// @endcond
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
						
						actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
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
								resp->bs_Buffer = NULL;
							}
							else
							{
								char dictmsgbuf[ 256 ];
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING] , DICT_FUNCTION_RETURNED_EMPTY_STRING );
								HttpAddTextContent( response, dictmsgbuf );
							}
							BufStringDelete( resp );
						}
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING] , DICT_FUNCTION_RETURNED_EMPTY_STRING );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/rename</H2>Rename file or directory
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which name you want to change
				* @param newname - (required) new file name
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { response:0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "rename" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					char tmp[ 256 ];
					char *nname = NULL;
					el = HttpGetPOSTParameter( request, "newname" );
					if( el == NULL ) el = HashmapGet( request->query, "newname" );
					if( el != NULL )
					{
						nname = UrlDecodeToMem( (char *)el->data );
					}
					
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					if( nname != NULL )
					{
						FHandler *actFS = (FHandler *)actDev->f_FSys;
						// check if its allowed to use char
						unsigned int i;
						FBOOL badCharFound = FALSE;
						
						for( i = 0 ; i < strlen( nname ) ; i++ )
						{
							CHECK_BAD_CHARS( nname, i, badCharFound );
							/*
							if( nname[ i ] == '/' || nname[ i ] == ':' || nname[ i ] == '\'' )
							{
								badCharFound = TRUE;
								break;
							}
							*/
						}
						
						if( badCharFound == FALSE )
						{
							DEBUG("[FSMWebRequest] Filesystem RENAME\n");
						
							FBOOL have = FSManagerCheckAccess( l->sl_FSM, origDecodedPath, actDev->f_ID, loggedSession->us_User, "--W---" );
							if( have == TRUE )
							{
								actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
								int error = actFS->Rename( actDev, origDecodedPath, nname );
								sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
						
								if( notify == TRUE )
								{
									char *notifPath = CutNotificationPath( origDecodedPath );
									if( notifPath != NULL )
									{
										DoorNotificationCommunicateChanges( l, loggedSession, actDev, notifPath );
										FFree( notifPath );
									}
								}
							
								// delete Thumbnails
								// ?module=system&command=thumbnaildelete&path=Path:to/filename&sessionid=358573695783
							
								int len = 512;
								len += strlen( origDecodedPath );
								char *command = FMalloc( len );
								if( command != NULL )
								{
									snprintf( command, len, "command=thumbnaildelete&path=%s&sessionid=%s", origDecodedPath, loggedSession->us_SessionID );
			
									DEBUG("Run command via php: '%s'\n", command );
									FULONG dataLength;

									char *data = l->sl_PHPModule->Run( l->sl_PHPModule, "modules/system/module.php", command, &dataLength );
									if( data != NULL )
									{
										if( strncmp( data, "ok", 2 ) == 0 )
										{
										}
										FFree( data );
									}
									FFree( command );
								}
							}
							else
							{
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
								snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
							}
						}
						else
						{
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_BAD_CHARS_USED], path );
							snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_BAD_CHARS_USED );
						}
						
						DEBUG("[FSMWebRequest] info command on FSYS: %s RENAME\n", actFS->GetPrefix() );
						
						HttpAddTextContent( response, tmp );
						
						FFree( nname );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/delete</H2>Delete file or directory
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to delete
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { response:0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					DEBUG("[FSMWebRequest] Filesystem DELETE\n");
					
					char tmp[ 256 ];
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					FBOOL have = TRUE;
					
					if( request->h_RequestSource == HTTP_SOURCE_FC && l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User )
					{
						have = FALSE;
					}
					else
					{
						have = FSManagerCheckAccess( l->sl_FSM, origDecodedPath, actDev->f_ID, loggedSession->us_User, "----D-" );
					}
					
					if( have == TRUE )
					{
						FLONG bytes = actFS->Delete( actDev, origDecodedPath );
						if( bytes >= 0 )
						{
							actDev->f_BytesStored -= bytes;
							if( actDev->f_BytesStored < 0 )
							{
								actDev->f_BytesStored = 0;
							}
							sprintf( tmp, "ok<!--separate-->{\"response\":\"%ld\"}", bytes );
							if( notify == TRUE )
							{
								// send information about changes on disk
								//DoorNotificationCommunicateChanges( l, loggedSession, actDev, origDecodedPath );
								char *notifPath = CutNotificationPath( origDecodedPath );
								if( notifPath != NULL )
								{
									DoorNotificationCommunicateChanges( l, loggedSession, actDev, notifPath );
									FFree( notifPath );
								}
							}
							// delete file in cache
							CacheUFManagerFileDelete( l->sl_CacheUFM, loggedSession->us_ID, actDev->f_ID, origDecodedPath );
							
							// delete Thumbnails
							// ?module=system&command=thumbnaildelete&path=Path:to/filename&sessionid=358573695783
							
							int len = 512;
							len += strlen( origDecodedPath );
							char *command = FMalloc( len );
							if( command != NULL )
							{
								snprintf( command, len, "command=thumbnaildelete&path=%s&sessionid=%s", origDecodedPath, loggedSession->us_SessionID );
			
								DEBUG("Run command via php: '%s'\n", command );
								FULONG dataLength;

								char *data = l->sl_PHPModule->Run( l->sl_PHPModule, "modules/system/module.php", command, &dataLength );
								if( data != NULL )
								{
									if( strncmp( data, "ok", 2 ) == 0 )
									{
									}
									FFree( data );
								}
								FFree( command );
							}
						}
						else
						{
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "Delete", bytes );
							snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						}
						DEBUG("[FSMWebRequest] info command on FSYS: %s DELETE\n", actFS->GetPrefix() );
					}
					else
					{
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
					}
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						 HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					HttpAddTextContent( response, tmp );
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/makedir</H2>Make directory in specified path
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path which will be used to generate directory
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { response:0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "makedir" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					DEBUG("[FSMWebRequest] Filesystem MAKEDIR: %s\n", path );
					
					char tmp[ 256 ];
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					char *lpath = UrlDecodeToMem( path );
					if( lpath != NULL )
					{
						FBOOL have = TRUE;
						FBOOL badCharFound = FALSE;
						int i, lastChar = 0;
						int plen = strlen( lpath );
						
						if( request->h_RequestSource == HTTP_SOURCE_FC && l->sl_Sentinel != NULL &&  loggedSession->us_User == l->sl_Sentinel->s_User )
						{
							have = FALSE;
						}
						else
						{
							have = FSManagerCheckAccess( l->sl_FSM, lpath, actDev->f_ID, loggedSession->us_User, "--W---" );
						}
						
						// we must get only file/dir name to check it
						for( i = 0 ; i < plen ; i++ )
						{
							if( lpath[ i ] == ':' || lpath[ i ] == '/' )
							{
								// file/dir name starts just after / or : sign
								lastChar = i + 1;
							}
						}
						
						// find "bad" chars in file/dir name
						for( i = lastChar ; i < plen ; i++ )
						{
							CHECK_BAD_CHARS( lpath, i, badCharFound );
							/*
							if( lpath[ i ] == '/' || lpath[ i ] == ':' || lpath[ i ] == '\'' )
							{
								badCharFound = TRUE;
								break;
							}
							*/
						}
						
						if( have == TRUE )
						{
							if( badCharFound == FALSE )
							{
								actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
								int error = actFS->MakeDir( actDev, lpath );
						
								if( error != 0 )
								{
									char dictmsgbuf1[ 196 ];
									snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "MakeDir", error );
									snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
								}
								else
								{
									sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
									DEBUG( "[FSMWebRequest] Makedir Notifying %s  pointer to SB %p\n", path, l );
									
									if( notify == TRUE )
									{
										char *notifPath = CutNotificationPath( origDecodedPath );
										if( notifPath != NULL )
										{
											DoorNotificationCommunicateChanges( l, loggedSession, actDev, notifPath );
											FFree( notifPath );
										}
										//DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
									}
								}
								HttpAddTextContent( response, tmp );
							}
							else	// bad chars
							{
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_BAD_CHARS_USED], path );
								snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_BAD_CHARS_USED );
							}
						}
						else
						{
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], lpath );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
							HttpAddTextContent( response, dictmsgbuf );
						}
						FFree( lpath );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/exec</H2>Execute file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to delete
				* @return response generated by file when success, otherwise error code
				*/
				/// @endcond
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
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING], "Execute" );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED_EMPTY_STRING );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/read</H2>Read or download file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to read
				* @param mode - (required) "rb" - read bytes, "rs" - read as stream
				* @param offset - offset from which file will be readed
				* @param bytes - number of bytes which you want to read
				* @param download - if set to 1 then whole file will be readed and no friend special header will be added
				* @return file content when success, otherwise error number
				*/
				/// @endcond
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
						unsigned int slen = strlen( origDecodedPath );
						for( i = 0; i < slen; i++ )
						{
							if( origDecodedPath[ i ] == '/' || origDecodedPath[ i ] == ':' )
							{
								namepos = i + 1;
							}
						}
						
						char escaped_filename[2*strlen(&origDecodedPath[namepos])]; //worst case assumption - filename is all quotes and everything has to be escaped

						string_escape_quotes(&origDecodedPath[namepos], escaped_filename);

						memset( temp, 0, sizeof( temp ) );
						snprintf( temp, sizeof( temp ), "attachment; filename=\"%s\"", escaped_filename);
						
						DEBUG("dOWNLOAD file path '%s' '%s'\n", &origDecodedPath[namepos], temp );
						
						response = HttpNewSimpleA( HTTP_200_OK, request,  
												   HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "application/octet-stream" ),
												   HTTP_HEADER_CONTENT_DISPOSITION, (FULONG)StringDuplicate( temp ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
												   TAG_DONE, TAG_DONE );
						
						if( fallbackMime != NULL )
						{
							FFree( fallbackMime );
						}
					}
					else
					{
						response = HttpNewSimpleA( HTTP_200_OK, request,  
												   HTTP_HEADER_CONTENT_TYPE, (FULONG)( fallbackMime ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
												   TAG_DONE, TAG_DONE );
					}
					
					FBOOL have = FSManagerCheckAccess( l->sl_FSM, origDecodedPath, actDev->f_ID, loggedSession->us_User, "-R----" );
					if( have == TRUE )
					{
						if( mode != NULL && strcmp( mode, "rs" ) == 0 )		// read stream
						{
							actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
							File *fp = (File *)actFS->FileOpen( actDev, origDecodedPath, mode );
						
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
							
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_OPEN_FILE], origDecodedPath );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_OPEN_FILE );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
					
						//
						// read only part of file
						//
					
						else if( mode != NULL && mode[0] == 'r' )
						{
							actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
							
							DEBUG( "[FSMWebRequest] Reading path: %s\n", origDecodedPath );
							File *fp = (File *)actFS->FileOpen( actDev, origDecodedPath, mode );
						
							if( fp != NULL )
							{
								int dataread = 0;
							
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
									//if( request->h_RequestSource == HTTP_SOURCE_WS )
									//{
									//	ListStringAdd( ls, "ok<!--separate-->", 17 );
									//}
									
									int readbytes = FS_READ_BUFFER;
									char *dataBuffer = FCalloc( readbytes, sizeof( char ) );
								
									if( dataBuffer != NULL )
									{
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
									
											if( dataread > 0 )
											{
												ListStringAdd( ls, dataBuffer, dataread );
												totalBytes += dataread;
											}
											else
											{
												break;
											}
										}
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
								
									char dictmsgbuf[ 256 ];
									snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILE_NOT_EXIST_OR_EMPTY] , DICT_FILE_NOT_EXIST_OR_EMPTY );
									HttpAddTextContent( response, dictmsgbuf );
								}
								
								ListStringDelete( ls );
							}
							else
							{
								HttpFree( response );
								response = NULL;
							
								response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
									HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
							
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_OPEN_FILE], path );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_OPEN_FILE );
								HttpAddTextContent( response, dictmsgbuf );
							}
							DEBUG("[FSMWebRequest] Open command on FSYS: %s called\n", actFS->GetPrefix() );
						}
						else
						{
							HttpFree( response );
							response = NULL;
						
							response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
								HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
						
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "mode" );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						HttpFree( response );
						response = NULL;
						
						response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
												   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
						
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/write</H2>Write data to file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to delete
				* @param mode - (required) "wb" - write binary
				* @param data - (required) data which will be stored in file
				* @param size - (required) number of bytes which will be stored in file
				* @param encoding - type of encoding, currently only "url" type is supported
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { FileDataStored : <number of bytes stored> } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "write" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					char *mode = NULL;
					char *fdata = NULL;
					int dataSize = 0;
					
					response = HttpNewSimpleA( 
						HTTP_200_OK, 
						request, 
						HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
						TAG_DONE, 
						TAG_DONE 
					);
					
					el = HashmapGet( request->parsedPostContent, "mode" );
					if( el == NULL ) el = HashmapGet( request->query, "mode" );
					if( el != NULL )
					{
						mode = (char *)el->data;
					}
					
					el =  HashmapGet( request->parsedPostContent, "data" );
					if( el == NULL ) el = HashmapGet( request->query, "data" );
					if( el != NULL && el->data != NULL )
					{
						fdata = (char *)UrlDecodeToMem( el->data );
					}
					
					el =  HashmapGet( request->parsedPostContent, "size" );
					if( el == NULL ) el = HashmapGet( request->query, "size" );
					if( el != NULL )
					{
						char *next;
						dataSize = (int)strtol((char *)el->data, &next, 0);
					}
					
					if( dataSize <= 0 && fdata != NULL )
					{
						dataSize = strlen( fdata );
					}
					
					// Urldecode if need 
					el = HashmapGet( request->parsedPostContent, "encoding" );
					//int flength = 0;
					if( !el ) el = HashmapGet( request->query, "encoding" );
					if( el && strcmp( el->data, "url" ) == 0 && fdata != NULL )
					{
						char *destf = UrlDecodeToMem( fdata );
						FFree( fdata );
						fdata = destf;
						// Change data size to fit new decoded data...
						dataSize = strlen( fdata );
					}
					
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					// TODO: Test UNSTABLE CODE
					/*// Base64 instead
					else if( el && strcmp( el->data, "base64" ) == 0 )
					{
					fdata = Base64Decode( fdata, strlen( fdata ), &flength );
				}
				int dataSize = flength > 0 ? flength : strlen( fdata );
				*/
					
					if( mode != NULL )
					{
						if( fdata != NULL )
						{
							FBOOL have = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "--W---" );
							if( have == TRUE )
							{
								actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
								
								File *fp = (File *)actFS->FileOpen( actDev, path, mode );
						
								if( fp != NULL )
								{
									int size = 0;
								
									dataSize = FileSystemActivityCheckAndUpdate( l, &(actDev->f_Activity), dataSize );
								
									size = actFS->FileWrite( fp, fdata, dataSize );
									actDev->f_BytesStored += size;
								
									if( size > 0 )
									{
										char tmp[ 128 ];
										sprintf( tmp, "ok<!--separate-->{ \"FileDataStored\" : \"%d\" }", size );
										HttpAddTextContent( response, tmp );
									}
									else
									{
										char dictmsgbuf[ 256 ];
										snprintf( dictmsgbuf, sizeof( dictmsgbuf ), 
											"fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", 
											l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , 
											DICT_CANNOT_ALLOCATE_MEMORY 
										);
										HttpAddTextContent( response, dictmsgbuf );
									}
									actFS->FileClose( actDev, fp );
							
									if( notify == TRUE )
									{
										char *notifPath = CutNotificationPath( origDecodedPath );
										if( notifPath != NULL )
										{	
											DoorNotificationCommunicateChanges( l, loggedSession, actDev, notifPath );
											FFree( notifPath );
										}
										//DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
									}
								}
								else
								{
									char dictmsgbuf[ 256 ];
									char dictmsgbuf1[ 196 ];
									snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_OPEN_FILE], path );
									snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_OPEN_FILE );
									HttpAddTextContent( response, dictmsgbuf );
								}
							}
							else
							{
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
						else
						{
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 256 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "data" );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "mode" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, dictmsgbuf );
					}
					
					FFree( fdata );
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/copy</H2>Copy file from one place to another
				*
				* @param sessionid - (required) session id of logged user
				* @param from - (required) path to source file
				* @param to - (required) path to destination path
				* @return { response: 0, Written: <number of bytes>} when success, otherwise error number
				*/
				/// @endcond
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
						
						File *dstrootf = GetFileByPath( loggedSession->us_User, &dstpath, topath );
						
						DEBUG("[FSMWebRequest] COPY from %s TO %s\n", path, topath );
						
						if( dstrootf != NULL )
						{
							FBOOL havesrc = FSManagerCheckAccess( l->sl_FSM, path, actDev->f_ID, loggedSession->us_User, "-R----" );
							
							if( havesrc == TRUE )
							{
								DEBUG("[FSMWebRequest] We have access to source: %s\n", path );
							
								FBOOL havedst = FSManagerCheckAccess( l->sl_FSM, dstpath, actDev->f_ID, loggedSession->us_User, "--W---" );
								if( havedst == TRUE )
								{
									dstrootf->f_Operations++;
							
									DEBUG("[FSMWebRequest] We have access to destination: %s\n", topath );
									
									dsthand = dstrootf->f_FSys;
									FHandler *actFS = (FHandler *)actDev->f_FSys;
									int rsize = 0;
							
									if( dstpath[ strlen( dstpath ) - 1 ] != '/' )	// simple copy file
									{
										DEBUG("[FSMWebRequest] Copy - executing file open on: %s to %s\n", path, topath );
										
										int64_t written = 0;
										int64_t readall = 0;
										
										actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
										File *rfp = (File *)actFS->FileOpen( actDev, path, "rb" );
										int closeError = 0;
										
										if( rfp != NULL )
										{
											dstrootf->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
											
											File *wfp = (File *)dsthand->FileOpen( dstrootf, dstpath, "w+" );
											
											if( wfp != NULL )
											{
												// Using a big buffer!
												char *dataBuffer = FCalloc( 524288, sizeof(char) );
												if( dataBuffer != NULL )
												{
													DEBUG("[FSMWebRequest] file/copy - files opened, copy in progress\n");
										
													int dataread = 0;
													int readTr = 0;

													while( ( dataread = actFS->FileRead( rfp, dataBuffer, 524288 ) ) > 0 )
													{
														if( request->h_ShutdownPtr != NULL &&  *(request->h_ShutdownPtr) == TRUE )
														{
															break;
														}
													
														readall += dataread;
													
														if( dataread > 0 )
														{
															int bytes = 0;
														
															dataread = FileSystemActivityCheckAndUpdate( l, &(dstrootf->f_Activity), dataread );

															bytes = dsthand->FileWrite( wfp, dataBuffer, dataread );

															written += bytes;

															dstrootf->f_BytesStored += bytes;
															
															readTr = 0;
														}
														else
														{
															readTr++;
															if( readTr > 25 )
															{
																DEBUG("Cannot read data from source!\n");
																break;
															}
														}
													}
													FFree( dataBuffer );
												}
												else
												{
													DEBUG( "[FSMWebRequest] We could not do anything with the bad file pointers..\n" );
												}
												closeError = dsthand->FileClose( dstrootf, wfp );
											}
											
											DEBUG( "[FSMWebRequest] Wrote %lu bytes. Read: %lu. Read file pointer %p. Write file pointer %p.\n", written, readall, rfp, wfp );
											
											actFS->FileClose( actDev, rfp );
										}
								
										char tmp[ 128 ];
										if( closeError != 0 )
										{
											sprintf( tmp, "fail<!--separate-->{ \"response\": \"0\", \"Written\": \"%lu\",\"Error\":\"%d\"}", written, closeError );
										}
										else
										{
											sprintf( tmp, "ok<!--separate-->{ \"response\": \"0\", \"Written\": \"%lu\"}", written );
										}

										HttpAddTextContent( response, tmp );
									}
									else		// make directory
									{
										DEBUG("[FSMWebRequest] On copy, make dir first: %s\n", topath );
										
										FHandler *dsthand = (FHandler *)dstrootf->f_FSys;

										char tmp[ 128 ];
								
										// cutting device name
										unsigned int i;
										for( i=0 ; i < strlen( topath ); i++ )
										{
											if( topath[ i ] == '/' )
											{
												topath += i+1;
												break;
											}
										}
								
										dstrootf->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
										int error = dsthand->MakeDir( dstrootf, topath );
										sprintf( tmp, "ok<!--separate-->{ \"response\": \"%d\"}", error );
								
										HttpAddTextContent( response, tmp );
									}
							
									dstrootf->f_Operations--;
									
									int len = 512;
									len += strlen( topath );
									char *command = FMalloc( len );
									if( command != NULL )
									{
										snprintf( command, len, "command=thumbnaildelete&path=%s&sessionid=%s", topath, loggedSession->us_SessionID );
			
										DEBUG("Run command via php: '%s'\n", command );
										FULONG dataLength;

										char *data = l->sl_PHPModule->Run( l->sl_PHPModule, "modules/system/module.php", command, &dataLength );
										if( data != NULL )
										{
											if( strncmp( data, "ok", 2 ) == 0 )
											{
											}
											FFree( data );
										}
										FFree( command );
									}
								}
								else
								{
									char dictmsgbuf[ 256 ];
									char dictmsgbuf1[ 196 ];
									snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], dstpath );
									snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
									HttpAddTextContent( response, dictmsgbuf );
								}
							}
							else
							{
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 196 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_NO_ACCESS_TO], path );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_NO_ACCESS_TO );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
						else
						{
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 196 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_DEVICE_NOT_FOUND], dstpath );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_DEVICE_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "to" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}	// file copy
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/upload</H2>Upload file to Friend drive
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path where file will be uploaded
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { Uploaded files: <number>} when success, otherwise error number
				*/
				/// @endcond
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
					
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					if( ( tmpPath = ( char * )FCalloc( strlen(path) + 2048, sizeof(char) ) ) != NULL )
					{
						HttpFile *file = request->h_FileList;
						FBOOL fileNameIsTmpPath = FALSE;
						
						DEBUG("File %p\n", file );
						if( file != NULL )
						{
							// Mind situations where hf_FileName is uploaded filename, where
							// path has target filename built in..
							if( file->hf_FileName[0] != 0 && strlen( file->hf_FileName ) > 5 )
							{
								char *tmpF = FCalloc( 1, 6 );
								sprintf( tmpF, "%.*s", 5, file->hf_FileName );
								fileNameIsTmpPath = strcmp( tmpF, "/tmp/" ) == 0 ? TRUE : FALSE;
								FFree( tmpF );
							}
						}
						
						while( file != NULL )
						{
							DEBUG("Going throug files\n");
							if( targetPath )
							{
								sprintf( tmpPath, "%s", targetPath );
							}
							else if( !fileNameIsTmpPath )
							{
								char *t = UrlDecodeToMem( file->hf_FileName );
								if( t != NULL )
								{
									DEBUG("[FileSaved as: %s\n", file->hf_FileName );
									sprintf( tmpPath, "%s%s", path, t );
									FFree( t );
								}
								else
								{
									sprintf( tmpPath, "%s", path );
								}
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
							
							// if there is upload to not existing Downloads folder, FriendCore must create it
							// https://app.yodiz.com/plan/pages/board.vz?cid=33486#/app/tk-1465
							DEBUG("original path: %s\n", originalPath );
							if( strncmp( originalPath, "Home:Downloads/", 15 ) == 0 )
							{
								BufString *bs = NULL;
								DEBUG("User want to upload file into Home:Downloads\n");
								bs = actFS->Info( actDev, originalPath );
								if( bs != NULL )
								{
									DEBUG("Got response from file system: %s response: %s\n", tmpPath, bs->bs_Buffer );
									// seems directory do not exist, FriendCore must create it
									if( strncmp( bs->bs_Buffer, "fail", 4 ) == 0 )
									{
										int err = actFS->MakeDir( actDev, "Downloads" );
										DEBUG("Makedir called, response: %d\n", err );
									}
									BufStringDelete( bs );
								}
							}
							
							DEBUG( "[FSMWebRequest] Trying to save file %s (path: %s, devname: %s)\n", dstPath, path, devname );
							
							FBOOL have = FSManagerCheckAccess( l->sl_FSM, tmpPath, actDev->f_ID, loggedSession->us_User, "--W---" );
							if( have == TRUE )
							{
								actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
								
								File *fp = (File *)actFS->FileOpen( actDev, tmpPath, "wb" );
								if( fp != NULL )
								{
									FULONG bytes = 0;
									
									int size = FileSystemActivityCheckAndUpdate( l, &(actDev->f_Activity), file->hf_FileSize );
									bytes = actFS->FileWrite( fp, file->hf_Data, size );
									actDev->f_BytesStored += bytes;

									actFS->FileClose( actDev, fp );
								
									uploadedFiles++;
								}
								else
								{
									Log( FLOG_ERROR, "Cannot open file to store %s , user: %s\n", path, loggedSession->us_User->u_Name );
								}
							}
							else
							{
								Log( FLOG_ERROR, "No access to: %s, user: %s\n", tmpPath, loggedSession->us_User->u_Name );
							}
							file = (HttpFile *) file->node.mln_Succ;
						} // while, goging through file bytes
						
						FFree( tmpPath );
					}
					else
					{
						FERROR("Cannot allocate memory for path buffer\n");
					}
					
					if( uploadedFiles > 0 )
					{
						char tmp[ 256 ];
						sprintf( tmp, "ok<!--separate-->{ \"Uploaded files\": \"%d\"}", uploadedFiles );
						HttpAddTextContent( response, tmp );
						*result = 200;
					}
					else
					{
						char tmp[ 256 ];
						sprintf( tmp, "fail<!--separate-->{ \"Uploaded files\": \"%d\"}", uploadedFiles );
						HttpAddTextContent( response, tmp );
						*result = 200;
					}
					
					if( notify == TRUE )
					{
						char *notifPath = CutNotificationPath( origDecodedPath );
						if( notifPath != NULL )
						{
							DoorNotificationCommunicateChanges( l, loggedSession, actDev, notifPath );
							FFree( notifPath );
						}
						//DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
					}
					
					DEBUG("[FSMWebRequest] Upload done\n");
				}		// file/upload
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/diskinfo</H2>Get information aboutdisk
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path with device name
				* @return { Disksize: \<size of disk in bytes\>, StoredBytes: \<user disk space\> } when success, otherwise error number
				*/
				/// @endcond

				else if( strcmp( urlpath[ 1 ], "diskinfo" ) == 0 )
				{
					FHandler *actFS = (FHandler *)actDev->f_FSys;
					response = HttpNewSimpleA(
						HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
						TAG_DONE, TAG_DONE 
					);
					
					
					int64_t size = 0;
					int64_t used = 0;
					
					int err = actFS->GetDiskInfo( actDev, &used, &size );
					
					char tmp[ 256 ];
					sprintf( tmp, "ok<!--separate-->{ \"disksize\": \"%lu\",\"storedbytes\": \"%lu\"}", size, used );
					HttpAddTextContent( response, tmp );
					*result = 200;
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/expose</H2>Share file (make this file avaiable from outside)
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to share
				* @return {hash:\<generated hash\>, name:\<name of shared file\> } when success, otherwise error number
				*/
				/// @endcond
				#define SHARING_BUFFER_SIZE 10240
				
				else if( strcmp( urlpath[ 1 ], "expose" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					char userid[ 512 ];
					char name[ 256 ];
					char dstfield[10];
					
					strcpy( dstfield, "Public" );
					
					{
						int i = strlen( path );

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
					char hashmap[ 512 ];
					hashmap[ 0 ] = 0;

					//char *checkquery = NULL;
					char *fortestpurp = FMalloc( 2048 ); //[ 2048 ];
					snprintf( fortestpurp, 2048, "%s:%s", devname, path );
					
					char *dest = UrlDecodeToMem( path );
					
					SQLLibrary *sqllib = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						int qsize = 512 + strlen( dest );

						char *qery = FMalloc( qsize );
						//qery[ 1024 ] = 0;
						sqllib->SNPrintF( sqllib, qery, qsize, "SELECT Hash FROM FFileShared where `UserID`='%ld' AND `Path`='%s:%s'", loggedSession->us_User->u_ID, devname, dest );
						void *res = sqllib->Query( sqllib, qery );
						if( res != NULL )
						{
							char **row;
							if( ( row = sqllib->FetchRow( sqllib, res ) ) )
							{
								if( row[ 0 ] != NULL )
								{
									strcpy( hashmap, row[ 0 ] );
								}
							}
							sqllib->FreeResult( sqllib, res );
						}
						
						// if entry do not exist in database
						if( hashmap[ 0 ] == 0 )
						{
							FileShared *tmpfs = FileSharedNew( fortestpurp, name );

							if( tmpfs != NULL )
							{
								tmpfs->fs_IDUser = loggedSession->us_User->u_ID;
						
								tmpfs->fs_DeviceName = StringDuplicate( devname );
						
								tmpfs->fs_DstUsers = StringDuplicate( dstfield );
						
								// Make a unique hash
								char tmp[ 512 ];
								snprintf( tmp, sizeof(tmp), "%s%d%d%d", path, rand() % 999, rand() % 999, rand() % 999 );
								StrToMD5Str( hashmap, 512, tmp, strlen( tmp ) );
								tmpfs->fs_Hash = StringDuplicate( hashmap );
								tmpfs->fs_CreatedTime = time( NULL );
								/*
								struct tm* ti;
								ti = localtime( &(tmpfs->fs_CreatedTime) );
								tmpfs->fs_CreateTimeTM.tm_year = ti->tm_year + 1900;
								tmpfs->fs_CreateTimeTM.tm_mon = ti->tm_mon;
								tmpfs->fs_CreateTimeTM.tm_mday = ti->tm_mday;
							
								tmpfs->fs_CreateTimeTM.tm_hour = ti->tm_hour;
								tmpfs->fs_CreateTimeTM.tm_min = ti->tm_min;
								tmpfs->fs_CreateTimeTM.tm_sec = ti->tm_sec;
								*/
								if( sqllib->Save( sqllib, FileSharedTDesc, tmpfs ) == 0 )
								{
									sharedFile = TRUE;
								}
								else
								{
									Log( FLOG_ERROR, "Cannot store hash in FFileShared. Hash: %s Path %s\n", hashmap, path );
								}
								
								FileSharedDeleteAll( tmpfs );
							}
							else
							{
								FERROR("Cannot allocate memory for shared file!\n");
							}
						}
						else
						{
							alreadyExist = TRUE;
						}
						
						l->LibrarySQLDrop( l, sqllib );
						FFree( qery );
					}

					int size = 0;
					char *tmp = FMalloc( 2048 );
					if( sharedFile == TRUE )
					{
						size = snprintf( tmp, 2048, "ok<!--separate-->{\"hash\":\"%s\", \"name\":\"%s\" }", hashmap, name );
					}
					else if( alreadyExist == TRUE )
					{
						size = snprintf( tmp, 2048, "ok<!--separate-->{\"hash\":\"%s\", \"name\":\"%s\" }", hashmap, name );
					}
					else
					{
						size = snprintf( tmp, 2048, "fail<!--separate-->{ \"response\": \"%s\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_SHARE_FILE] );
					}
					
					DEBUG("RESPONSE : '%s'\n", tmp );
					
					HttpSetContent( response, tmp, size );
					*result = 200;
					
					if( dest != NULL )
					{
						FFree( dest );
					}
					FFree( fortestpurp );
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/conceal</H2>Unshare file (make this file not avaiable from outside)
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which you want to share
				* @return { response: } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "conceal" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					
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
						
						l->LibrarySQLDrop( l, sqllib );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/checkaccess</H2>Check if actual user have access to file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which access rights you want to check
				* @return { Result: access } when success, otherwise error number
				*/
				/// @endcond
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
					else
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"forbidden\"}" );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/access</H2>Get file access rights
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file which access rights you want to check
				* @return file access rights when success, otherwise error number
				*/
				/// @endcond
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
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/protect</H2>Protect file, directory or drive
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file on which access rights will be set
				* @param user - access rights for file owner (ARWED string)
				* @param group - access rights for user groups
				* @param other - access rights for others
				* @return { Result: access } when success, otherwise error number
				*/
				/// @endcond
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
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_CHANGE_ACCESS], err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_CHANGE_ACCESS );
						HttpAddTextContent( response, dictmsgbuf );
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
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/notificationstart</H2>Create new notification. When notification is set on path and event will appear on it then user will get notification.
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file or directory on which notification will be set
				* @param id - notification id, if its set then FC is trying to update notification instead of create new one
				* @return { Result: 0} when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "notificationstart" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
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
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 256 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_UPDATE_DOOR_NOTIFICATION], retVal );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_UPDATE_DOOR_NOTIFICATION );
							HttpAddTextContent( response, dictmsgbuf );
						}
						HttpAddTextContent( response, answer );
						
						l->LibrarySQLDrop( l, sqllib );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/notificationremove</H2>Delete notification.
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to directory or file where you are
				* @param id - notification id which you want to remove
				* @return { Result: 0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "notificationremove" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
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
								HttpAddTextContent( response, answer );
							}
							else
							{
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 256 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_ENTRY_CANNOT_BE_REMOVED], id );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_ENTRY_CANNOT_BE_REMOVED );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
						else
						{
							char dictmsgbuf[ 256 ];
							char dictmsgbuf1[ 256 ];
							snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
							HttpAddTextContent( response, dictmsgbuf );
						}
						
						l->LibrarySQLDrop( l, sqllib );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/notifychanges</H2>Send notification to all UserSessions which set notification on path
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file
				* @return { Result: 0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "notifychanges" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
						HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					int error = DoorNotificationCommunicateChanges( l, loggedSession, actDev, origDecodedPath );
					//int error = DoorNotificationCommunicateChanges( l, loggedSession, actDev, path );
					
					if( error == 0 )
					{
						HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Notifications sent\"}" );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_SEND_NOTIFICATION], error );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_CANNOT_SEND_NOTIFICATION );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/compress</H2>Compress files and folders
				*
				* @param sessionid - (required) session id of logged user
				* @param files - (required) path to files or directories which you want to archive. Entries must be separated by semicolon
				* @param archiver - (required) type or archivizer. Currently only zip is supported
				* @param destination - (required) path to place where archive will be stored 
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { Result: 0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "compress" ) == 0 )
				{
					char *archiver = NULL;
					char *archpath = NULL;
					char *files    = NULL;
					char *source   = NULL;
					
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
					
					// source directory
					el = HttpGetPOSTParameter( request, "source" );
					if( el == NULL ) el = HashmapGet( request->query, "source" );
					if( el != NULL )
					{
						source = UrlDecodeToMem( (char *)el->data );
					}
					
					// Where archive should be stored
					el = HttpGetPOSTParameter( request, "destination" );
					if( el == NULL ) el = HashmapGet( request->query, "destination" );
					if( el != NULL )
					{
						archpath = UrlDecodeToMem( (char *)el->data );
					}
					
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					if( archiver != NULL && files != NULL && archpath != NULL && source != NULL )
					{
						//DEBUG("\n\n\n\n\n\n\n\nORIGINAL PATH: %s archpath %s\n\n\n\n\n\n", path, archpath );
						{
							char *dirname = FCalloc( 1024, sizeof(char) );
							snprintf( dirname, 1024, "%s%s_decomp_%d%d", DEFAULT_TMP_DIRECTORY, loggedSession->us_SessionID, rand()%9999, rand()%9999 );

							mkdir( dirname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
							char *dstname = FCalloc( 1024, sizeof(char) );
							snprintf( dstname, 1024, "%s.target/", dirname );
						
							mkdir( dstname, S_IRWXU|S_IRWXG|S_IROTH|S_IXOTH );
						
							char *tmpfilename = FCalloc( 1024, sizeof(char) );
							snprintf( tmpfilename, 1024, "%s/%d%d.zip", dirname, rand()%9999, rand()%9999 );

							DEBUG("[FSMWebRequest] COMPRESS dirname %s dstname %s tmpfilename %s\n", dirname, dstname, tmpfilename );

							int numberOfFiles = 0;
							request->h_SB = l;
							int error = FileDownloadFilesOrFolder( request, loggedSession, source, dstname, files, &numberOfFiles );
						
							if( strcmp( archiver, "zip" ) == 0 )
							{
								char *command = FCalloc( 2048, sizeof(char) );
							
								ZLibrary *zlib = l->LibraryZGet( l );
								if( zlib != NULL )
								{
									int compressedFiles = zlib->Pack( zlib, tmpfilename, dstname, strlen( dstname ), NULL, request, numberOfFiles );
									
									DEBUG("[FSMWebRequest] pack archive %s to %s pack fnct poiter %p, compressed files %d all files will go to: %s\n", tmpfilename, dstname, zlib->Pack, compressedFiles, archpath );

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
											actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
											
											File *fp = (File *)fsys->FileOpen( dstdevice, archpath, "wb" );
											if( fp != NULL )
											{
												int bufferSize = 0;
												while( ( bufferSize = fread( buffer, 1, 32768, readfile ) ) > 0 )
												{
													int stored = 0;
													
													bufferSize = FileSystemActivityCheckAndUpdate( l, &(dstdevice->f_Activity), bufferSize );
													stored = fsys->FileWrite( fp, buffer, bufferSize );
													dstdevice->f_BytesStored += stored;
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
											
												{
													/*
													char *notifPath = CutNotificationPath( archpath );
													if( notifPath != NULL )
													{
														if( notify == TRUE )
														{
															DoorNotificationCommunicateChanges( l, loggedSession, dstdevice, notifPath );
														}
														FFree( notifPath );
													}
													*/
													if( notify == TRUE )
													{
														int err2 = DoorNotificationCommunicateChanges( l, loggedSession, dstdevice, archpath );
													}
												}
											
												HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": 0 }" );
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
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "archiver" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, dictmsgbuf );
					}
					
					// Clean up memory
					if( archiver != NULL )
					{
						FFree( archiver );
					}
					
					if( source != NULL )
					{
						FFree( source );
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
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/decompress</H2>Decompress file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to place where archive will be decompressed
				* @param archiver - (required) type or archivizer. Currently only zip is supported
				* @param notify - send notification to other sessions/user about changes (by default set to true, set false to disable this)
				* @return { Result: 0 } when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "decompress" ) == 0 )
				{
					char *archiver = NULL;
					
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					el = HttpGetPOSTParameter( request, "archiver" );
					if( el == NULL ) el = HashmapGet( request->query, "archiver" );
					if( el != NULL )
					{
						archiver = (char *)el->data;
					}
					
					FBOOL notify = TRUE;
					el = HttpGetPOSTParameter( request, "notify" );
					if( el == NULL ) el = HashmapGet( request->query, "notify" );
					if( el != NULL )
					{
						if( el->data != NULL )
						{
							if( strcmp( (char *)el->data, "false" ) == 0 )
							{
								notify = FALSE;
							}
						}
					}
					
					DEBUG("[FSMWebRequest] decompress %s\n", archiver );
					
					if( archiver != NULL )
					{
						//char dirname[ 756 ];
						char *dirname = FCalloc( 1024, sizeof(char ) );
						snprintf( dirname, 1024, "%s%s_decomp_%d%d", DEFAULT_TMP_DIRECTORY, loggedSession->us_SessionID, rand()%9999, rand()%9999 );
						
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
								actDev->f_SessionIDPTR = loggedSession->us_User->u_MainSessionID;
								
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
								char dictmsgbuf[ 256 ];
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
								HttpAddTextContent( response, dictmsgbuf );
							}
							fclose( localfp );
							
							DEBUG("[FSMWebRequest] Archive readed, bytes %d\n", readbytes );
							
							// archive was stored on disk
							
							int filesExtracted = 0;
							
							if( readbytes > 0 )
							{
								char command[ 2048 ];
								command[ 0 ] = 0;
								
								DEBUG("[FSMWebRequest] arch '%s' archsize %d  comp to '%s'\n", archiver, (int) strlen( archiver ), "zip" );
								
								if( strcmp( archiver, "zip" ) == 0 )
								{
									ZLibrary *zlib = l->LibraryZGet( l );
									if( zlib != NULL )
									{
										filesExtracted = zlib->Unpack( zlib, tmpfilename, dstname, NULL, request );
									 
										DEBUG("[FSMWebRequest] Unpack files extracted %d\n", filesExtracted );
									 
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
								
									if( notify == TRUE )
									{
										int dsttmpLen = strlen( dsttmp );
										char *dsttmpDup = FCalloc( dsttmpLen+16, sizeof(char) );// StringDuplicate( dsttmp );
										if( dsttmpDup != NULL )
										{
											strcpy( dsttmpDup, dsttmp );
											if( dsttmpDup[ dsttmpLen-1 ] != '/' )
											{
												dsttmpDup[ dsttmpLen ] = '/';
											}
											int err2 = DoorNotificationCommunicateChanges( l, loggedSession, actDev, dsttmpDup );
											FFree( dsttmpDup );
										}
									}
									FFree( dsttmp );
								}
								
								HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": 0 }" );
							}
							else
							{
								char dictmsgbuf[ 256 ];
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILE_NOT_EXIST_OR_EMPTY] , DICT_FILE_NOT_EXIST_OR_EMPTY );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
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
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 256 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "archiver" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/infoget</H2>Get metadata from file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file or directory from which you want to get metadata
				* @param key - (required) key name
				* @return metadata in JSON format when success, otherwise error number
				*/
				/// @endcond
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
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 256 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING], "infoget" );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED_EMPTY_STRING );
								HttpAddTextContent( response, dictmsgbuf );
							}
							
							FFree( key );
						}
						else
						{
							char buffer[ 256 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "key" );
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
							HttpAddTextContent( response, buffer );
						}
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
				}
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/infoset</H2>Set metadata on file
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file or directory on which you want to set metadata
				* @param key - (required) key name
				* @param value - (required) data which will be stored inside the key
				* @return { Result: Info Set for file"} when success, otherwise error number
				*/
				/// @endcond
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
								char dictmsgbuf[ 256 ];
								char dictmsgbuf1[ 256 ];
								snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "infoset", error );
								snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
								HttpAddTextContent( response, dictmsgbuf );
							}
						}	// actfs != NULL
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
							HttpAddTextContent( response, dictmsgbuf );
						}
					}
					else
					{
						char buffer[ 256 ];
						char buffer1[ 256 ];
						snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "key, value" );
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
						HttpAddTextContent( response, buffer );
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
								HttpAddTextContent( response,  "ok<!--separate-->{ \"Result\": \"Information was set.\"}" );
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
				
				/// @cond WEB_CALL_DOCUMENTATION
				/**
				*
				* <HR><H2>system.library/file/getmodifydate</H2>Get file or directory modification date
				*
				* @param sessionid - (required) session id of logged user
				* @param path - (required) path to file or directory from which modification date will be taken
				* @return { modifytime: \<date\>} when success, otherwise error number
				*/
				/// @endcond
				else if( strcmp( urlpath[ 1 ], "getmodifydate" ) == 0 )
				{
					response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
											   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
					
					DEBUG("[FSMWebRequest] Get modify date\n");
					
					FHandler *actFS = (FHandler *)actDev->f_FSys;

					if( actFS != NULL )
					{
						char msg[ 512 ];
						FLONG tim = actFS->GetChangeTimestamp( actDev, origDecodedPath );
						
						snprintf( msg, sizeof(msg), "{ \"modifytime\": \"%ld\"}", tim );

						HttpAddTextContent( response,  msg );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FILESYSTEM_NOT_FOUND] , DICT_FILESYSTEM_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
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
					
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_FUNCTION_NOT_FOUND] , DICT_FUNCTION_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			}		// device not found
			else
			{
				response = HttpNewSimpleA( HTTP_200_OK, request,  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( DEFAULT_CONTENT_TYPE, 24 ),
										   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
				
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_DEVICE_NOT_FOUND], devname );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_DEVICE_NOT_FOUND );
				HttpAddTextContent( response, buffer );
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
