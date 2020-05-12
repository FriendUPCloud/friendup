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
#include <system/user/user_manager_web.h>
#include <system/systembase.h>
#include <system/fsys/device_handling.h>
#include <system/user/user_sessionmanager.h>
#include <util/session_id.h>
#include <util/element_list.h>

//test
#undef __DEBUG

//
// structure which says if user is assigned to group or not
//

typedef struct UsrGrEntry
{
	FULONG uid;		// userID
	FULONG ugid;	// userGroupID, if == 0 then its not assigned
	MinNode node;	// 
}UsrGrEntry;

/**
 * Generate json table with Users assigned to group
 *
 * @param l pointer to SystemBase
 * @param groupID ID of group
 * @param retString BufString to which results will be stored
 * @param extServiceString pointer to BufString where results to external service will be stored
 * @return 0 when success, otherwise error number
 */
int generateConnectedUsers( SystemBase *l, FULONG groupID, BufString *retString, BufString *extServiceString )
{
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 712 ];
		char tmp[ 712 ];
		int itmp = 0;
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.UniqueID,u.Status,u.ID,u.ModifyTime FROM FUserToGroup ug inner join FUser u on ug.UserID=u.ID WHERE ug.UserGroupID=%lu", groupID );
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int pos = 0;
			int spos = 0;
			char **row;
			
			if( extServiceString != NULL )
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					FBOOL isDisabled = FALSE;
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						isDisabled = TRUE;
					}
					
					if( retString != NULL )
					{
						if( isDisabled )
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						else
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						BufStringAddSize( retString, tmp, itmp );	// send response to caller HTTP/WS
					}
					
					// if Status == disabled
					if( isDisabled )
					{
						/*
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"userid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						*/
					}
					else
					{
						if( spos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"userid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"userid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						BufStringAddSize( extServiceString, tmp, itmp ); // external service do not need information about ID, it needs UUID which is stored in userid
						spos++;
					}					
					pos++;
				}
			}
			else if( retString != NULL )// if message should be send only to HTTP/WS
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					// if Status == disabled
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					else
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					BufStringAddSize( retString, tmp, itmp );
					pos++;
				}
			}
			
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return 0;
}

/**
 * Generate json table with userid's
 *
 * @param l pointer to SystemBase
 * @param groupID ID of group
 * @param retString BufString to which results will be stored
 * @param extServiceString pointer to BufString where results to external service will be stored
 * @return 0 when success, otherwise error number
 */
int generateConnectedUsersID( SystemBase *l, FULONG groupID, BufString *retString, BufString *extServiceString )
{
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 712 ];
		char tmp[ 712 ];
		int itmp = 0;
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.UniqueID,u.Status,u.ID,u.ModifyTime FROM FUserToGroup ug inner join FUser u on ug.UserID=u.ID WHERE ug.UserGroupID=%lu", groupID );
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int pos = 0;
			int spos = 0;
			char **row;
			
			if( extServiceString != NULL )
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					FBOOL isDisabled = FALSE;
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						isDisabled = TRUE;
					}
					
					if( retString != NULL )
					{
						if( isDisabled )
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						else
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						BufStringAddSize( retString, tmp, itmp );	// send response to caller HTTP/WS
					}
					
					if( isDisabled == FALSE )
					{
						// add response to external service
						if( spos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "\"%s\"", (char *)row[ 0 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",\"%s\"", (char *)row[ 0 ] );
						}
					
						BufStringAddSize( extServiceString, tmp, itmp ); // external service do not need information about ID, it needs UUID which is stored in userid
						spos++;
					}
					pos++;
				}
			}
			else if( retString != NULL )// if message should be send only to HTTP/WS
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					// if Status == disabled
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					else
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					BufStringAddSize( retString, tmp, itmp );
					pos++;
				}
			}
			
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return 0;
}

/**
 * Generate json table with userid's
 *
 * @param l pointer to SystemBase
 * @param groupID ID of group
 * @param retString BufString to which results will be stored
 * @param extServiceString pointer to BufString where results to external service will be stored
 * @param userIDs user id's
 * @return 0 when success, otherwise error number
 */
