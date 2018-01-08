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

#define MAX_CONNECTIONS_PER_USER 5
#define KEEPALIVE_TIME_s 10 //ping time
#define ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL 1

#define CKPT DEBUG("====== %d\n", __LINE__)

#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1
#include <signal.h>
void mobile_app_test_signal_handler(int signum);
#endif

//There is a need for two mappings, user->mobile connections and mobile connection -> user

typedef struct user_mobile_app_connections_s user_mobile_app_connections_t;
typedef struct mobile_app_connection_s mobile_app_connection_t;

struct mobile_app_connection_s {
	struct lws *websocket_ptr;
	char *session_id;
	time_t last_communication_timestamp;
	user_mobile_app_connections_t *user_connections;
	unsigned int user_connection_index;
	mobile_app_status_t app_status;
	time_t most_recent_resume_timestamp;
	time_t most_recent_pause_timestamp;
};

struct user_mobile_app_connections_s {
	char *username;
	mobile_app_connection_t *connection[MAX_CONNECTIONS_PER_USER];
};

static Hashmap *_user_to_app_connections_map;
static Hashmap *_websocket_to_user_connections_map;

static pthread_mutex_t _session_removal_mutex; //used to avoid sending pings while a session is being removed
static pthread_t _ping_thread;

static void  _mobile_app_init(void);
static int   _mobile_app_reply_error(struct lws *wsi, int error_code);
static int   _mobile_app_handle_login(struct lws *wsi, json_t *json);
static int   _mobile_app_add_new_user_connection(struct lws *wsi, const char *username);
static void* _mobile_app_ping_thread(void *a);
static char* _mobile_app_get_websocket_hash(struct lws *wsi);
static void  _mobile_app_remove_app_connection(user_mobile_app_connections_t *connections, unsigned int connection_index);

static void _mobile_app_init(void){
	DEBUG("Initializing mobile app module\n");

	_user_to_app_connections_map = HashmapNew();
	_websocket_to_user_connections_map = HashmapNew();

	pthread_mutex_init(&_session_removal_mutex, NULL);

	pthread_create(&_ping_thread, NULL/*default attributes*/, _mobile_app_ping_thread, NULL/*extra args*/);

#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1
	signal(SIGUSR1, mobile_app_test_signal_handler);
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
int websocket_app_callback(struct lws *wsi, enum lws_callback_reasons reason, void *user __attribute__((unused)), void *in, size_t len){

	DEBUG("websocket callback, reason %d, len %zu, wsi %p\n", reason, len, wsi);

	if (reason == LWS_CALLBACK_PROTOCOL_INIT){
		_mobile_app_init();
		return 0;
	}

	if (reason == LWS_CALLBACK_CLOSED || reason == LWS_CALLBACK_WS_PEER_INITIATED_CLOSE){
		char *websocket_hash = _mobile_app_get_websocket_hash(wsi);
		mobile_app_connection_t *app_connection = HashmapGetData(_websocket_to_user_connections_map, websocket_hash);

		if (app_connection == NULL){
			DEBUG("Websocket close - no user session found for this socket\n");
			return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_NO_SESSION);
		}
		pthread_mutex_lock(&_session_removal_mutex);
		//remove connection from user connnection struct
		user_mobile_app_connections_t *user_connections = app_connection->user_connections;
		unsigned int connection_index = app_connection->user_connection_index;
		DEBUG("Removing connection %d for user <%s>\n", connection_index, user_connections->username);
		_mobile_app_remove_app_connection(user_connections, connection_index);
		pthread_mutex_unlock(&_session_removal_mutex);

		/* ----------------- MEMORY LEAK AND DRAGONS HERE ----------------- */
		/* FIXME: memory leak here! HashmapRemove is unimplemented!
		 * The socket-to-user mapping should be removed from the hashmap
		 * HashmapRemove(_websocket_to_user_connections_map, websocket_hash);
		 *
		 * There is a risk that if a websocket pointer has identical value (address)
		 * as a previously used websocket connection pointer then  a HashmapPut
		 * will somehow do a double free and crash the whole application.
		 */
		/* ----------------- MEMORY LEAK AND DRAGONS HERE ----------------- */

		FFree(websocket_hash);
		return 0;
	}

	if (reason != LWS_CALLBACK_RECEIVE){
		DEBUG("Unimplemented callback, reason %d\n", reason);
		return 0;
	}

	if (len == 0){
		DEBUG("Empty websocket frame (reason %d)\n", reason);
		return 0;
	}

	char *data = (char*)in;


	DEBUG("Mobile app data: <%*s>\n", (unsigned int)len, data);

	jsmn_parser parser;
	jsmn_init(&parser);
	jsmntok_t tokens[16]; //should be enough

	int tokens_found = jsmn_parse(&parser, data, len, tokens, sizeof(tokens)/sizeof(tokens[0]));

	DEBUG("JSON tokens found %d\n", tokens_found);

	if (tokens_found < 1){
		return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_NO_JSON);
	}

	json_t json = { .string = data, .string_length = len, .token_count = tokens_found, .tokens = tokens };

	char *msg_type_string = json_get_element_string(&json, "t");

	//see if this websocket belongs to an existing connection
	char *websocket_hash = _mobile_app_get_websocket_hash(wsi);
	mobile_app_connection_t *app_connection = HashmapGetData(_websocket_to_user_connections_map, websocket_hash);
	FFree(websocket_hash);

	if (msg_type_string){

		//due to uniqueness of "t" field values only first letter has to be evaluated
		char first_type_letter = msg_type_string[0];
		DEBUG("Type letter <%c>\n", first_type_letter);

		if (first_type_letter == 'l'/*login*/){
			return _mobile_app_handle_login(wsi, &json);
		} else {

			if (app_connection == NULL){
				DEBUG("Session not found for this connection\n");
				return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_NO_SESSION);
			}

			app_connection->last_communication_timestamp = time(NULL);

			switch (first_type_letter){

			case 'p': do { //pause
				DEBUG("App is paused\n");
				app_connection->app_status = MOBILE_APP_STATUS_PAUSED;
				app_connection->most_recent_pause_timestamp = time(NULL);
				char response[LWS_PRE+64];
				strcpy(response+LWS_PRE, "{\"t\":\"pause\",\"status\":1}");
				DEBUG("Response: %s\n", response+LWS_PRE);
				lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
			} while (0);
			break;

			case 'r': do { //resume
				DEBUG("App is resumed\n");
				app_connection->app_status = MOBILE_APP_STATUS_RESUMED;
				app_connection->most_recent_resume_timestamp = time(NULL);
				char response[LWS_PRE+64];
				strcpy(response+LWS_PRE, "{\"t\":\"resume\",\"status\":1}");
				DEBUG("Response: %s\n", response+LWS_PRE);
				lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);
			} while (0);
			break;

			case 'e': //echo
				DEBUG("Echo from client\n");
				break;

			default:
				return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_WRONG_TYPE);
			}

		}
	} else {
		return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_NO_TYPE);
	}

	return 0; //should be unreachable
}

