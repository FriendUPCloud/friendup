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

WebsocketClient *WebsocketClientNew( char *host, int port, void (*fptr)( struct WebsocketClient *, char *, int ) );

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
