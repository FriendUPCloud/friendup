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
 *  User Group
 *
 * file contain funuctions related to user groups
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_group.h"
#include <system/fsys/device_handling.h>
#include <util/string.h>
#include <system/systembase.h>

/**
 * Create new User Group
 *
 * @param id unique value which will point to UserGroup
 * @param name of new UserGroup
 * @param uid id of user assigned to group
 * @param type type of group as string
 * @param description
 * @return new UserGroup structure when success, otherwise NULL
 */
UserGroup *UserGroupNew( FULONG id, char *name, FULONG uid, char *type, char *description )
{
	UserGroup *ug = NULL;
	
	if( ( ug = FCalloc( 1, sizeof( UserGroup ) ) ) != NULL )
	{
		int len = strlen( name );
		
		ug->ug_ID = id;
		ug->ug_Name = StringDuplicate(name);
		ug->ug_UserID = uid;
		ug->ug_Type = StringDuplicate(type);
		ug->ug_Description = StringDuplicate( description );
		
		UserGroupInit( ug );
	}
	
	return ug;
}

/**
 * Create new User Group
 *
 * @param ug pointer to UserGroup
 */
void UserGroupInit( UserGroup *ug )
{
	if( ug != NULL )
	{
		pthread_mutex_init( &(ug->ug_Mutex), NULL );
	}
}

/**
 * Delete UserGroup
 *
 * @param sb pointer to SystemBase
 * @param ug pointer to UserGroup which will be deleted
 * @return 0 when success, otherwise error number
 */
int UserGroupDelete( void *sb, UserGroup *ug )
{
	if( ug != NULL )
	{
		// remove connection to users
		
		if( FRIEND_MUTEX_LOCK( &(ug->ug_Mutex) ) == 0 )
		{
			GroupUserLink *au = ug->ug_UserList;
			GroupUserLink *remau;
			while( au != NULL )
			{
				remau = au;
				au = (GroupUserLink *)au->node.mln_Succ;
			
				FFree( remau );
			}
			FRIEND_MUTEX_UNLOCK( &(ug->ug_Mutex) );
		}
		
		// Remove all mounted devices
		File *lf = ug->ug_MountedDevs;
		File *remdev = lf;
		while( lf != NULL )
		{
			remdev = lf;
			lf = (File *)lf->node.mln_Succ;
			
			if( remdev != NULL )
			{
				DeviceRelease( sb, remdev );

				FileDelete( remdev );
				remdev = NULL;
			}
		}

		if( ug->ug_Name != NULL )
		{
			FFree( ug->ug_Name );
		}
		
		if( ug->ug_Type != NULL )
		{
			FFree( ug->ug_Type );
		}
		
		if( ug->ug_Description != NULL )
		{
			FFree( ug->ug_Description );
		}
		
		pthread_mutex_destroy( &(ug->ug_Mutex) );
		
		FFree( ug );
	}
	return 0;
}

/**
 * Delete all UserGroups from list
 *
 * @param sb pointer to SystemBase
 * @param ug pointer to root of UserGroup list which will be deleted
 * @return 0 when success, otherwise error number
 */
int UserGroupDeleteAll( void *sb, UserGroup* ug)
{
	UserGroup *rem = ug;
	UserGroup *next = ug;
	
	while( next != NULL )
	{
		rem = next;
		next = (UserGroup *)next->node.mln_Succ;
		
		UserGroupDelete( sb, rem );
	}
	
	return 0;
}

/**
 * Remove device by name from UserGroup
 *
 * @param ugrlist pointer to first UserGroup list root
 * @param name pointer to name of device which will be removed
 * @param error pointer to int variable where error number will be stured
 * @return pointer to File structure which will be removed from User structure
 */
