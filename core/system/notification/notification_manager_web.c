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
 *  Notification Manager Web body
 *
 * All functions related to Notification Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/01/2019
 */

#include <core/types.h>
#include <core/nodes.h>
#include "notification_manager_web.h"
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <system/notification/notification_manager.h>
#include <util/session_id.h>
#include <mobile_app/mobile_app.h>

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
Http *NMWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
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

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/notification/help</H2>Return available commands
	*
	* @param sessionid - (required) session id of logged user
	* @return avaiable user commands
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
	
		response = HttpNewSimple( HTTP_200_OK,  tags );
	
		HttpAddTextContent( response, "ok<!--separate-->{\"HELP\":\"commands: \"" 
			"notify-server - create user in database" 
			",notify-clients - login user to system"
			"\"}" );
	
		*result = 200;
			
		return response;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/notification/notify-server</H2>Send information to external connection
	*
	* @param sessionid - (required) session id of logged user
	* @param msg - (required) message
	* @param servername - name of the server to which message will be send or put NULL if to all
	* @return { result: 0 } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "notify-server" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *msg = NULL;
		char *servername = NULL;
		
		
		DEBUG( "[NMWebRequest] notify-server!!\n" );
		
		HashmapElement *el = NULL;
		
		//if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			el = HttpGetPOSTParameter( request, "msg" );
			if( el != NULL )
			{
				msg = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[NMWebRequest] msg %s!!\n", msg );
			}
			
			el = HttpGetPOSTParameter( request, "servername" );
			if( el != NULL )
			{
				servername = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[NMWebRequest] servername %s!!\n", servername );
			}
			
			if( msg != NULL )
			{
				int error = NotificationManagerSendInformationToConnections( l->sl_NotificationManager, servername, msg, strlen(msg) );
				
				DEBUG("[NMWebRequest] Send notification to server, error: %d\n", error );
				
				char buf[ 256 ];
				snprintf( buf, sizeof(buf), "ok<!--separate-->{ \"result\":%d }", error );
				HttpAddTextContent( response, buf );

			} // missing parameters
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "msg" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		/*
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
		*/
		
		if( msg != NULL )
		{
			FFree( msg );
		}
		
		if( servername != NULL )
		{
			FFree( servername );
		}
		
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/notification/msgtoextservice</H2>Notify external connections
	*
	* @param sessionid - (required) session id of logged user
	* @param params - (required) paramaters
	* @param type - (required) message type
	* @param group - (required) group of message
	* @param action - (required) action
	* @param servername - name of the server to which message will be send or put NULL if to all
	* @return { result: 0 } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "msgtoextservice" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *params = NULL;
		char *servername = NULL;
		char *type = NULL;
		char *group = NULL;
		char *action = NULL;
		
		DEBUG( "[NMWebRequest] msgtoextservice!!\n" );
		
		HashmapElement *el = NULL;
		
		el = HttpGetPOSTParameter( request, "params" );
		if( el != NULL )
		{
			params = UrlDecodeToMem( (char *)el->data );
			DEBUG( "[NMWebRequest] params %s!!\n", params );
		}
		
		el = HttpGetPOSTParameter( request, "type" );
		if( el != NULL )
		{
			type = UrlDecodeToMem( (char *)el->data );
			DEBUG( "[NMWebRequest] type %s!!\n", type );
		}
		
		el = HttpGetPOSTParameter( request, "group" );
		if( el != NULL )
		{
			group = UrlDecodeToMem( (char *)el->data );
			DEBUG( "[NMWebRequest] group %s!!\n", group );
		}
		
		el = HttpGetPOSTParameter( request, "action" );
		if( el != NULL )
		{
			action = UrlDecodeToMem( (char *)el->data );
			DEBUG( "[NMWebRequest] action %s!!\n", action );
		}
		
		el = HttpGetPOSTParameter( request, "servername" );
		if( el != NULL )
		{
			servername = UrlDecodeToMem( (char *)el->data );
			DEBUG( "[NMWebRequest] servername %s!!\n", servername );
		}
		
		if( params != NULL && type != NULL && group != NULL && action != NULL )
		{
			char *serresp = NotificationManagerSendRequestToConnections( l->sl_NotificationManager, request, loggedSession, servername, type, group, action, params );
			if( serresp != NULL )
			{
				HttpSetContent( response, serresp, strlen( serresp ) );
			}
		} // missing parameters
		else
		{
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, channelid, app, title, message" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
		
		if( params != NULL )
		{
			FFree( params );
		}
		if( type != NULL )
		{
			FFree( type );
		}
		if( action != NULL )
		{
			FFree( action );
		}
		if( group != NULL )
		{
			FFree( group );
		}
		*result = 200;
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/notification/notify-clients</H2>Send mobile notification to user.
	*
	* @param sessionid - (required) session id of logged user
	* @param username - (required) user name which will receive notification
	* @param channelid - (required) channel id which is kind of unique source id
	* @param app - (required) application name
	* @param title - (required) title of message
	* @param message - (required) message
	* @param extra - additional data
	* @return { result: 0 }  when success, otherwise error with code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "notify-clients" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		char *username = NULL;
		char *channelid = NULL;
		char *app = NULL;
		char *title = NULL;
		char *message = NULL;
		char *extra = NULL;
		int type = 0;
		
		HashmapElement *el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			username = UrlDecodeToMem( el->data );
		}
		
		el = HttpGetPOSTParameter( request, "channelid" );
		if( el != NULL )
		{
			channelid = UrlDecodeToMem( el->data );
		}
		
		el = HttpGetPOSTParameter( request, "app" );
		if( el != NULL )
		{
			app = UrlDecodeToMem( el->data );
		}
		
		el = HttpGetPOSTParameter( request, "title" );
		if( el != NULL )
		{
			title = UrlDecodeToMem( el->data );
		}
		
		el = HttpGetPOSTParameter( request, "message" );
		if( el != NULL )
		{
			message = UrlDecodeToMem( el->data );
		}
		
		el = HttpGetPOSTParameter( request, "extra" );
		if( el != NULL )
		{
			extra = UrlDecodeToMem( el->data );
		}
		
		if( username == NULL || channelid == NULL || app == NULL || title == NULL || message == NULL )
		{
			int error = MobileAppNotifyUserRegister( l, username, channelid, app, title, message, type, extra, time(NULL) );
			
			char buf[ 256 ];
			snprintf( buf, sizeof(buf), "ok<!--separate-->{ \"result\":%d }", error );
			HttpAddTextContent( response, buf );
		} // missing parameters
		else
		{
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, channelid, app, title, message" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
		
		DEBUG( "[NMWebRequest] notify-clients\n" );
		
		if( username != NULL ){ FFree( username ); }
		if( channelid != NULL ){ FFree( channelid ); }
		if( app != NULL ){ FFree( app ); }
		if( title != NULL ){ FFree( title ); }
		if( message != NULL ){ FFree( message ); }
		if( extra != NULL ){ FFree( extra ); }
	}
	
	return response;
}
