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
#undef __DEBUG

/**
 * Http web call processor
 * Function which process all incoming Http requests
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession pointer to UserSession which called this function
 * @param result pointer to result value
 * @return response as Http structure, otherwise NULL
 */
Http *UMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	if( urlpath[ 1 ] == NULL )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
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
				sessionid = UrlDecodeToMem( (char *)el->data );
			}
			
			el = HttpGetPOSTParameter( request, "name" );
			if( el != NULL )
			{
				name = UrlDecodeToMem( (char *)el->data );
			}
			
			if( name != NULL )
			{
				if( sessionid != NULL )
				{
					UserSessListEntry *ses = loggedSession->us_User->u_SessionsList;
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
				sessionid = UrlDecodeToMem( (char *)el->data );
			}
			
			el = HttpGetPOSTParameter( request, "msg" );
			if( el != NULL )
			{
				msg = UrlDecodeToMem( (char *)el->data );
			}
			
			el = HttpGetPOSTParameter( request, "appname" );
			if( el != NULL )
			{
				appname = UrlDecodeToMem( (char *)el->data );
			}
			
			el = HttpGetPOSTParameter( request, "dstauthid" );
			if( el != NULL )
			{
				authid = UrlDecodeToMem( (char *)el->data );
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
	* @param level - groups to which user will be assigned, separated by comma
	* @return { create: sucess } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *groups = NULL;
		//FULONG id = 0;
		FBOOL userCreated = FALSE;
		
		DEBUG( "[UMWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
			}
			
			el = HttpGetPOSTParameter( request, "password" );
			if( el != NULL )
			{
				usrpass = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrpass %s!!\n", usrpass );
			}
			
			if( usrname != NULL && usrpass != NULL )
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
						fullname = UrlDecodeToMem( (char *)el->data );
						DEBUG( "[UMWebRequest] Update fullname %s!!\n", fullname );
					}
					
					el = HttpGetPOSTParameter( request, "email" );
					if( el != NULL )
					{
						email = UrlDecodeToMem( (char *)el->data );
						DEBUG( "[UMWebRequest] Update email %s!!\n", email );
					}
					
					el = HttpGetPOSTParameter( request, "level" );
					if( el != NULL )
					{
						groups = UrlDecodeToMem( (char *)el->data );
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
							HttpAddTextContent( response, "ok<!--separate-->{ \"create\": \"sucess\" }" );
						}
						else
						{
							char buffer[ 256 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "UMUserCreate", error );
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_FUNCTION_RETURNED );
							HttpAddTextContent( response, buffer );
						}
						
						UGMAssignGroupToUserByStringDB( l->sl_UGM, locusr, groups );
						
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
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		
		if( groups != NULL )
		{
			FFree( groups );
		}
		
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
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		FULONG id = 0;
		
		DEBUG( "[UMWebRequest] Delete user!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->data, &next, 0 );
		}
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
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
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		char *usrpass = NULL;
		
		DEBUG( "[UMWebRequest] Update password!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "password" );
		if( el != NULL )
		{
			usrpass = UrlDecodeToMem( (char *)el->data );
		}
		
		if( usrname != NULL && usrpass != NULL )
		{
			while( logusr != NULL )
			{
				if( strcmp( logusr->u_Name, usrname ) == 0 )
				{
					int err = 0;
					
					if( 0 == ( err = l->sl_ActiveAuthModule->UpdatePassword( l->sl_ActiveAuthModule, request, logusr, usrpass ) ) )
					{
						HttpAddTextContent( response, "ok<!--separate-->{ \"updatepassword\": \"success!\"}" );
					}
					else
					{
						char buffer[ 256 ];
						char buffer1[ 256 ];
						snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_CANNOT_CHANGE_PASS], err );
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_USER_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
					
					break;
				}
				logusr = (User *)logusr->node.mln_Succ;
			}
			
			if( logusr == NULL )
			{
				FERROR("[ERROR] User not found\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
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
	* @return { update: success!} when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		char *usrpass = NULL;
		char *fullname = NULL;
		char *email = NULL;
		char *groups = NULL;
		FULONG id = 0;
		FBOOL userFromSession = FALSE;
		FBOOL canChange = FALSE;
		FBOOL imAdmin = FALSE;
		int entries = 0;
		
		DEBUG( "[UMWebRequest] Update user!!\n" );
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User ) )
		{
			imAdmin = TRUE;
		}
		DEBUG("[UMWebRequest] Im admin %d\n", imAdmin );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->data, &next, 0 );
			DEBUG( "[UMWebRequest] Update id %ld!!\n", id );
		}
		
		if( id > 0 && imAdmin == TRUE )
		{
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
		else if( id > 0 && imAdmin == FALSE )
		{
			logusr = NULL;
		}
		else
		{
			//if( imAdmin == FALSE )
			{
				id = loggedSession->us_User->u_ID;
				userFromSession = TRUE;
				logusr = loggedSession->us_User;
			}
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
			el = HttpGetPOSTParameter( request, "username" );
			if( el != NULL )
			{
				usrname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update usrname %s!!\n", usrname );
				
				if( imAdmin == TRUE )
				{
					char query[ 1024 ];
					sprintf( query, " FUser where `Name`='%s' AND ID != %lu" , usrname, id );
	
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
					usrpass = UrlDecodeToMem( (char *)el->data );
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
					fullname = UrlDecodeToMem( (char *)el->data );
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
					email = UrlDecodeToMem( (char *)el->data );
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
					groups = UrlDecodeToMem( (char *)el->data );
				}
			
				DEBUG("[UMWebRequest] Changing user data %lu\n", id );
				// user is not logged in
				// try to get it from DB
				
				if( imAdmin  == TRUE )
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
					DEBUG("[UMWebRequest] FC will do a change\n");
					
					GenerateUUID( &( logusr->u_UUID ) );
					
					UMUserUpdateDB( l->sl_UM, logusr );
					
					UGMAssignGroupToUserByStringDB( l->sl_UGM, logusr, groups );
					
					RefreshUserDrives( l, logusr, NULL );
					
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
		
		if( groups != NULL )
		{
			FFree( groups );
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
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		if( response != NULL ) FERROR("RESPONSE \n");
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		DEBUG( "[UMWebRequest] Logging out!!\n" );
		
		//
		// we must provide sessionid of user who wants to logout
		//
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessionid" );
		if( el != NULL )
		{
			char *sessid = (char *)el->data;
			UserSession *sess = NULL;
			
			DEBUG("[UMWebRequest] Logout\n");
			
			if( sessid != NULL )
			{
				sess = USMGetSessionBySessionID( l->sl_USM, sessid );
				int error = 0; 
				
				if( sess != NULL )
				{
					SQLLibrary *sqlLib =  l->LibrarySQLGet( l );
					if( sqlLib != NULL )
					{
						sqlLib->Delete( sqlLib, UserSessionDesc, sess );
						l->LibrarySQLDrop( l, sqlLib );
					}
					
					// Logout must be last action called on UserSession
					FRIEND_MUTEX_LOCK( &(sess->us_Mutex) );
					sess->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &(sess->us_Mutex) );
					
					error = USMUserSessionRemove( l->sl_USM, sess );
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
					if( request->h_RequestSource == HTTP_SOURCE_WS )
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
				l->sl_ActiveAuthModule->Logout( l->sl_ActiveAuthModule, request, sessid );
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
	* @param username - (required) name of user which sessions you want to get
	* @return sessions attached to users in JSON format, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "sessionlist" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		User *logusr = l->sl_UM->um_Users;
		char *usrname = NULL;
		
		DEBUG( "[UMWebRequest] get sessionlist!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		if( usrname != NULL )
		{
			DEBUG(" username: %s\n", usrname );
			char *temp = FCalloc( 2048, 1 );
			int numberOfSessions = 0;
			
			if( temp != NULL )
			{
				while( logusr != NULL )
				{
					DEBUG("Loop: loguser->name: %s\n", logusr->u_Name );
					if( logusr->u_Name != NULL && strcmp( logusr->u_Name, usrname ) == 0 )
					{
						BufString *bs = BufStringNew();
						
						FRIEND_MUTEX_LOCK( &(logusr->u_Mutex) );
					
						UserSessListEntry *sessions = logusr->u_SessionsList;
						BufStringAdd( bs, "ok<!--separate-->[" );
						int pos = 0;
						//unsigned long t = time( NULL );
					
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
							if( us->us_WSClients != NULL && ( (timestamp - us->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) )
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
							sessions = (UserSessListEntry *) sessions->node.mln_Succ;
						}
						
						FRIEND_MUTEX_UNLOCK( &(logusr->u_Mutex) );
					
						BufStringAdd( bs, "]" );
					
						HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
					
						DEBUG("[UMWebRequest] Sessions %s\n", bs->bs_Buffer );
						bs->bs_Buffer = NULL;
					
						BufStringDelete( bs );
						numberOfSessions++;
					}
					logusr = (User *)logusr->node.mln_Succ;
				}
				FFree( temp );
			}
			
			if( logusr == NULL && numberOfSessions == 0 )
			{
				FERROR("[ERROR] User not found\n" );
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
				HttpAddTextContent( response, buffer );
			}
		}
		else
		{
			FERROR("[ERROR] username parameter is missing\n" );
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_USER_DEV_REQUIRED], "username" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_USER_DEV_REQUIRED );
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
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		//UserSession *usrses = l->sl_USM->usm_Sessions;
		char *sessionid = NULL;
		char *deviceid = NULL;
		char *usrname = NULL;
		int error = 0;
		
		DEBUG( "[UMWebRequest] kill session" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "sessid" );
		if( el != NULL )
		{
			sessionid = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "deviceid" );
		if( el != NULL )
		{
			deviceid = UrlDecodeToMem( (char *)el->data );
		}
		
		el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->data );
		}
		
		if( sessionid != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by sessionid\n");
			UserSession *ses = USMGetSessionBySessionID( l->sl_USM, sessionid );
			if( ses != NULL )
			{
				char tmpmsg[ 2048 ];
				int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
							
				int msgsndsize = WebSocketSendMessageInt( ses, tmpmsg, lenmsg );
				
				char *uname = NULL;
				if( ses->us_User != NULL )
				{
					uname = ses->us_User->u_Name;
				}
					
				DEBUG("[UMWebRequest] user %s session %s will be removed by user %s msglength %d\n", uname, ses->us_SessionID, uname, msgsndsize );
				
				
				FRIEND_MUTEX_LOCK( &(ses->us_Mutex) );
				ses->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &(ses->us_Mutex) );
				
				error = USMUserSessionRemove( l->sl_USM, ses );
			}
		}
		else if( deviceid != NULL && usrname != NULL )
		{
			DEBUG("[UMWebRequest] Remove session by deviceid and username %s - %s\n", deviceid, usrname );
			User *u = UMGetUserByName( l->sl_UM, usrname );
			if( u != NULL )
			{
				UserSessListEntry *usl = u->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *s = (UserSession *) usl->us;
					if( s != NULL && s->us_DeviceIdentity != NULL && strcmp( s->us_DeviceIdentity, deviceid ) == 0 )
					{
						char tmpmsg[ 2048 ];
						int lenmsg = sprintf( tmpmsg, "{\"type\":\"msg\",\"data\":{\"type\":\"server-notice\",\"data\":\"session killed\"}}" );
							
						int msgsndsize = WebSocketSendMessageInt( s, tmpmsg, lenmsg );
						
						FRIEND_MUTEX_LOCK( &(s->us_Mutex) );
						s->us_InUseCounter--;
						FRIEND_MUTEX_UNLOCK( &(s->us_Mutex) );
						
						error = USMUserSessionRemove( l->sl_USM, s );
						
						DEBUG("Bytes send: %d\n", msgsndsize );
						
						break;
					}
					
					usl = (UserSessListEntry *)usl->node.mln_Succ;
				}
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
				if( ( (char *)el->data ) != NULL && strcmp("true", (char *)el->data ) == 0 )
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
				
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						DEBUG("[UMWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
						
						if( ( (timestamp - locses->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSClients != NULL )
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
				if( ( (char *)el->data ) != NULL && strcmp("true", (char *)el->data ) == 0 )
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
				
				UserSessListEntry  *usl = usr->u_SessionsList;
				while( usl != NULL )
				{
					UserSession *locses = (UserSession *)usl->us;
					if( locses != NULL )
					{
						FBOOL add = FALSE;
						//DEBUG("[UMWebRequest] Going through sessions, device: %s time %lu timeout time %lu WS ptr %p\n", locses->us_DeviceIdentity, (long unsigned int)(timestamp - locses->us_LoggedTime), l->sl_RemoveSessionsAfterTime, locses->us_WSClients );
						
						if( ( (timestamp - locses->us_LoggedTime) < l->sl_RemoveSessionsAfterTime ) && locses->us_WSClients != NULL )
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
			keyid = strtol( (char *)el->data, &end, 0 );
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
