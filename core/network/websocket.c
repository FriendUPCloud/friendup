/*??mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************??*/
/** @file
 * 
 *  Websockets
 *
 * file contain functitons related to websockets
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <getopt.h>
#include <string.h>
#include <sys/time.h>
#include <poll.h>
#include <core/types.h>
#include <core/functions.h>

#include <libwebsockets.h>
#include <network/websocket.h>
#include <util/log/log.h>
#include <core/thread.h>
#include <core/friendcore_manager.h>
#include <core/types.h>
#include <network/socket.h>
#include <network/http.h>
#include <util/string.h>
#include <system/systembase.h>
#include <system/json/jsmn.h>
#include <libwebsockets.h>
#include <system/user/user_session.h>
#include <util/base64.h>
#include <network/websocket_client.h>
#include <websockets/websocket_req_manager.h>
#include <network/protocol_websocket.h>
#include <mobile_app/mobile_app.h>
#define ENABLE_MOBILE_APP_NOTIFICATIONS 0
#define ENABLE_NOTIFICATIONS_SINK 1

//#define WS_COMPRESSION

#if ENABLE_MOBILE_APP_NOTIFICATIONS == 1
#include <mobile_app/mobile_app_websocket.h>
#endif

#if ENABLE_NOTIFICATIONS_SINK == 1
#include <mobile_app/notifications_sink_websocket.h>
#endif

extern pthread_mutex_t WSThreadMutex;

static void dump_handshake_info(struct lws_tokens *lwst);

static int callback_http( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len);

//
// Extensions
//

static const struct lws_extension exts[] = {
	{
		"permessage-deflate",
		lws_extension_callback_pm_deflate,
		"permessage-deflate"
		 "; client_no_context_takeover"
		 "; client_max_window_bits"
	},
	{ NULL, NULL, NULL /* terminator */ }
};

//
//
//

struct a_message {
	void *payload;
	size_t len;
};

enum FriendProtocols {
	// always first 
	PROTOCOL_HTTP = 0,
	PROTOCOL_LWS_MIRROR,

	// always last 
	FRIEND_PROTOCOL
};


#define LOCAL_RESOURCE_PATH "libwebsockets-test-server"

struct per_session_data__http {
	lws_filefd_type fd;
#ifdef LWS_WITH_CGI
	struct lws_cgi_args args;
#endif
#if defined(LWS_WITH_CGI) || !defined(LWS_NO_CLIENT)
	int reason_bf;
#endif
	unsigned int client_finished:1;

	struct lws_spa *spa;
	char result[ 500 + LWS_PRE ];
	int result_len;

	char filename[ 256 ];
	long file_length;
	lws_filefd_type post_fd;
};


// list of supported protocols and callbacks 

static struct lws_protocols protocols[] = {
	// first protocol must always be HTTP handler 
	{
		"http-only",		/* name */
		callback_http,		/* callback */
		sizeof (struct per_session_data__http),	/* per_session_data_size */
		0,			/* max frame size / rx buffer */
		1,
		NULL,
		0
	},
	{
		"FC-protocol",
		FC_Callback,
		sizeof( struct WSCData ),
		WS_PROTOCOL_BUFFER_SIZE,
		2,
		NULL,
		WS_PROTOCOL_BUFFER_SIZE
	},
	{
		NULL, NULL, 0, 0, 0, NULL, 0 		// End of list 
	}
};

// list of supported protocols and callbacks 

static struct lws_protocols protocols1[] = {
	// first protocol must always be HTTP handler 
	{
		"http-only",		//
		callback_http,		// callback 
		sizeof (struct per_session_data__http),	// per_session_data_size 
		0,			// max frame size / rx buffer 
		1,
		NULL,
		0
	},
	{
		"FriendService-v1",
		WebsocketNotificationsSinkCallback,
		sizeof( struct MobileAppNotif ),
		WS_PROTOCOL_BUFFER_SIZE,
		4, //id - not used for anything yet
		NULL,
		0
	},
	{
		NULL, NULL, 0, 0, 0, NULL, 0 		// End of list 
	}
};

// list of supported protocols and callbacks 

static struct lws_protocols protocols2[] = {
	// first protocol must always be HTTP handler 
	{
		"http-only",		/* name */
		callback_http,		/* callback */
		sizeof (struct per_session_data__http),	/* per_session_data_size */
		0,			/* max frame size / rx buffer */
		1,
		NULL,
		0
	},
	{
		"FriendApp-v1",
		WebsocketAppCallback,
		sizeof( struct MobileAppNotif ),
		WS_PROTOCOL_BUFFER_SIZE,
		3, //id - not used for anything yet
		NULL,
		0
	},
	{
		NULL, NULL, 0, 0, 0, NULL, 0 		// End of list 
	}
};

