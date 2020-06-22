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
 *  Security Manager
 *
 * file contain definitions related to RoleManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/03/2020
 */

#include "security_manager.h"
#include <system/systembase.h>
#include <util/hashmap_long.h>

/**
 * Create SecurityManager
 *
 * @param sb pointer to SystemBase
 * @return SecurityManager structure
 */
SecurityManager *SecurityManagerNew( void *sb )
{
	SecurityManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( SecurityManager ) ) ) != NULL )
	{
		sm->sm_SB = sb;
		sm->sm_SessionTimeout = 60*60;	// 60 seconds, 60 minutes = 1h
		
		sm->sm_BadSessionLoginHM = HashmapLongNew();
		
		pthread_mutex_init( &(sm->sm_Mutex), NULL );
		
		return sm;
	}
	return NULL;
}

/**
 * Delete SecurityManager
 *
 * @param sm pointer to SecurityManager structure which will be deleted
 */
void SecurityManagerDelete( SecurityManager *sm )
{
	DEBUG("[SecurityManagerDelete] security manager ptr: %p\n", sm );
	if( sm != NULL )
	{
		HashmapLongFree( sm->sm_BadSessionLoginHM );
		
		pthread_mutex_destroy( &(sm->sm_Mutex) );
		FFree( sm );
	}
}

/**
 * Security check for sessions
 *
 * @param sm pointer to SecurityManager structure which will be deleted
 */

void SecurityManagerCheckSession( SecurityManager *sm, Http *request )
{
	HashmapElement *sesreq = GetHEReq( request, "sessionid" );
	if( sesreq != NULL )
	{
		DEBUG("sessionid found!\n");
		if( sesreq->hme_Data != NULL )
		{
			DEBUG("sessionid value found!\n");
			// getting last call for session
			HashmapElementLong *hel = NULL;
			
			if( FRIEND_MUTEX_LOCK( &(sm->sm_Mutex) ) == 0 )
			{
				hel = HashmapLongGet( sm->sm_BadSessionLoginHM, sesreq->hme_Data );
				FRIEND_MUTEX_UNLOCK( &(sm->sm_Mutex) );
			}
			
			if( hel != NULL )
			{
				time_t timeNow = time( NULL );
				// if last call bad call for this session was called one hour ago (60 second * 60 minutes)
				if( (timeNow - hel->hel_LastUpdate ) > sm->sm_SessionTimeout )
				{
					// so remove this session from list
					if( FRIEND_MUTEX_LOCK( &(sm->sm_Mutex) ) == 0 )
					{
						HashmapLongRemove( sm->sm_BadSessionLoginHM, sesreq->hme_Data );
						FRIEND_MUTEX_UNLOCK( &(sm->sm_Mutex) );
					}
				}
				else
				{
					hel->hel_LastUpdate = timeNow;
					hel->hel_Data++;
					
					// count delay value
					float delValue = ((float)hel->hel_Data) * 1.1f;
					
					DEBUG("SECURITY WARNING! Same call was made %ld times, delay will be set to: %f\n", hel->hel_Data, delValue );
					
					if( hel->hel_Data > 5 )
					{
						int slValue = ((int)delValue)-4;
						DEBUG("Sleep value: %d\n", slValue );
						sleep( slValue );
					}
				}
			}
			else
			{
				DEBUG("create new entry: %s!\n", (char *)sesreq->hme_Data );
				if( FRIEND_MUTEX_LOCK( &(sm->sm_Mutex) ) == 0 )
				{
					HashmapLongPut( sm->sm_BadSessionLoginHM, StringDuplicate( sesreq->hme_Data ), 1 );
					FRIEND_MUTEX_UNLOCK( &(sm->sm_Mutex) );
				}
			}
		}
	}
}

//
// Remove old sessions
//

void SecurityManagerRemoteOldBadSessionCalls( SecurityManager *sm )
{
	if( FRIEND_MUTEX_LOCK( &(sm->sm_Mutex) ) == 0 )
	{
		// if last call bad call for this session was called one hour ago (60 second * 60 minutes)
		HashmapDeleteOldEntries( sm->sm_BadSessionLoginHM, sm->sm_SessionTimeout );
		
		FRIEND_MUTEX_UNLOCK( &(sm->sm_Mutex) );
	}
}

