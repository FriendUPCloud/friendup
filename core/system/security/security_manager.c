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
#include <util/session_id.h>

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

/**
 * Remove old sessions event call
 *
 * @param sm pointer to SecurityManager structure which will be deleted
 */
void SecurityManagerRemoteOldBadSessionCalls( SecurityManager *sm )
{
	if( FRIEND_MUTEX_LOCK( &(sm->sm_Mutex) ) == 0 )
	{
		// if last call bad call for this session was called one hour ago (60 second * 60 minutes)
		HashmapDeleteOldEntries( sm->sm_BadSessionLoginHM, sm->sm_SessionTimeout );
		
		FRIEND_MUTEX_UNLOCK( &(sm->sm_Mutex) );
	}
}

/**
 * Get RefreshToken from DB
 *
 * @param sm pointer to SecurityManager structure which will be deleted
 * @return RefreshToken structure when success, otherwise NULL
 */
RefreshToken *SecurityManagerGetRefreshTokenDB( SecurityManager* sm, const char*token, const char *deviceID )
{
	RefreshToken *rt = NULL;
	SystemBase *sb = (SystemBase *)sm->sm_SB;
	SQLLibrary *sqllib = sb->GetInternalDBConnection( sb );
	if( sqllib != NULL )
	{
		char where[ 1024 ];
		int entries = 0;
		
		snprintf( where, sizeof(where), "Token='%s' AND DeviceID='%s'", token, deviceID );
		rt = sqllib->Load( sqllib, RefreshTokenDesc, where, &entries );
		
		sb->DropInternalDBConnection( sb, sqllib );
	}
	return rt;
}

/**
 * Get RefreshToken and recreate it
 *
 * @param sm pointer to SecurityManager
 * @param token token string
 * @param deviceID device ID
 * @param newToken pointer to char * where new token will be stored
 * @return RefreshToken structure when success, otherwise NULL
 */
RefreshToken *SecurityManagerGetRefreshTokenAndRecreateDB( SecurityManager* sm, const char*token, const char *deviceID, char **newToken )
{
	RefreshToken *rt = NULL;
	SystemBase *sb = (SystemBase *)sm->sm_SB;
	SQLLibrary *sqllib = sb->GetInternalDBConnection( sb );
	if( sqllib != NULL )
	{
		char where[ 1024 ];
		int entries = 0;
		time_t currTime = time( NULL );
		FQUAD userID = 0;
		
		snprintf( where, sizeof(where), "Token='%s' AND DeviceID='%s'", token, deviceID );
		rt = sqllib->Load( sqllib, RefreshTokenDesc, where, &entries );
		if( rt != NULL )
		{
			// we took entry from so now we have to create new Token
			
			*newToken = SessionIDGenerate();
			char qery[ 1024 ];
			sqllib->SNPrintF( sqllib, qery, 1024, "UPDATE FRefreshToken SET Token='%s',CreatedTime=%ld WHERE DeviceID='%s'", *newToken, currTime, deviceID );
			sqllib->QueryWithoutResults( sqllib, qery );
		}

		sb->DropInternalDBConnection( sb, sqllib );
	}
	return rt;
}

/**
 * Create RefreshToken
 *
 * @param sm pointer to SecurityManager
 * @param deviceID device ID
 * @param userID User ID
 * @return RefreshToken structure when success, otherwise NULL
 */
RefreshToken *SecurityManagerCreateRefreshTokenDB( SecurityManager* sm, const char *deviceID, FQUAD userID )
{
	RefreshToken *rt = NULL;
	time_t currTime = time( NULL );

	rt = RefreshTokenNew();
	if( rt != NULL )
	{
		SystemBase *sb = (SystemBase *)sm->sm_SB;
		SQLLibrary *sqllib = sb->GetInternalDBConnection( sb );
		if( sqllib != NULL )
		{
			char *newToken = SessionIDGenerate();
			char qery[ 1024 ];
			
			// first we must remove old entry if exist
			
			sqllib->SNPrintF( sqllib, qery, 1024, "DELETE FRefreshToken WHERE DeviceID='%s'", deviceID );
			sqllib->QueryWithoutResults( sqllib, qery );

			// create new refresh token
			
			rt->rt_CreatedTime = rt->rt_CreatedTime;
			rt->rt_DeviceID = StringDuplicate( (char *)deviceID );
			rt->rt_Token = newToken;
			rt->rt_UserID = userID;
			rt->rt_CreatedTime = currTime;
			
			sqllib->Save( sqllib, RefreshTokenDesc, rt );

			sb->DropInternalDBConnection( sb, sqllib );
		}	// sqllib
	}	// rt != NULL
	return rt;
}

/**
 * Create RefreshToken by deviceid and user name
 *
 * @param sm pointer to SecurityManager
 * @param deviceID device ID
 * @param userName user name
 * @return RefreshToken structure when success, otherwise NULL
 */
RefreshToken *SecurityManagerCreateRefreshTokenByUserNameDB( SecurityManager* sm, const char *deviceID, char *userName )
{
	RefreshToken *rt = NULL;
	time_t currTime = time( NULL );

	rt = RefreshTokenNew();
	if( rt != NULL )
	{
		SystemBase *sb = (SystemBase *)sm->sm_SB;
		
		SQLLibrary *sqllibGlob = sb->GetInternalDBConnection( sb );
		if( sqllibGlob != NULL )
		{
			// Get UserID from main DB, FUser table
			FULONG userid = 0;
			char tmpQuery[ 512 ];
			snprintf( tmpQuery, sizeof(tmpQuery), "SELECT UserID FROM FUser WHERE Name='%s' LIMIT 1", userName );
			void *result = sqllibGlob->Query(  sqllibGlob, tmpQuery );
			if( result != NULL )
			{
				char **row;
				row = sqllibGlob->FetchRow( sqllibGlob, result );
				char *end;
				userid = strtol( (char *)row[0], &end, 0 );
				sqllibGlob->FreeResult( sqllibGlob, result );
			}
			sb->DropDBConnection( sb, sqllibGlob );
			
			//
			
			if( userid > 0 )
			{
				SQLLibrary *sqllib = sb->GetInternalDBConnection( sb );
				if( sqllib != NULL )
				{
					char *newToken = SessionIDGenerate();
					char qery[ 1024 ];
			
					// first we must remove old entry if exist
			
					sqllib->SNPrintF( sqllib, qery, 1024, "DELETE FRefreshToken WHERE DeviceID='%s'", deviceID );
					sqllib->QueryWithoutResults( sqllib, qery );

					// create new refresh token
			
					rt->rt_CreatedTime = rt->rt_CreatedTime;
					rt->rt_DeviceID = StringDuplicate( (char *)deviceID );
					rt->rt_Token = newToken;
					rt->rt_UserID = userid;
					rt->rt_CreatedTime = currTime;
			
					sqllib->Save( sqllib, RefreshTokenDesc, rt );
				
					sb->DropInternalDBConnection( sb, sqllib );
				}	// sqllib
			}	// userid > 0
		}	// sqllibGlob
	}	// rt != NULL
	return rt;
}