void hand(int s )
{
	DEBUG("[WS] Signal handler %d\n", s);
}

/**
 * Main Websockets thread
 *
 * @param data pointer to Websockets thread
 * @return 0 when success, otherwise error number
 */
int WebsocketThread( FThread *data )
{
	pthread_detach( pthread_self() );
	signal(SIGPIPE, SIG_IGN);
	
	int cnt = 0;
	WebSocket *ws = (WebSocket *)data->t_Data;
	if( ws == NULL || ws->ws_Context == NULL )
	{
		Log( FLOG_ERROR, "[WebsocketThread] WsContext is empty\n");
		pthread_exit( NULL );
		return 0;
	}
	
	DEBUG1("[WS] Websocket thread started\n");
	
	//signal( SIGPIPE, hand );

	if( ws->ws_ExtendedDebug )
	{
		lws_set_log_level( LLL_ERR | LLL_WARN | LLL_NOTICE | LLL_INFO | LLL_DEBUG , NULL );
	}
	
	Log( FLOG_INFO, "[WS] Service will be started now\n" );

	int n = 0;
	while( n >= 0 )
	{
		n = lws_service( ws->ws_Context, -1 );
		if( ws->ws_Quit == TRUE )
		{
			if( ws->ws_NumberCalls <= 0 )
			{
				FINFO("WS Quit!\n");
				break;
			}
			else
			{
				FINFO("WS Quit! but threads left: %d\n", ws->ws_NumberCalls );
				cnt++;
				
				if( cnt > 100 )
				{
					Log( FLOG_INFO, "[WS] Service stopping threads: %d\n", ws->ws_NumberCalls );
					cnt = 0;
				}
			}
		}
		usleep( 50 );
	}
	Log( FLOG_INFO, "[WS] Service stopped\n" );

done:
	data->t_Launched = FALSE;
	pthread_exit( NULL );
	return 0;
}

/**
 * Websocket start thread function
 *
 * @param ws pointer to WebSocket structure
 * @return 0 when success, otherwise error number
 */
int WebSocketStart( WebSocket *ws )
{
	DEBUG1("[WS] Starting websocket thread\n");
	ws->ws_Thread = ThreadNew( WebsocketThread, ws, TRUE, NULL );
	return 0;
}

/**
 * Create WebSocket structure
 *
 * @param sb pointer to SystemBase
 * @param port port on which WS will work
 * @param sslOn TRUE when WS must be secured through SSL, otherwise FALSE
 * @param proto protocols
 * @param extDebug enable extended debug
 * @param timeout Websockets timeout
 * @param katime timeout to all libwebsocket sockets, client or server
 * @param kaprobes times to try to get a response from the peer before giving up and killing the connection
 * @param kainterval if ka_time was nonzero, how long to wait before each ka_probes attempt
 * @return pointer to new WebSocket structure, otherwise NULL
 */
