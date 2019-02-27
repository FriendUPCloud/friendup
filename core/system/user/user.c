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
	UserSession *s = (UserSession *)ls;
	UserSessListEntry *us = NULL;
	
	UserSessListEntry *exses = (UserSessListEntry *)usr->u_SessionsList;
	while( exses != NULL )
	{
		if( exses->us == ls )
		{
			DEBUG("Session was already added to user\n");
			return 0;
		}
		exses = (UserSessListEntry *) exses->node.mln_Succ;
	}
	
	if( ( us = FCalloc( 1, sizeof( UserSessListEntry ) ) ) != NULL )
	{
		us->us = s;
		s->us_User = usr;	// assign user to session
		s->us_UserID = usr->u_ID;
		
		us->node.mln_Succ = (MinNode *)usr->u_SessionsList;
		usr->u_SessionsList = us;
		
		usr->u_SessionsNr++;
	}
	
	return 0;
}

/**
 * Remove UserSession from User
 *
 * @param usr pointer to User from which UserSession will be removed
 * @param ls pointer to UserSession which will be removed
 */
void UserRemoveSession( User *usr, void *ls )
{
	UserSession *remses = (UserSession *)ls;
	if( usr  == NULL || ls == NULL )
	{
		FERROR("Cannot remove user session, its not connected to user\n");
		return;
	}
	
	if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
	{
		UserSessListEntry *actus = (UserSessListEntry *)usr->u_SessionsList;
		UserSessListEntry *prevus = actus;
		FBOOL removed = FALSE;
	
		while( actus != NULL )
		{
			prevus = actus;
			actus = (UserSessListEntry *)actus->node.mln_Succ;
			
			if( prevus->us == remses )
			{
				if( prevus == usr->u_SessionsList )
				{
					usr->u_SessionsList = (UserSessListEntry *)usr->u_SessionsList->node.mln_Succ;
				}
				else
				{
					prevus->node.mln_Succ = (MinNode *)actus;
				}
				usr->u_SessionsNr--;
				removed = TRUE;
				break;
			}
		}
		
		if( usr->u_SessionsNr <= 0 )
		{
			usr->u_SessionsList = NULL;
		}
		if( prevus != NULL )
		{
			FFree( prevus );
		}
		/*
		if( us != NULL )
		{
			// first entry
			if( remses == us->us )
		{
			usr->u_SessionsList = (UserSessListEntry *) us->node.mln_Succ;
			if( usr->u_SessionsList != NULL )
			{
				usr->u_SessionsList->node.mln_Pred = NULL;
			}
			
			usr->u_SessionsNr--;
			removed = TRUE;
		}
		else
		{
			prev = us;
			us = (UserSessListEntry *)us->node.mln_Succ;
			
			while( us != NULL )
			{
				if( remses == us->us )
				{
					prev->node.mln_Succ = (MinNode *)us->node.mln_Succ;
					UserSessListEntry *nexts = (UserSessListEntry *)us->node.mln_Succ;
					if( nexts != NULL )
					{
						nexts->node.mln_Pred = (MinNode *)prev;
					}
					usr->u_SessionsNr--;
					removed = TRUE;
					break;
				}
				
				prev = us;
				us = (UserSessListEntry *)us->node.mln_Succ;
				}
			}
		
			if( us != NULL )
			{
				if( usr->u_SessionsNr <= 0 )
				{
					usr->u_SessionsList = NULL;
				}
				FFree( us );
			}
		}
		*/
		FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
	}
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
		int i;
		if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
		{
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
			UserSessListEntry *delus = us;
			while( us != NULL )
			{
				delus = us;
				us = (UserSessListEntry *)us->node.mln_Succ;
			
				FFree( delus );
			}
			usr->u_SessionsList = NULL;
		
			// remove all remote users and drives
		
			RemoteUserDeleteAll( usr->u_RemoteUsers );
			FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
		}
			
		UserGroupLink *ugl = usr->u_UserGroupLinks;
		while( ugl != NULL )
		//for( i=0 ; i < usr->u_GroupsNr ; i++ )
		{
			UserGroupLink *n = (UserGroupLink *)ugl->node.mln_Succ;
			//UserGroupRemoveUser( usr->u_Groups[i], usr );
			UserGroupRemoveUser( ugl->ugl_Group, usr );
			ugl = n;
		}

		UserDeleteGroupLinkAll( usr->u_UserGroupLinks );
		usr->u_UserGroupLinks = NULL;
		/*
		if( usr->u_Groups != NULL )
		{
			FFree( usr->u_Groups );
			usr->u_Groups = NULL;
		}
		*/
		
		if( FRIEND_MUTEX_LOCK( &(usr->u_Mutex) ) == 0 )
		{
			if( usr->u_Email ){ FFree( usr->u_Email );}
		
			if( usr->u_FullName ){ FFree( usr->u_FullName );}
		
			if( usr->u_Name ){ FFree( usr->u_Name );}
		
			if( usr->u_Password ){ FFree( usr->u_Password );}
		
			if( usr->u_MainSessionID ){ FFree( usr->u_MainSessionID );}
		
			if( usr->u_UUID ){ FFree( usr->u_UUID );}
		
			FRIEND_MUTEX_UNLOCK( &(usr->u_Mutex) );
		}
		
		pthread_mutex_destroy( &(usr->u_Mutex) );
		
		FFree( usr );
	}
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
		File *lfile = usr->u_MountedDevs;
		
		while( lfile != NULL )
		{
			if( file->f_ID == lfile->f_ID )
			{
				DEBUG("Device is already in the list\n");
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
		File *lf = usr->u_MountedDevs;
		File *lastone = NULL;
		File *remdev = NULL;
		if( lf == NULL )
		{
			FERROR( "[UserRemDeviceByName] Seems we have NO mounted devs for user %s!\n", usr->u_Name );
			return NULL;
		}

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
		
		if( remdev != NULL )
		{
			if( remdev->f_Operations <= 0 )
			{
				DEBUG("[UserRemDeviceByName] Remove device from list\n");
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

				return remdev;
			}
			else
			{
				*error = FSys_Error_OpsInProgress;
				return remdev;
			}
		}
	}
	else
	{
		DEBUG("[UserRemDeviceByName] User or File paramter is equal to NULL\n");
		return NULL;
	}
	return NULL;
}

