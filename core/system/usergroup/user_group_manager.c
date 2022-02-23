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
		Log( FLOG_INFO,  "[UGMNew] Loading groups from DB\n");
	
		SQLLibrary *sqlLib = lsb->LibrarySQLGet( lsb );
		if( sqlLib != NULL )
		{
			int entries;
			char where[ 512 ];

			// get groups which have shared drives
			
			//strcpy( where, "(UserID=0 OR UserID in(select u.ID from FUser u left join FUserToGroup utg on u.ID=utg.UserID left join FUserGroup ug on utg.UserGroupID=ug.id where ug.Name='Admin' and (ug.Type='Workgroup' or ug.Type='Level')) ) AND Type in('Workgroup','Level')");
			
			strcpy( where, "ID in (SELECT DISTINCT GroupID FROM Filesystem WHERE Mounted=1)");
			
			sm->ugm_UserGroups = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );

			lsb->LibrarySQLDrop( lsb, sqlLib );
		}
		
		pthread_mutex_init( &sm->ugm_Mutex, NULL );

		return sm;
	}
	return NULL;
}

/**
 * Delete UserGroupManager
 *
 * @param um pointer to UserGroupManager structure which will be deleted
 */

void UGMDelete( UserGroupManager *um )
{
	Log( FLOG_INFO, "[UGMDelete] release groups\n");

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
 * Mount group drives
 *
 * @param um pointer to UserGroupManager structure which will be deleted
 */

void UGMMountGroupDrives( UserGroupManager *um )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	
	DEBUG("[UGMMountGroupDrives] Start\n");
	
	UserGroup *locug = um->ugm_UserGroups;
	while( locug != NULL )
	{
		DEBUG("[UMGNew] Group loaded: %s uuid: %s type: %s. Now lets mount devices\n", locug->ug_Name, locug->ug_UUID, locug->ug_Type );
		
		// lets mount drives
		
		MountFSWorkgroupDrive( sb->sl_DeviceManager, locug, TRUE, NULL );
		
		DEBUG("Mount end\n\n\n\n");
		
		locug = (UserGroup *)locug->node.mln_Succ;
	}
	
	DEBUG("[UGMMountGroupDrives] End\n");
}


/**
 * Get all user groups
 *
 * @param um pointer to UserGroupManager
 * @param usr pointer to user
 * @return 0 when ssuccess, otherwise error number
 */
