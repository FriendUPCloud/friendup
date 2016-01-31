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

#ifdef WEBSOCKETS

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <getopt.h>
#include <string.h>
#include <sys/time.h>
#include <poll.h>

#include <libwebsockets.h>
#include <network/websocket.h>
#include <util/log/log.h>
#include <core/thread.h>
#include <core/types.h>
#include <network/socket.h>
#include <network/http.h>
#include <util/string.h>
#include <system/systembase.h>

extern SystemBase *SLIB;

static void dump_handshake_info(struct lws_tokens *lwst);

static int callback_http(struct libwebsocket_context * this, struct libwebsocket *wsi, enum libwebsocket_callback_reasons reason, void *user, void *in, size_t len);

//
 // This demo server shows how to use libwebsockets for one or more
 // websocket protocols in the same server
 //
 // It defines the following websocket protocols:
 //
 //  dumb-increment-protocol:  once the socket is opened, an incrementing
 //				ascii string is sent down it every 50ms.
 //				If you send "reset\n" on the websocket, then
 //				the incrementing number is reset to 0.
 //
 //  lws-mirror-protocol: copies any received packet to every connection also
 //				using this protocol, including the sender
 //


enum FriendProtocols {
	// always first 
	PROTOCOL_HTTP = 0,

	PROTOCOL_DUMB_INCREMENT,
	PROTOCOL_LWS_MIRROR,

	// always last 
	FRIEND_PROTOCOL_COUNT
};


#define LOCAL_RESOURCE_PATH "libwebsockets-test-server"

// Friend Call protocol 

//
// one of these is auto-created for each connection and a pointer to the
// appropriate instance is passed to the callback in the user parameter
//
// for this example protocol we use it to individualize the count for each
// connection.
//

struct FC_Data 
{
	int fcd_Number;
};

