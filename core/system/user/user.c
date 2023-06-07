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
 *  User
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "user.h"
#include <system/systembase.h>
#include <system/cache/cache_user_files.h>
#include <util/session_id.h>

/**
 * Create new User
 *
 * @return new User structure when success, otherwise NULL
 */
User *UserNew( )
{
	User *u;
	if( ( u = FCalloc( 1, sizeof( User ) ) ) != NULL )
	{
		UserInit( u );
		
		GenerateUUID( &( u->u_UUID ) );
	}
	else
	{
		FERROR("Cannot allocate memory for user\n");
	}
	
	return u;
}

/**
 * Initialize User structure
 *
 * @param u pointer to memory where poiniter to User is stored
 * @return 0 when success, otherwise error number
 */
int UserInit( User *u )
{
	// First make sure we don't have a duplicate!
	if( u == NULL )
	{
		FERROR("User provided = NULL\n");
		return -1;
	}
	
	DEBUG( "[UserInit] Attempting to initialize mutex on new user. Pointer to new user %p\n", u );
	
	pthread_mutex_init( &(u->u_Mutex), NULL );
	
	//u->u_FileCache = CacheUserFilesNew( u->u_ID );
	
	return 0;
}

/**
 * Add UserSession to User
 *
 * @param usr pointer to User structure
 * @param ls pointer to UserSession which will be added
 * @return 0 when success, otherwise error number
 */
int UserAddSession( User *usr, void *ls )
{
	int del = 10;
	if( usr == NULL || ls == NULL )
	{
		FERROR("User %p or session %p are empty\n", usr, ls );
		return 1;
	}
	UserSession *newSession = (UserSession *)ls;
	UserSessListEntry *us = NULL;
	
	// test
	/*
	while( usr->u_InUse > 0 )
	{
		DEBUG("[UserAddSession] in loop : %d\n", usr->u_InUse );
		usleep( 5000 );
		
		if( ( del-- ) <= 0 ) break;
	}
	*/
	
	USER_CHANGE_ON( usr );
	
	UserSessListEntry *exses = (UserSessListEntry *)usr->u_SessionsList;
	while( exses != NULL )
	{
		UserSession *locSession = (UserSession *)exses->us;
		if( exses->us == ls || (locSession->us_DeviceIdentity != NULL && newSession->us_DeviceIdentity != NULL && strcmp( locSession->us_DeviceIdentity, newSession->us_DeviceIdentity ) == 0 ) )
		{
			DEBUG("[UserAddSession] Session was already added to user\n");
			USER_CHANGE_OFF( usr );
			return 0;
		}
		exses = (UserSessListEntry *) exses->node.mln_Succ;
	}
	
	if( ( us = FCalloc( 1, sizeof( UserSessListEntry ) ) ) != NULL )
	{
		us->us = newSession;
		newSession->us_User = usr;	// assign user to session
		newSession->us_UserID = usr->u_ID;
		
		us->node.mln_Succ = (MinNode *)usr->u_SessionsList;
		usr->u_SessionsList = us;
		DEBUG("[UserAddSession] LIST OVERWRITEN: %p\n", usr->u_SessionsList );
	
		usr->u_SessionsNr++;
	}
	USER_CHANGE_OFF( usr );
	
	return 0;
}

/**
 * Remove UserSession from User
 *
 * @param usr pointer to User from which UserSession will be removed
 * @param ls pointer to UserSession which will be removed
 * @return number of attached to user sessions left
 */
int UserRemoveSession( User *usr, void *ls )
{
	int retVal = -1;
	int del = 5;
	UserSession *remses = (UserSession *)ls;
	if( usr  == NULL || ls == NULL )//|| remses->us_User == NULL )
	{
		FERROR("Cannot remove user session, its not connected to user\n");
		return -1;
	}
	/*
	DEBUG("[UserRemoveSession]\n");
	while( usr->u_InUse > 0 )
	{
		DEBUG("[UserRemoveSession] in loop : %d\n", usr->u_InUse );
		usleep( 5000 );
		
		if( ( del-- ) <= 0 ) break;
	}
	*/
	
	DEBUG("[UserRemoveSession] after in use, %d\n", usr->u_InUse );
	
	USER_CHANGE_ON( usr );
	
	UserSessListEntry *newRoot = NULL;
	UserSessListEntry *actus = (UserSessListEntry *)usr->u_SessionsList;
	while( actus != NULL )
	{
		UserSessListEntry *curus = actus;
		actus = (UserSessListEntry *)actus->node.mln_Succ;
		if( curus->us == remses )
		{
			usr->u_SessionsNr--;
			FFree( curus );
		}
		else
		{
			curus->node.mln_Succ = (MinNode *)newRoot;
			newRoot = curus;
		}
	}
	
	usr->u_SessionsList = newRoot;
	
	retVal = usr->u_SessionsNr;
	remses->us_User = NULL;
	
	USER_CHANGE_OFF( usr );
	
	return retVal;
}

