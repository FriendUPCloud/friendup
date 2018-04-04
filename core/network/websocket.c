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
#define ENABLE_MOBILE_APP_NOTIFICATIONS 0
#define ENABLE_NOTIFICATIONS_SINK 0

#if ENABLE_MOBILE_APP_NOTIFICATIONS == 1
#include <mobile_app/mobile_app_websocket.h>
#endif

#if ENABLE_NOTIFICATIONS_SINK == 1
#include <mobile_app/notifications_sink_websocket.h>
#endif

extern pthread_mutex_t WSThreadMutex;
extern int WSThreadNum;

static void dump_handshake_info(struct lws_tokens *lwst);

static int callback_http( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len);



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
		sizeof( struct FCWSData ),
		WS_PROTOCOL_BUFFER_SIZE,
		2,
		NULL,
		0
	},
#if ENABLE_MOBILE_APP_NOTIFICATIONS == 1
	{
		"FriendApp-v1",
		websocket_app_callback,
		0 /*sizeof( struct FCWSData )*/, //FIXME
		WS_PROTOCOL_BUFFER_SIZE,
		1, //id - not used for anything yet
		NULL,
		0
	},
#endif
#if ENABLE_NOTIFICATIONS_SINK == 1
	{
		"FriendNotifications-v1",
		websocket_notifications_sink_callback,
		0 /*sizeof( struct FCWSData )*/, //FIXME
		WS_PROTOCOL_BUFFER_SIZE,
		1, //id - not used for anything yet
		NULL,
		0
	},
#endif
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
	int cnt = 0;
	WebSocket *ws = (WebSocket *)data->t_Data;
	if( ws->ws_Context == NULL )
	{
		FERROR("WsContext is empty\n");
		return 0;
	}
	
	DEBUG1("[WS] Websocket thread started\n");
	
	//signal( SIGPIPE, SIG_IGN );
	//signal( SIGPIPE, hand );

	//lws_set_log_level( LLL_ERR | LLL_WARN | LLL_NOTICE | LLL_INFO | LLL_DEBUG , NULL );
	
	Log( FLOG_INFO, "[WS] Service will be started now\n" );

	while( TRUE )
	{
		int n = lws_service( ws->ws_Context, 500 );
		
		if( ws->ws_Quit == TRUE && WSThreadNum <= 0 )
		{
			break;
		}
		else if( ws->ws_Quit == TRUE )
		{
			cnt++;
			
			if( cnt > 500 )
			{
				Log( FLOG_INFO, "[WS] Service stopping threads: %d\n", WSThreadNum );
				cnt = 0;
			}
		}
	}
	Log( FLOG_INFO, "[WS] Service stopped\n" );

done:
	data->t_Launched = FALSE;
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
 * @return pointer to new WebSocket structure, otherwise NULL
 */
