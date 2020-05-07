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
 *  User Group Manager
 *
 * file contain all functitons related to user group management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2019
 */

#include "user_group_manager.h"
#include <system/user/user_sessionmanager.h>

#include <system/systembase.h>
#include <util/sha256.h>
#include <system/fsys/device_handling.h>
#include <util/session_id.h>
#include <util/element_list.h>

/**
 * Create UserGroupManager
 *
 * @param sb pointer to SystemBase
 * @return UserGroupManager structure
 */
UserGroupManager *UGMNew( void *sb )
{
	UserGroupManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( UserGroupManager ) ) ) != NULL )
	{
		SystemBase *lsb = (SystemBase *)sb;
		sm->ugm_SB = sb;
		Log( FLOG_INFO,  "[SystemBase] Loading groups from DB\n");
	
		SQLLibrary *sqlLib = lsb->LibrarySQLGet( lsb );
		if( sqlLib != NULL )
		{
			int entries;
			sm->ugm_UserGroups = sqlLib->Load( sqlLib, UserGroupDesc, NULL, &entries );
			lsb->LibrarySQLDrop( lsb, sqlLib );
		}
		
		UserGroup *g = sm->ugm_UserGroups;
		while( g != NULL )
		{
			if( strcmp( g->ug_Name, "Admin" ) == 0 )
			{
				g->ug_IsAdmin = TRUE;
			}
			
			if( strcmp( g->ug_Name, "API" ) == 0 )
			{
				g->ug_IsAPI = TRUE;
			}
			g = (UserGroup *)g->node.mln_Succ;
		}
		
		pthread_mutex_init( &sm->ugm_Mutex, NULL );

		return sm;
	}
	return NULL;
}

/**
 * Delete UserManager
 *
 * @param um pointer to UserManager structure which will be deleted
 */

void UGMDelete( UserGroupManager *um )
{
	Log( FLOG_INFO,  "UGMDelete release groups\n");

	if( FRIEND_MUTEX_LOCK( &um->ugm_Mutex ) == 0 )
	{
		UserGroupDeleteAll( um->ugm_SB, um->ugm_UserGroups );

		um->ugm_UserGroups = NULL;
		FRIEND_MUTEX_UNLOCK( &um->ugm_Mutex );
	}
	pthread_mutex_destroy( &um->ugm_Mutex );
	
	FFree( um );
}

/**
 * Get UserGroup by ID
 *
 * @param um pointer to UserManager structure
 * @param id UserGroupID
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByID( UserGroupManager *um, FULONG id )
{
	if( FRIEND_MUTEX_LOCK( &um->ugm_Mutex ) == 0 )
	{
		UserGroup *ug = um->ugm_UserGroups;
		while( ug != NULL )
		{
			if( ug->ug_ID == id )
			{
				FRIEND_MUTEX_UNLOCK( &um->ugm_Mutex );
				return ug;
			}
			ug = (UserGroup *)ug->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &um->ugm_Mutex );
	}
	return NULL;
}

/**
 * Get UserGroup by Name
 *
 * @param ugm pointer to UserManager structure
 * @param name name of the group
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByName( UserGroupManager *ugm, const char *name )
{
	if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
	{
		UserGroup *ug = ugm->ugm_UserGroups;
		while( ug != NULL )
		{
			if( ug->ug_Name != NULL && (strcmp( name, ug->ug_Name ) == 0 ) )
			{
				FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
				return ug;
			}
			ug = (UserGroup *)ug->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
	}
	return NULL;
}

/**
 * Add UserGroup to list of groups
 *
 * @param ugm pointer to UserManager structure
 * @param ug pointer to new group which will be added to list
 * return 0 when success, otherwise error number
 */

int UGMAddGroup( UserGroupManager *ugm, UserGroup *ug )
{
	if( ugm == NULL )
	{
		FERROR("Cannot add NULL to group!\n");
		return 1;
	}
	if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
	{
		ug->node.mln_Succ = (MinNode *) ugm->ugm_UserGroups;
		ugm->ugm_UserGroups = ug;
		FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
	}
	return 0;
}

/**
 * Remove (diable) UserGroup on list of groups
 *
 * @param ugm pointer to UserManager structure
 * @param ug pointer to new group which will be disabled
 * @return 0 when success, otherwise error number
 */

