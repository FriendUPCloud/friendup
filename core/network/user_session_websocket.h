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

typedef struct UserSessionWebsocket
{
	struct MinNode 					node;
	WSCData							*wusc_Data;
	int								wusc_Status;	// moved to UserSession
}UserSessionWebsocket;


//
//
//

UserSessionWebsocket *UserSessionWebsocketNew();

//
//
//

void UserSessionWebsocketDelete( UserSessionWebsocket *cl );

#endif // __NETWORK_USER_SESSION_WEBSOCKET__

