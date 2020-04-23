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
 *  WebsocketServerClient client body
 *
 * file contain all functitons related to websocket client
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_session_websocket.h"
#include <system/systembase.h>

extern SystemBase *SLIB;

/**
 * Create new UserSessionWebsocket
 *
 * @return new UserSessionWebsocket structure when success, otherwise NULL
 */
UserSessionWebsocket *UserSessionWebsocketNew()
{
	UserSessionWebsocket *cl = FCalloc( 1, sizeof(UserSessionWebsocket) );
	if( cl != NULL )
	{

	}
	return cl;
}

/**
 * Delete UserSessionWebsocket
 *
 * @param cl pointer to UserSessionWebsocket which will be deleted
 */
void UserSessionWebsocketDelete( UserSessionWebsocket *cl )
{
	if( cl != NULL )
	{
		DEBUG("[UserSessionWebsocketDelete] Close\n");
		
		// Disabled, connection should be removed when user session is closed
		/*
		if( SLIB != NULL && SLIB->sl_AppSessionManager != NULL )
		{
			AppSessionRemByWebSocket( SLIB->sl_AppSessionManager->sl_AppSessions, cl );
		}
		*/
		
		Log( FLOG_DEBUG, "[UserSessionWebsocketDelete] connection will be removed\n");
		WSCData *data = (WSCData *)cl->wusc_Data;
		if( data != NULL )
		{
			int tr = 0;
			while( TRUE )
			{
				DEBUG("[UserSessionWebsocketDelete]Check in use %d\n", data->wsc_InUseCounter );
				if( data->wsc_InUseCounter <= 0 )
				{
					break;
				}
				usleep( 500 );
				pthread_yield();
				
				if( tr++ > 60 )
				{
					break;
				}
			}
			
			while( TRUE )
			{
				if( FRIEND_MUTEX_TRYLOCK( &(data->wsc_Mutex) ) == 0 )
				{
					data->wsc_WebsocketsServerClient = NULL;
					data->wsc_UserSession = NULL;
					FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
					break;
				}
				usleep( 500 );
			}
			/*
			if( FRIEND_MUTEX_LOCK( &(data->wsc_Mutex) ) == 0 )
			{
				data->wsc_WebsocketsServerClient = NULL;
				data->wsc_UserSession = NULL;
				
				FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
			}
			*/
			cl->wusc_Data = NULL;
		}

		FFree( cl );
		DEBUG("[UserSessionWebsocketDelete]Done!\n");
	}
}

