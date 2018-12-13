/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include "mobile_app.h"
#include "mobile_app_websocket.h"
#include <pthread.h>
#include <util/hashmap.h>
#include <system/json/jsmn.h>
#include <system/user/user.h>
#include <system/systembase.h>
#include <time.h>
#include <unistd.h>
#include <util/log/log.h>
#include <util/session_id.h>
#include <system/notification/notification.h>

#define MAX_CONNECTIONS_PER_USER 5
#define KEEPALIVE_TIME_s 180 //ping time (10 before)
#define ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL 1

#define CKPT DEBUG("====== %d\n", __LINE__)

#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1
#include <signal.h>
void MobileAppTestSignalHandler(int signum);
#endif

#define WEBSOCKET_SEND_QUEUE

//There is a need for two mappings, user->mobile connections and mobile connection -> user

typedef struct UserMobileAppConnectionsS UserMobileAppConnectionsT;
typedef struct MobileAppConnectionS MobileAppConnectionT;

//
// Mobile Application global structure
//

struct MobileAppConnectionS
{
	struct lws											*mac_WebsocketPtr;
	void												*mac_UserData;
	char												*mac_SessionID;
	FQueue												mac_Queue;
	pthread_mutex_t										mac_Mutex;
	time_t												mac_LastCommunicationTimestamp;
	UserMobileAppConnectionsT							*mac_UserConnections;
	unsigned int										mac_UserConnectionIndex;
	mobile_app_status_t									mac_AppStatus;
	time_t												mac_MostRecentResumeTimestamp;
	time_t												mac_MostRecentPauseTimestamp;
	UserMobileApp										*mac_UserMobileApp;
	FULONG												mac_UserMobileAppID;
};

//
// single user connection structure
//

struct UserMobileAppConnectionsS
{
	char *username;
	FULONG userID;
	MobileAppConnectionT *connection[MAX_CONNECTIONS_PER_USER];
};

static Hashmap *globalUserToAppConnectionsMap = NULL;
static Hashmap *globalWebsocketToUserConnectionsMap = NULL;

static pthread_mutex_t globalSessionRemovalMutex; //used to avoid sending pings while a session is being removed
static pthread_t globalPingThread;

static void  MobileAppInit(void);
static int   MobileAppReplyError( struct lws *wsi, int error_code );
static int   MobileAppHandleLogin( struct lws *wsi, json_t *json );
static int   MobileAppAddNewUserConnection( struct lws *wsi, const char *username, void *udata, FULONG appTokenID );
static void* MobileAppPingThread( void *a );
static char* MobileAppGetWebsocketHash( struct lws *wsi );
static void  MobileAppRemoveAppConnection( UserMobileAppConnectionsT *connections, unsigned int connection_index );

/**
 * Write message to websocket
 *
 * @param mac pointer to mobile connection structure
 * @param msg pointer to string where message is stored
 * @param len length of message
 * @return number of bytes written to websocket
 */
static inline int WriteMessage( struct MobileAppConnectionS *mac, unsigned char *msg, int len )
{
	//MobileAppNotif *man = (MobileAppNotif *) mac->user_data;
	//if( man != NULL )
	{
		FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
		if( en != NULL )
		{
			DEBUG("Message added to queue: '%s'\n", msg );
			en->fq_Data = FMalloc( len+32+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
			memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, msg, len );
			en->fq_Size = LWS_PRE+len;
	
			//FQPushFIFO( &(man->man_Queue), en );
			//lws_callback_on_writable( mac->websocket_ptr );
			if( FRIEND_MUTEX_LOCK( &mac->mac_Mutex ) == 0 )
			{
				FQPushFIFO( &(mac->mac_Queue), en );
				FRIEND_MUTEX_UNLOCK( &(mac->mac_Mutex) );
			}
			lws_callback_on_writable( mac->mac_WebsocketPtr );
		}
	}
	return len;
}

/**
 * Initialize Mobile App
 */
static void MobileAppInit( void )
{
	DEBUG("Initializing mobile app module\n");

	if( globalUserToAppConnectionsMap == NULL )
	{
		globalUserToAppConnectionsMap = HashmapNew();
	}
	if( globalWebsocketToUserConnectionsMap == NULL )
	{
		globalWebsocketToUserConnectionsMap = HashmapNew();
	}

	pthread_mutex_init( &globalSessionRemovalMutex, NULL );

	//pthread_create( &_ping_thread, NULL/*default attributes*/, MobileAppPingThread, NULL/*extra args*/ );

#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1
	signal( SIGUSR1, MobileAppTestSignalHandler );
#endif
}

/**
 * Websocket callback delivered from a mobile app. This function is called from within websocket.c
 * when a frame is received.
 *
 * @param wsi pointer to main Websockets structure
 * @param reason type of received message (lws_callback_reasons type)
 * @param user user data
 * @param in message (array of chars)
 * @param len size of 'message'
 * @return 0 when success, otherwise error number
 */