int UGMRemoveGroup( UserGroupManager *ugm, UserGroup *ug )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	//if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
	{
		////fg->ug_Status = USER_GROUP_STATUS_DISABLED;
						//sqllib->Update( sqllib, UserGroupDesc, fg );
		ug->ug_Status = USER_GROUP_STATUS_DISABLED;
		
		SQLLibrary *sqlLib = l->LibrarySQLGet( l );
		if( sqlLib != NULL )
		{
			DEBUG("Remove users from group\n");
			char tmpQuery[ 512 ];
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT UserID FROM FUserToGroup WHERE UserGroupID=%lu", ug->ug_ID );
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
						UserGroupRemoveUser( ug, usr );
					}
				
					pos++;
				}
				sqlLib->FreeResult( sqlLib, result );
			}
			
			// remove connections between users and group
			snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserToGroup WHERE UserGroupID=%lu", ug->ug_ID );
			sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
			// remove entry from FUserGroup
			snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserGroup WHERE ID=%lu", ug->ug_ID );
			sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
			
			l->LibrarySQLDrop( l, sqlLib );
		}
		
		// phisic remove
	
		if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
		{
			UserGroup *actug = ugm->ugm_UserGroups;
			while( actug != NULL )
			{
				printf("Groupid %lu name %s\n", actug->ug_ID, actug->ug_Name );
				actug = (UserGroup *)actug->node.mln_Succ;
			}
			actug = ugm->ugm_UserGroups;
			UserGroup *prevug = ugm->ugm_UserGroups;
	
			while( actug != NULL )
			{
				if( ug == actug )
				{
					DEBUG("Found group to delete\n");
					if( actug == ugm->ugm_UserGroups )
					{
						DEBUG("It is root\n");
						ugm->ugm_UserGroups = (UserGroup *) ugm->ugm_UserGroups->node.mln_Succ;
					}
					else
					{
						DEBUG("Its not root, prev %s current %s\n", prevug->ug_Name, actug->ug_Name );
						prevug->node.mln_Succ = actug->node.mln_Succ;
					}
					UserGroupDelete( l, actug );
					DEBUG("Data removed\n");
					break;
				}
				prevug = actug;
				actug = (UserGroup *)actug->node.mln_Succ;
			}
			DEBUG("Unlock\n");
			FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
		}
	}
	return 0;
}

/**
 * Remove device from UserGroup
 *
 * @param sm pointer to UserManager structure
 * @param name name of the drive
 * @return pointer to removed drive when its avaiable, otherwise NULL
 */
File *UGMRemoveDrive( UserGroupManager *sm, const char *name )
{
	File *remdev = NULL;
	// device was not found on user device list
	UserGroup *ug = sm->ugm_UserGroups;
	
	if( FRIEND_MUTEX_LOCK( &sm->ugm_Mutex ) == 0 )
	{
		while( ug != NULL )
		{
			File *lf = ug->ug_MountedDevs;
			File *lastone = lf;
			while( lf != NULL )
			{
				DEBUG( "[UnMountFS] Checking fs in list %s == %s...\n", lf->f_Name, name );
				if( strcmp( lf->f_Name, name ) == 0 )
				{
					DEBUG( "[UnMountFS] Found one (%s == %s)\n", lf->f_Name, name );
					remdev = lf;
					break;
				}
				lastone = lf;
				lf = (File *)lf->node.mln_Succ;
			}
			
			// remove drive
		
			if( remdev != NULL )
			{
				if( remdev->f_Operations <= 0 )
				{
					DEBUG("[UserRemDeviceByName] Remove device from list\n");
				
					if( ug->ug_MountedDevs == remdev )		// checking if its our first entry
					{
						File *next = (File*)remdev->node.mln_Succ;
						ug->ug_MountedDevs = (File *)next;
						if( next != NULL )
						{
							next->node.mln_Pred = NULL;
						}
					}
					else
					{
						File *next = (File *)remdev->node.mln_Succ;
						//next->node.mln_Pred = (struct MinNode *)prev;
						if( lastone != NULL )
						{
							lastone->node.mln_Succ = (struct MinNode *)next;
						}
					}
				}
				else
				{
				//*error = FSys_Error_OpsInProgress;
				//return remdev;
				}
			}
			ug = (UserGroup *)ug->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &sm->ugm_Mutex );
	}
	return remdev;
}

