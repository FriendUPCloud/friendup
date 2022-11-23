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
 *  SAS Web
 *
 * handle all commands send by the user
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/03/2020
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
#include "sas_web.h"

// disable debug
#undef __DEBUG

//
// How this thing is working
//  user A call  app/register and then new appsession is created, user structure is filled by his app authid
//  user A call app/share and point to usernames splitted by comma, users X,Y,Z receive via WS information that someone want to invite them
//  user X,Y,Z send message app/accept if they are accepting connection. They also attach their authid. If they cancel they are sending app/unshare
//  user A by using app/send command, can spread message between users X,Y,Z
//  users X,Y,Z can only send messages to session owner (user A) by using command app/sendowner
//
//

/// ifnot WEB_CALL_DOCUMENTATION
/**
 * Application web calls handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with url paths
 * @param request pointer to http request structure
 * @param loggedSession pointer to UserSession owned by function caller
 * @return pointer to new Http structure (response) or NULL when error appear
 */
/// endif
Http* SASWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedSession )
{
	if( urlpath[ 0 ] == NULL )
	{
		Http* response = NULL;
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, "urlpath[0] is NULL\n" );
		return response;
	}
	if( loggedSession != NULL && loggedSession->us_User != NULL )
	{
		Log( FLOG_DEBUG, "SASWebRequest %s  CALLED BY user: %s\n", urlpath[ 0 ], loggedSession->us_User->u_Name );
	}
	else
	{
		Log( FLOG_DEBUG, "SASWebRequest %s  CALLED BY sessionID: %s\n", urlpath[ 0 ], loggedSession->us_SessionID );
	}

	Http* response = NULL;
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/register</H2>Register new Application Shared Session
	*
	* @return { 'server':<X>,'sasid':<Y> } when success, otherwise response with error code
	*/
	/// @endcond
	if( strcmp( urlpath[ 0 ], "register" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		FULONG id = 0;
		
		DEBUG("[SASWebRequest] Register\n");
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el;
		el = HashmapGet( request->http_ParsedPostContent, "id" );
		if( el == NULL ) el = HashmapGet( request->http_Query, "to" );
		if( el != NULL )
		{
			char *end;
			id = strtoll( el->hme_Data,  &end, 0 );
		}
		
		BufString *bsresp = BufStringNew();
		BufStringAddSize( bsresp, "{", 1 );
		
		SASManagerRegisterSession( l->sl_SASManager, bsresp, id );
		
		BufStringAddSize( bsresp, "}", 1 );

		HttpAddTextContent( response, bsresp->bs_Buffer );
		
		BufStringDelete( bsresp );
	}

	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/sas/unregister</H2>Unregister Application Shared Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id which will be removed

	* @return {SASID:<number>} when success, otherwise error code
	*/
	/// @endcond
	else if( strcmp( urlpath[ 0 ], "unregister" ) == 0 )
	{
		char *assid = NULL;
		
		DEBUG("[SASWebRequest] Unregister session\n");
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( assid == NULL )
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("sasid is missing!\n");
		}
		else
		{
			char *end = NULL;

			FUQUAD asval = strtoull( assid,  &end, 0 );
			
			SASManagerUnregisterSession( l->sl_SASManager, asval );
			
			HttpAddTextContent( response, "{\"response\":\"success\"" );
		}
		
		if( assid != NULL )
		{
			FFree( assid );
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

	DEBUG("[SASWebRequest] FriendCore returned %s\n", response->http_Content );

	return response;
}
