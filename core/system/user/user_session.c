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
 *  User Session
 *
 * file contain all functitons related to user sessions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_session.h"
#include <util/string.h>
#include <system/systembase.h>
#include <system/token/dos_token.h>

extern SystemBase *SLIB;

/**
 * Create new User Session
 *
 * @param sessid sessionID
 * @param devid deviceID
 * @return new UserSession structure when success, otherwise NULL
 */
UserSession *UserSessionNew( char *sessid, char *devid )
{
	UserSession *s;
	if( ( s = FCalloc( 1, sizeof(UserSession) ) ) != NULL )
	{
		s->us_SessionID = StringDuplicate( sessid );
		s->us_DeviceIdentity = StringDuplicate( devid );
		
		UserSessionInit( s );
		
		INFO("Mutex initialized\n");
	}
	return s;
}

/**
 * UserSession init
 *
 * @param us pointer to UserSession which will be initalized
 */
void UserSessionInit( UserSession *us )
{
	if( us != NULL )
	{
		pthread_mutex_init( &us->us_Mutex, NULL );
		
		us->us_WSReqManager = WebsocketReqManagerNew();
	}
}

/**
 * Delete UserSession
 *
 * @param us pointer to UserSession which will be deleted
 */
void UserSessionDelete( UserSession *us )
{
	if( us != NULL )
	{
		int count = 0;

		// we must wait till all tasks will be finished
		while( TRUE )
		{
            if( us->us_InUseCounter <= 0 )
			{
				break;
			}
			else
			{
				INFO("UserSessionDelete: number of working functions on user session: %d  sessionid: %s\n", us->us_InUseCounter, us->us_SessionID );
				count++;
				if( count > 50 )
				{
					//WorkerManagerDebug( SLIB );
					count = 0;
					break;
				}
			}
			//sleep( 1 );		// FRANCOIS: Really annoying when you force quit!
		}
		
		DOSToken *dosToken = (DOSToken *)us->us_DOSToken;
		if( dosToken != NULL )
		{
			dosToken->ct_UserSession = NULL;
			dosToken->ct_UserSessionID = 0;
		}
		
        if( us->us_User != NULL )
        {
            UserRemoveSession( us->us_User, us );
			us->us_User = NULL;
        }
	
		DEBUG("[UserSessionDelete] Remove session %p\n", us );

		FRIEND_MUTEX_LOCK( &(us->us_Mutex) );
		
		WebsocketServerClient *nwsc = us->us_WSClients;
		us->us_WSClients = NULL;
		
		Log( FLOG_DEBUG, "[UserSessionDelete] cl %p\n", us->us_WSClients );

		if( nwsc != NULL )
		{
			Log( FLOG_DEBUG, "[UserSessionDelete] cl != NULL\n");

			WebsocketServerClient *rws = nwsc;
			Log( FLOG_DEBUG, "[UserSessionDelete] nwsc %p\n", nwsc );
			while( nwsc != NULL )
			{
				rws = nwsc;
				
				FRIEND_MUTEX_LOCK( &(rws->wsc_Mutex) );
				nwsc = (WebsocketServerClient *)nwsc->node.mln_Succ;

				Log( FLOG_DEBUG, "[UserSessionDelete] Remove websockets ptr %p from usersession %p\n", rws, us );

				rws->wsc_InUseCounter = 0;
				rws->wsc_UserSession = NULL;
				FRIEND_MUTEX_UNLOCK( &(rws->wsc_Mutex) );
			}
		}

		DEBUG("[UserSessionDelete] Session released  sessid: %s device: %s \n", us->us_SessionID, us->us_DeviceIdentity );
	
		if( us->us_WSReqManager != NULL )
		{
			WebsocketReqManagerDelete( us->us_WSReqManager );
			us->us_WSReqManager = NULL;
		}
		
		if( us->us_DeviceIdentity != NULL )
		{
			FFree( us->us_DeviceIdentity );
		}
	
		if( us->us_SessionID != NULL )
		{
			FFree( us->us_SessionID );
		}
		FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		pthread_mutex_destroy( &(us->us_Mutex) );
	
		FFree( us );
	}
}