WebSocket *WebSocketNew( void *sb,  int port, FBOOL sslOn, int proto, FBOOL extDebug, int timeout, int katime, int kaprobes, int kainterval )
{
	WebSocket *ws = NULL;
	SystemBase *lsb = (SystemBase *)sb;
	
	DEBUG1("[WS] New websocket\n");
	
	if( ( ws = FCalloc( 1, sizeof( WebSocket ) ) ) != NULL )
	{
		//char *fhome = getenv( "FRIEND_HOME" );
		ws->ws_FCM = lsb->fcm;
		ws->ws_ExtendedDebug = extDebug;
		
		ws->ws_Port = port;
		ws->ws_UseSSL = sslOn;
		ws->ws_OldTime = 0;
		ws->ws_InterfaceName[ 0 ] = 0;
		memset( &(ws->ws_Info), 0, sizeof ws->ws_Info );
		ws->ws_Opts = 0;
		ws->ws_Interface = NULL;
		
		pthread_mutex_init( &(ws->ws_Mutex), NULL );
		
		if( ws->ws_UseSSL == TRUE )
		{
			INFO("[WS] WebSocket: SSL Enabled\n");
			
			ws->ws_CertPath = lsb->RSA_SERVER_CERT;
			ws->ws_KeyPath = lsb->RSA_SERVER_KEY;
			
			DEBUG1("[WS] server cert %s keycert %s\n", ws->ws_CertPath, ws->ws_KeyPath );
		}
		
		if( ws->ws_AllowNonSSL == TRUE )
		{
			 //ws->ws_Opts |= LWS_SERVER_OPTION_ALLOW_NON_SSL_ON_SSL_PORT;
		}
		
		ws->ws_Info.port = ws->ws_Port;
		if( proto == WEBSOCKET_TYPE_BROWSER )
		{
			ws->ws_Info.protocols = protocols;
#ifdef WS_COMPRESSION
			ws->ws_Info.extensions = exts;
#endif
		}
		else if( proto == WEBSOCKET_TYPE_EXTERNAL )
		{
			ws->ws_Info.protocols = protocols1;
		}
		else	// MOBILE
		{
			ws->ws_Info.protocols = protocols2;
		}
		ws->ws_Info.iface = ws->ws_Interface;
		ws->ws_Info.gid = -1;
		ws->ws_Info.uid = -1;
		ws->ws_Info.extensions = NULL;
		ws->ws_Info.ssl_cert_filepath = ws->ws_CertPath;
		ws->ws_Info.ssl_private_key_filepath = ws->ws_KeyPath;
		ws->ws_Info.options = ws->ws_Opts;// | LWS_SERVER_OPTION_REQUIRE_VALID_OPENSSL_CLIENT_CERT;
		//ws->ws_Info.timeout_secs = 120;
		//ws->ws_Info.timeout_secs_ah_idle = 90;
		//ws->ws_Info.ws_ping_pong_interval = timeout;
		ws->ws_Info.timeout_secs = timeout;
		if( katime > 0 )
		{
			ws->ws_Info.ka_time = katime;
			if( kainterval <= 0 ) kainterval = 20;
			ws->ws_Info.ka_interval = kainterval;
			if( kaprobes <= 0 ) kaprobes = 2;
			ws->ws_Info.ka_probes = kaprobes;
		}
		int ka_time;
	//*< CONTEXT: 0 for no TCP keepalive, otherwise apply this keepalive
	// * timeout to all libwebsocket sockets, client or server 
	// int ka_probes;
	// *< CONTEXT: if ka_time was nonzero, after the timeout expires how many
	//times to try to get a response from the peer before giving up
	//and killing the connection 
	// int ka_interval;
	// *< CONTEXT: if ka_time was nonzero, how long to wait before each ka_probes
	//attempt 
	// unsigned int timeout_secs;
	// *< VHOST: various processes involving network roundtrips in the
	// library are protected from hanging forever by timeouts.  If
	//nonzero, this member lets you set the timeout used in seconds.
	//Otherwise a default timeout is used. 
		

		ws->ws_Info.timeout_secs = 20;
#ifdef __DEBUG
		ws->ws_Info.timeout_secs_ah_idle = 20;
#endif
		if( ws->ws_UseSSL == TRUE ) 
		{
			ws->ws_Info.options |= LWS_SERVER_OPTION_REDIRECT_HTTP_TO_HTTPS;
		}
		
		ws->ws_Info.user = ws;
		
		//ws->ws_Info.extensions = lws_get_internal_extensions();
		//ws->ws_Info.extensions->per_context_private_data = ws;
		//ws->ws_Info.ssl_cipher_list = "ALL";
		
		ws->ws_Info.ssl_cipher_list = "ECDHE-ECDSA-AES256-GCM-SHA384:"
			       "ECDHE-RSA-AES256-GCM-SHA384:"
			       "DHE-RSA-AES256-GCM-SHA384:"
			       "ECDHE-RSA-AES256-SHA384:"
			       "HIGH:!aNULL:!eNULL:!EXPORT:"
			       "!DES:!MD5:!PSK:!RC4:!HMAC_SHA1:"
			       "!SHA1:!DHE-RSA-AES128-GCM-SHA256:"
			       "!DHE-RSA-AES128-SHA256:"
			       "!AES128-GCM-SHA256:"
			       "!AES128-SHA256:"
			       "!DHE-RSA-AES256-SHA256:"
			       "!AES256-GCM-SHA384:"
			       "!AES256-SHA256:"
			       "ECDH-SHA22-NISTP256";
		
		ws->ws_CountPollfds = 0;
		
		//ws->ws_Info.ka_time = 15;
		//lws_set_log_level( 0, lwsl_emit_syslog);
		
		ws->ws_Context = lws_create_context( &ws->ws_Info );
		if( ws->ws_Context == NULL )
		{
			Log( FLOG_ERROR, "[WebSocketNew] Libwebsocket init failed, cannot create context\n" );
			FFree( ws );
			return NULL;
		}
		
		INFO("[WS] NEW Websockets ptr %p context %p\n", ws, ws->ws_Context);
	}
	else
	{
		Log( FLOG_ERROR, "[WebSocketNew] Cannot allocate memory for WebSocket\n");
	}
	
	DEBUG1("[WS] Websocket created\n");
	
	return ws;
}

