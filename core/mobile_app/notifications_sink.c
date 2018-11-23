/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include "notifications_sink_websocket.h"
#include "mobile_app.h"
#include <pthread.h>
#include <util/hashmap.h>
#include <system/json/jsmn.h>
#include <system/systembase.h>
#include <system/user/user_mobile_app.h>

extern SystemBase *SLIB;

static Hashmap *_socket_auth_map; //maps websockets to boolean values that are true then the websocket is authenticated
static char *_auth_key;


static void NotificationsSinkInit(void);
static void WebsocketRemove(struct lws *wsi);
static char* GetWebsocketHash(struct lws *wsi);
static int ProcessIncomingRequest(struct lws *wsi, char *data, size_t len, void *udata );
static int ReplyError(struct lws *wsi, int error_code);
static bool IsSocketAuthenticated(struct lws *wsi);
static bool VerifyAuthKey( const char *key_name, const char *key_to_verify );


/**
 * Initialize Notification Sink
 *
 */
static void NotificationsSinkInit( void )
{
	DEBUG("Initializing mobile app module\n");

	_socket_auth_map = HashmapNew();
}

/*
 * Error types
 */

enum {
	WS_NOTIF_SINK_SUCCESS = 0,
	WS_NOTIF_SINK_ERROR_BAD_JSON,
	WS_NOTIF_SINK_ERROR_WS_NOT_AUTHENTICATED,
	WS_NOTIF_SINK_ERROR_NOTIFICATION_TYPE_NOT_FOUND,
	WS_NOTIF_SINK_ERROR_AUTH_FAILED,
	WS_NOTIF_SINK_ERROR_NO_AUTH_ELEMENTS,
	WS_NOTIF_SINK_ERROR_PARAMETERS_NOT_FOUND,
	WS_NOTIF_SINK_ERROR_TOKENS_NOT_FOUND
};

/**
 * 
 * Connection with server callback
 * 
 */

void WebsocketNotificationConnCallback( struct WebsocketClient *wc, char *msg, int len )
{
	
}

/**
 * Main Websocket notification sink callback
 *
 * @param wsi pointer to Websocket connection
 * @param reason callback reason
 * @param user pointer to user data
 * @param in pointer to message
 * @param len size of provided message
 * @return 0 when everything is ok, otherwise return different value
 */
int WebsocketNotificationsSinkCallback( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len )
{
	MobileAppNotif *man = (MobileAppNotif *)user;
	DEBUG("notifications websocket callback, reason %d, len %zu, wsi %p\n", reason, len, wsi);
	
	if( reason == LWS_CALLBACK_PROTOCOL_INIT )
	{
		NotificationsSinkInit();
		
		return 0;
	}
	
	if( reason == LWS_CALLBACK_ESTABLISHED 
		 && man->man_Initialized == 0 )
	{
		pthread_mutex_init( &man->man_Mutex, NULL );
		memset( &(man->man_Queue), 0, sizeof( man->man_Queue ) );
		FQInit( &(man->man_Queue) );
		man->man_Initialized = 1;
	}

	if( reason == LWS_CALLBACK_CLOSED || reason == LWS_CALLBACK_WS_PEER_INITIATED_CLOSE )
	{
		MobileAppNotif *man = (MobileAppNotif *)user;
		WebsocketRemove( wsi );
		
		if( man != NULL )
		{
			if( man->man_Connection != NULL )
			{
				WebsocketClientDelete( man->man_Connection );
				man->man_Connection = NULL;
			}
		}
		
		if( man != NULL && man->man_Initialized == 1 )
		{
			FQDeInitFree( &(man->man_Queue) );
			man->man_Initialized = 0;
		}
		pthread_mutex_destroy( &man->man_Mutex );
		
		return 0;
	}

	if( reason != LWS_CALLBACK_RECEIVE )
	{
		MobileAppNotif *man = (MobileAppNotif *)user;
		if( reason == LWS_CALLBACK_SERVER_WRITEABLE )
		{
			FQEntry *e = NULL;
			FRIEND_MUTEX_LOCK( &man->man_Mutex );
			FQueue *q = &(man->man_Queue);
			
			DEBUG("[websocket_app_callback] WRITABLE CALLBACK, q %p\n", q );
			
			if( ( e = FQPop( q ) ) != NULL )
			{
				FRIEND_MUTEX_UNLOCK( &man->man_Mutex );
				unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
				t[ e->fq_Size+1 ] = 0;

				int res = lws_write( wsi, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size, LWS_WRITE_TEXT );
				DEBUG("[websocket_app_callback] message sent: %s len %d\n", e->fq_Data, res );

				int v = lws_send_pipe_choked( wsi );
				
				if( e != NULL )
				{
					DEBUG("Release: %p\n", e->fq_Data );
					FFree( e->fq_Data );
					FFree( e );
				}
			}
			else
			{
				DEBUG("[websocket_app_callback] No message in queue\n");
				FRIEND_MUTEX_UNLOCK( &man->man_Mutex );
			}
		}
		else
		{
			if( man != NULL && man->man_Queue.fq_First != NULL )
			{
				DEBUG("We have message to send, calling writable\n");
				lws_callback_on_writable( wsi );
			}
			
			DEBUG("Unimplemented callback, reason %d\n", reason);
			return 0;
		}
	}

	if( len == 0 )
	{
		DEBUG("Empty websocket frame (reason %d)\n", reason);
		return 0;
	}

	return ProcessIncomingRequest( wsi, (char*)in, len, user );
}