Http *WebSocketMsgParse( void *in, size_t len, char ***parts )
{
	Http *http = HttpNew( );
	if( http != NULL )
	{
		//
		//
		//   <!--"<TYPE>"--"<LENGTH>"--"<URL>"-->BYTES<--!>
		//
		//   TYPE - MSG - message, STR - stream   CON - new connection
		//   LENGTH - size of message, without headers
		//   URL - url with host name inside, for
		//
		//  inside bytes if MSG
		//  "param":"value" , "param":"value",.....
		//
		
		unsigned int dataSize =(unsigned int) len;
		char *stream = (char *) in;
		unsigned int j = 0;
		
		char *type = NULL;
		char *size = NULL;
		char *url = NULL;
		char *realMessage = NULL;
		int found = 0;
		int pathParts = 1;
		
		for( j = 0 ; j < len ; j++ )
		{
			//DEBUG("CHAR %c\n", stream[ j ] );
			
			if( stream[ j ] == '"' )
			{
				if( found == 0 )
				{
					type = &(stream[ j+1 ]);
				}else if( found == 2 )
				{
					size = &(stream[ j+1 ]);
				}else if( found == 4 )
				{
					url = &(stream[ j+1 ]);
				}else
				{
					stream[ j ] = 0;
				}
				found++;
			}
			else if( stream[ j ] == '>' )
			{
				realMessage = &(stream[ j ] );
				DEBUG("Message found\n");
				break;
			}
			else if( stream[ j ] == '/' && url != NULL )
			{
				pathParts++;
			}
		}
		
		DEBUG("Allocate memory for parts %d\n", pathParts );
		*parts = FCalloc( pathParts+1, sizeof( char *) );
		*parts[ 0 ] = url;
		
		DEBUG("First string in parts %s\n", *parts[ 0 ] );
		
		int selPar = 1;
		if( url != NULL )
		{
			for( j=1 ; j < strlen( url ) ; j++ )
			{
				if( url[ j ] == '/' )
				{
					url[ j ] = 0;
				
					//DEBUG("Parsing position %d  ---- selpar %d\n", j, selPar );
					//DEBUG("PARTS %s\n", (*parts)[ selPar-1 ] );
				
					(*parts)[ selPar++ ] = &url[ j+1 ];
				
					j++;
				}
			}
		}

		DEBUG("WEBSOCKET CALL size %d found type %3s\n", dataSize, type );
		
		http->parsedPostContent = HashmapNew();
		
		if( type != NULL && realMessage != NULL )
		{
			if( strncmp( "MSG", type, 3 ) == 0 )
			{
				int sizeOfMessage = 0;

				sizeOfMessage = atoi( size );
				
				http->uri = UriParse( url );
				if( http->uri == NULL )
				{
					ERROR("URI Parse problem\n");
				}
				
				DEBUG("WS message size %d   --- url: %s\n", sizeOfMessage, url );
				
				// we found our data, we must check parameters
				
				if( sizeOfMessage > 0 && realMessage != NULL )
				{
					int i;
					int dStarted = -1;
					char *key = NULL;
					char *value = NULL;
					int keySize = 0;
					int valueSize = 0;
					
					for( i=0 ; i < sizeOfMessage ; i++ )
					{
						//DEBUG(": %c\n", realMessage[ i ] );
						
						if( dStarted < 0 )
						{
							if( realMessage[ i ] == '"' )
							{
								//DEBUG("Found first part\n");
								dStarted = i+1;
								DEBUG("DSTARTED %d\n", dStarted );
							}
						}
						else
						{
							if( realMessage[ i ] == '"' )
							{
								DEBUG("Found end of message %d\n", i );
								
								realMessage[ i ] = 0; 
								
								if( key != NULL && value == NULL )
								{
									value = &realMessage[ dStarted ];
									valueSize = i - dStarted;
									DEBUG("KEY %s VALUE %s\n", key, value );
									
									if( value != NULL )
									{
										if( HashmapPut( http->parsedPostContent, StringDuplicateN( key, keySize ), StringDuplicateN( value, valueSize ) ) )
										{
											DEBUG("New values passed to POST %s %s\n", key, value );
										}
										
										key = NULL;
										value = NULL;
									}
								}
								else
								{
									if( key == NULL )
									{
										key = &realMessage[ dStarted ];
										keySize = i - dStarted;
										DEBUG("KEY FOUND %s\n", key );
									}
								}
								
								dStarted = -1;
							}
						}
					}
				}
				else
				{
					ERROR("Message size < 0 or message not found\n");
					goto error;
				}
			}
			
			if( type == NULL || url == NULL || size == NULL || realMessage == NULL )
			{
				DEBUG("Request do not contain required data\n");
				goto error;
			}
			
			return http;
			
			error:
			
			if( http != NULL )
			{
				HttpFree( http );
			}
			return NULL;
		}
		else
		{
			ERROR("Message do not contain TYPE or do not contain message\n");
			if( http != NULL )
			{
				HttpFree( http );
			}
			return NULL;
		}
	}
	else
	{
		ERROR("Cannot allocate memory for HTTP structure\n");
		if( http != NULL )
		{
			HttpFree( http );
		}
		return NULL;
	}
	
	return http;
}

//
//
//

int FC_Callback( struct libwebsocket_context * this, 	struct libwebsocket *wsi,
			enum libwebsocket_callback_reasons reason, void *user, void *in, size_t len)
{
	int n;
	struct FC_Data *pss = user;
	WebSocket *ws =  (WebSocket *) libwebsocket_context_user ( this );