/**
 * Mount all UserGroup drives
 *
 * @param sm pointer to UserManager structure
 * @return 0 when success, otherwise error number
 */
int UGMMountDrives( UserGroupManager *sm )
{
	SystemBase *sb = (SystemBase *)sm->ugm_SB;
	SQLLibrary *sqllib  = sb->LibrarySQLGet( sb );
	if( sb != NULL && sqllib != NULL )
	{
		// Test for null pointers
		UserGroup *ug = sm->ugm_UserGroups;
		// While we have nice weather conditions
		while( ug != NULL && sb->sl_UM && sb->sl_UM->um_APIUser )
		{
			char *error = NULL;
			//UserGroupDeviceMount( l, sqllib, ug, NULL );
			UserGroupDeviceMount( sb->sl_DeviceManager, sqllib, ug, sb->sl_UM->um_APIUser, &error );
			
			if( error != NULL )
			{
				Log( FLOG_ERROR, "UGMountDrives. Error: %s\n", error );
				FFree( error );
			}
			
			ug = (UserGroup *)ug->node.mln_Succ;
		}
		
		sb->LibrarySQLDrop( sb, sqllib );
	}
	return 0;
}

/**
 * Assign User to his groups in FC
 *
 * @param smgr pointer to UserGroupManager
 * @param usr pointer to user structure to which groups will be assigned
 * @return 0 when success, otherwise error number
 */

#define QUERY_SIZE 1024

int UGMAssignGroupToUser( UserGroupManager *smgr, User *usr )
{
	char *tmpQuery;
	DEBUG("[UMAssignGroupToUser] Assign group to user\n");

	//sprintf( tmpQuery, "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );
	if( smgr == NULL )
	{
		return 1;
	}
	
	tmpQuery = (char *)FCalloc( QUERY_SIZE, sizeof(char) );
	
	SystemBase *sb = (SystemBase *)smgr->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );

	if( sqlLib != NULL )
	{
		sqlLib->SNPrintF( sqlLib, tmpQuery, QUERY_SIZE, "SELECT UserGroupID FROM FUserToGroup WHERE UserID = '%lu'", usr->u_ID );

		void *result = sqlLib->Query(  sqlLib, tmpQuery );
	
		if ( result == NULL ) 
		{
			FERROR("SQL query result is empty!\n");
			sb->LibrarySQLDrop( sb, sqlLib );
			return 2;
		}
		
		FBOOL isAdmin = FALSE;
		FBOOL isAPI = FALSE;

		char **row;
		int j = 0;

		// remove user from group and then assign to new ones

		UserRemoveFromGroups( usr );
	
		int rows = sqlLib->NumberOfRows( sqlLib, result );
	
		DEBUG("[UMAssignGroupToUser] Memory for %d  groups allocated\n", rows );
	
		//if( usr->u_Groups != NULL )
		{
			int pos = 0;
			//usr->u_GroupsNr = rows;
		
			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				DEBUG("[UMAssignGroupToUser] Going through loaded rows %d -> %s\n", j, row[ 0 ] );
				{
					char *end;
					FULONG gid = strtol( (char *)row[0], &end, 0 );
				
					DEBUG("[UMAssignGroupToUser] User is in group %lu\n", gid  );
				
					if( FRIEND_MUTEX_LOCK( &(sb->sl_UGM->ugm_Mutex) ) == 0 )
					{
						UserGroup *g = sb->sl_UGM->ugm_UserGroups;
						while( g != NULL )
						{
							if( g->ug_ID == gid )
							{
								if( g->ug_IsAdmin == TRUE )
								{
									isAdmin = g->ug_IsAdmin;
								}
								if( g->ug_IsAPI == TRUE )
								{
									isAPI = g->ug_IsAPI;
								}
							
								UserGroupAddUser( g, usr );
								DEBUG("[UMAssignGroupToUser] Added group %s to user %s\n", g->ug_Name, usr->u_Name );
								//usr->u_Groups[ pos++ ] = g;
							}
							g  = (UserGroup *) g->node.mln_Succ;
						}
						FRIEND_MUTEX_UNLOCK( &(sb->sl_UGM->ugm_Mutex) );
					}
				}
			}
		}
		
		usr->u_IsAdmin = isAdmin;
		usr->u_IsAPI = isAPI;
	
		sqlLib->FreeResult( sqlLib, result );

		sb->LibrarySQLDrop( sb, sqlLib );
	}
	
	FFree( tmpQuery );
	
	return 0;
}

