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
		while( TRUE )
		{
			DEBUG("Check in use %d\n", cl->wsc_InUseCounter );
			if( cl->wsc_InUseCounter <= 0 )
			{
				break;
			}
			sleep( 1 );
			/*
			tries++;
			if( tries >= 30 )
			{
				Log( FLOG_DEBUG, "Websocket released %p\n", cl );
				break;
			}
			*/
		}
		
		AppSessionRemByWebSocket( SLIB->sl_AppSessionManager->sl_AppSessions, cl );
		
		FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) );
		
		//DEBUG("[WS] connection will be removed %p\n", cl );
		Log(FLOG_DEBUG, "WebsocketServerClient delete %p\n", cl );
		
		cl->wsc_UserSession = NULL;
		cl->wsc_Wsi = NULL;
		FCWSData *data = (FCWSData *)cl->wsc_WebsocketsData;
		//data->fcd_WSClient = NULL;
		//cl->wc_WebsocketsData = NULL;
		FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
		
		pthread_mutex_destroy( &(cl->wsc_Mutex) );
		FFree( cl );
		DEBUG("Done!\n");
	}
}