int WebsocketAppCallback(struct lws *wsi, enum lws_callback_reasons reason, void *user __attribute__((unused)), void *in, size_t len )
{
	//DEBUG("websocket callback, reason %d, len %zu, wsi %p\n", reason, len, wsi);
	MobileAppNotif *man = (MobileAppNotif *) user;

	if( reason == LWS_CALLBACK_PROTOCOL_INIT )
	{
		MobileAppInit();
		return 0;
	}
	
	DEBUG1("-------------------\nwebsocket_app_callback\n------------------\nreasond: %d\n", reason );

	if (reason == LWS_CALLBACK_CLOSED || reason == LWS_CALLBACK_WS_PEER_INITIATED_CLOSE)
	{
		char *websocketHash = MobileAppGetWebsocketHash( wsi );
		MobileAppConnectionT *appConnection = NULL;
		if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
		{
			appConnection = HashmapGetData( globalWebsocketToUserConnectionsMap, websocketHash );
			FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
		}
			
		if( appConnection == NULL )
		{
			DEBUG("Websocket close - no user session found for this socket\n");
			return MobileAppReplyError( wsi, MOBILE_APP_ERR_NO_SESSION_NO_CONNECTION );
		}
		
		if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
		{
			//remove connection from user connnection struct
			UserMobileAppConnectionsT *userConnections = appConnection->mac_UserConnections;
			unsigned int connectionIndex = appConnection->mac_UserConnectionIndex;
			if( userConnections != NULL )
			{
				//DEBUG("Removing connection %d for user <%s>\n", connectionIndex, userConnections->username);
			}
			MobileAppRemoveAppConnection( userConnections, connectionIndex);

			HashmapRemove( globalWebsocketToUserConnectionsMap, websocketHash );

			FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
		}
		FFree( websocketHash );
		return 0;
	}

	if (reason != LWS_CALLBACK_RECEIVE)
	{
		char *wsHash = MobileAppGetWebsocketHash( wsi );
		MobileAppConnectionT *appConnection = NULL;
		
		if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
		{
			appConnection = HashmapGetData( globalWebsocketToUserConnectionsMap, wsHash );
			FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
		}
			
		if( reason == LWS_CALLBACK_SERVER_WRITEABLE )
		{
#ifdef WEBSOCKET_SEND_QUEUE
			FQEntry *e = NULL;
			if( FRIEND_MUTEX_LOCK( &(appConnection->mac_Mutex) ) == 0 )
			{
				//FQueue *q = &(man->man_Queue);
				FQueue *q = &(appConnection->mac_Queue);
			
				DEBUG("[websocket_app_callback] WRITABLE CALLBACK, q %p\n", q );
			
				e = FQPop( q );
			
				FRIEND_MUTEX_UNLOCK( &appConnection->mac_Mutex );
			}
			
			if( e != NULL )
			{
				unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
				t[ e->fq_Size+1 ] = 0;

				int res = lws_write( wsi, t, e->fq_Size, LWS_WRITE_TEXT );
				DEBUG("[websocket_app_callback] message sent: %s len %d\n", (char *)t, res );

				int ret = lws_send_pipe_choked( wsi );
				
				if( e != NULL )
				{
					DEBUG("Release: %p\n", e->fq_Data );
					if( e->fq_Data != NULL )
					{
						FFree( e->fq_Data );
						e->fq_Data = NULL;
					}
					FFree( e );
				}
			}
			else
			{
				DEBUG("[websocket_app_callback] No message in queue\n");
			}
#endif
		}
		else
		{
			DEBUG("Unimplemented callback, reason %d\n", reason);
		}
		
		if( appConnection != NULL && appConnection->mac_Queue.fq_First != NULL )
		{
			DEBUG("We have message to send, calling writable\n");
			lws_callback_on_writable( wsi );
		}
		
		if( wsHash != NULL ) FFree( wsHash );
		return 0;
	}
	
	char *data = (char*)in;
	/*
	DEBUG("Initialize queue\n");
	
	if( man != NULL )
	{
		DEBUG(" Initialized %d\n", man->man_Initialized );
		if( man->man_Initialized == 0 )
		{
			memset( &(man->man_Queue), 0, sizeof( man->man_Queue ) );
			FQInit( &(man->man_Queue) );
			man->man_Initialized = 1;
			DEBUG("Queue initialized\n");
		}
	}
	else
	{
		FERROR("\n\n\n\nMAN is NULL\n\n\n\n");
	}*/

	if( len == 0 )
	{
		DEBUG("Empty websocket frame (reason %d)\n", reason);
		return 0;
	}

	DEBUG("Mobile app data: <%*s>\n", (unsigned int)len, data);

	jsmn_parser parser;
	jsmn_init(&parser);
	jsmntok_t tokens[16]; //should be enough

	int tokens_found = jsmn_parse(&parser, data, len, tokens, sizeof(tokens)/sizeof(tokens[0]));

	DEBUG("JSON tokens found %d\n", tokens_found);

	if (tokens_found < 1)
	{
		return MobileAppReplyError(wsi, MOBILE_APP_ERR_NO_JSON);
	}

	json_t json = { .string = data, .string_length = len, .token_count = tokens_found, .tokens = tokens };

	char *msg_type_string = json_get_element_string(&json, "t");

	//see if this websocket belongs to an existing connection
	char *websocketHash = MobileAppGetWebsocketHash(wsi);
	MobileAppConnectionT *appConnection = NULL;
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		appConnection = HashmapGetData( globalWebsocketToUserConnectionsMap, websocketHash );
		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}
	FFree(websocketHash);

	if( msg_type_string )
	{
		//due to uniqueness of "t" field values only first letter has to be evaluated
		char first_type_letter = msg_type_string[0];
		DEBUG("Type letter <%c>\n", first_type_letter);

		if( first_type_letter == 'l'/*login*/)
		{
			return MobileAppHandleLogin(wsi, &json);
		}
		else
		{
			if (appConnection == NULL)
			{
				DEBUG("Session not found for this connection\n");
				return MobileAppReplyError(wsi, MOBILE_APP_ERR_NO_SESSION);
			}

			appConnection->mac_LastCommunicationTimestamp = time(NULL);

			switch (first_type_letter)
			{

			case 'p': 
				do
				{ //pause
					DEBUG("App is paused\n");
					appConnection->mac_AppStatus = MOBILE_APP_STATUS_PAUSED;
					appConnection->mac_MostRecentPauseTimestamp = time(NULL);
					
					char response[LWS_PRE+64];
					strcpy(response+LWS_PRE, "{\"t\":\"pause\",\"status\":1}");
					DEBUG("Response: %s\n", response+LWS_PRE);
					
#ifndef WEBSOCKET_SINK_SEND_QUEUE
					FRIEND_MUTEX_LOCK(&globalSessionRemovalMutex);
					lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
					FRIEND_MUTEX_UNLOCK(&globalSessionRemovalMutex);
#else
					FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
					if( en != NULL )
					{
						en->fq_Data = FMalloc( 64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
						memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, "{\"t\":\"pause\",\"status\":1}", 24 );
						en->fq_Size = LWS_PRE+64;
						
						DEBUG("[websocket_app_callback] Msg to send: %s\n", en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
			
						if( FRIEND_MUTEX_LOCK( &(appConnection->mac_Mutex) ) == 0 )
						{
							FQPushFIFO( &(appConnection->mac_Queue), en );
							FRIEND_MUTEX_UNLOCK( &(appConnection->mac_Mutex) );
						}
						lws_callback_on_writable( wsi );
					}
#endif
				}
				while (0);
			break;

			case 'r': 
				do
				{ //resume
					DEBUG("App is resumed\n");
					appConnection->mac_AppStatus = MOBILE_APP_STATUS_RESUMED;
					appConnection->mac_MostRecentResumeTimestamp = time(NULL);
					
					char response[LWS_PRE+64];
					strcpy(response+LWS_PRE, "{\"t\":\"resume\",\"status\":1}");
					DEBUG("Response: %s\n", response+LWS_PRE);
#ifndef WEBSOCKET_SINK_SEND_QUEUE
					FRIEND_MUTEX_LOCK(&globalSessionRemovalMutex);
					lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
					FRIEND_MUTEX_UNLOCK(&globalSessionRemovalMutex);
#else
					FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
					if( en != NULL )
					{
						en->fq_Data = FMalloc( 64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
						memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, "{\"t\":\"resume\",\"status\":1}", 25 );
						en->fq_Size = LWS_PRE+64;
						
						DEBUG("[websocket_app_callback] Msg to send1: %s\n", en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
			
						if( FRIEND_MUTEX_LOCK( &(appConnection->mac_Mutex) ) == 0 )
						{
							FQPushFIFO( &(appConnection->mac_Queue), en );
							FRIEND_MUTEX_UNLOCK( &(appConnection->mac_Mutex) );
						}
						lws_callback_on_writable( wsi );
					}
#endif
				}
				while (0);
			break;
			
			// get information from mobile device about notification status
			/*
			JSONObject notifyReply = new JSONObject();
                notifyReply.put("t", "notify");
                notifyReply.put("status", "received");
                notifyReply.put("id", id);
			 */
			case 'n':
				{
					DEBUG("Notification information received\n");
					
					char *statusString = json_get_element_string( &json, "status" );
					char *idString = json_get_element_string( &json, "id" );
					
					if( statusString != NULL && idString != NULL )
					{
						FULONG id = 0;
						int status = 0;
						char *end;
						
						id = strtol( idString, &end, 0 );
						status = atoi( statusString );
						
						NotificationManagerNotificationSentSetStatusDB( SLIB->sl_NotificationManager, id, status );
					}
				}
				break;

			// get ping and response via pong
			/*
			JSONObject pingRequest = new JSONObject();
                pingRequest.put("t", "echo");
                pingRequest.put("time", System.currentTimeMillis());
			 */
			case 'e': //echo
				{
					char *timeString = json_get_element_string( &json, "time" );
					
					char response[LWS_PRE+64];
					snprintf( response+LWS_PRE, 64, "{\"t\":\"pong\",\"status\":\"%s\"}", timeString );
					DEBUG("Response: %s\n", response+LWS_PRE);
#ifndef WEBSOCKET_SINK_SEND_QUEUE
					FRIEND_MUTEX_LOCK(&globalSessionRemovalMutex);
					lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
					FRIEND_MUTEX_UNLOCK(&globalSessionRemovalMutex);
#else
					FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
					if( en != NULL )
					{
						en->fq_Data = FMalloc( 64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
						int msgsize = snprintf( (char *)(en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING), 64, "{\"t\":\"pong\",\"status\":\"%s\"}", timeString );
						en->fq_Size = msgsize;
						
						DEBUG("[websocket_app_callback] Msg to send1: %s\n", en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
			
						if( FRIEND_MUTEX_LOCK( &(appConnection->mac_Mutex) ) == 0 )
						{
							FQPushFIFO( &(appConnection->mac_Queue), en );
							FRIEND_MUTEX_UNLOCK( &(appConnection->mac_Mutex) );
						}
						lws_callback_on_writable( wsi );
					}
#endif
				}
				break;

			default:
				return MobileAppReplyError(wsi, MOBILE_APP_ERR_WRONG_TYPE);
			}

		}
	}
	else
	{
		return MobileAppReplyError(wsi, MOBILE_APP_ERR_NO_TYPE);
	}

	return 0; //should be unreachable
}

/**
 * Sends an error reply back to the app and closes the websocket.
 *
 * @param wsi pointer to a Websockets struct
 * @param error_code numerical value of the error code
 */
static int MobileAppReplyError(struct lws *wsi, int error_code)
{
	if( error_code == MOBILE_APP_ERR_NO_SESSION_NO_CONNECTION )
	{
		
	}
	else
	{
		char response[LWS_PRE+32];
		snprintf(response+LWS_PRE, sizeof(response)-LWS_PRE, "{ \"t\":\"error\", \"status\":%d}", error_code);
		DEBUG("Error response: %s\n", response+LWS_PRE);

#ifdef WEBSOCKET_SEND_QUEUE
		//WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, msgSendLength );
#else
		DEBUG("WSI %p\n", wsi);
		lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
#endif
	}

	char *websocketHash = MobileAppGetWebsocketHash( wsi );
	MobileAppConnectionT *appConnection = NULL;
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		appConnection = HashmapGetData( globalWebsocketToUserConnectionsMap, websocketHash );
		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}
	FFree(websocketHash);
	if( appConnection )
	{
		DEBUG("Cleaning up before closing socket\n");
		UserMobileAppConnectionsT *user_connections = appConnection->mac_UserConnections;
		unsigned int connection_index = appConnection->mac_UserConnectionIndex;
		if( user_connections != NULL )
		{
			DEBUG("Removing connection %d for user <%s>\n", connection_index, user_connections->username);
		}
		MobileAppRemoveAppConnection( user_connections, connection_index );
	}

	return -1;
}

/**
 * User login handler
 *
 * @param wsi pointer to Websocket structure
 * @param json to json structure with login entry
 * @return 0 when success, otherwise error number
 */
static int MobileAppHandleLogin( struct lws *wsi, json_t *json )
{
	char *usernameString = json_get_element_string( json, "user" );

	if( usernameString == NULL )
	{
		return MobileAppReplyError(wsi, MOBILE_APP_ERR_LOGIN_NO_USERNAME);
	}

	char *passwordString = json_get_element_string(json, "pass");

	if( passwordString == NULL )
	{
		return MobileAppReplyError(wsi, MOBILE_APP_ERR_LOGIN_NO_PASSWORD);
	}
	
	char *tokenString = json_get_element_string(json, "apptoken");

	//step 3 - check if the username and password is correct
	DEBUG("Login attempt <%s> <%s>\n", usernameString, passwordString );

	unsigned long block_time = 0;
	User *user = NULL;
	FULONG umaID = 0;
	
	SQLLibrary *sqlLib = SLIB->LibrarySQLGet( SLIB );
	if( sqlLib != NULL )
	{
		user = UMGetUserByNameDBCon( SLIB->sl_UM, sqlLib, usernameString );
	
		umaID = MobileManagerGetUMAIDByToken( SLIB->sl_MobileManager, sqlLib, tokenString );

		SLIB->LibrarySQLDrop( SLIB, sqlLib );
	}
	AuthMod *a = SLIB->AuthModuleGet( SLIB );

	if( a->CheckPassword(a, NULL, user, passwordString, &block_time) == FALSE )
	{
		DEBUG("Check = false\n");
		return MobileAppReplyError( wsi, MOBILE_APP_ERR_LOGIN_INVALID_CREDENTIALS );
	}
	else
	{
		DEBUG("Check = true\n");
		
		int ret = MobileAppAddNewUserConnection( wsi, usernameString, user, umaID );
		if( umaID > 0 )
		{
			// get all NotificationSent structures with register state and which belongs to this user mobile application (UserMobileAppID)
			NotificationSent *nsroot = NotificationManagerGetNotificationsSentByStatusAndUMAIDDB( SLIB->sl_NotificationManager, NOTIFICATION_SENT_STATUS_REGISTERED, umaID );
			NotificationSent *ns = nsroot;
			while( ns != NULL )
			{
				ns = (NotificationSent *)ns->node.mln_Succ;
			}
			NotificationSentDeleteAll( nsroot );
		}
		
		return ret;
	}
}

/**
 * Add user connectiono to global list
 *
 * @param wsi pointer to Websocket connection
 * @param username name of user which passed login
 * @param user_data pointer to user data
 * @param umaID User Application Mobile ID
 * @return 0 when success, otherwise error number
 */
static int MobileAppAddNewUserConnection( struct lws *wsi, const char *username, void *user_data, FULONG umaID )
{
	char *session_id = session_id_generate();

	UserMobileAppConnectionsT *userConnections = NULL;
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		userConnections = HashmapGetData( globalUserToAppConnectionsMap, username);
		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}

	if (userConnections == NULL)
	{ //this user does not have any connections yet
		//create a new connections struct
		userConnections = FCalloc(sizeof(UserMobileAppConnectionsT), 1);

		if( userConnections == NULL )
		{
			DEBUG("Allocation failed\n");
			return MobileAppReplyError(wsi, MOBILE_APP_ERR_INTERNAL);
		}
		else
		{
			DEBUG("Creating new struct for user <%s>\n", username);
			char *permanentUsername = FCalloc( strlen(username)+1, 1 ); //TODO: error handling
			strcpy( permanentUsername, username );
			userConnections->username = permanentUsername;
			
			//
			// we must also attach UserID to User. This functionality will allow FC to find user by ID
			//
			
			SQLLibrary *sqllib  = SLIB->LibrarySQLGet( SLIB );

			userConnections->userID = -1;
			if( sqllib != NULL )
			{
				char *qery = FMalloc( 1048 );
				qery[ 1024 ] = 0;
				sqllib->SNPrintF( sqllib, qery, 1024, "SELECT UserID FROM FUser WHERE `Name`=\"%s\"", username );
				void *res = sqllib->Query( sqllib, qery );
				if( res != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						if( row[ 0 ] != NULL )
						{
							char *end;
							userConnections->userID = strtoul( row[0], &end, 0 );
						}
					}
					sqllib->FreeResult( sqllib, res );
				}
				SLIB->LibrarySQLDrop( SLIB, sqllib );
				FFree( qery );
			}

			//FIXME: check the deallocation order for permanent_username as it is held both
			//by our internal sturcts and within hashmap structs

			if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
			{
				//add the new connections struct to global users' connections map
				if( HashmapPut( globalUserToAppConnectionsMap, permanentUsername, userConnections ) != MAP_OK )
				{
					DEBUG("Could not add new struct of user <%s> to global map\n", username);

					FFree(userConnections);
					FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
					return MobileAppReplyError( wsi, MOBILE_APP_ERR_INTERNAL );
				}
				FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
			}
		}
	}

	//create struct holding this connection
	MobileAppConnectionT *newConnection = FCalloc(sizeof(MobileAppConnectionT), 1);

	newConnection->mac_SessionID = session_id;
	newConnection->mac_LastCommunicationTimestamp = time(NULL);
	newConnection->mac_WebsocketPtr = wsi;
	newConnection->mac_UserMobileAppID = umaID;

	//add this struct to user connections struct
	int connectionToReplaceIndex = -1;
	for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
	{
		if( userConnections->connection[i] == NULL )
		{ //got empty slot
			connectionToReplaceIndex = i;
			DEBUG("Will use slot %d for this connection\n", connectionToReplaceIndex);
			break;
		}
	}

	if( connectionToReplaceIndex == -1 )
	{ //no empty slots found - drop the oldest connection

		connectionToReplaceIndex = 0;
		unsigned int oldest_timestamp = userConnections->connection[0]->mac_LastCommunicationTimestamp;

		for( int i = 1; i < MAX_CONNECTIONS_PER_USER; i++ )
		{
			if( userConnections->connection[i] == NULL )
			{
				if( userConnections->connection[i]->mac_LastCommunicationTimestamp < oldest_timestamp )
				{
					oldest_timestamp = userConnections->connection[i]->mac_LastCommunicationTimestamp;
					connectionToReplaceIndex = i;
					DEBUG("Will drop old connection from slot %d (last comm %d)\n", connectionToReplaceIndex, oldest_timestamp);
				}
			}
		}
	}

	if( userConnections->connection[connectionToReplaceIndex] != NULL )
	{
		MobileAppRemoveAppConnection( userConnections, connectionToReplaceIndex );
	}

	DEBUG("Adding connection to slot %d\n", connectionToReplaceIndex);
	userConnections->connection[ connectionToReplaceIndex ] = newConnection;

	newConnection->mac_UserData = user_data;
	newConnection->mac_UserConnections = userConnections; //provide back reference that will map websocket to a user
	newConnection->mac_UserConnectionIndex = connectionToReplaceIndex;

	char *websocketHash = MobileAppGetWebsocketHash( wsi );

	DEBUG("-------->globalWebsocketToUserConnectionsMap %p\n", globalWebsocketToUserConnectionsMap );
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		if( globalWebsocketToUserConnectionsMap == NULL )
		{
			globalWebsocketToUserConnectionsMap = HashmapNew();
		}
		HashmapPut( globalWebsocketToUserConnectionsMap, websocketHash, newConnection ); //TODO: error handling here

		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}
	//websocket_hash now belongs to the hashmap, don't free it here
	pthread_mutex_init( &newConnection->mac_Mutex, NULL );
	FQInit( &(newConnection->mac_Queue) );

	return 0;
}

