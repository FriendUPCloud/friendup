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

#include "websocket_server_client.h"
#include <system/systembase.h>

extern SystemBase *SLIB;

/**
 * Create new WebsocketServerClient
 *
 * @return new WebsocketServerClient structure when success, otherwise NULL
 */
WebsocketServerClient *WebsocketServerClientNew()
{
	WebsocketServerClient *cl = FCalloc( 1, sizeof(WebsocketServerClient) );
	if( cl != NULL )
	{
		pthread_mutex_init( &(cl->wsc_Mutex), NULL );
		
		FQInit( &(cl->wsc_MsgQueue) );
		
		cl->wsc_LastPingTime = time( NULL );
	}
	return cl;
}

/**
 * Delete WebsocketServerClient
 *
 * @param cl pointer to WebsocketServerClient which will be deleted
 */
void WebsocketServerClientDelete( WebsocketServerClient *cl )
{
	if( cl != NULL )
	{
		int tr = 0;
		while( TRUE )
		{
			int inUse = 0;
			DEBUG("[WebsocketServerClientDelete]Check in use %d\n", cl->wsc_InUseCounter );
			//if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
			{
				inUse = cl->wsc_InUseCounter;
				//FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
			}
			if( inUse <= 0 )
			{
				break;
			}
			sleep( 1 );

			tr++;
			if( tr >= 5 )
			{
				Log( FLOG_DEBUG, "Websocket released %p\n", cl );
				break;
			}
		}
		DEBUG("[WebsocketServerClientDelete] Close\n");
		
		AppSessionRemByWebSocket( SLIB->sl_AppSessionManager->sl_AppSessions, cl );
		
		if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
		{
			//DEBUG("[WS] connection will be removed %p\n", cl );
			Log(FLOG_DEBUG, "WebsocketServerClient delete %p\n", cl );
		
			cl->wsc_UserSession = NULL;
			cl->wsc_Wsi = NULL;
			FCWSData *data = (FCWSData *)cl->wsc_WebsocketsData;
			//data->fcd_WSClient = NULL;
			//cl->wc_WebsocketsData = NULL;
			FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
		}
		pthread_mutex_destroy( &(cl->wsc_Mutex) );
		FFree( cl );
		DEBUG("[WebsocketServerClientDelete]Done!\n");
	}
}

