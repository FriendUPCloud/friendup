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
 *  User Manager Web body
 *
 * All functions related to User Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#include <core/types.h>
#include <core/nodes.h>
#include "user_manager_web.h"
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <system/user/user_sessionmanager.h>
#include <util/session_id.h>

//test
//#undef __DEBUG

inline static int killUserSession( SystemBase *l, UserSession *ses )
{
	int error = 0;
	char tmpmsg[ 2048 ];
	int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
	
	int msgsndsize = WebSocketSendMessageInt( ses, tmpmsg, lenmsg );
	
	char *uname = NULL;
	if( ses->us_User != NULL )
	{
		uname = ses->us_User->u_Name;
	}
		
	DEBUG("[UMWebRequest] user %s session %s will be removed by user %s msglength %d\n", uname, ses->us_SessionID, uname, msgsndsize );
	
	// set flag to WS connection "te be killed"
	FRIEND_MUTEX_LOCK( &(ses->us_Mutex) );
	ses->us_InUseCounter--;
	if( ses->us_WSConnections != NULL && ses->us_WSConnections->wusc_Data != NULL )
	{
		ses->us_WSConnections->wusc_Status = WEBSOCKET_SERVER_CLIENT_TO_BE_KILLED;
	}
	FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
	
	// wait till queue will be empty
	while( TRUE )
	{
		FRIEND_MUTEX_LOCK( &(ses->us_Mutex) );
		if( ses->us_WSConnections == NULL || ses->us_WSConnections->wusc_Data == NULL || ses->us_WSConnections->wusc_Data->wsc_MsgQueue.fq_First == NULL )
		{
			FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
			break;
		}
		FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
		usleep( 1000 );
	}
	
	error = USMUserSessionRemove( l->sl_USM, ses );	
	return error;
}

inline static int killUserSessionByUser( SystemBase *l, User *u, char *deviceid )
{
	int error = 0;
	int nrSessions = 0;
	int i;
	
	UserSession **toBeRemoved = NULL;
	
	FRIEND_MUTEX_LOCK( &u->u_Mutex );
	UserSessListEntry *usl = u->u_SessionsList;
	if( deviceid != NULL )
	{
		while( usl != NULL )
		{
			UserSession *s = (UserSession *) usl->us;
			if( s != NULL && s->us_DeviceIdentity != NULL && strcmp( s->us_DeviceIdentity, deviceid ) == 0 )
			{
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
				
				int msgsndsize = WebSocketSendMessageInt( s, tmpmsg, lenmsg );

				DEBUG("Bytes send: %d\n", msgsndsize );
			
				break;
			}
			usl = (UserSessListEntry *)usl->node.mln_Succ;
			nrSessions++;
		}
	}
	else
	{
		while( usl != NULL )
		{
			UserSession *s = (UserSession *) usl->us;
			if( s != NULL )
			{
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
				
				int msgsndsize = WebSocketSendMessageInt( s, tmpmsg, lenmsg );

				DEBUG("Bytes send: %d\n", msgsndsize );
			
				break;
			}
			usl = (UserSessListEntry *)usl->node.mln_Succ;
			nrSessions++;
		}
	}
	
	// assign UserSessions to temporary table
	if( nrSessions > 0 )
	{
		toBeRemoved = FMalloc( nrSessions * sizeof(UserSession *) );
		i = 0;
		while( usl != NULL )
		{
			toBeRemoved[ i ] = (UserSession *) usl->us;
			usl = (UserSessListEntry *)usl->node.mln_Succ;
			i++;
		}
	}
	
	FRIEND_MUTEX_UNLOCK( &u->u_Mutex );
	
	// remove sessions
	for( i=0 ; i < nrSessions ; i++ )
	{
		UserSession *ses = toBeRemoved[ i ];
		
		FRIEND_MUTEX_LOCK( &(ses->us_Mutex) );
		ses->us_InUseCounter--;
		if( ses->us_WSConnections != NULL && ses->us_WSConnections->wusc_Data != NULL )
		{
			ses->us_WSConnections->wusc_Status = WEBSOCKET_SERVER_CLIENT_TO_BE_KILLED;
		}
		FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
		
		// wait till queue will be empty
		while( TRUE )
		{
			if( ses->us_WSConnections ->wusc_Data->wsc_MsgQueue.fq_First == NULL )
			{
				break;
			}
			usleep( 1000 );
		}
		
		error = USMUserSessionRemove( l->sl_USM, ses );
	}
	
	if( toBeRemoved != NULL )
	{
		FFree( toBeRemoved );
	}
	
	return error;
}

inline static void NotifyExtServices( SystemBase *l, Http *request, User *usr, char *action )
{
	BufString *bs = BufStringNew();

	char msg[ 512 ];
	int msize = 0;
	
	if( usr->u_Status == USER_STATUS_DISABLED )
	{
		msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"name\":\"%s\",\"groups\":[", usr->u_UUID, usr->u_ModifyTime, usr->u_Name );
		BufStringAddSize( bs, msg, msize );
		//UGMGetUserGroupsDB( l->sl_UGM, usr->u_ID, bs );
	}
	else
	{
		msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":false,\"lastupdate\":%lu,\"name\":\"%s\",\"groups\":[", usr->u_UUID, usr->u_ModifyTime, usr->u_Name );
		BufStringAddSize( bs, msg, msize );
		UGMGetUserGroupsDB( l->sl_UGM, usr->u_ID, bs );
	}

	BufStringAddSize( bs, "]}", 2 );
	
	DEBUG("NotifyExtServices3: %s\n", bs->bs_Buffer );
	
	DEBUG("NotifyExtServices - send information to 3rd party services\n");
	NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "user", action, bs->bs_Buffer );
	
	BufStringDelete( bs );
}

/**
 * Http web call processor
 * Function which process all incoming Http requests
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession pointer to UserSession which called this function
 * @param result pointer to result value
 * @param sessionRemoved pointer to FBOOL where information about logout will be stored
 * @return response as Http structure, otherwise NULL
 */