int UGMGetAllUserGroups( UserGroupManager *um, User *usr )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	
	/*
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	DEBUG("[UGMAddUserToGroupDB] Add user: %ld to group %ld\n", userID, groupID );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		
		if( usr->u_GroupIDs != NULL )
		{
			FFree( usr->u_GroupIDs );
			usr->u_GroupIDs = NULL;
		}
		
		// now get all user groups
		
		sqlLib->SNPrintF( sqlLib, tmpQuery, 256, "SELECT group_concat( distinct UserGroupID) FROM FUserToGroup WHERE UserID=%ld", usr->u_ID );
		void *res = sqlLib->Query( sqlLib, tmpQuery );
		if( res != NULL )
		{
			char **row;
			while( ( row = sqlLib->FetchRow( sqlLib, res ) ) )
			{
				if( row[ 0 ] != NULL )
				{
					usr->u_GroupIDs = StringDuplicate( row[ 0 ] );
				}
			}
			sqlLib->FreeResult( sqlLib, res );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("[UGMAddUserToGroupDB] DBConnection fail!\n");
		return 1;
	}
	*/
	return 0;
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
 * Get UserGroup by user id and group name
 *
 * @param um pointer to UserManager structure
 * @param userID UserGroupID
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByUserIDAndName( UserGroupManager *um, FUQUAD userID, char *name )
{
	if( FRIEND_MUTEX_LOCK( &um->ugm_Mutex ) == 0 )
	{
		UserGroup *ug = um->ugm_UserGroups;
		while( ug != NULL )
		{
			if( ug->ug_UserID == userID && strcmp( name, ug->ug_Name ) == 0 )
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
 * Get UserGroup by ID from DB
 *
 * @param ugm pointer to UserManager structure
 * @param id unique group identifier
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByIDDB( UserGroupManager *ugm, FQUAD id )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	UserGroup *ug = NULL;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		// try to find if group is in DB, skip templates and roles
		char where[ 512 ];
		int size = snprintf( where, sizeof(where), "ID='%ld' AND Type in('Workgroup','Level')", id );
		int entries;
	
		ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );
		if( ug != NULL )
		{
			ug->ug_Status = USER_GROUP_STATUS_ACTIVE;
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return ug;
}

/**
 * Get UserGroup by Name
 *
 * @param ugm pointer to UserManager structure
 * @param name name of the group
 * @return UserGroup structure if it exist, otherwise NULL
 */
/*
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
*/

/**
 * Get UserGroup by Name from DB
 *
 * @param ugm pointer to UserManager structure
 * @param name name of the group
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByNameDB( UserGroupManager *ugm, const char *name )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	UserGroup *ug = NULL;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		// try to find if group is in DB, skip templates and roles
		char where[ 512 ];
		int size = snprintf( where, sizeof(where), "Name='%s' AND Type in('Workgroup','Level')", name );
		int entries;
	
		ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );
		if( ug != NULL )
		{
			ug->ug_Status = USER_GROUP_STATUS_ACTIVE;
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return ug;
}

/**
 * Get UserGroup by Name from DB
 *
 * @param ugm pointer to UserManager structure
 * @param name name of the group
 * @param userid id of user
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByNameAndUserIDDB( UserGroupManager *ugm, const char *name, FQUAD userid )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	UserGroup *ug = NULL;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		// try to find if group is in DB, skip templates and roles
		char where[ 512 ];
		int size = snprintf( where, sizeof(where), "Name='%s' AND UserID=%ld AND Type in('Workgroup','Level')", name, userid );
		int entries;
	
		ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );
		if( ug != NULL )
		{
			ug->ug_Status = USER_GROUP_STATUS_ACTIVE;
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return ug;
}

/**
 * Get UserGroup by Name and Type from DB
 *
 * @param ugm pointer to UserManager structure
 * @param name name of the group
 * @return UserGroup structure if it exist, otherwise NULL
 */

UserGroup *UGMGetGroupByNameAndTypeDB( UserGroupManager *ugm, const char *name, const char *type )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	UserGroup *ug = NULL;
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		// try to find if group is in DB, skip templates and roles
		char where[ 512 ];
		int size = snprintf( where, sizeof(where), "Name='%s' AND Type='%s'", name, type );
		int entries;
	
		ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );
		if( ug != NULL )
		{
			ug->ug_Status = USER_GROUP_STATUS_ACTIVE;
			if( ug->ug_Type != NULL )
			{
				if( strcmp( ug->ug_Name, "Admin" ) == 0 )
				{
					ug->ug_IsAdmin = TRUE;
				}
				if( strcmp( ug->ug_Name, "API" ) == 0 )
				{
					ug->ug_IsAPI = TRUE;
				}
				
				DEBUG("Group name: %s type: %s\n", ug->ug_Name, ug->ug_Type );
			}
		}
		l->LibrarySQLDrop( l, sqlLib );
	}
	return ug;
}

/**
 * Add UserGroup to list of groups
 *
 * @param ugm pointer to UserManager structure
 * @param userID Id of user which own group
 * @param name group name
 * return 0 when success, otherwise error number
 */