int generateConnectedUsersIDByID( SystemBase *l, FULONG groupID, BufString *retString, BufString *extServiceString, char *userIDs )
{
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		int tmpQuerySize = 712;
		char *tmpQuery;
		char tmp[ 712 ];
		int itmp = 0;
		
		if( userIDs != NULL )
		{
			tmpQuerySize += strlen( userIDs );
		}
		
		tmpQuery = FMalloc( tmpQuerySize );
		
		if( groupID == 0 )	// we want only users
		{
			snprintf( tmpQuery, tmpQuerySize, "SELECT UniqueID,Status,ID,ModifyTime FROM FUser WHERE ID in(%s)", userIDs );
		}
		else
		{
			snprintf( tmpQuery, tmpQuerySize, "SELECT u.UniqueID,u.Status,u.ID,u.ModifyTime FROM FUserToGroup ug inner join FUser u on ug.UserID=u.ID WHERE ug.UserGroupID=%lu and u.ID in(%s)", groupID, userIDs );
		}
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int pos = 0;
			int spos = 0;
			char **row;
			
			if( extServiceString != NULL )
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					FBOOL isDisabled = FALSE;
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						isDisabled = TRUE;
					}
					
					if( retString != NULL )
					{
						if( isDisabled )
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						else
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
							}
						}
						BufStringAddSize( retString, tmp, itmp );	// send response to caller HTTP/WS
					}
					
					if( isDisabled == FALSE )
					{
						// add response to external service
						if( spos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "\"%s\"", (char *)row[ 0 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",\"%s\"", (char *)row[ 0 ] );
						}
					
						BufStringAddSize( extServiceString, tmp, itmp ); // external service do not need information about ID, it needs UUID which is stored in userid
						spos++;
					}
					pos++;
				}
			}
			else if( retString != NULL )// if message should be send only to HTTP/WS
			{
				while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
				{
					// if Status == disabled
					if( strncmp( (char *)row[ 1 ], "1", 1 ) == 0 )
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"isdisabled\":true,\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					else
					{
						if( pos == 0 )
						{
							itmp = snprintf( tmp, sizeof(tmp), "{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
						else
						{
							itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":\"%s\",\"uuid\":\"%s\",\"lastupdate\":%s}", (char *)row[ 2 ], (char *)row[ 0 ], (char *)row[ 3 ] );
						}
					}
					BufStringAddSize( retString, tmp, itmp );
					pos++;
				}
			}
			
			sqlLib->FreeResult( sqlLib, result );
		}
		
		FFree( tmpQuery );
		l->LibrarySQLDrop( l, sqlLib );
	}
	return 0;
}

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
	
	DEBUG("[UMGWebRequest] -> command : %s\n", urlpath[ 1 ] );
	
	if( urlpath[ 1 ] == NULL )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
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
	* @param type - type of group. If parameter will miss default Workgroup name will be used.
	* @param parentid - id of parent workgroup
	* @param users - id's of users which will be assigned to group
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
		char *users = NULL;
		FULONG parentID = 0;
		FULONG groupID = 0;
		
		DEBUG( "[UMWebRequest] Create user!!\n" );
		
		HashmapElement *el = NULL;
		
		char *authid = NULL;
		char *args = NULL;
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
			//args = UrlDecodeToMem( el->hme_Data );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{	// user cannot create any groups without permissions
			el = HttpGetPOSTParameter( request, "groupname" );
			if( el != NULL )
			{
				groupname = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMGWebRequest] Update groupname %s!!\n", groupname );
			}
			
			el = HttpGetPOSTParameter( request, "type" );
			if( el != NULL )
			{
				type = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] Update type %s!!\n", type );
			}
			else
			{
				type = StringDuplicate( "Workgroup" );
			}
			
			el = HttpGetPOSTParameter( request, "parentid" );
			if( el != NULL && el->hme_Data != NULL && strlen( el->hme_Data ) > 0 )
			{
				char *end;
				parentID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			el = HttpGetPOSTParameter( request, "users" );
			if( el != NULL )
			{
				users = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] create group, users %s!!\n", users );
			}
			
			if( groupname != NULL && type != NULL )
			{
				FBOOL addUsers = FALSE;
				// get information from DB if group already exist
				UserGroup *ug = NULL;
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
						
						{
							char msg[ 512 ];
							snprintf( msg, sizeof(msg), "{\"id\":%lu,\"name\":\"%s\"}", fg->ug_ID, fg->ug_Name );
							//NotificationManagerSendInformationToConnections( l->sl_NotificationManager, NULL, msg );
							NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "create", msg );
						}
						ug = fg;
						addUsers = TRUE;
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
						if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
						{
							ug = UserGroupNew( 0, groupname, 0, type );
						}
						else
						{
							ug = UserGroupNew( 0, groupname, loggedSession->us_User->u_ID, type );
						}
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
									val = sqlLib->Update( sqlLib, UserGroupDesc, ug );
								}
								else
								{
									val = sqlLib->Save( sqlLib, UserGroupDesc, ug );
								}
								
								l->LibrarySQLDrop( l, sqlLib );
							}
							groupID = ug->ug_ID;
							
							addUsers = TRUE;

							{
								char msg[ 512 ];
								snprintf( msg, sizeof(msg), "{\"id\":%lu,\"name\":\"%s\",\"parentid\":%lu}", ug->ug_ID, ug->ug_Name, ug->ug_ParentID );
								//NotificationManagerSendInformationToConnections( l->sl_NotificationManager, NULL, msg );
								NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "create", msg );
							}
					
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
				
				// group was created, its time to add users to it
				
				if( addUsers == TRUE && users != NULL )
				{
					// go through all elements and find proper users
					
					IntListEl *el = ILEParseString( users );
					
					DEBUG("Assigning users to group\n");
					
					while( el != NULL )
					{
						IntListEl *rmEntry = el;
						
						el = (IntListEl *)el->node.mln_Succ;
						
						User *usr = UMGetUserByID( l->sl_UM, (FULONG)rmEntry->i_Data );
						if( usr != NULL )
						{
							UserGroupAddUser( ug, usr );
						}
						FBOOL exist = UGMUserToGroupISConnectedByUIDDB( l->sl_UGM, groupID, rmEntry->i_Data );
						if( exist == FALSE )
						{
							UGMAddUserToGroupDB( l->sl_UGM, groupID, rmEntry->i_Data );
						}
						
						FFree( rmEntry );
					}
					
					{
						char tmp[256];
						int itmp;
						BufString *retString = BufStringNew();
						itmp = snprintf( tmp, sizeof(tmp), "{\"groupid\":%lu,\"parentid\":%lu,\"userids\":[", groupID, parentID );
						BufStringAddSize( retString, tmp, itmp );
						// return user objects
						//generateConnectedUsers( l, groupID, NULL, retString );
						generateConnectedUsersID( l, groupID, NULL, retString );
						BufStringAddSize( retString, "]}", 2 );
						
						NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "setusers", retString->bs_Buffer );
						BufStringDelete( retString );
					}
				}
			} // missing parameters
			else
			{
				char buffer[ 256 ];
				char buffer1[ 256 ];
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "groupname, type" );
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
		
		if( groupname != NULL )
		{
			FFree( groupname );
		}
		if( type != NULL )
		{
			FFree( type );
		}
		if( users != NULL )
		{
			FFree( users );
		}
		//if( args != NULL )
		//{
		//	FFree( args );
		//}

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
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		FULONG id = 0;
		
		DEBUG( "[UMWebRequest] Delete group!!\n" );
		
		HashmapElement *el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *next;
			id = strtol ( (char *)el->hme_Data, &next, 0 );
		}
		
		if( id > 0 )
		{
			char *authid = NULL;
			char *args = NULL;
			el = HttpGetPOSTParameter( request, "authid" );
			if( el != NULL )
			{
				authid = el->hme_Data;
			}
			el = HttpGetPOSTParameter( request, "args" );
			if( el != NULL )
			{
				args = el->hme_Data;
				//args = UrlDecodeToMem( el->hme_Data );
			}
				
			if( loggedSession->us_User->u_IsAdmin == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
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
			
				DEBUG("Group found\n");
				if( fg != NULL )
				{
					FBOOL canChange = FALSE;
					if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
					{
						canChange = TRUE;
					}
					else
					{
						if( fg->ug_UserID == loggedSession->us_UserID )
						{
							canChange = TRUE;
						}
					}
				
					DEBUG("Can change: %d\n", canChange );
					if( canChange == TRUE )
					{
						if( strcmp( fg->ug_Type, "Level" ) != 0 )	//you can only remove entries which dont have "Level" type
						{
							SQLLibrary *sqllib  = l->LibrarySQLGet( l );
							if( sqllib != NULL )
							{
								//fg->ug_Status = USER_GROUP_STATUS_DISABLED;
								//sqllib->Update( sqllib, UserGroupDesc, fg );

								char msg[ 512 ];
								snprintf( msg, sizeof(msg), "{\"id\":%lu,\"name\":\"%s\"}", fg->ug_ID, fg->ug_Name );
								UGMRemoveGroup( l->sl_UGM, fg );
								//NotificationManagerSendInformationToConnections( l->sl_NotificationManager, NULL, msg );
								NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "delete", msg );
						
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
						else
						{
							HttpAddTextContent( response, "fail<!--separate-->{ \"response\": \"Cannot remove group with 'Level' type\", \"code\":\"1\" }" );
						}
					}
					else
					{
						char buffer[ 256 ];
						snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
						HttpAddTextContent( response, buffer );
					}
				}
			}
			else
			{
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
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
	* @param users - users which will be assigned to group. Remember! old users will be removed from group!
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "update" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *groupname = NULL;
		char *type = NULL;
		char *users = NULL;
		char *usersSQL = NULL;
		FULONG parentID = 0;
		FBOOL fParentID = FALSE;
		FULONG groupID = 0;
		int status = -1;
		
		DEBUG( "[UMGWebRequest] Update group!\n" );
		
		HashmapElement *el = NULL;
		
		char *authid = NULL;
		char *args = NULL;
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
			//args = UrlDecodeToMem( el->hme_Data );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			el = HttpGetPOSTParameter( request, "groupname" );
			if( el != NULL )
			{
				groupname = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[Group/Update] Update groupname %s!!\n", groupname );
			}
			
			el = HttpGetPOSTParameter( request, "type" );
			if( el != NULL )
			{
				type = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[Group/Update] Update type %s!!\n", type );
			}
			
			el = HttpGetPOSTParameter( request, "id" );
			if( el != NULL )
			{
				char *end;
				groupID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			
			el = HttpGetPOSTParameter( request, "parentid" );
			if( el != NULL )
			{
				char *end;
				parentID = strtol( (char *)el->hme_Data, &end, 0 );
				fParentID = TRUE;
			}
			
			el = HttpGetPOSTParameter( request, "status" );
			if( el != NULL )
			{
				status = atoi( (char *)el->hme_Data );
			}
			
			el = HttpGetPOSTParameter( request, "users" );
			if( el != NULL )
			{
				users = UrlDecodeToMem( (char *)el->hme_Data );
				usersSQL = StringDuplicate( users );
				DEBUG( "[Group/Update] update group, users %s!!\n", users );
			}
			
			if( groupID > 0 )
			{
				// get information from DB if group already exist
				
				UserGroup *fg = UGMGetGroupByID( l->sl_UGM, groupID );
				DEBUG("[Group/Update] pointer to group from memory: %p\n", fg );
				
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
					
					if( type != NULL )
					{
						FFree( fg->ug_Type );
						fg->ug_Type = StringDuplicate( type );
					}
					
					fg->ug_UserID = loggedSession->us_UserID;
					
					SQLLibrary *sqlLib = l->LibrarySQLGet( l );

					if( sqlLib != NULL )
					{
						sqlLib->Update( sqlLib, UserGroupDesc, fg );

						l->LibrarySQLDrop( l, sqlLib );
					}
					
					char msg[ 512 ];
					snprintf( msg, sizeof(msg), "{\"id\":%lu,\"name\":\"%s\",\"type\":\"%s\",\"parentid\":%lu}", fg->ug_ID, fg->ug_Name, fg->ug_Type, fg->ug_ParentID );
					NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "update", msg );
					
					// if users parameter is passed then we must remove current users from group
					if( users != NULL )
					{
						UsrGrEntry *diffListRoot = NULL;
						// removeing users
						
						SQLLibrary *sqlLib = l->LibrarySQLGet( l );
						if( sqlLib != NULL )
						{
							int userslen = strlen( users );
							int querySize = 512 + (2*userslen);
							char *tmpQuery = FMalloc( querySize );
							// get difference between lists
							// DB   1,2,3,4   ARG  2,3,5   DIFFERENCE  1,4,5
							// if row[1] == NULL then user is not table, must be added
							// if != NULL then user is assigned and must be removed
//							snprintf( tmpQuery, sizeof(tmpQuery), "
//select u.ID, utg.UserGroupID from FUser u 
//left outer join FUserToGroup utg on u.ID=utg.UserID and utg.UserGroupID=%lu 
//where u.ID in (%s)", groupID, users );

snprintf( tmpQuery, querySize, "select u.ID, utg.UserGroupID from FUser u \
left outer join FUserToGroup utg on u.ID=utg.UserID and utg.UserGroupID=%lu \
where u.ID in (SELECT ID FROM FUser WHERE ID NOT IN (select UserID from FUserToGroup where UserGroupID=%lu Group by UserID) AND ID in (%s) UNION SELECT UserID FROM FUserToGroup WHERE UserID NOT IN (SELECT ID FROM FUser where ID in (%s)) AND UserGroupID=%lu Group by UserID)", groupID, groupID, users, users, groupID );

							void *result = sqlLib->Query(  sqlLib, tmpQuery );
							if( result != NULL )
							{
								char **row;
								while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
								{
									UsrGrEntry *nentry = FCalloc( 1, sizeof(UsrGrEntry) );
									char *end;
									// assign user id
									nentry->uid = strtol( (char *)row[0], &end, 0 );
									if( row[ 1 ] != NULL )	// assign user group id
									{
										nentry->ugid = strtol( (char *)row[1], &end, 0 );
									}
									
									if( diffListRoot  == NULL )
									{
										diffListRoot = nentry;
									}
									else
									{
										nentry->node.mln_Succ = (MinNode *)diffListRoot;
										diffListRoot = nentry;
									}
									DEBUG("[Group/Update] diff user id %s users in arg %s\n", row[0], users );
								}
								sqlLib->FreeResult( sqlLib, result );
							}
							
							l->LibrarySQLDrop( l, sqlLib );
							FFree( tmpQuery );
						}
						
						// group was created, its time to add users to it
						// go through all elements and find proper users
						// this part is called when user is assigned to at least one group
					
						if( strcmp( users, "false" ) == 0 )
						{
							char tmpQuery[ 512 ];
							DEBUG("List is empty\n");
							
							DEBUG("Remove users from group\n");
							
							snprintf( tmpQuery, sizeof(tmpQuery), "SELECT UserID FROM FUserToGroup WHERE UserGroupID=%lu", groupID );
							result = sqlLib->Query(  sqlLib, tmpQuery );
							if( result != NULL )
							{
								int pos = 0;
								char **row;
								while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
								{
									char *end;
									FULONG userid = strtol( (char *)row[0], &end, 0 );
									// add only this users which are in FC memory now, rest will be removed in SQL call
									User *usr = UMGetUserByID( l->sl_UM, userid );
									if( usr != NULL )
									{
										UserGroupRemoveUser( fg, usr );
									}
							
									pos++;
								}
								sqlLib->FreeResult( sqlLib, result );
							}
							
							// remove connections between users and group
							snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserToGroup WHERE UserGroupID=%lu", groupID );
							sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );

						} // users == false (remove all users)
						else
						{
							DEBUG("[Group/Update] going through diff list\n");
							// going through diff list and add or remove user from group
							UsrGrEntry *el = diffListRoot;
							while( el != NULL )
							{
								UsrGrEntry *remel = el;
								
								// update database

								if( el->ugid == 0 ) // user is not in group we must add him
								{
									UGMAddUserToGroupDB( l->sl_UGM, groupID, el->uid );
								}
								// user is in group, we can remove him
								else
								{
									UGMRemoveUserFromGroupDB( l->sl_UGM, groupID, el->uid );
								}
							
								User *usr = UMGetUserByID( l->sl_UM, (FULONG)el->uid );
								// do realtime update only to users which are in memory
								if( usr != NULL )
								{
									DEBUG("[Group/Update] User found %s is in group %lu\n", usr->u_Name, el->ugid );
									
									if( el->ugid == 0 ) // user is not in group we must add him
									{
										UserGroupAddUser( fg, usr );
										UserGroupMountWorkgroupDrives( l->sl_DeviceManager, usr, groupID );
										
										UserNotifyFSEvent2( l->sl_DeviceManager, usr, "refresh", "Mountlist:" );
									}
									// user is in group, we can remove him
									else
									{
										int error = 0;
										// wait till drive is removed/detached
										
										File *remDrive = UserRemDeviceByGroupID( usr, groupID, &error );
										
										UserGroupRemoveUser( fg, usr );
									}
								}
								
								if( usr != NULL )
								{
									// if device was detached from not current user
									//if( usr != loggedSession->us_User )

									UserNotifyFSEvent2( l->sl_DeviceManager, usr, "refresh", "Mountlist:" );
								}
								
								el = (UsrGrEntry *)el->node.mln_Succ;
							
								FFree( remel );	// remove entry from list
							}
						}
					}	// users != NULL
					
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
		
		//if( args != NULL )
		//{
		//	FFree( args );
		//}
		if( groupname != NULL )
		{
			FFree( groupname );
		}
		if( type != NULL )
		{
			FFree( type );
		}
		if( users != NULL )
		{
			FFree( users );
		}
		if( usersSQL != NULL )
		{
			FFree( usersSQL );
		}

		*result = 200;
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/list</H2>List groups.
	*
	* @param sessionid - (required) session id of logged user
	* @param parentid - id of parent workgroup
	* @param status - group status
	* @param type - group type. If parameter will miss default Workgroup name will be used.
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "list" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		int status = -1;
		FULONG parentID = 0;
		FBOOL fParentID = FALSE;
		char *type = NULL;
		HashmapElement *el = NULL;
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		el = HttpGetPOSTParameter( request, "parentid" );
		if( el != NULL )
		{
			char *end;
			parentID = strtol( (char *)el->hme_Data, &end, 0 );
			fParentID = TRUE;
		}
		
		el = HttpGetPOSTParameter( request, "status" );
		if( el != NULL )
		{
			status = atoi( (char *)el->hme_Data );
		}
		
		el = HttpGetPOSTParameter( request, "type" );
		if( el != NULL )
		{
			type = UrlDecodeToMem( (char *)el->hme_Data );
			DEBUG( "type %s!!\n", type );
		}
		else
		{
			type = StringDuplicate( "Workgroup" );
		}
		
		if( loggedSession->us_User->u_IsAdmin == TRUE )
		{
			BufString *retString = BufStringNew();
			
			DEBUG("Group/list - send information to 3rd party services\n");
			
			BufStringAddSize( retString, "ok<!--separate-->{", 18 );
			BufStringAdd( retString, "\"groups\":[" );

			UGMGetGroups( l->sl_UGM, 0, retString, type, parentID, status, fParentID );
		
			BufStringAddSize( retString, "]}", 2 );
		
			HttpSetContent( response, retString->bs_Buffer, retString->bs_Size );
			retString->bs_Buffer = NULL;
			BufStringDelete( retString );
		}
		else
		{
			int len = 512;
			char *sessionid = loggedSession->us_SessionID;
			char *authid = NULL;
			char *args = NULL;

			el = HttpGetPOSTParameter( request, "authid" );
			if( el != NULL )
			{
				authid = el->hme_Data;
				len += strlen( authid );
			}
			el = HttpGetPOSTParameter( request, "args" );
			if( el != NULL )
			{
				args = el->hme_Data;
				//args = UrlDecodeToMem( el->hme_Data );
				len += strlen( args );
			}
			
			if( sessionid != NULL )
			{
				len += strlen( sessionid );
			}

			char *command = FMalloc( len );
			if( command != NULL )
			{
				//module=system&command=checkapppermission&key=%key%&appname=%appname%
			
				snprintf( command, len, "command=permissions&sessionid=%s&authid=%s&args=%s", sessionid, authid, args ); 
			 
				DEBUG("Run command via php: '%s'\n", command );
				FULONG dataLength;

				char *data = l->sl_PHPModule->Run( l->sl_PHPModule, "modules/system/module.php", command, &dataLength );
				if( data != NULL )
				{
					HttpSetContent( response, data, dataLength );
				}
				FFree( command );
			}

			//if( args != NULL )
			//{
			//	FFree( args );
			//}
		}

		if( type != NULL )
		{
			FFree( type );
		}
		
		*result = 200;
	}
		/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/listdetails</H2>List groups and users inside. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - id of parent workgroup
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "listdetails" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		FULONG groupID = 0;
		int len = 512;
		char *sessionid = loggedSession->us_SessionID;
		char *authid = NULL;
		char *args = NULL;
		HashmapElement *el = NULL;
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		el = HttpGetPOSTParameter( request, "id" );
		if( el != NULL )
		{
			char *end;
			groupID = strtol( (char *)el->hme_Data, &end, 0 );
		}
		
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
			len += strlen( authid );
		}
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
			//args = UrlDecodeToMem( el->hme_Data );
			len += strlen( args );
		}
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			char tmp[ 512 ];
			int tmpsize = 0;
			BufString *retString = BufStringNew();
			BufStringAddSize( retString, "ok<!--separate-->{", 18 );
			UserGroup *ug = UGMGetGroupByID( l->sl_UGM, groupID );
			if( ug != NULL )
			{
				tmpsize = snprintf( tmp, sizeof(tmp), "\"groupid\":%lu,\"userid\":%lu,\"name\":\"%s\",\"parentid\":%lu,\"type\":\"%s\",\"status\":%d,\"users\":[", groupID, ug->ug_UserID, ug->ug_Name, ug->ug_ParentID, ug->ug_Type, ug->ug_Status );
			}
			else
			{
				tmpsize = snprintf( tmp, sizeof(tmp), "\"groupid\":%lu,\"users\":[", groupID );
			}
			BufStringAddSize( retString, tmp, tmpsize );
		
			if( groupID > 0 )	// we want list of users which belongs to one group
			{
				// get required information for external servers
			
				SQLLibrary *sqlLib = l->LibrarySQLGet( l );
				if( sqlLib != NULL )
				{
					char tmpQuery[ 768 ];
					snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.ID,u.UniqueID,u.Name,u.FullName FROM FUserToGroup ug inner join FUser u on ug.UserID=u.ID WHERE ug.UserGroupID=%lu group by ug.UserID", groupID );
					void *result = sqlLib->Query(  sqlLib, tmpQuery );
					if( result != NULL )
					{
						int itmp;
						int pos = 0;
						char **row;
						while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
						{
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"id\":%s,\"uuid\":\"%s\",\"name\":\"%s\",\"fullname\":\"%s\"}", (char *)row[0], (char *)row[ 1 ], (char *)row[ 2 ], (char *)row[ 3 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"id\":%s,\"uuid\":\"%s\",\"name\":\"%s\",\"fullname\":\"%s\"}", (char *)row[0], (char *)row[ 1 ], (char *)row[ 2 ], (char *)row[ 3 ] );
							}
							BufStringAddSize( retString, tmp, itmp );
							pos++;
						}
						
						sqlLib->FreeResult( sqlLib, result );
					}

					l->LibrarySQLDrop( l, sqlLib );
				}
			}

			BufStringAddSize( retString, "]}", 2 );
		
			HttpSetContent( response, retString->bs_Buffer, retString->bs_Size );
			
			//NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "listdetails", &(retString->bs_Buffer[17]) );
			
			retString->bs_Buffer = NULL;
			BufStringDelete( retString );
		}
		else	// if user is not admin, get user groups by permission module call
		{
			FBOOL respSet = FALSE;
			if( sessionid != NULL )
			{
				len += strlen( sessionid );
			}

			char *command = FMalloc( len );
			if( command != NULL )
			{
				//module=system&command=checkapppermission&key=%key%&appname=%appname%
			
				snprintf( command, len, "command=permissions&sessionid=%s&authid=%s&args=%s", sessionid, authid, args ); 
			 
				DEBUG("Run command via php: '%s'\n", command );
				FULONG dataLength;

				char *data = l->sl_PHPModule->Run( l->sl_PHPModule, "modules/system/module.php", command, &dataLength );
				if( data != NULL )
				{
					/*
					if( strncmp( data, "ok", 2 ) == 0 )
					{
					}
					*/
					respSet = TRUE;
					HttpSetContent( response, data, dataLength );
				}
				FFree( command );
			}
			
			// if response was not set then its sign that user do not have permission to groups
			if( respSet == FALSE )
			{
				char buffer[ 256 ];
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_ADMIN_RIGHT_REQUIRED] , DICT_ADMIN_RIGHT_REQUIRED );
				HttpAddTextContent( response, buffer );
			}
		}
		
		//if( args != NULL )
		//{
		//	FFree( args );
		//}
		
		*result = 200;
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/addusers</H2>Add users to group. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of workgroup to which user will belong
	* @param users - (required) user id's which will be assigned to group
	* @param authid - application authid
	* @param args - additional parameters
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "addusers" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		FULONG groupID = 0;
		char *users = NULL;
		char *usersSQL = NULL;
		char *args = NULL;
		char *authid = NULL;
		HashmapElement *el = NULL;
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
		}
		
		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			el = HttpGetPOSTParameter( request, "users" );
			if( el != NULL )
			{
				users = UrlDecodeToMem( (char *)el->hme_Data );
				usersSQL = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] addusers users %s!!\n", users );
			}
		
			el = HttpGetPOSTParameter( request, "id" );
			if( el != NULL )
			{
				char *end;
				groupID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			// get from database users by using select ID,UUID from FUser where ID in()
			
			BufString *retString = BufStringNew();
			BufString *retServiceString = BufStringNew();
			BufStringAddSize( retString, "ok<!--separate-->{", 18 );
			BufStringAddSize( retServiceString, "{", 1 );
			
			if( groupID > 0 )
			{
				UserGroup *ug = NULL;
				char tmp[ 512 ];
				int itmp = 0;
				ug = UGMGetGroupByID( l->sl_UGM, groupID );
				
				itmp = snprintf( tmp, sizeof(tmp), "\"groupid\":%lu,\"userids\":[", groupID );
				BufStringAddSize( retString, tmp, itmp );
				
				BufStringAddSize( retServiceString, tmp, itmp );
				
				if( ug != NULL )
				{
					// go through all elements and find proper users
					
					IntListEl *el = ILEParseString( users );
					
					DEBUG("String parsed\n");
					
					while( el != NULL )
					{
						IntListEl *rmEntry = el;
						
						el = (IntListEl *)el->node.mln_Succ;
						
						FBOOL isInGroup = FALSE;
						FBOOL isInMemory = FALSE;
						// get user from memory first
						User *usr = UMGetUserByID( l->sl_UM, (FULONG)rmEntry->i_Data );
						DEBUG("Got user from FC memory, pointer: %p\n", usr );
						if( usr != NULL )
						{
							if( UserGroupAddUser( ug, usr ) == 1 )	// 1 - user is in group, no need to add him twice
							{
								isInGroup = TRUE;
							}
							isInMemory = TRUE;
						}
						// just to be sure that stuff is deleted
						//else
						{
							DEBUG("Getting entry from DB\n");
							// there is need to check and update DB
							//FBOOL exist = UGMUserToGroupISConnectedDB( l->sl_UGM, groupID, User *u );
							FBOOL exist = UGMUserToGroupISConnectedByUIDDB( l->sl_UGM, groupID, rmEntry->i_Data );
							if( exist == FALSE )
							{
								UGMAddUserToGroupDB( l->sl_UGM, groupID, rmEntry->i_Data );
							}
						}
						
						// if user is in memory we must mount group drives for him + send notification
						if( isInMemory == TRUE )
						{
							SQLLibrary *sqlLib = l->LibrarySQLGet( l );
							if( sqlLib != NULL )
							{
								char *errorStr = NULL;

								UserGroupMountWorkgroupDrives( l->sl_DeviceManager, usr, groupID );
								
								if( UserGroupDeviceMount( l->sl_DeviceManager, sqlLib, ug, usr, &errorStr ) != 0 )
								{
									//INFO( "[MountFS] -- Could not mount device for user %s. Drive was %s.\n", tmpUser->u_Name ? tmpUser->u_Name : "--nousername--", name ? name : "--noname--" );
								}

								// Tell user!
								UserNotifyFSEvent2( l->sl_DeviceManager, usr, "refresh", "Mountlist:" );

								l->LibrarySQLDrop( l, sqlLib );
							}
						}
						FFree( rmEntry );
					} // while ugroups
				} // ug != NULL
				
				// get required information for external servers
			
				generateConnectedUsersIDByID( l, groupID, retString, retServiceString, usersSQL );
				
				BufStringAddSize( retString, "]", 1 );
				BufStringAddSize( retServiceString, "]", 1 );
			} // groupID > 0
			
			BufStringAddSize( retString, "}", 1 );
			BufStringAddSize( retServiceString, "}", 1 );
			
			// send notification to external service
			NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "addusers", retServiceString->bs_Buffer );
		
			HttpSetContent( response, retString->bs_Buffer, retString->bs_Size );
			retString->bs_Buffer = NULL;
			BufStringDelete( retString );
			BufStringDelete( retServiceString );
		
			if( users != NULL )
			{
				FFree( users );
			}
			if( usersSQL != NULL )
			{
				FFree( usersSQL );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
		*result = 200;
	}
		/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/removeusers</H2>Remove users from group. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) id of workgroup from which users will be removed
	* @param users - (required) user id's which will be removed from group
	* @param authid - application authid
	* @param args - additional parameters
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "removeusers" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};

		FULONG groupID = 0;
		char *users = NULL;
		char *usersSQL = NULL;
		char *args = NULL;
		char *authid = NULL;
		HashmapElement *el = NULL;
		
		el = HttpGetPOSTParameter( request, "args" );
		if( el != NULL )
		{
			args = el->hme_Data;
		}

		el = HttpGetPOSTParameter( request, "authid" );
		if( el != NULL )
		{
			authid = el->hme_Data;
		}
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE || PermissionManagerCheckPermission( l->sl_PermissionManager, loggedSession->us_SessionID, authid, args ) )
		{
			el = HttpGetPOSTParameter( request, "users" );
			if( el != NULL )
			{
				users = UrlDecodeToMem( (char *)el->hme_Data );
				usersSQL = UrlDecodeToMem( (char *)el->hme_Data );
				DEBUG( "[UMWebRequest] removeusers users %s!!\n", users );
			}
		
			el = HttpGetPOSTParameter( request, "id" );
			if( el != NULL )
			{
				char *end;
				groupID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			
			BufString *retString = BufStringNew();
			BufStringAddSize( retString, "ok<!--separate-->{", 18 );
			
			BufString *retExtString = BufStringNew();
			BufStringAddSize( retExtString, "{", 1 );
			
			if( groupID > 0 )
			{
				char tmp[ 512 ];
				int itmp = 0;
				UserGroup *ug = NULL;
				ug = UGMGetGroupByID( l->sl_UGM, groupID );
				
				itmp = snprintf( tmp, sizeof(tmp), "\"groupid\":%lu,\"userids\":[", groupID );
				BufStringAddSize( retString, tmp, itmp );
				BufStringAddSize( retExtString, tmp, itmp );
				
				// get required information for external servers
			
				SQLLibrary *sqlLib = l->LibrarySQLGet( l );
				if( sqlLib != NULL )
				{
					char tmpQuery[ 512 ];
					snprintf( tmpQuery, sizeof(tmpQuery), "SELECT u.UniqueID,u.Status FROM FUserToGroup ug inner join FUser u on ug.UserID=u.ID WHERE ug.UserID in(%s) AND ug.UserGroupID=%lu", usersSQL, groupID );
					void *result = sqlLib->Query(  sqlLib, tmpQuery );
					if( result != NULL )
					{
						int pos = 0;
						char **row;
						while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
						{
							char *end;

							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "{\"userid\":\"%s\",\"status\":\"%s\"}", (char *)row[ 0 ], (char *)row[ 1 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",{\"userid\":\"%s\",\"status\":\"%s\"}", (char *)row[ 0 ], (char *)row[ 1 ] );
							}
							BufStringAddSize( retString, tmp, itmp );
							
							if( pos == 0 )
							{
								itmp = snprintf( tmp, sizeof(tmp), "\"%s\"", (char *)row[ 0 ] );
							}
							else
							{
								itmp = snprintf( tmp, sizeof(tmp), ",\"%s\"", (char *)row[ 0 ] );
							}
							BufStringAddSize( retExtString, tmp, itmp );
							
							pos++;
						}
						
						sqlLib->FreeResult( sqlLib, result );
					}

					l->LibrarySQLDrop( l, sqlLib );
				}
				
				//
				
				if( ug != NULL )
				{
					// go through all elements and find proper users
					
					IntListEl *el = ILEParseString( users );
					
					while( el != NULL )
					{
						IntListEl *rmEntry = el;
						
						el = (IntListEl *)el->node.mln_Succ;
						
						FBOOL isInGroup = FALSE;
						FBOOL isInMemory = FALSE;
						// get user from memory first
						User *usr = UMGetUserByID( l->sl_UM, (FULONG)rmEntry->i_Data );
						if( usr != NULL )
						{
							if( UserGroupRemoveUser( ug, usr ) == 0 )	// 1 - user is in group, no need to add him twice
							{
								isInGroup = TRUE;
							}
							isInMemory = TRUE;
						}
						//else // to be sure that entry is removed from DB
						{
							// there is need to check and update DB
							//FBOOL exist = UGMUserToGroupISConnectedDB( l->sl_UGM, groupID, User *u );
							FBOOL exist = UGMUserToGroupISConnectedByUIDDB( l->sl_UGM, groupID, rmEntry->i_Data );
							if( exist == TRUE )
							{
								UGMRemoveUserFromGroupDB( l->sl_UGM, groupID, rmEntry->i_Data );
							}
						}
						
						// remove drive from user from memory
						
						if( isInMemory == TRUE )
						{
							int error = 0;
							// wait till drive is removed/detached
							do
							{
								error = 0; // set error to 0 and check if OPS is in progress
								
								File *remDrive = UserRemDeviceByGroupID( usr, groupID, &error );
								if( remDrive != NULL )
								{
									FHandler *fsys = (FHandler *)remDrive->f_FSys;
									fsys->Release( fsys, remDrive );	// release drive data
								}
								usleep( 500 );
							}while( error == FSys_Error_OpsInProgress );
							
							// if device was detached from not current user
							//if( usr != loggedSession->us_User )
							{
								UserNotifyFSEvent2( l->sl_DeviceManager, usr, "refresh", "Mountlist:" );
							}
						}
						
						FFree( rmEntry );
					}
				}
				
				BufStringAddSize( retString, "]", 1 );
				BufStringAddSize( retExtString, "]", 1 );
			}
			
			BufStringAddSize( retString, "}", 1 );
			BufStringAddSize( retExtString, "}", 1 );
			
			// send notification to external service
			NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "removeusers", retExtString->bs_Buffer );
			BufStringDelete( retExtString );
		
			HttpSetContent( response, retString->bs_Buffer, retString->bs_Size );
			retString->bs_Buffer = NULL;
			BufStringDelete( retString );
		
			if( users != NULL )
			{
				FFree( users );
			}
			if( usersSQL != NULL )
			{
				FFree( usersSQL );
			}
		}
		else
		{
			char buffer[ 256 ];
			snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", l->sl_Dictionary->d_Msg[DICT_NO_PERMISSION] , DICT_NO_PERMISSION );
			HttpAddTextContent( response, buffer );
		}
		*result = 200;
	}
	/// @cond WEB_CALL_DOCUMENTATION
	/**
	*
	* <HR><H2>system.library/group/setusers</H2>Update group members. Function require admin rights.
	*
	* @param sessionid - (required) session id of logged user
	* @param id - (required) ID of group
	* @param users - (required) users which will be assigned to group. Remember! old users will be removed from group!
	* @return { "response": "sucess","id":<GROUP NUMBER> } when success, otherwise error with code
	*/
	/// @endcond
	
	else if( strcmp( urlpath[ 1 ], "setusers" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );

		char *users = NULL;
		char *usersSQL = NULL;
		FULONG groupID = 0;
		
		DEBUG( "[UMGWebRequest] setusers!\n" );
		
		HashmapElement *el = NULL;
		
		if( UMUserIsAdmin( l->sl_UM, request, loggedSession->us_User )  == TRUE )
		{
			el = HttpGetPOSTParameter( request, "id" );
			if( el != NULL )
			{
				char *end;
				groupID = strtol( (char *)el->hme_Data, &end, 0 );
			}
			
			el = HttpGetPOSTParameter( request, "users" );
			if( el != NULL )
			{
				users = UrlDecodeToMem( (char *)el->hme_Data );
				usersSQL = StringDuplicate( users );
				DEBUG( "[UMWebRequest] setusers group, users %s!!\n", users );
			}
			
			if( groupID > 0 && users != NULL )
			{
				// get information from DB if group already exist
				
				UserGroup *fg = UGMGetGroupByID( l->sl_UGM, groupID );
				DEBUG("GroupUpdate: pointer to group from memory: %p\n", fg );
				
				if( fg != NULL )	// group already exist, there is no need to create double
				{
					fg->ug_UserID = loggedSession->us_UserID;

					// if users parameter is passed then we must remove current users from group
					//if( users != NULL )
					{
						// removeing users
						
						SQLLibrary *sqlLib = l->LibrarySQLGet( l );
						if( sqlLib != NULL )
						{
							DEBUG("Remove users from group\n");
							char tmpQuery[ 512 ];
							snprintf( tmpQuery, sizeof(tmpQuery), "SELECT UserID FROM FUserToGroup WHERE UserGroupID=%lu", groupID );
							void *result = sqlLib->Query(  sqlLib, tmpQuery );
							if( result != NULL )
							{
								int pos = 0;
								char **row;
								while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
								{
									char *end;
									FULONG userid = strtol( (char *)row[0], &end, 0 );
									// add only this users which are in FC memory now, rest will be removed in SQL call
									User *usr = UMGetUserByID( l->sl_UM, userid );
									if( usr != NULL )
									{
										UserGroupRemoveUser( fg, usr );
									}
							
									pos++;
								}
								sqlLib->FreeResult( sqlLib, result );
							}
							
							// remove connections between users and group
							snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserToGroup WHERE UserGroupID=%lu", groupID );
							sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
							
							l->LibrarySQLDrop( l, sqlLib );
						}
						
						// group was created, its time to add users to it
				
						// go through all elements and find proper users
					
						IntListEl *el = ILEParseString( users );
					
						DEBUG("Assigning users to group\n");
					
						while( el != NULL )
						{
							IntListEl *rmEntry = el;
							el = (IntListEl *)el->node.mln_Succ;
						
							User *usr = UMGetUserByID( l->sl_UM, (FULONG)rmEntry->i_Data );
							if( usr != NULL )
							{
								UserGroupAddUser( fg, usr );
							}

							UGMAddUserToGroupDB( l->sl_UGM, groupID, rmEntry->i_Data );
							FFree( rmEntry );
						}
					}
					
					{
						int itmp = 0;
						char tmp[ 512 ];
						BufString *retString = BufStringNew();
						itmp = snprintf( tmp, sizeof(tmp), "{\"groupid\":%lu,\"parentid\":%lu,\"userids\":[", fg->ug_ID, fg->ug_ParentID );
						BufStringAddSize( retString, tmp, itmp );

						generateConnectedUsersIDByID( l, groupID, retString, retString, usersSQL );
						BufStringAddSize( retString, "]}", 2 );
						
						NotificationManagerSendEventToConnections( l->sl_NotificationManager, request, NULL, NULL, "service", "group", "setusers", retString->bs_Buffer );
						BufStringDelete( retString );
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
				snprintf( buffer1, sizeof(buffer1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "id, users" );
				snprintf( buffer, sizeof(buffer), "fail<!--separate-->{ \"response\": \"%s\", \"code\":\"%d\" }", buffer1 , DICT_PARAMETERS_MISSING );
				HttpAddTextContent( response, buffer );
			}
		}

		if( users != NULL )
		{
			FFree( users );
		}
		if( usersSQL != NULL )
		{
			FFree( usersSQL );
		}

		*result = 200;
	}
	
	return response;
}
