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
 *  SystemBase web functionality
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#include <core/types.h>
#include <core/library.h>
#include "systembase.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <dirent.h> 
#include <stdio.h> 
#include <unistd.h>
#include <system/services/service_manager.h>
#include <system/services/services_manager_web.h>
#include <system/service/service_manager_web.h>
//#include <interface/properties_interface.h>
#include <ctype.h>
#include <magic.h>
#include "web_util.h"
#include <network/websocket_client.h>
#include <system/fsys/device_handling.h>
#include <core/functions.h>
#include <util/md5.h>
#include <network/digcalc.h>
#include <network/mime.h>
#include <system/invar/invar_manager.h>
#include <system/application/application_web.h>
#include <system/user/user_manager.h>
#include <system/fsys/fs_manager.h>
#include <system/fsys/fs_manager_web.h>
#include <system/fsys/fs_remote_manager_web.h>
#include <core/pid_thread_web.h>
#include <system/fsys/device_manager_web.h>
#include <hardware/usb/usb_device_web.h>
#include <system/fsys/door_notification.h>
#include <system/admin/admin_web.h>
#include <system/connection/connection_web.h>
#include <system/token/token_web.h>
#include <system/dictionary/dictionary.h>
#include <system/mobile/mobile_web.h>
#include <system/usergroup/user_group_manager_web.h>
#include <system/notification/notification_manager_web.h>
#include <system/sas/sas_manager.h>
#include <system/sas/sas_web.h>
#include <system/service/service_manager_web.h>
#include <strings.h>

#define LIB_NAME "system.library"
#define LIB_VERSION 		1
#define LIB_REVISION		0
#define CONFIG_DIRECTORY	"cfg/"

//test
#undef __DEBUG

//
//
//

extern int UserDeviceMount( SystemBase *l, User *usr, int force, FBOOL unmountIfFail, char **err, FBOOL notify );


/**
 * Get all parameters from Http request and conver them to string
 *
 * @param request Http request
 * @param loggedSession pointer to logged user session
 * @param returnedAsFile pointer to boolean value with information if parameter is passed via FILE instead of argument
 * @return pointer to memory where arguments are stored
 */

char *GetArgsAndReplaceSession( Http *request, UserSession *loggedSession, FBOOL *returnedAsFile )
{
	//FILE *log = fopen( "debugfile.txt", "wb" );
	// Send both get and post
	int size = 0;

	FBOOL both = request->http_Content && request->http_Uri && request->http_Uri->uri_QueryRaw ? TRUE : FALSE;
	if( request->http_Content != NULL ) size += strlen( request->http_Content );
	if( request->http_Uri && request->http_Uri->uri_QueryRaw != NULL ) size += strlen( request->http_Uri->uri_QueryRaw );
	char *allArgsNew = NULL;
	
	//fprintf( log, " CONTENT : %s\n\n\n\n\n", request->content );
	
	INFO("\t\t--->request->content %s raw %s len %d\n\n", request->http_Content, request->http_Uri ? request->http_Uri->uri_QueryRaw : "", size );
	
	if( size <= 0 )
	{
		FERROR("No content or uri!\n");
		return NULL;
	}
	
	int fullsize = size + ( both ? 2 : 1 );
	
	if( request->http_ContentType == HTTP_CONTENT_TYPE_APPLICATION_JSON )
	{
		fullsize += (int)request->http_ContentLength;
	}
	
	char *allArgs = FCallocAlign( fullsize, sizeof(char) );
	if( allArgs != NULL )
	{
		allArgsNew = FCallocAlign( fullsize + 100, sizeof(char) );
	
		if( both == TRUE )
		{
			if( request->http_ContentType == HTTP_CONTENT_TYPE_APPLICATION_JSON )
			{
				sprintf( allArgs, "%s", request->http_Uri->uri_QueryRaw );
			}
			else
			{
				sprintf( allArgs, "%s&%s", request->http_Content, request->http_Uri->uri_QueryRaw );
			}
		}
		else if( request->http_Content )
		{
			if( request->http_ContentType == HTTP_CONTENT_TYPE_APPLICATION_JSON )
			{
				
			}
			else
			{
				sprintf( allArgs, "%s", request->http_Content );
			}
		}
		else
		{
			sprintf( allArgs, "%s", request->http_Uri->uri_QueryRaw );
		}
		
		if( allArgsNew == NULL )
		{
			FFree( allArgs );
			return NULL;
		}
	
		// application/json are used to communicate with another tools like onlyoffce
		char *sessptr = NULL;
		if( request->http_ContentType != HTTP_CONTENT_TYPE_APPLICATION_JSON )
		{
			int add = 0;
			// Check in the middle of the query
			sessptr = strstr( allArgs, "&sessionid=" );
			
			// If not check first part of the query
			if( sessptr == NULL )
			{
				sessptr = strstr( allArgs, "sessionid=" );
				if( sessptr != NULL )
				{
					add = 10;
				}
			}
			else
			{
				add = 11;
			}
			
			DEBUG("Sessptr !NULL\n");
			{
				memcpy( allArgsNew, allArgs, fullsize );
			}
			
			//fprintf( log, "\n\n\n\n\n\n\n\nSIZE ALLAGRS %lu  ALLARGSNEW %lu\n\n\n\n\n\n", strlen( allArgs ), strlen( allArgsNew ) );
		}
		else
		{
			strcpy( allArgsNew, allArgs );
		}
		DEBUG("REquest source: %d\n", request->http_RequestSource );
		
		// get values from POST 
		
		if( request->http_RequestSource == HTTP_SOURCE_HTTP && request->http_ParsedPostContent != NULL )
		{
			Hashmap *hm = request->http_ParsedPostContent;
			unsigned int i = 0;
			FBOOL quotationFound = FALSE;
			//fprintf( log, "AllAgrsNew : '%s'\n\n fter parsing headers, contentType: %d\n", allArgsNew, request->h_ContentType );
			//fprintf( log, "AllAgrs : '%s'\n", allArgs );
			//fprintf( log, "Now POST parameters will be added module request. Number of post parameters '%d'\n", hm->table_size );
			
			if( strstr( allArgsNew, "?" ) != NULL )
			{
				quotationFound = TRUE;
			}
			
			DEBUG("Before for\n");
			for( ; i < hm->hm_TableSize; i++ )
			{
				if( hm->hm_Data[ i ].hme_InUse == TRUE && hm->hm_Data[ i ].hme_Key != NULL && hm->hm_Data[ i ].hme_Data != NULL )
				{
					// if parameter was not passed, it must be taken from POST
					if( strstr( allArgsNew, hm->hm_Data[ i ].hme_Key ) == NULL )
					{
						DEBUG("Parameter not found, FC will use one from POST: %s\n", hm->hm_Data[ i ].hme_Key );
						int size = 10 + strlen( hm->hm_Data[ i ].hme_Key ) + strlen ( hm->hm_Data[ i ].hme_Data );
						char *buffer;
						
						if( ( buffer = FCalloc( size, sizeof(char) ) ) != NULL )
						{
							if( quotationFound == TRUE )
							{
								sprintf( buffer, "&%s=%s", hm->hm_Data[ i ].hme_Key, (char *)hm->hm_Data[ i ].hme_Data );
							}
							else
							{
								sprintf( buffer, "?%s=%s", hm->hm_Data[ i ].hme_Key, (char *)hm->hm_Data[ i ].hme_Data );
								quotationFound = TRUE;
							}
							
							DEBUG("Added param '%s'\n", buffer );
							strcat( allArgsNew, buffer );
							FFree( buffer );
						}
					}
				}
			}
			DEBUG("After for\n");
		}
		FFree( allArgs );
	}
	//fclose( log );
	DEBUG("Before fullsize>3096\n");
	
	if( fullsize > 3096 )
	{
		*returnedAsFile = TRUE;
		// if message is too big, allocate memory for filename
		char *tmpFileName = FMalloc( 1024 );
		FILE *fp;
		
		while( TRUE )
		{
			FILE *f;
			int tr = 100;
			int len = snprintf( tmpFileName, 1024, "/tmp/Friendup/_phpcommand_%d%d.%lu", rand()%9999, rand()%9999, time(NULL) );
			// if file doesnt exist we can create new one
			if( ( f = fopen( tmpFileName, "rb" ) ) == NULL )
			{
				//DEBUG("File not found\n");
				// new file created, we can store all parameters there
				fp = fopen( tmpFileName, "wb" );
				if( fp != NULL )
				{
					//DEBUG("File created\n");
					fwrite( allArgsNew, 1, strlen( allArgsNew ), fp );
					fclose( fp );
					FFree( allArgsNew );
					int len2 = len + 128;
					// we are returning now name of the file which contain all parameters
					allArgsNew = FMalloc( len2 );
					if( allArgsNew != NULL )
					{
						snprintf( allArgsNew, len2, MODULE_FILE_CALL_STRING, tmpFileName );
					}
					break;
				}
				else
				{
					DEBUG("Cannot create file: %s\n", tmpFileName );
				}
				
				tr--;
				if( tr <= 0 )
				{
					FERROR("Cannot create file, check access\n");
					break;
				}
			}
			else
			{
				fclose( f );
			}
		}
		
		FFree( tmpFileName );
		
		/*
		int len = strlen( "fail<!--separate-->{\"message\":\"Max length of varargs exceeded\",\"response\":-1}" );
		allArgsNew = FMalloc( len+16 );
		if( allArgsNew != NULL )
		{
			strncpy( allArgsNew, "fail<!--separate-->{\"message\":\"Max length of varargs exceeded\",\"response\":-1}", len );
		}
		return allArgsNew;
		*/
	}
	else
	{
		*returnedAsFile = FALSE;
	}
	DEBUG("End all args new\n");
	
	return allArgsNew;
}



