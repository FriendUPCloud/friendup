/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/


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

#ifdef ENABLE_WEBSOCKETS

#include <libwebsockets.h>
#include <core/thread.h>

#define MAX_MESSAGE_QUEUE 64

#define MAX_POLL_ELEMENTS 256

extern char RSA_SERVER_CERT[  ];
extern char RSA_SERVER_KEY[  ];
extern char RSA_SERVER_CA_CERT[  ];
extern char RSA_SERVER_CA_PATH[  ];

//
//
//

typedef struct WebSocket
{
	char 											*ws_CertPath;
	char 											*ws_KeyPath;
	int 												ws_Port;
	BOOL 											ws_UseSSL;
	BOOL 											ws_AllowNonSSL;
	
	struct libwebsocket_context 		*ws_Context;
	char 											ws_InterfaceName[128];
	char 											*ws_Interface;
	struct lws_context_creation_info ws_Info;
	int 												ws_DebugLevel;
	int 												ws_OldTime;
	int 												ws_Opts;
	
	unsigned char 								ws_Buf[LWS_SEND_BUFFER_PRE_PADDING + 1024 +
						  LWS_SEND_BUFFER_POST_PADDING];
						  
	// connection epoll
	struct pollfd 								ws_Pollfds[ MAX_POLL_ELEMENTS ];
	int 												ws_CountPollfds;
	FThread										*ws_Thread;
	
	BOOL 											ws_Quit;
	void 												*ws_FCM;
}WebSocket;


//

WebSocket *WebSocketNew( void *fcm,  int port, BOOL useSSL );

void WebSocketFree( WebSocket *ws );

int WebSocketStart( WebSocket *ws );

#endif // __NETWORK_WEBSOCKET_H__

#endif