/**
 * Assign User to his groups in FC.
 * Groups are provided by string (comma is separator)
 *
 * @param um pointer to UserGroupManager
 * @param usr pointer to user structure to which groups will be assigned
 * @param level user level (Admin, User, etc.) 
 * @param workgroups provided as string, where comma is separator between group names
 * @return 0 when success, otherwise error number
 */
int UGMAssignGroupToUserByStringDB( UserGroupManager *um, User *usr, char *level, char *workgroups )
{
	if( level == NULL && workgroups == NULL )
	{
		FERROR("level or workgroups are empty, cannot setup groups!\n");
		return 1;
	}
	char tmpQuery[ 512 ];
	
	DEBUG("[UMAssignGroupToUserByStringDB] Assign group to user start NEW GROUPS: >%s< AND WORKGROUPS: >%s<\n", level, workgroups );
	
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("Cannot get mysql.library slot\n");
		return -10;
	}

	// checking  how many groups were passed
	
	int pos = 0;
	
	UIntListEl *el = UILEParseString( workgroups );
	
	DEBUG("-----------------------> show groups at 0\n" );
	
	// function store ID's of groups to which user is assigned
	///BufString *bsGroups = BufStringNew();
	//pos = 0;
	
	//int tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "{\"userid\":\"%s\",\"groupids\":[", usr->u_UUID );
	//BufStringAddSize( bsGroups, tmpQuery, tmplen );
	
	int tmplen = 0;
	
	//
	// going through all groups and create new "insert"
	//
	
	BufString *bsInsert = BufStringNew();
	BufStringAdd( bsInsert, "INSERT INTO FUserToGroup (UserID, UserGroupID ) VALUES ");
	FBOOL isAdmin = FALSE;
	FBOOL isAPI = FALSE;
	
	if( level != NULL )
	{
		// if none is set then it means user removed his levels
		if( strcmp( "false", level ) == 0 )
		{
		
		}
		else
		{
			// set proper user level
			if( FRIEND_MUTEX_LOCK( &(sb->sl_UGM->ugm_Mutex) ) == 0 )
			{
				UserGroup *gr = sb->sl_UGM->ugm_UserGroups;
				while( gr != NULL )
				{
					if( strcmp( gr->ug_Name, level ) == 0 )
					{
						DEBUG("User is in level: %s\n", level );
						if( gr->ug_IsAdmin == TRUE ) isAdmin = TRUE;
						if( gr->ug_IsAPI == TRUE ) isAPI = TRUE;
			
						UserGroupAddUser( gr, usr );
			
						DEBUG("[UMAssignGroupToUserByStringDB] Group found %s will be added to user %s\n", gr->ug_Name, usr->u_Name );
			
						char loctmp[ 256 ];
						int loctmplen;
						// insert to database
						if( pos == 0 )
						{
							loctmplen = snprintf( loctmp, sizeof( loctmp ),  "( %lu, %lu ) ", usr->u_ID, gr->ug_ID );
							tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", gr->ug_ID );
						}
						else
						{
							loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",( %lu, %lu ) ", usr->u_ID, gr->ug_ID ); 
							tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", gr->ug_ID );
						}
						BufStringAdd( bsInsert, loctmp );
						/*
						// information to external service
						if( pos == 0 )
						{
							loctmplen = snprintf( loctmp, sizeof( loctmp ),  "( %s, %lu ) ", usr->u_UUID, gr->ug_ID );
							tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", gr->ug_ID );
						}
						else
						{
							loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",( %s, %lu ) ", usr->u_UUID, gr->ug_ID ); 
							tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", gr->ug_ID );
						}
						BufStringAddSize( bsGroups, tmpQuery, tmplen );
						*/
						pos++;
						break;
					}
					gr = (UserGroup *) gr->node.mln_Succ;
				}
				FRIEND_MUTEX_UNLOCK( &(sb->sl_UGM->ugm_Mutex) );
			}
		
			usr->u_IsAdmin = isAdmin;
			usr->u_IsAPI = isAPI;
		}
		
		// removeing old group conections from DB
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE `UserID` = %lu AND `UserGroupID` IN (SELECT ID FROM FUserGroup where Type='Level')", usr->u_ID ) ;
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}
	}	// level != NULL
	
	if( workgroups != NULL )
	{
		UserRemoveFromGroups( usr );
		
		if( strcmp( "false", workgroups ) == 0 )
		{
		
		}
		else
		{
			while( el != NULL )
			{
				UIntListEl *rmEntry = el;
				el = (UIntListEl *)el->node.mln_Succ;
		
				DEBUG("[UMAssignGroupToUserByStringDB] Memory for groups allocated, pos: %d\n", pos );
		
				DEBUG("[UMAssignGroupToUserByStringDB] in loop %d\n", pos );
		
				if( FRIEND_MUTEX_LOCK( &(sb->sl_UGM->ugm_Mutex) ) == 0 )
				{
					UserGroup *gr = sb->sl_UGM->ugm_UserGroups;
					while( gr != NULL )
					{
						DEBUG("[UMAssignGroupToUserByStringDB] compare %s - %s\n", gr->ug_Name, gr->ug_Name );
			
						if( gr->ug_ID == rmEntry->i_Data )
						{
							UserGroupAddUser( gr, usr );
				
							DEBUG("[UMAssignGroupToUserByStringDB] Group found %s will be added to user %s\n", gr->ug_Name, usr->u_Name );
				
							char loctmp[ 256 ];
							int loctmplen;
						
							// insert to database
							if( pos == 0 )
							{
								loctmplen = snprintf( loctmp, sizeof( loctmp ),  "( %lu, %lu ) ", usr->u_ID, gr->ug_ID );
								tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", gr->ug_ID );
							}
							else
							{
								loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",( %lu, %lu ) ", usr->u_ID, gr->ug_ID ); 
								tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", gr->ug_ID );
							}
							BufStringAdd( bsInsert, loctmp );
							/*
							// message to external service
							if( pos == 0 )
							{
								loctmplen = snprintf( loctmp, sizeof( loctmp ),  "( %s, %lu ) ", usr->u_UUID, gr->ug_ID );
								tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", gr->ug_ID );
							}
							else
							{
								loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",( %s, %lu ) ", usr->u_UUID, gr->ug_ID ); 
								tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", gr->ug_ID );
							}
							BufStringAddSize( bsGroups, tmpQuery, tmplen );
							*/
				
							pos++;
							break;
						}
						gr = (UserGroup *) gr->node.mln_Succ;
					} // while group
					FRIEND_MUTEX_UNLOCK( &(sb->sl_UGM->ugm_Mutex) );
				}
				FFree( rmEntry );
			}
		}	// workgroups != "none"
		
		// removeing old group conections from DB
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE `UserID` = %lu AND `UserGroupID` IN (SELECT ID FROM FUserGroup where Type<>'Level')", usr->u_ID ) ;
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}
	}	// workgroups != NULL

	// add new groups

	if( sqlLib->QueryWithoutResults( sqlLib, bsInsert->bs_Buffer  ) !=  0 )
	{
		FERROR("Cannot call query: '%s'\n", bsInsert->bs_Buffer );
	}

	//BufStringAddSize( bsGroups, "]}", 2 );
	
	// update external services about changes
	//NotificationManagerSendEventToConnections( sb->sl_NotificationManager, NULL, NULL, NULL, "service", "user", "update", bsGroups->bs_Buffer );
	// update user about changes
	UserNotifyFSEvent2( sb->sl_DeviceManager, usr, "refresh", "Mountlist:" );
	
	if( bsInsert != NULL )
	{
		BufStringDelete( bsInsert );
	}
	//if( bsGroups != NULL )
	//{
	//	BufStringDelete( bsGroups );
	//}

	sb->LibrarySQLDrop( sb, sqlLib );
	DEBUG("[UMAssignGroupToUserByStringDB] Assign  groups to user end\n");
	
	return 0;
}