/**
 * Get websocket hash
 *
 * @param wsi pointer to Websocket connection
 * @return pointer to string with generated hash
 */
static char* MobileAppGetWebsocketHash( struct lws *wsi )
{
	/*FIXME: this is a dirty workaround for currently used hashmap module. It accepts
	 * only strings as keys, so we'll use the websocket pointer printed out as
	 * string for the key. Eventually there should be a hashmap implementation available
	 * that can use ints (or pointers) as keys!
	 */
	char *hash = FCalloc( 16, 1 );
	snprintf( hash, 16, "%p", wsi );
	return hash;
}

/**
 * Remove Connection from global list
 *
 * @param connections pointer to global list with connections
 * @param connectionIndex number of entry which will be removed from list
 */
static void  MobileAppRemoveAppConnection( UserMobileAppConnectionsT *connections, unsigned int connectionIndex )
{
	if( connections == NULL || connections->connection[connectionIndex] == NULL )
	{
		return;
	}
	DEBUG("Freeing up connection from slot %d (last comm %ld)\n", connectionIndex,
	connections->connection[connectionIndex]->mac_LastCommunicationTimestamp );
	
	if( FRIEND_MUTEX_LOCK( &(connections->connection[connectionIndex]->mac_Mutex) ) == 0 )
	{
		FQueue *fq = &(connections->connection[connectionIndex]->mac_Queue);
		//FQDeInitFree( &(connections->connection[connectionIndex]->mac_Queue) );
	
		{
			FQEntry *q = fq->fq_First; 
			while( q != NULL )
			{ 
				void *r = q; 
				if( q->fq_Data != NULL )
				{
					FFree( q->fq_Data ); 
				}
				q = (FQEntry *)q->node.mln_Succ; 
				FFree( r ); 
			
			} 
			fq->fq_First = NULL; 
			fq->fq_Last = NULL; 
		}
		FRIEND_MUTEX_UNLOCK( &(connections->connection[connectionIndex]->mac_Mutex) );
	}
	
	pthread_mutex_destroy( &(connections->connection[connectionIndex]->mac_Mutex) );

	FFree( connections->connection[connectionIndex]->mac_SessionID );
	FFree( connections->connection[connectionIndex] );
	connections->connection[connectionIndex] = NULL;
}