/**
 * Websocket delete function
 *
 * @param ws pointer to WebSocket structure which will be deleted
 */
void WebSocketDelete( WebSocket* ws )
{
	if( ws != NULL )
	{
		ws->ws_Quit = TRUE;
		DEBUG("[WS] Websocket close in progress\n");
		int tries = 0;
		
#ifdef ENABLE_WEBSOCKETS_THREADS
		while( TRUE )
		{
			if( ws->ws_NumberCalls <= 0 && ws->ws_Thread->t_Launched == FALSE )
			{
				break;
			}
			DEBUG("[WS] Closing WS. Threads: %d\n", ws->ws_NumberCalls );
			sleep( 1 );
			
			tries++;
			if( tries > 30 )
			{
				//WorkerManagerDebug( SLIB );
				tries = 0;
				break;
			}
		}
#endif
		Log( FLOG_DEBUG, "[WS] Closing thread\n");
		
		if( ws->ws_Thread )
		{
			ThreadDelete( ws->ws_Thread );
			ws->ws_Thread = NULL;
		}
		
		pthread_mutex_destroy( &(ws->ws_Mutex) );
		
		Log( FLOG_DEBUG, "[WS] Thread closed, context: %p\n", ws->ws_Context );
		
		if( ws->ws_Context != NULL )
		{
			//lws_context_deprecate( ws->ws_Context, 0 );
			lws_context_destroy( ws->ws_Context );
			ws->ws_Context = NULL;
			DEBUG( "[WS] context destroyed\n");
		}
			
		FFree( ws );
	}
}


//
// this protocol server (always the first one) just knows how to do HTTP 
//

static int callback_http( struct lws *wsi __attribute__((unused)), enum lws_callback_reasons reason, void *user __attribute__((unused)), void *in, size_t len __attribute__((unused)))
{
	
	int n;
	char client_name[ 128 ];
	char client_ip[ 128 ];
	
	WebSocket *ws =  (WebSocket *)in;

	switch( reason ) 
	{
		case LWS_CALLBACK_HTTP:
			DEBUG1( "[WS] serving HTTP URI %s\n", (char *)in );
		break;

	//
	 // callback for confirming to continue with client IP appear in
	 // protocol 0 callback since no websocket protocol has been agreed
	 // yet.  You can just ignore this if you won't filter on client IP
	 // since the default uhandled callback return is 0 meaning let the
	 // connection continue.
	 //

	case LWS_CALLBACK_FILTER_NETWORK_CONNECTION:

		//lws_get_peer_addresses( this, wsi, (int)(long)user, client_name, sizeof(client_name), client_ip, sizeof(client_ip) );
		// if we returned non-zero from here, we kill the connection 
		break;

	default:
		//DEBUG1("[WS]:Default\n");
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
		[WSI_TOKEN_HTTP] = "Http"
	//	[WSI_TOKEN_MUXURL]	= "MuxURL",
	};
	
	for (n = 0; n < WSI_TOKEN_COUNT; n++) 
	{
		if ( lwst[n].token == NULL )
		{
			continue;
		}
	}
}

/**
 * Add websocket connection to user session
 *
 * @param locsb pointer to SystemBase
 * @param wsi pointer to libwebsockets
 * @param sessionid sessionid to which 
 * @param authid authentication id
 * @param data pointer to WSCData
 * @return 0 if connection was added without problems otherwise error number
 */