/*
int UGMAddGroup( UserGroupManager *ugm, FQUAD userID, char *name )
{
	SystemBase *sb = (SystemBase *)ugm->ugm_SB;
	if( ugm == NULL )
	{
		FERROR("[UGMAddGroup] Cannot add NULL to group!\n");
		return 1;
	}
	
	UserGroup *locg = UGMGetGroupByUserIDAndName( ugm, userID, name );
	if( locg != NULL )
	{
		FERROR("[UGMAddGroup] Cannot add same group to list: %s\n", name );
		return 2;
	}
	
	// looks like group is not loaded into memory
	
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	if( sqlLib != NULL )
	{
		char where[ 512 ];
		int entries = 0;
		snprintf( where, sizeof(where), "UserID=%ld AND Name='%s'", userID, name );
	
		UserGroup *ug = sqlLib->Load( sqlLib, UserGroupDesc, where, &entries );

		if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
		{
			ug->node.mln_Succ = (MinNode *) ugm->ugm_UserGroups;
			ugm->ugm_UserGroups = ug;
			FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	return 0;
}
*/

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
		FERROR("[UGMAddGroup] Cannot add NULL to group!\n");
		return 1;
	}
	
	if( FRIEND_MUTEX_LOCK( &ugm->ugm_Mutex ) == 0 )
	{
		UserGroup *lug = ugm->ugm_UserGroups;
		while( lug != NULL )
		{
			if( lug->ug_ID == ug->ug_ID )
			{
				FERROR("[UGMAddGroup] Cannot add same group to list\n");
				FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
				return 2;
			}
			lug = (UserGroup *)lug->node.mln_Succ;
		}
		
		if( lug == NULL )
		{
			ug->node.mln_Succ = (MinNode *) ugm->ugm_UserGroups;
			ugm->ugm_UserGroups = ug;
		}
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

/*
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
			DEBUG("[UGMRemoveGroup] Remove users from group\n");
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
				DEBUG("[UGMRemoveGroup] Groupid %lu name %s\n", actug->ug_ID, actug->ug_Name );
				actug = (UserGroup *)actug->node.mln_Succ;
			}
			actug = ugm->ugm_UserGroups;
			UserGroup *prevug = ugm->ugm_UserGroups;
	
			while( actug != NULL )
			{
				if( ug == actug )
				{
					DEBUG("[UGMRemoveGroup] Found group to delete\n");
					if( actug == ugm->ugm_UserGroups )
					{
						DEBUG("[UGMRemoveGroup] It is root\n");
						ugm->ugm_UserGroups = (UserGroup *) ugm->ugm_UserGroups->node.mln_Succ;
					}
					else
					{
						DEBUG("[UGMRemoveGroup] Its not root, prev %s current %s\n", prevug->ug_Name, actug->ug_Name );
						prevug->node.mln_Succ = actug->node.mln_Succ;
					}

					DEBUG("[UGMRemoveGroup] Data removed\n");
					break;
				}
				prevug = actug;
				actug = (UserGroup *)actug->node.mln_Succ;
			}
			DEBUG("[UGMRemoveGroup] Unlock\n");
			FRIEND_MUTEX_UNLOCK( &ugm->ugm_Mutex );
			
			if( actug != NULL )
			{
				UserGroupDelete( l, actug );
			}
		}
	}
	return 0;
}
*/

/**
 * Remove UserGroup from database
 *
 * @param ugm pointer to UserManager structure
 * @param groupid id of group which will be removed
 * @return 0 when success, otherwise error number
 */

int UGMRemoveGroupDB( UserGroupManager *ugm, FUQUAD groupid )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 256 ];
		DEBUG("[UGMRemoveGroup] Remove users from group\n");

		// remove connections between users and group
		snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserToGroup WHERE UserGroupID=%lu", groupid );
		sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
		// remove entry from FUserGroup
		snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserGroup WHERE ID=%lu", groupid );
		sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
		
		l->LibrarySQLDrop( l, sqlLib );
	}
	return 0;
}

/**
 * Remove UserGroup
 *
 * @param ugm pointer to UserManager structure
 * @param ug pointer to new group which will be disabled
 * @return 0 when success, otherwise error number
 */

