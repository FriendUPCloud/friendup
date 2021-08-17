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
 *  App Session Manager
 *
 * file contain all functitons related to app sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 04/02/2021
 */

#include "appsession_manager.h"

#include <system/systembase.h>
#include <system/user/user_manager.h>
#include <system/fsys/door_notification.h>
#include <util/session_id.h>
#include <strings.h>
#include "appsession.h"

//#define USE_HASHMAP_FOR_SEARCH

/**
 * Create new App Session Manager
 *
 * @param sb pointer to SystemBase
 * @return UserSessionManager
 */
AppSessionManager *AppSessionManagerNew( void *sb )
{
	AppSessionManager *asm;
	
	if( ( asm = FCalloc( 1, sizeof( AppSessionManager ) ) ) != NULL )
	{
		asm->asm_SB = sb;
		
		pthread_mutex_init( &(asm->asm_Mutex), NULL );
		
		asm->asm_SessionsHT = AllocateHashTable( sizeof( AppSession *), 0);

		return asm;
	}
	return NULL;
}

/**
 * Delete Application Session Manager
 *
 * @param asmgr pointer to AppSessionManager which will be deleted
 */
void AppSessionManagerDelete( AppSessionManager *asmgr )
{
	if( asmgr != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
		{
			DEBUG("[USMDelete] Remove sessions\n");
			AppSession  *ls = asmgr->asm_Sessions;
			while( ls != NULL )
			{
				AppSession *rem =  ls;
				ls = (AppSession *) ls->node.mln_Succ;
			
				DEBUG("[USMDelete] \t\tRemove session : %s uid %lu\n", rem->as_AuthID, rem->as_UserID );
			
#ifdef DB_SESSIONID_HASH
				AppSessionManagerSessionsDeleteDB( asmgr, rem->as_HashedAuthID );
#else
				AppSessionManagerSessionsDeleteDB( asmgr, rem->as_AuthID );
#endif
				AppSessionDelete( rem );
			}
		
			asmgr->asm_Sessions = NULL;
			
			if( asmgr->asm_SessionsHT != NULL )
			{
				FreeHashTable( asmgr->asm_SessionsHT );
			}
		
			FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
			
			pthread_mutex_destroy( &(asmgr->asm_Mutex) );
		
			FFree( asmgr );
		}
	}
}

/**
 * Delete app session in database
 *
 * @param asmgr pointer to AppSessionManager
 * @param authid app authid
 * @return 0 when success otherwise error number
 */
int AppSessionManagerSessionsDeleteDB( AppSessionManager *asmgr, const char *authid )
{
	SystemBase *sb = (SystemBase *)asmgr->asm_SB;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqllib = sb->GetDBConnection( sb );
	if( sqllib == NULL )
	{
		FERROR("Cannot get user, mysql.library was not open\n");
		return -1;
	}

	sqllib->SNPrintF( sqllib, tmpQuery, sizeof(tmpQuery), "DELETE from FAppSession WHERE AuthID='%s'", authid );

	sqllib->QueryWithoutResults( sqllib, tmpQuery );

	sb->DropDBConnection( sb, sqllib );

	DEBUG("[AppSessionManagerSessionsDeleteDB] end\n");
	return 0;
}

/**
 * Get AppSession by ID
 *
 * @param usm pointer to AppSessionManager
 * @param id entry ID
 * @return pointer to AppSession structure
 */