/**
 * Network handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @return http response
 */

Http *SysWebRequest( SystemBase *l, char **urlpath, Http **request, UserSession *loggedSession, int *result )
{
	// Just calculate when
	int requestStart = GetUnixTime();

	*result = 0;
	Http *response = NULL;
	FBOOL userAdded = FALSE;
	FBOOL detachTask = FALSE;
	int loginLogoutCalled = LL_NONE;
	
	Log( FLOG_INFO, "\t\t\tWEB REQUEST FUNCTION func: %s\n", urlpath[ 0 ] );
	
	//
	// DEBUG
	//
	
	//USMDebugSessions( l->sl_USM );
	
	//
	// SECURITY SECTION START
	//
	// This part of code check required information
	//
	
	char *sessionid = FCalloc( DEFAULT_SESSION_ID_SIZE + 1, sizeof(char) );
	char userName[ 256 ];
	//char sessionid[ DEFAULT_SESSION_ID_SIZE ];
	//sessionid[ 0 ] = 0;
    
    if( urlpath[ 0 ] == NULL )
    {
        FERROR("urlpath is equal to NULL!\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		response = HttpNewSimple( HTTP_200_OK, tags );
		
		char buffer[ 256 ];
		snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_PATH_PARAMETER_IS_EMPTY] , DICT_PATH_PARAMETER_IS_EMPTY );
		HttpAddTextContent( response, buffer );
		
		FFree( sessionid );
		return response;
    }
    
    if( strcmp( urlpath[ 0 ], "login" ) == 0 )
	{
		loginLogoutCalled = TRUE;
	}
	
	// Check for sessionid by sessionid specificly or authid
	if( loginLogoutCalled == FALSE && loggedSession == NULL )
	{
		HashmapElement *tst = GetHEReq( *request, "sessionid" );
		HashmapElement *ast = GetHEReq( *request, "authid" );
		HashmapElement *sst = GetHEReq( *request, "servertoken" ); // TODO: Only allow this on localhost!
		
		if( tst == NULL && ast == NULL && sst == NULL )
		{			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE,(FULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION,(FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};

			//DEBUG("\n\n\nURL : %s\n\n\nPOST URL: %s\n\n\n", (*request)->content, (*request)->rawRequestPath );
			
			response = HttpNewSimple( HTTP_200_OK, tags );
			
			char buffer[ 256 ];
			snprintf( buffer, sizeof( buffer ), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SESSIONID_AUTH_MISSING] , DICT_SESSIONID_AUTH_MISSING );
			HttpAddTextContent( response, buffer );
			FERROR( "login function miss parameter sessionid or authid\n" );
			FFree( sessionid );
			return response;
		}
		// Ah, we got our session
		if( tst )
		{
			char tmp[ DEFAULT_SESSION_ID_SIZE ];
			UrlDecode( tmp, (char *)tst->hme_Data );
			
			snprintf( sessionid, DEFAULT_SESSION_ID_SIZE, "%s", tmp );
			DEBUG( "Finding sessionid %s\n", sessionid );
		}
		// Get it by authid
		else if( ast )
		{
			//
			// check if request came from WebSockets
			//
			
			DEBUG("Authid received\n");
			
			
			if( (*request)->http_RequestSource == HTTP_SOURCE_WS )
			{
				char *assid = NULL;
				char *authid = NULL;
				
				DEBUG("HTTPSOURCEWS\n");
				
				HashmapElement *el =  HashmapGet( (*request)->http_ParsedPostContent, "sasid" );
				if( el != NULL )
				{
					assid = UrlDecodeToMem( ( char *)el->hme_Data );
				}
				
				if( assid != NULL )
				{
					authid = UrlDecodeToMem( ( char *)ast->hme_Data );
					if( authid != NULL )
					{
						// If authID is equal to 0 block this call
						if( strncmp( authid, "0", 1 ) == 0 )
						{
							FFree( authid );
							authid = NULL;
						}
					}
					
					char *end;
					FUQUAD asval = strtoull( assid,  &end, 0 );
					
					if( authid != NULL )
					{
						SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
						if( as != NULL )
						{
							if( FRIEND_MUTEX_LOCK( &as->sas_SessionsMut ) == 0 )
							{
								SASUList *alist = as->sas_UserSessionList;
								while( alist != NULL )
								{
									//DEBUG("Authid check %s user %s\n", alist->authid, alist->usersession->us_User->u_Name );
									if( strcmp( alist->authid, authid ) ==  0 )
									{
										loggedSession = alist->usersession;
										sprintf( sessionid, "%s", loggedSession->us_SessionID ); // Overwrite sessionid
										DEBUG("Found user %s\n", loggedSession->us_User->u_Name );
										break;
									}
									alist = (SASUList *)alist->node.mln_Succ;
								}
								FRIEND_MUTEX_UNLOCK( &as->sas_SessionsMut );
							}
						}
						FFree( authid );
					}
					FFree( assid );
				}
				
			//
			// unknown source
			//
				
			}
			
			if( loggedSession == NULL )
			{
				SQLLibrary *sqllib  = l->LibrarySQLGet( l );
				
				DEBUG("Session not found in appsessionid table\n");

				// Get authid from mysql
				if( sqllib != NULL )
				{
					char qery[ 1024 ];

					sqllib->SNPrintF( sqllib, qery, sizeof(qery), "SELECT * FROM ( ( SELECT u.SessionID FROM FUser u, FUserApplication a WHERE a.AuthID=\"%s\" AND a.UserID = u.ID LIMIT 1 ) UNION ( SELECT u2.SessionID FROM FUser u2, Filesystem f WHERE f.Config LIKE \"%s%s%s\" AND u2.ID = f.UserID LIMIT 1 ) ) z LIMIT 1",( char *)ast->hme_Data, "%", ( char *)ast->hme_Data, "%");
					
					void *res = sqllib->Query( sqllib, qery );
					if( res != NULL )
					{
						char **row;
						if( ( row = sqllib->FetchRow( sqllib, res ) ) )
						{
							if( row[ 0 ] != NULL )
							{
								snprintf( sessionid, DEFAULT_SESSION_ID_SIZE,"%s", row[ 0 ] );
							}
						}
						sqllib->FreeResult( sqllib, res );
					}
					l->LibrarySQLDrop( l, sqllib );
				}
			}
		}
		
		// access through server token
		else if( sst )
		{
			//
			// check if request came from WebSockets
			//
			
			DEBUG("ServerToken received\n");
			
			if( loggedSession == NULL )
			{
				SQLLibrary *sqllib = l->LibrarySQLGet( l );

				// Get authid from mysql
				if( sqllib != NULL )
				{
					char qery[ 1024 ];

					// TODO: Remove need for existing SessionID (instead generate it if it does not exist)!
					sqllib->SNPrintF( sqllib, qery, sizeof(qery), "SELECT u.SessionID, u.Name FROM FUser u WHERE u.SessionID != \"\" AND u.ServerToken=\"%s\" LIMIT 1",( char *)sst->hme_Data );;
					
					void *res = sqllib->Query( sqllib, qery );
					if( res != NULL )
					{
						char **row;
						if( ( row = sqllib->FetchRow( sqllib, res ) ) )
						{
							if( row[ 0 ] != NULL )
							{
								snprintf( sessionid, DEFAULT_SESSION_ID_SIZE,"%s", row[ 0 ] );
								snprintf( userName, 256, "%s", row[ 1 ] );
							}
						}
						sqllib->FreeResult( sqllib, res );
					}
					l->LibrarySQLDrop( l, sqllib );
				}
			}
		}
		
		
		{
			char *deviceid = NULL;
			
			HashmapElement *el = HashmapGet( (*request)->http_ParsedPostContent, "deviceid" );
			if( el != NULL )
			{
				deviceid = UrlDecodeToMem( ( char *)el->hme_Data );
			}
			
			DEBUG("Checking remote sessions\n");
				
 			if( deviceid != NULL && strcmp( deviceid, "remote" ) == 0 )
			//if( strcmp( sessionid, "remote" ) == 0 )
			{
				HashmapElement *uname = GetHEReq( *request, "username" );
				HashmapElement *passwd = GetHEReq( *request, "password" );
				FULONG blockedTime = 0;
				char *lpass = NULL;
				
				if( passwd != NULL )
				{
					if( passwd->hme_Data != NULL )
					{
						lpass = (char *)passwd->hme_Data;
					}
				}
				
				if( uname != NULL && uname->hme_Data != NULL  )
				{
					if( FRIEND_MUTEX_LOCK( &(l->sl_USM->usm_Mutex) ) == 0 )
					{
						UserSession *curusrsess = l->sl_USM->usm_Sessions;
					
						while( curusrsess != NULL )
						{
							if( curusrsess != NULL )
							{
								if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
								{
									curusrsess->us_InUseCounter++;
									FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
								}
							}
							User *curusr = curusrsess->us_User;
						
							if( curusr != NULL )
							{
								DEBUG("CHECK remote user: %s pass %s  provided pass %s uname param: %s\n", curusr->u_Name, curusr->u_Password, (char *)lpass, (char *)uname->hme_Data );
						
								if( strcasecmp( curusr->u_Name, (char *)uname->hme_Data ) == 0 )
								{
									FBOOL isUserSentinel = FALSE;
							
									Sentinel *sent = l->GetSentinelUser( l );
									if( sent != NULL )
									{
										if( curusr == sent->s_User )
										{
											isUserSentinel = TRUE;
										}
									}
							
									if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, curusr, (char *)passwd->hme_Data, &blockedTime ) == TRUE )
									{
										//snprintf( sessionid, sizeof(sessionid), "%lu", curusrsess->us_User->u_ID );
										//strcpy( sessionid, curusrsess->us_User->u_MainSessionID );

										loggedSession =  curusrsess;
										userAdded = TRUE;		// there is no need to free resources
									
										if( curusrsess != NULL )
										{
											if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
											{
												curusrsess->us_InUseCounter--;
												FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
											}
										}

										break;
									}	// compare password
								}		// compare user name
							}	//if usr != NULL
							if( curusrsess != NULL )
							{
								if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
								{
									curusrsess->us_InUseCounter--;
									FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
								}
							}
							curusrsess = (UserSession *)curusrsess->node.mln_Succ;
						}
						FRIEND_MUTEX_UNLOCK( &(l->sl_USM->usm_Mutex) );
					}
				}
			}
			else
			{
				DEBUG("CHECK1\n");
				if( FRIEND_MUTEX_LOCK( &(l->sl_USM->usm_Mutex) ) == 0 )
				{
					UserSession *curusrsess = l->sl_USM->usm_Sessions;

					while( curusrsess != NULL )
					{
						/*
						if( curusrsess != NULL )
						{
							if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
							{
								curusrsess->us_InUseCounter++;
								FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
							}
						}
						*/
						if( curusrsess->us_SessionID != NULL && curusrsess->us_User && curusrsess->us_User->u_MainSessionID != NULL )
						{
							if(  (strcmp( curusrsess->us_SessionID, sessionid ) == 0 || strcmp( curusrsess->us_User->u_MainSessionID, sessionid ) == 0 ) )
							{
								loggedSession = curusrsess;
								userAdded = TRUE;		// there is no need to free resources
								User *curusr = curusrsess->us_User;
								if( curusr != NULL )
								{
									DEBUG("FOUND user: %s session sessionid %s provided session %s\n", curusr->u_Name, curusrsess->us_SessionID, sessionid );
								}
								/*
								if( curusrsess != NULL )
								{
									if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
									{
										curusrsess->us_InUseCounter--;
										FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
									}
								}
								*/
								break;
							}
						}
						/*
						if( curusrsess != NULL )
						{
							if( FRIEND_MUTEX_LOCK( &(curusrsess->us_Mutex) ) == 0 )
							{
								curusrsess->us_InUseCounter--;
								FRIEND_MUTEX_UNLOCK( &(curusrsess->us_Mutex) );
							}
						}
						*/
						curusrsess = (UserSession *)curusrsess->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &(l->sl_USM->usm_Mutex) );
				}
				DEBUG("CHECK1END\n");
			}
			
			if( deviceid != NULL )
			{
				FFree( deviceid );
			}
		}
		
		// 
		// But we tried with a server socket
		if( loggedSession == NULL && sst && strlen( sessionid ) > 0 )
		{
			DEBUG( "We asked for server token and have session: %s (%s)\n", sessionid, userName );
			int userAdded = 0;
			
			// Server token reins supreme! Add the session
			if( ( loggedSession = UserSessionNew( sessionid, "server" ) ) != NULL )
			{
				User *tmpusr = UMGetUserByName( l->sl_UM, userName );
				if( !tmpusr )
				{
					tmpusr = UMUserGetByNameDB( l->sl_UM, userName );
					UMAddUser( l->sl_UM,  tmpusr );
					userAdded = 1;
				}
				if( tmpusr )
				{
					loggedSession->us_User = tmpusr;
					char *err = NULL;
					UserDeviceMount( l, loggedSession->us_User, 0, TRUE, &err, TRUE );
					if( err != NULL )
					{
						Log( FLOG_ERROR, "Login mount error. UserID: %lu Error: %s\n", loggedSession->us_User->u_ID, err );
						FFree( err );
					}
					
					USMUserSessionAddToList( l->sl_USM, loggedSession );
				}
			}
		}
		
		if( loggedSession == NULL )
		{
			FERROR("User session not found !\n");
			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
			
			//
			// Check all calls coming from sessions which do not longer exists
			//
			
			//SecurityManagerCheckSession( l->sl_SecurityManager, *request );
		
			if( response != NULL )
			{
				HttpFree( response );
				FERROR("RESPONSE no user\n");
			}
			response = HttpNewSimple( HTTP_403_FORBIDDEN, tags );
			
			char buffer[ 512 ];
			char *lsessidstring = NULL;
			HashmapElement *lsesid = GetHEReq( *request, "sessionid" );
			if( lsesid != NULL && lsesid->hme_Data != NULL )
			{
				lsessidstring = (char *)lsesid->hme_Data;
				
				/*
				Log( FLOG_ERROR, "THIS SESSION ID IS BLOCKED: %s !", lsessidstring );
				unsigned int i=0;
				
				for( i = 0; i < (*request)->parsedPostContent->hm_TableSize; i++ )
				{
					if( (*request)->parsedPostContent->hm_Data[i].hme_InUse == TRUE )
					{
						HashmapElement *lochme = &(*request)->parsedPostContent->hm_Data[i];
						if( lochme->hme_Data != NULL )
						{
							Log( FLOG_ERROR, "POST Params: %s\n", lochme->hme_Data );
						}
					}
				}*/
			}
			
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\",\"sessionid\":\"%s\"}", l->sl_Dictionary->d_Msg[DICT_USER_SESSION_NOT_FOUND] , DICT_USER_SESSION_NOT_FOUND, lsessidstring );
			HttpAddTextContent( response, buffer );
			FFree( sessionid );
			
			return response;
		}
		else
		{
			//
			// we  update timestamp for all users
			//
			
			time_t timestamp = time ( NULL );
			
			loggedSession->us_LoggedTime = timestamp;
			if( loggedSession->us_User != NULL )
			{
				loggedSession->us_User->u_LoggedTime = timestamp;
			}
			
			SQLLibrary *sqllib  = l->LibrarySQLGet( l );
			if( sqllib != NULL )
			{
				char *tmpQuery = FCalloc( 1025, sizeof( char ) );
				if( tmpQuery )
				{
					sqllib->SNPrintF( sqllib, tmpQuery, 1024, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionid );
					sqllib->QueryWithoutResults( sqllib, tmpQuery );
				
					INFO("Logged time updated: %lu\n", timestamp );
				
					FFree( tmpQuery );
				}
				l->LibrarySQLDrop( l, sqllib );
			}
		}
	}
	
	//
	// SECURITY SECTION END
	//
	
	//
	// Check dos token
	//
		
		//if( loggedSession == NULL )
		{
			HashmapElement *tokid = GetHEReq( *request, "dostoken" );
			
			DEBUG("Found DOSToken parameter, tokenid %p\n", tokid );
			
			if( tokid != NULL && tokid->hme_Data != NULL )
			{
				DEBUG("Found DOSToken parameter\n");
				
				DOSToken *dt = DOSTokenManagerGetDOSToken( l->sl_DOSTM, tokid->hme_Data );
				if( dt != NULL && dt->ct_UserSession != NULL && dt->ct_Commands != NULL )
				{
					DEBUG("Found DOSToken\n");
					
					int i;
					FBOOL accessGranted = FALSE;
					
					// we are going through all access rights  file/read , file/write , file/open, etc.
					
					for( i = 0 ; i < dt->ct_MaxAccess ; i++ )
					{
						int pathPos = 0;
						char *pathPosPtr = dt->ct_AccessPath[ i ].path[ pathPos ];
						accessGranted = TRUE;
						
						DEBUG("Checking access [ %d ] \n", i );
						// we are going through all paths
						while( urlpath[ pathPos ] != NULL )
						{
							DEBUG("PathPosition %d pathposptr %s'\n", pathPos, pathPosPtr );
							if( pathPosPtr != NULL && strcmp( urlpath[ pathPos ], pathPosPtr ) != 0 )
							{
								accessGranted = FALSE;
							}
							
							pathPos++;
							pathPosPtr = dt->ct_AccessPath[ i ].path[ pathPos ];
							
							// if there is no subpath all functions are allowed
							if( pathPosPtr == NULL )
							{
								break;
							}
						}
						
						if( accessGranted == TRUE )
						{
							loggedSession = dt->ct_UserSession;
							break;
						}
					} // check all access rights
					
					DEBUG("Access granted? [ %d ]\n", accessGranted );
					
				} // check null values
			} // check hashmap
		}
	
	//
	// check detach task parameter
	//
	
	HashmapElement *dtask = GetHEReq( *request, "detachtask" );
	if( dtask != NULL )
	{
		if( dtask->hme_Data != NULL && strcmp( "true", dtask->hme_Data ) == 0 )
		{
			detachTask = TRUE;
			DEBUG("Task will be detached\n");
		}
	}
	
	if( *request != NULL )
	{
		(*request)->http_UserSession = loggedSession;
	}
	
	if( strcmp( urlpath[ 0 ], "file" ) == 0 )
	{
		HashmapElement *el = HttpGetPOSTParameter( *request, "path" );
		if( el == NULL ) el = HashmapGet( (*request)->http_Query, "path" );
		int size = 64;
		
		if( el != NULL && el->hme_Data != NULL )
		{
			char *data = NULL;
			size += strlen( el->hme_Data );
			
			if( (*request)->http_RequestSource == HTTP_SOURCE_WS )
			{
				size += strlen( (*request)->http_Uri->uri_QueryRaw );
				if( ( data = FMalloc( size ) ) != NULL )
				{
					int pos = snprintf( data, size, "%s Path: ", (*request)->http_Uri->uri_QueryRaw );
					UrlDecode( &data[ pos ], (char *)el->hme_Data );
					UserLoggerStore( l->sl_ULM, loggedSession, data, loggedSession->us_UserActionInfo );
					FFree( data );
				}
			}
			else
			{
				DEBUG("Check request pointer %p and requeest path %p\n", (*request), (*request)->http_RawRequestPath );
				if( (*request)->http_RawRequestPath != NULL )
				{
					size += strlen( (*request)->http_RawRequestPath );
					if( ( data = FMalloc( size ) ) != NULL )
					{
						int pos = snprintf( data, size, "%s Path: ", (*request)->http_RawRequestPath );
						UrlDecode( &data[ pos ], (char *)el->hme_Data );
						UserLoggerStore( l->sl_ULM, loggedSession, data, (*request)->http_UserActionInfo );
						FFree( data );
					}
				}
			}
		}
		else
		{
			if( (*request)->http_RequestSource == HTTP_SOURCE_WS )
			{
				UserLoggerStore( l->sl_ULM, loggedSession, (*request)->http_Uri->uri_QueryRaw , loggedSession->us_UserActionInfo );
			}
			else
			{
				UserLoggerStore( l->sl_ULM, loggedSession, (*request)->http_RawRequestPath, (*request)->http_UserActionInfo );
			}
		}
	}
	else
	{
		if( (*request)->http_RequestSource == HTTP_SOURCE_WS )
		{
			DEBUG(" request %p  uri %p\n", (*request),(*request)->http_Uri );
			UserLoggerStore( l->sl_ULM, loggedSession, (*request)->http_Uri->uri_QueryRaw , loggedSession->us_UserActionInfo );
		}
		else
		{
			UserLoggerStore( l->sl_ULM, loggedSession, (*request)->http_RawRequestPath, (*request)->http_UserActionInfo );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/help</H2>Return all available Friend WebCalls
	*
	* @param sessionid (required) - id of user session
	*/
	/// @endcond
	
	if( strcmp( urlpath[ 0 ], "validate" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"true\"}" );
		
		*result = 200;
	}
	else if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "ok<!--separate-->{\"HELP\":\"commands: \"" 
				"module - run module"
				", clearcache - clear static files cache\""
				", \"groups\",\""
				"user - functions releated to user and session management"
				", device - functions releated to device management"
				", file - functions releated to files"
				", ufile - functions releated to remote files"
				", admin - functions releated to server administration"
				", connection - functions releated to FC-FC connections"
				", invar - functions releated to INRam variables"
				", services - functions related to services management"
				", app - functions releated to application management"
				", image - functions releated to image processing"
				", usb - functions releated to usb management"
				", printer - functions releated to printer management"
				", pid - functions releated to processes in threads"
				"\"}" );
		
		*result = 200;
	}

	//
	// user function
	//
	
	else if( strcmp( urlpath[ 0 ], "user" ) == 0 )
	{
		DEBUG("User\n");
		response = UMWebRequest( l, urlpath, (*request), loggedSession, result, &loginLogoutCalled );
	}
	
	//
	// usergroup function
	//
	
	else if( strcmp( urlpath[ 0 ], "group" ) == 0 )
	{
		DEBUG("Group\n");
		response = UMGWebRequest( l, urlpath, (*request), loggedSession, result );
	}
	
	//
	// notification function
	//
	
	else if( strcmp( urlpath[ 0 ], "notification" ) == 0 )
	{
		DEBUG("Notification\n");
		response = NMWebRequest( l, urlpath, (*request), loggedSession, result );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/module</H2>Function allow user to call functions handled in modules
	*
	* @param sessionid - (required) session id of logged user
	* @param module - (required) module which will be used (all other params will be taken from request)
	* @return output from modules
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 0 ], "module" ) == 0 )
	{
		// Now go ahead
		struct stat f;
		char *data = NULL;
		unsigned long dataLength = 0;
		DEBUG( "[MODULE] Trying modules folder...\n" );
		FBOOL phpCalled = FALSE;

		HashmapElement *he = HttpGetPOSTParameter( (*request), "module" );
		if( he == NULL ) he = HashmapGet( (*request)->http_Query, "module" );
		// checking if module is in cache and use it if there is need
		
		if( he != NULL && he->hme_Data != NULL )
		{
			char *module = (char *)he->hme_Data;
			int size = 0;
			
			if( ( size = strlen( module ) ) > 4 )
			{
				if( module[ size-4 ] == '.' &&module[ size-3 ] == 'p'  &&module[ size-2 ] == 'h'  &&module[ size-1 ] == 'p' 
					&& l->sl_PHPModule != NULL )
				{
					char runfile[ 512 ];
					snprintf( runfile, sizeof(runfile), "modules/%s/module.php", module );
					
					DEBUG("Run module: '%s'\n", runfile );
					
					if( stat( runfile, &f ) != -1 )
					{
						FBOOL isFile;
						DEBUG("MODRUNPHP %s\n", runfile );
						char *allArgsNew = GetArgsAndReplaceSession( *request, loggedSession, &isFile );
						if( allArgsNew != NULL )
						{
							Log( FLOG_INFO, "Module called: %s : %p\n", allArgsNew, pthread_self() );
							
							data = l->sl_PHPModule->Run( l->sl_PHPModule, runfile, allArgsNew, &dataLength );
							phpCalled = TRUE;
							
							if( isFile )
							{
								//"file<!--separate-->%s"
								char *fname = allArgsNew + MODULE_FILE_CALL_STRING_LEN;
								remove( fname );
							}
							
							FFree( allArgsNew );
							
							Log( FLOG_INFO, "Module request took %d milliseconds.", GetUnixTime() - requestStart );
						}
					}
					else
					{
						FERROR("Module do not eixst %s\n", runfile );
					}
				}
			}
		}

		if( phpCalled == FALSE && stat( "modules", &f ) != -1 )
		{
			if( S_ISDIR( f.st_mode ) )
			{
				if( he != NULL )
				{
					// 2. Check if module folder exists in modules/
					char path[ 512 ];
					char *modType = NULL;
					
					// Caching!
					List *checkAvail = l->sl_AvailableModules;
					int found = 0;
					while( checkAvail != NULL )
					{
						if( checkAvail->l_Data )
						{
							struct ModuleSet *mp = ( struct ModuleSet * )checkAvail->l_Data;
							if( he->hme_Data != NULL && mp != NULL && mp->name != NULL )
							{
								if( strcmp( ( char *)he->hme_Data, mp->name ) == 0 )
								{
									found = 1;
									modType = StringDuplicate( mp->extension );
									snprintf( path, sizeof( path ), "modules/%s", mp->name );
									path[ 511 ] = 0;
									break;
								}
							}
						}
						checkAvail = checkAvail->next;
					}
					
					char *module = ( char *)he->hme_Data;
					
					if( found == 0 )
					{
						DEBUG( "Module %s not found!\n", module );
						snprintf( path, sizeof(path), "modules/%s", module );
						path[ 511 ] = 0;
					
						if( stat( path, &f ) != -1 )
						{
							// 3. Determine interpreter (or native code)
							DIR *fdir = NULL;
							struct dirent *fdirent = NULL;
						
						
							if( ( fdir = opendir( path ) ) != NULL )
							{
								int hasExt, dlen, ie, extlen, md, typec;
								while( ( fdirent = readdir( fdir ) ) )
								{
									char component[ 10 ];

									sprintf( component, "%.*s", 6, fdirent->d_name );

									if( strcmp( component, "module" ) == 0 )
									{
										hasExt = 0;
										dlen = strlen( fdirent->d_name );
										ie = 0;
									
										for( ; ie < dlen; ie++ )
										{
											if( fdirent->d_name[ie] == '.' )
											{
												hasExt = ie;
											}
										}
										// Has extension!
										if( hasExt > 0 )
										{
											extlen = dlen - 7;
											if( modType )
											{
												FFree( modType );
											}
											modType = FCalloc( extlen + 1, sizeof( char ) );
											ie = 0; md = 0, typec = 0;
											for( ; ie < dlen; ie++ )
											{
												if( md == 0 && fdirent->d_name[ie] == '.' )
												{
													md = 1;
												}
												else if ( md == 1 )
												{
													modType[typec++] = fdirent->d_name[ie];
												}
											}
											break;
										}
									}
								}
								closedir( fdir );
							}
						}
					}
					
		
					// 4. Execute with interpreter (or execute native code)
					if( modType != NULL )
					{
						if( found == 0 )
						{
							// Add for book keeping!
							DEBUG( "Adding to list %s\n", modType );
							struct ModuleSet *ms = FCalloc( 1, sizeof( struct ModuleSet ) );
							ms->name = StringDuplicate( module );
							ms->extension = StringDuplicate( modType );
							if( FRIEND_MUTEX_LOCK( &(l->sl_InternalMutex) ) == 0 )
							{
								AddToList( l->sl_AvailableModules, ( void *)ms );
								FRIEND_MUTEX_UNLOCK( &( l->sl_InternalMutex ) );
							}
						}
											
						// Look if it's in list
						DEBUG( "[MODULE] Executing %s module! path %s\n", modType, path );
						char *modulePath = FCalloc( MODULE_PATH_LENGTH, sizeof( char ) );
						snprintf( modulePath, MODULE_PATH_LENGTH-1, "%s/module.%s", path, modType );
						if( 
							strcmp( modType, "php" ) == 0 || 
							strcmp( modType, "jar" ) == 0 ||
							strcmp( modType, "py" ) == 0
						)
						{
							FBOOL isFile;
							char *allArgsNew = GetArgsAndReplaceSession( *request, loggedSession, &isFile );
							
							DEBUG("Calling module '%s' allargs '%s'\n", modulePath, allArgsNew );

							// Execute
							data = l->RunMod( l, modType, modulePath, allArgsNew, &dataLength );
							
							// We don't use them now
							if( allArgsNew != NULL )
							{
								if( isFile )
								{
									//"file<!--separate-->%s"
									char *fname = allArgsNew + MODULE_FILE_CALL_STRING_LEN;
									remove( fname );
								}
								FFree( allArgsNew );
							}
						}
						if( modulePath )
						{
							FFree( modulePath );
							modulePath = NULL;
						}
						
						if( modType != NULL )
						{
							FFree( modType );
							modType = NULL;
						}
					}
				}
			}
		}
		DEBUG("Module executed in %dms...\n", GetUnixTime() - requestStart );
		
		if( data != NULL )
		{
			// 5. Piped response will be output!
			char *ltype  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Type"   ) : NULL;
			char *length = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Length" ) : NULL;
			char *dispo  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Disposition" ) : NULL;
			char *code = CheckEmbeddedHeaders( data, dataLength, "Status Code" );

			char *datastart = strstr( data, "---http-headers-end---" );
			if( datastart != NULL )
			{
				datastart += 23;
				if( length == NULL )
				{	
					length = FCalloc( 64, sizeof( char ) );
					sprintf( length, "%ld", dataLength - ( datastart - data ) );
					char *trimmed = FCalloc( strlen( length )+1, 1 );
					if( trimmed != NULL )
					{
						sprintf( trimmed, "%s", length );
					}
					FFree( length );
					length = trimmed;
				}
			}

			if( ltype != NULL && length != NULL )
			{
				struct TagItem tags[] = {
					{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( ltype, strlen( ltype ) ) },
					{ HTTP_HEADER_CONTENT_DISPOSITION, (FULONG)StringDuplicateN( dispo ? dispo : "inline", dispo ? strlen( dispo ) : strlen( "inline" ) ) },
					{ HTTP_HEADER_CONTENT_LENGTH, (FULONG)StringDuplicateN( length, strlen( length ) ) },
					{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{ TAG_DONE, TAG_DONE }
				};

				if( response != NULL )
				{
					FERROR("RESPONSE ERROR ALREADY SET (freeing)\n");
					HttpFree( response );
				}
				
				if( code != NULL )
				{
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

				if( response )
				{
					char *next;
					int calSize = strtol ( length, &next, 10);
					if( ( next == length ) || ( *next != '\0' ) || calSize <= 0 ) 
					{
						FERROR( "Lenght of message == 0\n" );
					}
					else
					{
						char *returnData = FCalloc( calSize, sizeof( FBYTE ) );
						if( returnData != NULL )
						{
							memcpy( returnData, datastart, calSize * sizeof( FBYTE ) );
							HttpSetContent( response, returnData, calSize );
						}
					}
				}
				FFree( data );
			}
			else
			{
				struct TagItem tags[] = {
					{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  ( ltype != NULL ? StringDuplicateN( ltype, strlen( ltype ) ) : StringDuplicate( "text/plain" ) ) },
					{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{TAG_DONE, TAG_DONE}
				};

				if( response != NULL )
				{
					FERROR("RESPONSE ERROR ALREADY SET (freeing)\n");
					HttpFree( response );
				}
				
				if( code != NULL )
				{
					int errCode = -1;
					
					char *next;
					errCode = strtol ( code, &next, 10);
					if( ( next == code ) || ( *next != '\0' ) ) 
					{
						errCode = -1;
					}
					
					DEBUG("1parsed %s code %d\n", code, errCode );
					
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

				if( response != NULL )
				{
					HttpSetContent( response, data, dataLength );
				}
				else
				{
					FFree( data );
				}
			}

			if( ltype ){ FFree( ltype ); ltype = NULL;}
			if( length ){ FFree( length ); length = NULL; }
			if( code ){ FFree( code ); code = NULL; }

			*result = 200;
		}
		else
		{
			Log( FLOG_ERROR, "[SystemWeb]: php returned NULL for request '%s'\n", (*request)->http_Content );
			
			FERROR("[System.library] ERROR returned data is NULL\n");
			*result = 404;
		}
		
		Log( FLOG_INFO, "Module call end: %p\n", pthread_self() );
		DEBUG("Module call completed in %dms...\n", GetUnixTime() - requestStart );
	}
	
	//
	// device functions
	//
	
	else if( strcmp( urlpath[ 0 ], "device" ) == 0 )
	{
		DEBUG("Device call\n");
		response = DeviceMWebRequest( l, urlpath, *request, loggedSession, result );
	}

	//=================================================
	//
	// FILES
	//
	//=================================================
	
	else if( strcmp( urlpath[ 0 ], "file" ) == 0 )
	{
#ifdef ENABLE_WEBSOCKETS_THREADS
		response = FSMWebRequest( l, urlpath, *request, loggedSession, result );
#else
		DEBUG("Systembase pointer %p\n", l );
		if( detachTask == TRUE )
		{
			DEBUG("Ptr to request %p\n", *request );
			FUQUAD pid = PIDThreadManagerRunThread( l->sl_PIDTM, *request, urlpath, loggedSession, FSMWebRequest );
			
			response = HttpNewSimpleA( HTTP_200_OK, (*request), HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			char pidtxt[ 256 ];
			snprintf( pidtxt, sizeof(pidtxt), "ok<!--separate-->{\"PID\":\"%lu\"}", pid );
			
			HttpAddTextContent( response, pidtxt );
			
			*request = NULL;
		}
		else
		{
			response = FSMWebRequest( l, urlpath, *request, loggedSession, result );
		}
#endif
	}
	
	//=================================================
	//
	// UFILES
	//
	//=================================================
		
	//
	// ufile 
	// user file - they works like files in every system. You  can open it and read/write till you close it
	//
	
	else if( strcmp( urlpath[ 0 ], "ufile" ) == 0 )
	{
		response = FSMRemoteWebRequest( l, urlpath, *request, loggedSession, result );
	}
	
	//
	// admin stuff
	//
	
	else if( strcmp( urlpath[ 0 ], "admin" ) == 0 )
	{
		response = AdminWebRequest( l, urlpath, request, loggedSession, result );
		
	}
	
	//
	// connection stuff
	//
	
	else if( strcmp( urlpath[ 0 ], "connection" ) == 0 )
	{
		response = ConnectionWebRequest( l, urlpath, request, loggedSession, result );
		
	}

	//
	// network only memory
	//
	
	else if( strcmp( urlpath[ 0 ], "invar" ) == 0 )
	{
		INFO("INRAM called\n");
		response = INVARManagerWebRequest( l->nm, &(urlpath[1]), *request );
	}
	
	//
	// DOS Token
	//
	
	else if( strcmp( urlpath[ 0 ], "token" ) == 0 )
	{
		INFO("Token called\n");
		response = TokenWebRequest( l, urlpath, request, loggedSession, result );
	}
	
	//
	// atm we want to handle all calls to services via system.library
	//
	
	else if( strcmp( urlpath[ 0 ], "services" ) == 0 )
	{
		DEBUG("Services called\n");
		FBOOL called = FALSE;
		
		if( l->sl_UM!= NULL )
		{
			response =  ServicesManagerWebRequest( l, &(urlpath[1]), *request, loggedSession );
			called = TRUE;
		}
		
		if( called == FALSE )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
				{ TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL )
			{
				HttpFree( response );
				FERROR("RESPONSE services\n");
			}
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );

			goto error;
		}
	}
	
	//
	// atm we want to handle all calls to services via system.library
	//
	
	else if( strcmp( urlpath[ 0 ], "service" ) == 0 )
	{
		DEBUG("Service called\n");
		FBOOL called = FALSE;
		
		if( l->sl_UM!= NULL )
		{
			response = SMWebRequest( l, &(urlpath[1]), *request, loggedSession );
			called = TRUE;
		}
		
		if( called == FALSE )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
				{ TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL )
			{
				HttpFree( response );
				FERROR("RESPONSE service\n");
			}
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );

			goto error;
		}
	}
	
	//
	// handle sas calls
	//
	
	else if( strcmp(  urlpath[ 0 ], "sas" ) == 0 )
	{
		DEBUG("SAS Systemlibptr %p applibptr %p - logged user here: %s\n", l, l->alib, loggedSession->us_User->u_Name );
		response = SASWebRequest( l, &(urlpath[ 1 ]), *request, loggedSession );
	}
	
	//
	// handle application calls
	//
	
	else if( strcmp(  urlpath[ 0 ], "app" ) == 0 )
	{
		DEBUG("Appcall Systemlibptr %p applibptr %p - logged user here: %s\n", l, l->alib, loggedSession->us_User->u_Name );
		response = ApplicationWebRequest( l, &(urlpath[ 1 ]), *request, loggedSession );
	}
	
	//
	// Mobile
	//
	
	else if( strcmp( urlpath[ 0 ], "mobile" ) == 0 )
	{
		DEBUG("Mobile function %p  libptr %p\n", l, l->ilib );
		response = MobileWebRequest( l,  urlpath, *request, loggedSession, result );
	}
	
	//
	// handle image calls
	//
	
	else if( strcmp( urlpath[ 0 ], "image" ) == 0 )
	{
		DEBUG("Image calls Systemlibptr %p imagelib %p\n", l, l->ilib );
		response = l->ilib->WebRequest( l->ilib, loggedSession , &(urlpath[ 1 ]), *request );
	}
	
	//
	// clear cache
	//
	
	else if( strcmp( urlpath[ 0 ], "clearcache" ) == 0 )
	{
		DEBUG("Clear cache %p  libptr %p\n", l, l->ilib );
		CacheManagerClearCache( l->cm );
	}
	
	//
	// USB
	//
	
	else if( strcmp( urlpath[ 0 ], "usb" ) == 0 )
	{
		DEBUG("USB function %p  libptr %p\n", l, l->ilib );
		response = USBManagerWebRequest( l,  &(urlpath[ 1 ]), *request, loggedSession );
	}
	
	//
	// Printers
	//
	
	else if( strcmp( urlpath[ 0 ], "printer" ) == 0 )
	{
		DEBUG("Printer function %p  libptr %p\n", l, l->ilib );
		response = PrinterManagerWebRequest( l,  &(urlpath[ 1 ]), *request, loggedSession );
	}
	
	//
	// PID Threads
	//
	else if( strcmp( urlpath[ 0 ], "pid" ) == 0 )
	{
		DEBUG("PIDThread functions\n");
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			response = PIDThreadWebRequest( l, urlpath, *request, loggedSession );
		}
		else
		{
			response = HttpNewSimpleA( HTTP_200_OK, (*request),  HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
				HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/login</H2>Function allow user to login and get user session id
	*
	* @param username (required) - name of user
	* @param password (required) - user password
	* @param deviceid (required) - id which recognize device which is used to login
	* @param encryptedblob - used by keys which allow to login
	* @param appname - is an application name which is trying to connect to our server (used by remotefs)
	* @param sessionid - session id of logged user
	* @return information about login process "{result:-1,response: success/fail, code:error code }
	*/
	/// @endcond
	
	else if( loginLogoutCalled == TRUE )
	//else if( strcmp(  urlpath[ 0 ], "login" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
	
		if( (*request)->http_ParsedPostContent != NULL )
		{
			char *usrname = NULL;
			char *pass = NULL;
			char *appname = NULL;
			char *deviceid = NULL;
			char *encryptedBlob = NULL; // If the user sends publickey
			char *locsessionid = NULL;
			FULONG blockedTime = 0;
			
			HashmapElement *el = HttpGetPOSTParameter( *request, "username" );
			if( el != NULL )
			{
				//usrname = (char *)el->hme_Data;
				if( el->hme_Data != NULL )
				{
					//if( strcmp( (char *)el->hme_Data, "apiuser" ) != 0 )
					{
						usrname = UrlDecodeToMem( (char *)el->hme_Data );
					}
				}
			}
			
			// Fetch public key
			el = HttpGetPOSTParameter( *request, "encryptedblob" );
			if( el != NULL )
			{
				encryptedBlob = ( char *)el->hme_Data;
			}
			
			el = HttpGetPOSTParameter( *request, "password" );
			if( el != NULL )
			{
				pass = ( char *)el->hme_Data;
			}
			
			el = HttpGetPOSTParameter( *request, "appname" );
			if( el != NULL )
			{
				appname = ( char *)el->hme_Data;
			}
			
			el = HttpGetPOSTParameter( *request, "deviceid" );
			if( el != NULL )
			{
				//deviceid = (char *)el->hme_Data;
				deviceid = UrlDecodeToMem( el->hme_Data );
				DEBUG("\t\t\t\tDEVICEID PARAMETER: %s\n", deviceid );
			}
			
			el = HttpGetPOSTParameter( *request, "sessionid" );
			if( el != NULL )
			{
				locsessionid = ( char *)el->hme_Data;
			}
			
			if( locsessionid != NULL && deviceid != NULL )
			{
				int loginStatus = 0;
				// get user session from memory
				// if it doesnt exist, load it from database
				UserSession *us = USMGetSessionBySessionID( l->sl_USM, locsessionid );
				
				if( us == NULL )
				{
					us = USMGetSessionBySessionIDFromDB( l->sl_USM, locsessionid );
				}
				else // check if session is in DB, if not store it
				{
					USMSessionSaveDB( l->sl_USM, us );
				}
				
				if( us != NULL )
				{
					loggedSession = us;
					
					// add session to global users session listt
					
					DEBUG("session loaded session id %s\n", loggedSession->us_SessionID );
					if( ( loggedSession = USMUserSessionAdd( l->sl_USM, loggedSession ) ) != NULL )
					{
						if( loggedSession->us_User == NULL )
						{
							User *lusr = l->sl_UM->um_Users;
							while( lusr != NULL )
							{
								if( loggedSession->us_UserID == lusr->u_ID )
								{
									loggedSession->us_User = lusr;
									break;
								}
								lusr = (User *)lusr->node.mln_Succ;
							}
						}
						
						
						if( loggedSession->us_User != NULL && (loggedSession->us_User->u_Status == USER_STATUS_DISABLED || loggedSession->us_User->u_Status == USER_STATUS_BLOCKED ) )
						{
							loginStatus = 1;
						}
						else
						{
							//
							// update user and session
							//
						
							char tmpQuery[ 512 ];
						
							SQLLibrary *sqlLib =  l->LibrarySQLGet( l );
							if( sqlLib != NULL )
							{
								DEBUG("Try to get mobileappid from DeviceID: %s\n", deviceid );
								FULONG umaID = 0;
								if( deviceid != NULL )
								{
									int len = strlen( deviceid );
									int i, lpos = 0;
									for( i=0 ; i < len ; i++ )
									{
										if( deviceid[ i ] == '_' )
										{
											lpos = i+1;
										}
									}
									if( lpos > 0 && lpos < len )
									{
										umaID = MobileManagerGetUMAIDByDeviceIDAndUserName( l->sl_MobileManager, sqlLib, loggedSession->us_UserID, &(deviceid[ lpos ] ) );
									}
								}
								loggedSession->us_MobileAppID = umaID;
							
								sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE `FUserSession` SET LoggedTime = %lld,DeviceIdentity='%s',UMA_ID=%lu WHERE `SessionID`='%s'", (long long)loggedSession->us_LoggedTime, deviceid, umaID, loggedSession->us_SessionID );
								if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
								{ 
								
								}
							
								//
								// update user
								//
							
								sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE FUser SET LoggedTime='%lld', SessionID='%s' WHERE `Name` = '%s'",  (long long)loggedSession->us_LoggedTime, loggedSession->us_User->u_MainSessionID, loggedSession->us_User->u_Name );
								if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
								{ 
								
								}
								l->LibrarySQLDrop( l, sqlLib );
							
								UMAddUser( l->sl_UM, loggedSession->us_User );
							
								DEBUG("New user and session added\n");
							
								char *err = NULL;
								UserDeviceMount( l, loggedSession->us_User, 0, TRUE, &err, TRUE );
								if( err != NULL )
								{
									Log( FLOG_ERROR, "Login mount error. UserID: %lu Error: %s\n", loggedSession->us_User->u_ID, err );
									FFree( err );
								}
							
								DEBUG("Devices mounted\n");
								userAdded = TRUE;
							}
							else
							{
								loggedSession = NULL;
							}
						}
						DEBUG("Library dropped\n");
					}
					else
					{
						loggedSession = NULL;
						FERROR("Cannot  add session\n");
					}
				}
				
				char tmp[ 1024 ];
				
				if( loggedSession != NULL && loggedSession->us_User != NULL )
				{
					if( loginStatus == 1 )
					{
						snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"result\":\"-1\",\"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ACCOUNT_BLOCKED] , DICT_ACCOUNT_BLOCKED );
					}
					else
					{
						snprintf( tmp, sizeof(tmp),
						"{\"result\":\"%d\",\"sessionid\":\"%s\",\"level\":\"%s\",\"userid\":\"%ld\",\"fullname\":\"%s\",\"loginid\":\"%s\"}",
						0, loggedSession->us_SessionID , loggedSession->us_User->u_IsAdmin ? "admin" : "user", loggedSession->us_User->u_ID, loggedSession->us_User->u_FullName,  loggedSession->us_SessionID
						);
					}
				}
				else
				{
					FERROR("[ERROR] User session or User not found\n" );

					snprintf( tmp, sizeof(tmp), "fail<!--separate-->{ \"result\":\"-1\",\"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USERSESSION_OR_USER_NOT_FOUND] , DICT_USERSESSION_OR_USER_NOT_FOUND );
				}
				
				HttpAddTextContent( response, tmp );
			}
			// Public key mode
			// TODO: Implement this! Ask Chris and Hogne!
			else if( usrname != NULL && encryptedBlob != NULL && deviceid != NULL )
			{
				FERROR("[ERROR] Authentication by using public key not suported\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "{\"result\":\"-1\",\"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTH_PUBLIC_KEY_NOT_SUPPORTED] , DICT_AUTH_PUBLIC_KEY_NOT_SUPPORTED );
				HttpAddTextContent( response, buffer );
			}
			// standard username and password mode
			else if( usrname != NULL && pass != NULL && deviceid != NULL )
			{
				DEBUG("Found logged user under address user name %s pass %s deviceid %s\n", usrname, pass, deviceid );
				
				if( strcmp( usrname, "apiuser" ) == 0 )
				{
					if( strcmp( deviceid, "loving-crotch-grabbing-espen" ) == 0 )
					{
						
					}
					else // if its not our apiuser, do not allow him to login!!
					{
						if( usrname != NULL )
						{
							FFree( usrname );
						}
						
						*result = 200;
						return NULL;
					}
					//FERROR("\n\n\nUSERNAME %s\nPASS %s\nDEVICE %s\n\n\n", usrname, pass, deviceid );
				}
				
				//
				// first we must find user
				// if sessionid is not provided we must create new session
				//
				
				if( l->sl_ActiveAuthModule != NULL )
				{
					UserSession *dstusrsess = NULL;
					UserSession *tusers = NULL;
					
					FBOOL isUserSentinel = FALSE;
					
					DEBUG("CHECK2\n");

					if( deviceid == NULL )
					{
						User *tuser = USMIsSentinel( l->sl_USM, usrname, &tusers, &isUserSentinel );
						
						if( tuser != NULL )
						{
							if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, tuser, pass, &blockedTime ) == TRUE )
							{
								dstusrsess = tusers;
								DEBUG("Found user session  id %s\n", tusers->us_SessionID );
							}
						}
					}
					else	// deviceid != NULL
					{
						
						//if( FRIEND_MUTEX_LOCK( &(l->sl_USM->usm_Mutex) ) == 0 )
						{
							User *tuser = USMIsSentinel( l->sl_USM, usrname, &tusers, &isUserSentinel );
						
							if( tuser != NULL )
							{
								if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, tuser, pass, &blockedTime ) == TRUE )
								{
									dstusrsess = tusers;
									if( tusers != NULL )
									{
										DEBUG("Found user session  id %s\n", tusers->us_SessionID );
									}
								}
							}
						}
					}
					
					DEBUG("CHECK2END\n");
					
					if( dstusrsess == NULL )
					{
						Sentinel *sent = l->GetSentinelUser( l );
						if( sent != NULL && sent->s_User != NULL )
						{
							DEBUG("Sent %p\n", sent->s_User );
							if( strcmp( sent->s_User->u_Name, usrname ) == 0 )
							{
								isUserSentinel = TRUE;
							}
						}
						
						DEBUG("Authenticate dstusrsess == NULL is user sentinel %d\n", isUserSentinel );
						if( isUserSentinel == TRUE && strcmp( deviceid, "remote" ) == 0 )
						{
							User *tmpusr = UMUserGetByNameDB( l->sl_UM, usrname );
							if( tmpusr != NULL )
							{
								loggedSession = UserSessionNew( "remote", deviceid );
								if( loggedSession != NULL )
								{
									loggedSession->us_UserID = tmpusr->u_ID;
								}
								
								UserDelete( tmpusr );
							}
						}
						else
						{
							loggedSession = l->sl_ActiveAuthModule->Authenticate( l->sl_ActiveAuthModule, *request, NULL, usrname, pass, deviceid, NULL, &blockedTime );
						}
						
						//
						// user not logged in previously, we must add it to list
						// 
						
						if( loggedSession != NULL )
						{
							loggedSession->us_LoggedTime = time( NULL );
							USMSessionSaveDB( l->sl_USM, loggedSession );
						}
						else
						{
							FERROR( "[SysWebRequest] Failed to login user and authenticate.\n" );
						}
					}
					
					//
					// session found, there is no need to load user
					//
					
					else
					{
						DEBUG("Call authenticate by %s\n", l->sl_ActiveAuthModule->am_Name );

						if( isUserSentinel == TRUE )
						{
							loggedSession = dstusrsess;
						}
						else
						{
							if( appname == NULL )
							{
								loggedSession = l->sl_ActiveAuthModule->Authenticate( l->sl_ActiveAuthModule, *request, dstusrsess, usrname, pass, deviceid, NULL, &blockedTime );
							}
							else
							{
								loggedSession = l->sl_ActiveAuthModule->Authenticate( l->sl_ActiveAuthModule, *request, dstusrsess, usrname, pass, deviceid, "remote", &blockedTime );
							}
						}
					}
					
					//
					// last checks if session is ok
					//
					
					if( loggedSession != NULL )
					{
						DEBUG("session loaded session id %s\n", loggedSession->us_SessionID );
						if( ( loggedSession = USMUserSessionAdd( l->sl_USM, loggedSession ) ) != NULL )
						{
							if( loggedSession->us_User == NULL )
							{
								DEBUG("User is not attached to session %lu\n", loggedSession->us_UserID );
								User *lusr = l->sl_UM->um_Users;
								while( lusr != NULL )
								{
									if( loggedSession->us_UserID == lusr->u_ID )
									{
										loggedSession->us_User = lusr;
										break;
									}
									lusr = (User *)lusr->node.mln_Succ;
								}
							}
						//
						// update user and session
						//
							
							char tmpQuery[ 512 ];
							int lpos = 0;
							
							SQLLibrary *sqlLib =  l->LibrarySQLGet( l );
							if( sqlLib != NULL )
							{
								//
								// get UserMobileApp ID if possible
								//
								FULONG umaID = 0;
								if( deviceid != NULL )
								{
									int len = strlen( deviceid );
									int i;
									for( i=0 ; i < len ; i++ )
									{
										if( deviceid[ i ] == '_' )
										{
											lpos = i+1;
										}
									}
									if( lpos > 0 && lpos < len )
									{
										umaID = MobileManagerGetUMAIDByDeviceIDAndUserName( l->sl_MobileManager, sqlLib, loggedSession->us_UserID, &(deviceid[ lpos ] ) );
									}
								}
								
								DEBUG("UMAID %lu\n", umaID );
								
								//
								// update UserSession
								//
								
								sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE `FUserSession` SET LoggedTime=%lld,SessionID='%s',UMA_ID=%lu WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", (long long)loggedSession->us_LoggedTime, loggedSession->us_SessionID, umaID, deviceid,  loggedSession->us_UserID );
								if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
								{ 
									
								}

								//
								// update user
								//
							
								if( loggedSession->us_User != NULL )
								{
									sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE FUser SET LoggedTime = '%lld', SessionID='%s' WHERE `Name` = '%s'",  (long long)loggedSession->us_LoggedTime, loggedSession->us_User->u_MainSessionID, loggedSession->us_User->u_Name );
									
									if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
									{ 

									}
								}
								
								l->LibrarySQLDrop( l, sqlLib );
								
								DEBUG("[SystembaseWeb] user login\n");

								loggedSession->us_MobileAppID = umaID;
								UMAddUser( l->sl_UM, loggedSession->us_User );

								char *err = NULL;
								UserDeviceMount( l, loggedSession->us_User, 0, TRUE, &err, TRUE );
								if( err != NULL )
								{
									Log( FLOG_ERROR, "Login1 mount error. UserID: %lu Error: %s\n", loggedSession->us_User->u_ID, err );
									FFree( err );
								}

								userAdded = TRUE;
							}
						}
						else
						{
							FERROR("Cannot  add session\n");
						}

						char tmp[ 768 ];
						int tmpset = 0;
						User *loggedUser = NULL;
						if( loggedSession != NULL )
						{
							DoorNotificationRemoveEntriesByUser( l, loggedSession->us_ID );
							
							// since we introduced deviceidentities with random number, we must remove also old entries
							DoorNotificationRemoveEntries( l );
						
							loggedUser = loggedSession->us_User;
						
							Log( FLOG_INFO, "User authenticated %s sessionid %s \n", loggedUser->u_Name, loggedSession->us_SessionID );
						
							if( appname == NULL )
							{
								if( loggedSession->us_User != NULL && (loggedSession->us_User->u_Status == USER_STATUS_DISABLED || loggedSession->us_User->u_Status == USER_STATUS_BLOCKED ) )
								{
									char buffer[ 256 ];
									snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ACCOUNT_BLOCKED] , DICT_ACCOUNT_BLOCKED );
								}
								else
								{
									snprintf( tmp, sizeof(tmp) ,
										"{\"result\":\"%d\",\"sessionid\":\"%s\",\"level\":\"%s\",\"userid\":\"%ld\",\"fullname\":\"%s\",\"loginid\":\"%s\",\"username\":\"%s\"}",
										loggedUser->u_Error, loggedSession->us_SessionID , loggedSession->us_User->u_IsAdmin ? "admin" : "user", loggedUser->u_ID, loggedUser->u_FullName,  loggedSession->us_SessionID, loggedSession->us_User->u_Name );	// check user.library to display errors
									tmpset++;
								}
							}
							else
							{
								SQLLibrary *sqllib  = l->LibrarySQLGet( l );

								// Get authid from mysql
								if( sqllib != NULL )
								{
									char authid[ 512 ];
									authid[ 0 ] = 0;
								
									char qery[ 1024 ];
									sqllib->SNPrintF( sqllib, qery, sizeof( qery ),"select `AuthID` from `FUserApplication` where `UserID` = %lu and `ApplicationID` = (select ID from `FApplication` where `Name` = '%s' and `UserID` = %ld)",loggedUser->u_ID, appname, loggedUser->u_ID);
								
									void *res = sqllib->Query( sqllib, qery );
									if( res != NULL )
									{
										char **row;
										if( ( row = sqllib->FetchRow( sqllib, res ) ) )
										{
											snprintf( authid, sizeof(authid), "%s", row[ 0 ] );
										}
										sqllib->FreeResult( sqllib, res );
									}

									l->LibrarySQLDrop( l, sqllib );

									snprintf( tmp, sizeof(tmp), "{\"response\":\"%d\",\"sessionid\":\"%s\",\"authid\":\"%s\"}",
									loggedUser->u_Error, loggedUser->u_MainSessionID, authid
									);
									tmpset++;
								}
							}	// else to appname
						} //else to logginsession == NULL
						else
						{
							FERROR("[ERROR] User session was not added to list!\n" );
							char buffer[ 256 ];
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
						}
						if( tmpset != 0 )
							HttpAddTextContent( response, tmp );
					}
					else
					{
						char temp[ 1024 ];
						char buffer[ 256 ];
						
						if( blockedTime > 0 )
						{
							User *u = UMGetUserByName( l->sl_UM, usrname );
							if( u != NULL )
							{
								u->u_Status = USER_STATUS_BLOCKED;
							}
						}
						
						snprintf( buffer, sizeof(buffer), l->sl_Dictionary->d_Msg[DICT_ACCOUNT_BLOCKED], blockedTime );
						FERROR("[ERROR] User account '%s' will be blocked until: %lu seconds\n", usrname, blockedTime );

						snprintf( temp, sizeof(temp), "fail<!--separate-->{\"result\":\"-1\",\"response\":\"%s\", \"code\":\"%d\"}", buffer , DICT_ACCOUNT_BLOCKED );
						HttpAddTextContent( response, temp );
					}
				}
				else
				{
					FERROR("[ERROR] Authentication module not selected\n" );
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				FERROR("[ERROR] username,password,deviceid parameters not found\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_PASS_DEV_REQUIRED] , DICT_USER_PASS_DEV_REQUIRED );
				HttpAddTextContent( response, buffer );
			}
			
			if( deviceid != NULL )
			{
				FFree( deviceid );
			}
			
			if( usrname != NULL )
			{
				FFree( usrname );
			}
		}
		else
		{
			FERROR("[ERROR] no data in POST\n");
			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_POST_MODE_PARAMETERS_REQUIRED] , DICT_POST_MODE_PARAMETERS_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		*result = 200;
	}
	
	//
	// error
	//
	
	else	// if file, services, etc.
	{
		Log( FLOG_ERROR, "[SystemWeb]: Function not found '%s'\n", urlpath[ 0 ] );
		
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
	
		goto error;
	}
	
	// Ok, we will handle this one!
	if( (*result) == 404 )
	{
		DEBUG( "Closing socket with Http404!!" );
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};	
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE 404\n");
		}
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	}

	if( !response )
	{
		DEBUG( "Closing socket with Http 200 OK!!\n" );
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK, tags );
	}
	
	Log( FLOG_INFO, "\t\t\tWEB REQUEST FUNCTION func END: %s\n", urlpath[ 0 ] );
	
	DEBUG( "Systembase web request completed: %dms\n", GetUnixTime() - requestStart );
	
	FFree( sessionid );
	return response;
	
error:
	
	Log( FLOG_INFO, "\t\t\tWEB REQUEST FUNCTION func EERROR END: %s\n", urlpath[ 0 ] );
	
	FFree( sessionid );
	return response;
}

