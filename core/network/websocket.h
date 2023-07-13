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
 *  Websocket structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __NETWORK_WEBSOCKET_H__
#define __NETWORK_WEBSOCKET_H__

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <getopt.h>
#include <string.h>
#include <sys/time.h>
#include <poll.h>
#include <core/types.h>

#include <openssl/ssl.h>
#include <libwebsockets.h>
#include <core/thread.h>
#include <time.h>
#include <util/buffered_string.h>
#include <util/friendqueue.h>
//#include <system/user/user_session.h>

#define MAX_MESSAGE_QUEUE 64

#define MAX_POLL_ELEMENTS 256

enum
{
	WEBSOCKET_TYPE_BROWSER = 0,
	WEBSOCKET_TYPE_EXTERNAL
};

//
// main WebSocket structure
//

typedef struct WebSocket
{
	char								*ws_CertPath;
	char								*ws_KeyPath;
	int									ws_Port;
	FBOOL								ws_UseSSL;
	FBOOL								ws_AllowNonSSL;

	struct lws_context					*ws_Context;
	char								ws_InterfaceName[128];
	char								*ws_Interface;
	struct lws_context_creation_info	ws_Info;
	int									ws_DebugLevel;
	int									ws_OldTime;
	int									ws_Opts;
						  
	// connection epoll
	struct lws_pollfd					ws_Pollfds[ MAX_POLL_ELEMENTS ];
	int									ws_CountPollfds;
	
	FThread								*ws_Thread;
	
	FBOOL								ws_Quit;
	FBOOL								ws_ExtendedDebug;
	void								*ws_FCM;
	
	int									ws_NumberCalls;
	pthread_mutex_t						ws_Mutex;
} WebSocket;


//
// FriendCoreWebsocketData structure
//

enum {
	WSC_STATUS_INIT = 0,
	WSC_STATUS_ACTIVE,
	WSC_STATUS_TO_BE_REMOVED,
	WSC_STATUS_DELETED
};

#ifndef WS_CALLS_LOG
#define WS_CALLS_LOG
#define WS_CALLS_MAX 10
#endif

typedef struct WSCData
{
	void							*wsc_UserSession;
	struct lws				 		*wsc_Wsi;
	BufString						*wsc_Buffer;
	pthread_mutex_t					wsc_Mutex;
	int								wsc_InUseCounter;
	int								wsc_UpdateLoggedTimeCounter;	// this field says how many calls left to call LoggedTime update on FUser table
	int								wsc_Status;
}WSCData;

//
//
//

WebSocket *WebSocketNew( void *sb,  int port, FBOOL sslOn, int proto, FBOOL extDebug, int timeout, int katime, int kaprobes, int kainterval );

//
//
//

void WebSocketDelete( WebSocket *ws );

//
//
//

int WebSocketStart( WebSocket *ws );

//
//
//

int AttachWebsocketToSession( void *locsb, struct lws *wsi, const char *sessionid, const char *authid, WSCData *data );

//
//
//

int DetachWebsocketFromSession( void *d, void *wsi );

#endif // __NETWORK_WEBSOCKET_H__