AppSession *AppSessionManagerGetSessionByID( AppSessionManager *asmgr, FUQUAD id )
{
	DEBUG("[AppSessionManagerGetSessionByAuthID] authid %ld\n", id );
	if( id == 0 )
	{
		FERROR("Sessionid is NULL!\n");
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		AppSession *as = asmgr->asm_Sessions;
		while( as != NULL )
		{
			if( id == as->as_ID )
			{
				FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
				return as;
			}
			as = (AppSession *) as->node.mln_Succ;
		}
		DEBUG("CHECK4END\n");
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	return NULL;
}

/**
 * Get AppSession by authid
 *
 * @param usm pointer to AppSessionManager
 * @param authid authid as string
 * @return pointer to AppSession structure
 */
AppSession *AppSessionManagerGetSessionByAuthID( AppSessionManager *asmgr, char *authid )
{
	DEBUG("[AppSessionManagerGetSessionByAuthID] authid %s\n", authid );
	if( authid == NULL )
	{
		FERROR("Sessionid is NULL!\n");
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
#ifdef USE_HASHMAP_FOR_SEARCH
		HTItem* bck = HashFind( asmgr->asm_SessionsHT, PTR_KEY(asmgr->asm_SessionsHT, authid) );
		if( bck != NULL && bck->data != NULL )
		{
			FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
			return bck->data;
		}
#else
		AppSession *as = asmgr->asm_Sessions;
		while( as != NULL )
		{
			DEBUG("[AppSessionManagerGetSessionByAuthID] find: %s : inlist: %s / %s\n", authid, as->as_AuthID, as->as_HashedAuthID );
			if( strcmp( authid, as->as_AuthID ) == 0 )
			{
				FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
				return as;
			}
			as = (AppSession *) as->node.mln_Succ;
		}
		DEBUG("CHECK4END\n");
#endif
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	return NULL;
}

/**
 * Get AppSession by sessionid from DB
 *
 * @param asmgr pointer to AppSessionManager
 * @param authid authid as string
 * @return pointer to AppSession structure
 */
AppSession *AppSessionManagerGetSessionByAuthIDFromDB( AppSessionManager *asmgr, char *authid )
{
	SystemBase *sb = (SystemBase *)asmgr->asm_SB;
	AppSession *appsession = NULL;
	char tmpQuery[ 1024 ];
	
	SQLLibrary *sqllib = sb->GetDBConnection( sb );
	if( sqllib != NULL )
	{
		int entries = 0;
		
#ifdef DB_SESSIONID_HASH
		char *tmpSessionID = sb->sl_UtilInterface.DatabaseEncodeString( authid );
		if( tmpSessionID != NULL )
		{
			sqllib->SNPrintF( sqllib, tmpQuery, sizeof(tmpQuery)," AuthID='%s'", tmpSessionID );
			FFree( tmpSessionID );
		}
#else
		sqllib->SNPrintF( sqllib, tmpQuery, sizeof(tmpQuery)," AuthID='%s'", authid );
#endif
		DEBUG( "[AppSessionManagerGetSessionByAuthIDFromDB] Sending query: %s...\n", tmpQuery );

		appsession = ( AppSession *)sqllib->Load( sqllib, AppSessionDesc, tmpQuery, &entries );
		sb->DropDBConnection( sb, sqllib );
	}
	else
	{
		FERROR("[AppSessionManagerGetSessionByAuthIDFromDB] Cannot get user, mysql.library was not open\n");
		return NULL;
	}
	
	DEBUG("[AppSessionManagerGetSessionByAuthIDFromDB] end\n");
	return appsession;
}

/**
 * Add app session to global app sessions list
 *
 * @param asmgr pointer to AppSessionManager
 * @param s pointer to user session which  will be added
 * @return AppSession if success, otherwise NULL
 */
AppSession *AppSessionManagerAppSessionAddToList( AppSessionManager *asmgr, AppSession *s )
{
	DEBUG("[AppSessionManagerAppSessionAddToList] start\n");
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		if( asmgr->asm_Sessions == s )
		{
			DEBUG("[AppSessionManagerAppSessionAddToList] stop adding same session!\n");
			FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
			return s;
		}
		
#ifdef USE_HASHMAP_FOR_SEARCH
		HashInsert( asmgr->asm_SessionsHT, PTR_KEY(asmgr->asm_SessionsHT, s->as_AuthID), s );
#endif
		
		// Add next usersession
		s->node.mln_Succ = (MinNode *)asmgr->asm_Sessions;
		asmgr->asm_Sessions = s;
		asmgr->asm_SessionCounter++;
	
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	else
	{
		return NULL;
	}
	
	DEBUG("[AppSessionManagerAppSessionAddToList] end\n");
	
	return s;
}

/**
 * Add app session to global app sessions list.
 * Function check first if session with provided already exist. If it exist its not added.
 *
 * @param asmgr pointer to UserSessionManager
 * @param as pointer to app session AppSessionManager  will be added
 * @return AppSession if success, otherwise NULL
 */
AppSession *AppSessionManagerAppSessionAdd( AppSessionManager *asmgr, AppSession *as )
{
	DEBUG("[AppSessionManagerAppSessionAdd] start, usptr : %p\n", as );
	
	FBOOL userHaveMoreSessions = FALSE;
	
	if( as == NULL )
	{
		FERROR("Cannot add NULL session!\n");
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &as->as_Mutex ) == 0 )
	{
		as->as_InUse++;
		FRIEND_MUTEX_UNLOCK( &as->as_Mutex );
	}
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		DEBUG("[AppSessionManagerAppSessionAdd] CHECK8 LOCKED\n");
		AppSession *ases =  asmgr->asm_Sessions;
		while( ases != NULL )
		{
			DEBUG("[AppSessionManagerAppSessionAdd] Session locked, compare: %s vs %s\n", as->as_AuthID, ases->as_AuthID );
			
			if( as->as_AuthID != NULL && ases->as_AuthID != NULL && strncmp( as->as_AuthID, ases->as_AuthID, 256 ) == 0 )
			{
				DEBUG("Found session with same sessionID, return!\n");
				
				FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
				
				if( FRIEND_MUTEX_LOCK( &as->as_Mutex ) == 0 )
				{
					as->as_InUse--;
					FRIEND_MUTEX_UNLOCK( &as->as_Mutex );
				}
				return ases;
			}
		
			DEBUG("[AppSessionManagerAppSessionAdd] inside session 2 id: %s\n", as->as_AuthID );
			ases = (AppSession *)ases->node.mln_Succ;
		}
		DEBUG("[AppSessionManagerAppSessionAdd] CHECK8 after while\n");

		// if session doesnt exist in memory we must add it to the list
	
		if( ases ==  NULL )
		{
			INFO("[AppSessionManagerAppSessionAdd] Add UserSession to User. AuthID: %s asptr: %p\n", as->as_AuthID, as );

			AppSession *sessPtr =  asmgr->asm_Sessions;
			while( sessPtr != NULL )
			{
				if( sessPtr == as )
				{
					break;
				}
				sessPtr = (AppSession *)sessPtr->node.mln_Succ;
			}
			
			if( sessPtr == NULL )
			{
#ifdef USE_HASHMAP_FOR_SEARCH
				HashInsert( asmgr->asm_SessionsHT, PTR_KEY(asmgr->asm_SessionsHT, as->as_AuthID), as );
#endif
				as->node.mln_Succ = (MinNode *)asmgr->asm_Sessions;
				asmgr->asm_Sessions = as;
			}
		}
		else
		{
			as = ases;
			DEBUG("[AppSessionManagerAppSessionAdd] App session was overwritten, ptr %p\n", as );
		}
		DEBUG("[AppSessionManagerAppSessionAdd] CHECK8END\n");
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	
	DEBUG("[AppSessionManagerAppSessionAdd] Checking session id %lu\n", as->as_UserID );
	
	if( as->as_UserID != 0 )
	{
		SystemBase *sb = (SystemBase *)asmgr->asm_SB;
		asmgr->asm_SessionCounter++;
		User *locusr = NULL;
		
		if( as->as_User != NULL )
		{
			locusr = as->as_User;
		}
		else
		{
			locusr = UMGetUserByID( sb->sl_UM, as->as_UserID );
			if( locusr != NULL )
			{
				if( locusr->u_SessionsNr > 0 )
				{
					userHaveMoreSessions = TRUE;
				}
			}
		}
		
		if( locusr == NULL )
		{
			DEBUG("[AppSessionManagerAppSessionAdd] User found in DB, generate new master session for him and his devices\n");
			locusr = UMUserGetByIDDB( sb->sl_UM, as->as_UserID );
		}
		
		if( locusr == NULL )
		{
			Log( FLOG_ERROR, "Cannot get user by ID\n");
			if( FRIEND_MUTEX_LOCK( &as->as_Mutex ) == 0 )
			{
				as->as_InUse--;
				FRIEND_MUTEX_UNLOCK( &as->as_Mutex );
			}
			return NULL;
		}
		else
		{
			DEBUG("[AppSessionManagerAppSessionAdd] User added to user %s asptr: %p\n", locusr->u_Name, as );
			
			UserAddAppSession( locusr, as );
			as->as_User = locusr;
		}
	}
	else
	{
		FERROR("Couldnt find user with ID %lu\n", as->as_UserID );
		if( FRIEND_MUTEX_LOCK( &as->as_Mutex ) == 0 )
		{
			as->as_InUse--;
			FRIEND_MUTEX_UNLOCK( &as->as_Mutex );
		}
		return NULL;
	}
	
	if( FRIEND_MUTEX_LOCK( &as->as_Mutex ) == 0 )
	{
		as->as_InUse--;
		FRIEND_MUTEX_UNLOCK( &as->as_Mutex );
	}
	
	return as;
}

/**
 * Remove AppSession from FC list
 *
 * @param asmgr pointer to AppSessionManager
 * @param remsess session which will be removed
 * @return 0 when success, otherwise error number
 */
int AppSessionManagerAppSessionRemove( AppSessionManager *asmgr, AppSession *remsess )
{
	if( remsess == NULL )
	{
		return -1;
	}
	
	AppSession *sess = asmgr->asm_Sessions;
	AppSession *prev = sess;
	FBOOL sessionRemoved = FALSE;
	
	DEBUG("[AppSessionManagerAppSessionRemove] UserSessionRemove\n");
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		if( remsess == asmgr->asm_Sessions )
		{
			asmgr->asm_Sessions = (AppSession *)asmgr->asm_Sessions->node.mln_Succ;
			sessionRemoved = TRUE;
			asmgr->asm_SessionCounter--;
			INFO("[AppSessionManagerAppSessionRemove] Session removed from list\n");
		}
		else
		{
			while( sess != NULL )
			{
				prev = sess;
				sess = (AppSession *)sess->node.mln_Succ;
			
				if( sess != NULL && sess == remsess )
				{
					// Remove appsession from list
					prev->node.mln_Succ = sess->node.mln_Succ;
					DEBUG("[USMUserSessionRemove] Session removed from list\n");
					sessionRemoved = TRUE;
					break;
				}
				
			}
			asmgr->asm_SessionCounter--;
		}
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	
	if( sessionRemoved == TRUE )
	{
#ifdef DB_SESSIONID_HASH
		AppSessionManagerSessionsDeleteDB( asmgr, remsess->as_HashedAuthID );
#else
		AppSessionManagerSessionsDeleteDB( asmgr, remsess->as_AuthID );
#endif
		
		AppSessionDelete( remsess );
	}

	return 0;
}


/**
 * Remove AppSession from FC list
 *
 * @param asmgr pointer to AppSessionManager
 * @param authid authid of session which will be removed
 * @return 0 when success, otherwise error number
 */
int AppSessionManagerAppSessionRemoveByAuthID( AppSessionManager *asmgr, char *authid )
{
	if( authid == NULL )
	{
		return -1;
	}
	if( asmgr->asm_Sessions == NULL )
	{
		return -2;
	}
	
	AppSession *sess = asmgr->asm_Sessions;
	AppSession *prev = sess;
	AppSession *toBeRemoved = NULL;
	
	DEBUG("[AppSessionManagerAppSessionRemove] UserSessionRemove\n");
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		if( strcmp( authid, asmgr->asm_Sessions->as_AuthID ) == 0 )
		{
			asmgr->asm_Sessions = (AppSession *)asmgr->asm_Sessions->node.mln_Succ;
			toBeRemoved = sess;
			asmgr->asm_SessionCounter--;
			INFO("[AppSessionManagerAppSessionRemove] Session removed from list\n");
		}
		else
		{
			while( sess != NULL )
			{
				prev = sess;
				sess = (AppSession *)sess->node.mln_Succ;
			
				if( sess != NULL && strcmp( sess->as_AuthID, authid ) == 0 )
				{
					// Remove appsession from list
					prev->node.mln_Succ = sess->node.mln_Succ;
					DEBUG("[USMUserSessionRemove] Session removed from list\n");
					toBeRemoved = sess;
					break;
				}
				
			}
			asmgr->asm_SessionCounter--;
		}
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	
	if( toBeRemoved != NULL )
	{
#ifdef DB_SESSIONID_HASH
		AppSessionManagerSessionsDeleteDB( asmgr, toBeRemoved->as_HashedAuthID );
#else
		AppSessionManagerSessionsDeleteDB( asmgr, toBeRemoved->as_AuthID );
#endif
		
		AppSessionDelete( toBeRemoved );
	}

	return 0;
}

/**
 * Remove old App Sessions from DB
 *
 * @param lsb pointer to SystemBase
 * @return 0 when success, otherwise error number
 */
int AppSessionManagerRemoveOldAppSessions( void *lsb )
{
	SystemBase *sb = (SystemBase *)lsb;

	time_t acttime = time( NULL );
	
	DEBUG("[USMRemoveOldAppSessions] start\n" );
	
	AppSessionManager *asmgr = (AppSessionManager *)sb->sl_AppSessionManager;
	
	if( FRIEND_MUTEX_LOCK( &(asmgr->asm_Mutex) ) == 0 )
	{
		AppSession *newAsRoot = NULL;
		AppSession *as = asmgr->asm_Sessions;
		
		// now we are going through all sessions and check which one timeout
		// up-to-date ones are moved to new list, old removed
		
		while( as != NULL )
		{
			AppSession *oldEntry = as;
			as = (AppSession *)as->node.mln_Succ;
			
			// timeout
			if( ( acttime - oldEntry->as_CreateTime ) > sb->sl_RemoveAppSessionsAfterTime )
			{
#ifdef DB_SESSIONID_HASH
				DEBUG("[USMRemoveOldAppSessions] entry removed: %s\n", oldEntry->as_HashedAuthID );
				
				AppSessionManagerSessionsDeleteDB( asmgr, oldEntry->as_HashedAuthID );
#else
				DEBUG("[USMRemoveOldAppSessions] entry removed: %s\n", oldEntry->as_AuthID );
				
				AppSessionManagerSessionsDeleteDB( asmgr, oldEntry->as_AuthID );
#endif
		
				AppSessionDelete( oldEntry );
			}
			else
			{
				oldEntry->node.mln_Succ = (MinNode *)newAsRoot;
				newAsRoot = oldEntry;
			}
		}
		
		asmgr->asm_Sessions = newAsRoot;
		
		FRIEND_MUTEX_UNLOCK( &(asmgr->asm_Mutex) );
	}
	
	DEBUG("[USMRemoveOldAppSessions] end\n" );
	
	return 0;
}