int UGMRemoveGroup( UserGroupManager *ugm, FUQUAD groupid )
{
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	
	SQLLibrary *sqlLib = l->LibrarySQLGet( l );
	if( sqlLib != NULL )
	{
		char tmpQuery[ 256 ];
		DEBUG("[UGMRemoveGroup] Remove users from group\n");

		// remove connections between users and group
		snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserToGroup WHERE UserGroupID=%lu", groupid );
		sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
		// remove entry from FUserGroup
		snprintf( tmpQuery, sizeof(tmpQuery), "delete FROM FUserGroup WHERE ID=%lu", groupid );
		sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
		
		l->LibrarySQLDrop( l, sqlLib );
		
		UMRemoveUsersFromGroup( l->sl_UM, groupid );
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
				DEBUG( "[UGMRemoveDrive] Checking fs in list %s == %s...\n", lf->f_Name, name );
				if( strcmp( lf->f_Name, name ) == 0 )
				{
					DEBUG( "[UGMRemoveDrive] Found one (%s == %s)\n", lf->f_Name, name );
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
					DEBUG("[UGMRemoveDrive] Remove device from list\n");
				
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
			UserSession *ses = NULL;
			
			if( sb->sl_UM->um_APIUser != NULL && sb->sl_UM->um_APIUser->u_SessionsList )
			{
				if( sb->sl_UM->um_APIUser->u_SessionsList->us != NULL )
				{
					ses = (UserSession *)sb->sl_UM->um_APIUser->u_SessionsList->us;
				}
			}
			
			// We use API user to manage everything from system side
			UserGroupDeviceMount( sb->sl_DeviceManager, sqllib, ug, sb->sl_UM->um_APIUser, ses, &error );
			
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
 * @param ugm pointer to UserGroupManager
 * @param usr pointer to user structure to which groups will be assigned
 * @return 0 when success, otherwise error number
 */

#define QUERY_SIZE 1024

int UGMAssignGroupToUser( UserGroupManager *ugm, User *usr )
{
	DEBUG("[UMAssignGroupToUser] Assign group to user\n");

	if( ugm == NULL )
	{
		return 1;
	}
	
	SystemBase *l = (SystemBase *)ugm->ugm_SB;
	char *qery = FMalloc( 1048 );
	
	// We need to check how many groups were created by the user before
	SQLLibrary *sqllib  = l->LibrarySQLGet( l );
	if( sqllib != NULL )
	{
		// set default
		usr->u_IsAdmin = FALSE;
		usr->u_IsAPI = FALSE;
		
		sqllib->SNPrintF( sqllib, qery, 1024, "SELECT ug.Name FROM FUserToGroup utg inner join FUserGroup ug on utg.UserGroupID=ug.ID WHERE utg.UserID=%ld AND (ug.Name='Admin' OR ug.Name='API')", usr->u_ID );
		void *res = sqllib->Query( sqllib, qery );
		if( res != NULL )
		{
			char **row;
			while( ( row = sqllib->FetchRow( sqllib, res ) ) )
			{
				if( row[ 0 ] != NULL )
				{
					if( strcmp( "Admin", (char *)row[ 0 ] ) == 0 )
					{
						usr->u_IsAdmin = TRUE;
					}
					if( strcmp( "API", (char *)row[ 0 ] ) == 0 )
					{
						usr->u_IsAPI = TRUE;
					}
				}
			}
			sqllib->FreeResult( sqllib, res );
		}
		
		DEBUG("[UMAssignGroupToUser] user: %s is admin %d is api %d\n", usr->u_Name, usr->u_IsAdmin, usr->u_IsAPI );
		
		USER_CHANGE_ON( usr );
		
		//
		// Remove all links to groups. This gives us assureance that user will not be assigned to any other group 
		//
	
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		usr->u_UserGroupLinks = NULL;
		while( ugl != NULL )
		{
			UserGroupLink *uglrem = ugl;
			ugl = (UserGroupLink *)ugl->node.mln_Succ;
			FFree( uglrem );
		}
		
		DEBUG("[UMAssignGroupToUser] all groups released\n");
		
		// getting all groups which already have shared drive.
	
		sqllib->SNPrintF( sqllib, qery, 1024, "SELECT DISTINCT ug.ID FROM FUserToGroup utg inner join FUserGroup ug on utg.UserGroupID=ug.ID inner join Filesystem f on ug.ID=f.GroupID WHERE utg.UserID=%ld", usr->u_ID );
		res = sqllib->Query( sqllib, qery );
		if( res != NULL )
		{
			char **row;
			while( ( row = sqllib->FetchRow( sqllib, res ) ) )
			{
				if( row[ 0 ] != NULL )
				{
					char *end;
					FQUAD id = strtoll( row[ 0 ], &end, 0 );
					if( id > 0 )
					{
						// we got valid ID so we can get group from list
						UserGroup *ug = UGMGetGroupByID( l->sl_UGM, id );
						if( ug != NULL )
						{
							UserGroupLink *nugl = FCalloc( 1, sizeof( UserGroupLink ) );
							if( nugl != NULL )
							{
								nugl->ugl_Group = ug;
								nugl->ugl_GroupID = id;
								
								// add new entry to list
								nugl->node.mln_Succ = (MinNode *)usr->u_UserGroupLinks;
								usr->u_UserGroupLinks = nugl;
								
								DEBUG("[UMAssignGroupToUser] User: %s assigned to group (in memory) %ld name: %s\n", usr->u_Name, id, ug->ug_Name );
							}
						}
					}
				}
			}
			sqllib->FreeResult( sqllib, res );
		}
		USER_CHANGE_OFF( usr );

		l->LibrarySQLDrop( l, sqllib );
	}
	
	FFree( qery );
	
	DEBUG("[UMAssignGroupToUser] Assign group to user END\n");
	
	return 0;
}

//
//
//

typedef struct UTGEntry
{
	UserGroup		*ug;
	User			*user;
	MinNode			node;
}UTGEntry;

/**
 * Assign User to his groups in FC.
 * Groups are provided by string (comma is separator)
 *
 * @param ugm pointer to UserGroupManager
 * @param usr pointer to user structure to which groups will be assigned
 * @param level user level (Admin, User, etc.) 
 * @param workgroups provided as string, where comma is separator between group names
 * @return 0 when success, otherwise error number
 */
int UGMAssignGroupToUserByStringDB( UserGroupManager *ugm, User *usr, char *level, char *workgroups )
{
	if( level == NULL && workgroups == NULL )
	{
		FERROR("level or workgroups are empty, cannot setup groups!\n");
		return 1;
	}
	char tmpQuery[ 512 ];
	
	DEBUG("[UMAssignGroupToUserByStringDB] Assign group to user start NEW GROUPS: >%s< AND WORKGROUPS: >%s<\n", level, workgroups );
	
	SystemBase *sb = (SystemBase *)ugm->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib == NULL )
	{
		FERROR("[UMAssignGroupToUserByStringDB] Cannot get mysql.library slot\n");
		return -10;
	}

	// checking  how many groups were passed
	
	int pos = 0;
	
	UIntListEl *el = UILEParseString( workgroups );
	
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
			//
			// This functionality is used only to assign User to Admin or API groups
			//
			
			UserGroup *rootug = UGMGetGroupByNameAndTypeDB( ugm, level, "Level" );
			if( rootug != NULL )
			{
				UserGroup *ug = rootug;
				
				while( ug != NULL )
				{
					DEBUG("User is in level: %s\n", level );
					if( ug->ug_IsAdmin == TRUE ) isAdmin = TRUE;
					if( ug->ug_IsAPI == TRUE ) isAPI = TRUE;
					DEBUG("User is in level admin: %d api %d\n", isAdmin, isAPI );
				
					char loctmp[ 256 ];
					int loctmplen;
					// insert to database
					if( pos == 0 )
					{
						loctmplen = snprintf( loctmp, sizeof( loctmp ),  "(%lu, %lu) ", usr->u_ID, ug->ug_ID );
						tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", ug->ug_ID );
					}
					else
					{
						loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",(%lu, %lu) ", usr->u_ID, ug->ug_ID ); 
						tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", ug->ug_ID );
					}
					BufStringAdd( bsInsert, loctmp );
				
					pos++;
					ug = (UserGroup *) ug->node.mln_Succ;
				}
				
				UserGroupDeleteAll( sb, rootug );
			}
		
			usr->u_IsAdmin = isAdmin;
			usr->u_IsAPI = isAPI;
			DEBUG("User: %s isAdmin %d isAPI %d\n", usr->u_Name, usr->u_IsAdmin, usr->u_IsAPI );
		}
		
		// removeing old group conections from DB
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE `UserID`=%lu AND `UserGroupID` IN (SELECT ID FROM FUserGroup where Type='Level')", usr->u_ID ) ;
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("[UMAssignGroupToUserByStringDB] Cannot call query: '%s'\n", tmpQuery );
		}
	}	// level != NULL
	
	if( workgroups != NULL )
	{
		// we clear current user assigns to groups
		UserRemoveFromGroupsDB( sb, usr );
		
		USER_CHANGE_ON( usr );
		
		//
		// Remove all links to groups. This gives us assureance that user will not be assigned to any other group 
		//
	
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		usr->u_UserGroupLinks = NULL;
		while( ugl != NULL )
		{
			UserGroupLink *uglrem = ugl;
			ugl = (UserGroupLink *)ugl->node.mln_Succ;
			FFree( uglrem );
		}
		
		if( strcmp( "false", workgroups ) == 0 )
		{
		
		}
		else
		{
			while( el != NULL )
			{
				UIntListEl *rmEntry = el;
				el = (UIntListEl *)el->node.mln_Succ;
				
				UGMAddUserToGroup( ugm, rmEntry->i_Data, usr->u_ID );
		
				DEBUG("[UMAssignGroupToUserByStringDB] Memory for groups allocated, pos: %d\n", pos );
			
				char loctmp[ 256 ];
				int loctmplen;
					
				// insert to database
				if( pos == 0 )
				{
					loctmplen = snprintf( loctmp, sizeof( loctmp ),  "(%lu, %lu) ", usr->u_ID, rmEntry->i_Data );
					tmplen = snprintf( tmpQuery, sizeof(tmpQuery), "%lu", rmEntry->i_Data );
				}
				else
				{
					loctmplen = snprintf( loctmp, sizeof( loctmp ),  ",(%lu, %lu) ", usr->u_ID, rmEntry->i_Data ); 
					tmplen = snprintf( tmpQuery, sizeof(tmpQuery), ",%lu", rmEntry->i_Data );
				}
				BufStringAdd( bsInsert, loctmp );
				pos++;
			}
		}	// workgroups != "none"
		
		USER_CHANGE_OFF( usr );
		
		// removeing old group conections from DB
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE FROM FUserToGroup WHERE `UserID` = %lu AND `UserGroupID` IN (SELECT ID FROM FUserGroup where Type<>'Level')", usr->u_ID ) ;
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("[UMAssignGroupToUserByStringDB] Cannot call query: '%s'\n", tmpQuery );
		}
	}	// workgroups != NULL

	// add new groups

	if( sqlLib->QueryWithoutResults( sqlLib, bsInsert->bs_Buffer  ) !=  0 )
	{
		FERROR("[UMAssignGroupToUserByStringDB] Cannot call query: '%s'\n", bsInsert->bs_Buffer );
	}
	sb->LibrarySQLDrop( sb, sqlLib );

	// update user about changes
	UserNotifyFSEvent2( usr, "refresh", "Mountlist:" );
	
	if( bsInsert != NULL )
	{
		BufStringDelete( bsInsert );
	}
	
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
	
	DEBUG("[UGMAddUserToGroupDB] Add user: %ld to group %ld\n", userID, groupID );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "INSERT INTO FUserToGroup (UserID, UserGroupID ) VALUES (%lu,%lu)", userID, groupID );
		
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("[UGMAddUserToGroupDB] Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("[UGMAddUserToGroupDB] DBConnection fail!\n");
		return 1;
	}
	return 0;
}

