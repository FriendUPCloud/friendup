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
 *  User Group Manager Web body
 *
 * All functions related to User Group Manager web calls
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 17/01/2019
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
Http *UMGWebRequest( void *m, char **urlpath, Http* request, UserSession *loggedSession, int *result )
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
	* <HR><H2>system.library/group/help</H2>Return available commands
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
			"create - create workgroup in database" 
			",remove - remove (disable) group in system"
			"\"}" );
		
		*result = 200;
		
		return response;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/create</H2>Create group. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param groupname - (required) group name
	* @param type - type name
	* @param parentid - id of parent workgroup
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "create" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *groupname = NULL;
		char *type = NULL;
		FULONG parentID = 0;
		FULONG groupID = 0;
		
		DEBUG( "[UMWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			el = HttpGetPOSTParameter( request, "groupname" );
			if( el != NULL )
			{
				groupname = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMGWebRequest] Update groupname %s!!\n", groupname );
			}
			
			el = HttpGetPOSTParameter( request, "type" );
			if( el != NULL )
			{
				type = UrlDecodeToMem( (char *)el->data );
				DEBUG( "[UMWebRequest] Update type %s!!\n", type );
			}
			
			el = HttpGetPOSTParameter( request, "parentid" );
			if( el != NULL )
			{
				char *end;
				parentID = strtol( (char *)el->data, &end, 0 );
			}
			
			if( groupname != NULL )
			{
				// get information from DB if group already exist
				
				UserGroup *fg = UGMGetGroupByName( l->sl_UGM, groupname );
				
				if( fg != NULL )	// group already exist, there is no need to create double
				{
					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_GROUP_ALREADY_EXIST] , DICT_USER_GROUP_ALREADY_EXIST );
					HttpAddTextContent( response, buffer );
				}
				else	// group do not exist
				{
					UserGroup *ug = UserGroupNew( 0, groupname, loggedSession->us_User->u_ID, type );
					
					if( ug != NULL )
					{
						int error = UGMAddGroup( l->sl_UGM, ug );
						
						if( error == 0 )
						{
							SQLLibrary *sqlLib = l->LibrarySQLGet( l );
							int val = 0;
							if( sqlLib != NULL )
							{
								int val = sqlLib->Save( sqlLib, UserGroupDesc, ug );
								l->LibrarySQLDrop( l, sqlLib );
							}
							groupID = ug->ug_ID;
					
							char buffer[ 256 ];
							snprintf( buffer, sizeof(buffer), "ok<!--separate-->{ \"response\": \"sucess\",\"id\":%lu }", groupID );
							HttpAddTextContent( response, buffer );
						}
						else
						{
							char buffer[ 256 ];
							char buffer1[ 256 ];
							snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "UGMUserGroupCreate", error );
							snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_FUNCTION_RETURNED );
							HttpAddTextContent( response, buffer );
						}
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_CANNOT_ALLOCATE_MEMORY] , DICT_CANNOT_ALLOCATE_MEMORY );
						HttpAddTextContent( response, buffer );
					}
				} // UserGroup found in db
			} // missing parameters
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "groupname" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}
		
		if( groupname != NULL )
		{
			FFree( groupname );
		}

		*result = 200;
	}
	
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/delete</H2>Delete user. Function require admin rights.
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
	
	return response;
}
