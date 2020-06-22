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
 * file contain all functitons related to application sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "sas_manager.h"
#include <system/systembase.h>
#include "sas_session.h"
#include <core/functions.h>

/**
 * Create SAS Manager
 *
 * @param sb pointer to SystemBase
 * @return SASManager
 */

SASManager *SASManagerNew( void *sb )
{
	SASManager *as = NULL;
	
	if( ( as = FCalloc( 1, sizeof( SASManager ) ) ) != NULL )
	{
		as->sasm_SB = sb;
		pthread_mutex_init( &(as->sasm_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for SASManager\n");
	}
	
	return as;
}

/**
 * Delete SAS Manager
 *
 * @param asm application session to remove
 */

void SASManagerDelete( SASManager *asm )
{
	DEBUG("[AppSessionManagerGetSession] AppSessionManagerDelete\n");
	if( asm != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) ) == 0 )
		{
			SASSession *las = asm->sasm_AppSessions;
			SASSession *oas = las;
		
			while( las != NULL )
			{
				DEBUG("[AppSessionManagerGetSession] SASSession will be removed from list\n");

				oas = las;
				las =(SASSession  *)las->node.mln_Succ;
				SASSessionDelete( oas );
			}
			FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
		}
		pthread_mutex_destroy( &(asm->sasm_Mutex) );
		
		FFree( asm );
	}
}

/**
 * Add application session to list
 *
 * @param asm application session
 * @param nas pointer to application session which will be added
 * @return 0 if success, otherwise error number
 */

int SASManagerAddSession( SASManager *asm, SASSession *nas )
{
	if( asm != NULL )
	{
		SASSession *las = NULL;
		
		if( FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) ) == 0 )
		{
			LIST_FOR_EACH( asm->sasm_AppSessions, las, SASSession * )
			{
				if( nas->sas_SASID == las->sas_SASID )
				{
					DEBUG("[AppSessionManagerGetSession] SASSession was already added to list\n");
					FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
					return 0;
				}
			}
			FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
		}
		
		if( FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) ) == 0 )
		{
			nas->node.mln_Succ = (MinNode *)asm->sasm_AppSessions;
			asm->sasm_AppSessions = nas;

			/*
			AppSession *lastone = asm->asm_AppSessions;
			if( lastone == NULL )
			{
				asm->asm_AppSessions = nas;
			}
			else
			{
				while( lastone->node.mln_Succ != NULL )
				{
					lastone = (AppSession *)lastone->node.mln_Succ;
				}
				lastone->node.mln_Succ = (MinNode *)nas;
			}
			*/
			FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
		}
		return 0;
	}
	return -2;
}

/**
 * Remove application session from sas list
 *
 * @param asm application session
 * @param nas pointer to application session which will be removed
 * @return 0 if success, otherwise error number
 */

int SASManagerRemSession( SASManager *asm, SASSession *nas )
{
	if( asm != NULL && nas != NULL )
	{
		SASSession *las = NULL;
		
		DEBUG("[SASManagerRemSession] SASSession will be removed\n");
		
		if( FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) ) == 0 )
		{
			SASSession *oas = asm->sasm_AppSessions;	// old application session
		
			LIST_FOR_EACH( asm->sasm_AppSessions, las, SASSession * )
			{
				if( nas->sas_SASID == las->sas_SASID )
				{
					DEBUG("[AppSessionManagerGetSession] SASSession will be removed from list: %lu\n", nas->sas_SASID );
				
					if( nas == asm->sasm_AppSessions )	// if session is equal to first entry, we only overwrite pointer
					{
						asm->sasm_AppSessions = (SASSession *) asm->sasm_AppSessions->node.mln_Succ;
					}
					else	// if session is not first entry then we only update next pointer in previous pointer
					{
						oas->node.mln_Succ = (MinNode *)nas->node.mln_Succ;
					}
				
					FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
					
					SASSessionDelete( nas );
					DEBUG("[SASManagerRemSession] appsession removed\n");
					
					return 0;
				}
				oas = las;
			}
			FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
		}
	}
	else
	{
		DEBUG("[AppSessionManagerRemSession] application session do not exist!\n");
		return -1;
	}
	DEBUG("[AppSessionManagerRemSession] appsession not found\n");
	return -2;
}

/**
 * Get Session from SAS
 *
 * @param asm application session
 * @param id of application session to be searched
 * @return application session
 */