	switch( reason )
	{

		case LWS_CALLBACK_ESTABLISHED:
			pss->fcd_Number = 0;
		break;

		//
		// in this protocol, we just use the broadcast action as the chance to
		// send our own connection-specific data and ignore the broadcast info
		// that is available in the 'in' parameter
		//

		//Not supported in current websocket lib
		/*
		case LWS_CALLBACK_BROADCAST:
			n = sprintf((char *)p, "%d", pss->number++);
			n = libwebsocket_write(wsi, p, n, LWS_WRITE_TEXT);
			if (n < 0) 
			{
				fprintf(stderr, "ERROR writing to socket");
				return 1;
			}
		break;*/

		case LWS_CALLBACK_RECEIVE:
			{
//				Socket *sock = SocketWSOpen( wsi );
				
				char *tmp = "<!--\"MSG\"--\"20\"--\"system.library/file\"-->BYTES<--!>";
				
				char **pathParts = NULL;
				
				if( len >= 16 )
				{
					char *cptr = (char *)in;
					
					if( strncmp( cptr, "<!--\"CON\"--\"0\"--", 16 ) == 0 )		// First Connection
					{
						int i = 0;
						char *session = NULL;
						char *endsess = cptr;
						
						for( i=18 ; i < len ; i++ )
						{
							if( endsess[ i ] == '\"' )
							{
								endsess[ i ] = 0;
								session = &cptr[ 17];
								break;
							}
						}
						
						if( session != NULL )
						{
							if( SLIB->AddWebSocketConnection( SLIB, wsi, session ) >= 0 )
							{
								INFO("Webscoket communication set with user (sessionid) %s\n", session );
							}
						}
					}
					else	// other calls
					{
				//
						Http *request = WebSocketMsgParse( in, len, &pathParts );
						if( request != NULL )
						{
							if( strcmp( pathParts[ 0 ], "system.library" ) == 0)
							{
								DEBUG("Call syswebrequest\n");
								Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), request );
						
								char header[ 128 ];
								sprintf( header, "<!--\"MSG\"--\"%d\"-->", response->sizeOfContent );
						
								DEBUG("Request called, response ptr %p\n", response );
								if( response != NULL )
								{
									unsigned char *buf;
							
									buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
									if( buf != NULL )
									{
										//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
										memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, response->content,  response->sizeOfContent );
							
										DEBUG("Wrote to websockets %d, string %s size %d\n", n, response->content, strlen( response->content ) );
										//n = libwebsocket_write( wsi,  response->content, response->sizeOfContent, LWS_WRITE_TEXT);
										n = libwebsocket_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , response->sizeOfContent, LWS_WRITE_TEXT);
								
										FFree( buf );
									}
								}
								DEBUG("SysWebRequest return %d\n", n  );
							}
							HttpFree( request );
						}
						else
						{
							DEBUG("Send Error response\n");
							int size = LWS_SEND_BUFFER_PRE_PADDING + 256 +LWS_SEND_BUFFER_POST_PADDING;
							char buf[ size ];
							char *msg = " { \"ErrorMessage\":\"Request do not contain required data\" }";
							strcpy( (char *)(buf+LWS_SEND_BUFFER_PRE_PADDING), msg );
							ERROR("Cannot parse websocket message: %s\n", (char *)in );
							n = libwebsocket_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , strlen( msg ), LWS_WRITE_TEXT);
						}
						DEBUG("FreeParts\n");
					}
					
					if( pathParts != NULL )
					{
						FFree( pathParts );
					}
				}
			}
		break;

	//
	 // this just demonstrates how to use the protocol filter. If you won't
	 // study and reject connections based on header content, you don't need
	 // to handle this callback
	 //

	case LWS_CALLBACK_FILTER_PROTOCOL_CONNECTION:
		dump_handshake_info((struct lws_tokens *)(long)user);
		// you could return non-zero here and kill the connection 
		break;

	default:
		break;
	}

	return 0;
}


// lws-mirror_protocol 



struct per_session_data__lws_mirror {
	struct libwebsocket *wsi;
	int ringbuffer_tail;
};

struct a_message {
	void *payload;
	size_t len;
};

static struct a_message ringbuffer[MAX_MESSAGE_QUEUE];
static int ringbuffer_head;


