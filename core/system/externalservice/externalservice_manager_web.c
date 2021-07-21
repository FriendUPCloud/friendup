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
 *  External Service Manager Web body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2021/05/27
 */

#include <system/services/service_manager.h>
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <communication/comm_msg.h>

/**
 * ExternalServiceManager web handler
 *
 * @param lsb pointer to SystemBase
 * @param urlpath pointer to memory where table with path is stored
 * @param request pointer to request sent by client
 * @param loggedSession user session which is making a call
 * @return reponse in Http structure
 */

Http *ExternalServiceManagerWebRequest( void *lsb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lsb;
	char *serviceName = NULL;
	int newStatus = -1;
	Service *selService = NULL;
	
	DEBUG("ExternalServiceManagerWebRequest\n");
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/externalservice/list</H2>
	*
	* @param sessionid - (required) session id of logged user
	* @return servers and services avaiable on them in JSON format when success, otherwise error code
	*/
	/// @endcond
	
	if( strcmp( urlpath[ 0 ], "pause" ) == 0 )
	{
		{
			Log( FLOG_ERROR,"User '%s' dont have admin rights\n", loggedSession->us_User->u_Name );
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
			HttpAddTextContent( response, buffer );
		}
	}
	
	return response;
}