/**
 * Add user to UserGroup users list
 *
 * @param um pointer to UserGroupManager
 * @param groupID ID of group to which user will be added
 * @param userID ID of user which will be assigned to group
 * @return 0 when ssuccess, otherwise error number
 */
int UGMAddUserToGroup( UserGroupManager *um, FULONG groupID, FULONG userID )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	DEBUG("[UGMAddUserToGroup] Add user: %ld to group %ld\n", userID, groupID );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "INSERT INTO FUserToGroup (UserID, UserGroupID ) VALUES (%lu,%lu)", userID, groupID );
		
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("[UGMAddUserToGroup] Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
		
		User *usr = UMGetUserByID( sb->sl_UM, userID );
		if( usr != NULL )
		{
			UserGroup *ug = UGMGetGroupByID( sb->sl_UGM, groupID );
			if( ug != NULL )
			{
				UserAddToGroup( usr, ug );
			}
		}
	}
	else
	{
		FERROR("[UGMAddUserToGroup] DBConnection fail!\n");
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
			FERROR("[UGMRemoveUserFromGroupDB] Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
	}
	else
	{
		FERROR("[UGMRemoveUserFromGroupDB] DBConnection fail!\n");
		return 1;
	}
	return 0;
}

/**
 * Remove user from UserGroup
 *
 * @param um pointer to UserGroupManager
 * @param groupID ID of group from which User will be removed
 * @param userID ID of user which will be removed from group
 * @return 0 when ssuccess, otherwise error number
 */
