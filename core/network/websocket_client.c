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
 *  WebSocket client body
 *
 * file contain all functitons related to websocket client
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "websocket_client.h"
#include <system/systembase.h>

extern SystemBase *SLIB;

/**
 * Create new WebsocketClient
 *
 * @return new WebsocketClient structure when success, otherwise NULL
 */
WebsocketClient *WebsocketClientNew()
{
	WebsocketClient *cl = FCalloc( 1, sizeof(WebsocketClient) );
	if( cl != NULL )
	{
		pthread_mutex_init( &(cl->wc_Mutex), NULL );
	}
	return cl;
}

/**
 * Delete WebsocketClient
 *
 * @param cl pointer to WebsocketClient which will be deleted
 */
void WebsocketClientDelete( WebsocketClient *cl )
{
	if( cl != NULL )
	{
		int tries = 0;
		while( TRUE )
		{
			DEBUG("Check in use %d\n", cl->wc_InUseCounter );
			if( cl->wc_InUseCounter <= 0 )
			{
				break;
			}
			sleep( 1 );
			tries++;
			if( tries >= 30 )
			{
				DEBUG("Websocket released\n");
				break;
			}
		}
		
		AppSessionRemByWebSocket( SLIB->sl_AppSessionManager->sl_AppSessions, cl );
		
		pthread_mutex_lock( &(cl->wc_Mutex) );
		
		//DEBUG("[WS] connection will be removed %p\n", cl );
		Log(FLOG_DEBUG, "WebsocketClient delete %p\n", cl );
		
		cl->wc_UserSession = NULL;
		cl->wc_Wsi = NULL;
		//cl->wc_WebsocketsData = NULL;
		pthread_mutex_unlock( &(cl->wc_Mutex) );
		
		pthread_mutex_destroy( &(cl->wc_Mutex) );
		FFree( cl );
	}
}