/**
 * Add user to UserGroup users list in DB
 *
 * @param um pointer to UserGroupManager
 * @param groupID ID of group to which user will be added
 * @param userID ID of user which will be assigned to group
 * @return 0 when ssuccess, otherwise error number
 */
int UGMAddUserToGroupDB( UserGroupManager *um, FULONG groupID, FULONG userID )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "INSERT INTO FUserToGroup (UserID, UserGroupID ) VALUES (%lu,%lu)", userID, groupID );
		
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return 1;
	}
	return 0;
}

/**
 * Get all groups where user belong
 *
 * @param um pointer to UserGroupManager
 * @param userID ID of user which will be assigned to group
 * @param bs pointer to BufString where data will be stored
 * @return 0 when ssuccess, otherwise error number
 */
int UGMGetUserGroupsDB( UserGroupManager *um, FULONG userID, BufString *bs )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		DEBUG("Get groups assigned to user\n");
		char tmpQuery[ 512 ];
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT UserGroupID FROM FUserToGroup WHERE UserID=%lu group by UserGroupID", userID );
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int pos = 0;
			char **row;
			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				if( pos > 0 )
				{
					BufStringAddSize( bs, ",", 1 );
				}
				BufStringAdd( bs, row[ 0 ] );
			
				pos++;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return 1;
	}
	return 0;
}

