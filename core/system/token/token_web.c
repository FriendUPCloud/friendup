/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Token Web body
 *
 *  All functions related to Token structures
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 27/03/2018
 */

#include <core/types.h>
#include <core/nodes.h>
#include "token_web.h"

#include <core/functions.h>
#include <util/md5.h>
#include <network/digcalc.h>
#include <network/mime.h>
#include <system/invar/invar_manager.h>
#include <system/user/user_manager.h>
#include <system/fsys/fs_manager.h>
#include <core/pid_thread_web.h>
#include <network/mime.h>
#include <system/fsys/door_notification.h>

/**
 * Token Network handler
 *
 * @param m pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session
 * @param result pointer to integer where error number will be returned
 * @return http response
 */
Http *TokenWebRequest( void *m, char **urlpath, Http **request, UserSession *loggedSession, int *result )
{
	SystemBase *l = (SystemBase *)m;
	Http *response = NULL;
	
	DEBUG("[TokenWebRequest] start\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( "text/html", 9 ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ) },
		{ TAG_DONE, TAG_DONE}
	};
	
	if( response != NULL )
	{
		FERROR("Response token\n");
		HttpFree( response );
	}
	response = HttpNewSimple( HTTP_200_OK, tags );
	
	if( urlpath[ 1 ] == NULL )
	{
		FERROR( "URL path is NULL!\n" );
		
		char dictmsgbuf[ 256 ];
		snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_PATH_PARAMETER_IS_EMPTY] , DICT_PATH_PARAMETER_IS_EMPTY );
		HttpAddTextContent( response, dictmsgbuf );
		
		goto error;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/token/list</H2>Get information about all DOStokens
	*
	* @param sessionid - (required) session id of logged user
	* @return function return information about all tokens
	*/
	/// @endcond
	if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		int pos = 0;

		if( UMUserIsAdmin( l->sl_UM, (*request), loggedSession->us_User ) == TRUE )
		{
			BufString *bs = DOSTokenManagerList( l->sl_DOSTM );
			
			HttpSetContent( response, bs->bs_Buffer, bs->bs_Size );
			bs->bs_Buffer = NULL;
			
			BufStringDelete( bs );
		}
		else
		{
			HttpAddTextContent( response, "fail<!--separate-->{\"result\":\"User dont have access to functionality\"}" );
		}

		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/token/create</H2>Create token
	*
	* @param command - (required) command which 
	* @param address - provide internet address you want to get information about specific connection
	* @return function return information about FriendCore connection
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		HashmapElement *el = NULL;
		char *command = NULL;		//
		char *tokensesid = NULL;	// token sessionid
		int  times = 1;				// one time token
		time_t timeout = 5 * 60;	// 5 minutes
		int pos = 0;
		
		el = GetHEReq( *request, "command" );
		if( el != NULL && el->data )
		{
			command = UrlDecodeToMem( (char *)el->data );
		}
		el = GetHEReq( *request, "tokensesid" );
		if( el != NULL && el->data )
		{
			tokensesid = UrlDecodeToMem( (char *)el->data );
		}
		el = GetHEReq( *request, "times" );
		if( el != NULL && el->data )
		{
			char *end;
			times = (int)strtol( (char *)el->data, &end, 0 );
		}
		el = GetHEReq( *request, "timeout" );
		if( el != NULL && el->data )
		{
			char *end;
			timeout = (int)strtol( (char *)el->data, &end, 0 );
		}
		
		DOSToken *ntoken = DOSTokenNew( loggedSession, timeout, times );
		if( ntoken != NULL )
		{
			if( DOSTokenManagerAddDOSToken( l->sl_DOSTM, ntoken ) == 0 )
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "ok<!--separate-->{ \"response\": \"success\", \"dostoken\":\"%s\" }", ntoken->ct_TokenID );
				HttpAddTextContent( response, dictmsgbuf );
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ADD_DOSTOKEN] , DICT_CANNOT_ADD_DOSTOKEN );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_MEMORY_FOR_DOSTOKEN] , DICT_NO_MEMORY_FOR_DOSTOKEN );
			HttpAddTextContent( response, dictmsgbuf );
		}

		if( command != NULL )
		{
			FFree( command );
		}
		
		if( tokensesid != NULL )
		{
			FFree( tokensesid );
		}
		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/connection/add</H2>add new FCConnection
	*
	* @param sessionid - (required) session id of logged user
	* @param address - (required) internet address (ip or DNS name)
	* @param name - (required) name which describe new connection
	* @param type - type of connection, avaiable values are: 
	* 	0 - normal server,
		1 - cluster node,
		2 - cluster master,
		3 - master of Friend servers
	* @return return code 59 if everything was created without problems, otherwise error number
	*/
	/// @endcond
	else if( strcmp( urlpath[ 1 ], "add" ) == 0 )
	{


	}
	
		//
		// function not found
		//
		
	error:
	
	return response;
}

