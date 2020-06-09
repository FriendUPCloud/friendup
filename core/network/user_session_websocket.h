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

#ifndef __NETWORK_USER_SESSION_WEBSOCKET_H__
#define __NETWORK_USER_SESSION_WEBSOCKET_H__

#include <core/types.h>
#include <core/nodes.h>
#include <libwebsockets.h>
#include <util/friendqueue.h>
#include <network/websocket.h>

enum
{
	WEBSOCKET_SERVER_CLIENT_STATUS_ENABLED = 0,
	WEBSOCKET_SERVER_CLIENT_STATUS_DISABLED,
	WEBSOCKET_SERVER_CLIENT_TO_BE_KILLED
};

//
//
//
/*
typedef struct UserSessionWebsocket
{
	int						usw_Status;	// moved to UserSession
	int						usw_WebSocketStatus;	// status of websocket
	struct lws				*usw_Wsi;				// pointer to WSI
	int						usw_WSInUseCounter;		// what is current usage
	FQueue					usw_MsgQueue;			// message queue
	time_t					usw_LastPingTime;		// ping timestamp
	void					*usw_WSD;				// pointer to WebsocketData
}UserSessionWebsocket;


//
//
//

UserSessionWebsocket *UserSessionWebsocketNew();

//
//
//

void UserSessionWebsocketDelete( UserSessionWebsocket *cl );

//
//
//

void UserSessionWebsocketInit( UserSessionWebsocket *usw );

//
//
//

void UserSessionWebsocketDeInit( UserSessionWebsocket *usw );
*/

#endif // __NETWORK_USER_SESSION_WEBSOCKET__

