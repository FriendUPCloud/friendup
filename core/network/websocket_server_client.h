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

#ifndef __NETWORK_WEBSOCKET_SERVER_CLIENT_H__
#define __NETWORK_WEBSOCKET_SERVER_CLIENT_H__

#include <core/types.h>
#include <core/nodes.h>
#include <libwebsockets.h>
#include <util/friendqueue.h>

//
//
//

typedef struct WebsocketServerClient
{
	struct MinNode 					node;
	struct lws				 		*wsc_Wsi;
	int								wsc_InUseCounter;
	void							*wsc_UserSession;
	void 							*wsc_WebsocketsData;
	pthread_mutex_t					wsc_Mutex;
	FQueue							wsc_MsgQueue;
	FBOOL							wsc_ToBeRemoved;
	time_t							wsc_LastPingTime;
}WebsocketServerClient;

//
//
//

WebsocketServerClient *WebsocketServerClientNew();

//
//
//

void WebsocketServerClientDelete( WebsocketServerClient *cl );

#endif // __NETWORK_WEBSOCKET_SERVER_CLIENT__