/**
 * Remove user from UserGroup in DB
 *
 * @param um pointer to UserGroupManager
 * @param groupID ID of group from which User will be removed
 * @param userID ID of user which will be removed from group
 * @return 0 when ssuccess, otherwise error number
 */
int UGMRemoveUserFromGroupDB( UserGroupManager *um, FULONG groupID, FULONG userID )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE from `FUserToGroup` where `UserID`=%lu AND `UserGroupID`=%lu", userID, groupID );
		
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return 1;
	}
	return 0;
}

/**
 * Check if User is connected to Group in DB
 *
 * @param um pointer to UserGroupManager
 * @param ugroupid UserGroup ID
 * @param uid User ID
 * @return TRUE when entry exist, otherwise FALSE
 */
FBOOL UGMUserToGroupISConnectedDB( UserGroupManager *um, FULONG ugroupid, FULONG uid )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	FBOOL ret = FALSE;
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserToGroup WHERE `UserID`=%lu AND `UserGroupID`=%lu", uid, ugroupid );
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int rows = sqlLib->NumberOfRows( sqlLib, result );
			if( rows > 0 )
			{
				ret = TRUE;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		else
		{
			ret = FALSE;
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return FALSE;
	}
	return ret;
}

/**
 * Get groups from DB where user is assigned or not
 *
 * @param um pointer to UserGroupManager
 * @param uid User ID
 * @param bs pointer to BufString where data will be stored
 * @return TRUE when entry exist, otherwise FALSE
 */