/**
 * Sends an error reply back to the app and closes the websocket.
 *
 * @param wsi pointer to a Websockets struct
 * @param error_code numerical value of the error code
 */
static int _mobile_app_reply_error(struct lws *wsi, int error_code){
	char response[LWS_PRE+32];
	snprintf(response+LWS_PRE, sizeof(response)-LWS_PRE, "{ \"t\":\"error\", \"status\":%d}", error_code);
	DEBUG("Error response: %s\n", response+LWS_PRE);

	DEBUG("WSI %p\n", wsi);
	lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);

	char *websocket_hash = _mobile_app_get_websocket_hash(wsi);
	mobile_app_connection_t *app_connection = HashmapGetData(_websocket_to_user_connections_map, websocket_hash);
	FFree(websocket_hash);
	if (app_connection){
		DEBUG("Cleaning up before closing socket\n");
		user_mobile_app_connections_t *user_connections = app_connection->user_connections;
		unsigned int connection_index = app_connection->user_connection_index;
		DEBUG("Removing connection %d for user <%s>\n", connection_index, user_connections->username);
		_mobile_app_remove_app_connection(user_connections, connection_index);
	}

	return -1;
}

static int _mobile_app_handle_login(struct lws *wsi, json_t *json){

	char *username_string = json_get_element_string(json, "user");

	if (username_string == NULL){
		return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_LOGIN_NO_USERNAME);
	}

	char *password_string = json_get_element_string(json, "pass");

	if (password_string == NULL){
		return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_LOGIN_NO_PASSWORD);
	}

	//step 3 - check if the username and password is correct
	DEBUG("Login attempt <%s> <%s>\n", username_string, password_string);

	unsigned long block_time = 0;
	User *user = UMGetUserByNameDB(SLIB->sl_UM, username_string);

	AuthMod *a = SLIB->AuthModuleGet(SLIB);

	if (a->CheckPassword(a, NULL/*no HTTP request*/, user, password_string, &block_time) == FALSE){
		DEBUG("Check = false\n");
		return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_LOGIN_INVALID_CREDENTIALS);
	} else {
		DEBUG("Check = true\n");
		return _mobile_app_add_new_user_connection(wsi, username_string);
	}
}

