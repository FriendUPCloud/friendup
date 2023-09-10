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
 *  Service Manager Web body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2020
 */

#include "service_manager_web.h"
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <communication/comm_msg.h>

/**
 * ServiceManager web handler
 *
 * @param lsb pointer to SystemBase
 * @param urlpath pointer to memory where table with path is stored
 * @param request pointer to request sent by client
 * @param loggedSession user session which is making a call
 * @return reponse in Http structure
 */

Http *SMWebRequest( void *lsb, char **urlpath, Http* request, UserSession *loggedSession )
{
	SystemBase *l = (SystemBase *)lsb;
	
	DEBUG("ServiceManagerWebRequest: %s\n", urlpath[ 0 ] );
	
	struct TagItem tags[] = {
		{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
		{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
		{ TAG_DONE, TAG_DONE}
	};
		
	Http *response = HttpNewSimple( HTTP_200_OK,  tags );
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/service/request</H2>Notify external connections
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
	
	if( strcmp( urlpath[ 0 ], "request" ) == 0 )
	{
		char *params = NULL;
		char *servername = NULL;
		int type = 0;
		char *path = NULL;
		
		DEBUG( "[NMWebRequest] request!!\n" );
		
		HashmapElement *el = NULL;
		
		el = GetHEReq( request, "params" );
		if( el != NULL )
		{
			params = UrlDecodeToMem( (char *)el->hme_Data );
			DEBUG( "[NMWebRequest] params %s!!\n", params );
		}
		
		el = GetHEReq( request, "type" );
		if( el != NULL )
		{
			type = atoi( (char *)el->hme_Data );
			DEBUG( "[NMWebRequest] type %d!!\n", type );
		}
		
		el = GetHEReq( request, "path" );
		if( el != NULL )
		{
			path = UrlDecodeToMem( (char *)el->hme_Data );
			DEBUG( "[NMWebRequest] group %s!!\n", path );
		}
		
		el = GetHEReq( request, "servername" );
		if( el != NULL )
		{
			servername = UrlDecodeToMem( (char *)el->hme_Data );
			DEBUG( "[NMWebRequest] servername %s!!\n", servername );
		}
		
		if( params != NULL && path != NULL )
		{
			if( l->sl_NotificationManager )
			{
				BufString *serresp = NotificationManagerSendRequestToConnections( 
					l->sl_NotificationManager, 
					request, 
					loggedSession, 
					servername, 
					type, 
					path, 
					params 
				); // 0 - type request, 1 - event
				
				if( serresp != NULL )
				{
					HttpSetContent( response, serresp->bs_Buffer, serresp->bs_Size );
					
					// assign response to return string and delete bufstring
					serresp->bs_Buffer = NULL;
					BufStringDelete( serresp );
				}
			}
		} // missing parameters
		else
		{
			char buffer[ 512 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1)-1, l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "params, path" );
			snprintf( buffer, sizeof(buffer)-1, ERROR_STRING_TEMPLATE, buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
		}
		
		if( params != NULL )
		{
			FFree( params );
		}

		if( path != NULL )
		{
			FFree( path );
		}
	}

	DEBUG("Return pointer to response %p\n", response );
	return response;
}

