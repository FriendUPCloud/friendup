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
 *  User Session App
 *
 * file contain body related to user sessions app web management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 25/07/2016
 */

#include <core/types.h>
#include <core/nodes.h>
#include "user_session_app_manager_web.h"
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <system/user/user_sessionmanager.h>

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
Http *USAWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
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
		* <HR><H2>system.library/usa/help</H2>Return available commands
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
				"create - create user application session" 
				",delete - delete user application session"
				"\"}" );
		
			*result = 200;
			
			return response;
		}
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/usa/create</H2>Create user. Function require admin rights.
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
	
	if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *usrname = NULL;
		
		DEBUG( "[USAWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		
		el = HttpGetPOSTParameter( request, "username" );
		if( el != NULL )
		{
			usrname = UrlDecodeToMem( (char *)el->hme_Data );
			DEBUG( "[USAWebRequest] Update usrname %s!!\n", usrname );
		}
		
		if( usrname != NULL )
		{
			
		} // missing parameters
		else
		{
			char buffer[ 256 ];
			char buffer1[ 256 ];
			snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "username, password" );
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, buffer );
			
			
//this says if user launched any app:
//SELECT * FROM `FUserSessionApp` WHERE ApplicationID = (select ID FROM `FApplication` WHERE `Name` ='Dock' AND UserID=3 ) 

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
	}
	return response;
}