FBOOL UGMGetGroupsDB( UserGroupManager *um, FULONG uid, BufString *bs, const char *type, FULONG parentID, int status )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	FBOOL ret = FALSE;
	
	if( sqlLib != NULL )
	{
		int arg = 0;
		BufString *sqlbs = BufStringNew();
		
		BufStringAdd( sqlbs, "SELECT g.ID,g.UserID,g.ParentID,g.Name,g.Type.g.Status FROM FGroup g inner join FUserToGroup utg on g.ID=utg.UserGroupID" );
		
		if( uid > 0 || type != NULL || parentID > 0 || status > 0 )
		{
			BufStringAdd( sqlbs, " WHERE" );
		}
		
		if( uid > 0 )
		{
			char tmp[ 256 ];
			int tmpi = 0;
			tmpi = snprintf( tmp, sizeof(tmp), " utg.UserID=%lu", uid );
			
			BufStringAddSize( sqlbs, tmp, tmpi );
			arg++;
		}
		
		if( type != NULL )
		{
			char tmp[ 512 ];
			int tmpi = 0;
			
			if( arg > 0 )
			{
				tmpi = snprintf( tmp, sizeof(tmp), " AND g.Type='%s'", type );
			}
			else
			{
				tmpi = snprintf( tmp, sizeof(tmp), " g.Type='%s'", type );
			}
			
			BufStringAddSize( sqlbs, tmp, tmpi );
			arg++;
		}
		
		if( parentID > 0 )
		{
			char tmp[ 256 ];
			int tmpi = 0;
			
			if( arg > 0 )
			{
				tmpi = snprintf( tmp, sizeof(tmp), " AND g.ParentID=%lu", parentID );
			}
			else
			{
				tmpi = snprintf( tmp, sizeof(tmp), " g.ParentID=%lu", parentID );
			}
			
			BufStringAddSize( sqlbs, tmp, tmpi );
			arg++;
		}
		
		if( status > 0 )
		{
			char tmp[ 256 ];
			int tmpi = 0;
			
			if( arg > 0 )
			{
				tmpi = snprintf( tmp, sizeof(tmp), " AND g.Status=%d", status );
			}
			else
			{
				tmpi = snprintf( tmp, sizeof(tmp), " g.Status=%d", status );
			}
			
			BufStringAddSize( sqlbs, tmp, tmpi );
			arg++;
		}
		
		//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserToGroup WHERE `UserID`=%lu AND `UserGroupID`=%lu", uid, ugroupid );
		
		void *result = sqlLib->Query( sqlLib, sqlbs->bs_Buffer );
		if( result != NULL )
		{
			int rownr = 0;
			char **row;
			// g.ID,g.UserID,g.ParentID,g.Name,g.Type.g.Status

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				char tmp[ 512 ];
				int tmpi = 0;
				
				if( rownr == 0 )
				{
					tmpi = snprintf( tmp, sizeof(tmp), "{\"id\":%s,\"userid\":%s,\"parentid\":%s,\"name\":\"%s\",\"type\":\"%s\",\"status\":%s}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
				}
				else
				{
					tmpi = snprintf( tmp, sizeof(tmp), ",{\"id\":%s,\"userid\":%s,\"parentid\":%s,\"name\":\"%s\",\"type\":\"%s\",\"status\":%s}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
				}
				rownr++;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		else
		{
			ret = FALSE;
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
		
		BufStringDelete( sqlbs );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return FALSE;
	}
	return ret;
}

/**
 * Get groups from FC memory where user is assigned or not
 *
 * @param um pointer to UserGroupManager
 * @param uid User ID
 * @param bs pointer to BufString where data will be stored
 * @param type type of group (filter)
 * @param parentID parentID (filter)
 * @param status group status (filter)
 * @param fParentID if parentID was passed as argument
 */
void UGMGetGroups( UserGroupManager *um, FULONG uid, BufString *bs, const char *type, FULONG parentID, int status, FBOOL fParentID )
{
	SystemBase *l = (SystemBase *)um->ugm_SB;
	
	if( FRIEND_MUTEX_LOCK( &(l->sl_UGM->ugm_Mutex) ) == 0 )
	{
		UserGroup *lg = l->sl_UGM->ugm_UserGroups;
		int pos = 0;
		
		while( lg != NULL )
		{
			// if values are set then we want to filter all messages by using them
			FBOOL addToList = TRUE;
			if( fParentID == TRUE )	// user want filtering
			{
				if( lg->ug_ParentID != parentID )
				{
					addToList = FALSE;
				}
			}
		
			if( status >= 0 )
			{
				if( status != lg->ug_Status )
				{
					addToList = FALSE;
				}
			}
			
			if( type != NULL )
			{
				if( strcmp( type, lg->ug_Type ) != 0 )
				{
					addToList = FALSE;
				}
			}
			
			if( addToList == TRUE )
			{
				char tmp[ 512 ];
				int tmpsize = 0;
				if( pos == 0 )
				{
					tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"ID\":%lu,\"parentid\":%lu,\"level\":\"%s\",\"status\":%d}", lg->ug_Name, lg->ug_ID, lg->ug_ParentID, lg->ug_Type, lg->ug_Status );
				}
				else
				{
					tmpsize = snprintf( tmp, sizeof(tmp), ",{\"name\":\"%s\",\"ID\":%lu,\"parentid\":%lu,\"level\":\"%s\",\"status\":%d}", lg->ug_Name, lg->ug_ID, lg->ug_ParentID, lg->ug_Type, lg->ug_Status );
				}
				BufStringAddSize( bs, tmp, tmpsize );
				pos++;
			}
			lg = (UserGroup *)lg->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(l->sl_UGM->ugm_Mutex) );
	}
}

/**
 * Check if User is connected to Group in DB
 *
 * @param um pointer to UserGroupManager
 * @param ugroupid UserGroup ID
 * @param uname User name
 * @return TRUE when entry exist, otherwise FALSE
 */
FBOOL UGMUserToGroupISConnectedByUNameDB( UserGroupManager *um, FULONG ugroupid, const char *uname )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	FBOOL ret = FALSE;
	
	if( sqlLib != NULL )
	{
		char tmpQuery[512];
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserToGroup WHERE `GroupID`=%lu AND 'UserID' in (SELECT ID FROM FUser WHERE Name='%s')", ugroupid, uname );
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int rows = sqlLib->NumberOfRows( sqlLib, result );
			if( rows > 0 )
			{
				ret = TRUE;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		else
		{
			ret = FALSE;
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return FALSE;
	}
	return ret;
}


/**
 * Check if User is connected to Group in DB
 *
 * @param um pointer to UserGroupManager
 * @param ugroupid UserGroup ID
 * @param uid User ID
 * @return TRUE when entry exist, otherwise FALSE
 */
FBOOL UGMUserToGroupISConnectedByUIDDB( UserGroupManager *um, FULONG ugroupid, FULONG uid )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	FBOOL ret = FALSE;
	
	if( sqlLib != NULL )
	{
		char tmpQuery[512];
		snprintf( tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserToGroup WHERE `UserGroupID`=%lu AND `UserID`=%lu", ugroupid, uid );
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int rows = sqlLib->NumberOfRows( sqlLib, result );
			if( rows > 0 )
			{
				DEBUG("[UGMUserToGroupISConnectedByUIDDB] User is in group\n");
				ret = TRUE;
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		else
		{
			ret = FALSE;
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("UGMAddUserToGroup DBConnection fail!\n");
		return FALSE;
	}
	DEBUG("[UGMUserToGroupISConnectedByUIDDB] User is in group? %d\n", ret );
	return ret;
}

/**
 * Return all groups and their members as string
 *
 * @param um pointer to UserGroupManager
 * @param bs pointer to BufString where string will be stored
 * @param type type of group or NULL when everything should be returned
 * @return 0 when success, otherwise error number
 */
int UGMReturnAllAndMembers( UserGroupManager *um, BufString *bs, char *type )
{
	SystemBase *l = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 512 ];
		char tmp[ 512 ];
		int itmp = 0;
		FULONG currGroupID = 0;
		
		if( type == NULL )
		{
			//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserToGroup utg inner join FUser u on utg.UserID=u.ID inner join FUserGroup ug on utg.UserGroupID=ug.ID order by utg.UserGroupID" );
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserGroup ug left outer join FUserToGroup utg on ug.ID=utg.UserGroupID left join FUser u on utg.UserID=u.ID order by utg.UserGroupID" );
		}
		else
		{
			//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserToGroup utg inner join FUser u on utg.UserID=u.ID inner join FUserGroup ug on utg.UserGroupId=ug.ID WHERE ug.Type='%s' order by utg.UserGroupID", type );
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserGroup ug left outer join FUserToGroup utg on ug.ID=utg.UserGroupID left join FUser u on utg.UserID=u.ID WHERE ug.Type='%s' order by utg.UserGroupID", type );
		}
		
		BufStringAddSize( bs, "[", 1 );
		
		void *result = sqlLib->Query(  sqlLib, tmpQuery );
		if( result != NULL )
		{
			int usrpos = 0;
			char **row;

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				char *end;
				FULONG groupid =  strtol( (char *)row[0], &end, 0 );
				FULONG parentid =  strtol( (char *)row[2], &end, 0 );
				
				if( currGroupID == 0 || groupid != currGroupID )
				{
					if( currGroupID == 0 )
					{
						itmp = snprintf( tmp, sizeof(tmp), "{\"id\":%lu,\"name\":\"%s\",\"type\":\"%s\",\"parentid\":%lu,\"userids\":[", groupid, (char *)row[1], (char *)row[3], parentid );
					}
					else
					{
						itmp = snprintf( tmp, sizeof(tmp), "]},{\"id\":%lu,\"name\":\"%s\",\"type\":\"%s\",\"parentid\":%lu,\"userids\":[", groupid, (char *)row[1], (char *)row[3], parentid );
					}
					BufStringAddSize( bs, tmp, itmp );

					currGroupID = groupid;
					usrpos = 0;
				}
				
				if( row[ 4 ] != NULL )
				{
					if( usrpos == 0 )
					{
						itmp = snprintf( tmp, sizeof(tmp), "\"%s\"", (char *)row[ 4 ] );
					}
					else
					{
						itmp = snprintf( tmp, sizeof(tmp), ",\"%s\"", (char *)row[ 4 ] );
					}
				
					BufStringAddSize( bs, tmp, itmp );
					usrpos++;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		l->LibrarySQLDrop( l, sqlLib );
		
		if( currGroupID != 0 )
		{
			BufStringAddSize( bs, "]}", 2 );
		}
		
		BufStringAddSize( bs, "]", 1 );
	}
	return 0;
}