static int
callback_lws_mirror(struct libwebsocket_context * this,	struct libwebsocket *wsi,	enum libwebsocket_callback_reasons reason, void *user, void *in, size_t len)
{
	int n;
	struct per_session_data__lws_mirror *pss = user;

	switch (reason) 
	{

	case LWS_CALLBACK_ESTABLISHED:
		pss->ringbuffer_tail = ringbuffer_head;
		pss->wsi = wsi;
		libwebsocket_callback_on_writable(this, wsi);
		break;

	case LWS_CALLBACK_SERVER_WRITEABLE:

		if (pss->ringbuffer_tail != ringbuffer_head) {

			n = libwebsocket_write(wsi, (unsigned char *)
				   ringbuffer[pss->ringbuffer_tail].payload +
				   LWS_SEND_BUFFER_PRE_PADDING,
				   ringbuffer[pss->ringbuffer_tail].len,
								LWS_WRITE_TEXT);

			if (n < 0) {
				fprintf(stderr, "ERROR writing to socket");
				exit(1);
			}

			if (pss->ringbuffer_tail == (MAX_MESSAGE_QUEUE - 1))
				pss->ringbuffer_tail = 0;
			else
				pss->ringbuffer_tail++;

			if (((ringbuffer_head - pss->ringbuffer_tail) %
				  MAX_MESSAGE_QUEUE) < (MAX_MESSAGE_QUEUE - 15))
				libwebsocket_rx_flow_control(wsi, 1);

			libwebsocket_callback_on_writable(this, wsi);

		}
		break;
/*
	case LWS_CALLBACK_BROADCAST:
		n = libwebsocket_write(wsi, in, len, LWS_WRITE_TEXT);
		if (n < 0)
			fprintf(stderr, "mirror write failed\n");
		break;
*/
	case LWS_CALLBACK_RECEIVE:

		if (ringbuffer[ringbuffer_head].payload)
			free(ringbuffer[ringbuffer_head].payload);

		ringbuffer[ringbuffer_head].payload =
				malloc(LWS_SEND_BUFFER_PRE_PADDING + len +
						  LWS_SEND_BUFFER_POST_PADDING);
		ringbuffer[ringbuffer_head].len = len;
		memcpy((char *)ringbuffer[ringbuffer_head].payload +
					  LWS_SEND_BUFFER_PRE_PADDING, in, len);
		if (ringbuffer_head == (MAX_MESSAGE_QUEUE - 1))
			ringbuffer_head = 0;
		else
			ringbuffer_head++;

		if (((ringbuffer_head - pss->ringbuffer_tail) %
				  MAX_MESSAGE_QUEUE) > (MAX_MESSAGE_QUEUE - 10))
			libwebsocket_rx_flow_control(wsi, 0);

		libwebsocket_callback_on_writable_all_protocol(
					       libwebsockets_get_protocol(wsi));
		break;

	//
	// this just demonstrates how to use the protocol filter. If you won't
	// study and reject connections based on header content, you don't need
	// to handle this callback
	//

	case LWS_CALLBACK_FILTER_PROTOCOL_CONNECTION:
		dump_handshake_info((struct lws_tokens *)(long)user);
		// you could return non-zero here and kill the connection 
		break;

	default:
		break;
	}

	return 0;
}


/* list of supported protocols and callbacks */

static struct libwebsocket_protocols protocols[] = {
	/* first protocol must always be HTTP handler */

	{
		"http-only",		/* name */
		callback_http,		/* callback */
		0			/* per_session_data_size */
	},
	{
		"FC-protocol",
		FC_Callback,
		sizeof( struct FC_Data ),
	},
	{
		"lws-mirror-protocol",
		callback_lws_mirror,
		sizeof(struct per_session_data__lws_mirror)
	},
	{
		NULL, NULL, 0		/* End of list */
	}
};

//
//
//

int WebsocketThread( FThread *data )
{
	WebSocket *ws = data->t_Data;
	
	//
	// This is an example of an existing application's explicit poll()
	// loop that libwebsockets can integrate with.
	//
	
	int n = 0;

	while( ws->ws_Quit != TRUE )
	{
		struct timeval tv;

		//
		// this represents an existing server's single poll action
		// which also includes libwebsocket sockets
		//

		n = poll( ws->ws_Pollfds, ws->ws_CountPollfds, MAX_POLL_ELEMENTS );
		if (n < 0)
		{
			goto done;
		}

		if ( n )
		{
			for ( n = 0; n < ws->ws_CountPollfds; n++ )
			{
				if ( ws->ws_Pollfds[n].revents )
				{
					//
					// returns immediately if the fd does not
					// match anything under libwebsockets
					// control
					//
					libwebsocket_service_fd( ws->ws_Context, &(ws->ws_Pollfds[n]) );
				}
			}
		}

		// do our broadcast periodically 

		gettimeofday(&tv, NULL);

		//
		// This broadcasts to all dumb-increment-protocol connections
		// at 20Hz.
		//
		// We're just sending a character 'x', in these examples the
		// callbacks send their own per-connection content.
		//
		// You have to send something with nonzero length to get the
		// callback actions delivered.
		//
		// We take care of pre-and-post padding allocation.
		//

		if ( ((unsigned int) tv.tv_usec - (unsigned int)ws->ws_OldTime ) > 500000 ) 
		{
			/*
			libwebsockets_broadcast(
					&protocols[PROTOCOL_DUMB_INCREMENT],
					&buf[LWS_SEND_BUFFER_PRE_PADDING], 1);
			oldus = tv.tv_usec;
			*/
			ws->ws_OldTime =  tv.tv_usec;
		}
	}

done:
	

	return 0;
}

//
//
//

int WebSocketStart( WebSocket *ws )
{
	ws->ws_Thread = ThreadNew( WebsocketThread, ws );
	
	return 0;
}

//
//
//