/**
 * Process incoming request
 *
 * @param wsi pointer to Websocket connection
 * @param data pointer to string where message is stored
 * @param len length of message
 * @return 0 when success, otherwise error number
 */
/*
static int ProcessIncomingRequest( struct lws *wsi, char *data, size_t len, void *udata )
{
	DEBUG("Incoming notification request: <%*s>\n", (unsigned int)len, data);
	MobileAppNotif *man = (MobileAppNotif *)udata;

	jsmn_parser parser;
	jsmn_init( &parser );
	jsmntok_t tokens[16]; //should be enough

	int tokens_found = jsmn_parse( &parser, data, len, tokens, sizeof(tokens)/sizeof(tokens[0]) );

	if( tokens_found < 1 )
	{
		return ReplyError(wsi, 5);
	}

	json_t json = { .string = data, .string_length = len, .token_count = tokens_found, .tokens = tokens };

	char *msg_type_string = json_get_element_string(&json, "t");
	if( msg_type_string == NULL )
	{
		return ReplyError(wsi, 6);
	}

	if( strcmp(msg_type_string, "auth") == 0 )
	{
		char *auth_key = json_get_element_string(&json, "key");
		if( auth_key == NULL )
		{
			return ReplyError(wsi, 7);
		}
		
		if( VerifyAuthKey( auth_key ) == false )
		{
			return ReplyError( wsi, 8 );
		}

		//at this point the authentication key is verified and we can add this socket to the trusted list
		char *websocket_hash = GetWebsocketHash( wsi ); //do not free, se HashmapPut comment

		HashmapElement *e = HashmapGet( _socket_auth_map, websocket_hash );
		if( e == NULL )
		{
			bool *auth_flag = FCalloc(1, sizeof(bool));
			*auth_flag = true;
			HashmapPut( _socket_auth_map, websocket_hash, auth_flag );

		}
		else
		{ //this socket exists but the client somehow decided to authenticate again
			*((bool*)e->data) = true;
		}

		char reply[ 128 ];
		strcpy( reply + LWS_PRE, "{ \"t\" : \"auth\", \"status\" : 1}" );
		unsigned int json_message_length = strlen( reply + LWS_PRE );

		lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );

		return 0;

	}
	else if( IsSocketAuthenticated( wsi ) )
	{
		char *username = json_get_element_string( &json, "username" );
		char *channel_id = json_get_element_string( &json, "channel_id" );
		char *title = json_get_element_string( &json, "title" );
		char *message = json_get_element_string( &json, "message" );

		if( username == NULL || channel_id == NULL || title == NULL || message == NULL )
		{
			return ReplyError( wsi, 8 );
		}

		int notification_type = 0;

		if( json_get_element_int( &json, "notification_type", &notification_type) == false )
		{
			return ReplyError( wsi, 9 );
		}

		int status = MobileAppNotifyUser( username, channel_id, title, message, (MobileNotificationTypeT)notification_type, NULL );

		char reply[128];
		sprintf(reply + LWS_PRE, "{ \"t\" : \"notify\", \"status\" : %d}", status);
		unsigned int json_message_length = strlen( reply + LWS_PRE );

		lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );
		return 0;

	}
	else
	{
		return ReplyError(wsi, 20);
	}
	return 0;
}
*/