File *UserGroupRemDeviceByName( UserGroup *ugrlist, const char *name, int *error )
{
	if( name != NULL )
	{
		while( ugrlist != NULL )
		{
			File *lf = ugrlist->ug_MountedDevs;
			File *lastone = NULL;
			File *remdev = NULL;
			if( lf == NULL )
			{
				FERROR( "[UserGroupRemDeviceByName] Seems we have NO mounted devs for usergroup %s!\n", ugrlist->ug_Name );
				continue;
			}

			while( lf != NULL )
			{
				//DEBUG( "[UserGroupRemDeviceByName] Checking fs in list %s == %s...\n", lf->f_Name, name );
				if( strcmp( lf->f_Name, name ) == 0 )
				{
					//DEBUG( "[UserGroupRemDeviceByName] Found one (%s == %s)\n", lf->f_Name, name );
					remdev = lf;
					break;
				}
				lastone = lf;
				lf = (File *)lf->node.mln_Succ;
			}
		
			if( remdev != NULL )
			{
				if( remdev->f_Operations <= 0 )
				{
					//DEBUG("[UserGroupRemDeviceByName] Remove device from list\n");

					if( ugrlist->ug_MountedDevs == remdev )		// checking if its our first entry
					{
						File *next = (File*)remdev->node.mln_Succ;
						ugrlist->ug_MountedDevs = (File *)next;
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
					return remdev;
				}
				else
				{
					*error = FSys_Error_OpsInProgress;
					return remdev;
				}
			
				ugrlist = (UserGroup *)ugrlist->node.mln_Succ;
			}
		}
	}
	else
	{
		DEBUG("[UserGroupRemDeviceByName] User paramter is equal to NULL\n");
		return NULL;
	}
	return NULL;
}

/**
 * Add user to UserGroup users list
 *
 * @param ug pointer to UserGroup to which user will be added
 * @param u pointer to User structure which will be added to list
 * @return 0 when ssuccess, otherwise error number
 */
int UserGroupAddUser( UserGroup *ug, void *u )
{
	if( ug == NULL || u == NULL )
	{
		DEBUG("One value is equal to NULL. ug %p u %p\n", ug, u );
		return 3;
	}
	User *locu = (User *)u;
	
	//DEBUG("[UserGroupAddUser] User: %s will be added to group: %s\n", locu->u_Name, ug->ug_Name );
	if( FRIEND_MUTEX_LOCK( &locu->u_Mutex ) == 0 )
	{
		GroupUserLink *au = ug->ug_UserList;
		while( au != NULL )
		{
			// user is added, no need to add it second time
			if( au->ugau_User != NULL && locu->u_ID == au->ugau_UserID )
			{
				FRIEND_MUTEX_UNLOCK( &locu->u_Mutex );
				return 1;
			}
			au = (GroupUserLink *)au->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &locu->u_Mutex );
	
		// add link from group to user
		if( ( au = (GroupUserLink *) FCalloc( 1, sizeof( GroupUserLink ) ) ) != NULL )
		{
			// add link from user to group
			UserGroupLink *ugl = (UserGroupLink *)FCalloc( 1, sizeof(UserGroupLink ) );
			if( ugl != NULL )
			{
				ugl->ugl_Group = ug;
				ugl->ugl_GroupID = ug->ug_ID;
				if( FRIEND_MUTEX_LOCK( &locu->u_Mutex ) == 0 )
				{
					ugl->node.mln_Succ = (MinNode *) locu->u_UserGroupLinks;
					locu->u_UserGroupLinks = ugl;
					FRIEND_MUTEX_UNLOCK( &locu->u_Mutex );
				}
				else
				{
					FFree( ugl );
					ugl = NULL;
				}
			}
			
			au->ugau_UserID = locu->u_ID;
			au->ugau_User = locu;
			
			if( FRIEND_MUTEX_LOCK( &(ug->ug_Mutex) ) == 0 )
			{
				au->node.mln_Succ = (MinNode *)ug->ug_UserList;
				ug->ug_UserList = au;
				FRIEND_MUTEX_UNLOCK( &(ug->ug_Mutex) );
			}
			else
			{
				if( ugl != NULL )
				{
					FFree( ugl );
				}
				FFree( au );
			}
		}
		else
		{
			return 2;
		}
		
	}
	//DEBUG("[UserGroupAddUser] end\n");
	
	return 0;
}

/**
 * Remove user from UserGroup users list
 *
 * @param ug pointer to UserGroup to which user will be removed
 * @param u pointer to User structure which will be removed from list
 * @return 0 when success, otherwise error number
 */
int UserGroupRemoveUser( UserGroup *ug, void *u )
{
	if( ug == NULL || u == NULL )
	{
		DEBUG("One value is equal to NULL. ug %p u %p\n", ug, u );
		return 3;
	}
	User *locu = (User *)u;
	
	//DEBUG("[UserGroupRemoveUser] user: %s will be removed from: %s\n", locu->u_Name, ug->ug_Name );
	if( FRIEND_MUTEX_LOCK( &ug->ug_Mutex ) == 0 )
	{
		GroupUserLink *au = ug->ug_UserList;
		GroupUserLink *auprev = ug->ug_UserList;
	
		while( au != NULL )
		{
			// user is added, no need to add it second time
			if( au->ugau_User != NULL && locu == au->ugau_User )
			{
				if( au == ug->ug_UserList )
				{
					ug->ug_UserList = (GroupUserLink *) au->node.mln_Succ;
				}
				else
				{
					auprev->node.mln_Succ = au->node.mln_Succ;
				}
				FFree( au );
				break;
			}

			auprev = au;
			au = (GroupUserLink *)au->node.mln_Succ;
		}
		FRIEND_MUTEX_UNLOCK( &ug->ug_Mutex );
	}
		
	if( FRIEND_MUTEX_LOCK( &locu->u_Mutex ) == 0 )
	{
		// remove entry from user list
		UserGroupLink *ull = locu->u_UserGroupLinks;
		UserGroupLink *ullprev = locu->u_UserGroupLinks;
		while( ull != NULL )
		{
			if( ull->ugl_Group != NULL && ug == ull->ugl_Group )
			{
				if( ull == locu->u_UserGroupLinks )
				{
					locu->u_UserGroupLinks = (UserGroupLink *) ull->node.mln_Succ;
				}
				else
				{
					ullprev->node.mln_Succ = ull->node.mln_Succ;
				}
				FFree( ull );
				break;
			}
			ullprev = ull;
			ull = (UserGroupLink *)ull->node.mln_Succ;
		}
		//locu->u_UserGroupLinks = NULL;
		
		FRIEND_MUTEX_UNLOCK( &locu->u_Mutex );
	}
	//DEBUG("[UserGroupRemoveUser] end\n");
	return 0;
}

/**
 * Remove user from all UserGroup users list
 *
 * @param ug pointer to UserGroup to which user will be removed
 * @param u pointer to User structure which will be removed from list
 * @return 0 when success, otherwise error number
 */
int UserGroupRemoveUserFromAll( UserGroup *ug, void *u )
{
	if( ug == NULL || u == NULL )
	{
		DEBUG("One value is equal to NULL. ug %p u %p\n", ug, u );
		return 3;
	}
	User *locu = (User *)u;
	
	// remove user->group link
	if( FRIEND_MUTEX_LOCK( &locu->u_Mutex ) == 0 )
	{
		// go through all groups connected to user
		// and remove user from them
		UserGroupLink *ull = locu->u_UserGroupLinks;
		while( ull != NULL )
		{
			UserGroupLink *rem = ull;
			ull = (UserGroupLink *)ull->node.mln_Succ;
			FFree( rem );
		}
		locu->u_UserGroupLinks = NULL;
		
		FRIEND_MUTEX_UNLOCK( &locu->u_Mutex );
		
		if( FRIEND_MUTEX_LOCK( &ug->ug_Mutex ) == 0 )
		{
			GroupUserLink *au = ug->ug_UserList;
			GroupUserLink *newListEntryRoot = NULL, *lastListEntry = NULL;
	
			while( au != NULL )
			{
				GroupUserLink *rem = NULL;
				// user is added, no need to add it second time
				if( au->ugau_User != NULL && locu == au->ugau_User )
				{
					rem = au;
				}
				else // if entry should stay we create new list
				{
					if( newListEntryRoot == NULL )
					{
						newListEntryRoot = au;
						lastListEntry = au;
					}
					else
					{
						lastListEntry->node.mln_Succ = (MinNode *)au;
						lastListEntry = au;
					}
				}
				
				au = (GroupUserLink *)au->node.mln_Succ;
				if( rem != NULL )
				{
					FFree( rem );
				}
			}
			ug->ug_UserList = newListEntryRoot;
			
			FRIEND_MUTEX_UNLOCK( &ug->ug_Mutex );
		}
	}
	
	//DEBUG("[UserGroupRemoveUser] end\n");
	return 0;
}
