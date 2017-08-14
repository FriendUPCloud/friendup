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
		pthread_mutex_lock( &(us->us_Mutex) );
		
		WebsocketClient *nwsc = us->us_WSClients;
		us->us_WSClients = NULL;
		int count = 0;
		
		DEBUG("[UserSessionDelete] Session delete %p \n", nwsc);
		//if( nwsc != NULL ) DEBUG("[UserSessionDelete] Session next %p\n",  nwsc->node.mln_Succ );	
		pthread_mutex_unlock( &(us->us_Mutex) );

		// we must wait till all tasks will be finished
		while( TRUE )
		{
            if( us->us_InUseCounter <= 0 )
			{
				break;
			}
			else
			{
				INFO("UserSessionDelete: number of working functions on user session: %ld  sessionid: %s\n", us->us_InUseCounter, us->us_SessionID );
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
		
        if( us->us_User != NULL )
        {
            UserRemoveSession( us->us_User, us );
			us->us_User = NULL;
        }
	
		DEBUG("[UserSessionDelete] Remove session %p\n", us );

		if( nwsc != NULL )
		{
			nwsc = us->us_WSClients;
			WebsocketClient *rws = nwsc;
			while( nwsc != NULL )
			{
				rws = nwsc;
				nwsc = (WebsocketClient *)nwsc->node.mln_Succ;
	
				DEBUG("[UserSessionDelete] Remove websockets ptrnew %p ptrold %p\n", nwsc, rws );
				pthread_mutex_lock( &(rws->wc_Mutex) );
				if( rws->wc_UserSession != NULL )
				{
					
				}
				rws->wc_UserSession = NULL;
				
				pthread_mutex_unlock( &(rws->wc_Mutex) );
				
				// I think that we should have here double linked list
				// if next and prev entries are NULL then structure is erased, otherwise its not
				/*
				//test
				while( TRUE )
				{
					if( rws->wc_InUseCounter <= 0 )
					{
						break;
					}
					sleep( 1 );
				}
				
				AppSessionRemByWebSocket( SLIB->sl_AppSessionManager->sl_AppSessions, rws );
				
				DEBUG("[WS] connection will be removed\n");
				WebsocketClientDelete( rws );
				//end test
				*/
				
                //rws->wc_Wsi = NULL;
                //rws->wc_WebsocketsData = NULL;
				//FFree( rws );
				// there is no need to release memory, it will be released with Websocket connection
			}
		}
		
		//pthread_mutex_lock( &(SLIB->sl_USM->usm_Mutex) );
	
		pthread_mutex_destroy( &(us->us_Mutex) );
	
		DEBUG("[UserSessionDelete] Session released  sessid: %s device: %s \n", us->us_SessionID, us->us_DeviceIdentity );
	
		if( us->us_DeviceIdentity != NULL )
		{
			FFree( us->us_DeviceIdentity );
		}
	
		if( us->us_SessionID != NULL )
		{
			FFree( us->us_SessionID );
		}
	
		FFree( us );
		//pthread_mutex_unlock( &(SLIB->sl_USM->usm_Mutex) );
	}
}

/*
void UserSessionDelete( UserSession *us )
{
	if( us != NULL )
	{
		pthread_mutex_lock( &(us->us_Mutex) );
		
		WebsocketClient *nwsc = us->us_WSClients;
		us->us_WSClients = NULL;
		int count = 0;
		
		DEBUG("[UserSessionDelete] Session delete %p \n", nwsc);
		//if( nwsc != NULL ) DEBUG("[UserSessionDelete] Session next %p\n",  nwsc->node.mln_Succ );	
		pthread_mutex_unlock( &(us->us_Mutex) );

		// we must wait till all tasks will be finished
		while( TRUE )
		{
            if( us->us_InUseCounter <= 0 )
			{
				break;
			}
			else
			{
				INFO("UserSessionDelete: number of working functions on user session: %ld  sessionid: %s\n", us->us_InUseCounter, us->us_SessionID );
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
		
        if( us->us_User != NULL )
        {
            UserRemoveSession( us->us_User, us );
			us->us_User = NULL;
        }
	
		DEBUG("[UserSessionDelete] Remove session %p\n", us );

		if( nwsc != NULL )
		{
			WebsocketClient *rws = nwsc;
			while( nwsc != NULL )
			{
				rws = nwsc;
				nwsc = (WebsocketClient *)nwsc->node.mln_Succ;
	
				DEBUG("[UserSessionDelete] Remove websockets ptrnew %p ptrold %p\n", nwsc, rws );
				pthread_mutex_lock( &(rws->wc_Mutex) );
				if( rws->wc_UserSession != NULL )
				{
					
				}
				rws->wc_UserSession = NULL;
				
				pthread_mutex_unlock( &(rws->wc_Mutex) );
				
				// I think that we should have here double linked list
				// if next and prev entries are NULL then structure is erased, otherwise its not
				
                //rws->wc_Wsi = NULL;
                //rws->wc_WebsocketsData = NULL;
				//FFree( rws );
				// there is no need to release memory, it will be released with Websocket connection
			}
		}
		
		//pthread_mutex_lock( &(SLIB->sl_USM->usm_Mutex) );
	
		pthread_mutex_destroy( &(us->us_Mutex) );
	
		DEBUG("[UserSessionDelete] Session released  sessid: %s device: %s \n", us->us_SessionID, us->us_DeviceIdentity );
	
		if( us->us_DeviceIdentity != NULL )
		{
			FFree( us->us_DeviceIdentity );
		}
	
		if( us->us_SessionID != NULL )
		{
			FFree( us->us_SessionID );
		}
	
		FFree( us );
		//pthread_mutex_unlock( &(SLIB->sl_USM->usm_Mutex) );
	}
}
*/