int AttachWebsocketToSession( void *locsb, struct lws *wsi, const char *sessionid, const char *authid, WSCData *data )
{
    SystemBase *l = (SystemBase *)locsb;
    
	if( l->sl_USM == NULL )
	{
		return -1;
	}
	
	UserSession *actUserSess = NULL;
	char lsessionid[ DEFAULT_SESSION_ID_SIZE ];
	
	Log( FLOG_INFO, "[WS] Addwebsocket connection. SessionID %s. Authid %s\n", sessionid, authid );
	
	if( authid != NULL )
	{
		SQLLibrary *sqllib  = l->LibrarySQLGet( l );

		// Get authid from mysql
		if( sqllib != NULL )
		{
			char qery[ 1024 ];
			
			sqllib->SNPrintF( sqllib, qery, 1024, \
				 "SELECT * FROM ( ( SELECT u.SessionID FROM FUserSession u, FUserApplication a WHERE a.AuthID=\"%s\" AND a.UserID = u.UserID LIMIT 1 ) \
				UNION ( SELECT u2.SessionID FROM FUserSession u2, Filesystem f WHERE f.Config LIKE \"%s%s%s\" AND u2.UserID = f.UserID LIMIT 1 ) ) z LIMIT 1",
				( char *)authid, "%", ( char *)authid, "%"
			);

			void *res = sqllib->Query( sqllib, qery );
			if( res != NULL )
			{
				DEBUG("[WS] Called %s\n",  qery );
				
				char **row;
				if( ( row = sqllib->FetchRow( sqllib, res ) ) )
				{
					snprintf( lsessionid, DEFAULT_SESSION_ID_SIZE, "%s", row[ 0 ] );
					sessionid = lsessionid;
				}
				sqllib->FreeResult( sqllib, res );
			}
			l->LibrarySQLDrop( l, sqllib );
		}
		DEBUG("[WS] Ok, SQL phase complete\n" );
	}
	
	actUserSess = USMGetSessionBySessionID( l->sl_USM, (char *)sessionid );
	
	if( actUserSess == NULL )
	{
		Log( FLOG_ERROR,"[WS] Cannot find user in session with sessionid %s\n", sessionid );
		return -1;
	}
	
	/*
	while( TRUE )
	{
		if( actUserSess->us_Wsi == NULL && actUserSess->us_WSD == NULL )
		{
			break;
		}
		usleep( 200 );
	}*/
	
	if( FRIEND_MUTEX_LOCK( &(actUserSess->us_Mutex) ) == 0 )
	{
		actUserSess->us_Wsi = wsi;
		actUserSess->us_WSD = data;
		
		FRIEND_MUTEX_UNLOCK( &(actUserSess->us_Mutex) );
		
		if( FRIEND_MUTEX_LOCK( &(data->wsc_Mutex) ) == 0 )
		{
			data->wsc_UserSession = actUserSess;
			data->wsc_Wsi = wsi;
			FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
		}
	}
	
	// create and use new WebSocket connection

	User *actUser = actUserSess->us_User;
	if( actUser != NULL )
	{
#ifdef WS_COMPRESSION
//		lws_set_extension_option( wsi, "permessage-deflate", "rx_buf_size", "16");
//		lws_set_extension_option( wsi, "permessage-deflate", "tx_buf_size", "16");
#endif
		
		Log( FLOG_INFO,"[WS] WebSocket connection set for user %s  sessionid %s\n", actUser->u_Name, actUserSess->us_SessionID );

		INFO("[WS] ADD WEBSOCKET CONNECTION TO USER %s\n\n",  actUser->u_Name );
	}
	else
	{
		FERROR("User sessions %s is not attached to user %lu\n", actUserSess->us_SessionID, actUserSess->us_UserID );
	}
	
	return 0;
}

/**
 * Delete websocket connection
 *
 * @param d pointer to FCWSData
 * @return 0 if connection was deleted without problems otherwise error number
 */

int DetachWebsocketFromSession( void *d, void *wsi )
{
	WSCData *data = (WSCData *)d;
	
	DEBUG("[DetachWebsocketFromSession] start\n");
	
    SystemBase *l = (SystemBase *)SLIB;
	if( data->wsc_UserSession == NULL )
	{
		DEBUG("[DetachWebsocketFromSession] session is empty!\n");
		return 1;
	}
	
	UserSession *us = NULL;
	if( FRIEND_MUTEX_LOCK( &(data->wsc_Mutex) ) == 0 )
	{
		if( data->wsc_UserSession != NULL )
		{
			us = (UserSession *)data->wsc_UserSession;
			
			WSCData *ldata = (WSCData *)us->us_WSD; 
			if( ldata != NULL && wsi != ldata->wsc_Wsi )
			{
				DEBUG("[DetachWebsocketFromSession] we cannot detach this session. Wrong WSI pointer\n");
				FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
				return 0;
			}
		}
		
		//data->wsc_UserSession = NULL;
		data->wsc_Wsi = NULL;
		FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
	}
	
	if( data->wsc_UserSession != NULL && us != NULL )
	{
		//Log( FLOG_DEBUG, "[WS] Lock DetachWebsocketFromSession\n");
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			us->us_Wsi = NULL;
			us->us_WSD = NULL;
		
			FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		}
		Log( FLOG_DEBUG, "[WS] UnLock DetachWebsocketFromSession\n");
	}
	
	if( FRIEND_MUTEX_LOCK( &(data->wsc_Mutex) ) == 0 )
	{
		data->wsc_UserSession = NULL;
		FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
	}
	
	DEBUG("[DetachWebsocketFromSession] end\n");
    return 0;
}