Http *UMWebRequest( void *m, char **urlpath, Http *request, UserSession *loggedSession, int *result, FBOOL *sessionRemoved )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	if( urlpath[ 1 ] == NULL )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		HttpAddTextContent( response, "fail<!--separate-->Function not found" );
		
		return response;
	}
	else
	{
		/// @cond WEB_CALL_DOCUMENTATION
		/**
		* 
		* <HR><H2>system.library/user/help</H2>Return available commands
		*
		* @param sessionid - (required) session id of logged user
		* @return avaiable user commands
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
				"create - create user in database" 
				",login - login user to system"
				",logout - logout user from system"
				"\"}" );
		
			*result = 200;
			
			return response;
		}
	}
	
	// sessions
	
	if( urlpath[ 2 ] != NULL && strcmp( urlpath[ 1 ], "session" ) == 0 )
	{
		/// @cond WEB_CALL_DOCUMENTATION
		/**
		*
		* <HR><H2>system.library/user/session/setname</H2>Set session name
		*
		* @param sessionid - (required) session id of logged user
		* @param name - (required) message which will be send (JSON or string in quotes)
		* @param dstsessionid - sessionid of user which will get new name. If parameter will not be passed current session will get the name.
		* @return { setname: sucess } when success, otherwise error with code
		*/
		/// @endcond
	
		if( strcmp( urlpath[ 2 ], "setname" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
			
			char *sessionid = NULL;
			FBOOL nameSet = FALSE;
			char *name = NULL;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "dstsessionid" );
			if( el != NULL )
			{
				sessionid = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "name" );
			if( el != NULL )
			{
				name = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			if( name != NULL )
			{
				if( sessionid != NULL )
				{
					User *usr = loggedSession->us_User;
					FRIEND_MUTEX_LOCK( &usr->u_Mutex );
					UserSessListEntry *ses = usr->u_SessionsList;
					while( ses != NULL )
					{
						UserSession *uses = (UserSession *) ses->us;
						if( strcmp( sessionid, uses->us_SessionID ) == 0 )
						{
							strncpy( uses->us_Name, name, sizeof( uses->us_Name ) );
							nameSet = TRUE;
						}
						ses = (UserSessListEntry *)ses->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
				}
				else
				{
					strncpy( loggedSession->us_Name, name, sizeof( loggedSession->us_Name )  );
					nameSet = TRUE;
				}
				
				if( nameSet == TRUE )
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"setname\": \"success\"}" );
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{ \"setname\": \"fail, please check FC logs\"}" );
				}
				
				FFree( name );
			}
			else
			{
				FERROR("name parameter is missing\n");
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
			
			if( sessionid != NULL )
			{
				FFree( sessionid );
			}

			*result = 200;
		}
		
		/// @cond WEB_CALL_DOCUMENTATION
		/**
		*
		* <HR><H2>system.library/user/session/sendmsg</H2>Send message to another user session
		*
		* @param sessionid - (required) session id of logged user
		* @param msg - (required) message which will be send (JSON or string in quotes)
		* @param dstsessionid - destination sessionid of user
		* @param appname - application name string
		* @param dstauthid - application authentication ID
		* @return { sendmsg: sucess } when success, otherwise error with code
		*/
		/// @endcond
	
		else if( strcmp( urlpath[ 2 ], "sendmsg" ) == 0 )
		{
			struct TagItem tags[] = {
				{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
				{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
				{ TAG_DONE, TAG_DONE}
			};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
			char *sessionid = NULL;
			char *msg = NULL;
			char *appname = NULL;
			char *authid = NULL;
		
			FERROR( "[UMWebRequest] send message" );
		
			HashmapElement *el = HttpGetPOSTParameter( request, "dstsessionid" );
			if( el != NULL )
			{
				sessionid = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "msg" );
			if( el != NULL )
			{
				msg = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "appname" );
			if( el != NULL )
			{
				appname = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "dstauthid" );
			if( el != NULL )
			{
				authid = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			User *u = loggedSession->us_User;
		
			if( msg != NULL )
			{
				int msgsndsize = 0;
				DEBUG("[UMWebRequest] Send message session by sessionid\n");
			
				int msgsize = 512 + strlen(msg);
				char *tmpmsg = FMalloc( msgsize );
				if( tmpmsg != NULL )
				{
					if( authid != NULL )
					{
						FULONG userId = 0;
						
						SQLLibrary *sqllib  = l->LibrarySQLGet( l );
						if( sqllib != NULL )
						{
							char q[ 1024 ];
							
							sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT `UserId` FROM `FApplication` a  WHERE ua.AuthID=\"%s\" and ua.ApplicationID = a.ID LIMIT 1", authid );

							void *res = sqllib->Query( sqllib, q );
							if( res != NULL )
							{
								char **row;
								if( ( row = sqllib->FetchRow( sqllib, res ) ) )
								{
									char *next;
									userId = strtol ( (char *)row[ 0 ], &next, 0 );
								}
								sqllib->FreeResult( sqllib, res );
							}
							l->LibrarySQLDrop( l, sqllib );
						}
						
						if( userId > 0 )
						{
							u = UMGetUserByID( l->sl_UM, userId );
						}
					}

					UserSessListEntry *ses = u->u_SessionsList;
					while( ses != NULL )
					{
						FBOOL sendMsg = FALSE;
						UserSession *uses = (UserSession *) ses->us;
			
						if( sessionid != NULL )
						{
							if( strcmp( sessionid, uses->us_SessionID ) == 0 )
							{
								sendMsg = TRUE;
							}
						}
						else
						{
							sendMsg = TRUE;
						}
				
						if( sendMsg == TRUE ) //&& uses != loggedSession )	// do not send message to same session
						{
							int lenmsg = 0;
						
							if( appname != NULL )
							{
								lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\": {\"message\":%s, \"appname\":\"%s\" }}}", msg, appname );
							}
							else
							{
								lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\": {\"message\":%s}}}", msg );
							}
			
							msgsndsize += WebSocketSendMessageInt( uses, tmpmsg, lenmsg );
			
							DEBUG("[UMWebRequest] messagee sent. Bytes: %d\n", msgsndsize );
						}
						ses = (UserSessListEntry *)ses->node.mln_Succ;
					}
					FFree( tmpmsg );
				}

				if( msgsndsize >= 0 )
				{
					HttpAddTextContent( response, "ok<!--separate-->{ \"sendmsg\": \"success\"}" );
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{ \"sendmsg\": \"fail, please check FC logs\"}" );
				}
				FFree( msg );
			}
			else
			{
				FERROR("msg parameter is missing\n");
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "msg" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		
			if( sessionid != NULL )
			{
				FFree( sessionid );
			}
			
			if( authid != NULL )
			{
				FFree( authid );
			}
			
			if( appname != NULL )
			{
				FFree( appname );
			}

			*result = 200;
		}
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/create</H2>Create user. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param username - (required) user name
	* @param password - (required) password
	* @param fullname  - full user name
	* @param email - user email
	* @param level - (required) groups to which user will be assigned, separated by comma
	* @param workgroups - groups to which user will be assigned. Groups are passed as string, ID's separated by comma
	* @return ok<!--separate-->{ "create": "sucess","id":"ID","uuid":"UUID" } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *level = NULL;
		char *workgroups = NULL;
		FBOOL userCreated = FALSE;
		
		DEBUG( "[UMWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		char *args = NULL;
		char *authid = NULL;
			
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;//UrlDecodeToMem( el->data );
		}
		
		if( loggedSession->us_User->u_IsAdmin || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
			}
			
			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				usrpass = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] Update usrpass %s!!\n", usrpass );
			}
			
			el = HttpGetPOSTParameter( request, "workgroups" );
			if( el != NULL )
			{
				workgroups = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG("Workgroups found!: %s\n", workgroups );
			}
			
			el = HttpGetPOSTParameter( request, "level" );
			if( el != NULL )
			{
				level = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			if( usrname != NULL && usrpass != NULL && level != NULL )
			{
				User *tusr = UMUserGetByNameDB( l->sl_UM, usrname );
				
				if( tusr != NULL )
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					el = HttpGetPOSTParameter( request, "fullname" );
					if( el != NULL )
					{
						fullname = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update fullname %s!!\n", fullname );
					}
					
					el = HttpGetPOSTParameter( request, "email" );
					if( el != NULL )
					{
						email = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update email %s!!\n", email );
					}
					
					User *locusr = UserNew();
					if( locusr != NULL )
					{
						locusr->u_Name = usrname;
						locusr->u_FullName = fullname;
						locusr->u_Email = email;
						locusr->u_Password = usrpass;
						userCreated = TRUE;
						
						int error = UMUserCreate( l->sl_UM, request, locusr );
						
						DEBUG("[UMWebRequest] Create user error: %d\n", error );
						
						if( error == 0 )
						{
							char buffer[ 1024 ];
							snprintf( buffer, sizeof(buffer), "ok<!--separate-->{\"create\":\"sucess\",\"id\":\"%lu\",\"uuid\":\"%s\"}", locusr->u_ID, locusr->u_UUID );
							HttpAddTextContent( response, buffer );
						}
						else
						{
							char buffer[ 256 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "UMUserCreate", error );
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_FUNCTION_RETURNED );
							HttpAddTextContent( response, buffer );
						}
						
						UGMAssignGroupToUserByStringDB( l->sl_UGM, locusr, level, workgroups );
						
						NotifyExtServices( l, request, locusr, "create" );
						
						UserDelete( locusr );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
				} // user found in db
			} // missing parameters
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password, level" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		
		if( level != NULL )
		{
			FFree( level );
		}
		
		if( workgroups != NULL )
		{
			FFree( workgroups );
		}
		/*
		if( userCreated == TRUE )
		{
			if( usrname != NULL )
			{
				FFree( usrname );
			}
			if( usrpass != NULL )
			{
				FFree( usrpass );
			}
			if( fullname != NULL )
			{
				FFree( fullname );
			}
			if( email != NULL )
			{
				FFree( email );
			}
		}
		*/
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/delete</H2>Delete user. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of user which you want to delete
	* @return { Result: success} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "delete" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *args = NULL;
		char *authid = NULL;
		FULONG id = 0;
		
		DEBUG( "[UMWebRequest] Delete user!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->hme_Data, &next, 0 );
		}
		
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;//UrlDecodeToMem( el->data );
		}
		
		if( loggedSession->us_User->u_IsAdmin || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			if( id > 0 )
			{
				SQLLibrary *sqllib  = l->LibrarySQLGet( l );
				if( sqllib != NULL )
				{
					char *tmpQuery = NULL;
					int querysize = 1024;
					
					if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
					{
						User * usr = UMGetUserByID( l->sl_UM, id );
						if( usr != NULL )
						{
							UserDeviceUnMount( l, sqllib, usr );
							UMRemoveUser( l->sl_UM, usr, ((SystemBase*)m)->sl_USM);
						}

						sprintf( tmpQuery, "DELETE FROM `FUser` WHERE ID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE FROM `FUserGroup` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE FROM `FUserSession` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						sprintf( tmpQuery, " DELETE FROM `Filesystem` WHERE UserID=%lu", id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						FFree( tmpQuery );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"success\"}" );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
					
					l->LibrarySQLDrop( l, sqllib );
				}
				else
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/updatestatus</H2>Update user status. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of user which should get new status
	* @param status - (required) status as integer parameter
	* @return { Result: success} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "updatestatus" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		FULONG id = 0;
		FLONG status = -1;
		HashmapElement *el = NULL;
		char *authid = NULL;
		char *args = NULL;
		
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
			//args = UrlDecodeToMem( el->data );
		}
		
		DEBUG( "[UMWebRequest] Update user status!!\n" );
		
		el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->hme_Data, &next, 0 );
		}
		
		el = HttpGetPOSTParameter( request, "status" );
		if( el != NULL )
		{
			char *next;
			status = (FLONG)strtol ( (char *)el->hme_Data, &next, 0 );
		}
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			if( id > 0 && status >= 0 )
			{
				SQLLibrary *sqllib  = l->LibrarySQLGet( l );
				if( sqllib != NULL )
				{
					char *tmpQuery = NULL;
					int querysize = 1024;
					
					if( ( tmpQuery = FCalloc( querysize, sizeof(char) ) ) != NULL )
					{
						FBOOL gotFromDB = FALSE;
						time_t  updateTime = time( NULL );
						
						// update status and modify timestamp
						sprintf( tmpQuery, "UPDATE `FUser` set Status=%lu,ModifyTime=%lu where ID=%lu", status, updateTime, id );
						
						sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
						User *usr = UMGetUserByID( l->sl_UM, id );
						if( usr != NULL )
						{
							usr->u_Status = status;
							usr->u_ModifyTime = updateTime;
						}
						else
						{
							usr = UMGetUserByIDDB( l->sl_UM, id );
							gotFromDB = TRUE;
						}
						
						if( status == USER_STATUS_ENABLED )
						{
							time_t tm = 0;
							time_t tm_now = time( NULL );
							FBOOL access = UMGetLoginPossibilityLastLogins( l->sl_UM, usr->u_Name, l->sl_ActiveAuthModule->am_BlockAccountAttempts, &tm );
							
							// if access is disabled and user should be enabled, we remove last login fail
							if( access == FALSE )
							{
								sqllib->SNPrintF( sqllib, tmpQuery, sizeof(tmpQuery), "DELETE from `FUserLogin` where UserID=%lu AND Failed is not null AND LoginTime>%lu", id, (tm_now-l->sl_ActiveAuthModule->am_BlockAccountTimeout) );
								sqllib->QueryWithoutResults( sqllib, tmpQuery );
							}
						}
						
						{
							BufString *bs = BufStringNew();

							char msg[ 512 ];
							int msize = 0;
							if( status == USER_STATUS_DISABLED )
							{
								msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
								// send calls to all users that they must log-off themselfs
								
								User *u = UMGetUserByID( l->sl_UM, id );
								if( u != NULL )
								{
									killUserSessionByUser( l, u, NULL );
								}
								msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
							}
							else
							{
								msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
							}
							BufStringAddSize( bs, msg, msize );
							UGMGetUserGroupsDB( l->sl_UGM, usr->u_ID, bs );
							BufStringAddSize( bs, "]}", 2 );
							
							DEBUG("Updatestatus - send information to 3rd party services\n");
							
							BufStringDelete( bs );
						}
						
						NotifyExtServices( l, request, usr, "update" );
						
						if( gotFromDB == TRUE )
						{
							UserDelete( usr );
						}
						
						FFree( tmpQuery );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"success\"}" );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
					
					l->LibrarySQLDrop( l, sqllib );
				}
				else
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id, status" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
		
		//if( args != NULL )
		//{
		//	FFree( args );
		//}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/updatepassword</H2>Update password
	*
	* @param sessionid - (required) session id of logged user
	* @param username - (required) name of the user which will go through change password process
	* @param password - (required) new password
	* @return { updatepassword: success!} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "updatepassword" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		
		DEBUG( "[UMWebRequest] Update password!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "password" );
		if( el != NULL )
		{
			usrpass = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( usrname != NULL && usrpass != NULL )
		{
			FBOOL access = FALSE;
			FBOOL gotFromDB = FALSE;
			int err = 0;
			
			// if you are admin you can change every user password
			if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
			{
				access = TRUE;
			}
			else
			{
				// if you are not admin, you can change only own password
				if( strcmp( loggedSession->us_User->u_Name, usrname ) == 0 )
				{
					access = TRUE;
				}
			}
			
			if( access == TRUE )
			{
				User *usr = UMGetUserByName( l->sl_UM, usrname );
				if( usr == NULL )
				{
					usr = UMGetUserByNameDB( l->sl_UM, usrname );
					gotFromDB = TRUE;
				}
			
				if( usr != NULL )
				{
					if( 0 == ( err = l->sl_ActiveAuthModule->UpdatePassword( l->sl_ActiveAuthModule, request, usr, usrpass ) ) )
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"updatepassword\": \"success!\"}" );
					
						SQLLibrary *sqllib  = l->LibrarySQLGet( l );
						if( sqllib != NULL )
						{
							char tmpQuery[ 256 ];
							time_t  updateTime = time( NULL );
					
							// update status and modify timestamp
							sprintf( tmpQuery, "UPDATE `FUser` set ModifyTime=%lu where ID=%lu", updateTime, usr->u_ID );
					
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
							l->LibrarySQLDrop( l, sqllib );
						}
					}
					else
					{
						char buffer[ 256 ];
						char buffer1[ 256 ];
						snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_CANNOT_CHANGE_PASS], err );
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_USER_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
				}
				else
				{
					FERROR("[ERROR] User not found\n" );
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			
				if( gotFromDB == TRUE )
				{
					UserDelete( usr );
				}
			}
			else
			{
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			FERROR("[ERROR] username or password parameters missing\n" );
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
		
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		if( usrpass != NULL )
		{
			FFree( usrpass );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/update</H2>Update user. Changes on other user accounts require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of user which you want to change
	* @param username - new user name
	* @param password - new password
	* @param fullname - new full user name
	* @param email - new user email
	* @param level - new groups to which user will be assigned. Groups must be separated by comma sign
	* @param workgroups - groups to which user will be assigned. Groups are passed as string, ID's separated by comma
	* @param status - user status
	* @return { update: success!} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *level = NULL;
		char *workgroups = NULL;
		FULONG id = 0;
		FLONG status = -1;
		FBOOL userFromSession = FALSE;
		FBOOL haveAccess = FALSE;
		int entries = 0;
		char *args = NULL;
		
		DEBUG( "[UMWebRequest] Update user!!\n" );

		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->hme_Data, &next, 0 );
			DEBUG( "[UMWebRequest] Update id %ld!!\n", id );
		}
		
		el = HttpGetPOSTParameter( request, "status" );
		if( el != NULL )
		{
			char *next;
			status = (FLONG)strtol ( (char *)el->hme_Data, &next, 0 );
		}
		
		User *logusr = NULL;
		if( id > 0 )
		{
			char *authid = NULL;
			
			el = HttpGetPOSTParameter( request, "authid" );
			if( el != NULL )
			{
				authid = el->hme_Data;
			}
			el = HttpGetPOSTParameter( request, "args" );
			if( el != NULL )
			{
				args = el->hme_Data;//UrlDecodeToMem( el->data );
			}
			
			if( loggedSession->us_User->u_IsAdmin || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
			{
				DEBUG("Is user admin: %d\n", loggedSession->us_User->u_IsAdmin );
				haveAccess = TRUE;
				
				logusr = UMGetUserByID( l->sl_UM, id );
				if( logusr != NULL )
				{
					userFromSession = TRUE;
					DEBUG("[UMWebRequest] Found session, update\n");
				}
				else
				{
					userFromSession = FALSE;
					logusr = UMGetUserByIDDB( l->sl_UM, id );
				}
			}
			else
			{
				logusr = NULL;
			}
		}
		else
		{
			haveAccess = TRUE;
			id = loggedSession->us_User->u_ID;
			userFromSession = TRUE;
			logusr = loggedSession->us_User;
		}
		
		if( haveAccess == TRUE )
		{
			// only when user asked for another user and have access
			if( id > 0 && logusr == NULL )
			{
				FERROR("[ERROR] User not found\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
				HttpAddTextContent( response, buffer );
			}
			else
			{
				el = HttpGetPOSTParameter( request, "username" );
				if( el != NULL )
				{
					usrname = UrlDecodeToMem( (char *)el->hme_Data );
					DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
				
					if( haveAccess == TRUE )
					{
						// check if user with same name already exist in database
						char query[ 1024 ];
						sprintf( query, " FUser WHERE `Name`='%s' AND ID != %lu" , usrname, id );
	
						SQLLibrary *sqlLib = l->LibrarySQLGet( l );
						if( sqlLib != NULL )
						{
							entries = sqlLib->NumberOfRecords( sqlLib, UserDesc,  query );

							l->LibrarySQLDrop( l, sqlLib );
						}

						if( entries == 0 && usrname != NULL && logusr->u_Name != NULL )
						{
							FFree( logusr->u_Name );
							logusr->u_Name = usrname;
						}
					}
				}
			
				if( entries != 0 )
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					el = HttpGetPOSTParameter( request, "password" );
					if( el != NULL )
					{
						usrpass = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update usrpass %s!!\n", usrpass );
						if( usrpass != NULL && logusr->u_Password != NULL )
						{
							FFree( logusr->u_Password );
							logusr->u_Password = usrpass;
						}
					}
			
					el = HttpGetPOSTParameter( request, "fullname" );
					if( el != NULL )
					{
						fullname = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update fullname %s!!\n", fullname );
						if( logusr->u_FullName != NULL )
						{
							FFree( logusr->u_FullName );
						}
						logusr->u_FullName = fullname;
					}
			
					el = HttpGetPOSTParameter( request, "email" );
					if( el != NULL )
					{
						email = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update email %s!!\n", email );
						if( logusr->u_Email != NULL )
						{
							FFree( logusr->u_Email );
						}
						logusr->u_Email = email;
					}
			
					el = HttpGetPOSTParameter( request, "level" );
					if( el != NULL )
					{
						level = UrlDecodeToMem( (char *)el->hme_Data );
					}
				
					el = HttpGetPOSTParameter( request, "workgroups" );
					if( el != NULL )
					{
						workgroups = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG("Workgroups found!: %s\n", workgroups );
					}
			
					DEBUG("[UMWebRequest] Changing user data %lu\n", id );
					// user is not logged in
					// try to get it from DB
				
					if( logusr != NULL ) //&& canChange == TRUE )
					{
						char *error = NULL;
						DEBUG("[UMWebRequest] FC will do a change\n");
					
						GenerateUUID( &( logusr->u_UUID ) );
					
						if( status >= 0 )
						{
							logusr->u_Status = status;
						
							{
								char msg[ 512 ];
								if( status == USER_STATUS_DISABLED )
								{
									snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\",\"true\"}", logusr->u_UUID );
								}
								else
								{
									snprintf( msg, sizeof(msg), "{\"userid\":\"%s\"}", logusr->u_UUID );
								}
								//NotificationManagerSendInformationToConnections( l->sl_NotificationManager, NULL, msg );
								NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "user", "update", msg );
							}
						}
						UMUserUpdateDB( l->sl_UM, logusr );
					
						UGMAssignGroupToUserByStringDB( l->sl_UGM, logusr, level, workgroups );
					
						RefreshUserDrives( l->sl_DeviceManager, logusr, NULL, &error );
					
						NotifyExtServices( l, request, logusr, "update" );
					
						// we must notify user
						//if( logusr != loggedSession->us_User )
						//{
						//	UserNotifyFSEvent2( l->sl_DeviceManager, logusr, "refresh", "Mountlist:" );
						//}
					
						if( error != NULL )
						{
							FFree( error );
						}
					
						HttpAddTextContent( response, "ok<!--separate-->{ \"update\": \"success!\"}" );
					}
					else
					{
						FERROR("[ERROR] User not found\n" );
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
				
					if( userFromSession == FALSE )
					{
						UserDelete( logusr );
					}
				}
			}
		}
		else	//is admin
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
		
		if( level != NULL )
		{
			FFree( level );
		}
		//if( args != NULL )
		//{
		//	FFree( args );
		//}
		if( workgroups != NULL )
		{
			FFree( workgroups );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/updategroups</H2>Update user groups. Changes on other user accounts require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of user which you want to change
	* @param workgroups - groups to which user will be assigned. Groups are passed as string, ID's separated by comma
	* @return { update: success!} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "updategroups" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *workgroups = NULL;
		FULONG id = 0;
		FBOOL userFromSession = FALSE;
		FBOOL canChange = FALSE;
		FBOOL haveAccess = FALSE;
		int entries = 0;
		
		DEBUG( "[UMWebRequest] Update user!!\n" );

		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->hme_Data, &next, 0 );
			DEBUG( "[UMWebRequest] Update id %ld!!\n", id );
		}
		
		if( id > 0 )
		{
			char *authid = NULL;
			char *args = NULL;
			el = HttpGetPOSTParameter( request, "authid" );
			if( el != NULL )
			{
				authid = el->hme_Data;
			}
			el = HttpGetPOSTParameter( request, "args" );
			if( el != NULL )
			{
				args = el->hme_Data;
				//args = UrlDecodeToMem( el->hme_Data );
			}
				
			if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
			{
				haveAccess = TRUE;
			
				while( logusr != NULL )
				{
					if( logusr->u_ID == id  )
					{
						userFromSession = TRUE;
						DEBUG("[UMWebRequest] Found session, update\n");
						break;
					}
					logusr = (User *)logusr->node.mln_Succ;
				}
			}
			else
			{
				logusr = NULL;
			}
		}
		else
		{
			id = loggedSession->us_User->u_ID;
			userFromSession = TRUE;
			logusr = loggedSession->us_User;
		}
		
		if( logusr == NULL && id > 0 )
		{
			DEBUG("[UMWebRequest] Getting user from db\n");
			logusr = UMUserGetByIDDB( l->sl_UM, id );
		}
		
		if( logusr == NULL )
		{
			FERROR("[ERROR] User not found\n" );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
			HttpAddTextContent( response, buffer );
		}
		else
		{
			if( entries != 0 )
			{
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
				HttpAddTextContent( response, buffer );
			}
			else
			{
				el = HttpGetPOSTParameter( request, "workgroups" );
				if( el != NULL )
				{
					workgroups = UrlDecodeToMem( (char *)el->hme_Data );
					DEBUG("Workgroups found!: %s\n", workgroups );
				}
			
				DEBUG("[UMWebRequest] Changing user data %lu\n", id );
				// user is not logged in
				// try to get it from DB
				
				if( haveAccess  == TRUE )
				{
					canChange = TRUE;
				}
				else
				{
					if( loggedSession->us_User == logusr )
					{
						canChange = TRUE;
					}
					else
					{
						canChange = FALSE;
					}
				}
				
				if( logusr != NULL && canChange == TRUE )
				{
					char *error = NULL;
					DEBUG("[UMWebRequest] FC user/updategroups will do a change\n");

					UGMAssignGroupToUserByStringDB( l->sl_UGM, logusr, NULL, workgroups );
					
					RefreshUserDrives( l->sl_DeviceManager, logusr, NULL, &error );
					
					NotifyExtServices( l, request, logusr, "update" );
					
					// we must notify user
					//if( logusr != loggedSession->us_User )
					//{
					//	UserNotifyFSEvent2( l->sl_DeviceManager, logusr, "refresh", "Mountlist:" );
					//}
					
					if( error != NULL )
					{
						FFree( error );
					}
					
					HttpAddTextContent( response, "ok<!--separate-->{ \"update\": \"success!\"}" );
				}
				else
				{
					FERROR("[ERROR] User not found\n" );
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
				
				if( userFromSession == FALSE )
				{
					UserDelete( logusr );
				}
			}
		}

		if( workgroups != NULL )
		{
			FFree( workgroups );
		}
		*result = 200;
	}
	
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/logout</H2>Logout user
	*
	* @param sessionid - (required) session id of logged user
	* @return { logout: success!} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "logout" ) == 0 )
	{
		char *sessid = NULL;
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) FERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[UMWebRequest] Logging out!!\n" );
		
		//
		// we must provide sessionid of user who wants to logout
		//
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessionid" );
		
		if( UMUserIsAdmin( l->sl_UM  , request, loggedSession->us_User ) == TRUE )
		{
			if( el == NULL )
			{
				sessid = loggedSession->us_SessionID;
			}
			else
			{
				sessid = (char *)el->hme_Data;
			}
		}
		else
		{
			sessid = loggedSession->us_SessionID;
		}
		
		DEBUG("[UMWebRequest] Session got: %p\n", sessid );
		
		if( sessid != NULL )
		{
			UserSession *sess = NULL;
			
			Log( FLOG_INFO, "[UMWebRequest] Logout user, sessionid: %s\n", sessid );

			if( sessid != NULL )
			{
				sess = USMGetSessionBySessionID( l->sl_USM, sessid );
				int error = 0; 
				
				if( sess != NULL )
				{
					Log( FLOG_INFO, "[UMWebRequest] Logout user, user: %s deviceID: %s\n", sess->us_User->u_Name, sess->us_DeviceIdentity );
					
					SQLLibrary *sqlLib =  l->LibrarySQLGet( l );
					if( sqlLib != NULL )
					{
						sqlLib->Delete( sqlLib, UserSessionDesc, sess );
						
						if( sess->us_MobileAppID > 0 )
						{
							char temp[ 1024 ];
							snprintf( temp, sizeof(temp), "DELETE from `FUserMobileApp` where `ID`=%lu", sess->us_MobileAppID );
	
							sqlLib->QueryWithoutResults( sqlLib, temp );
						}
						l->LibrarySQLDrop( l, sqlLib );
					}
					
					// Logout must be last action called on UserSession
					FRIEND_MUTEX_LOCK( &(sess->us_Mutex) );
					sess->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &(sess->us_Mutex) );
					
					if( l->sl_ActiveAuthModule != NULL )
					{
						l->sl_ActiveAuthModule->Logout( l->sl_ActiveAuthModule, request, sessid );
					}
					
					error = USMUserSessionRemove( l->sl_USM, sess );
					
					*sessionRemoved = TRUE;
				}
				//
				// we found user which must be removed
				//
				/*
				if( request->h_RequestSource == HTTP_SOURCE_WS )
				{
					HttpFree( response );
					response = NULL;
				}
				
				if( error == 0 && response != NULL )
				*/
				{
					// !!! logout cannot send message via Websockets!!!!
					// in this case return error < 0
					HttpAddTextContent( response, "ok<!--separate-->{ \"logout\": \"success\"}" );
					if( request->http_RequestSource == HTTP_SOURCE_WS )
					{
						*result = -666;
					}
					else
					{
						*result = 200;
					}
				}
			}
			if( l->sl_ActiveAuthModule != NULL )
			{
				//l->sl_ActiveAuthModule->Logout( l->sl_ActiveAuthModule, request, sessid );
			}
			else
			{
				FERROR("[ERROR] Authentication module not selected\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
				HttpAddTextContent( response, buffer );
			}
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/sessionlist</H2>Get sessions attached to user
	*
	* @param sessionid - (required) session id of logged user
	* @param username - name of user which sessions you want to get otherwise you will get sessions of current user
	* @return sessions attached to users in JSON format, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "sessionlist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		
		DEBUG( "[UMWebRequest] get sessionlist!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		User *logusr = NULL;
		logusr = loggedSession->us_User;
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) == TRUE )
		{
			// only when you are admin you can change stuff on other user accounts
			if( usrname != NULL )
			{
				logusr = UMGetUserByName( l->sl_UM, usrname );
			}
		}

		DEBUG(" username: %s\n", usrname );
		char *temp = FCalloc( 2048, 1 );
		int numberOfSessions = 0;
		
		if( temp != NULL )
		{
			if( logusr != NULL )
			{
				DEBUG("Loop: loguser->name: %s\n", logusr->u_Name );
				BufString *bs = BufStringNew();
				
				if( FRIEND_MUTEX_LOCK( &(logusr->u_Mutex) ) == 0 )
				{
					UserSessListEntry *sessions = logusr->u_SessionsList;
					BufStringAdd( bs, "ok<!--separate-->[" );
					int pos = 0;

					if( logusr->u_SessionsNr > 0 )
					{
						while( sessions != NULL )
						{
							UserSession *us = (UserSession *) sessions->us;
							if( us == NULL )
							{
								DEBUG("ERR\n");
								sessions = (UserSessListEntry *) sessions->node.mln_Succ;
								continue;
							}

							//if( (us->us_LoggedTime - t) > LOGOUT_TIME )
							//if( us->us_WSClients != NULL )
							time_t timestamp = time(NULL);
							
							if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
							{
								if( us->us_WSConnections != NULL && ( (timestamp - us->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) )
								{
									int size = 0;
									if( pos == 0 )
									{
										size = snprintf( temp, 2047, "{ \"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\",\"name\":\"%s\"}", us->us_ID, us->us_DeviceIdentity, us->us_SessionID, (long long unsigned int)us->us_LoggedTime, us->us_Name );
									}
									else
									{
										size = snprintf( temp, 2047, ",{ \"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\",\"name\":\"%s\"}", us->us_ID, us->us_DeviceIdentity, us->us_SessionID, (long long unsigned int)us->us_LoggedTime, us->us_Name );
									}
									BufStringAddSize( bs, temp, size );
							
									pos++;
								}
								FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
							}
							
							sessions = (UserSessListEntry *) sessions->node.mln_Succ;
							numberOfSessions++;
						}
					}
					FRIEND_MUTEX_UNLOCK( &(logusr->u_Mutex) );
				}
			
				BufStringAdd( bs, "]" );
				
				HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
				
				DEBUG("[UMWebRequest] Sessions %s\n", bs->bs_Buffer );
				bs->bs_Buffer = NULL;
				
				BufStringDelete( bs );
			}
			FFree( temp );
		}
			
		// only if user is not found, no need to count sessions
		if( logusr == NULL ) //&& numberOfSessions == 0 )
		{
			FERROR("[ERROR] User not found\n" );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
			HttpAddTextContent( response, buffer );
		}
		
		
		/*	if there is no parameter current user sessions should be returned
		else
		{
			FERROR("[ERROR] username parameter is missing\n" );
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_USER_DEV_REQUIRED], "username" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_USER_DEV_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		*/
		
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/killsession</H2>Kill user session (remote logout)
	*
	* @param sessionid - (required) session id of logged user
	* @param sesid - (required if deviceid and username are not available) session id of user which you want to kill
	* @param deviceid - (required if sesid is not available) device id of user which you want to kill
	* @param username - (required if sesid is not available) user name of user which you want to kill
	* @return { killsession: success} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "killsession" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		char *sessionid = NULL;
		char *deviceid = NULL;
		char *usrname = NULL;
		int error = 0;
		
		DEBUG( "[UMWebRequest] kill session" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessid" );
		if( el != NULL )
		{
			sessionid = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "deviceid" );
		if( el != NULL )
		{
			deviceid = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( sessionid != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by sessionid\n");
			UserSession *ses = USMGetSessionBySessionID( l->sl_USM, sessionid );
			if( ses != NULL )
			{
				killUserSession( l, ses );
			}
		}
		else if( deviceid != NULL && usrname != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by deviceid and username %s - %s\n", deviceid, usrname );
			User *u = UMGetUserByName( l->sl_UM, usrname );
			if( u != NULL )
			{
				killUserSessionByUser( l, u, deviceid );
			}
			else
			{
				error = 1;
			}
		}
		else
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_DEV_REQUIRED] , DICT_USER_DEV_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		
		//
		// we found user which must be removed
		//
		
		if( error == 0 )
		{
			HttpAddTextContent( response, "ok<!--separate-->{ \"killsession\": \"success\"}" );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{ \"killsession\": \"fail, please check FC logs\"}" );
		}
		
		if( sessionid != NULL )
		{
			FFree( sessionid );
		}
		if( deviceid != NULL )
		{
			FFree( deviceid );
		}
		if( usrname != NULL )
		{
			FFree( usrname );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/activelist</H2>Get active user list (avaiable in FC memory)
	*
	* @param sessionid - (required) session id of logged user
	* @param usersonly - if set to 'true' get unique user list
	* @return all users in JSON list when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "activelist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( UMUserIsAdmin( l->sl_UM  , request, loggedSession->us_User ) == TRUE )
		{
			FBOOL usersOnly = FALSE;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "usersonly" );
			if( el != NULL )
			{
				if( ( (char *)el->hme_Data ) != NULL && strcmp("true", (char *)el->hme_Data ) == 0 )
				{
					usersOnly = TRUE;
				}
			}
			
			DEBUG("[UMWebRequest] Get active sessions\n");
			
			BufString *bs = BufStringNew();
			
			BufStringAdd( bs, "{\"userlist\":[");
			
			// we are going through users and their sessions
			// if session is active then its returned
			
			time_t  timestamp = time( NULL );
			
			int pos = 0;
			User *usr = l->sl_UM->um_Users;
			while( usr != NULL )
			{
				//DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
				
				UserSessListEntry *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						DEBUG("[UMWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
						
						if( ( (timestamp - locses->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSConnections != NULL )
						{
							add = TRUE;
						}
						
						if( usersOnly == TRUE )
						{
							char newuser[ 255 ];
							snprintf( newuser, 254, "\"%s\"", usr->u_Name );
							
							if( strstr( bs->bs_Buffer, newuser ) != NULL )
							{
								add = FALSE;
							}
						}
						
						if( add == TRUE )
						{
							char tmp[ 512 ];
							int tmpsize = 0;

							if( pos == 0 )
							{
								tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\",\"name\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity, locses->us_Name );
							}
							else
							{
								tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\", \"deviceidentity\":\"%s\",\"name\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity , locses->us_Name );
							}
							
							BufStringAddSize( bs, tmp, tmpsize );
							
							pos++;
						}
					}
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
				usr = (User *)usr->node.mln_Succ;
			}
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/activelwsist</H2>Get active user list, all users have working websocket connections
	*
	* @param sessionid - (required) session id of logged user
	* @param usersonly - if set to 'true' get unique user list
	* @return all users in JSON list when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "activewslist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[UMWebRequest] GET activews list\n");
		
		if( UMUserIsAdmin( l->sl_UM  , request, loggedSession->us_User ) == TRUE )
		{
			FBOOL usersOnly = FALSE;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "usersonly" );
			if( el != NULL )
			{
				if( ( (char *)el->hme_Data ) != NULL && strcmp("true", (char *)el->hme_Data ) == 0 )
				{
					usersOnly = TRUE;
				}
			}
			
			DEBUG("[UMWebRequest] Get active sessions\n");
			
			BufString *bs = BufStringNew();
			
			BufStringAdd( bs, "{\"userlist\":[");
			
			// we are going through users and their sessions
			// if session is active then its returned
			
			time_t  timestamp = time( NULL );
			
			int pos = 0;
			User *usr = l->sl_UM->um_Users;
			while( usr != NULL )
			{
				DEBUG("[UMWebRequest] Going through users, user: %s\n", usr->u_Name );
				
				FRIEND_MUTEX_LOCK( &usr->u_Mutex );
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						//DEBUG("[UMWebRequest] Going through sessions, device: %s time %lu timeout time %lu WS ptr %p\n", locses->us_DeviceIdentity, (long unsigned int)(timestamp - locses->us_LoggedTime), l->sl_RemoveSessionsAfterTime, locses->us_WSClients );
						
						if( ( (timestamp - locses->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSConnections != NULL )
						{
							add = TRUE;
						}
						
						if( usersOnly == TRUE )
						{
							char newuser[ 255 ];
							sprintf( newuser, "\"%s\"", usr->u_Name );
							
							if( strstr( bs->bs_Buffer, newuser ) != NULL )
							{
								add = FALSE;
							}
						}
						
						if( add == TRUE )
						{
							char tmp[ 512 ];
							int tmpsize = 0;
							
							if( pos == 0 )
							{
								tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\",\"name\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity, locses->us_Name );
							}
							else
							{
								tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\", \"deviceidentity\":\"%s\",\"name\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity, locses->us_Name );
							}
							
							BufStringAddSize( bs, tmp, tmpsize );
							
							pos++;
						}
					}
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
				FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
				
				usr = (User *)usr->node.mln_Succ;
			}
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		else	//is admin
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/servermessage</H2>Send message to all User sessions
	*
	* @param message - (required) message which will be delivered
	* @return fail or ok response
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "servermessage" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = NULL;
		char *msg = NULL;

		el = HttpGetPOSTParameter( request, "message" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "message" );
		//el =  HashmapGet( (*request)->parsedPostContent, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		BufString *bs = BufStringNew();
		
		// we are going through users and their sessions
		// if session is active then its returned
		
		time_t  timestamp = time( NULL );
		
		int msgsndsize = 0; 
		int pos = 0;
		int msgsize = 1024;
		
		if( msg != NULL )
		{
			msgsize += strlen( msg )+1024;

			BufStringAdd( bs, "{\"userlist\":[");
			
			int msgsize = strlen( msg )+1024;
			char *sndbuffer = FCalloc( msgsize, sizeof(char) );
			
			User *usr = (User *)loggedSession->us_User;
			if( usr != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
				{
					UserSessListEntry *usle = (UserSessListEntry *)usr->u_SessionsList;
					int msgsndsize = 0;
					while( usle != NULL )
					{
						UserSession *ls = (UserSession *)usle->us;
						if( ls != NULL )
						{
							DEBUG("Found same session, sending msg\n");
							char tmp[ 512 ];
							int tmpsize = 0;
						
							tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, ls->us_DeviceIdentity );
						
							int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":{\"username\":\"%s\",\"message\":\"%s\"}}}", 
							loggedSession->us_User->u_Name , msg );
						
							msgsndsize = WebSocketSendMessageInt( ls, sndbuffer, lenmsg );
						}
						usle = (UserSessListEntry *)usle->node.mln_Succ;
					}
					FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
				}
				
				if( msgsndsize > 0 )
				{
					BufStringAdd( bs, usr->u_Name );
				}
			}
			BufStringAdd( bs, "]}");
		}
		else	//message is empty
		{
			
		}
		
		HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
		bs->bs_Buffer = NULL;
		
		BufStringDelete( bs );
		
		if( msg != NULL )
		{
			FFree( msg );
		}
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/updatekey</H2>Update key. Function reload key assigned to user from database
	* @todo this function should not be here probably
	*
	* @param sessionid - (required) session id of logged user
	* @param keyid - (required) key id which will be reloaded
	* @return { result: sucess } when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "updatekey" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		//UserSession *usrses = l->sl_USM->usm_Sessions;
		FULONG keyid = 0;
		
		DEBUG( "[UMWebRequest] update key" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "keyid" );
		if( el != NULL )
		{
			char *end;
			keyid = strtol( (char *)el->hme_Data, &end, 0 );
		}
		
		if( keyid > 0 )
		{
			int err = FKeyManagerUpdateKeyByID( l->sl_KeyM, keyid );
			
			if( err == 0 )
			{
				HttpAddTextContent( response, "ok<!--separate-->{ \"result\": \"sucess\" }" );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "updatekey", err );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "keyid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	return response;
}
