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
 *  WebSocket client definition
 *
 * file contain all functitons related to websocket client
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __NETWORK_WEBSOCKET_CLIENT_H__
#define __NETWORK_WEBSOCKET_CLIENT_H__

#include <core/types.h>
#include <core/nodes.h>
#include <libwebsockets.h>
#include <util/friendqueue.h>
#include <core/thread.h>

//
// Websocket Client structure
//

typedef struct WebsocketClient
{
	struct lws						*wc_WSI;
	struct lws_context_creation_info ws_Info;
	struct lws_context				*ws_Context;
	struct lws_client_connect_info	ws_Ccinfo;
	FThread							*wc_Thread;
	pthread_mutex_t					wc_Mutex;
	FQueue							wc_MsgQueue;
	
	char							*wc_Host;
	int								wc_Port;
	void							*wc_WSData;
	FBOOL							wc_ToRemove;
	
	void							(*wc_ReceiveCallback)(struct WebsocketClient *, char *msg, int len );
}WebsocketClient;

//
// Create new Websocket Client
//

WebsocketClient *WebsocketClientNew( char *host, int port, void (*fptr)( void *, char *, int ) );

//
// Delete Websocket Client structure
//

void WebsocketClientDelete( WebsocketClient *cl );

//
// Connect Websocket Client to server
//

int WebsocketClientConnect( WebsocketClient *cl );

//
// Send message to Websocket Client
//

int WebsocketClientSendMessage( WebsocketClient *cl, char *msg, int len );

#endif // __NETWORK_WEBSOCKET_CLIENT__
