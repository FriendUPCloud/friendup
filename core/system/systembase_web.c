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

/*

	SystemBase code

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
#include <properties/propertieslibrary.h>
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
#include <system/application/applicationweb.h>
#include <system/user/user_manager.h>
#include <system/fsys/fs_manager.h>
#include <system/fsys/fs_manager_web.h>
#include <system/fsys/fs_remote_manager_web.h>
#include <core/pid_thread_web.h>
#include <system/fsys/device_manager_web.h>
#include <network/mime.h>
#include <hardware/usb/usb_device_web.h>
#include <system/fsys/door_notification.h>
#include <system/admin/admin_web.h>

#define LIB_NAME "system.library"
#define LIB_VERSION 		1
#define LIB_REVISION		0
#define CONFIG_DIRECTORY	"cfg/"
#define LOGOUT_TIME         86400
/** @file
 * 
 *  Additional web functionality
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

//
//
//

extern int UserDeviceMount( SystemBase *l, MYSQLLibrary *sqllib, User *usr, int force );


/**
 * Get all parameters from Http request and conver them to string
 *
 * @param request Http request
 * @param loggedSession pointer to logged user session
 * @return pointer to memory where arguments are stored
 */

inline char *GetArgsAndReplaceSession( Http *request, UserSession *loggedSession )
{
	// Send both get and post
	int size = 0;
	//DEBUG( "Ok, lets see about that string\n" );
	FBOOL both = request->content && request->uri->queryRaw ? TRUE : FALSE;
	if( request->content != NULL ) size += strlen( request->content );
	if( request->uri->queryRaw != NULL ) size += strlen( request->uri->queryRaw );
	char *allArgsNew = NULL;
	
	//INFO("\t\t--->request->content %s raw %s \n\n", request->content, request->uri->queryRaw );
	
	int fullsize = size + ( both ? 2 : 1 );
	char *allArgs = FCalloc( fullsize, sizeof(char) );
	if( allArgs != NULL )
	{
		allArgsNew = FCalloc( fullsize+100, sizeof(char) );
	
		if( both == TRUE )
		{
			sprintf( allArgs, "%s&%s", request->content, request->uri->queryRaw );
		}
		else if( request->content )
		{
			sprintf( allArgs, "%s", request->content );
		}
		else
		{
			sprintf( allArgs, "%s", request->uri->queryRaw );
		}
	
		char *sessptr = NULL;
		if( ( sessptr = strstr( allArgs, "sessionid" ) ) != NULL )
		{
			int i=0;
			int j=0;
		
			int startpos = (sessptr - allArgs);
		
			FBOOL overwrite = FALSE;
			for( i=0 ; i < fullsize ; i++ )
			{
				if( i >= startpos && overwrite == FALSE )
				{
					char tmp[ 255 ];
					
					if( loggedSession != NULL && loggedSession->us_User != NULL )
					{
						if( allArgs[ i ] == '&' )
						{
							j += sprintf( tmp, "sessionid=%s&", loggedSession->us_User->u_MainSessionID );
							strcat( allArgsNew, tmp );
							overwrite = TRUE;
						}
						if( i == fullsize - 1 )
						{
							j += sprintf( tmp, "sessionid=%s", loggedSession->us_User->u_MainSessionID );
							strcat( allArgsNew, tmp );
							overwrite = TRUE;
						}
					}
					
					/*
					if( allArgs[ i ] == '&' )
					{
						j += sprintf( tmp, "sessionid=%lu&", loggedSession->us_User->u_ID );
						strcat( allArgsNew, tmp );
						overwrite = TRUE;
					}
					if( i == fullsize - 1 )
					{
						j += sprintf( tmp, "sessionid=%lu", loggedSession->us_User->u_ID );
						strcat( allArgsNew, tmp );
						overwrite = TRUE;
					}*/
				}
				else
				{
					allArgsNew[ j ] = allArgs[ i ];
					j++;
				}
			}
		}
		else
		{
			strcpy( allArgsNew, allArgs );
		}
		
		FFree( allArgs );
	}
	
	//DEBUG("\n\n--->allArgsNew %s  \n\n", allArgsNew );
	
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
	*result = 0;
	//int result = 0;
	Http *response = NULL;
	//UserSession *loggedSession = NULL;
	//User *loggedUser = NULL;
	FBOOL userAdded = FALSE;
	FBOOL detachTask = FALSE;
	
	Log( FLOG_INFO, \
"--------------------------------------------------------------------------------\n \
Webreq func: %s\n \
---------------------------------------------------------------------------------\n", urlpath[ 0 ] );
	
	//
	// DEBUG
	//
	
	//USMDebugSessions( l->sl_USM );
	
	char sessionid[ DEFAULT_SESSION_ID_SIZE ];
	sessionid[ 0 ] = 0;
    
    if( urlpath[ 0 ] == NULL )
    {
        FERROR("urlpath is equal to NULL!\n");
			
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		response = HttpNewSimple( HTTP_200_OK, tags );
		
		char *data = "fail<!--separate-->{\"response\":\"urlpath is equal to NULL\"}";
		HttpAddTextContent( response, data );
			
		return response;
    }
	
	// Check for sessionid by sessionid specificly or authid
	if( strcmp( urlpath[ 0 ], "login" ) != 0 && loggedSession == NULL )
	{
		char *authid = NULL;
		
		//DEBUG( "Finding login info.\n" );
		
		HashmapElement *tst = GetHEReq( *request, "sessionid" );
		HashmapElement *ast = GetHEReq( *request, "authid" );
		if( tst == NULL && ast == NULL )
		{			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE,(FULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION,(FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE }
			};
			char *data = "{\"response\":\"could not find sessionid or authid\"}";
			response = HttpNewSimple( HTTP_200_OK, tags );
			HttpAddTextContent( response, data );
			FERROR( "Could not log in, no sessionid or authid.. (404, %p, %p)\n", tst, ast );
			return response;
		}
		// Ah, we got our session
		if( tst )
		{
			char tmp[ DEFAULT_SESSION_ID_SIZE ];
			UrlDecode( tmp, (char *)tst->data );
			
			snprintf( sessionid, sizeof(sessionid), "%s", tmp );
			DEBUG( "Finding sessionid %s\n", sessionid );
		}
		// Get it by authid
		else if( ast )
		{
			//
			// check if request came from WebSockets
			//
			DEBUG("Authid received\n");
			
			if( (*request)->h_RequestSource == HTTP_SOURCE_WS )
			{
				char *assid = NULL;
				char *authid = NULL;
				
				DEBUG("HTTPSOURCEWS\n");
				
				HashmapElement *el =  HashmapGet( (*request)->parsedPostContent, "sasid" );
				if( el != NULL )
				{
					assid = UrlDecodeToMem( ( char *)el->data );
				}
				
				if( assid != NULL )
				{
					authid = UrlDecodeToMem( ( char *)ast->data );
					
					char *end;
					FUQUAD asval = strtoull( assid,  &end, 0 );
					
					DEBUG("assid != NULL\n");
					
					if( authid != NULL )
					{
						AppSession *as = AppSessionManagerGetSession( l->sl_AppSessionManager, asval );
						if( as != NULL )
						{
							//DEBUG("as !=NULL, trying to find user by authid %s\n", authid );
							
							SASUList *alist = as->as_UserSessionList;
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
				MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
				
				DEBUG("Session not found in appsessionid table\n");

				// Get authid from mysql
				if( sqllib != NULL )
				{
					char qery[ 1024 ];

					sqllib->SNPrintF( sqllib, qery, sizeof(qery), "SELECT * FROM ( ( SELECT u.SessionID FROM FUser u, FUserApplication a WHERE a.AuthID=\"%s\" AND a.UserID = u.ID LIMIT 1 ) UNION ( SELECT u2.SessionID FROM FUser u2, Filesystem f WHERE f.Config LIKE \"%s%s%s\" AND u2.ID = f.UserID LIMIT 1 ) ) z LIMIT 1",( char *)ast->data, "%", ( char *)ast->data, "%");
					
					MYSQL_RES *res = sqllib->Query( sqllib, qery );
					if( res != NULL )
					{
						MYSQL_ROW row;
						if( ( row = sqllib->FetchRow( sqllib, res ) ) )
						{
							if( row[ 0 ] != NULL )
							{
								snprintf( sessionid, sizeof(sessionid),"%s", row[ 0 ] );
							}
						}
						sqllib->FreeResult( sqllib, res );
					}
					l->LibraryMYSQLDrop( l, sqllib );
				}
			}
		}
		
		{
			time_t timestamp = time ( NULL );
			
			UserSession *curusrsess = l->sl_USM->usm_Sessions;
			int userFound = 0;
			
			DEBUG("Checking remote sessions\n");
				
			if( strcmp( sessionid, "remote" ) == 0 )
			{
				HashmapElement *uname = GetHEReq( *request, "username" );
				HashmapElement *passwd = GetHEReq( *request, "password" );
				FULONG blockedTime = 0;
				char *lpass = NULL;
				
				if( passwd != NULL )
				{
					if( passwd->data != NULL )
					{
						lpass = (char *)passwd->data;
					}
				}
				
				if( uname != NULL && uname->data != NULL  )
				{
					while( curusrsess != NULL )
					{
						User *curusr =curusrsess->us_User;
						
						if( curusr != NULL )
						{
							DEBUG("CHECK remote user: %s pass %s  provided pass %s \n", curusr->u_Name, curusr->u_Password, (char *)lpass );
						
							if( strcmp( curusr->u_Name, (char *)uname->data ) == 0  )
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
							
								if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, curusr, (char *)passwd->data, &blockedTime ) == TRUE )
								{
									//snprintf( sessionid, sizeof(sessionid), "%lu", curusrsess->us_User->u_ID );
									//strcpy( sessionid, curusrsess->us_User->u_MainSessionID );

									loggedSession =  curusrsess;
									userAdded = TRUE;		// there is no need to free resources

									break;
								}	// compare password
							}		// compare user name
						}	//if usr != NULL
						curusrsess = (UserSession *)curusrsess->node.mln_Succ;
					}
				}
			}
			else
			{
				pthread_mutex_lock( &(l->sl_USM->usm_Mutex) );
				DEBUG("Checking sessions\n");
				while( curusrsess != NULL )
				{
					//DEBUG( "Checking curusrsess.\n" );
					//DEBUG("\n\n\nProvided sessionid %s\n username %s\n usersession %s\n user session %s\n", sessionid, curusrsess->us_User->u_Name, curusrsess->us_SessionID, curusrsess->us_User->u_MainSessionID );	
					if( curusrsess->us_SessionID != NULL && curusrsess->us_User && curusrsess->us_User->u_MainSessionID != NULL )
					{
						if(  (strcmp( curusrsess->us_SessionID, sessionid ) == 0 || strcmp( curusrsess->us_User->u_MainSessionID, sessionid ) == 0 ) )
					//if( curusrsess->us_SessionID != NULL && strcmp( curusrsess->us_SessionID, sessionid ) == 0 )
						{
					// TODO: Reenable this once it works......
					/*if( ( timestamp - curusr->u_LoggedTime ) > LOGOUT_TIME )
					{
						Http_t* response = HttpNewSimple( 
							HTTP_200_OK, 4,
							"Content-Type", StringDuplicate( "text/plain" ),
							"Connection", StringDuplicate( "close" )
						);
					
						FERROR("User timeout\n");
						HttpAddTextContent( response, "{\"response\":\"timeout!\"}" );
					
						HttpWriteAndFree( response, sock );
					
						return 200;
					}
					else
					{
						curusr->u_LoggedTime = timestamp;
					}*/
						//loggedUser = curusr;
							loggedSession = curusrsess;
							userAdded = TRUE;		// there is no need to free resources
							User *curusr = curusrsess->us_User;
						
						
							//DEBUG("FOUND user: %s sessionid %s matched on %s\n", curusr->u_Name, curusrsess->us_SessionID, sessionid );
							DEBUG("FOUND user: %s session sessionid %s provided session %s\n", curusr->u_Name, curusrsess->us_SessionID, sessionid );
							break;
						}
					}
					curusrsess = (UserSession *)curusrsess->node.mln_Succ;
				}
				pthread_mutex_unlock( &(l->sl_USM->usm_Mutex) );
			}
		}
		
		if( loggedSession == NULL )
		{
			FERROR("User not found !\n");
			
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL )
			{
				HttpFree( response );
				FERROR("RESPONSE no user\n");
			}
			response = HttpNewSimple( HTTP_200_OK, tags );
			
			char *data = "fail<!--separate-->{\"response\":\"user session not found\"}";
			HttpAddTextContent( response, data );
				
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
			
			MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );
			if( sqllib != NULL )
			{
				char *tmpQuery = FCalloc( 1025, sizeof( char ) );
				if( tmpQuery )
				{
					//sqllib->SNPrintF( sqllib, tmpQuery, 1024, "UPDATE FUser SET `LoggedTime` = '%lu' WHERE `SessionID` = '%s'", timestamp, sessionid );
					//sprintf( tmpQuery, "UPDATE FUser SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionid );
					//sqllib->SimpleQuery( sqllib, tmpQuery );
					
					//DEBUG("QUERY: %s\n", tmpQuery );
				
					// there is no need to "try to mount devices" for users every call
					// it looks like that FC fill devices structure later then Workspace is reading it
					//UserDeviceMount( l, sqllib, loggedSession->us_User, 0 );
				
					//memset( tmpQuery, '\0', 255 );
					sqllib->SNPrintF( sqllib, tmpQuery, 1024, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionid );
					//sprintf( tmpQuery, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", timestamp, sessionid );
					sqllib->QueryWithoutResults( sqllib, tmpQuery );
				
					
					
					INFO("Logged time updated: %lu\n", timestamp );
				
					FFree( tmpQuery );
				}
				l->LibraryMYSQLDrop( l, sqllib );
			}
		}
	}
	
	//
	// check detach task parameter
	//
	
	HashmapElement *dtask = GetHEReq( *request, "detachtask" );
	if( dtask != NULL )
	{
		if( dtask->data != NULL && strcmp( "true", dtask->data ) == 0 )
		{
			detachTask = TRUE;
			DEBUG("Task will be detached\n");
		}
	}
	
	if( *request != NULL )
	{
		(*request)->h_UserSession = loggedSession;
	}
	
	if( (*request)->h_RequestSource == HTTP_SOURCE_WS )
	{
		DEBUG(" request %p  uri %p\n", (*request),(*request)->uri );
		UserLoggerStore( l->sl_ULM, loggedSession, (*request)->uri->queryRaw , loggedSession->us_UserActionInfo );
	}
	else
	{
		UserLoggerStore( l->sl_ULM, loggedSession, (*request)->rawRequestPath, (*request)->h_UserActionInfo );
	}
	
	//
	// help function
	//
	
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "ok<!--separate-->{\"HELP\":\"commands: \n" 
				"- user: \n" 
				"\tcreate - create user in database\n" 
				"\tlogin - login user to system\n"
				"\tlogout - logout user from system\n\n"
				"- module - run module\n\n"
				"- device:\n"
				"\tmount - mount device\n"
				"\tunmount - unmount device\n\n"
				"\tlist - list all mounted devices\n"
				"\tlistsys - take all avaiable file systems\n"
				"- file:\n"
				"\tinfo - get information about file/directory\n"
				"\tdir - get all files in directory\n"
				"\trename - rename file or directory\n"
				"\tdelete - delete all files or directory (and all data in directory)\n"
				"\tmakedir - make new directory\n"
				"\texec - run command\n"
				"\tread - read bytes from file\n"
				"\twrite - write files to file\n"
				"\"}" );
		
		*result = 200;
	
	}
	
	//
	// login function
	//
	
	else if( strcmp(  urlpath[ 0 ], "login" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
	
		if( (*request)->parsedPostContent != NULL )
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
				//usrname = (char *)el->data;
				usrname = UrlDecodeToMem( (char *)el->data );
			}
			
			// Fetch public key
			el = HttpGetPOSTParameter( *request, "encryptedblob" );
			if( el != NULL )
				encryptedBlob = ( char *)el->data;
			
			el = HttpGetPOSTParameter( *request, "password" );
			if( el != NULL )
			{
				pass = ( char *)el->data;
			}
			
			el = HttpGetPOSTParameter( *request, "appname" );
			if( el != NULL )
			{
				appname = ( char *)el->data;
			}
			
			el = HttpGetPOSTParameter( *request, "deviceid" );
			if( el != NULL )
			{
				deviceid = (char *)el->data;
			}
			
			el = HttpGetPOSTParameter( *request, "sessionid" );
			if( el != NULL )
			{
				locsessionid = ( char *)el->data;
			}
			
			if( locsessionid != NULL && deviceid != NULL )
			{
				UserSession *us = USMGetSessionBySessionID( l->sl_USM, locsessionid );
				
				if( us == NULL )
				{
					us = USMGetSessionBySessionIDFromDB( l->sl_USM, locsessionid );
				}
				
				if( us != NULL )
				{
					loggedSession = us;
					
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
						
						MYSQLLibrary *sqlLib =  l->LibraryMYSQLGet( l );
						if( sqlLib != NULL )
						{
							sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE `FUserSession` SET LoggedTime = %lld, DeviceIdentity='%s' WHERE `SessionID` = '%s", (long long)loggedSession->us_LoggedTime, deviceid,  loggedSession->us_SessionID );
							if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
							{ 
								
							}
							
							//
							// update user
							//
							
							sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE FUser SET LoggedTime = '%lld', SessionID='%s' WHERE `Name` = '%s'",  (long long)loggedSession->us_LoggedTime, loggedSession->us_User->u_MainSessionID, loggedSession->us_User->u_Name );
							if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
							{ 
								
							}
							
							UMAddUser( l->sl_UM, loggedSession->us_User );
							
							DEBUG("New user and session added\n");
							
							UserDeviceMount( l, sqlLib, loggedSession->us_User, 0 );
							
							DEBUG("Devices mounted\n");
							userAdded = TRUE;
							l->LibraryMYSQLDrop( l, sqlLib );
						}
						else
						{
							loggedSession = NULL;
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
					snprintf( tmp, sizeof(tmp),
						"{\"result\":\"%d\",\"sessionid\":\"%s\",\"userid\":\"%ld\",\"fullname\":\"%s\",\"loginid\":\"%s\"}",
						0, loggedSession->us_SessionID , loggedSession->us_User->u_ID, loggedSession->us_User->u_FullName,  loggedSession->us_SessionID
					);
				}
				else
				{
					strcpy( tmp, "fail<!--separate-->{\"result\":\"-1\",\"response\":\"no access\"}" );
				}
				
				HttpAddTextContent( response, tmp );
			}
			// Public key mode
			// TODO: Implement this! Ask Chris and Hogne!
			else if( usrname != NULL && encryptedBlob != NULL && deviceid != NULL )
			{
				HttpAddTextContent( response, "{\"result\":\"-1\",\"response\":\"public key not supported yet\"}" );
			}
			// standard username and password mode
			else if( usrname != NULL && pass != NULL && deviceid != NULL )
			{
				DEBUG("Found logged user under address uanem %s pass %s deviceid %s\n", usrname, pass, deviceid );
				
				//
				// first we must find user
				// if sessionid is not provided we must create new session
				//
				
				if( l->sl_ActiveAuthModule != NULL )
				{
					UserSession *dstusrsess = NULL;
					UserSession *tusers = l->sl_USM->usm_Sessions;
					
					FBOOL isUserSentinel = FALSE;
					
					pthread_mutex_lock( &(l->sl_USM->usm_Mutex) );
					
					if( deviceid == NULL )
					{
						while( tusers != NULL )
						{
							DEBUG("Checking sessions %p\n", tusers->us_User );
							User *tuser = tusers->us_User;
							// Check both username and password

							if( strcmp(tuser->u_Name, usrname ) == 0 )
							{
								FBOOL isUserSentinel = FALSE;
							
								Sentinel *sent = l->GetSentinelUser( l );
								if( sent != NULL )
								{
									if( tuser == sent->s_User )
									{
										isUserSentinel = TRUE;
									}
								}
								if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, tuser, pass, &blockedTime ) == TRUE )
								{
									dstusrsess = tusers;
									DEBUG("Found user session  id %s\n", tusers->us_SessionID );
									
									//UMStoreLoginAttempt( l->sl_UM, usrname, "Login success: on list or Sentinel", NULL );
									break;
								}
							}
							tusers = (UserSession *)tusers->node.mln_Succ;
						}
					}
					else	// deviceid != NULL
					{
						while( tusers != NULL )
						{
							//DEBUG("Checking sessions %p finding devid: %s usrname: %s\n", tusers->us_User,deviceid, usrname );
							User *tuser = tusers->us_User;
							// Check both username and password

							if( tusers->us_DeviceIdentity != NULL && tuser != NULL )
							{
								//DEBUG("DEVID %s\n", tusers->us_DeviceIdentity );
								
								if( strcmp( tusers->us_DeviceIdentity, deviceid ) == 0 && strcmp( tuser->u_Name, usrname ) == 0 )
								{
									Sentinel *sent = l->GetSentinelUser( l );
									if( sent != NULL )
									{
										if( tuser == sent->s_User )
										{
											isUserSentinel = TRUE;
										}
										DEBUG("Same identity, same user name, is sentinel %d  userptr %p sentinelptr %p\n", isUserSentinel, tuser, sent->s_User );
									}

									if( isUserSentinel == TRUE || l->sl_ActiveAuthModule->CheckPassword( l->sl_ActiveAuthModule, *request, tuser, pass, &blockedTime ) == TRUE )
									{
										dstusrsess = tusers;
										DEBUG("Found user session  id %s\n", tusers->us_SessionID );
										
										//UMStoreLoginAttempt( l->sl_UM, usrname,  "Login success: on list or Sentinel", NULL );
										break;
									}
								}
							}
							tusers = (UserSession *)tusers->node.mln_Succ;
						}
					}
					pthread_mutex_unlock( &(l->sl_USM->usm_Mutex) );
					
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
						
						//USMUserSessionAdd( l->sl_USM, loggedSession );
						
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
							
							MYSQLLibrary *sqlLib =  l->LibraryMYSQLGet( l );
							if( sqlLib != NULL )
							{
								sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE `FUserSession` SET LoggedTime = %lld, SessionID='%s' WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", (long long)loggedSession->us_LoggedTime, loggedSession->us_SessionID, deviceid,  loggedSession->us_UserID );
								if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
								{ 
									
								}

								//
								// update user
								//
							
								sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE FUser SET LoggedTime = '%lld', SessionID='%s' WHERE `Name` = '%s'",  (long long)loggedSession->us_LoggedTime, loggedSession->us_User->u_MainSessionID, loggedSession->us_User->u_Name );
								if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) )
								{ 

								}

								UMAddUser( l->sl_UM, loggedSession->us_User );

								DEBUG("New user and session added\n");

								UserDeviceMount( l, sqlLib, loggedSession->us_User, 0 );

								DEBUG("Devices mounted\n");
								userAdded = TRUE;
								l->LibraryMYSQLDrop( l, sqlLib );
							}
							DEBUG("Library dropped\n");
						}
						else
						{
							FERROR("Cannot  add session\n");
						}
						
						if( loggedSession != NULL )
						{
							DoorNotificationRemoveEntriesByUser( l, loggedSession->us_ID );
							
							// since we introduced deviceidentities with random number, we must remove also old entries
							DoorNotificationRemoveEntries( l );
						}
						
						User *loggedUser = loggedSession->us_User;
						
						INFO(  "User authenticated %s sessionid %s\n", loggedUser->u_Name, loggedSession->us_SessionID );
						Log( FLOG_INFO, "User authenticated %s sessionid %s \n", loggedUser->u_Name, loggedSession->us_SessionID );
						
						char tmp[ 512 ];
						
						if( appname == NULL )
						{
							snprintf( tmp, 512,
								"{\"result\":\"%d\",\"sessionid\":\"%s\",\"userid\":\"%ld\",\"fullname\":\"%s\",\"loginid\":\"%s\"}",
								loggedUser->u_Error, loggedSession->us_SessionID , loggedUser->u_ID, loggedUser->u_FullName,  loggedSession->us_SessionID
							);	// check user.library to display errors
							
							DEBUG("appname = NULL, returning response %s\n", tmp );
						}
						else
						{
							MYSQLLibrary *sqllib  = l->LibraryMYSQLGet( l );

							// Get authid from mysql
							if( sqllib != NULL )
							{
								char authid[ 512 ];
								authid[ 0 ] = 0;
								
								char qery[ 1024 ];
								//snprintf( q, sizeof( q ),"select `AuthID` from `FUserApplication` where `UserID` = %lu and `ApplicationID` = (select ID from `FApplication` where `Name` = '%s' and `UserID` = %ld)",loggedUser->u_ID, appname, loggedUser->u_ID);
								sqllib->SNPrintF( sqllib, qery, sizeof( qery ),"select `AuthID` from `FUserApplication` where `UserID` = %lu and `ApplicationID` = (select ID from `FApplication` where `Name` = '%s' and `UserID` = %ld)",loggedUser->u_ID, appname, loggedUser->u_ID);
								
								MYSQL_RES *res = sqllib->Query( sqllib, qery );
								if( res != NULL )
								{
									MYSQL_ROW row;
									if( ( row = sqllib->FetchRow( sqllib, res ) ) )
									{
										sprintf( authid, "%s", row[ 0 ] );
									}
									sqllib->FreeResult( sqllib, res );
								}

								l->LibraryMYSQLDrop( l, sqllib );

								snprintf( tmp, 512, "{\"response\":\"%d\",\"sessionid\":\"%s\",\"authid\":\"%s\"}",
										  loggedUser->u_Error, loggedUser->u_MainSessionID, authid
								);
							}
						}
						HttpAddTextContent( response, tmp );
					}
					else
					{
						char temp[ 1024 ];
						snprintf( temp, sizeof(temp), "fail<!--separate-->{\"result\":\"-1\",\"response\":\"account blocked until: %lu\"}", blockedTime );
						FERROR("[ERROR] User not found by user.library\n" );
						HttpAddTextContent( response, temp );			// out of memory/user not found
					}
				}
				else
				{
					FERROR("[ERROR] User.library is not opened\n" );
					HttpAddTextContent( response, "{\"result\":\"-1\",\"response\":\"user.library is not opened!\"}" );
				}
			}
			else
			{
				FERROR("[ERROR] username or password not found\n" );
				HttpAddTextContent( response, "{\"result\":\"-1\",\"response\":\"username, password and/or deviceid not found!\"}" );
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
		
			HttpAddTextContent( response, "{\"result\":\"-1\",\"response\":\"no post pararmeters received.\"}");
		}
		*result = 200;
	}
	
	//
	//user
	//
	
	//
	// user function
	//
	
	else if( strcmp(  urlpath[ 0 ], "user" ) == 0 )
	{
		DEBUG("User\n");
		response = UMWebRequest( l, urlpath, (*request), loggedSession, result );
	}
	
	//
	// Polling a module!
	//
	
	else if( strcmp( urlpath[ 0 ], "module" ) == 0 )
	{
		// Now go ahead
		struct stat f;
		char *data = NULL;
		unsigned long dataLength = 0;
		DEBUG( "[MODULE] Trying modules folder...\n" );
		FBOOL phpCalled = FALSE;

		HashmapElement *he = HttpGetPOSTParameter( (*request), "module" );
		if( he == NULL ) he = HashmapGet( (*request)->query, "module" );
		// checking if module is in cache and use it if there is need
		
		if( he != NULL && he->data != NULL )
		{
			char *module = (char *)he->data;
			int size = 0;
			if( ( size = strlen( module ) ) > 4 )
			{
				if( module[ size-4 ] == '.' &&module[ size-3 ] == 'p'  &&module[ size-2 ] == 'h'  &&module[ size-1 ] == 'p' \
					&& l->sl_PHPModule != NULL )
				{
					char runfile[ 512 ];
					snprintf( runfile, sizeof(runfile), "modules/%s/module.php", module );
					
					if( stat( runfile, &f ) != -1 )
					{
						DEBUG("MODRUNPHP %s\n", runfile );
						char *allArgsNew = GetArgsAndReplaceSession( *request, loggedSession );
						if( allArgsNew != NULL )
						{
							data = l->sl_PHPModule->Run( l->sl_PHPModule, runfile, allArgsNew, &dataLength );
							phpCalled = TRUE;
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
				// 2. Check if module folder exists in modules/

				if( he != NULL )
				{
					char *module = ( char *)he->data;
					//char *path = FCalloc( 5, sizeof( char ) );
					char path[ 512 ];
					snprintf( path, sizeof(path), "modules/%s", module );
					path[ 511 ] = 0;
					
					if( stat( path, &f ) != -1 )
					{
						// 3. Determine interpreter (or native code)
						DIR *fdir = NULL;
						struct dirent *fdirent = NULL;
						char *modType = NULL;
						
						if( ( fdir = opendir( path ) ) != NULL )
						{
							while( ( fdirent = readdir( fdir ) ) )
							{
								char component[ 10 ];

								sprintf( component, "%.*s", 6, fdirent->d_name );

								if( strcmp( component, "module" ) == 0 )
								{
									int hasExt = 0;
									int dlen = strlen( fdirent->d_name );
									int ie = 0;
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
										int extlen = dlen - 7;
										if( modType )
										{
											FFree( modType );
										}
										modType = FCalloc( extlen + 1, sizeof( char ) );
										ie = 0; int md = 0, typec = 0;
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
									}
								}
							}
							closedir( fdir );
						}
		
						// 4. Execute with interpreter (or execute native code)
						if( modType != NULL )
						{
							DEBUG( "[MODULE] Executing %s module! path %s\n", modType, path );
							char *modulePath = FCalloc( 256, sizeof( char ) );
							snprintf( modulePath, 256, "%s/module.%s", path, modType );
							if( 
								strcmp( modType, "php" ) == 0 || 
								strcmp( modType, "jar" ) == 0 ||
								strcmp( modType, "py" ) == 0
							)
							{
								char *allArgsNew = GetArgsAndReplaceSession( *request, loggedSession );

								// Execute
								data = l->RunMod( l, modType, modulePath, allArgsNew, &dataLength );
								
								// We don't use them now
								if( allArgsNew != NULL )
								{
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
					//FFree( path );
				}
			}
		}
		DEBUG("Module executed...\n");
		
		if( data != NULL )
		{
			//DEBUG("Data is avaiable %s\n", data );

			// 5. Piped response will be output!
			char *ltype  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Type"   ) : NULL;
			char *length = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Length" ) : NULL;
			char *dispo  = dataLength ? CheckEmbeddedHeaders( data, dataLength, "Content-Disposition" ) : NULL;
			char *code = CheckEmbeddedHeaders( data, dataLength, "Status Code" );
			
			/*
			{
				char *ldata="---http-headers-begin---\nStatus Code: 200\n---http-headers-end---\n";
				//char *
				code =  strlen(ldata) ? CheckEmbeddedHeaders( ldata, strlen(ldata), "Status Code" ) : NULL;
				FERROR("\n\n\n\n\n\n\nCODE %s\n\n\n\n\n\ndlen %d\n", code,  strlen(ldata) );
			}
			*/
			//FERROR("\n\n\n\n\n\n\nCODE %s\n\n\n\n\n\ndlen %d\n", code,  dataLength );

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

				if( response )
				{
					char *next;
					int calSize = strtol (length, &next, 10);
					if( ( next == length ) || ( *next != '\0' ) ) 
					{
						FERROR( "Lenght of message == 0\n" );
					}
					else
					{
						DEBUG( "file size counted %d\n", calSize );
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
				DEBUG("Create default response\n");
					
				struct TagItem tags[] = {
					{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  ( ltype != NULL ? StringDuplicateN( ltype, strlen( ltype ) ) : StringDuplicate( "text/plain" ) ) },
					{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
					{TAG_DONE, TAG_DONE}
				};

				if( response != NULL )
				{
					FERROR("RESPONSE ERROR ALREADY SET (freeing)\n");
					HttpFree( response );
				}
				
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
			FERROR("[System.library] ERROR returned data is NULL\n");
			*result = 404;
		}
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
			//FUQUAD PIDThreadManagerRunThread( PIDThreadManager *ptm, Http *request, char **url, void *us, void *func )
			DEBUG("Ptr to request %p\n", *request );
			FUQUAD pid = PIDThreadManagerRunThread( l->sl_PIDTM, *request, urlpath, loggedSession, FSMWebRequest );
			
			response = HttpNewSimpleA( HTTP_200_OK, (*request), HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ),
									   HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),TAG_DONE, TAG_DONE );
			
			char pidtxt[ 256 ];
			snprintf( pidtxt, sizeof(pidtxt), "ok<!--separate-->{\"PID\":\"%llu\"}", pid );
			
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
		response =  AdminWebRequest( l, urlpath, request, loggedSession, result );
		
	}

	//
	// network only memory
	//
	
	else if( strcmp( urlpath[ 0 ], "invar" ) == 0 )
	{
		INFO("INRAM called\n");
		response =  INVARManagerWebRequest( l->nm, &(urlpath[1]), *request );
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
			if( UMUserIsAdmin( l->sl_UM, *request, loggedSession->us_User ) == TRUE )
			{
				response =  ServiceManagerWebRequest( l->fcm, &(urlpath[1]), *request );
				called = TRUE;
			}
		}
		
		if( called == FALSE )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicateN( "text/html", 9 ) },
				{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
				{TAG_DONE, TAG_DONE}
			};
		
			if( response != NULL )
			{
				HttpFree( response );
				FERROR("RESPONSE services\n");
			}
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"access denied\"}" );

			goto error;
		}
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
		}
		HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"You dont have access to 'pid' functions\" }" );
	}
	
	//
	// error
	//
	
	else	// if file, services, etc.
	{
		FERROR("Function not found %s\n", urlpath[ 0 ] );
		
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE unknown function\n");
		}
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
		HttpAddTextContent( response, "ok<!--separate-->{\"response\":\"function not found\"}" );
	
		goto error;
	}
	
	/*
	if( loggedUser )
	{
		DEBUG("WebRequest end OK result: %d  loggeduser %p\n", result, loggedUser );
		if( l->sl_Sessions )
		{
			//INFO("USER %s SESSIONS %p\n", loggedUser->u_Name, l->sl_Sessions );
		}
		else
		{
			//INFO( "USER %s HAS NO SESSION ANYMORE!!!\n", loggedUser->u_Name );
		}
	}*/
	
	// Ok, we will handle this one!
	if( (*result) == 404 )
	{
		DEBUG( "Closing socket with Http404!!" );
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};	
		
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("RESPONSE 404\n");
		}
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	}
	
	DEBUG("Response pointer %p\n", response );
	/*
	if( userAdded == FALSE && loggedUser != NULL )
	{

	}*/
	
	if( !response )
	{
		DEBUG( "Closing socket with Http 200 OK!!\n" );
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};	
		
		/*
		if( response != NULL )
		{
			HttpFree( response );
			FERROR("Do RESPONSE no response\n");
		}
		*/
		response = HttpNewSimple( HTTP_200_OK, tags );
	}
	
	//FERROR(">>>>>>>>>>>>>>%s %s\n", urlpath[ 0 ], urlpath[ 1 ] );
	
	return response;
	
error:
	
	DEBUG("WebRequest end ERROR\n");
	/*
	if( userAdded == FALSE && loggedUser != NULL )
	{

	}
	*/
	FERROR(">>>>>>>>>>>>>>%s %s\n", urlpath[ 0 ], urlpath[ 1 ] );
	
	return response;
}