/**
 * Remove User structure
 *
 * @param usr pointer to User structure which will be deleted
 */
void UserDelete( User *usr )
{
	if( usr != NULL )
	{
		if( usr->u_Status == USER_STATUS_TO_BE_REMOVED )
		{
			Log( FLOG_INFO, "Cannot remove user. It will be removed: %s\n", usr->u_Name );
			return;
		}
		Log( FLOG_INFO, "User removed from memory: %s\n", usr->u_Name );
		
		usr->u_Status = USER_STATUS_TO_BE_REMOVED;
		
		// Do not release User resources when structure is used
		while( usr->u_InUse > 0 )
		{
			usleep( 5000 );
		}

		USER_CHANGE_ON( usr );
		
		if( usr->u_Printers != NULL )
		{
			usr->u_Printers = PrinterDeleteAll( usr->u_Printers );
		}
		
		if( usr->u_Applications != NULL )
		{
			UserAppDeleteAll( usr->u_Applications );
			usr->u_Applications = NULL;
		}
		
		if( usr->u_FileCache != NULL )
		{
			CacheUserFilesDelete( usr->u_FileCache );
			usr->u_FileCache = NULL;
		}
		
		// remove all sessions connected to user
		
		UserSessListEntry *us = (UserSessListEntry *)usr->u_SessionsList;
		usr->u_SessionsList = NULL;
		UserSessListEntry *delus = us;
		while( us != NULL )
		{
			delus = us;
			us = (UserSessListEntry *)us->node.mln_Succ;
		
			FFree( delus );
		}

		// remove all remote users and drives
	
		RemoteUserDeleteAll( usr->u_RemoteUsers );

		USER_CHANGE_OFF( usr );
			
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		while( ugl != NULL )
		{
			UserGroupLink *n = (UserGroupLink *)ugl->node.mln_Succ;
			//UserGroupRemoveUser( usr->u_Groups[i], usr );
			//UserGroupRemoveUser( ugl->ugl_Group, usr );
			FFree( ugl );
			ugl = n;
		}

		//UserDeleteGroupLinkAll( usr->u_UserGroupLinks );
		usr->u_UserGroupLinks = NULL;
		
		
		if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
		{
			if( usr->u_Email ){ FFree( usr->u_Email );}
			
			if( usr->u_Timezone ){ FFree( usr->u_Timezone );}
		
			if( usr->u_FullName ){ FFree( usr->u_FullName );}
		
			if( usr->u_Name ){ FFree( usr->u_Name );}
		
			if( usr->u_Password ){ FFree( usr->u_Password );}
		
			if( usr->u_UUID ){ FFree( usr->u_UUID );}
		
			FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
		}
		
		pthread_mutex_destroy( &(usr->u_Mutex) );
		
		FFree( usr );
	}
}

/**
 * Remove User connected sessions
 *
 * @param usr pointer to root User
 * @param release says if sessionentry should be removed or only pointer to user in a session should be removed
 */
void UserRemoveConnectedSessions( User *usr, FBOOL release )
{
	USER_CHANGE_ON( usr );

	UserSessListEntry *us = (UserSessListEntry *)usr->u_SessionsList;
	UserSessListEntry *delus = us;
	
	if( release )
	{
		while( us != NULL )
		{
			delus = us;
			us = (UserSessListEntry *)us->node.mln_Succ;
	
			UserSession *locses = (UserSession *)delus->us;
			locses->us_User = NULL;
			FFree( delus );
		}
		usr->u_SessionsList = NULL;
	}
	else
	{
		while( us != NULL )
		{
			delus = us;
			us = (UserSessListEntry *)us->node.mln_Succ;
	
			UserSession *locses = (UserSession *)delus->us;
			locses->us_User = NULL;
		}
	}

	USER_CHANGE_OFF( usr );
}

/**
 * Remove User structures connected via node list
 *
 * @param usr pointer to root User structure which will be deleted
 * @return 0 when success, otherwise error number
 */
