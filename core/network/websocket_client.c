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
#include <core/thread.h>

extern SystemBase *SLIB;

typedef struct WClientData 
{
	WebsocketClient			*wcd_WSClient;
}WClientData;

#define WSCLIENT_RX_BUFFER_BYTES (8192)


#define FLUSH_QUEUE() if( wcd->wcd_WSClient != NULL ) \
{ \
	FQueue *q = &(wcd->wcd_WSClient->wsc_MsgQueue); \
	if( q->fq_First != NULL ) \
	{ \
		lws_callback_on_writable( wcd->wcd_WSClient->wsc_WSI ); \
	} \
}

enum protocols
{
	PROTOCOL_FRIEND = 0,
	PROTOCOL_COUNT
};

static int WebsocketClientCallback( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len )
{
	WClientData *cd = (WClientData *)user;
	
	DEBUG("[WebsocketClientCallback] start, reason: %d msgsize: %lu\n", reason, len );
	
	switch( reason )
	{
		case LWS_CALLBACK_CLIENT_ESTABLISHED:
			//lws_callback_on_writable( wsi );
			break;

		case LWS_CALLBACK_CLIENT_RECEIVE:
			// Handle incomming messages here. 
			if( cd->wcd_WSClient->wc_ReceiveCallback != NULL )
			{
				cd->wcd_WSClient->wc_ReceiveCallback( (void *)cd, (char *)in, (int)len );
			}
			break;

		case LWS_CALLBACK_CLIENT_WRITEABLE:
		{
			DEBUG1("[WS] LWS_CALLBACK_SERVER_WRITEABLE\n");
			
			if( cd->wcd_WSClient == NULL )
			{
				if( in != NULL )
				{
					FFree( in );
				}
				return 0;
			}
				
			FRIEND_MUTEX_LOCK( &(cd->wcd_WSClient->wc_Mutex) );

			FQEntry *e = NULL;
			FQueue *q = &(cd->wcd_WSClient->wc_MsgQueue);
			if( ( e = FQPop( q ) ) != NULL )
			{
				FRIEND_MUTEX_UNLOCK( &(cd->wcd_WSClient->wc_Mutex) );
				unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
				t[ e->fq_Size+1 ] = 0;

				lws_write( cd->wcd_WSClient->wc_WSI, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size, LWS_WRITE_TEXT );

				int w = lws_send_pipe_choked( cd->wcd_WSClient->wc_WSI );

				if( e != NULL )
				{
					DEBUG("Release: %p\n", e->fq_Data );
					FFree( e->fq_Data );
					FFree( e );
				}
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &(cd->wcd_WSClient->wc_Mutex) );
			}
			
			break;
		}

		case LWS_CALLBACK_CLOSED:
		case LWS_CALLBACK_CLIENT_CONNECTION_ERROR:
			cd->wcd_WSClient->wc_ToRemove = TRUE;
			break;

		default:
			break;
	}
	//DEBUG("[WebsocketClientCallback] end\n" );

	return 0;
}

static struct lws_protocols protocols[] =
{
	{
		NULL,//"friend",
		WebsocketClientCallback,
		sizeof( WClientData ),
		WSCLIENT_RX_BUFFER_BYTES,
		0,
		NULL,
		0
	},
	{ NULL, NULL, 0, 0, 0, NULL, 0 } /* terminator */
};

//
// main client loop
//

void WebsocketClientLoop( void *data )
{
	FThread *th = (FThread *)data;
	WebsocketClient *cl = (WebsocketClient *)th->t_Data;
	DEBUG("[WebsocketClientLoop] start\n" );
	
	time_t old = 0;
	while( th->t_Quit != TRUE )
	{
		struct timeval tv;
		gettimeofday( &tv, NULL );

		// Connect if we are not connected to the server. 
		if( !cl->wc_WSI && tv.tv_sec != old )
		{
			
		}

		if( tv.tv_sec != old )
		{
			// Send a random number to the server every second. 
			//lws_callback_on_writable( cl->wc_WSI );
			old = tv.tv_sec;
		}

		lws_service( cl->ws_Context, 250 );
		
		sleep( 2 );
		//WebsocketClientSendMessage( cl, "aa", 2 );
	}
	th->t_Launched = FALSE;
	DEBUG("[WebsocketClientLoop] end\n" );
}

/* // example
 	WebsocketClient *c = WebsocketClientNew( "localhost", 9090, NULL );
	int err = WebsocketClientConnect( c );
	if( err = 0 )
	{
		
	}
	DEBUG("\n\n\n\nClient connect %d\n\n\n\n", err );
 */

/**
 * Create new WebsocketClient
 *
 * @param host - server host name
 * @param port - port on which connection will be made
 * @return new WebsocketClient structure when success, otherwise NULL
 */