WebSocket *WebSocketNew( void *fcm,  int port, BOOL sslOn )
{
	WebSocket *ws = NULL;
	
	if( ( ws = FCalloc( 1, sizeof(WebSocket) ) ) != NULL )
	{
		char *fhome = getenv("FRIEND_HOME");
		ws->ws_FCM = fcm;
		
		ws->ws_Port = port;
		ws->ws_UseSSL = FALSE;
		ws->ws_OldTime = 0;
		ws->ws_InterfaceName[ 0 ] = 0;
		memset( &(ws->ws_Info), 0, sizeof ws->ws_Info );
		ws->ws_Interface = NULL;
		
		if( ws->ws_UseSSL == TRUE )
		{
			ws->ws_CertPath = FCalloc( 1512, sizeof(char) );
			ws->ws_KeyPath = FCalloc( 1512, sizeof(char) );
		
			sprintf( ws->ws_CertPath, "%s%s", fhome, "/libwebsockets-test-server.pem" );
			sprintf( ws->ws_KeyPath, "%s%s", fhome, "/libwebsockets-test-server.key.pem" );
		}

			/*
		case 'k':
			opts = LWS_SERVER_OPTION_DEFEAT_CLIENT_MASK;
			break;
			*/
		ws->ws_Info.port = ws->ws_Port;
		ws->ws_Info.protocols = protocols;
		ws->ws_Info.iface = ws->ws_Interface;
		ws->ws_Info.ssl_cert_filepath = ws->ws_CertPath;
		ws->ws_Info.ssl_private_key_filepath = ws->ws_KeyPath;
		ws->ws_Info.options = ws->ws_Opts;
		ws->ws_Info.user = ws;
		ws->ws_Info.extensions = libwebsocket_get_internal_extensions();
//		ws->ws_Info.extensions->per_context_private_data = ws;
		
		ws->ws_CountPollfds = 0;

		ws->ws_Context = libwebsocket_create_context( &(ws->ws_Info) );
		if (ws->ws_Context == NULL) 
		{
			ERROR( "libwebsocket init failed\n");
			if( ws->ws_CertPath != NULL )
			{
				FFree( ws->ws_CertPath );
				FFree( ws->ws_KeyPath );
			}
			FFree( ws );
			return NULL;
		}
		
		INFO("WEBSOCKET NEW Websockets ptr %p context %p\n", ws, ws->ws_Context);

		ws->ws_Buf[ LWS_SEND_BUFFER_PRE_PADDING ] = 'x';
			
	}
	else
	{
		ERROR("Cannot allocate memory for WebSocket\n");
	}
	
	return ws;
}

//
//
//

void WebSocketFree( WebSocket* ws )
{
	if( ws != NULL )
	{
		ws->ws_Quit = TRUE;
		
		if( ws->ws_Thread )
		{
			ThreadDelete( ws->ws_Thread );
		}
		
		libwebsocket_context_destroy( ws->ws_Context );
		
		if( ws->ws_CertPath != NULL )
		{
			FFree( ws->ws_CertPath );
			FFree( ws->ws_KeyPath );
		}
			
		FFree( ws );
	}
}


//
// this protocol server (always the first one) just knows how to do HTTP 
//