int UserDeleteAll( User *usr )
{
	User *rem = usr;
	User *next = usr;
	
	while( next != NULL )
	{
		rem = next;
		next = (User *)next->node.mln_Succ;
		
		UserDelete( rem );
	}
	return 0;
}

/**
 * Add Device to User
 *
 * @param usr pointer to User structure to which root File will be added
 * @param file pointer to Device root file
 * @return 0 when success, otherwise error number
 */
int UserAddDevice( User *usr, File *file )
{
	if( usr != NULL && file != NULL )
	{
		USER_CHANGE_ON( usr );
		
		File *lfile = usr->u_MountedDevs;
		
		while( lfile != NULL )
		{
			if( strcmp( file->f_Name, lfile->f_Name ) == 0 )
			{
				DEBUG("Device is already in the list %lu name: %s\n", file->f_ID, file->f_Name );
				USER_CHANGE_OFF( usr );
				return 2;
			}
			lfile = (File *)lfile->node.mln_Succ;
		}
		
		lfile = usr->u_MountedDevs;
		// Without macro
		if( usr->u_MountedDevs != NULL )
		{
			usr->u_MountedDevs = file;
			lfile->node.mln_Pred = (MinNode *)file;
			file->node.mln_Succ = (MinNode *)lfile;
		}
		else
		{
			usr->u_MountedDevs = file;
		}
		usr->u_MountedDevsNr++;
		
		USER_CHANGE_OFF( usr );
	}
	else
	{
		DEBUG("User or File paramter is equal to NULL\n");
		return 1;
	}
	return 0;
}

/**
 * Remove device by name
 *
 * @param usr pointer to User from which device will be removed
 * @param name pointer to name of device which will be removed
 * @param error pointer to int variable where error number will be stured
 * @return pointer to File structure which will be removed from User structure
 */