WebsocketClient *WebsocketClientNew( char *host, int port, void (*fptr)( void *, char *, int ) )
{
	DEBUG("[WebsocketClientNew] start\n" );
	WebsocketClient *cl = FCalloc( 1, sizeof(WebsocketClient) );
	if( cl != NULL )
	{
		cl->wc_Host = StringDuplicate( host );
		cl->wc_Port = port;
		cl->wc_ReceiveCallback = fptr;
		pthread_mutex_init( &(cl->wc_Mutex), NULL );
		FQInit( &(cl->wc_MsgQueue) );
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
	DEBUG("[WebsocketClientDelete] start\n" );
	if( cl != NULL )
	{
		if( cl->wc_Host != NULL )
		{
			FFree( cl->wc_Host );
		}
		
		cl->wc_Thread->t_Quit = TRUE;
		while( cl->wc_Thread->t_Launched != FALSE )
		{
			usleep( 1000 );
		}
		
 		FQDeInitFree( &(cl->wc_MsgQueue) );
		
		pthread_mutex_destroy( &(cl->wc_Mutex) );
		
		lws_context_destroy( cl->ws_Context );
		
		if( cl->wc_WSData != NULL )
		{
			FFree( cl->wc_WSData );
		}
		
		FFree( cl );
		DEBUG("[WebsocketClientDelete] start\n" );
	}
}

/**
 * Connect WebsocketClient
 *
 * @param cl pointer to WebsocketClient which we want connect
 * @return 0 when success, otherwise error number
 */
int WebsocketClientConnect( WebsocketClient *cl )
{
	DEBUG("[WebsocketClientConnect] start\n" );
	if( cl->ws_Context == NULL )
	{
		memset( &(cl->ws_Info), 0, sizeof( cl->ws_Info ) );
		
		cl->ws_Info.port = CONTEXT_PORT_NO_LISTEN;
		cl->ws_Info.protocols = protocols;
		cl->ws_Info.gid = -1;
		cl->ws_Info.uid = -1;

		cl->ws_Context = lws_create_context( &(cl->ws_Info) );
		
		if( cl->ws_Context != NULL )
		{
			DEBUG("[WebsocketClientConnect] Connect to: %s port %d\n", cl->wc_Host, cl->wc_Port );
			
			cl->ws_Ccinfo.context = cl->ws_Context;
			cl->ws_Ccinfo.address = "127.0.0.1";// cl->wc_Host;
			cl->ws_Ccinfo.port = cl->wc_Port;
			cl->ws_Ccinfo.path = "/";//NULL;//"/ws";
			cl->ws_Ccinfo.host = lws_canonical_hostname( cl->ws_Context );
			cl->ws_Ccinfo.origin = "origin";
			cl->ws_Ccinfo.protocol = protocols[ PROTOCOL_FRIEND ].name;
			
			WClientData *ld = FCalloc( 1, sizeof( WClientData ) );
			ld->wcd_WSClient = cl;
			cl->wc_WSData = ld;
			cl->ws_Ccinfo.userdata = ld;
			
			cl->wc_WSI = lws_client_connect_via_info( &(cl->ws_Ccinfo) );
			if( cl->wc_WSI != NULL )
			{
				cl->wc_Thread = ThreadNew( WebsocketClientLoop, cl, TRUE, NULL );
				
				//WClientData *cd = (WClientData *)lws_get_protocol( cl->wc_WSI )->user;
				//cd->wcd_WSClient = cl;
			}
		}
		else
		{
			return 1;
		}
	}
	else
	{
		return 2;
	}
	DEBUG("[WebsocketClientConnect] end\n" );
	return 0;
}

/**
 * Send message to Websocket Client
 *
 * @param cl pointer to WebsocketClient where message will be send
 * @param msg pointer to message
 * @param len size of message
 * @return 0 when fail or number bytes added to queue to send
 */
int WebsocketClientSendMessage( WebsocketClient *cl, char *msg, int len )
{
	DEBUG("[WebsocketClientSendMessage] start\n" );
	FRIEND_MUTEX_LOCK( &(cl->wc_Mutex) );
		
	if( cl->wc_WSI != NULL && cl->wc_ToRemove == FALSE )
	{
		int val;
		
		FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
		if( en != NULL )
		{
			en->fq_Data = FMalloc( len+10+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
			memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, msg, len );
			en->fq_Size = len;
		
			FQPushFIFO( &(cl->wc_MsgQueue), en );
		}
		else
		{
			len = 0;
		}
		
		FRIEND_MUTEX_UNLOCK( &(cl->wc_Mutex) );
	
		lws_callback_on_writable( cl->wc_WSI );
	}
	else
	{
		FRIEND_MUTEX_UNLOCK( &(cl->wc_Mutex) );
		len = 0;
	}
	DEBUG("[WebsocketClientSendMessage] end\n" );
	return len;
}
