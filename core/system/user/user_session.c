/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
			sleep( 1 );
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
		
		WebsocketClient *nwsc = us->us_WSClients;
		us->us_WSClients = NULL;
		
		Log( FLOG_DEBUG, "[UserSessionDelete] cl %p\n", us->us_WSClients );

		if( nwsc != NULL )
		{
			Log( FLOG_DEBUG, "[UserSessionDelete] cl != NULL\n");

			WebsocketClient *rws = nwsc;
			Log( FLOG_DEBUG, "[UserSessionDelete] nwsc %p\n", nwsc );
			while( nwsc != NULL )
			{
				rws = nwsc;
				
				FRIEND_MUTEX_LOCK( &(rws->wc_Mutex) );
				nwsc = (WebsocketClient *)nwsc->node.mln_Succ;

				Log( FLOG_DEBUG, "[UserSessionDelete] Remove websockets ptr %p from usersession %p\n", rws, us );

				rws->wc_UserSession = NULL;
				FRIEND_MUTEX_UNLOCK( &(rws->wc_Mutex) );
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
