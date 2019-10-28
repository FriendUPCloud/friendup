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
		Log( FLOG_DEBUG, "\nUserSessionDelete will be removed: %s\n\n", us->us_SessionID );
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
				count++;
				if( count > 50 )
				{
					Log( FLOG_INFO, "UserSessionDelete: number of working functions on user session: %d  sessionid: %s\n", us->us_InUseCounter, us->us_SessionID );
					WorkerManagerDebug( SLIB );
					count = 0;
					break;
				}
			}
			usleep( 100 );
		}
		
		DOSToken *dosToken = (DOSToken *)us->us_DOSToken;
		if( dosToken != NULL )
		{
			dosToken->ct_UserSession = NULL;
			dosToken->ct_UserSessionID = 0;
		}
		
		if( count > 50 )
		{
			Log( FLOG_DEBUG, "UserRemoveSession will be called\n");
		}
		
		if( us->us_User != NULL )
		{
			UserRemoveSession( us->us_User, us );
			us->us_User = NULL;
        }
        SystemBase *lsb = SLIB;//(SystemBase *)us->us_SB;

		DEBUG("[UserSessionDelete] Remove session %p\n", us );

		// copy connection poiner to remove possibility of using it
		UserSessionWebsocket *nwsc = us->us_WSConnections;

		// We must do that here, becaouse lock on session is made in this function
		
		if( count > 50 )
		{
			Log( FLOG_DEBUG, "AppSessionManager will be called\n");
		}
		
		AppSessionManagerRemUserSession( lsb->sl_AppSessionManager, us );
		
		DEBUG("[UserSessionDelete] User removed from app session\n");
		
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			us->us_WSConnections = NULL;
		
			Log( FLOG_DEBUG, "[UserSessionDelete] cl %p\n", us->us_WSConnections );
			FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		}
		
		if( nwsc != NULL )
		{
			Log( FLOG_DEBUG, "[UserSessionDelete] cl != NULL\n");

			UserSessionWebsocket *rws = nwsc;
			Log( FLOG_DEBUG, "[UserSessionDelete] nwsc %p\n", nwsc );
			while( nwsc != NULL )
			{
				rws = nwsc;
				nwsc = (UserSessionWebsocket *)nwsc->node.mln_Succ;

				UserSessionWebsocketDelete( rws );
				//rws->wusc_Data = NULL;
			}
		}

		DEBUG("[UserSessionDelete] Session released  sessid: %s device: %s \n", us->us_SessionID, us->us_DeviceIdentity );

		// first clear WebsocketReqManager and then remove it
		WebsocketReqManager *wrm = NULL;
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			if( us->us_WSReqManager != NULL )
			{
				wrm = us->us_WSReqManager;
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
		}
		
		if( wrm != NULL )
		{
			WebsocketReqManagerDelete( wrm );
		}
		pthread_mutex_destroy( &(us->us_Mutex) );
	
		FFree( us );
		
		if( count > 50 )
		{
			Log( FLOG_DEBUG, "Session removed\n");
		}
	}
}

/**
 * Remove Websocket connection from UserSession
 *
 * @param us pointer to UserSession from which connection will be removed
 * @param wscl pointer to WebsocketServerClient connection which will be detached from connections list
 * @return pointer to removed connection when success or NULL when connection was not on the list
 */
UserSessionWebsocket *UserSessionRemoveConnection( UserSession *us, UserSessionWebsocket *wscl )
{
	if( us == NULL )
	{
		return NULL;
	}
	/*
	DEBUG("[UserSessionRemoveConnection] Set NULL to WSI\n");
	if( FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) ) == 0 )
	{
		us = (UserSession *)wscl->wsc_UserSession;
		if( us != NULL )
		{
			DEBUG("[UserSessionRemoveConnection] Set NULL to WSI, SESSIONPTR: %p SESSION NAME: %s WSI ptr: %p\n", us, us->us_SessionID, wscl->wsc_Wsi );
			us->us_WSClients = NULL;
		}
		wscl->wsc_Wsi = NULL;
		FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
	}
	DEBUG("[UserSessionRemoveConnection] Remove UserSession from User list\n");
	//
	// if user session is attached, then we can remove WebSocketClient from UserSession, otherwise it was already removed from there
	//
    if( us != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			WebsocketServerClient *actwsc = us->us_WSClients;
			WebsocketServerClient *prvwsc = us->us_WSClients;
			while( actwsc != NULL )
			{
				if( actwsc == wscl )
				{
					if( actwsc == us->us_WSClients )
					{
						us->us_WSClients = (WebsocketServerClient *)us->us_WSClients->node.mln_Succ;
					}
					else
					{
						prvwsc->node.mln_Succ = actwsc->node.mln_Succ;
					}
					DEBUG("[UserSessionRemoveConnection] Remove single connection  %p  session connections pointer %p\n", actwsc, us->us_WSClients );
					
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
					return actwsc;
				}
					
				prvwsc = actwsc;
				actwsc = (WebsocketServerClient *)actwsc->node.mln_Succ;
			}
			FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		}
	}
	else
	{
		FERROR("Cannot remove connection: Pointer to usersession is equal to NULL\n");
	}
	*/
	DEBUG("[UserSessionRemoveConnection] Remove Queue\n");

	return NULL;
}