WebSocket *WebSocketNew( void *sb,  int port, FBOOL sslOn )
{
	WebSocket *ws = NULL;
	SystemBase *lsb = (SystemBase *)sb;
	
	DEBUG1("[WS] New websocket\n");
	
	pthread_mutex_init( &WSThreadMutex, NULL );
	
	if( ( ws = FCalloc( 1, sizeof( WebSocket ) ) ) != NULL )
	{
		char *fhome = getenv( "FRIEND_HOME" );
		ws->ws_FCM = lsb->fcm;
		
		ws->ws_Port = port;
		ws->ws_UseSSL = sslOn;
		ws->ws_OldTime = 0;
		ws->ws_InterfaceName[ 0 ] = 0;
		memset( &(ws->ws_Info), 0, sizeof ws->ws_Info );
		ws->ws_Opts = 0;
		ws->ws_Interface = NULL;
		
		if( ws->ws_UseSSL == TRUE )
		{
			INFO("[WS] WebSocket: SSL Enabled\n");
			
			ws->ws_CertPath = lsb->RSA_SERVER_CERT;
			ws->ws_KeyPath = lsb->RSA_SERVER_KEY;
			
			DEBUG1("[WS] server cert %s keycert %s\n", ws->ws_CertPath, ws->ws_KeyPath );
		
			//sprintf( ws->ws_CertPath, "%s%s", fhome, "/libwebsockets-test-server.pem" );
			//sprintf( ws->ws_KeyPath, "%s%s", fhome, "/libwebsockets-test-server.key.pem" );
			//ws->ws_Opts |= LWS_SERVER_OPTION_REDIRECT_HTTP_TO_HTTPS;
		}
		
		if( ws->ws_AllowNonSSL == TRUE )
		{
			 //ws->ws_Opts |= LWS_SERVER_OPTION_ALLOW_NON_SSL_ON_SSL_PORT;
		}
		
			/*
		case 'k':
			opts = LWS_SERVER_OPTION_DEFEAT_CLIENT_MASK;
			break;
			*/
		ws->ws_Info.port = ws->ws_Port;
		ws->ws_Info.protocols = protocols;
		ws->ws_Info.iface = ws->ws_Interface;
		ws->ws_Info.gid = -1;
		ws->ws_Info.uid = -1;
		ws->ws_Info.extensions = NULL;
		ws->ws_Info.ssl_cert_filepath = ws->ws_CertPath;
		ws->ws_Info.ssl_private_key_filepath = ws->ws_KeyPath;
		ws->ws_Info.options = ws->ws_Opts;// | LWS_SERVER_OPTION_REQUIRE_VALID_OPENSSL_CLIENT_CERT;
		if( ws->ws_UseSSL == TRUE ) 
		{
			ws->ws_Info.options |= LWS_SERVER_OPTION_REDIRECT_HTTP_TO_HTTPS|LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT;
		}
		
		ws->ws_Info.user = ws;
		
		//ws->ws_Info.extensions = lws_get_internal_extensions();
		//ws->ws_Info.extensions->per_context_private_data = ws;
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
			       "!AES256-SHA256";
		
		ws->ws_CountPollfds = 0;
		
		//ws->ws_Info.ka_time = 15;
		//lws_set_log_level( 0, lwsl_emit_syslog);
		
		ws->ws_Context = lws_create_context( &ws->ws_Info );
		if( ws->ws_Context == NULL )
		{
			FERROR( "Libwebsocket init failed, cannot create context\n" );
			FFree( ws );
			return NULL;
		}
		
		INFO("[WS] NEW Websockets ptr %p context %p\n", ws, ws->ws_Context);

		ws->ws_Buf[ LWS_SEND_BUFFER_PRE_PADDING ] = 'x';
			
	}
	else
	{
		FERROR("[WS] Cannot allocate memory for WebSocket\n");
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
			if( WSThreadNum <= 0 && ws->ws_Thread->t_Launched == FALSE )
			{
				break;
			}
			DEBUG("[WS] Closeing WS. Threads: %d\n", WSThreadNum );
			sleep( 1 );
			
			tries++;
			if( tries > 50 )
			{
				//WorkerManagerDebug( SLIB );
				tries = 0;
			}
		}
#endif
		Log( FLOG_DEBUG, "[WS] Closeing thread\n");
		
		if( ws->ws_Thread )
		{
			ThreadDelete( ws->ws_Thread );
		}
		
		Log( FLOG_DEBUG, "[WS] Thread closed\n");
		
		if( ws->ws_Context != NULL )
		{
			lws_context_destroy( ws->ws_Context );
			ws->ws_Context = NULL;
		}
		
		if( ws->ws_CertPath != NULL )
		{
		}
			
		FFree( ws );
	}
	
	pthread_mutex_destroy( &WSThreadMutex );
}


//
// this protocol server (always the first one) just knows how to do HTTP 
//