static void* _mobile_app_ping_thread(void *a __attribute__((unused))){
	DEBUG("App ping thread started\n");

	while (1){
		DEBUG("Checking app communication times\n");

		int users_count = HashmapLength(_user_to_app_connections_map);
		bool check_okay = true;

		unsigned int index = 0;

		HashmapElement *element = NULL;
		while ((element = HashmapIterate(_user_to_app_connections_map, &index)) != NULL){
			user_mobile_app_connections_t *user_connections = element->data;
			if (user_connections == NULL){
				//the hashmap was invalidated while we were reading it? let's try another ping session....
				check_okay = false;
				break;
			}

			pthread_mutex_lock(&_session_removal_mutex);
			//mutex is needed because a connection can be removed at any time within websocket_app_callback,
			//so a race condition would lead to null-pointers and stuff...

			//iterate through all user connections
			for (int i = 0; i < MAX_CONNECTIONS_PER_USER; i++){
				if (user_connections->connection[i]){ //see if a connection exists

					if (time(NULL) - user_connections->connection[i]->last_communication_timestamp > KEEPALIVE_TIME_s){
						DEBUG("Client <%s> connection %d requires a ping\n", user_connections->username, i);

						//send ping
						char request[LWS_PRE+64];
						strcpy(request+LWS_PRE, "{\"t\":\"keepalive\",\"status\":1}");
						DEBUG("Request: %s\n", request+LWS_PRE);
						lws_write(user_connections->connection[i]->websocket_ptr, (unsigned char*)request+LWS_PRE, strlen(request+LWS_PRE), LWS_WRITE_TEXT);

					}
				}
			} //end of user connection loops
			pthread_mutex_unlock(&_session_removal_mutex);
		} //end of users loop

		if (check_okay){
			sleep(KEEPALIVE_TIME_s);
		}
	}

	return NULL; //should not exit anyway
}

static int _mobile_app_add_new_user_connection(struct lws *wsi, const char *username){
	char *session_id = session_id_generate();

	user_mobile_app_connections_t *user_connections = HashmapGetData(_user_to_app_connections_map, username);

	if (user_connections == NULL){ //this user does not have any connections yet

		//create a new connections struct
		user_connections = FCalloc(sizeof(user_mobile_app_connections_t), 1);

		if (user_connections == NULL){
			DEBUG("Allocation failed\n");
			return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_INTERNAL);
		} else {
			DEBUG("Creating new struct for user <%s>\n", username);
			char *permanent_username = FCalloc(strlen(username)+1, 1); //TODO: error handling
			strcpy(permanent_username, username);
			user_connections->username = permanent_username;

			//FIXME: check the deallocation order for permanent_username as it is held both
			//by our internal sturcts and within hashmap structs

			//add the new connections struct to global users' connections map
			if ( !HashmapPut(_user_to_app_connections_map, permanent_username, user_connections)){
				DEBUG("Could not add new struct of user <%s> to global map\n", username);

				FFree(user_connections);
				return _mobile_app_reply_error(wsi, MOBILE_APP_ERR_INTERNAL);
			}
		}
	}

	//create struct holding this connection
	mobile_app_connection_t *new_connection = FCalloc(sizeof(mobile_app_connection_t), 1);

	new_connection->session_id = session_id;
	new_connection->last_communication_timestamp = time(NULL);
	new_connection->websocket_ptr = wsi;

	//add this struct to user connections struct
	int connection_to_replace_index = -1;
	for (int i = 0; i < MAX_CONNECTIONS_PER_USER; i++){
		if (user_connections->connection[i] == NULL){ //got empty slot
			connection_to_replace_index = i;
			DEBUG("Will use slot %d for this connection\n", connection_to_replace_index);
			break;
		}
	}

	if (connection_to_replace_index == -1){ //no empty slots found - drop the oldest connection

		connection_to_replace_index = 0;
		unsigned int oldest_timestamp = user_connections->connection[0]->last_communication_timestamp;

		for (int i = 1; i < MAX_CONNECTIONS_PER_USER; i++){
			if (user_connections->connection[i] == NULL){
				if (user_connections->connection[i]->last_communication_timestamp < oldest_timestamp){
					oldest_timestamp = user_connections->connection[i]->last_communication_timestamp;
					connection_to_replace_index = i;
					DEBUG("Will drop old connection from slot %d (last comm %d)\n", connection_to_replace_index, oldest_timestamp);
				}
			}
		}
	}

	if (user_connections->connection[connection_to_replace_index] != NULL){
		_mobile_app_remove_app_connection(user_connections, connection_to_replace_index);
	}

	DEBUG("Adding connection to slot %d\n", connection_to_replace_index);
	user_connections->connection[connection_to_replace_index] = new_connection;

	new_connection->user_connections = user_connections; //provide back reference that will map websocket to a user
	new_connection->user_connection_index = connection_to_replace_index;

	char *websocket_hash = _mobile_app_get_websocket_hash(wsi);

	HashmapPut(_websocket_to_user_connections_map, websocket_hash, new_connection); //TODO: error handling here
	//websocket_hash now belongs to the hashmap, don't free it here


	char response[LWS_PRE+64];
	snprintf(response+LWS_PRE, sizeof(response)-LWS_PRE, "{ \"t\":\"login\", \"status\":%d, \"keepalive\":%d}", 1, KEEPALIVE_TIME_s);
	DEBUG("Response: %s\n", response+LWS_PRE);
	lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);

	return 0;
}