/**
 * Notify user
 *
 * @param lsb pointer to SystemBase
 * @param username pointer to string with user name
 * @param channel_id number of channel
 * @param app application name
 * @param title title of message which will be send to user
 * @param message message which will be send to user
 * @param notification_type type of notification
 * @param extraString additional string which will be send to user
 * @return true when message was send
 */
int MobileAppNotifyUserRegister( void *lsb, const char *username, const char *channel_id, const char *app, const char *title, const char *message, MobileNotificationTypeT notification_type, const char *extraString )
{
	SystemBase *sb = (SystemBase *)lsb;
	UserMobileAppConnectionsT *user_connections = NULL;
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		user_connections = HashmapGetData( globalUserToAppConnectionsMap, username );
		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}
	MobileManager *mm = sb->sl_MobileManager;
	Notification *notif = NULL;
	FBOOL wsMessageSent = FALSE;
	
	// get message length
	
	unsigned int reqLengith = 0;
	
	DEBUG("\n\n\n\n---------------------------------------------MobileAppNotifyUserRegister\n");
	
	// if value was not passed, create new Notification
	
	char *escapedChannelId = json_escape_string(channel_id);
	char *escapedTitle = json_escape_string(title);
	char *escapedMessage = json_escape_string(message);
	char *escapedApp = NULL;
	char *escapedExtraString = NULL;
	
	if( app )
	{
		escapedApp = json_escape_string( app );
		reqLengith += strlen( escapedApp );
	}
	if( extraString )
	{
		escapedExtraString = json_escape_string( extraString );
		reqLengith += strlen( escapedExtraString );
	}
	
	notif = NotificationNew();
	notif->n_Application = escapedApp;
	notif->n_Channel = escapedChannelId;
	notif->n_UserName = StringDuplicate( username );
	notif->n_Title = escapedTitle;
	notif->n_Content = escapedMessage;
	notif->n_Extra = escapedExtraString;
	notif->n_NotificationType = notification_type;
	notif->n_Status = NOTIFY_ACTION_REGISTER;
	notif->n_Created = time(NULL);
	
	NotificationManagerAddNotificationDB( sb->sl_NotificationManager, notif );
	
	reqLengith += strlen( notif->n_Channel ) + strlen( notif->n_Content ) + strlen( notif->n_Title ) + LWS_PRE + 512/*some slack*/;
	
	// allocate memory for message
	
	char *jsonMessage = FMalloc( reqLengith );
	
	// msg
	/*
	if( extraString )
	{ //TK-1039
		snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE,
		"{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\"}", escaped_channel_id, escaped_message, escaped_title, escapedExtraString, escaped_app );
	}
	else
	{
		snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE,
		"{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\"}", escaped_channel_id, escaped_message, escaped_title, escaped_app );
	}
	*/
	// inform user there is notification for him
	// if there is no connection it means user cannot get message
	// then send him notification via mobile devices
	
	User *usr = UMGetUserByName( sb->sl_UM, username );
	if( usr != NULL )
	{
		time_t timestamp = time( NULL );
		//
		
		UserSessListEntry  *usl = usr->u_SessionsList;
		while( usl != NULL )
		{
			UserSession *locses = (UserSession *)usl->us;
			if( locses != NULL )
			{
				DEBUG("[AdminWebRequest] Going through sessions, device: %s\n", locses->us_DeviceIdentity );
				
				if( ( ( (timestamp - locses->us_LoggedTime) < sb->sl_RemoveSessionsAfterTime ) ) && locses->us_WSClients != NULL )
				{
					int msgLen = 0;
					NotificationSent *lns = NotificationSentNew();
					lns->ns_NotificationID = notif->n_ID;
					lns->ns_RequestID = locses->us_ID;
					lns->ns_Target = MOBILE_APP_TYPE_NONE;	// none means WS
					lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
					NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
					
					if( notif->n_Extra )
					{ //TK-1039
						msgLen = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
					}
					else
					{
						msgLen = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
					}
					
					int msgsize = reqLengith + msgLen;
					char *sndbuffer = FMalloc( msgsize );
					
					DEBUG("\t\t\t\t\t\t\t jsonMessage '%s' len %d \n", jsonMessage, reqLengith );
					int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"notification\",\"data\":{\"id\":\"%lu\",\"notificationData\":%s}}}", lns->ns_ID , jsonMessage );
					
					DEBUG("\t\t\t\t\t\t\t sndbuffer '%s' len %d \n", sndbuffer, msgsize );
					
					WebSocketSendMessageInt( locses, sndbuffer, lenmsg );
					FFree( sndbuffer );
					
					// add NotificationSent to Notification
					lns->node.mln_Succ = (MinNode *)notif->n_NotificationsSent;
					notif->n_NotificationsSent = lns;
					
					wsMessageSent = TRUE;
				}
			} // locses = NULL
			usl = (UserSessListEntry *)usl->node.mln_Succ;
		}
		usr = (User *)usr->node.mln_Succ;
	}	// usr != NULL
	
	//
	// go through all mobile connections
	//
	
	unsigned int jsonMessageLength = strlen( jsonMessage + LWS_PRE);
	// if message was already sent
	// this means that user got msg on Workspace
	if( user_connections != NULL )
	{
		DEBUG("Send: <%s>\n", jsonMessage + LWS_PRE);
		// register only works when there was no active desktop WS connection
		// and action is register
		if( wsMessageSent == FALSE )
		{
			switch( notification_type )
			{
				case MN_force_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					if( user_connections->connection[i] )
					{
						NotificationSent *lns = NotificationSentNew();
						lns->ns_NotificationID = notif->n_ID;
						lns->ns_RequestID = (FULONG)user_connections->connection[i]->mac_UserMobileAppID;
						lns->ns_Target = MOBILE_APP_TYPE_ANDROID;
						lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
						NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
						int msgSendLength;
						
#ifdef WEBSOCKET_SEND_QUEUE
						if( notif->n_Extra )
						{ //TK-1039
							msgSendLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							msgSendLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}

						WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, msgSendLength );
#else
						if( notif->n_Extra )
						{ //TK-1039
							snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
						
						//NotificationSentDelete( lns );
						// add NotificationSent to Notification
						lns->node.mln_Succ = (MinNode *)notif->n_NotificationsSent;
						notif->n_NotificationsSent = lns;
					}
				}
				break;

				case MN_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					if( user_connections->connection[i] && user_connections->connection[i]->mac_AppStatus != MOBILE_APP_STATUS_RESUMED )
					{
						NotificationSent *lns = NotificationSentNew();
						lns->ns_NotificationID = notif->n_ID;
						lns->ns_RequestID = (FULONG)user_connections->connection[i]->mac_UserMobileAppID;
						lns->ns_Target = MOBILE_APP_TYPE_ANDROID;
						lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
						NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
						int msgSendLength;
						
#ifdef WEBSOCKET_SEND_QUEUE
						if( extraString )
						{ //TK-1039
							msgSendLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							msgSendLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						
						
						WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, msgSendLength );
#else
						if( extraString )
						{ //TK-1039
							snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
						//NotificationSentDelete( lns );
						// add NotificationSent to Notification
						lns->node.mln_Succ = (MinNode *)notif->n_NotificationsSent;
						notif->n_NotificationsSent = lns;
					}
				}
				break;
				default: FERROR("**************** UNIMPLEMENTED %d\n", notification_type);
			}
		}
		// wsMessageSent == FALSE
	}
	else
	{
		DEBUG("User <%s> does not have any app WS connections\n", username );
	}
	
	// message to user Android: "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\"}"
	// message from example to APNS: /client.py '{"auth":"72e3e9ff5ac019cb41aed52c795d9f4c","action":"notify","payload":"hellooooo","sound":"default","token":"1f3b66d2d16e402b5235e1f6f703b7b2a7aacc265b5af526875551475a90e3fe","badge":1,"category":"whatever"}'
	
	DEBUG("NotifyUser: send message to other mobile apps\n");
	
	char *jsonMessageIOS = NULL;
	int jsonMessageIosLength = reqLengith+512;
	if( wsMessageSent == FALSE && sb->l_APNSConnection != NULL && sb->l_APNSConnection->wapns_Connection != NULL )
	{
		if( ( jsonMessageIOS = FMalloc( jsonMessageIosLength ) ) != NULL )
		{
			// on the end, list for the user should be taken from DB instead of going through all connections
			
			UserMobileApp *lmaroot = MobleManagerGetMobileAppByUserPlatformDBm( sb->sl_MobileManager, username, MOBILE_APP_TYPE_IOS );
			UserMobileApp *lma = lmaroot;
			
			while( lma != NULL )
			{
				NotificationSent *lns = NotificationSentNew();
				lns->ns_NotificationID = notif->n_ID;
				lns->ns_RequestID = lma->uma_ID;
				lns->ns_Target = MOBILE_APP_TYPE_IOS;
				lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
				NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
				
				DEBUG("Send message to device %s\n", lma->uma_Platform );
				int msgsize = snprintf( jsonMessageIOS, jsonMessageIosLength, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", sb->l_AppleKeyAPI, notif->n_Content, lma->uma_AppToken, notif->n_Application, lns->ns_ID );
			
				WebsocketClientSendMessage( sb->l_APNSConnection->wapns_Connection, jsonMessageIOS, msgsize );
				
				//NotificationSentDelete( lns );
				// add NotificationSent to Notification
				lns->node.mln_Succ = (MinNode *)notif->n_NotificationsSent;
				notif->n_NotificationsSent = lns;
				
				lma = (UserMobileApp *)lma->node.mln_Succ;
			}
			UserMobileAppDeleteAll( lmaroot );
		/*
			MobileListEntry *mle = MobleManagerGetByUserNameDBPlatform( mm, user_connections->userID, (char *)username, MOBILE_APP_TYPE_IOS );
			//MobileListEntry *mle = MobleManagerGetByUserIDDBPlatform( mm, user_connections->userID, MOBILE_APP_TYPE_IOS );
			while( mle != NULL )
			{
				snprintf( json_message_ios, json_message_ios_size, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\"}", sb->l_AppleKeyAPI, escaped_message, mle->mm_UMApp->uma_AppToken );
			
				WebsocketClientSendMessage( sb->l_APNSConnection->wapns_Connection, json_message_ios, json_message_ios_size );
				mle = (MobileListEntry *) mle->node.mln_Succ;
			}
		*/
			FFree( jsonMessageIOS );
		}
	}
	else
	{
		FERROR("Message was sent through websockets or APNS is not enabled!\n");
	}
	FFree( jsonMessage );

	return 0;
}