/**
 * Regenerate sessionid for user
 *
 * @param usr pointer to User which will have new sessionid
 * @param newsess new session hash. If passed value is equal to NULL new hash will be generated
 * @return 0 when success, otherwise error number
 */
int UserRegenerateSessionID( User *usr, char *newsess )
{
	if( usr != NULL )
	{
		//pthread_mutex_lock( &(usr->) );
		// Remove old one and update
		if( usr->u_MainSessionID )
		{
			FFree( usr->u_MainSessionID );
		}
		
		if( newsess != NULL )
		{
			usr->u_MainSessionID = StringDuplicate( newsess );
		}
		else
		{
			time_t timestamp = time ( NULL );
	
			char *hashBase = MakeString( 255 );
			sprintf( hashBase, "%ld%s%d", timestamp, usr->u_FullName, ( rand() % 999 ) + ( rand() % 999 ) + ( rand() % 999 ) );
			HashedString( &hashBase );

			usr->u_MainSessionID = hashBase;
		}
	
		// UPDATE file systems
		File *lDev = usr->u_MountedDevs;
		if( lDev != NULL )
		{
			while( lDev != NULL )
			{
				/*
				if( lDev->f_SessionID )
				{
					FFree( lDev->f_SessionID );
				}
				*/
				//lDev->f_SessionID = StringDuplicate( usr->u_MainSessionID );
				lDev->f_SessionIDPTR = usr->u_MainSessionID;
				lDev = (File *)lDev->node.mln_Succ;
			}
		}
	}
	else
	{
		DEBUG("User structure = NULL\n");
		return 1;
	}
	return 0;
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
			UserGroupAUser *au = ugl->ugl_Group->ug_UserList;
			UserGroupAUser *auprev = ugl->ugl_Group->ug_UserList;
	
			while( au != NULL )
			{
				// user is added, no need to add it second time
				if( au->ugau_User != NULL && u == au->ugau_User )
				{
					if( au == ugl->ugl_Group->ug_UserList )
					{
						ugl->ugl_Group->ug_UserList = (UserGroupAUser *) au->node.mln_Succ;
					}
					else
					{
						auprev->node.mln_Succ = au->node.mln_Succ;
					}
					FFree( au );
					break;
				}

				auprev = au;
				au = (UserGroupAUser *)au->node.mln_Succ;
			}
		}
		ugl = (UserGroupLink *)ugl->node.mln_Succ;
	}
	
	DEBUG("[UserRemoveFromGroups] remove before links delete\n");
	// remove all links to group
	UserDeleteGroupLinkAll( u->u_UserGroupLinks );
	u->u_UserGroupLinks = NULL;
	DEBUG("[UserRemoveFromGroups] remove end\n");
}
