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
 *  WebSocket apns connector
 *
 * file contain all functitons related to apns connector
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 26/11/2018
 */

#ifndef __WEBSOCKETS_WEBSOCKET_APNS_CONNECTOR_H__
#define __WEBSOCKETS_WEBSOCKET_APNS_CONNECTOR_H__

#include <core/types.h>
#include <core/nodes.h>
#include <libwebsockets.h>
#include <core/thread.h>
#include <network/websocket_client.h>

//
//
//

typedef struct WebsocketAPNSConnector
{
	struct MinNode 					node;
	
	FThread							*wapnsc_Thread;
	FBOOL							wapnsc_Quit;
	WebsocketClient					*wapns_Connection;
	char							*wapns_Host;
	int								wapns_Port;
}WebsocketAPNSConnector;

//
//
//

WebsocketAPNSConnector *WebsocketAPNSConnectorNew( char *host, int port );

//
//
//

void WebsocketAPNSConnectorDelete( WebsocketAPNSConnector *wr );

//
//
//

void WebsocketAPNSConnectorThread( FThread *data );

#endif // __WEBSOCKETS_WEBSOCKET_APNS_CONNECTOR_H__