File *UserRemDeviceByName( User *usr, const char *name, int *error )
{
	if( usr != NULL && name != NULL )
	{
		File *remdev = NULL;
		File *lastone = NULL;
		UserGroupLink *groupLink = NULL;
		
		USER_CHANGE_ON( usr );
		
		File *lf = usr->u_MountedDevs;
		
		while( lf != NULL )
		{
			DEBUG( "[UserRemDeviceByName] Checking fs in list %s == %s...\n", lf->f_Name, name );
			if( strcmp( lf->f_Name, name ) == 0 )
			{
				DEBUG( "[UserRemDeviceByName] Found one (%s == %s)\n", lf->f_Name, name );
				remdev = lf;
				break;
			}
			lastone = lf;
			lf = (File *)lf->node.mln_Succ;
		}
		
		if( remdev == NULL )
		{
			lastone = NULL;
			
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			{
				lf = ugl->ugl_Group->ug_MountedDevs;
				
				DEBUG( "[UserRemDeviceByName] check group: %s\n",  ugl->ugl_Group->ug_Name );
		
				while( lf != NULL )
				{
					DEBUG( "[UserRemDeviceByName] next device: %s\n", lf->f_Name );
					
					// now we must check if user created drive or if he is admin
					if( lf->f_UserID == usr->u_ID || usr->u_IsAdmin == TRUE )
					{
						DEBUG( "[UserRemDeviceByName] Checking in group fs in list %s == %s...\n", lf->f_Name, name );
						if( strcmp( lf->f_Name, name ) == 0 )
						{
							DEBUG( "[UserRemDeviceByName] Found one in group (%s == %s)\n", lf->f_Name, name );
							remdev = lf;
							groupLink = ugl;
							break;
						}
					}
					lastone = lf;
					lf = (File *)lf->node.mln_Succ;
				}
				
				if( groupLink != NULL )
				{
					break;
				}
				
				ugl = (UserGroupLink *)ugl->node.mln_Succ;
			}
		}
		
		USER_CHANGE_OFF( usr );
		
		if( remdev != NULL )
		{
			int retry = 50;
			while( remdev->f_Operations > 0 )
			{
				usleep( 5000 );
				if( retry-- <= 0 ) break;	// quit in case
			}
			
			USER_CHANGE_ON( usr );
			
			DEBUG("[UserRemDeviceByName] Remove device from list\n");
			
			// first we check if device was removed from user group
			
			if( groupLink != NULL )
			{
				// remove device from list
				
				lf = groupLink->ugl_Group->ug_MountedDevs;
				
				// remove device from list
	
				if( groupLink->ugl_Group->ug_MountedDevs == remdev )		// checking if its our first entry
				{
					File *next = (File*)remdev->node.mln_Succ;
					groupLink->ugl_Group->ug_MountedDevs = (File *)next;
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
				
				// we have to check if group have device mounted, if not it should be removed
				
				//TODO remove group if its empty
			} // seems device was user device
			else
			{
				usr->u_MountedDevsNr--;
		
				if( usr->u_MountedDevs == remdev )		// checking if its our first entry
				{
					File *next = (File*)remdev->node.mln_Succ;
					usr->u_MountedDevs = (File *)next;
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
			
			USER_CHANGE_OFF( usr );
			return remdev;
		}
	}
	else
	{
		DEBUG("[UserRemDeviceByName] User or File paramter is equal to NULL\n");
		return NULL;
	}
	return NULL;
}

typedef struct RemDrive{
	File *tbr;
	MinNode node;
}RemDrive;

/**
 * Remove device by name
 *
 * @param usr pointer to User from which device will be removed
 * @param grid ID of the group which drive will be detached from user
 * @param error pointer to int variable where error number will be stured
 * @return pointer to File structure which will be removed from User structure
 */
File *UserRemDeviceByGroupID( User *usr, FULONG grid, int *error )
{
	if( usr != NULL )
	{
		USER_CHANGE_ON( usr );
		
		File *lf = usr->u_MountedDevs;
		File *newRoot = NULL;
		
		while( lf != NULL )
		{
			File *leaveDrive = NULL;
			DEBUG( "[UserRemDeviceByName] Checking fs in list %lu == %lu...\n",  lf->f_UserGroupID, grid );
			if( lf->f_UserGroupID == grid )
			{
				DEBUG( "[UserRemDeviceByName] Found one (%lu == %lu) fname: %s\n",  lf->f_UserGroupID, grid, lf->f_Name );
				
				do{
					*error = 0;
				
					if( lf->f_Operations <= 0 )
					{
						FHandler *fsys = (FHandler *)lf->f_FSys;
						fsys->Release( fsys, lf );	// release drive data
						usleep( 500 );
					}
					else
					{
						DEBUG("[UserRemDeviceByName] Cannot unmount device, operation in progress\n");
						*error = FSys_Error_OpsInProgress;
					}
		
				}while( *error == FSys_Error_OpsInProgress );
			}
			else
			{
				leaveDrive = lf;
			}
			lf = (File *)lf->node.mln_Succ;
			
			if( leaveDrive != NULL )
			{
				leaveDrive->node.mln_Succ = (MinNode *)newRoot;
				newRoot = leaveDrive;
			}
		}
		
		usr->u_MountedDevs = newRoot;
		
		USER_CHANGE_OFF( usr );
		
		/*
		RemDrive *tbrroot = NULL;
		
		File *remdev = NULL;
		File *lastone = NULL;
		
		
		if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
		{
			File *lf = usr->u_MountedDevs;
			
			while( lf != NULL )
			{
				DEBUG( "[UserRemDeviceByName] Checking fs in list %lu == %lu...\n",  lf->f_UserGroupID, grid );
				if( lf->f_UserGroupID == grid )
				{
					DEBUG( "[UserRemDeviceByName] Found one (%lu == %lu) fname: %s\n",  lf->f_UserGroupID, grid, lf->f_Name );
					
					RemDrive *loc = FCalloc( 1, sizeof(RemDrive) );
					loc->tbr = lf;
					if( tbrroot == NULL )
					{
						tbrroot = loc;
					}
					else
					{
						loc->node.mln_Succ = (MinNode *)tbrroot;
						tbrroot = loc;
					}
					//break;
				}
				lf = (File *)lf->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
		}
		
		while( tbrroot != NULL )
		{
			File *remdev = tbrroot->tbr;
			RemDrive *freedrive = tbrroot;
			
			do{
				*error = 0;
				
				if( remdev->f_Operations <= 0 )
				{
					DEBUG("[UserRemDeviceByName] Remove device from list\n");
				
					if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
					{
						File *lf = usr->u_MountedDevs;
						lastone = lf;
			
						// go through list, becaouse we need "lastone"
						while( lf != NULL )
						{
							DEBUG( "[UserRemDeviceByName] Checking fs in list %lu == %lu...\n",  lf->f_UserGroupID, grid );
							if( lf->f_UserGroupID == grid )
							{
								break;
							}
							lastone = lf;
							lf = (File *)lf->node.mln_Succ;
						}
						
						// remove drive from list
						usr->u_MountedDevsNr--;
			
						if( usr->u_MountedDevs == remdev )		// checking if its our first entry
						{
							File *next = (File*)remdev->node.mln_Succ;
							usr->u_MountedDevs = (File *)next;
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
						FRIEND_MUTEX_UNLOCK(&usr->u_Mutex);
					}
					
					if( remdev != NULL )
					{
						FHandler *fsys = (FHandler *)remdev->f_FSys;
						fsys->Release( fsys, remdev );	// release drive data
					}
					usleep( 500 );
				}
				else
				{
					DEBUG("[UserRemDeviceByName] Cannot unmount device, operation in progress\n");
					*error = FSys_Error_OpsInProgress;
				}

			}while( *error == FSys_Error_OpsInProgress );
			
			tbrroot = (RemDrive *)tbrroot->node.mln_Succ;
			if( freedrive != NULL )
			{
				FFree( freedrive );
			}
		} // while tbrroot
		*/
	}
	else
	{
		DEBUG("[UserRemDeviceByName] User or File paramter is equal to NULL\n");
		return NULL;
	}
	return NULL;
}

/**
 * Get User Device by Name
 *
 * @param usr pointer to User structure
 * @param name name of device
 * @return pointer to File if user have mounted drive, otherwise NULL
 */
File *UserGetDeviceByName( User *usr, const char *name )
{
	USER_LOCK( usr );
	
	File *lfile = usr->u_MountedDevs;
	
	while( lfile != NULL )
	{
		if( strcmp( name, lfile->f_Name ) == 0 )
		{
			DEBUG("Device found: %s\n", name );
			USER_UNLOCK( usr );
			return lfile;
		}
		lfile = (File *)lfile->node.mln_Succ;
	}
	
	// file not found, we have to try to check if drive is workgroup drive
	
	UserGroupLink *ugl = usr->u_UserGroupLinks;
	while( ugl != NULL )
	{
		UserGroup *ug = (UserGroup *) ugl->ugl_Group;
		lfile = ug->ug_MountedDevs;
	
		while( lfile != NULL )
		{
			if( strcmp( name, lfile->f_Name ) == 0 )
			{
				DEBUG("Device found: %s\n", name );
				USER_UNLOCK( usr );
				return lfile;
			}
			lfile = (File *)lfile->node.mln_Succ;
		}
		ugl = (UserGroupLink *)ugl->node.mln_Succ;
	}
	
	USER_UNLOCK( usr );
	
	return NULL;
}

/**
 * Get file by path
 *
 * @param usr pointer to user to which devices belong
 * @param dstpath pointer to pointer where file path will be stored (without device)
 * @param path path to file
 * @return when device exist and its avaiable then pointer to it is returned
 */

// NB: This one is not thread safe. Lock mutex before use!
File *UserGetDeviceByPath( User *usr, char **dstpath, const char *path )
{
	File *fhand = NULL;
	char ddrivename[ 256 ];

	int dpos = ColonPosition( path );
	strncpy( ddrivename, path, dpos );
	ddrivename[ dpos ] = 0;

	// Make sure we have a valid path!
	int pl = strlen( path );
	int i = 0; int success = 0;
	for( ; i < pl; i++ )
	{
		if( path[i] == ':' )
		{
			success++;
			break;
		}
	}
	if( success <= 0 )
	{
		FERROR("Path is not correct\n");
		return NULL;
	}

	*dstpath = (char *)&path[ dpos + 1 ];
	DEBUG("[GetFileByPath] Get handle by path!\n");

	if( usr != NULL )
	{
		USER_LOCK( usr );
		
		File *ldr = usr->u_MountedDevs;
		while( ldr != NULL )
		{ 
			if( strcmp( ldr->f_Name, ddrivename ) == 0 )
			{
				fhand = ldr;
				break;
			}
			ldr = (File *) ldr->node.mln_Succ;
		}
		
		if( fhand == NULL )
		{
			UserGroupLink *ugl = usr->u_UserGroupLinks;
			while( ugl != NULL )
			{
				UserGroup *ug = (UserGroup *) ugl->ugl_Group;
				File *lfile = ug->ug_MountedDevs;
	
				while( lfile != NULL )
				{
					if( strcmp( ddrivename, lfile->f_Name ) == 0 )
					{
						DEBUG("Device found: %s\n", ddrivename );
						fhand = lfile;
						break;
					}
					lfile = (File *)lfile->node.mln_Succ;
				}
				if( fhand != NULL )
				{
					break;
				}
				ugl = (UserGroupLink *)ugl->node.mln_Succ;
			}
		}
		
		USER_UNLOCK( usr );
	}
	return fhand;
}

/**
 * Delete UserGRoupLinkEntry
 *
 * @param ugl pointer to UserGroupLink
 */

void UserDeleteGroupLink( UserGroupLink *ugl )
{
	if( ugl != NULL )
	{
		FFree( ugl );
	}
}

/**
 * Delete All UserGRoupLinkEntry's
 *
 * @param ugl pointer to UserGroupLink root entry
 */

void UserDeleteGroupLinkAll( UserGroupLink *ugl )
{
	while( ugl != NULL )
	{
		UserGroupLink *re = ugl;
		ugl = (UserGroupLink *)ugl->node.mln_Succ;
		
		UserDeleteGroupLink( re );
	}
}

/**
 * Remove user from all groups
 * 
 * @param u pointer to User
 */
/*
void UserRemoveFromGroups( User *u )
{
	if( u == NULL )
	{
		return;
	}
	
	DEBUG("[UserRemoveFromGroups] remove start\n");
	// remove user from group first
	
	UserGroupLink *ugl = u->u_UserGroupLinks;
	while( ugl != NULL )
	{
		if( ugl->ugl_Group != NULL )
		{
			if( FRIEND_MUTEX_LOCK( &ugl->ugl_Group->ug_Mutex ) == 0 )
			{
				GroupUserLink *au = ugl->ugl_Group->ug_UserList;
				GroupUserLink *auprev = ugl->ugl_Group->ug_UserList;
	
				while( au != NULL )
				{
					// user is added, no need to add it second time
					if( au->ugau_User != NULL && u == au->ugau_User )
					{
						if( au == ugl->ugl_Group->ug_UserList )
						{
							ugl->ugl_Group->ug_UserList = (GroupUserLink *) au->node.mln_Succ;
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
				FRIEND_MUTEX_UNLOCK( &ugl->ugl_Group->ug_Mutex );
			}
		}
		ugl = (UserGroupLink *)ugl->node.mln_Succ;
	}
	
	DEBUG("[UserRemoveFromGroups] remove before links delete\n");
	// remove all links to group

	USER_CHANGE_ON( u );
	UserDeleteGroupLinkAll( u->u_UserGroupLinks );
	u->u_UserGroupLinks = NULL;
	USER_CHANGE_OFF( u );

	DEBUG("[UserRemoveFromGroups] remove end\n");
}
*/

/**
 * Remove user from all groups
 * 
 * @param sb pointer to SystemBase
 * @param u pointer to User
 */

void UserRemoveFromGroupsDB( void *sb, User *u )
{
	if( u == NULL )
	{
		return;
	}
	
	DEBUG("[UserRemoveFromGroupsDB] remove start\n");
	
	SystemBase *lsb = (SystemBase *)sb;
	SQLLibrary *sqlLib = lsb->LibrarySQLGet( lsb );
	
	if( sqlLib != NULL )
	{
		char query[ 256 ];
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "DELETE FROM FUserToGroup WHERE UserID='%ld", u->u_ID );
		
		sqlLib->QueryWithoutResults( sqlLib, query );

		lsb->LibrarySQLDrop( lsb, sqlLib );
	}

	DEBUG("[UserRemoveFromGroupsDB] remove end\n");
}

/**
 * Check if user is in group
 *
 * @param sb pointer to SystemBase
 * @param usr User
 * @param gid group id 
 * @return TRUE if user is in group, otherwise FALSE
 */

FBOOL UserIsInGroupDB( void *sb, User *usr, FULONG gid )
{
	DEBUG("[UserIsInGroupDB] remove start\n");
	FBOOL isInGroup = FALSE;
	
	SystemBase *lsb = (SystemBase *)sb;
	SQLLibrary *sqlLib = lsb->LibrarySQLGet( lsb );
	
	if( sqlLib != NULL )
	{
		char query[ 1024 ];
		sqlLib->SNPrintF( sqlLib, query, sizeof(query), "SELECT count(*) from FUserToGroup WHERE UserID=%ld AND UserGroupID=%ld", usr->u_ID, gid );
		
		void *result = sqlLib->Query( sqlLib, query );
		if( result != NULL )
		{ 
			char **row;
			if( ( row = sqlLib->FetchRow( sqlLib, result ) ) )
			{
				if( atol( row[ 0 ] ) > 0 )
				{
					isInGroup = TRUE;
				}
			}
			sqlLib->FreeResult( sqlLib, result );
		}
		lsb->LibrarySQLDrop( lsb, sqlLib );
	}

	DEBUG("[UserIsInGroupDB] remove end\n");

	return isInGroup;
}

/**
 * Release User drives
 *
 * @param usr User
 * @param lsb pointer to SystemBase
 */
void UserReleaseDrives( User* usr, void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;
	
	USER_CHANGE_ON( usr );
	
	DEBUG("[UserReleaseDrives] START inuse: %d\n", usr->u_InUse );
	
	File *lf = usr->u_MountedDevs;
	File *remdev = lf;
	while( lf != NULL )
	{
		remdev = lf;
		lf = (File *)lf->node.mln_Succ;
		
		if( remdev != NULL )
		{
			DeviceRelease( sb->sl_DeviceManager, remdev );
		
			FileDelete( remdev );
			remdev = NULL;
		}
	}
	usr->u_MountedDevs = NULL;
	
	DEBUG("[UserReleaseDrives] END inuse: %d\n", usr->u_InUse );
	
	USER_CHANGE_OFF( usr );
}

/**
 * Return information about user sessions
 *
 * @param usr User
 * @param bs pointer to BufString where result will be stored
 * @param sb pointer to SystemBase
 */
void UserListSessions( User* usr, BufString *bs, void *sb )
{
	SystemBase *l = (SystemBase *)sb;
	char *temp = FCalloc( 2048, 1 );
	
	if( temp != NULL )
	{
		USER_LOCK( usr );
		
		UserSessListEntry *sessions = usr->u_SessionsList;
		
		int pos = 0;

		if( usr->u_SessionsNr > 0 )
		{
			while( sessions != NULL )
			{
				if( sessions->us == NULL )
				{
					DEBUG("[UserListSessions] ERR\n");
					sessions = (UserSessListEntry *) sessions->node.mln_Succ;
					continue;
				}
				UserSession *us = (UserSession *) sessions->us;
				
				DEBUG("[UserListSessions] sessionid: %p\n", us );
				
				if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
				{
					us->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
				}

				time_t timestamp = time(NULL);

				if( us->us_WSD != NULL && ( (timestamp - us->us_LastActionTime) < l->sl_RemoveSessionsAfterTime ) )
				{
					WSCData *data = (WSCData *)us->us_WSD;
					if( data != NULL && data->wsc_UserSession != NULL && data->wsc_Wsi != NULL )
					{
						int size = 0;
						if( pos == 0 )
						{
							size = snprintf( temp, 2047, "{\"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\"}", us->us_ID, us->us_DeviceIdentity, us->us_SessionID, (long long unsigned int)us->us_LastActionTime );
						}
						else
						{
							size = snprintf( temp, 2047, ",{\"id\":\"%lu\",\"deviceidentity\":\"%s\",\"sessionid\":\"%s\",\"time\":\"%llu\"}", us->us_ID, us->us_DeviceIdentity, us->us_SessionID, (long long unsigned int)us->us_LastActionTime );
						}
						BufStringAddSize( bs, temp, size );
						pos++;
					}
				}
				
				if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
				{
					us->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
				}
				
				sessions = (UserSessListEntry *) sessions->node.mln_Succ;
			}
		}
		
		USER_UNLOCK( usr );
		FFree( temp );
	}
}

/**
 * Send notification to users when filesystem event will happen
 *
 * @param u user
 * @param evt event type (char *)
 * @param path path to file
 */

void UserNotifyFSEvent2( User *u, char *evt, char *path )
{
	DEBUG("[UserNotifyFSEvent2] start\n");
	
	if( evt == NULL || path == NULL )
	{
		DEBUG("[UserNotifyFSEvent2] end. Event or path = NULL\n");
		return;
	}
	
	// Produce message
	char *prototype = "{\"type\":\"msg\",\"data\":{\"type\":\"\",\"path\":\"\"}}";
	int globmlen = strlen( prototype ) + strlen( path ) + strlen( evt ) + 128;
	char *message = FCalloc( globmlen, sizeof(char) );

	if( message != NULL )
	{
		if( u != NULL )
		{
			USER_LOCK( u );
			
			DEBUG("[UserNotifyFSEvent2] Send notification to user: %s id: %lu\n", u->u_Name, u->u_ID );
			int mlen = snprintf( message, globmlen, "{\"type\":\"msg\",\"data\":{\"type\":\"%s\",\"data\":{\"path\":\"%s\"}}}", evt, path );
			
			UserSessListEntry *list = u->u_SessionsList;
			while( list != NULL )
			{
				if( list->us != NULL )
				{
					UserSessionWebsocketWrite( list->us, (unsigned char *)message, mlen, LWS_WRITE_TEXT);
				}
				else
				{
					INFO("[UserNotifyFSEvent2] Cannot send WS message: %s\n", message );
				}
				list = (UserSessListEntry *)list->node.mln_Succ;
			}
			
			USER_UNLOCK( u );
		}	// user != NULL
		FFree( message );
	}
	
	DEBUG("[UserNotifyFSEvent2] end\n");
}

/**
 * Add UserGroup to user
 *
 * @param u user
 * @param evt event type (char *)
 * @param path path to file
 */

int UserAddToGroup( User *usr, UserGroup *ug )
{
	DEBUG("[UserAddToGroup] start\n" );
	if( usr != NULL && ug != NULL )
	{
		USER_CHANGE_ON( usr );
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		while( ugl != NULL )
		{
			if( ugl->ugl_GroupID == ug->ug_ID )
			{
				break;
			}
			ugl = (UserGroupLink *) ugl->node.mln_Succ;
		}
		
		// seems user is not assigned to group, its time to do it
		
		if( ugl == NULL )
		{
			UserGroupLink *ugl = (UserGroupLink *)FCalloc( 1, sizeof(UserGroupLink ) );
			if( ugl != NULL )
			{
				ugl->ugl_Group = ug;
				ugl->ugl_GroupID = ug->ug_ID;
				
				ugl->node.mln_Succ = (MinNode *) usr->u_UserGroupLinks;
				usr->u_UserGroupLinks = ugl;
			}
		}
		
		USER_CHANGE_OFF( usr );
	}
	DEBUG("[UserAddToGroup] end\n" );
	return 0;
}

//
//
//

int UserRemoveFromGroup( User *usr, FUQUAD groupid )
{
	DEBUG("[UserRemoveFromGroup] start. GroupID %ld\n", groupid );
	if( usr != NULL )
	{
		USER_CHANGE_ON( usr );
		
		if( usr->u_UserGroupLinks != NULL )
		{
			// if group is first, lets just remove it quickly
			if( usr->u_UserGroupLinks->ugl_GroupID == groupid )
			{
				UserGroupLink *uglrem = usr->u_UserGroupLinks;
				usr->u_UserGroupLinks = (UserGroupLink *)usr->u_UserGroupLinks->node.mln_Succ;
				FFree( uglrem );
			}
			else
			{
				UserGroupLink *prevugl = usr->u_UserGroupLinks;
				UserGroupLink *ugl = (UserGroupLink *)usr->u_UserGroupLinks->node.mln_Succ;
				while( ugl != NULL )
				{
					// seems current group is group which we wanted to find
					if( ugl->ugl_GroupID == groupid )
					{
						// so previous group will get next pointer from current group
						// becaouse current pointer will be released
						prevugl->node.mln_Succ = ugl->node.mln_Succ;
						FFree( ugl );
						break;
					}
				
					prevugl = ugl;
					ugl = (UserGroupLink *)ugl->node.mln_Succ;
				}
			}
		}
		USER_CHANGE_OFF( usr );
	}
	DEBUG("[UserRemoveFromGroup] end. GroupID %ld\n", groupid );
	return 0;
}

/**
 * Create new UserToDelete
 *
 * @return new UserToDelete structure when success, otherwise NULL
 */
UserToDelete *UserToDeleteNew( )
{
	UserToDelete *utd;
	
	if( ( utd = FCalloc( 1, sizeof( UserToDelete ) ) ) != NULL )
	{
		
	}
	
	return utd;
}

/**
 * Remove UserToDelete structure
 *
 * @param usr pointer to UserToDelete structure which will be deleted
 */
void UserToDeleteDelete( UserToDelete *del )
{
	if( del != NULL )
	{
		if( del->utd_UserName )
		{
			FFree( del->utd_UserName );
		}
		FFree( del );
	}
}
