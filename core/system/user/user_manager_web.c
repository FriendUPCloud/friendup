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

/**
 * Kill user session
 *
 * @param ses session which will be deleted (marked 'to be deleted')
 * @param remove if set to TRUE then session will be marked as "to deleted". Otherwise only message will be send via websockets
 * @return error number
 */
int killUserSession( void *sb, UserSession *ses, FBOOL remove )
{
	int error = 0;
#define KILL_SESSION_MESSAGE_LEN 1024
	
	char *tmpmsg = FMalloc( KILL_SESSION_MESSAGE_LEN+1 );
	if( tmpmsg == NULL ){ return -1; }
	
	int lenmsg = snprintf( tmpmsg, KILL_SESSION_MESSAGE_LEN, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
	
	if( ses == NULL || ses->us_Status == USER_SESSION_STATUS_TO_REMOVE )
	{
		DEBUG("[UMWebRequest] killSession session is NULL or will be removed shortly\n");
		FFree( tmpmsg );
		return 1;
	}
	
	// set flag to WS connection "te be killed"
	if( FRIEND_MUTEX_LOCK( &(ses->us_Mutex) ) == 0 )
	{
		if( ses->us_WSD != NULL )
		{
			ses->us_WebSocketStatus = WEBSOCKET_SERVER_CLIENT_TO_BE_KILLED;
		}
		
		ses->us_InUseCounter++;
		
		FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
	}
	
	int msgsndsize = WebSocketSendMessageInt( ses, tmpmsg, lenmsg );
	
	char *uname = NULL;
	if( ses->us_User != NULL )
	{
		uname = ses->us_User->u_Name;
	}
	
	DEBUG("[UMWebRequest] killSession user %s session %s will be removed by user %s msglength %d\n", uname, ses->us_SessionID, uname, msgsndsize );
	
	// wait till queue will be empty
	while( TRUE )
	{
		if( FRIEND_MUTEX_LOCK( &(ses->us_Mutex) ) == 0 )
		{
			if( ses->us_WSD == NULL || ses->us_MsgQueue.fq_First == NULL )
			{
				FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
				break;
			}
			FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
		}
		usleep( 1000 );
	}
	
	if( remove == TRUE  )
	{
		ses->us_Status = USER_SESSION_STATUS_TO_REMOVE;
	}
	
	if( FRIEND_MUTEX_LOCK( &(ses->us_Mutex) ) == 0 )
	{
		ses->us_InUseCounter--;
		
		FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
	}
	
	FFree( tmpmsg );
	
	return error;
}

/**
 * Kill user session by user and device id
 *
 * @param u user which sessions will be deleted
 * @param deviceid id of device which will be deleted. If deviceid will be equal to NULL all sessions will be removed
 * @return error number
 */
inline static int killUserSessionByUser( User *u, char *deviceid )
{
	int error = 0;
	int nrSessions = 0;
	
	//UserSession **toBeRemoved = NULL;
	
	DEBUG("[killUserSessionByUser] start\n");
	
	USER_LOCK( u );
	
	UserSessListEntry *usl = u->u_SessionsList;
	if( deviceid != NULL )
	{
		DEBUG("[killUserSessionByUser] remove session with deviceid: %s\n", deviceid );
		while( usl != NULL )
		{
			UserSession *s = (UserSession *) usl->us;
			
			DEBUG("[killUserSessionByUser] remove session\n");
			
			if( s != NULL && s->us_DeviceIdentity != NULL && strcmp( s->us_DeviceIdentity, deviceid ) == 0 )
			{
				DEBUG("[killUserSessionByUser] fc will send message via WS\n");
				
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
				
				int msgsndsize = WebSocketSendMessageInt( s, tmpmsg, lenmsg );

				DEBUG("[killUserSessionByUser] Bytes send: %d\n", msgsndsize );
			
				//break;
			}
			usl = (UserSessListEntry *)usl->node.mln_Succ;
			nrSessions++;
		}
	}
	else
	{
		DEBUG("[killUserSessionByUser] remove sessions\n");
		while( usl != NULL )
		{
			UserSession *s = (UserSession *) usl->us;
			if( s != NULL )
			{
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
			
				int msgsndsize = WebSocketSendMessageInt( s, tmpmsg, lenmsg );

				DEBUG("[killUserSessionByUser] Bytes send: %d\n", msgsndsize );
			}
			usl = (UserSessListEntry *)usl->node.mln_Succ;
			nrSessions++;
		}
	}

	USER_UNLOCK( u );
	
	DEBUG("[killUserSessionByUser] end\n");
	
	return error;
}

//
// Send messages to 3rd party services
//

inline static void NotifyExtServices( SystemBase *l, Http *request, User *usr, char *action )
{
	BufString *bs = BufStringNew();

	char msg[ 512 ];
	int msize = 0;
	
	if( usr->u_Status == USER_STATUS_DISABLED )
	{
		msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"name\":\"%s\",\"groups\":[", usr->u_UUID, usr->u_ModifyTime, usr->u_Name );
		BufStringAddSize( bs, msg, msize );
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
	if( l->sl_NotificationManager )
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
 * @param sessionRemoved pointer to int where information about logout will be stored
 * @return response as Http structure, otherwise NULL
 */
Http *UMWebRequest( void *m, char **urlpath, Http *request, UserSession *loggedSession, int *result, int *sessionRemoved )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	DEBUG("[UMWebRequest] url: %s\n",urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
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
				{ TAG_DONE, TAG_DONE }
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
					if( usr != NULL )
					{
						USER_LOCK( usr );
						UserSessListEntry *ses = usr->u_SessionsList;
						while( ses != NULL )
						{
							UserSession *uses = (UserSession *) ses->us;
							if( strcmp( sessionid, uses->us_SessionID ) == 0 )
							{
								nameSet = TRUE;
								break;
							}
							ses = (UserSessListEntry *)ses->node.mln_Succ;
						}
						USER_UNLOCK( usr );
					}
				}
				else
				{
					nameSet = TRUE;
				}
				
				if( nameSet == TRUE )
				{
					HttpAddTextContent( response, "ok<!--separate-->{\"setname\":\"success\"}" );
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{\"setname\":\"fail, please check FC logs\"}" );
				}
				
				FFree( name );
			}
			else
			{
				FERROR("name parameter is missing\n");
				char buffer[ 512 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "name" );
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
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
		* <HR><H2>system.library/user/session/sendmsg</H2>Send message to another user session or uniqueid
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
			char *uniqueid = NULL;
			char *dstonly = NULL; // only send to destination user
		
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
			
			el = HttpGetPOSTParameter( request, "dstuniqueid" );
			if( el != NULL )
			{
				uniqueid = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "dstonly" );
			if( el != NULL )
			{
				dstonly = UrlDecodeToMem( (char *)el->hme_Data );
			}
			
			User *u = loggedSession->us_User;
			int destUserFound = 0;
		
			if( msg != NULL && loggedSession->us_User != NULL )
			{
				int msgsndsize = 0;
				//DEBUG("[UMWebRequest] Send message session by sessionid\n");
			
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
							
							sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT ua.UserID FROM `FApplication` a, `FUserApplication` ua WHERE ua.AuthID=\"%s\" AND ua.ApplicationID = a.ID LIMIT 1", authid );

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
							if( u ) destUserFound = 1;
						}
					}
					// Do it on destination user unique ID and appname
					else if( uniqueid != NULL && appname != NULL )
					{
					    FULONG userId = 0;
						
						SQLLibrary *sqllib  = l->LibrarySQLGet( l );
						if( sqllib != NULL )
						{
							char q[ 1024 ];
							
							// TODO: Add filter - we mustn't send to ALL users! Add check if we're in a group with the target user
							sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT ua.UserID FROM `FApplication` a, `FUserApplication` ua, `FUser` us WHERE a.Name=\"%s\" AND ua.ApplicationID = a.ID AND ua.UserID = us.ID AND us.UniqueID=\"%s\" LIMIT 1", appname, uniqueid );

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
							if( u ) destUserFound = 1;
						}
					}
					else
					{
					    //DEBUG( "[UMebRequest] Seems we have no user..\n" );
					}

					if( u && loggedSession->us_User != NULL )
					{
						USER_LOCK( u );
						
						UserSessListEntry *ses = u->u_SessionsList;
						while( ses != NULL && ses->us != NULL )
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
									lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\":{\"message\":%s,\"appname\":\"%s\"}}}", msg, appname );
								}
								else
								{
									lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\":{\"message\":%s}}}", msg );
								}
			
								msgsndsize += WebSocketSendMessageInt( uses, tmpmsg, lenmsg );
			
								//DEBUG("[UMWebRequest] messagee sent. Bytes: %d\n", msgsndsize );
							}
							ses = (UserSessListEntry *)ses->node.mln_Succ;
						}
						
						USER_UNLOCK( u );
					}	// if user != NULL
					
					// Try to alert other sessions of source user that we have an update!
					USER_LOCK( loggedSession->us_User );	
					
					//DEBUG( "Trying to send to self.\n" );
					
					if( dstonly == NULL )
					{
						int lenmsg = 0;	
						
						if( appname != NULL )
						{
							lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\":{\"message\":%s,\"appname\":\"%s\"}}}", msg, appname );
						}
						else
						{
							lenmsg = snprintf( tmpmsg, msgsize, "{\"type\":\"msg\",\"data\":{\"type\":\"server-msg\",\"session\":{\"message\":%s}}}", msg );
						}
						
						UserSessListEntry *ses = loggedSession->us_User->u_SessionsList;
						
						// Rewind session list
						while( 1 )
						{
							UserSessListEntry *s = ( UserSessListEntry *)ses->node.mln_Pred;
							if( s != NULL )
								ses = s;
							else break;
						}
						
						// Find all user sessions other than self
						while( ses != NULL && ses->us != NULL )
						{
							UserSession *uses = ( UserSession *)ses->us;
							if( uses != NULL && uses != loggedSession && uses->us_UserID == loggedSession->us_UserID )
							{
								//DEBUG( "Sending to other self: %p != %p, %s\n", loggedSession, uses, msg );
								int sendLen = WebSocketSendMessageInt( uses, tmpmsg, lenmsg );
								
								//DEBUG("[UMWebRequest] Other self sent size. Bytes: %d\n", sendLen );
							}
			
							ses = (UserSessListEntry *)ses->node.mln_Succ;
						}
					}
					
					USER_UNLOCK( loggedSession->us_User );
					
					FFree( tmpmsg );
				}
				

				if( msgsndsize >= 0 )
				{
					HttpAddTextContent( response, "ok<!--separate-->{\"sendmsg\":\"success\"}" );
				}
				else
				{
					HttpAddTextContent( response, "fail<!--separate-->{\"sendmsg\":\"fail, please check FC logs\"}" );
				}
				FFree( msg );
			}
			else
			{
				FERROR("msg parameter is missing\n");
				char buffer[ 512 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "msg" );
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		
			if( dstonly != NULL )
			{
				FFree( dstonly );
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
	* @param timezone - timezone
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
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *level = NULL;
		char *workgroups = NULL;
		char *timezone = NULL;
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
		
		if( IS_SESSION_ADMIN( loggedSession ) || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession, authid, args ) )
		{
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] Create usrname %s!!\n", usrname );
			}
			
			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				usrpass = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] Create usrpass %s!!\n", usrpass );
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
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
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
					
					el = HttpGetPOSTParameter( request, "timezone" );
					if( el != NULL )
					{
						timezone = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update timezone %s!!\n", timezone );
					}
					
					User *locusr = UserNew();
					if( locusr != NULL )
					{
						locusr->u_Name = usrname;	// we assign pointer to user structure
						usrname = NULL;				// so we must prevent from releasing it on the end of the function
													// memory was allocated by UrlDecodeToMem
						locusr->u_FullName = fullname;
						fullname = NULL;
						locusr->u_Email = email;
						email = NULL;
						locusr->u_Password = usrpass;
						locusr->u_Timezone = timezone;
						locusr->u_CreationTime = time( NULL );
						usrpass = NULL;
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
							char buffer[ 512 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "UMUserCreate", error );
							snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_FUNCTION_RETURNED );
							HttpAddTextContent( response, buffer );
						}
						
						UGMAssignGroupToUserByStringDB( l->sl_UGM, locusr, level, workgroups );
						
						NotifyExtServices( l, request, locusr, "create" );
						
						UserDelete( locusr );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
				} // user found in db
			} // missing parameters
			else
			{
				char buffer[ 512 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password, level" );
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
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
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
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
		
		if( IS_SESSION_ADMIN( loggedSession ) || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession, authid, args ) )
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
						User *usr;
						User *usrToDelete;
						
						// we must mark user in database "to be deleted". This way we will be able to clean all his stuff after some period of time
						
						usrToDelete = UMGetUserByIDDB( l->sl_UM, id );
						if( usrToDelete != NULL )
						{
							UserToDelete *utd = UserToDeleteNew( );
							if( utd != NULL )
							{
								utd->utd_UserName = StringDuplicate( usrToDelete->u_Name );
								utd->utd_UserID = id;
								
								// now lets store new entry
								
								SQLLibrary *lsqllib = l->LibrarySQLGet( l );
								if( lsqllib != NULL )
								{
									lsqllib->Save( lsqllib, FUserToDeleteDesc, utd );
									l->LibrarySQLDrop( l, lsqllib );
								}
								
								UMPurgeUserData( l->sl_UM, id, usrToDelete->u_Name );
								
								UserToDeleteDelete( utd );
							}
							
							UserDelete( usrToDelete );
						}
						
						usr = UMGetUserByID( l->sl_UM, id );
						
						if( usr != NULL && usr->u_Status != USER_STATUS_TO_BE_REMOVED )
						{
							DEBUG( "[UMWebRequest] UMRemoveAndDeleteUser %d! before unmount\n", usr->u_InUse );
							
							l->UserDeviceUnMount( l, usr, loggedSession );
							
							DEBUG( "[UMWebRequest] UMRemoveAndDeleteUser in use %d userid %ld!\n", usr->u_InUse, usr->u_ID );
							UMRemoveAndDeleteUser( l->sl_UM, usr, ((SystemBase*)m)->sl_USM, loggedSession );
						}
						
						if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
						{
							sprintf( tmpQuery, "DELETE FROM `FUser` WHERE ID=%lu", id );
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
							sprintf( tmpQuery, " DELETE FROM `FUserGroup` WHERE UserID=%lu", id );
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
							sprintf( tmpQuery, " DELETE FROM `FUserSession` WHERE UserID=%lu", id );
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
							sprintf( tmpQuery, " DELETE FROM `Filesystem` WHERE UserID=%lu", id );
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						
							sprintf( tmpQuery, "DELETE FROM `FUserToGroup` WHERE UserID=%lu", id );
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						}
						
						FFree( tmpQuery );
						
						HttpAddTextContent( response, "ok<!--separate-->{\"Result\":\"success\"}" );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
					
					l->LibrarySQLDrop( l, sqllib );
				}
				else
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				char buffer[ 512 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id" );
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
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
			{ TAG_DONE, TAG_DONE }
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
		
		if( IS_SESSION_ADMIN( loggedSession ) || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession, authid, args ) )
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
						
						if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
						{
							// update status and modify timestamp
							sprintf( tmpQuery, "UPDATE `FUser` set Status=%lu,ModifyTime=%lu where ID=%lu", status, updateTime, id );
						
							DEBUG( "[UMWebRequest] status updated\n");
						
							sqllib->QueryWithoutResults( sqllib, tmpQuery );
						}
						
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
							if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
							{
								time_t tm = 0;
								time_t tm_now = time( NULL );
							
								if( usr != NULL )
								{
									FBOOL access = UMGetLoginPossibilityLastLogins( l->sl_UM, usr->u_Name, usr->u_Password, l->sl_ActiveAuthModule->am_BlockAccountAttempts, &tm );
							
									// if access is disabled and user should be enabled, we remove last login fail
									if( access == FALSE )
									{
										sqllib->SNPrintF( sqllib, tmpQuery, sizeof(tmpQuery), "DELETE from `FUserLogin` where UserID=%lu AND Failed is not null AND LoginTime>%lu", id, (tm_now-l->sl_ActiveAuthModule->am_BlockAccountTimeout) );
										sqllib->QueryWithoutResults( sqllib, tmpQuery );
									}
								}
							}
						}
						
						{
							BufString *bs = BufStringNew();

							char msg[ 512 ];
							int msize = 0;
							
							if( usr != NULL )
							{
								if( status == USER_STATUS_DISABLED )
								{
									msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
									// send calls to all users that they must log-off themselfs
								
									User *u = UMGetUserByID( l->sl_UM, id );
									if( u != NULL )
									{
										DEBUG("[UMWebRequest] user sessions will be removed\n");
										killUserSessionByUser( u, NULL );
									}
									msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
								}
								else
								{
									msize = snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"lastupdate\":%lu,\"groups\":[", usr->u_UUID, usr->u_ModifyTime );
								}
								BufStringAddSize( bs, msg, msize );
								UGMGetUserGroupsDB( l->sl_UGM, usr->u_ID, bs );
							}
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
						
						HttpAddTextContent( response, "ok<!--separate-->{\"Result\":\"success\"}" );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
					
					l->LibrarySQLDrop( l, sqllib );
				}
				else
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
			}
			else
			{
				char buffer[ 512 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id, status" );
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
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
			{ TAG_DONE, TAG_DONE }
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
			if( IS_SESSION_ADMIN( loggedSession ) )
			{
				access = TRUE;
			}
			else
			{
				// if you are not admin, you can change only own password
				if( loggedSession->us_User != NULL && strcmp( loggedSession->us_User->u_Name, usrname ) == 0 )
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
						HttpAddTextContent( response, "ok<!--separate-->{\"updatepassword\":\"success!\"}" );
					
						if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
						{
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
					}
					else
					{
						char buffer[ 512 ];
						char buffer1[ 256 ];
						snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_CANNOT_CHANGE_PASS], err );
						snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_USER_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
				}
				else
				{
					FERROR("[ERROR] User not found\n" );
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
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
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			FERROR("[ERROR] username or password parameters missing\n" );
			char buffer[ 512 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password" );
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
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
	* @param timezone - timezone
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
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *level = NULL;
		char *workgroups = NULL;
		char *timezone = NULL;
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
			
			if( IS_SESSION_ADMIN( loggedSession )|| PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession, authid, args ) )
			{
				DEBUG("Is user admin: %d\n", IS_SESSION_ADMIN( loggedSession ) );
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
			if( loggedSession->us_User != NULL )
			{
				id = loggedSession->us_User->u_ID;
				userFromSession = TRUE;
				logusr = loggedSession->us_User;
			}
		}
		
		if( logusr != NULL )
		{
			USER_LOCK( logusr );
		}
		
		if( haveAccess == TRUE )
		{
			// only when user asked for another user and have access
			if( id > 0 && logusr == NULL )
			{
				FERROR("[ERROR] User not found\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
				HttpAddTextContent( response, buffer );
			}
			else if( logusr != NULL )
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
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
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
					
					el = HttpGetPOSTParameter( request, "timezone" );
					if( el != NULL )
					{
						timezone = UrlDecodeToMem( (char *)el->hme_Data );
						DEBUG( "[UMWebRequest] Update timezone %s!!\n", timezone );
						if( logusr->u_Timezone != NULL )
						{
							FFree( logusr->u_Timezone );
						}
						logusr->u_Timezone = timezone;
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
					
						//GenerateUUID( &( logusr->u_UUID ) );
						
						if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
						{
							if( status >= 0 )
							{
								char msg[ 512 ];
								logusr->u_Status = status;
								
								if( status == USER_STATUS_DISABLED )
								{
									snprintf( msg, sizeof(msg), "{\"userid\":\"%s\",\"isdisabled\",\"true\"}", logusr->u_UUID );
								}
								else
								{
									snprintf( msg, sizeof(msg), "{\"userid\":\"%s\"}", logusr->u_UUID );
								}
								if( l->sl_NotificationManager )
									NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "user", "update", msg );
							}
							UMUserUpdateDB( l->sl_UM, logusr );
						}
						else
						{
							logusr->u_Status = status;
						}
						
						UGMAssignGroupToUserByStringDB( l->sl_UGM, logusr, level, workgroups );
					
						RefreshUserDrives( l->sl_DeviceManager, loggedSession, NULL, &error );
						
						DEBUG("[update/user] before notification\n");
					
						if( error != NULL )
						{
							FFree( error );
						}
						
						DEBUG("[update/user] after notification\n");
					
						HttpAddTextContent( response, "ok<!--separate-->{\"update\":\"success!\"}" );
						
						if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
						{
							NotifyExtServices( l, request, logusr, "update" );
							
							BufString *res = SendMessageToSessionsAndWait( l, logusr->u_ID, request );
							if( res != NULL )
							{
								DEBUG("RESPONSE: %s\n", res->bs_Buffer );
								BufStringDelete( res );
							}
						}
						else
						{
							UMSendUserChangesNotification( l->sl_UM, loggedSession );
						}
						// maybe we should send message via WS to notifi desktop about changes
					}
					else
					{
						FERROR("[ERROR] User not found\n" );
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
				}
			}
		}
		else	//is admin
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
		
		if( logusr != NULL )
		{
			USER_UNLOCK( logusr );
		}
		
		if( userFromSession == FALSE )
		{
			UserDelete( logusr );
		}
		
		if( level != NULL )
		{
			FFree( level );
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
			{ TAG_DONE, TAG_DONE }
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
			}
			
			if( IS_SESSION_ADMIN( loggedSession ) || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession, authid, args ) )
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
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
			HttpAddTextContent( response, buffer );
		}
		else
		{
			if( entries != 0 )
			{
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_ALREADY_EXIST] , DICT_USER_ALREADY_EXIST );
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
					
					//RefreshUserDrives( l->sl_DeviceManager, loggedSession, NULL, &error );
					
					if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
					{
						NotifyExtServices( l, request, logusr, "update" );
					}
					
					if( error != NULL )
					{
						FFree( error );
					}
					
					HttpAddTextContent( response, "ok<!--separate-->{\"update\":\"success!\"}" );
				}
				else
				{
					FERROR("[ERROR] User not found\n" );
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, buffer );
				}
				
				if( userFromSession == FALSE )
				{
					UserDelete( logusr );
				}
				
				if( request->http_RequestSource != HTTP_SOURCE_NODE_SERVER )
				{
					NotifyExtServices( l, request, logusr, "update" );
					
					BufString *res = SendMessageToSessionsAndWait( l, logusr->u_ID, request );
					if( res != NULL )
					{
						DEBUG("RESPONSE: %s\n", res->bs_Buffer );
						BufStringDelete( res );
					}
				}
				else
				{
					UMSendUserChangesNotification( l->sl_UM, loggedSession );
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
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		//if( response != NULL ) FERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[UMWebRequest] Logging out!!\n" );
		
		//
		// we must provide sessionid of user who wants to logout
		//
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessionid" );
		
		if( IS_SESSION_ADMIN( loggedSession ) )
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

					error = USMUserSessionRemove( l->sl_USM, sess );
					
					sess->us_Status = USER_SESSION_STATUS_TO_REMOVE;
					
					*sessionRemoved = LL_LOGOUT;
				}
				//
				// we found user which must be removed
				//
				// !!! logout cannot send message via Websockets!!!!
				// in this case return error < 0
				HttpAddTextContent( response, "ok<!--separate-->{\"logout\":\"success\"}" );
				if( request->http_RequestSource == HTTP_SOURCE_WS )
				{
					*result = -666;
				}
				else
				{
					*result = 200;
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
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_AUTHMOD_NOT_SELECTED] , DICT_AUTHMOD_NOT_SELECTED );
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
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
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
		
		if( IS_SESSION_ADMIN( loggedSession ) )
		{
			// only when you are admin you can change stuff on other user accounts
			if( usrname != NULL )
			{
				if( strcmp( usrname, logusr->u_Name ) != 0 )
				{
					logusr = UMGetUserByName( l->sl_UM, usrname );
				}
			}
		}

		DEBUG(" username: %s\n", usrname );
		
		if( logusr != NULL )
		{
			DEBUG("Loop: loguser->name: %s\n", logusr->u_Name );
			BufString *bs = BufStringNew();
			BufStringAdd( bs, "ok<!--separate-->[" );
			
			UserListSessions( logusr, bs, l );
		
			BufStringAdd( bs, "]" );
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			
			DEBUG("[UMWebRequest] Sessions %s\n", bs->bs_Buffer );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		
		
		// only if user is not found, no need to count sessions
		if( logusr == NULL )
		{
			FERROR("[ERROR] User not found\n" );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
			HttpAddTextContent( response, buffer );
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
			{ TAG_DONE, TAG_DONE }
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
			DEBUG("[UMWebRequest] Session found under pointer: %p\n", ses );
			if( ses != NULL )
			{
				killUserSession( l, ses, TRUE );
			}
		}
		else if( deviceid != NULL && usrname != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by deviceid and username %s - %s\n", deviceid, usrname );
			User *u = UMGetUserByName( l->sl_UM, usrname );
			if( u != NULL )
			{
				killUserSessionByUser( u, deviceid );
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
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_USER_DEV_REQUIRED] , DICT_USER_DEV_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		
		//
		// we found user which must be removed
		//
		
		if( error == 0 )
		{
			HttpAddTextContent( response, "ok<!--separate-->{\"killsession\":\"success\"}" );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"killsession\":\"fail, please check FC logs\"}" );
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
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( IS_SESSION_ADMIN( loggedSession ) )
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
			
			UMGetAllActiveUsers( l->sl_UM, bs, usersOnly );
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/activewslist</H2>Get active user list, all users have working websocket connections
	*
	* @param sessionid - (required) session id of logged user
	* @param usersonly - if set to 'true' get unique user list
	* @param userid - id of user which we want to check
	* @return all users in JSON list when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "activewslist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG("[UMWebRequest] GET activews list\n");
		
		if( IS_SESSION_ADMIN( loggedSession ) )
		{
			FULONG userID = 0;
			FBOOL usersOnly = FALSE;
			
			HashmapElement *el = HttpGetPOSTParameter( request, "usersonly" );
			if( el != NULL )
			{
				if( ( (char *)el->hme_Data ) != NULL && strcmp("true", (char *)el->hme_Data ) == 0 )
				{
					usersOnly = TRUE;
				}
			}
			
			el = HttpGetPOSTParameter( request, "userid" );
			if( el != NULL )
			{
				char *end;
				userID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			
			DEBUG("[UMWebRequest] Get active sessions\n");
			
			BufString *bs = BufStringNew();
			
			BufStringAdd( bs, "{\"userlist\":[");
			
			UMGetActiveUsersWSList( l->sl_UM, bs, userID, usersOnly );
			
			BufStringAdd( bs, "]}");
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		else	//is admin
		{
			if( loggedSession->us_User != NULL )
			{
				Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			}
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/servermessage</H2>Send message to one or all User sessions
	*
	* @param message - (required) message which will be delivered
	* @param userid - id of user to which message will be sent
	* @return fail or ok response
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "servermessage" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = NULL;
		char *msg = NULL;
		FULONG userID = 0;

		el = HttpGetPOSTParameter( request, "message" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtol( (char *)el->hme_Data, &end, 0 );
		}
		
		BufString *bs = BufStringNew();
		
		// we are going through users and their sessions
		// if session is active then its returned
		
		//time_t timestamp = time( NULL );

		if( msg != NULL )
		{
			BufStringAdd( bs, "{\"userlist\":[");
			
			UMSendMessageToUserOrSession( l->sl_UM, bs, loggedSession, userID, msg );
			
			BufStringAdd( bs, "]}");
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
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
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
				HttpAddTextContent( response, "ok<!--separate-->{\"result\":\"sucess\"}" );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "updatekey", err );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), ERROR_STRING_TEMPLATE, dictmsgbuf1 , DICT_FUNCTION_RETURNED );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "keyid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), ERROR_STRING_TEMPLATE, dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/user/addrelationship</H2>Update relation between user and other users
	*
	* @param sessionid - (required) session id of logged user
	* @param sourceid - (required) uuid of person to which new relation will be added
	* @param contactids - (required) uuids of person which will be attached as user contacts. Id's should come as json array to friendcore. Example: ["aaa","bbb","ccc"]
	* @param mode - (required) currently FriendCore support only "presence" mode which will send information to presence server
	* @return { result: sucess } when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "addrelationship" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *sourceID = NULL;
		char *contactIDs = NULL;
		char *mode = NULL;
		
		DEBUG( "[UMWebRequest] update key" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sourceid" );
		if( el != NULL )
		{
			sourceID = UrlDecodeToMem( el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "contactids" );
		if( el != NULL )
		{
			contactIDs = UrlDecodeToMem( el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "mode" );
		if( el != NULL )
		{
			mode = (char *) el->hme_Data;
		}
		
		if( sourceID != NULL && contactIDs != NULL && mode != NULL )
		{
			if( (loggedSession->us_User != NULL) && (( loggedSession->us_User->u_UUID != NULL && strcmp( sourceID, loggedSession->us_User->u_UUID ) == 0 ) || IS_SESSION_ADMIN( loggedSession ) ) )
			{
				if( strcmp( mode, "presence" ) == 0 )
				{
					int len = 256 + strlen( sourceID ) + strlen( contactIDs );
					HttpAddTextContent( response, "ok<!--separate-->{\"result\":\"sucess\"}" );
				
					char *msg = FMalloc( len );
					if( msg != NULL )
					{
						snprintf( msg, len, "{\"sourceId\":\"%s\",\"contactIds\":%s}", sourceID, contactIDs );

						if( l->sl_NotificationManager )
							NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "user", "relation-add", msg );
						
						FFree( msg );
					}
				}
				else
				{
					HttpAddTextContent( response, "mode not supported" );
				}
			}
			else
			{
				if( loggedSession->us_User == NULL )
				{
					Log( FLOG_ERROR,"UserSession '%s' dont have admin rights\n", loggedSession->us_SessionID );
				}
				else
				{
					Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
				}
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			FERROR("[ERROR] username or password parameters missing\n" );
			char buffer[ 512 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sourceid, contactids, mode" );
			snprintf( buffer, sizeof(buffer), ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
		
		if( sourceID != NULL )
		{
			FFree( sourceID );
		}
		if( contactIDs != NULL )
		{
			FFree( contactIDs );
		}
	}
	else
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		return response;
	}

	return response;
}
