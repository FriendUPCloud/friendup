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
 *  Security Web
 *
 * handle all commands regarding security
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/02/2021
 */

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/application/application.h>
#include <z/zlibrary.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>
#include <system/security/secured_host.h>
#include <util/session_id.h>

/// ifnot WEB_CALL_DOCUMENTATION
/**
 * Security web calls handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @return pointer to new Http structure (response) or NULL when error appear
 */
/// endif
Http* SecurityWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedSession )
{
	Log( FLOG_DEBUG, "SecurityWebRequest %s  CALLED BY: %s\n", urlpath[ 1 ], loggedSession->us_User->u_Name );

	Http* response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/security/help</H2>add new FCConnection
	*
	* @param sessionid - (required) session id of logged user
	*
	* @return return information about avaiable functions (security section)
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, \
			"regenerateservertoken - regenerate token\n \
			removeservertoken - remove server token\n \
			createhost - create host entry assigned to user\n \
			updatehost - update host entry\n \
			deletehost - delete host entry\n \
			" );
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/security/regenerateservertoken</H2>Function regenerate server token
	*
	* @param sessionid - (required) session id of logged user
	* @param userid - user id for which token will be generated. By default token will be regenerated for current user.
	* 
	* @return return {"result":"success","token":"<TOKEN>"} when success otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "regenerateservertoken" ) == 0 )
	{
		FUQUAD userID = 0;
		FBOOL allowed = FALSE;
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID == 0 || userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
		}
		
		if( allowed == TRUE )
		{
			char *tmpses = SessionIDGenerate();
			if( tmpses != NULL )
			{
				SQLLibrary *sqllib = l->GetDBConnection( l );
				if( sqllib != NULL )
				{
					char insertQuery[ 1024 ];
				
					// update server token
				
					int size = snprintf( insertQuery, sizeof( insertQuery ), "UPDATE `FUser` SET ServerToken='%s' WHERE ID=%lu", tmpses, userID );
					sqllib->QueryWithoutResults( sqllib, insertQuery );
				
					snprintf( insertQuery, sizeof(insertQuery), "{\"result\":\"success\",\"token\":\"%s\"}", tmpses );
					HttpAddTextContent( response, insertQuery );
					
					l->DropDBConnection( l, sqllib );
				}
				FFree( tmpses );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/security/deleteservertoken</H2>Function delete server token
	*
	* @param sessionid - (required) session id of logged user
	* @param userid - user id for which token will be removed
	* 
	* @return return {"result":"success"} when succes otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "deleteservertoken" ) == 0 )
	{
		FUQUAD userID = 0;
		FBOOL allowed = FALSE;
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID == 0 || userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
		}
		
		if( allowed == TRUE )
		{
			SQLLibrary *sqllib = l->GetDBConnection( l );
			if( sqllib != NULL )
			{
				char insertQuery[ 1024 ];
				
				// update server token
				
				int size = snprintf( insertQuery, sizeof( insertQuery ), "UPDATE `FUser` SET ServerToken='' WHERE ID=%lu", userID );
				sqllib->QueryWithoutResults( sqllib, insertQuery );
				
				snprintf( insertQuery, sizeof(insertQuery), "{\"result\":\"success\"}" );
				HttpAddTextContent( response, insertQuery );
				
				l->DropDBConnection( l, sqllib );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}
	}

	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/security/createhost</H2>Create secured host entry
	*
	* @param sessionid - (required) session id of logged user
	* @param ip - if passed it is stored, otherwise ip is taken from field "fordwarded"
	* @param userid - id of user to which host will be assigned
	* @param status - status of entry. Used enums: SECURED_HOST_STATUS_NONE = 0,SECURED_HOST_STATUS_ALLOWED = 1, SECURED_HOST_STATUS_BLOCKED = 2. By default it is set to 0.
	* 
	* @return response {"result":"success","host":"<HOST IP>","status":<STATUS>} when success otherwise error
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "createhost" ) == 0 )
	{
		char *ip = NULL;
		FUQUAD userID = 0;
		FULONG status = 0;
		FBOOL allowed = FALSE;
		FBOOL releaseIP = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "ip" );
		if( el != NULL )
		{
			ip = UrlDecodeToMem( ( char *)el->hme_Data );
			DEBUG("[security/createhost] ip is not null: %s\n", ip );
			releaseIP = TRUE;
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "status" );
		if( el != NULL )
		{
			char *end;
			status = strtoull( el->hme_Data,  &end, 0 );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID > 0 && userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
			else
			{
				userID = loggedSession->us_UserID;
				allowed = TRUE;
			}
		}
		
		if( ip == NULL )
		{
			ip = HttpGetHeaderFromTable( request, HTTP_HEADER_X_FORWARDED_FOR );
		}
		
		if( allowed == TRUE )
		{
			SQLLibrary *sqllib = l->GetDBConnection( l );
			if( sqllib != NULL )
			{
				char insertQuery[ 1024 ];
				
				// delete all hosts same hosts for user
				
				int size = snprintf( insertQuery, sizeof( insertQuery ), "DELETE FROM `FSecuredHost` where IP='%s' AND UserID=%lu", ip, userID );
				sqllib->QueryWithoutResults( sqllib, insertQuery );
				
				time_t ti = time( NULL );
				// create host in DB
				
				size = snprintf( insertQuery, sizeof( insertQuery ), "INSERT INTO `FSecuredHost` (IP,Status,UserID,CreateTime) VALUES('%s',%lu,%lu,%lu)", ip, status, userID, ti );
				sqllib->QueryWithoutResults( sqllib, insertQuery );
			
				DEBUG("[SecurityWeb/createhost] sl query %s\n", insertQuery );
				l->DropDBConnection( l, sqllib );
				
				snprintf( insertQuery, sizeof(insertQuery), "{\"result\":\"success\",\"host\":{\"ip\":\"%s\",\"status\":%lu}}", ip, status );

				HttpAddTextContent( response, insertQuery );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}

		if( ip != NULL && releaseIP == TRUE )
		{
			FFree( ip );
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/security/updatehost</H2>Update security host assigned to user
	*
	* @param sessionid - (required) session id of logged user
	* @param host - if passed it is stored, otherwise host is taken from field "fordwarded"
	* @param userid - id of user to which host will be assigned
	* @param status - status of entry. Used enums: SECURED_HOST_STATUS_NONE = 0,SECURED_HOST_STATUS_ALLOWED = 1, SECURED_HOST_STATUS_BLOCKED = 2. By default it is set to 0.
	* 
	* @return { "response":"success" } otherwise information about error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "updatehost" ) == 0 )
	{
		char *ip = NULL;
		FUQUAD userID = 0;
		FULONG status = 0;
		FBOOL allowed = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el = HashmapGet( request->http_ParsedPostContent, "ip" );
		if( el != NULL )
		{
			ip = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		el = HashmapGet( request->http_ParsedPostContent, "status" );
		if( el != NULL )
		{
			char *end;
			status = strtoull( el->hme_Data,  &end, 0 );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID == 0 || userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
		}
		
		if( allowed == TRUE )
		{
			SQLLibrary *sqllib = l->GetDBConnection( l );
			if( sqllib != NULL )
			{
				char insertQuery[ 1024 ];
				
				snprintf( insertQuery, sizeof( insertQuery ), "UPDATE `FSecuredHost` Set Status='%lu' WHERE IP='%s'", status, ip );
				sqllib->QueryWithoutResults( sqllib, insertQuery );
			
				DEBUG("[SecurityWeb/createhost] sl query %s\n", insertQuery );
				l->DropDBConnection( l, sqllib );
				
				snprintf( insertQuery, sizeof(insertQuery), "{\"result\":\"success\",\"host\":{\"ip\":\"%s\",\"status\":%ld,\"userid\":%lu}}", ip, status, userID );

				HttpAddTextContent( response, insertQuery );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}

		if( ip != NULL )
		{
			FFree( ip );
		}
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/security/listhosts</H2>List of hosts
	*
	* @param sessionid - (required) session id of logged user
	* @param userid - hosts will be filtered by userid
	* 
	* @return response {"result":"success","hosts":[]} when success otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "listhosts" ) == 0 )
	{
		FUQUAD userID = 0;
		FUQUAD userIDFromParams = 0;
		FBOOL allowed = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
			userIDFromParams = userID;
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID == 0 || userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
		}

		if( allowed == TRUE )
		{
			DEBUG("[SecurityWeb] get hostslist\n");
			SQLLibrary *sqllib = l->GetDBConnection( l );
			if( sqllib != NULL )
			{
				BufString *bs = BufStringNew();
				DEBUG("[SecurityWeb] get hostslist buffer created\n");
				
				BufStringAdd( bs, "{\"result\":\"success\",\"hosts\":[" );
				
				char selectQuery[ 1024 ];
				
				if( userIDFromParams > 0 )
				{
					sqllib->SNPrintF( sqllib, selectQuery, sizeof(selectQuery), "SELECT IP,Status,UserID,CreateTime FROM `FSecuredHost` WHERE UserID='%ld'", userIDFromParams );
				}
				else
				{
					strcpy( selectQuery, "SELECT IP,Status,UserID,CreateTime FROM `FSecuredHost`" );
				}
				
				void *result = sqllib->Query( sqllib, selectQuery );
				if( result != NULL )
				{
					int pos = 0;
					char **row;
					while( ( row = sqllib->FetchRow( sqllib, result ) ) )
					{
						char entry[ 1024 ];
						int len = 0;
						if( pos == 0 )
						{
							len = snprintf( entry, sizeof( entry ), "{\"ip\":\"%s\",\"status\":%s,\"userid\":%s,\"createtime\":%s}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ] );
						}
						else
						{
							len = snprintf( entry, sizeof( entry ), ",{\"ip\":\"%s\",\"status\":%s,\"userid\":%s,\"createtime\":%s}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ] );
						}
						BufStringAddSize( bs, entry, len );
						
						pos++;
					}
					sqllib->FreeResult( sqllib, result );
				}
				
				DEBUG("[SecurityWeb/listhosts] sl query %s\n", selectQuery );
				l->DropDBConnection( l, sqllib );

				BufStringAdd( bs, "]}" );
				
				HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
				bs->bs_Buffer = NULL; // we do not want to release memory, it will be released during SocketWrite call
				
				BufStringDelete( bs );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	* 
	* <HR><H2>system.library/security/deletehost</H2>Remove Security Host entry
	*
	* @param sessionid - (required) session id of logged user
	* @param ip - if passed it is stored, otherwise host is taken from field "fordwarded". If host entry is not provided all hosts will be deleted.
	* @param userid - id of user to which host will be assigned
	* 
	* @return response {"result":"success","ip":"<HOST>"} when success otherwise error
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "deletehost" ) == 0 )
	{
		char *ip = NULL;
		FUQUAD userID = 0;
		FBOOL allowed = FALSE;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "ip" );
		if( el != NULL )
		{
			ip = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		el =  HashmapGet( request->http_ParsedPostContent, "userid" );
		if( el != NULL )
		{
			char *end;
			userID = strtoull( el->hme_Data,  &end, 0 );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			allowed = TRUE;
			if( userID == 0 )
			{
				userID = loggedSession->us_UserID;
			}
		}
		else
		{
			if( userID == 0 || userID == loggedSession->us_UserID )
			{
				allowed = TRUE;
			}
		}

		if( allowed == TRUE )
		{
			SQLLibrary *sqllib = l->GetDBConnection( l );
			if( sqllib != NULL )
			{
				char insertQuery[ 1024 ];
				
				// delete all hosts same hosts for user
				
				if( ip == NULL )
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "DELETE FROM `FSecuredHost` where UserID=%lu", userID );
				}
				else	// delete only specified host
				{
					int size = snprintf( insertQuery, sizeof( insertQuery ), "DELETE FROM `FSecuredHost` where IP='%s' AND UserID=%lu", ip, userID );
				}
				sqllib->QueryWithoutResults( sqllib, insertQuery );

				DEBUG("[SecurityWeb/deletehost] sl query %s\n", insertQuery );
				l->DropDBConnection( l, sqllib );
				
				snprintf( insertQuery, sizeof(insertQuery), "{\"result\":\"success\",\"host\":{\"ip\":\"%s\"}}", ip );

				HttpAddTextContent( response, insertQuery );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
		}

		if( ip != NULL )
		{
			FFree( ip );
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
	DEBUG("[ApplicationWebRequest] FriendCore returned %s\n", response->http_Content );

	return response;
}