static char* _mobile_app_get_websocket_hash(struct lws *wsi){
	/*FIXME: this is a dirty workaround for currently used hashmap module. It accepts
	 * only strings as keys, so we'll use the websocket pointer printed out as
	 * string for the key. Eventually there should be a hashmap implementation available
	 * that can use ints (or pointers) as keys!
	 */
	char *hash = FCalloc(16, 1);
	snprintf(hash, 16, "%p", wsi);
	return hash;
}

static void  _mobile_app_remove_app_connection(user_mobile_app_connections_t *connections, unsigned int connection_index){
	DEBUG("Freeing up connection from slot %d (last comm %ld)\n",
			connection_index,
			connections->connection[connection_index]->last_communication_timestamp);

	FFree(connections->connection[connection_index]->session_id);
	FFree(connections->connection[connection_index]);
	connections->connection[connection_index] = NULL;
}

bool mobile_app_notify_user(const char *username,
		const char *channel_id,
		const char *title,
		const char *message,
		mobile_notification_type_t notification_type){

	user_mobile_app_connections_t *user_connections = HashmapGetData(_user_to_app_connections_map, username);
	if (user_connections == NULL){
		DEBUG("User <%s> does not have any app connections\n", username);
		return false;
	}

	char *escaped_channel_id = json_escape_string(channel_id);
	char *escaped_title = json_escape_string(title);
	char *escaped_message = json_escape_string(message);

	unsigned int required_length = strlen(escaped_channel_id)
						+ strlen(escaped_message)
						+ strlen(escaped_message)
						+ LWS_PRE + 128/*some slack*/;

	char json_message[required_length];

	snprintf(json_message + LWS_PRE, sizeof(json_message)-LWS_PRE,
			"{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\"}",
			escaped_channel_id,
			escaped_message,
			escaped_title);

	unsigned int json_message_length = strlen(json_message + LWS_PRE);

	FFree(escaped_channel_id);
	FFree(escaped_title);
	FFree(escaped_message);

	DEBUG("Send: <%s>\n", json_message + LWS_PRE);

	switch (notification_type){
	case MN_force_all_devices:
		for (int i = 0; i < MAX_CONNECTIONS_PER_USER; i++){
			if (user_connections->connection[i]){
				lws_write(
						user_connections->connection[i]->websocket_ptr,
						(unsigned char*)json_message+LWS_PRE,
						json_message_length,
						LWS_WRITE_TEXT);
			}
		} break;

	case MN_all_devices:
		for (int i = 0; i < MAX_CONNECTIONS_PER_USER; i++){
			if (user_connections->connection[i] && user_connections->connection[i]->app_status != MOBILE_APP_STATUS_RESUMED){
				lws_write(
						user_connections->connection[i]->websocket_ptr,
						(unsigned char*)json_message+LWS_PRE,
						json_message_length,
						LWS_WRITE_TEXT);
			}
		} break;


	}
	return true;
}

#if ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL == 1
void mobile_app_test_signal_handler(int signum __attribute__((unused))){
	DEBUG("******************************* sigusr handler\n");

	static unsigned int counter = 0;

	counter++;

	char title[64];
	char message[64];
	sprintf(title, "Fancy title %d", counter);
	sprintf(message, "Fancy message %d", counter);

	bool status = mobile_app_notify_user("fadmin",
			"test_app",
			title,
			message,
			MN_all_devices);

	signal(SIGUSR1, mobile_app_test_signal_handler);
}
#endif