static int callback_http(struct libwebsocket_context * this, struct libwebsocket *wsi, enum libwebsocket_callback_reasons reason, void *user, void *in, size_t len)
{
	
	int n;
	char client_name[ 128 ];
	char client_ip[ 128 ];
	
	WebSocket *ws =  (WebSocket *) libwebsocket_context_user ( this );
	
	INFO("CALLBACKHTTP get context user WS %p context %p  USER %p\n", ws, this, user );

	switch( reason ) 
	{
		case LWS_CALLBACK_HTTP:
			DEBUG( "serving HTTP URI %s\n", (char *)in );

		if ( in && strcmp(in, "/favicon.ico") == 0 ) 
		{
			if (libwebsockets_serve_http_file( this, wsi,
			     LOCAL_RESOURCE_PATH"/favicon.ico", "image/x-icon") )
			{
				DEBUG( "Failed to send favicon\n");
			}
			break;
		}

		/* send the script... when it runs it'll start websockets */

		if ( libwebsockets_serve_http_file( this, wsi, LOCAL_RESOURCE_PATH"/test.html", "text/html") )
		{
			DEBUG( "Failed to send HTTP file\n");
		}
		break;

	//
	 // callback for confirming to continue with client IP appear in
	 // protocol 0 callback since no websocket protocol has been agreed
	 // yet.  You can just ignore this if you won't filter on client IP
	 // since the default uhandled callback return is 0 meaning let the
	 // connection continue.
	 //

	case LWS_CALLBACK_FILTER_NETWORK_CONNECTION:

		libwebsockets_get_peer_addresses( this, wsi, (int)(long)user, client_name, sizeof(client_name), client_ip, sizeof(client_ip) );

		INFO( "Received network connect from %s (%s)\n", client_name, client_ip );

		// if we returned non-zero from here, we kill the connection 
		break;

	//
	// callbacks for managing the external poll() array appear in
	// protocol 0 callback
	//
		
	DEBUG("USEPTR %p\n", user );

	case LWS_CALLBACK_ADD_POLL_FD:
		
		DEBUG("ADDPOLLFD %ld  events %d\n", (long)user , ws->ws_CountPollfds );
		
		ws->ws_Pollfds[ ws->ws_CountPollfds ].fd = (int)(long)user;
		ws->ws_Pollfds[ ws->ws_CountPollfds ].events = (int)len;
		ws->ws_Pollfds[ ws->ws_CountPollfds++ ].revents = 0;
	break;

	case LWS_CALLBACK_DEL_POLL_FD:
		DEBUG("LWS_CALLBACK_DEL_POLL_FD\n");
		for (n = 0; n < ws->ws_CountPollfds; n++)
		{
			if (ws->ws_Pollfds[n].fd == (int)(long)user)
			{
				while (n < ws->ws_CountPollfds) 
				{
					ws->ws_Pollfds[n] = ws->ws_Pollfds[n + 1];
					n++;
				}
			}
		}
		ws->ws_CountPollfds--;
		break;

	case LWS_CALLBACK_SET_MODE_POLL_FD:
		DEBUG("LWS_CALLBACK_SET_MODE_POLL_FD\n");
		for (n = 0; n < ws->ws_CountPollfds; n++)
		{
			if (ws->ws_Pollfds[n].fd == (int)(long)user)
			{
				ws->ws_Pollfds[n].events |= (int)(long)len;
			}
		}
		break;

	case LWS_CALLBACK_CLEAR_MODE_POLL_FD:
		DEBUG("LWS_CALLBACK_CLEAR_MODE_POLL_FD\n");
		for (n = 0; n < ws->ws_CountPollfds; n++)
		{
			if (ws->ws_Pollfds[n].fd == (int)(long)user)
			{
				ws->ws_Pollfds[n].events &= ~(int)(long)len;
			}
		}
		break;

	default:
		DEBUG("Default\n");
		break;
	}

	return 0;
}

//
// this is just an example of parsing handshake headers, you don't need this
// in your code unless you will filter allowing connections by the header
// content
//

static void dump_handshake_info(struct lws_tokens *lwst)
{
	int n;
	static const char *token_names[] = {
		[WSI_TOKEN_GET_URI] = "GET URI",
		[WSI_TOKEN_HOST] = "Host",
		[WSI_TOKEN_CONNECTION] = "Connection",
		[WSI_TOKEN_KEY1] = "key 1",
		[WSI_TOKEN_KEY2] = "key 2",
		[WSI_TOKEN_PROTOCOL] = "Protocol",
		[WSI_TOKEN_UPGRADE] = "Upgrade",
		[WSI_TOKEN_ORIGIN] = "Origin",
		[WSI_TOKEN_DRAFT] = "Draft",
		[WSI_TOKEN_CHALLENGE] = "Challenge",

		// new for 04 
		[WSI_TOKEN_KEY] = "Key",
		[WSI_TOKEN_VERSION] = "Version",
		[WSI_TOKEN_SWORIGIN] = "Sworigin",

		// new for 05 
		[WSI_TOKEN_EXTENSIONS] = "Extensions",

		// client receives these 
		[WSI_TOKEN_ACCEPT] = "Accept",
		[WSI_TOKEN_NONCE] = "Nonce",
		[WSI_TOKEN_HTTP] = "Http",
		[WSI_TOKEN_MUXURL]	= "MuxURL",
	};
	
	for (n = 0; n < WSI_TOKEN_COUNT; n++) 
	{
		if ( lwst[n].token == NULL )
		{
			continue;
		}

		//DEBUG( "    %s = %s\n", token_names[n], lwst[n].token);
	}
}


#endif

