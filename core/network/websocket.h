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

#include <libwebsockets.h>
#include <core/thread.h>
#include <time.h>
//#include <network/websocket_server_client.h>
#include <util/buffered_string.h>
#include <util/friendqueue.h>

#define MAX_MESSAGE_QUEUE 64

#define MAX_POLL_ELEMENTS 256

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
	
	unsigned char						ws_Buf[LWS_SEND_BUFFER_PRE_PADDING + 1024 + LWS_SEND_BUFFER_POST_PADDING];
						  
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

#ifndef WS_CALLS_LOG
#define WS_CALLS_LOG
#define WS_CALLS_MAX 10
#endif

typedef struct WSCData
{
	void							*wsc_SystemBase;
	struct lws				 		*wsc_Wsi;
	int								wsc_InUseCounter;
	void							*wsc_UserSession;
	void 							*wsc_WebsocketsServerClient;
	pthread_mutex_t					wsc_Mutex;
	FQueue							wsc_MsgQueue;
	//FBOOL							wsc_ToBeRemoved;
	time_t							wsc_LastPingTime;
	//int								wsc_Status;	//enabled=0, disabled=1
	BufString						*wsc_Buffer;
	
#ifdef WS_CALLS_LOG
	int								wsc_DebugPos;
	char							wsc_DebugCalls[ WS_CALLS_MAX ][ 256 ];
#endif
}WSCData;

//
//
//

WebSocket *WebSocketNew( void *sb,  int port, FBOOL sslOn, int proto, FBOOL extDebug );

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

int AttachWebsocketToSession( void *l, struct lws *wsi, const char *sessionid, const char *authid, WSCData *data );

//
//
//

int DetachWebsocketFromSession( WSCData *data );

#endif // __NETWORK_WEBSOCKET_H__


