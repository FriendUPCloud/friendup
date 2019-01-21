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
				DEBUG("GroupCreate: pointer to group from memory: %p\n", fg );
				
				if( fg != NULL )	// group already exist, there is no need to create double
				{
					if( fg->ug_Status == USER_GROUP_STATUS_DISABLED )
					{
						fg->ug_Status = USER_GROUP_STATUS_ACTIVE;
						
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "ok<!--separate-->{ \"response\": \"sucess\",\"id\":%lu }", fg->ug_ID );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_USER_GROUP_ALREADY_EXIST] , DICT_USER_GROUP_ALREADY_EXIST );
						HttpAddTextContent( response, buffer );
					}
				}
				else	// group do not exist in memory
				{
					DEBUG("GroupCreate: group do not exist in memory\n");
					UserGroup *ug = NULL;
					FBOOL ugFromDatabase = FALSE;

					SQLLibrary *sqlLib = l->LibrarySQLGet( l );
					if( sqlLib != NULL )
					{
						char where[ 512 ];
						int size = snprintf( where, sizeof(where), "Name='%s'", groupname );
						int entries;
					
						ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );
						if( ug != NULL )
						{
							ug->ug_Status = USER_GROUP_STATUS_ACTIVE;
							UGMAddGroup( l->sl_UGM, ug );
							ugFromDatabase = TRUE;
						}
						l->LibrarySQLDrop( l, sqlLib );
					}
					
					if( ug == NULL )
					{
						DEBUG("GroupCreate: new UserGroup will be created\n");
						ug = UserGroupNew( 0, groupname, loggedSession->us_User->u_ID, type );
					}
					
					if( ug != NULL )
					{
						ug->ug_UserID = loggedSession->us_UserID;
						ug->ug_ParentID = parentID;
						int error = UGMAddGroup( l->sl_UGM, ug );
						
						if( error == 0 )
						{
							SQLLibrary *sqlLib = l->LibrarySQLGet( l );
							int val = 0;
							if( sqlLib != NULL )
							{
								if( ugFromDatabase == TRUE )
								{
									int val = sqlLib->Update( sqlLib, UserGroupDesc, ug );
								}
								else
								{
									int val = sqlLib->Save( sqlLib, UserGroupDesc, ug );
								}
								
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
	* @param id - (required) id of UserGroup which you want to delete
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
				UserGroup *fg = UGMGetGroupByID( l->sl_UGM, id );
				
				// group not found in memory, checking DB
				if( fg == NULL )
				{
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						char where[ 512 ];
						int size = snprintf( where, sizeof(where), "ID='%lu'", id );
						int entries;
					
						fg = sqllib->Load( sqllib, UserGroupDesc, where, &entries );

						l->LibrarySQLDrop( l, sqllib );
					}
				}
				
				if( fg != NULL )
				{
					SQLLibrary *sqllib  = l->LibrarySQLGet( l );
					if( sqllib != NULL )
					{
						fg->ug_Status = USER_GROUP_STATUS_DISABLED;
						sqllib->Update( sqllib, UserGroupDesc, fg );
						
						HttpAddTextContent( response, "ok<!--separate-->{ \"Result\": \"success\"}" );

						l->LibrarySQLDrop( l, sqllib );
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_SQL_LIBRARY_NOT_FOUND] , DICT_SQL_LIBRARY_NOT_FOUND );
						HttpAddTextContent( response, buffer );
					}
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
	* <HR><H2>system.library/group/update</H2>Update group. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) ID of group
	* @param groupname - (required) group name
	* @param type - type name
	* @param parentid - id of parent workgroup
	* @param status - group status
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
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
		FBOOL fParentID = FALSE;
		FULONG groupID = 0;
		int status = -1;
		
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
			
			el = HttpGetPOSTParameter( request, "id" );
			if( el != NULL )
			{
				char *end;
				groupID = strtol( (char *)el->data, &end, 0 );
			}
			
			el = HttpGetPOSTParameter( request, "parentid" );
			if( el != NULL )
			{
				char *end;
				parentID = strtol( (char *)el->data, &end, 0 );
				fParentID = TRUE;
			}
			
			el = HttpGetPOSTParameter( request, "status" );
			if( el != NULL )
			{
				status = atoi( (char *)el->data );
			}
			
			if( groupID > 0 )
			{
				// get information from DB if group already exist
				
				UserGroup *fg = UGMGetGroupByID( l->sl_UGM, groupID );
				DEBUG("GroupUpdate: pointer to group from memory: %p\n", fg );
				
				if( fg != NULL )	// group already exist, there is no need to create double
				{
					if( status >= 0 )
					{
						fg->ug_Status = status;
					}
					
					if( fParentID == TRUE )
					{
						fg->ug_ParentID = parentID;
					}
					
					if( groupname != NULL )
					{
						FFree( fg->ug_Name );
						fg->ug_Name = StringDuplicate( groupname );
					}
					
					fg->ug_UserID = loggedSession->us_UserID;
					
					SQLLibrary *sqlLib = l->LibrarySQLGet( l );
					int val = 0;
					if( sqlLib != NULL )
					{
						int val = sqlLib->Update( sqlLib, UserGroupDesc, fg );

						l->LibrarySQLDrop( l, sqlLib );
					}

					char buffer[ 256 ];
					snprintf( buffer, sizeof(buffer), "ok<!--separate-->{ \"response\": \"sucess\",\"id\":%lu }", fg->ug_ID );
					HttpAddTextContent( response, buffer );
				}
				else	// group do not exist in memory
				{
				
					char buffer[ 256 ];
					char buffer1[ 256 ];
					snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "UGMUserGroupUpdate", 1 );
					snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_FUNCTION_RETURNED );
					HttpAddTextContent( response, buffer );
				}
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
	
	return response;
}