int UGMRemoveUserFromGroup( UserGroupManager *um, FULONG groupID, FULONG userID )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	
	if( sqlLib != NULL )
	{
		char tmpQuery[256];
		snprintf( tmpQuery, sizeof(tmpQuery), "DELETE from `FUserToGroup` where `UserID`=%lu AND `UserGroupID`=%lu", userID, groupID );
		
		if( sqlLib->QueryWithoutResults( sqlLib, tmpQuery ) !=  0 )
		{
			FERROR("[UGMRemoveUserFromGroup] Cannot call query: '%s'\n", tmpQuery );
		}
		
		sb->LibrarySQLDrop( sb, sqlLib );
		
		User *tuser = UMGetUserByID( sb->sl_UM, userID );
		if( tuser != NULL )
		{
			UserRemoveFromGroup( tuser, groupID );
		}
	}
	else
	{
		FERROR("[UGMRemoveUserFromGroup] DBConnection fail!\n");
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
		DEBUG("[UGMGetUserGroupsDB] Get groups assigned to user\n");
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
		FERROR("[UGMGetUserGroupsDB] DBConnection fail!\n");
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
		FERROR("[UGMUserToGroupISConnectedDB] DBConnection fail!\n");
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
 * @param type type of group (filter)
 * @param parentID parentID (filter)
 * @param status group status (filter)
 * @param fParentID if parentID was passed as argument
 * @return TRUE when entry exist, otherwise FALSE
 */
FBOOL UGMGetGroupsDB( UserGroupManager *um, FULONG uid, BufString *bs, const char *type, FULONG parentID, int status, FBOOL fParentID )
{
	SystemBase *sb = (SystemBase *)um->ugm_SB;
	SQLLibrary *sqlLib = sb->LibrarySQLGet( sb );
	FBOOL ret = FALSE;
	
	if( sqlLib != NULL )
	{
		int arg = 0;
		BufString *sqlbs = BufStringNew();
		
		// {\"name\":\"Testers\",\"ID\":24,\"parentid\":0,\"level\":\"Workgroup\",\"status\":0,\"uuid\":\"a33d00704d86fd08b55cce6d036d475f\"}
		BufStringAdd( sqlbs, "SELECT g.Name,g.ID,g.ParentID,g.Type,g.Status,g.UniqueID FROM FUserGroup g" );
		
		if( uid > 0 || type != NULL || parentID > 0 || status > 0 )
		{
			BufStringAdd( sqlbs, " WHERE" );
		}
		
		if( uid > 0 )
		{
			char tmp[ 256 ];
			int tmpi = 0;
			tmpi = snprintf( tmp, sizeof(tmp), " inner join FUserToGroup utg on g.ID=utg.UserGroupID utg.UserID=%lu", uid );
			
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
		
		DEBUG("[UGMGetGroupsDB] Call SQL: %s\n", sqlbs->bs_Buffer );
		
		//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT * FROM FUserToGroup WHERE `UserID`=%lu AND `UserGroupID`=%lu", uid, ugroupid );
		
		void *result = sqlLib->Query( sqlLib, sqlbs->bs_Buffer );
		if( result != NULL )
		{
			int rownr = 0;
			char **row;
			// g.ID,g.UserID,g.ParentID,g.Name,g.Type.g.Status
			
			/*
			ok<!--separate-->{\"groups\":[{\"name\":\"Testers\",\"ID\":24,\"parentid\":0,\"level\":\"Workgroup\",\"status\":0,\"uuid\":\"a33d00704d86fd08b55cce6d036d475f\"},{\"name\":\"FriendUP\",\"ID\":51,\"parentid\":102,\"level\":\"Workgroup\",\"status\":0,\"uuid\":\"a0eb3d4ef1e318c9ff15e56733be1b90\"},{\"name\":\"Administrators\",\"ID\":102,\"parentid\":0,\"level\":\"Workgroup\",\"status\":0,\"uuid\":\"2ff9d98694551abe9e64e68eb4758f7b\"},{\"name\":\"Friend Sky\",\"ID\":248,\"parentid\":0,\"level\":\"Workgroup\",\"status\":2,\"uuid\":\"5d6520ddfd4874050bf7882af94d1388b35ee0f849ef52816766266c4ca95fac\"},{\"name\":\"Lounge\",\"ID\":261,\"parentid\":0,\"level\":\"Workgroup\",\"status\":2,\"uuid\":\"0581c802ceda8151ca6dd815fa3ab64cecfa1defda702e9bdb8f78cea84169be\"},{\"name\":\"29November2021\",\"ID\":549,\"parentid\":0,\"level\":\"Workgroup\",\"status\":2,\"uuid\":\"798ff05116b7b9bb2439a8c0383ec9e7404464e15c0e9453c6bbdb0f936293ed\"}]}
			 */

			while( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				char tmp[ 512 ];
				int tmpi = 0;
				
				//"{\"name\":\"%s\",\"ID\":%lu,\"parentid\":%lu,\"level\":\"%s\",\"status\":%d,\"uuid\":\"%s\"}"
				
				if( rownr == 0 )
				{
					tmpi = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"ID\":%s,\"parentid\":%s,\"level\":\"%s\",\"status\":%s,\"uuid\":\"%s\"}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
				}
				else
				{
					tmpi = snprintf( tmp, sizeof(tmp), ",{\"name\":\"%s\",\"ID\":%s,\"parentid\":%s,\"level\":\"%s\",\"status\":%s,\"uuid\":\"%s\"}", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ], row[ 5 ] );
				}
				rownr++;
				
				BufStringAddSize( bs, tmp, tmpi );
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
		FERROR("[UGMGetGroupsDB] DBConnection fail!\n");
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
	if( FRIEND_MUTEX_LOCK( &(um->ugm_Mutex) ) == 0 )
	{
		UserGroup *lg = um->ugm_UserGroups;
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
			
			DEBUG("[UGMGetGroups] name: %s type: %s\n", lg->ug_Name, lg->ug_Type );
			if( type != NULL )
			{
				if( strcmp( type, lg->ug_Type ) != 0 )
				{
					addToList = FALSE;
				}
			}
			
			if( addToList == TRUE )
			{
				char tmp[ 1024 ];
				int tmpsize = 0;
				if( pos == 0 )
				{
					tmpsize = snprintf( tmp, sizeof(tmp), "{\"name\":\"%s\",\"ID\":%lu,\"parentid\":%lu,\"level\":\"%s\",\"status\":%d,\"uuid\":\"%s\"}", lg->ug_Name, lg->ug_ID, lg->ug_ParentID, lg->ug_Type, lg->ug_Status, lg->ug_UUID );
				}
				else
				{
					tmpsize = snprintf( tmp, sizeof(tmp), ",{\"name\":\"%s\",\"ID\":%lu,\"parentid\":%lu,\"level\":\"%s\",\"status\":%d,\"uuid\":\"%s\"}", lg->ug_Name, lg->ug_ID, lg->ug_ParentID, lg->ug_Type, lg->ug_Status, lg->ug_UUID );
				}
				BufStringAddSize( bs, tmp, tmpsize );
				pos++;
			}
			lg = (UserGroup *)lg->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &(um->ugm_Mutex) );
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
		FERROR("[UGMUserToGroupISConnectedByUNameDB] DBConnection fail!\n");
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
		FERROR("[UGMUserToGroupISConnectedByUIDDB] DBConnection fail!\n");
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
		char tmp[ 1024 ];
		int itmp = 0;
		FULONG currGroupID = 0;
		
		if( type == NULL )
		{
			//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserToGroup utg inner join FUser u on utg.UserID=u.ID inner join FUserGroup ug on utg.UserGroupID=ug.ID order by utg.UserGroupID" );
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime,ug.UniqueID FROM FUserGroup ug left outer join FUserToGroup utg on ug.ID=utg.UserGroupID left join FUser u on utg.UserID=u.ID order by utg.UserGroupID" );
		}
		else
		{
			//snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime FROM FUserToGroup utg inner join FUser u on utg.UserID=u.ID inner join FUserGroup ug on utg.UserGroupId=ug.ID WHERE ug.Type='%s' order by utg.UserGroupID", type );
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT ug.ID,ug.Name,ug.ParentID,ug.Type,u.UniqueID,u.Status,u.ModifyTime,ug.UniqueID FROM FUserGroup ug left outer join FUserToGroup utg on ug.ID=utg.UserGroupID left join FUser u on utg.UserID=u.ID WHERE ug.Type='%s' order by utg.UserGroupID", type );
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
						itmp = snprintf( tmp, sizeof(tmp), "{\"id\":%lu,\"uuid\":\"%s\",\"name\":\"%s\",\"type\":\"%s\",\"parentid\":%lu,\"userids\":[", groupid, (char *)row[7], (char *)row[1], (char *)row[3], parentid );
					}
					else
					{
						itmp = snprintf( tmp, sizeof(tmp), "]},{\"id\":%lu,\"uuid\":\"%s\",\"name\":\"%s\",\"type\":\"%s\",\"parentid\":%lu,\"userids\":[", groupid, (char *)row[7], (char *)row[1], (char *)row[3], parentid );
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