SASSession *SASManagerGetSession( SASManager *asm, FUQUAD id )
{
	if( asm != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) ) == 0 )
		{
			SASSession *las = NULL;
		
			LIST_FOR_EACH( asm->sasm_AppSessions, las, SASSession * )
			{
				if( id == las->sas_SASID )
				{
					DEBUG("[AppSessionManagerGetSession] SASSession found\n");
					FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
					return las;
				}
			}
			FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
		}
	}
	else
	{
		return NULL;
	}
	return NULL;
}

/**
 * Remove user session from manager
 *
 * @param asm application session manager
 * @param ses pointer to user session which will be removed
 * @return 0 if success, otherwise error number
 */

int SASManagerRemUserSession( SASManager *asm, UserSession *ses )
{
	if( asm == NULL )
	{
		FERROR("SAS was removed\n");
		return -1;
	}
	
	List *delList = ListNew();
	
	FRIEND_MUTEX_LOCK( &(asm->sasm_Mutex) );
	
	SASSession *as = asm->sasm_AppSessions;
	while( as != NULL )
	{
		SASSession *toBeRemoved = NULL;
		
		// Try to get the lock
		// TODO: Later, replace with macro!
		/*
		if( pthread_mutex_trylock( &( as->as_SessionsMut ) ) != 0 )
		{
			// TODO: Assert here to debug later!
			break;
		}
		*/
		
		DEBUG("Lock on AS set\n");
		
		int err = SASSessionRemUserSessionAny( as, ses );
		if( err == 0 )
		{
			if( as->sas_UserNumber <= 0 )
			{
				toBeRemoved = as;
				DEBUG("I will remove session %p\n", toBeRemoved );
				ListAdd( &delList, toBeRemoved );
			}
		}
		/*
		if( FRIEND_MUTEX_LOCK( &(as->as_SessionsMut) ) == 0 )
		{
			SASUList *le = as->as_UserSessionList;
			SASUList *ple = as->as_UserSessionList;
			
			DEBUG("mutex locked %p\n", le );
			
			while( le != NULL )
			{
				DEBUG("Going through user sessions, le->session %p session %p\n", le->usersession, ses );
				
				// If list user session is what we are looking for
				if( le->usersession == ses )
				{
					DEBUG("Remove entry le %p - root list %p\n", le, as->as_UserSessionList );
					
					// if first entry must be removed
					if( le == as->as_UserSessionList )
					{
						as->as_UserSessionList = (SASUList *)le->node.mln_Succ;
						FFree( le );
						le = as->as_UserSessionList;
						ple = as->as_UserSessionList;
					}
					// remove an entry in the list other than first
					else
					{
						SASUList *rme = le;
						ple->node.mln_Succ = (MinNode *)le->node.mln_Succ;
						FFree( le );
						le = (SASUList *)rme->node.mln_Succ;
					}
					
					DEBUG("AS pointer %p\n", as );
					
					as->as_UserNumber--;
					
					DEBUG("Number of users: %d\n", as->as_UserNumber );
					
					if( as->as_UserNumber <= 0 )
					{
						toBeRemoved = as;
						DEBUG("I will remove session %p\n", toBeRemoved );
					}
				}
				else
				{
					DEBUG("previous le = le\n");
					
					ple = le;
					le = (SASUList *)le->node.mln_Succ;
				}
			}
			
			DEBUG("Mutex will be unlocked\n");
			FRIEND_MUTEX_UNLOCK( &(as->as_SessionsMut) );
			DEBUG("Mutex unlocked\n");

			if( toBeRemoved != NULL )
			{
				//DEBUG("App session will be delted\n");
				
				ListAdd( &delList, toBeRemoved );
			}
		}
		*/
		as = (SASSession *)as->node.mln_Succ;
	}
	DEBUG("Done on session\n");
	FRIEND_MUTEX_UNLOCK( &(asm->sasm_Mutex) );
	DEBUG("Application session manager unlocked\n");
	
	List *l = delList;
	while( l != NULL )
	{
		SASSession *astorem = (SASSession *)l->l_Data;
		l = l->next;
		
		SASManagerRemSession( asm, astorem );
		//AppSessionDelete( astorem );
	}
	ListFree( delList );
	DEBUG("del end\n");
	
	return 0;
}