static int callback_http( struct lws *wsi __attribute__((unused)), enum lws_callback_reasons reason, void *user __attribute__((unused)), void *in, size_t len __attribute__((unused)))
{
	
	int n;
	char client_name[ 128 ];
	char client_ip[ 128 ];
	
	WebSocket *ws =  (WebSocket *)in;//  lws_wsi_user(lws_get_parent(wsi));
	//struct lws_pollargs *pa = (struct lws_pollargs *)in;
	//lws_context_user ( wsi );
	
	switch( reason ) 
	{
		case LWS_CALLBACK_HTTP:
			DEBUG1( "[WS] serving HTTP URI %s\n", (char *)in );
/*
		if ( in && strcmp(in, "/favicon.ico") == 0 ) 
		{
			if (lws_serve_http_file( wsi,
			     LOCAL_RESOURCE_PATH"/favicon.ico", "image/x-icon", 4) )
			{
				DEBUG1( "[WS]:Failed to send favicon\n");
			}
			break;
		}

		// send the script... when it runs it'll start websockets 

		//n = lws_serve_http_file(wsi, buf, mimetype, other_headers, n);
		if ( lws_serve_http_file( wsi, LOCAL_RESOURCE_PATH"/test.html", "text/html", 4) )
		{
			FERROR( "[WS]:Failed to send HTTP file\n");
		}
		*/
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
 * @param data pointer to WCWSData
 * @return 0 if connection was added without problems otherwise error number
 */

int AddWebSocketConnection( void *locsb, struct lws *wsi, const char *sessionid, const char *authid, FCWSData *data )
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
			
			sqllib->SNPrintF( sqllib, qery,  sizeof(qery), \
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
					snprintf( lsessionid, sizeof(lsessionid), "%s", row[ 0 ] );
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
		Log( FLOG_ERROR,"Cannot find user in session with sessionid %s\n", sessionid );
		return -1;
	}
	
	DEBUG("[WS] AddWSCon session pointer %p\n", actUserSess );
	pthread_mutex_lock( &(actUserSess->us_Mutex) );
	WebsocketClient *listEntry = actUserSess->us_WSClients;
	while( listEntry != NULL )
	{
		DEBUG("[WS] wsclientptr %p\n", listEntry );
		if( listEntry->wc_Wsi == wsi )
		{
			break;
		}
		listEntry = (WebsocketClient *)listEntry->node.mln_Succ;
	}
	pthread_mutex_unlock( &(actUserSess->us_Mutex) );
	
	DEBUG("[WS] AddWSCon entry found %p\n", listEntry );
	
	if( listEntry != NULL )
	{
		INFO("[WS] User already have this websocket connection\n");
		//pthread_mutex_unlock( &(actUserSess->us_Mutex) );
		return 1;
	}
	
	WebsocketClient *nwsc = WebsocketClientNew();
	if( nwsc != NULL )
	{
		Log(FLOG_DEBUG, "WebsocketClient new %p pointer to new %p\n", nwsc, nwsc->node.mln_Succ );
		DEBUG("[WS] AddWSCon new connection created\n");
		nwsc->wc_Wsi = wsi;
		
		User *actUser = actUserSess->us_User;
		if( actUser != NULL )
		{
			Log( FLOG_INFO,"WebSocket connection set for user %s  sessionid %s\n", actUser->u_Name, actUserSess->us_SessionID );

			INFO("[WS] ADD WEBSOCKET CONNECTION TO USER %s\n\n",  actUser->u_Name );
		}
		else
		{
			FERROR("User sessions %s is not attached to user %lu\n", actUserSess->us_SessionID, actUserSess->us_UserID );
		}

		data->fcd_WSClient  = nwsc;
		data->fcd_SystemBase = l;
		nwsc->wc_WebsocketsData = data;
		
		// everything is set, we are adding new connection to list
		pthread_mutex_lock( &(actUserSess->us_Mutex) );
		nwsc->node.mln_Succ = (MinNode *)actUserSess->us_WSClients;
		actUserSess->us_WSClients = nwsc;
		nwsc->wc_UserSession = actUserSess;
		pthread_mutex_unlock( &(actUserSess->us_Mutex) );
		
		Log(FLOG_DEBUG, "WebsocketClient new %p pointer to new %p actuser session %p\n", nwsc, nwsc->node.mln_Succ, actUserSess );
	}
	else
	{
		Log( FLOG_ERROR,"Cannot allocate memory for WebsocketClient\n");
		return 2;
	}
	return 0;
}

/**
 * Delete websocket connection
 *
 * @param locsb pointer to SystemBase
 * @param wsi pointer to libwebsockets
 * @param data pointer to FCWSData
 * @return 0 if connection was deleted without problems otherwise error number
 */

int DeleteWebSocketConnection( void *locsb, struct lws *wsi __attribute__((unused)), FCWSData *data )
{
    SystemBase *l = (SystemBase *)locsb;
	if( data->fcd_WSClient == NULL )
	{
		return 1;
	}
	
	WebsocketClient *wscl = (WebsocketClient *)data->fcd_WSClient;
	
	pthread_mutex_lock( &(wscl->wc_Mutex) );
    UserSession *us = (UserSession *)wscl->wc_UserSession;
	pthread_mutex_unlock( &(wscl->wc_Mutex) );
    
	//
	// if user session is attached, then we can remove WebSocketClient from UserSession, otherwise it was already removed from there
	//
    if( us != NULL )
	{
		pthread_mutex_lock( &(us->us_Mutex) );
		WebsocketClient *nwsc = us->us_WSClients;
        WebsocketClient *owsc = nwsc;
		
		// we must remove first Websocket from UserSession list and then from app session
		
		if( nwsc != NULL )
		{
			DEBUG("[WS]: Getting connections %p for usersession %p\n", nwsc, us );
			
			// remove first entry!
			if( nwsc->wc_WebsocketsData == data )
			{
				us->us_WSClients = (WebsocketClient *)us->us_WSClients->node.mln_Succ;

				DEBUG("[WS] Remove single connection  %p  session connections pointer %p\n", owsc, us->us_WSClients );
            }
			
			// remove entry from the list
			else
			{
				DEBUG("[WS] Remove connection from list\n");

				while( nwsc != NULL )
				{
					DEBUG("[WS] WS Entry\n");
					owsc = nwsc;
					nwsc = (WebsocketClient *)nwsc->node.mln_Succ;
					DEBUG("[WS ] OLDWSC %p NWSC %p\n", owsc, nwsc );
					if( nwsc != NULL && nwsc->wc_WebsocketsData == data )
					{
						owsc->node.mln_Succ = nwsc->node.mln_Succ;
						break;
					}
				}
			}
		}
		pthread_mutex_unlock( &(us->us_Mutex) );
	}
	else
	{
		FERROR("Cannot remove connection: Pointer to usersession is equal to NULL\n");
	}
	
	Log(FLOG_DEBUG, "WebsocketClient Remove session %p usersession %p\n", wscl, wscl->wc_UserSession );
	WebsocketClientDelete( wscl );

    return 0;
}