static int ProcessIncomingRequest( struct lws *wsi, char *data, size_t len, void *udata )
{
	DEBUG("Incoming notification request: <%*s>\n", (unsigned int)len, data);
	MobileAppNotif *man = (MobileAppNotif *)udata;

	jsmn_parser parser;
	jsmn_init( &parser );
	jsmntok_t t[16]; //should be enough

	int tokens_found = jsmn_parse( &parser, data, len, t, sizeof(t)/sizeof(t[0]) );

	if( tokens_found < 1 )
	{
		return ReplyError(wsi, WS_NOTIF_SINK_ERROR_TOKENS_NOT_FOUND );
	}
	
	//
	//{ (0)
	// type (1): 'service' (2),
	// data (3): { (4)
	//    type (5): 'notification' (6),
	//    data : {
	//        <notie data>
	//		}
	// OR
	//type (1): 'authenticate' (2),
	//   serviceKey OR serviceName
	// OR
	//type (1): 'ping (2)
	//	}
	//}
	
	json_t json = { .string = data, .string_length = len, .token_count = tokens_found, .tokens = t };
	
	if( t[0].type == JSMN_OBJECT ) 
	{
		if( strncmp( data + t[1].start, "type", t[1].end - t[1].start) == 0) 
		{
			int msize = t[2].end - t[2].start;
			
			if( strncmp( data + t[2].start, "authenticate", msize ) == 0) 
			{
				int p;
				char *authKey = NULL;
				char *authName = NULL;
				// first check if service is already authenticated maybe?
				
				for( p = 3; p < 7 ; p++ )
				{
					int firstSize = t[p].end - t[p].start;
					
					if ( strncmp( data + t[p].start, "serviceKey", firstSize ) != 0 )
					{
						p++;
						int secondSize = t[p].end - t[p].start;
						authKey = FCalloc( secondSize + 16, sizeof(char) );
						strncpy( authKey, data + t[p].start, secondSize );
					}
					else if ( strncmp( data + t[p].start, "serviceName", firstSize ) != 0 )
					{
						p++;
						int secondSize = t[p].end - t[p].start;
						authName = FCalloc( secondSize + 16, sizeof(char) );
						strncpy( authName, data + t[p].start, secondSize );
					}
				}

				// we need both "serviceKey" and "serviceName"
				//json_get_element_string(&json, "key");
				if( authKey == NULL || authName == NULL )
				{
					if( authKey != NULL ){ FFree( authKey ); }
					if( authName != NULL ){ FFree( authName ); }
					return ReplyError(wsi, WS_NOTIF_SINK_ERROR_NO_AUTH_ELEMENTS );
				}
				
				if( VerifyAuthKey( authName, authKey ) == false )
				{
					FFree( authKey );
					FFree( authName );
					return ReplyError( wsi, WS_NOTIF_SINK_ERROR_AUTH_FAILED );
				}
				
				//at this point the authentication key is verified and we can add this socket to the trusted list
				char *websocket_hash = GetWebsocketHash( wsi ); //do not free, se HashmapPut comment

				HashmapElement *e = HashmapGet( _socket_auth_map, websocket_hash );
				if( e == NULL )
				{
					bool *auth_flag = FCalloc(1, sizeof(bool));
					*auth_flag = true;
					HashmapPut( _socket_auth_map, websocket_hash, auth_flag );
				}
				else
				{ //this socket exists but the client somehow decided to authenticate again
					*((bool*)e->data) = true;
				}

				/*
				FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
				if( en != NULL )
				{
					en->fq_Data = FMalloc( 128+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
					//memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, "{\"t\":\"pause\",\"status\":1}", 24 );
					strcpy( en->fq_Data + LWS_PRE, "{ \"t\" : \"auth\", \"status\" : 1}" );
					en->fq_Size = 128+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING;
			
					DEBUG("[websocket_app_callback] Msg to send: %s\n", en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );

					FRIEND_MUTEX_LOCK( &man->man_Mutex );
					FQPushFIFO( &(man->man_Queue), en );
					FRIEND_MUTEX_UNLOCK( &man->man_Mutex );
					lws_callback_on_writable( wsi );
				}
				*/
				char reply[ 256 ];
				strcpy( reply + LWS_PRE, "{ \"type\" : \"authenticate\", \"status\" : 0}" );
				unsigned int json_message_length = strlen( reply + LWS_PRE );

				lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );

				//man->mans_Connection = WebsocketClientNew( SLIB->l_AppleServerHost, SLIB->l_AppleServerPort, WebsocketNotificationConnCallback );
				FFree( authKey );
				
				return 0;
			}
			else if( IsSocketAuthenticated( wsi ) ) 
			{
				int dlen =  t[3].end - t[3].start;
				if( strncmp( data + t[2].start, "ping", msize ) == 0 && strncmp( data + t[3].start, "data", dlen ) == 0 ) 
				{
					DEBUG( "do Ping things\n" );
					char reply[ 128 ];
					snprintf( reply + LWS_PRE, sizeof( reply ) ,"{ \"type\" : \"pong\", \"time\" : \"%.*s\"}", t[4].end-t[4].start,data + t[4].start );
					unsigned int json_message_length = strlen( reply + LWS_PRE );

					lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );
				}
			
				if( strncmp( data + t[2].start, "service", msize ) == 0 && strncmp( data + t[3].start, "data", dlen ) == 0 ) 
				{
					// check object type
				
					if( strncmp( data + t[5].start, "type", t[5].end - t[5].start) == 0) 
					{
						if( strncmp( data + t[6].start, "notification", t[6].end - t[6].start) == 0) 
						{
							// 6 notification, 7 data, 8 object, 9 variables
							
							int p;
							int notification_type = -1;
							char *username = NULL;
							char *channel_id = NULL;
							char *title = NULL;
							char *message = NULL;
							
							for( p = 10 ; p < 21 ; p++ )
							{
								int size = t[p].end - t[p].start;
								if( strncmp( data + t[p].start, "notification_type", size) == 0) 
								{
									p++;
									char *tmp = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
									notification_type = atoi( tmp );
									FFree( tmp );
								}
								else if( strncmp( data + t[p].start, "username", size) == 0) 
								{
									p++;
									username = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
								else if( strncmp( data + t[p].start, "channel_id", size) == 0) 
								{
									p++;
									channel_id = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
								else if( strncmp( data + t[p].start, "title", size) == 0) 
								{
									p++;
									title = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
								else if( strncmp( data + t[p].start, "message", size) == 0) 
								{
									p++;
									message = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
							}
							
							if( notification_type >= 0 )
							{
								if( username == NULL || channel_id == NULL || title == NULL || message == NULL )
								{
									if( username != NULL ) FFree( username );
									if( channel_id != NULL ) FFree( channel_id );
									if( title != NULL ) FFree( title );
									if( message != NULL ) FFree( message );
									return ReplyError( wsi, WS_NOTIF_SINK_ERROR_PARAMETERS_NOT_FOUND );
								}

								int status = MobileAppNotifyUser( username, channel_id, title, message, (MobileNotificationTypeT)notification_type, NULL );
								/*
								FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
								if( en != NULL )
								{
									en->fq_Data = FMalloc( 64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
									//memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, "{\"t\":\"pause\",\"status\":1}", 24 );
									int msgsize = sprintf( en->fq_Data + LWS_PRE, "{ \"t\" : \"notify\", \"status\" : %d}", status );
									en->fq_Size = 64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING;
						
									DEBUG("[websocket_app_callback] Msg to send: %s\n", en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
			
									FRIEND_MUTEX_LOCK( &man->man_Mutex );
									FQPushFIFO( &(man->man_Queue), en );
									FRIEND_MUTEX_UNLOCK( &man->man_Mutex );
									lws_callback_on_writable( wsi );
								}
								*/
								char reply[128];
								sprintf(reply + LWS_PRE, "{ \"type\" : \"notify\", \"status\" : %d}", status);
								unsigned int json_message_length = strlen( reply + LWS_PRE );

								lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );
							}
							else
							{
								return ReplyError( wsi, WS_NOTIF_SINK_ERROR_NOTIFICATION_TYPE_NOT_FOUND );
							}
							
							if( username != NULL ) FFree( username );
							if( channel_id != NULL ) FFree( channel_id );
							if( title != NULL ) FFree( title );
							if( message != NULL ) FFree( message );
						}
					}
				}	// is authenticated
				else
				{
					return ReplyError(wsi, WS_NOTIF_SINK_ERROR_WS_NOT_AUTHENTICATED );
				}
			}
		}	// "type" in json
		else
		{
			return ReplyError(wsi, WS_NOTIF_SINK_ERROR_BAD_JSON );
		}
	}	// JSON OBJECT

	return 0;
}

/**
 * Set websocket notification key
 *
 * @param key pointer to new notification key
 */
void WebsocketNotificationsSetAuthKey( const char *key )
{
	unsigned int len = strlen(key);
	if( len < 10 )
	{ //effectively disable the whole module if the key is too weak or non-existent
		_auth_key = NULL;
		DEBUG("Notifications key not set, the service will be disabled\n");
		return;
	}
	_auth_key = FCalloc(len+1, sizeof(char));
	strcpy(_auth_key, key);
	DEBUG("Notifications key is <%s>\n", _auth_key);
}

/**
 * Reply error code to user
 *
 * @param wsi pointer to Websocket connection
 * @param error_code error code
 * @return -1
 */
static int ReplyError( struct lws *wsi, int error_code )
{
	char response[LWS_PRE+32];
	snprintf(response+LWS_PRE, sizeof(response)-LWS_PRE, "{ \"type\":\"error\", \"status\":%d}", error_code);
	DEBUG("Error response: %s\n", response+LWS_PRE);

	DEBUG("WSI %p\n", wsi);
	lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);

	WebsocketRemove(wsi);

	return -1;
}