/**
 * Notify user update
 *
 * @param username pointer to string with user name
 * @param notif pointer to Notfication structure
 * @param notifSentID id of NotificationSent from information is coming
 * @param action id of action
 * @return true when message was send
 */
int MobileAppNotifyUserUpdate( void *lsb,  const char *username, Notification *notif, FULONG notifSentID, int action )
{
	SystemBase *sb = (SystemBase *)lsb;
	UserMobileAppConnectionsT *user_connections = NULL;
	
	if( FRIEND_MUTEX_LOCK( &globalSessionRemovalMutex ) == 0 )
	{
		user_connections = HashmapGetData( globalUserToAppConnectionsMap, username );
		FRIEND_MUTEX_UNLOCK( &globalSessionRemovalMutex );
	}
	NotificationSent *notifSent = NULL;
	
	// get message length
	
	unsigned int reqLengith = 0;
	
	DEBUG("[MobileAppNotifyUserUpdate] start\n");
	
	if( notif != NULL )
	{
		if( notif->n_NotificationsSent == NULL )
		{
			notif->n_NotificationsSent = NotificationManagerGetNotificationsSentDB( sb->sl_NotificationManager, notif->n_ID );
		}
	}
	else	// Notification was not provided by function, must be readed from DB
	{
		notif = NotificationManagerGetTreeByNotifSentDB( sb->sl_NotificationManager, notifSentID );
		if( notif != NULL )
		{
			NotificationSent *ln = notif->n_NotificationsSent;
			while( ln != NULL )
			{
				if( notifSentID == ln->ns_ID )
				{
					notifSent = ln;
					break;
				}
				ln = (NotificationSent *)ln->node.mln_Succ;
			}
		}
	}
	
	if( notif != NULL )
	{
		reqLengith = strlen( notif->n_Channel ) + strlen( notif->n_Content ) + strlen( notif->n_Title ) + LWS_PRE + 512/*some slack*/;
		
		if( notif->n_Application != NULL )
		{
			reqLengith += strlen( notif->n_Application );
		}
		
		if( notif->n_Extra != NULL )
		{
			reqLengith += strlen( notif->n_Extra );
		}
	}
	
	// allocate memory for message
	
	char *jsonMessage = FMalloc( reqLengith );
	
	//
	// go through all mobile devices
	//

	// if message was already sent
	// this means that user got msg on Workspace
	if( user_connections != NULL )
	{
		//DEBUG("Send: <%s>\n", jsonMessage + LWS_PRE);
		if( action == NOTIFY_ACTION_READED )
		{
			switch( notif->n_NotificationType )
			{
				case MN_force_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					// connection which was sending timeout 
					if( user_connections->connection[i] )
					{
						NotificationSent *lnf = notif->n_NotificationsSent;
						
						while( lnf != NULL )
						{
							if( lnf->ns_RequestID == (FULONG)user_connections->connection[i]->mac_UserMobileAppID )
							{
#ifdef WEBSOCKET_SEND_QUEUE
								unsigned int jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"application\":\"%s\",\"action\":\"remove\",\"id\":%lu}", notif->n_Channel, notif->n_Application, lnf->ns_ID );
						
								WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, jsonMessageLength );
#else
								unsigned int jsonMessageLength = LWS_PRE + snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"application\":\"%s\",\"action\":\"remove\",\"id\":%lu}", notif->n_Channel, notif->n_Application, lnf->ns_ID );
								lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
								break;
							}
							lnf = (NotificationSent *) lnf->node.mln_Succ;
						}
					}
				}
				break;

				case MN_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					if( user_connections->connection[i] && user_connections->connection[i]->mac_AppStatus != MOBILE_APP_STATUS_RESUMED )
					{
						NotificationSent *lnf = notif->n_NotificationsSent;
						
						while( lnf != NULL )
						{
							if( lnf->ns_RequestID == (FULONG)user_connections->connection[i]->mac_UserMobileAppID )
							{
#ifdef WEBSOCKET_SEND_QUEUE
								unsigned int jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"application\":\"%s\",\"action\":\"remove\",\"id\":%lu}", notif->n_Channel, notif->n_Application, lnf->ns_ID );
						
								WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, jsonMessageLength );
#else
								unsigned int jsonMessageLength = snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"application\":\"%s\",\"action\":\"remove\",\"id\":%lu}", notif->n_Channel, notif->n_Application, lnf->ns_ID );
								lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
								break;
							}
							lnf = (NotificationSent *) lnf->node.mln_Succ;
						}
					}
				}
				break;
				default: FERROR("**************** UNIMPLEMENTED %d\n", notif->n_NotificationType);
			}
		}
		//
		// seems noone readed message on desktop, we must inform all user channels that we have package for him
		//
		else if( action == NOTIFY_ACTION_TIMEOUT )
		{
			switch( notif->n_NotificationType )
			{
				case MN_force_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					// connection which was sending timeout 
					if( user_connections->connection[i] )
					{
						NotificationSent *lns = NotificationSentNew();
						lns->ns_NotificationID = notif->n_ID;
						lns->ns_RequestID = (FULONG)user_connections->connection[i];
						lns->ns_Target = MOBILE_APP_TYPE_ANDROID;
						lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
						NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
						
						unsigned int jsonMessageLength = 0;
#ifdef WEBSOCKET_SEND_QUEUE
						if( notif->n_Extra )
						{ //TK-1039
							jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						
						WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, jsonMessageLength );
#else
						if( notif->n_Extra )
						{ //TK-1039
							jsonMessageLength = snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							jsonMessageLength = snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
						
						NotificationSentDelete( lns );
					}
				}
				break;

				case MN_all_devices:
				for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
				{
					if( user_connections->connection[i] && user_connections->connection[i]->mac_AppStatus != MOBILE_APP_STATUS_RESUMED )
					{
						NotificationSent *lns = NotificationSentNew();
						lns->ns_NotificationID = notif->n_ID;
						lns->ns_RequestID = (FULONG)user_connections->connection[i];
						lns->ns_Target = MOBILE_APP_TYPE_ANDROID;
						lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
						NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
						
						unsigned int jsonMessageLength = 0;
#ifdef WEBSOCKET_SEND_QUEUE
						if( notif->n_Extra )
						{ //TK-1039
							jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						
						WriteMessage( user_connections->connection[i], (unsigned char*)jsonMessage, jsonMessageLength );
#else
						if( notif->n_Extra )
						{ //TK-1039
							jsonMessageLength = snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							jsonMessageLength = snprintf( jsonMessage + LWS_PRE, reqLengith-LWS_PRE, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
						lws_write(user_connections->connection[i]->mac_WebsocketPtr,(unsigned char*)jsonMessage+LWS_PRE,jsonMessageLength,LWS_WRITE_TEXT);
#endif
						
						NotificationSentDelete( lns );
					}
				}
				break;
				default: FERROR("**************** UNIMPLEMENTED %d\n", notif->n_NotificationType );
			}
		}
	}
	else
	{
		DEBUG("User <%s> does not have any app WS connections\n", username);
	}
	
	// message to user Android: "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\"}"
	// message from example to APNS: /client.py '{"auth":"72e3e9ff5ac019cb41aed52c795d9f4c","action":"notify","payload":"hellooooo","sound":"default","token":"1f3b66d2d16e402b5235e1f6f703b7b2a7aacc265b5af526875551475a90e3fe","badge":1,"category":"whatever"}'
	
	DEBUG("NotifyUser: send message to other mobile apps\n");
	
	char *jsonMessageIOS;
	int jsonMessageIosLength = reqLengith+512;
	if( sb->l_APNSConnection != NULL && sb->l_APNSConnection->wapns_Connection != NULL )
	{
		if( ( jsonMessageIOS = FMalloc( jsonMessageIosLength ) ) != NULL )
		{
			UserMobileApp *lmaroot = MobleManagerGetMobileAppByUserPlatformDBm( sb->sl_MobileManager, username, MOBILE_APP_TYPE_IOS );
			UserMobileApp *lma = lmaroot;
			
			if( action == NOTIFY_ACTION_READED )
			{
				while( lma != NULL )
				{
					NotificationSent *lns = NotificationSentNew();
					lns->ns_NotificationID = notif->n_ID;
					lns->ns_RequestID = lma->uma_ID;
					lns->ns_Target = MOBILE_APP_TYPE_IOS;
					lns->ns_Status = NOTIFICATION_SENT_STATUS_READED;
					NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
					
					DEBUG("Send message to device %s\n", lma->uma_Platform );
					int msgsize = snprintf( jsonMessageIOS, jsonMessageIosLength, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\",\"application\":\"%s\",\"action\":\"remove\",\"id\":%lu}", sb->l_AppleKeyAPI, notif->n_Content, lma->uma_AppToken, notif->n_Application, lns->ns_ID );
			
					WebsocketClientSendMessage( sb->l_APNSConnection->wapns_Connection, jsonMessageIOS, msgsize );
					
					NotificationSentDelete( lns );

					lma = (UserMobileApp *)lma->node.mln_Succ;
				}
			}
			//
			// seems noone readed message on desktop, we must inform all user channels that we have package for him
			//
			else if( action == NOTIFY_ACTION_TIMEOUT )
			{
				while( lma != NULL )
				{
					NotificationSent *lns = NotificationSentNew();
					lns->ns_NotificationID = notif->n_ID;
					lns->ns_RequestID = lma->uma_ID;
					lns->ns_Target = MOBILE_APP_TYPE_IOS;
					lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
					NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
					
					DEBUG("Send message to device %s\n", lma->uma_Platform );
					int msgsize = snprintf( jsonMessageIOS, jsonMessageIosLength, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", sb->l_AppleKeyAPI, notif->n_Content, lma->uma_AppToken, notif->n_Application, lns->ns_ID );
			
					WebsocketClientSendMessage( sb->l_APNSConnection->wapns_Connection, jsonMessageIOS, msgsize );
					
					NotificationSentDelete( lns );

					lma = (UserMobileApp *)lma->node.mln_Succ;
				}
			} // notifSentID == 0
			
			UserMobileAppDeleteAll( lmaroot );
		/*
		MobileListEntry *mle = MobleManagerGetByUserNameDBPlatform( mm, user_connections->userID, (char *)username, MOBILE_APP_TYPE_IOS );
		//MobileListEntry *mle = MobleManagerGetByUserIDDBPlatform( mm, user_connections->userID, MOBILE_APP_TYPE_IOS );
		while( mle != NULL )
		{
			snprintf( json_message_ios, json_message_ios_size, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\"}", sb->l_AppleKeyAPI, escaped_message, mle->mm_UMApp->uma_AppToken );
			
			WebsocketClientSendMessage( sb->l_APNSConnection->wapns_Connection, json_message_ios, json_message_ios_size );
			mle = (MobileListEntry *) mle->node.mln_Succ;
		}
		*/
			FFree( jsonMessageIOS );
		}
	}
	else
	{
		INFO("No connection to APNS server!\n");
	}
	
	FFree( jsonMessage );
	
	//NotificationDelete( notif );
	
	return 0;
}

/**
 * Mobile App Ping thread
 *
 * @param a pointer to thread data (not used)
 * @return NULL
 */
static void* MobileAppPingThread( void *a __attribute__((unused)) )
{
	pthread_detach( pthread_self() );
	DEBUG("App ping thread started\n");

	while (1)
	{
		DEBUG("Checking app communication times\n");

		int users_count = HashmapLength(globalUserToAppConnectionsMap);
		bool check_okay = true;

		unsigned int index = 0;

		HashmapElement *element = NULL;
		while( (element = HashmapIterate(globalUserToAppConnectionsMap, &index)) != NULL )
		{
			UserMobileAppConnectionsT *user_connections = element->data;
			if( user_connections == NULL )
			{
				//the hashmap was invalidated while we were reading it? let's try another ping session....
				check_okay = false;
				break;
			}

			pthread_mutex_lock(&globalSessionRemovalMutex);
			//mutex is needed because a connection can be removed at any time within websocket_app_callback,
			//so a race condition would lead to null-pointers and stuff...

			//iterate through all user connections
			for( int i = 0; i < MAX_CONNECTIONS_PER_USER; i++ )
			{
				if (user_connections->connection[i])
				{ //see if a connection exists
					if( time(NULL) - user_connections->connection[i]->mac_LastCommunicationTimestamp > KEEPALIVE_TIME_s)
					{
						DEBUG("Client <%s> connection %d requires a ping\n", user_connections->username, i);

						//send ping
						char request[LWS_PRE+64];
						strcpy(request+LWS_PRE, "{\"t\":\"keepalive\",\"status\":1}");
						//DEBUG("Request: %s\n", request+LWS_PRE);
#ifndef WEBSOCKET_SEND_QUEUE
						lws_write(user_connections->connection[i]->mac_WebsocketPtr, (unsigned char*)request+LWS_PRE, strlen(request+LWS_PRE), LWS_WRITE_TEXT);
#else
						WriteMessage( user_connections->connection[i], (unsigned char*)request+LWS_PRE, strlen(request+LWS_PRE) );
#endif
					}
				}
			} //end of user connection loops
			pthread_mutex_unlock(&globalSessionRemovalMutex);
		} //end of users loop

		if (check_okay)
		{
			sleep(KEEPALIVE_TIME_s);
		}
	}

	pthread_exit(0);
	return NULL; //should not exit anyway
}


#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1

/**
 * Test signal handler
 *
 * @param signum signal number
 */
void MobileAppTestSignalHandler( int signum __attribute__((unused)))
{
	DEBUG("******************************* sigusr handler\n");

	static unsigned int counter = 0;

	counter++;

	char title[64];
	char message[64];
	sprintf( title, "Fancy title %d", counter );
	sprintf( message, "Fancy message %d", counter );

	int status = MobileAppNotifyUserRegister( SLIB, "fadmin", "test_app", "test_app", title, message, MN_all_devices, NULL/*no extras*/);

	signal( SIGUSR1, MobileAppTestSignalHandler );
}
#endif
