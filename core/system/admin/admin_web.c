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
 *  Admin Web body
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 30/05/2017
 */

#include <core/types.h>
#include <core/nodes.h>
#include "admin_web.h"

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
#include <network/mime.h>
#include <hardware/usb/usb_device_web.h>
#include <system/fsys/door_notification.h>
#include <mobile_app/mobile_app.h>

/**
 * Network handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session
 * @param result pointer to integer where error number will be returned
 * @return http response
 */
Http *AdminWebRequest( void *m, char **urlpath, Http **request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	char *path = NULL;
	DEBUG("[AdminWebRequest] start\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( "text/html", 9 ) },
		{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
		{TAG_DONE, TAG_DONE}
	};
	
	if( response != NULL )
	{
		FERROR("RESPONSE admin\n");
		HttpFree( response );
	}
	response = HttpNewSimple( HTTP_200_OK, tags );
	
	if( urlpath[ 1 ] == NULL )
	{
		FERROR( "URL path is NULL!\n" );
		
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
		HttpAddTextContent( response, dictmsgbuf );
		
		goto error;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/info</H2>Function return information about FriendCore
	*
	* @param sessionid - (required) session id of logged user
	* @return function return information about FriendCore
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "info" ) == 0 )
	{
		BufString *bs = NULL;
		
		bs = FriendCoreInfoGet( l->fcm->fcm_FCI );
		
		HttpAddTextContent( response, bs->bs_Buffer );
		*result = 200;
		
		BufStringDelete( bs );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/listcores</H2>Function return information about FriendCore and connected FCores
	*
	* @param sessionid - (required) session id of logged user
	* @param module - (required) module which will be used (all other params will be taken from request)
	* @return function return information about FriendCore and connected FCores
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "listcores" ) == 0 )
	{
		char *FCID = NULL;
		DataForm *df = NULL; 		// if NULL then no details needed
		char *temp = FMalloc( 2048 );
		int pos = 0;
		
		HashmapElement *el = GetHEReq( *request, "details" );
		if( el != NULL && el->hme_Data )
		{
			if( strcmp( (char *)el->hme_Data, "true" ) == 0 )
			{
				MsgItem tags[] = {
					{ ID_FCRE, (FULONG)0, (FULONG)MSG_GROUP_START },
					{ ID_FCID, (FULONG)FRIEND_CORE_MANAGER_ID_SIZE,  (FULONG)l->fcm->fcm_ID },
					{ ID_FRID, (FULONG)0 , MSG_INTEGER_VALUE },
					{ ID_CMMD, (FULONG)0, MSG_INTEGER_VALUE },
					{ ID_QUER, (FULONG)FC_QUERY_FRIENDCORE_INFO , MSG_INTEGER_VALUE },
					{ MSG_GROUP_END, 0,  0 },
					{ TAG_DONE, TAG_DONE, TAG_DONE }
				};
			
				df = DataFormNew( tags );
			}
		}
		
		el = GetHEReq( *request, "id" );
		if( el != NULL && el->hme_Data )
		{
			FCID = UrlDecodeToMem( (char *)el->hme_Data );
		}
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE && temp != NULL )
		{
			BufString *bs = BufStringNew();

			BufStringAddSize( bs, "ok<!--separate-->[", 18 );
			
			int size = 0;
			char locid[ 129 ];
			// current core
			
			strcpy( locid, l->fcm->fcm_ID );
			
			if( df != NULL )
			{
				FBOOL addText = FALSE;
				if( FCID != NULL )
				{
					if( strncmp( FCID, l->fcm->fcm_ID, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 )
					{
						addText = TRUE;
					}
				}
				else
				{
					addText = TRUE;
				}
				
				if( addText == TRUE )
				{
					BufString *locbs = FriendCoreInfoGet( l->fcm->fcm_FCI );
					if( locbs != NULL )
					{
						size = snprintf( temp, 2048, "{\"name\":\"localhost\",\"id\":\"%s\",\"host\":\"localhost\",\"type\":\"fcnode\",\"details\":%s}", locid, locbs->bs_Buffer );
						
						BufStringDelete( locbs );
						pos = 1;
					}
				}
			}
			else
			{
				size = snprintf( temp, 2048, "{\"name\":\"localhost\",\"id\":\"%s\",\"host\":\"localhost\",\"type\":\"fcnode\"}", locid );
				pos = 1;
			}
			BufStringAddSize( bs, temp, size );
			
			// add other FC connections
			
			FConnection *actCon = l->fcm->fcm_CommService->s_Connections;
			while( actCon != NULL )
			{
				FBOOL addText = FALSE;
				if( FCID != NULL )
				{
					if( strncmp( FCID, actCon->fc_Name, FRIEND_CORE_MANAGER_ID_SIZE ) == 0 )
					{
						addText = TRUE;
					}
				}
				else
				{
					addText = TRUE;
				}

				if( addText == TRUE )
				{
					if( df != NULL )	// user asked for details
					{
						BufString *receivedbs = SendMessageAndWait( actCon, df );
						if( receivedbs != NULL )
						{
							char *serverdata = receivedbs->bs_Buffer + (COMM_MSG_HEADER_SIZE*4) + FRIEND_CORE_MANAGER_ID_SIZE;
							DataForm *locdf = (DataForm *)serverdata;
							
							DEBUG("Checking RESPONSE\n");
							if( locdf->df_ID == ID_RESP )
							{
								serverdata += COMM_MSG_HEADER_SIZE;
								DEBUG("Response: %s\n", serverdata );
							
								if( pos == 0 )
								{
									size = snprintf( temp, 2048, "{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\",\"ping\":%lu,\"status\":%d,\"details\":%s}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address, actCon->fc_PINGTime, actCon->fc_Status, serverdata );
								}
								else
								{
									size = snprintf( temp, 2048, ",{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\",\"ping\":%lu,\"status\":%d,\"details\":%s}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address, actCon->fc_PINGTime, actCon->fc_Status, serverdata );
								}
								
								DEBUG("TEMPADD: %s\n", temp );
								
								pos++;
							}
						
							BufStringDelete( receivedbs );
						}
					}
					else		// no details required
					{
						if( pos == 0 )
						{
							size = snprintf( temp, 2048, "{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\",\"ping\":%lu,\"status\":%d}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address, actCon->fc_PINGTime, actCon->fc_Status );
						}
						else
						{
							size = snprintf( temp, 2048, ",{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\",\"ping\":%lu,\"status\":%d}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address, actCon->fc_PINGTime, actCon->fc_Status );
						}
						pos++;
					}
				
					BufStringAddSize( bs, temp, size );
				}	// addText = TRUE
				
				actCon = (FConnection *)actCon->node.mln_Succ;
				//pos++;
			}
			
			BufStringAddSize( bs, "]", 1 );
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
			
			DataFormDelete( df );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"result\":\"User dont have access to functionality\"}" );
		}
		
		if( FCID != NULL )
		{
			FFree( FCID );
		}
		
		if( temp != NULL )
		{
			FFree( temp );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/connectionsinfo</H2>Get information about FC connections
	*
	* @param sessionid - (required) session id of logged user
	* @return function return information about FriendCore connections
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "connectionsinfo" ) == 0 )
	{
		BufString *bs = BufStringNew();
		FBOOL uiadmin = FALSE;
		char temp[ 1024 ];
		int pos = 0;
		
		BufStringAddSize( bs, "ok<!--separate-->[", 18 );
		
		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			uiadmin = TRUE;
		}
		
		// add remote connections
		
		RemoteUser *ru = l->sl_UM->um_RemoteUsers;
		
		if( uiadmin == TRUE )
		{
			while( ru != NULL )
			{
				int size;
				
				if( pos == 0 )
				{
					size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"userremote\"}", ru->ru_Name, ru->ru_SessionID, ru->ru_Host );
				}
				else
				{
					size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"userremote\"}", ru->ru_Name, ru->ru_SessionID, ru->ru_Host );
				}
				
				BufStringAddSize( bs, temp, size );
			
				ru = (RemoteUser *)ru->node.mln_Succ;
				pos++;
			}
			
			// add other FC connections
			
			FConnection *actCon = l->fcm->fcm_CommService->s_Connections;
			while( actCon != NULL )
			{
				int size;
				
				if( pos == 0 )
				{
					size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\"}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address );
				}
				else
				{
					size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"fcnode\"}", actCon->fc_Name, actCon->fc_FCID, actCon->fc_Address );
				}
				
				BufStringAddSize( bs, temp, size );
				
				actCon = (FConnection *)actCon->node.mln_Succ;
				pos++;
			}
		}
		else		// user is not admin, we are getting information only for current user
		{
			// add remote connections
			
			while( ru != NULL )
			{
				if( strcmp( ru->ru_Name, loggedSession->us_User->u_Name ) == 0 )
				{
					int size;
					
					if( pos == 0 )
					{
						size = snprintf( temp, sizeof(temp), "{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"userremote\"}", ru->ru_Name, ru->ru_SessionID, ru->ru_Host );
					}
					else
					{
						size = snprintf( temp, sizeof(temp), ",{\"name\":\"%s\",\"id\":\"%s\",\"host\":\"%s\",\"type\":\"userremote\"}", ru->ru_Name, ru->ru_SessionID, ru->ru_Host );
					}
				}
				ru = (RemoteUser *)ru->node.mln_Succ;
				pos++;
			}
		}
		
		BufStringAddSize( bs, "]", 1 );
		
		HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
		bs->bs_Buffer = NULL;
		*result = 200;
		
		BufStringDelete( bs );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/remotecommand</H2>Send command to remote server
	*
	* @param sessionid - (required) session id of logged user
	* @return remote functions response
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "remotecommand" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *host = NULL;
		char *remsession = NULL;
		
		el =  HashmapGet( (*request)->http_ParsedPostContent, "remotehost" );
		if( el != NULL )
		{
			host = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( (*request)->http_ParsedPostContent, "remotesessionid" );
		if( el != NULL )
		{
			remsession = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( host != NULL )
		{
			// deviceid , appname
			// overwrite sessionid
			
			HashmapPut( (*request)->http_ParsedPostContent, StringDuplicate("sessionid"), remsession );
			
			DataForm *df = DataFormFromHttp( *request );
			if( df != NULL )
			{
				DEBUG("[AdminWebRequest] Connect to server rhost %s\n", host );
				FConnection *mycon = ConnectToServer( l->fcm->fcm_CommService, host );
				if( mycon != NULL )
				{
					CommServiceRegisterEvent( mycon, mycon->fc_Socket );
					DataForm *recvdf = CommServiceSendMsgDirect( mycon, df );
					if( recvdf != NULL )
					{
						DEBUG("[AdminWebRequest] Remote command, data received size %lu\n", recvdf->df_Size );
						int allocsize = recvdf->df_Size - (( SHIFT_LEFT(COMM_MSG_HEADER_SIZE, 1) )+COMM_MSG_HEADER_SIZE);
						char *resppointer = FCalloc( allocsize, sizeof(FBYTE) );
						if( resppointer != NULL )
						{
							memcpy( resppointer, ( (char *)recvdf + (( SHIFT_LEFT(COMM_MSG_HEADER_SIZE, 1) )+COMM_MSG_HEADER_SIZE) ), allocsize );
							DEBUG("[AdminWebRequest] etting response %s\n", resppointer );
							
							HttpSetContent( response, resppointer, allocsize );
						}
						else
						{
							char dictmsgbuf[ 256 ];
							snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
							HttpAddTextContent( response, dictmsgbuf );
							//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"cannot allocate memory for response!\"}" );
						}
						DataFormDelete( recvdf );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED_EMPTY_STRING], "CommServiceSendMsgDirect" );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_FUNCTION_RETURNED_EMPTY_STRING );
						HttpAddTextContent( response, dictmsgbuf );
						//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"response is empty!\"}" );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					char dictmsgbuf1[ 196 ];
					snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_SERVER_CONNECT_ERROR], host );
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_SERVER_CONNECT_ERROR );
					HttpAddTextContent( response, dictmsgbuf );
					//char temp[ 512 ];
					//snprintf( temp, sizeof(temp), "ok<!--separate-->{\"response\":\"cannot setup connection with server!: %s\"}", host );
					//HttpAddTextContent( response, temp );
				}
				
				DataFormDelete( df );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_CONVERT_MESSAGE] , DICT_CANNOT_CONVERT_MESSAGE );
				HttpAddTextContent( response, dictmsgbuf );
				//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"cannot convert message!\"}" );
			}
			FFree( host );
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "remotehost" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			//HttpAddTextContent( response, "fail<!--separate-->{\"response\":\"'remotehost' parameter not found!\"}" );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/servermessage</H2>Send message to all sessions
	*
	* @param sessionid - (required) session id of logged user
	* @param usersession - additional parameter which say to which user session message should go
	* @return remote functions response
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "servermessage" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *msg = NULL;
		char *usersession = NULL;
		
		el = HttpGetPOSTParameter( (*request), "message" );
		if( el == NULL ) el = HashmapGet( (*request)->http_Query, "message" );
		//el =  HashmapGet( (*request)->parsedPostContent, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( (*request), "usersession" );
		if( el == NULL ) el = HashmapGet( (*request)->http_Query, "usersession" );
		//el =  HashmapGet( (*request)->parsedPostContent, "usersession" );
		if( el != NULL )
		{
			usersession = UrlDecodeToMem( ( char *)el->hme_Data );
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
		
			if( usersession == NULL && UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
			{
				BufStringAdd( bs, "{\"userlist\":[");
			
				char *sndbuffer = FCalloc( msgsize, sizeof(char) );
				if( sndbuffer != NULL )
				{
					User *usr = l->sl_UM->um_Users;
					while( usr != NULL )
					{
						FRIEND_MUTEX_LOCK( &usr->u_Mutex );
						UserSessListEntry  *usl = usr->u_SessionsList;
						while( usl != NULL )
						{
							UserSession *locses = (UserSession *)usl->us;
							if( locses != NULL )
							{
								DEBUG("[AdminWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
						
								if( ( (timestamp - locses->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) )
								{
									char tmp[ 512 ];
									int tmpsize = 0;
								
									if( pos == 0 )
									{
										tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
									}
									else
									{
										tmpsize = snprintf( tmp, sizeof(tmp), ",{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, locses->us_DeviceIdentity );
									}
							
									int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":{\"username\":\"%s\",\"message\":\"%s\"}}}", 
										loggedSession->us_User->u_Name , msg );
							
									if( usersession != NULL && strcmp( usersession, locses->us_SessionID ) == 0 )
									{
										msgsndsize += WebSocketSendMessageInt( locses, sndbuffer, lenmsg );
									}
									else
									{
										msgsndsize += WebSocketSendMessageInt( locses, sndbuffer, lenmsg );
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
					FFree( sndbuffer );
				}
				BufStringAdd( bs, "]}");
			}
			else	//is admin
			{
				DEBUG("Send server msg: usersession %s\n", usersession );
				if( usersession != NULL )
				{
					BufStringAdd( bs, "{\"userlist\":[");
				
					int msgsize = strlen( msg )+1024;
					char *sndbuffer = FCalloc( msgsize, sizeof(char) );
				
					User *usr = (User *)loggedSession->us_User;
					if( usr != NULL )
					{
						FRIEND_MUTEX_LOCK( &usr->u_Mutex );
						UserSessListEntry *usle = (UserSessListEntry *)usr->u_SessionsList;
						int msgsndsize = 0;
						while( usle != NULL )
						{
							UserSession *ls = (UserSession *)usle->us;
							if( ls != NULL )
							{
								DEBUG("Going through all usersessions: %p, compare %s vs %s\n", ls->us_SessionID, usersession, ls->us_SessionID );
								if( strcmp( usersession, ls->us_SessionID ) == 0 )
								{
									DEBUG("Found same session, sending msg\n");
									char tmp[ 512 ];
									int tmpsize = 0;
						
									tmpsize = snprintf( tmp, sizeof(tmp), "{\"username\":\"%s\", \"deviceidentity\":\"%s\"}", usr->u_Name, ls->us_DeviceIdentity );
							
									int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":{\"username\":\"%s\",\"message\":\"%s\"}}}", 
									loggedSession->us_User->u_Name , msg );
						
									msgsndsize = WebSocketSendMessageInt( ls, sndbuffer, lenmsg );
								}
							}
							usle = (UserSessListEntry *)usle->node.mln_Succ;
						}
						FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
					}
					
					//int status = MobileAppNotifyUser( SLIB, usr->u_Name, "test_app", "app_name", "title", "test message", MN_all_devices, NULL/*no extras*/, 0 );
				
					if( msgsndsize > 0 )
					{
						BufStringAdd( bs, usr->u_Name );
					}
				
					BufStringAdd( bs, "]}");
				}
				else
				{
					char dictmsgbuf[ 256 ];
					int size = snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
					BufStringAddSize( bs, dictmsgbuf, size );
				}
			}
		}
		else	//message is empty
		{
			
		}
		
		HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
		bs->bs_Buffer = NULL;
		
		BufStringDelete( bs );
		
		if( usersession != NULL )
		{
			FFree( usersession );
		}
		
		if( msg != NULL )
		{
			FFree( msg );
		}
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/restartws</H2> Restart Websockets function
	*
	* @param sessionid - (required) session id of logged user
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "restartws" ) == 0 )
	{
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			Log( FLOG_INFO, "Websocket thread will be restarted\n");
			
			if( l->fcm->fcm_WebSocket != NULL )
			{
				WebSocketDelete( l->fcm->fcm_WebSocket );
				l->fcm->fcm_WebSocket = NULL;
			}
		
			Log( FLOG_INFO, "Websocket stopped\n");
			
			if( ( l->fcm->fcm_WebSocket = WebSocketNew( l,  l->fcm->fcm_WSPort, l->fcm->fcm_WSSSLEnabled, 0, l->fcm->fcm_WSExtendedDebug ) ) != NULL )
			{
				WebSocketStart( l->fcm->fcm_WebSocket );
				Log( FLOG_INFO, "Websocket thread will started\n");
			}
			else
			{
				Log( FLOG_FATAL, "Cannot launch websocket server\n");
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/admin/uptime</H2>Function return FriendCore uptime information (unix timestamp)
	*
	* @param sessionid - (required) session id of logged user
	* @return function return information about uptime ok<!--separate-->{"result":1,"uptime":unixtime_number}
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "uptime" ) == 0 )
	{
		//ok<!--separate-->{"result":1,"uptime":unixtime_number}
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			char dictmsgbuf[ 512 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "ok<!--separate-->{\"result\":1,\"uptime\":%lu", (time( NULL ) - l->l_UptimeStart) );
		
			HttpAddTextContent( response, dictmsgbuf );
			*result = 200;
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, dictmsgbuf );
		}
	}
	
		//
		// function not found
		//
		
	error:
	
	return response;
}