/**
 * Check if websocket is authenticated
 *
 * @param wsi pointer to Websocket connection
 * @return true when socket is authenticated, otherwise false
 */
static bool IsSocketAuthenticated( struct lws *wsi )
{
	char *websocket_hash = GetWebsocketHash(wsi);
	bool *socket_is_authenticated = (bool*)HashmapGetData(_socket_auth_map, websocket_hash);
	FFree(websocket_hash);
	if( socket_is_authenticated/*the pointer, not the value!*/ != NULL )
	{
		return *socket_is_authenticated;
	}
	return false;
}

/**
 * Verify authentication key
 *
 * @param key_to_verify pointer to string with key
 * @return true when key passed verification, otherwise false
 */
static bool VerifyAuthKey( const char *key_name, const char *key_to_verify )
{
	DEBUG("VerifyAuthKey - key_name <%s>\n", key_name );
	DEBUG("VerifyAuthKey - key_to_verify <%s>\n", key_to_verify );
	//TODO: verify against key name 
	if( _auth_key )
	{
		if( strcmp( _auth_key, key_to_verify) == 0 )
		{
			return true;
		}
	}
	return false;
}

/**
 * Remove Websocket connection from global pool
 *
 * @param wsi pointer to Websocket connection
 */
static void WebsocketRemove( struct lws *wsi )
{
	char *websocket_hash = GetWebsocketHash(wsi);
	bool *socket_is_authenticated = HashmapGetData(_socket_auth_map, websocket_hash);

	if( socket_is_authenticated/*the pointer, not the value!*/ != NULL )
	{
		HashmapRemove(_socket_auth_map, websocket_hash);
		FFree(socket_is_authenticated);
	}	

	FFree(websocket_hash);
}

/**
 * Get Websocket hash
 *
 * @param wsi pointer to Websocket connection
 * @return pointer to hash in allocated string
 */
static char* GetWebsocketHash( struct lws *wsi )
{
	/*FIXME: this is a dirty workaround for currently used hashmap module. It accepts
	 * only strings as keys, so we'll use the websocket pointer printed out as
	 * string for the key. Eventually there should be a hashmap implementation available
	 * that can use ints (or pointers) as keys!
	 */
	char *hash = FCalloc(16, 1);
	snprintf(hash, 16, "%p", wsi);
	return hash;
}
