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
#include <private-libwebsockets.h>
#include <system/user/user_session.h>
#include <util/base64.h>

//#define WS_PROTOCOL_BUFFER_SIZE 0x8fff
#define WS_PROTOCOL_BUFFER_SIZE 0xffff
#define USE_WORKERS

extern SystemBase *SLIB;

static void dump_handshake_info(struct lws_tokens *lwst);

static int callback_http( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len);

/**
 * Write data to websockets, inline function
 * If message is bigger then WS buffer then message is encoded, splitted and send
 *
 * @param wsi pointer to websocket structure
 * @param msgptr pointer to message
 * @param msglen length of the messsage
 * @param type type of websocket message which will be send
 * @param mut pointer to pthread mutex
 * @return number of bytes sent
 */
inline int WebsocketWriteInline( struct lws *wsi, unsigned char *msgptr, int msglen, int type, UserSession *ses )
{
	int result = 0;
	
	if( msglen > WS_PROTOCOL_BUFFER_SIZE ) // message is too big, we must split data into chunks
	{
		char *encmsg = Base64Encode( (const unsigned char *)msgptr, msglen, &msglen );
		if( encmsg != NULL )
		{
			char *locmsgptr = encmsg;
			int totalChunk = (msglen / WS_PROTOCOL_BUFFER_SIZE)+1;
			int actChunk = 0;
			
			int END_CHAR_SIGNS = 4;
			char *end = "\"}}}";
			
			DEBUG("Sending big message , size %d\n", msglen );
		
			unsigned char *sendMsg = FMalloc( LWS_SEND_BUFFER_PRE_PADDING + WS_PROTOCOL_BUFFER_SIZE + 256 );
			if( sendMsg != NULL )
			{
				// sending chunks
				for( actChunk = 0; actChunk < totalChunk ; actChunk++ )
				{
					unsigned char *chunkptr = sendMsg + LWS_SEND_BUFFER_PRE_PADDING;
					int sendLen = 0;
					
					int txtmsgpos = sprintf( (char *)chunkptr, "{\"type\":\"con\",\"data\":{\"type\":\"chunk\",\"data\":{\"id\":\"%p\",\"total\":\"%d\",\"part\":\"%d\",\"data\":\"", sendMsg, totalChunk, actChunk );
					int copysize = msglen;
					if( copysize > WS_PROTOCOL_BUFFER_SIZE )
					{
						copysize = WS_PROTOCOL_BUFFER_SIZE;
					}
					
					sendLen = txtmsgpos;
					chunkptr += txtmsgpos;
					
					DEBUG("Sending chunk:  %s  size %d  first sign %d %c last sign %d %c\n", chunkptr, copysize, ((char)locmsgptr[0]),  ((char)locmsgptr[0]),  ((char)locmsgptr[ copysize-1 ]), ((char)locmsgptr[ copysize-1 ]) );
					memcpy( chunkptr, locmsgptr, copysize );
					sendLen += copysize;
					chunkptr += copysize;
					
					memcpy( chunkptr, end, END_CHAR_SIGNS );
					sendLen += END_CHAR_SIGNS;
					chunkptr += END_CHAR_SIGNS;
					*chunkptr = 0;	//end message with NULL
					
					locmsgptr += copysize;
					msglen -= copysize;
			
					DEBUG("Send message to session %p\n", ses );
					if( ses->us_WSConnections != NULL )
					{
						pthread_mutex_lock( &(ses->us_WSMutex) );
						result += lws_write( wsi, sendMsg+LWS_SEND_BUFFER_PRE_PADDING , sendLen, type );
						int val; int x=0;
						while( 0 != (val = lws_send_pipe_choked( wsi ) ) )
						{
							usleep( 2000 );
						}
						pthread_mutex_unlock( &(ses->us_WSMutex) );
					}
				}
				FFree( sendMsg );
			}
			FFree( encmsg );
		}
	}
	else
	{
		if( ses->us_WSConnections != NULL )
		{
			pthread_mutex_lock( &(ses->us_WSMutex) );
			result = lws_write( wsi, msgptr, msglen, type );
			int val; int x=0;
			while( 0 != (val = lws_send_pipe_choked( wsi ) ) )
			{
				usleep( 200000 );
				//printf("write %d\n", val ); x++; if( x > 50 ) break;
			}
			pthread_mutex_unlock( &(ses->us_WSMutex) );
		}
	}
	
	return result;
}

/**
 * Write data to websockets
 * If message is bigger then WS buffer then message is encoded, splitted and send
 *
 * @param wsi pointer to websocket structure
 * @param msgptr pointer to message
 * @param msglen length of the messsage
 * @param type type of websocket message which will be send
 * @param mut pointer to pthread mutex
 * @return number of bytes sent
 */
int WebsocketWrite( struct lws *wsi, unsigned char *msgptr, int msglen, int type, void *ses )
{
	return WebsocketWriteInline( wsi,  msgptr, msglen, type, (UserSession *)ses );
}

/*
 i f*( msglen > WS_PROTOCOL_BUFFER_SIZE ) // message is too big, we must split data into chunks
 {
 char *locmsgptr = msgptr;
 int totalChunk = (msglen / WS_PROTOCOL_BUFFER_SIZE)+1;
 int actChunk = 0;
 
 static int END_CHAR_SIGNS = 4;
 char *end = "\"}}}";
 
 DEBUG("Sending big message , size %d\n", msglen );
 
 char *sendMsg = FMalloc( LWS_SEND_BUFFER_PRE_PADDING + WS_PROTOCOL_BUFFER_SIZE + 256 );
 if( sendMsg != NULL )
 {
 // sending chunks
 for( actChunk = 0; actChunk < totalChunk ; actChunk++ )
 {
 char *chunkptr = sendMsg + LWS_SEND_BUFFER_PRE_PADDING;
 int sendLen = 0;
 
 int txtmsgpos = sprintf( chunkptr, "{\"type\":\"con\",\"data\":{\"type\":\"chunk\",\"data\":{\"id\":\"%p\",\"total\":\"%d\",\"part\":\"%d\",\"data\":\"", sendMsg, totalChunk, actChunk );
 int copysize = msglen;
 if( copysize > WS_PROTOCOL_BUFFER_SIZE )
 {
 copysize = WS_PROTOCOL_BUFFER_SIZE;
 }
 
 sendLen = txtmsgpos;
 chunkptr += txtmsgpos;
 
 // we must be aware of \\"
 char *msgend = locmsgptr + (copysize-1);
 int subsize = 0;
 while( TRUE )
 {
 if( *msgend == ',' )
	 //if( *msgend != '\\' && *msgend != '\"' )
 {
 break;
 }
 msgend--;
 subsize++;
 }
 copysize -= subsize;
 
 DEBUG("Sending chunk:  %s  size %d  first sign %d %c last sign %d %c\n", chunkptr, copysize, ((char)locmsgptr[0]),  ((char)locmsgptr[0]),  ((char)locmsgptr[ copysize-1 ]), ((char)locmsgptr[ copysize-1 ]) );
 memcpy( chunkptr, locmsgptr, copysize );
 sendLen += copysize;
 chunkptr += copysize;
 
 memcpy( chunkptr, end, END_CHAR_SIGNS );
 sendLen += END_CHAR_SIGNS;
 chunkptr += END_CHAR_SIGNS;
 *chunkptr = 0;	//end message with NULL
 
 locmsgptr += copysize;
 msglen -= copysize;
 
 pthread_mutex_lock( mut );
 lws_write( wsi, sendMsg+LWS_SEND_BUFFER_PRE_PADDING , sendLen, type );
 int val; int x=0;
 while( 0 != (val = lws_send_pipe_choked( wsi ) ) )
 {
 usleep( 2000 );
 }
 pthread_mutex_unlock( mut ); 
 }
 FFree( sendMsg );
 }
 }
 */

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
	char result[500 + LWS_PRE];
	int result_len;

	char filename[256];
	long file_length;
	lws_filefd_type post_fd;
};

/**
 * Compare json token name to provided string
 *
 * @param json pointer to json memory where json is placed
 * @param tok pointer to json token
 * @param s name which will be used to compare with token name
 * @return 0 when success, otherwise error number
 */
static int jsoneq( const char *json, jsmntok_t *tok, const char *s ) 
{
	if (tok->type == JSMN_STRING && (int) strlen(s) == tok->end - tok->start &&
			strncmp(json + tok->start, s, tok->end - tok->start) == 0) 
	{
		return 0;
	}
	return -1;
}

// enabled for development/IDE
#ifndef ENABLE_WEBSOCKETS_THREADS
#define ENABLE_WEBSOCKETS_THREADS
#endif

#ifdef ENABLE_WEBSOCKETS_THREADS

pthread_mutex_t nothreadsmutex;
static int nothreads = 0;

typedef struct WSThreadData
{
	Http *http;
	char *pathParts[ 1024 ];
	BufString *queryrawbs;
	FCWSData *fcd;
	struct lws *wsi;
	char *requestid;
	char *path;
	char *request;
	int requestLen;
}WSThreadData;

/**
 * Websocket request thread
 *
 * @param wsi pointer to WSThreadData
 * @return data value or NULL
 */

void WSThread( void *d )
{
	WSThreadData *data = (WSThreadData *)d;
#ifdef USE_PTHREAD
	pthread_detach( pthread_self() );
#endif
	
	pthread_mutex_lock( &nothreadsmutex );
	nothreads++;
	pthread_mutex_unlock( &nothreadsmutex );
	
	Http *http = data->http;
	char **pathParts = data->pathParts;
	int error = 0;
	BufString *queryrawbs = data->queryrawbs;
	FCWSData *fcd = data->fcd;
	struct lws *wsi = data->wsi;
	UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;
	
	if( fcd == NULL || ses == NULL || ses->us_WSConnections == NULL )
	{
		FERROR("Error session is NULL\n");
		DEBUG("http %p URI \n", http );
		if( http != NULL )
		{
			DEBUG("http %p URI \n", http->uri );
			UriFree( http->uri );
			
			if( http->rawRequestPath != NULL )
			{
				FFree( http->rawRequestPath );
				http->rawRequestPath = NULL;
			}
		}
		
		FFree( data->requestid );
		FFree( data->path );
		
		DEBUG("Before http\n");
		HttpFree( http );
		DEBUG("Before bufstring del\n");
		BufStringDelete( queryrawbs );
		DEBUG("After bufstring del\n");
		
		FFree( data );
		
		pthread_mutex_lock( &nothreadsmutex );
		nothreads--;
		pthread_mutex_unlock( &nothreadsmutex );
		
#ifdef USE_PTHREAD
		pthread_exit( 0 );
#endif
		return;
	}
	
	ses->us_NRConnections++;
	
	int returnError = 0; //this value must be returned to WSI!
	int n = 0;
	
	if( strcmp( pathParts[ 0 ], "system.library" ) == 0 && error == 0 )
	{
		http->h_WSocket = fcd->fcd_WSClient;
		
		struct timeval start, stop;
		gettimeofday(&start, NULL);
		
		http->content = queryrawbs->bs_Buffer;
		queryrawbs->bs_Buffer = NULL;
		
		http->h_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
		
		Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, ses );
		
		gettimeofday(&stop, NULL);
		double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
		
		DEBUG("WS ->SysWebRequest took %f seconds\n", secs );
		
		if( response != NULL )
		{
			unsigned char *buf;
			char jsontemp[ 2048 ];
			
			// If it is not JSON!
			if( response->content != NULL && ( response->content[ 0 ] != '[' && response->content[ 0 ] != '{' ) )
			{
				if( strcmp( response->content, "fail<!--separate-->{\"response\":\"user session not found\"}" )  == 0 )
				{
					returnError = -1;
				}
				
				static int END_CHAR_SIGNS = 3;
				char *end = "\"}}";
				
				int jsonsize = sprintf( jsontemp, 
					"{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%s\",\"data\":\"",
					data->requestid 
				);
				
				buf = (unsigned char *)FCalloc( 
				LWS_SEND_BUFFER_PRE_PADDING + jsonsize + (response->sizeOfContent << 1) + 1 + 
				END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) 
				);
				if( buf != NULL )
				{
					memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp, jsonsize );
					
					char *locptr = (char *) buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize;
					int z = 0;
					int znew = 0;
					int len = (int)response->sizeOfContent;
					unsigned char car;
					
					// Add escape characters to single and double quotes!
					for( ; z < len; z++ )
					{
						car = response->content[ z ];
						switch( car )
						{
							case '\\':
								locptr[ znew++ ] = '\\';
								break;
								// Always add escape chars on unescaped double quotes
							case '"':
								locptr[ znew++ ] = '\\';
								locptr[ znew++ ] = '\\';
								break;
								// New line
							case 10:
								locptr[ znew++ ] = '\\';
								car = 'n';
								break;
								// Line feed
							case 13:
								locptr[ znew++ ] = '\\'; 
								car = 'r';
								break;
								// Tab
							case 9:
								locptr[ znew++ ] = '\\';
								car = 't';
								break;
						}
						locptr[ znew++ ] = car;
					}
					
					if( locptr[ znew-1 ] == 0 ) {znew--; DEBUG("ZNEW\n");}
					memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING + jsonsize + znew, end, END_CHAR_SIGNS );

					WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, znew + jsonsize + END_CHAR_SIGNS, LWS_WRITE_TEXT, ses );
					Log( FLOG_INFO, "Websocket size: %d call: '%s'\n", response->sizeOfContent, buf+LWS_SEND_BUFFER_PRE_PADDING, response->content );
					
					FFree( buf );
				}
			}
			else
			{
				if( response->content != NULL )
				{
					//DEBUG("\n\n\nJSON\n\n\n");
					
					if( strcmp( response->content, "{\"response\":\"user session not found\"}" )  == 0 )
					{
						returnError = -1;
					}
					
					int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
					char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
					int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
					
					buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + response->sizeOfContent + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
					if( buf != NULL )
					{
						//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
						memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
						memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, response->content,  response->sizeOfContent );
						memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize+response->sizeOfContent, end,  END_CHAR_SIGNS );
						
						WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , response->sizeOfContent+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT, ses );
						
						FFree( buf );
					}
				}
				else		// content == NULL
				{
					int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
					char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
					int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
					
					buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
					if( buf != NULL )
					{
						//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
						memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
						memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, end,  END_CHAR_SIGNS );
						
						WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT, ses );
						
						FFree( buf );
					}
				}
			}
			
			HttpFree( response );
		}
		DEBUG1("[WS]:SysWebRequest return %d\n", n  );
	}
	else
	{
		char response[ 1024 ];
		int resplen = sprintf( response, "{\"response\":\"cannot parse command or bad library was called : %s\"}", pathParts[ 0 ] );
		
		char jsontemp[ 1024 ];
		static int END_CHAR_SIGNS = 2;
		char *end = "}}";
		int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
		
		unsigned char * buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + resplen + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
		if( buf != NULL )
		{
			memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
			memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, response,  resplen );
			memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize+resplen, end,  END_CHAR_SIGNS );
			
			WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , resplen+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT, ses );
			
			FFree( buf );
		}
	}
	
	DEBUG("http %p URI \n", http );
	if( http != NULL )
	{
		DEBUG("http %p URI \n", http->uri );
		UriFree( http->uri );
		
		if( http->rawRequestPath != NULL )
		{
			FFree( http->rawRequestPath );
			http->rawRequestPath = NULL;
		}
	}
	
	FFree( data->requestid );
	FFree( data->path );
	
	DEBUG("Before http\n");
	HttpFree( http );
	DEBUG("Before bufstring del\n");
	BufStringDelete( queryrawbs );
	DEBUG("After bufstring del\n");
	
	FFree( data );
	
	ses->us_NRConnections--;
	pthread_mutex_lock( &nothreadsmutex );
	nothreads--;
	pthread_mutex_unlock( &nothreadsmutex );
	
#ifdef USE_PTHREAD
	pthread_exit( 0 );
#endif
	return;
}

/**
 * Websocket ping thread
 *
 * @param wsi pointer to WSThreadData
 * @return data value or NULL
 */

void WSThreadPing( void *p )
{
	WSThreadData *data = (WSThreadData *)p;
#ifdef USE_PTHREAD
	pthread_detach( pthread_self() );
#endif
	
	pthread_mutex_lock( &nothreadsmutex );
	nothreads++;
	pthread_mutex_unlock( &nothreadsmutex );
	
	int n = 0;
	int error = 0;
	FCWSData *fcd = data->fcd;
	struct lws *wsi = data->wsi;
	
	char *answer = FCalloc( 1024, sizeof(char) );
	snprintf( answer, 1024, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%s\"}}", data->requestid );
	
	UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;
	if( ses != NULL )
	{
		ses->us_LoggedTime = time( NULL );
	
		unsigned char *buf;
		int len = strlen( answer );
		buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
		if( buf != NULL )
		{
			memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, answer,  len );
		
			WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, len, LWS_WRITE_TEXT, ses );

			FFree( buf );
		}
	
		/*
		MYSQLLibrary *sqllib  = SLIB->LibraryMYSQLGet( SLIB );
		if( sqllib != NULL )
		{
			char *tmpQuery = FCalloc( 1024, 1 );
			if( tmpQuery )
			{
				if( fcd->fcd_ActiveSession != NULL )
				{
					UserSession *us = (UserSession *)fcd->fcd_ActiveSession;
					sqllib->SNPrintF( sqllib, tmpQuery, 1024, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", time(NULL), us->us_SessionID );
					sqllib->QueryWithoutResults( sqllib, tmpQuery );
				}
			
				//FERROR("Logged time updated: %lu\n", time(NULL) );
			
				FFree( tmpQuery );
			}
			SLIB->LibraryMYSQLDrop( SLIB, sqllib );
		}
		*/
	}
	
	FFree( answer );
	FFree( data->requestid );
	FFree( data );
	
	pthread_mutex_lock( &nothreadsmutex );
	nothreads--;
	pthread_mutex_unlock( &nothreadsmutex );
	
#ifdef USE_PTHREAD
	pthread_exit( 0 );
#endif
	return;
}

#endif


/**
 * Main FriendCore websocket callback
 *
 * @param wsi pointer to main Websockets structure
 * @param reason type of received message (lws_callback_reasons type)
 * @param user user data (FC_Data)
 * @param in message in table of chars
 * @param len size of provided message
 * @return 0 when success, otherwise error number
 */
int FC_Callback( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len)
{
	int n = 0;
	FCWSData *fcd =  (FCWSData *) user;// lws_context_user ( this );
	int returnError = 0;
	nothreads++;

	DEBUG("WS Call, reason: %d\n", reason );
	
	switch( reason )
	{
		case LWS_CALLBACK_ESTABLISHED:
			//pss->fcd_Number = 0;
			FERROR("[WS]: Callback estabilished\n");
		break;
		
		case LWS_CALLBACK_CLOSED:
			FERROR("[WS]: Callback session closed\n");
			
			UserSession *us = (UserSession *)fcd->fcd_ActiveSession;
			User *u = NULL;
			if( us == NULL )
			{
				FERROR("User session dissapeard\n");
				nothreads--;
				return -1;
			}
			else
			{
				u = us->us_User;
			}
			
			DEBUG("WSI %p FCD %p USER %p\n", wsi, fcd, u );
			if( wsi == NULL || fcd == NULL || u == NULL )
			{
				nothreads--;
				return 0;
			}
			
#ifdef ENABLE_WEBSOCKETS_THREADS
			while( TRUE )
			{
				if( us->us_NRConnections <= 0 )
				{
					DEBUG("There are no more connections, we can remove session\n");
					break;
				}
				usleep( 10000 );
			}
#endif
			
			pthread_mutex_lock( &us->us_WSMutex );
			SystemBase *sb = NULL;
			
			if( u != NULL )
			{
				WebsocketClient *nwsc = us->us_WSConnections;
				WebsocketClient *owsc = nwsc;
				
				if( nwsc != NULL )
				{
					DEBUG("[WS]: Getting connections %p for user %s\n", nwsc, u->u_Name );
					
					// remove first entry!
					DEBUG("[WS]: NWSCPOINTER %p POINTER %p\n" , nwsc->wc_Wsi, wsi );
					sb = (SystemBase *)fcd->fcd_SystemBase;
					
					if( nwsc->wc_Wsi == wsi )
					{
						us->us_WSConnections = (WebsocketClient *)us->us_WSConnections->node.mln_Succ;
						DEBUG("[WS]: Remove single connection  %p  session connections pointer %p\n", owsc, us->us_WSConnections );
						
						AppSessionRemByWebSocket( sb->sl_AppSessionManager->sl_AppSessions, owsc );
						
						owsc->wc_UserSession = NULL;
						owsc->wc_Wsi = NULL;
						FFree( owsc );
						owsc = NULL;
						DEBUG("[WS]: WS connection removed\n");
					}
					// remove entry from the list
					else
					{
						DEBUG("[WS]: Remove connection from list\n");
						while( nwsc != NULL )
						{
							DEBUG("[WS]: WS Entry\n");
							owsc = nwsc;
							nwsc = (WebsocketClient *)nwsc->node.mln_Succ;
							
							if( nwsc != NULL && nwsc->wc_Wsi == wsi )
							{
								DEBUG("Found connection %p\n", owsc );
								owsc->node.mln_Succ = nwsc->node.mln_Succ;
								
								AppSessionRemByWebSocket( sb->sl_AppSessionManager->sl_AppSessions, nwsc );
								
								DEBUG("WS connection will be removed\n");
								nwsc->wc_UserSession = NULL;
								nwsc->wc_Wsi = NULL;
								FFree( nwsc );
								nwsc = NULL;
								
								//fcd->fcd_ActiveSession = NULL;
								//fcd->fcd_SystemBase = NULL;
								//fcd->fcd_WSClient = NULL;
								break;
							}
						}
					}
				}
			}
			else
			{
				FERROR("Cannot remove connection: Pointer to user is NULL\n");
			}
			DEBUG("[WS]: mutex will be unlocked\n");
			pthread_mutex_unlock(  &us->us_WSMutex );

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
			n = INVARGroup(wsi, p, n, LWS_WRITE_TEXT);
			if (n < 0) 
			{
				fprintf(stderr, "FERROR writing to socket");
				return 1;
			}
		break;
		*/

		case LWS_CALLBACK_RECEIVE:
			{
				// if we want to move full calls to WS threads
				
//				Socket *sock = SocketWSOpen( wsi );
 				/*
				type : msg
				data:
					type: event
					data:
						path: event_path
						authid : string
						data:   event data
						
				type: con
				data: {
					type : session
					data : string
				*/
				//DEBUG1("[WS]: Callback receive\n");
				
				{
					int i, i1;
					int r;
					jsmn_parser p;
					jsmntok_t t[128]; // We expect no more than 128 tokens 

					jsmn_init(&p);
					r = jsmn_parse(&p, in, len, t, sizeof(t)/sizeof(t[0]));
					if (r < 0) 
					{
						FERROR("Failed to parse JSON: %d\n", r);
						nothreads--;
						return 0;
					}

					// Assume the top-level element is an object 
					if (r > 1 && t[0].type == JSMN_OBJECT) 
					{
						if (jsoneq( in, &t[1], "type") == 0) 
						{
							//DEBUG1("Type found\n");
							
							//
							// connection message - somebody wants to connect!
							//
							
							if( strncmp( "con",  in + t[ 2 ].start, t[ 2 ].end-t[ 2 ].start ) == 0 )
							{
								//DEBUG1("Connection  r %d\n", r );
								// We're connecting with a JSON object!
								if( t[4].type == JSMN_OBJECT )
								{
									// we are trying to find now session or authid
									for( i = 0; i < r ; i++ )
									{
										i1 = i + 1;
										
										// Incoming connection is authenticating with sessionid (the Workspace probably)
										if( strncmp( "sessionId",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
										{
											DEBUG("Session id found Websockets\n");
											char session[ DEFAULT_SESSION_ID_SIZE ];
											memset( session, 0, DEFAULT_SESSION_ID_SIZE );
										
											strncpy( session, in + t[ i1 ].start, t[i1 ].end-t[ i1 ].start );
											
											// We could connect? If so, then just send back a pong..
											if( SLIB->AddWebSocketConnection( SLIB, wsi, session, NULL, fcd ) >= 0 )
											{
												INFO("[WS]:Websocket communication set with user (sessionid) %s\n", session );
												
												char answer[ 1024 ];
												snprintf( answer, 1024, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
												
												unsigned char *buf;
												int len = strlen( answer );
												buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
												if( buf != NULL )
												{
													//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
													memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, answer,  len );
													
													UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;

													if( ses != NULL )
													{
														WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, len, LWS_WRITE_TEXT, ses );
													}
													FFree( buf );
												}
											}
										}
										// Incoming connection is authenticating with authid (from an application or an FS)
										else if( strncmp( "authid",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
										{
											DEBUG("Auth id found in Websockets\n");
											char authid[ DEFAULT_SESSION_ID_SIZE ];
											memset( authid, 0, DEFAULT_SESSION_ID_SIZE );
										
											strncpy( authid, in + t[ i1 ].start, t[ i1 ].end-t[ i1 ].start );
											{
												// We could connect? If so, then just send back a pong..
												if( SLIB->AddWebSocketConnection( SLIB, wsi, NULL, authid, fcd ) >= 0 )
												{
													INFO("[WS]:Websocket communication set with user (authid) %s\n", authid );
												
													char answer[ 2048 ];
													snprintf( answer, 2048, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
												
													unsigned char *buf;
													int len = strlen( answer );
													buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len+LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
													if( buf != NULL )
													{
														//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
														memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, answer,  len );

														UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;
														if( ses != NULL )
														{
															WebsocketWriteInline( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, len, LWS_WRITE_TEXT, ses );
														}
														FFree( buf );
													}
												}
											}
										}
									}	// for through parameters
									
									if( strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
									{
										// simple PING
										if( strncmp( "ping",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 && r > 8 )
										{
#ifdef ENABLE_WEBSOCKETS_THREADS
											WSThreadData *wstdata = FCalloc( 1, sizeof( WSThreadData ) );
											// threads
											pthread_t thread;
											memset( &thread, 0, sizeof( pthread_t ) );

											wstdata->wsi = wsi;
											wstdata->fcd = fcd;
											wstdata->requestid = StringDuplicateN( (char *)(in + t[ 8 ].start), t[ 8 ].end-t[ 8 ].start );

#ifdef USE_PTHREAD
											// Multithread mode
											if( pthread_create( &thread, NULL,  (void *(*)(void *))WSThreadPing, ( void *)wstdata ) != 0 )
											{
											}
#else
#ifdef USE_WORKERS
											//SystemBase *lsb = (SystemBase *)fcd->fcd_SystemBase;
											WorkerManagerRun( SLIB->sl_WorkerManager,  WSThreadPing, wstdata, NULL );
#else
#endif
#endif
											
#else
											char answer[ 2048 ];
											snprintf( answer, 2048, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ 8 ].end-t[ 8 ].start, (char *)(in + t[ 8 ].start) );
											
											UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;
											if( ses != NULL )
											{
												ses->us_LoggedTime = time( NULL );
												
												unsigned char *buf;
												int len = strlen( answer );
												buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + len + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
												if( buf != NULL )
												{
													memcpy( buf + LWS_SEND_BUFFER_PRE_PADDING, answer,  len );
	
													n = lws_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, len, LWS_WRITE_TEXT);
													FFree( buf );
												}
											
												MYSQLLibrary *sqllib  = SLIB->LibraryMYSQLGet( SLIB );
												if( sqllib != NULL )
												{
													char *tmpQuery = FCalloc( 1024, 1 );
													if( tmpQuery )
													{
														if( fcd->fcd_ActiveSession != NULL )
														{
															UserSession *us = (UserSession *)fcd->fcd_ActiveSession;
															sqllib->SNPrintF( sqllib, tmpQuery, 1024, "UPDATE FUserSession SET `LoggedTime` = '%ld' WHERE `SessionID` = '%s'", time(NULL), us->us_SessionID );
															sqllib->SelectWithoutResults( sqllib, tmpQuery );
														}
														SLIB->LibraryMYSQLDrop( SLIB, sqllib );
													
														//FERROR("Logged time updated: %lu\n", time(NULL) );
													
														FFree( tmpQuery );
													}
												}
											} // if( ses != NULL
#endif
										}
									}
								}
							}
							
							//
							// regular message - just passing information on an already established connection
							//
							
							else if( strncmp( "msg",  in + t[ 2 ].start, 3 ) == 0 )
							{
								//char **pathParts = NULL;
								
								// type object
								if( t[4].type == JSMN_OBJECT)
								{
									if( strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
									{
										if( strncmp( "request",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
										{
#ifdef ENABLE_WEBSOCKETS_THREADS
											WSThreadData *wstdata = FCalloc( 1, sizeof(WSThreadData) );
#endif
											
											//if( t[8].type == JSMN_OBJECT)
											{
												char *requestid = NULL;
												int requestis = 0;
												char *path = NULL;
												int paths = 0;
												char *authid = NULL;
												int authids = 0;
												
												Http *http = HttpNew( );
												if( http != NULL )
												{
													http->h_RequestSource = HTTP_SOURCE_WS;
													http->parsedPostContent = HashmapNew();
													http->uri = UriNew();

													UserSession *s = fcd->fcd_ActiveSession;
													DEBUG("Session ptr %p\n", s );
													if( s != NULL )
													{
														if( HashmapPut( http->parsedPostContent, StringDuplicate( "sessionid" ), StringDuplicate( s->us_SessionID ) ) )
														{
															DEBUG1("[WS]:New values passed to POST %s\n", s->us_SessionID );
														}
														
														if( s->us_UserActionInfo[ 0 ] == 0 )
														{
															int fd = lws_get_socket_fd( wsi );
															char add[ 256 ];
															char rip[ 256 ];
															
															lws_get_peer_addresses( wsi, fd, add, sizeof(add), rip, sizeof(rip) );
															INFO("-----------------------------------------------call %s - %s\n", add, rip );
															
															snprintf( s->us_UserActionInfo, sizeof( s->us_UserActionInfo ), "%s / %s", add, rip );
														}
													}
													
													int i, i1;
													
#ifdef ENABLE_WEBSOCKETS_THREADS
													//thread
													char **pathParts = wstdata->pathParts;
#else
													//no thread
													char *pathParts[ 1024 ];		// could be allocated in future
													memset( pathParts, 0, 1024 );
#endif
													
													int error = 0;
													BufString *queryrawbs = BufStringNewSize( 2048 );
													
													for( i = 7 ; i < r ; i++ )
													{
														i1 = i + 1;
														
														if (jsoneq( in, &t[i], "requestid") == 0) 
														{
#ifdef ENABLE_WEBSOCKETS_THREADS
															// threads
															wstdata->requestid = StringDuplicateN(  in + t[i1].start,t[i1].end-t[i1].start );
															requestid = wstdata->requestid;
#else
															requestid = in + t[i1].start;
															requestis =  t[i1].end-t[i1].start;
#endif
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
															{
																DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, (char *)(in + t[i].start), t[i1].end-t[i1].start, (char *)(in + t[i1].start) );
															}
															i++;
														}
														// We got path!
														else if (jsoneq( in, &t[i], "path") == 0) 
														{
															// this is first path, URI
															
															if( path == NULL )
															{
#ifdef ENABLE_WEBSOCKETS_THREADS
																// threads
																wstdata->path = StringDuplicateN(  in + t[i1].start,t[i1].end-t[i1].start );
																path = wstdata->path;//in + t[i1].start;
																paths = t[i1].end-t[i1].start;
#else
																//no threads
																path = in + t[i1].start;
																paths = t[i1].end-t[i1].start;
#endif
																
																if( http->uri != NULL )
																{
																	http->uri->queryRaw = StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start );
																}
															
																//http->rawRequestPath = StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start );
															
																DEBUG1("Parsing path %s\n", path );
															
																path[ paths ] = 0;
																int j = 1;
															
																// Don't overwrite first path if it is set!														
																pathParts[ 0 ] = path;
															
																int selpart = 1;
															
																for( j = 1 ; j < paths ; j++ )
																{
																	if( path[ j ] == '/' )
																	{
																		DEBUG1("New path part created %s  path %s\n", pathParts[ selpart ], &(path[j]) );
																		   
																		pathParts[ selpart++ ] = &path[ j + 1 ];
																		path[ j ] = 0;
																	}
																}
																i++;
															}
															
															else
															{
																// this is path parameter
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
																{
																	DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, (char *)(in + t[i].start), t[i1].end-t[i1].start, (char *)(in + t[i1].start) );
																}
																i++;
															}
														}
														else if (jsoneq( in, &t[i], "authid") == 0) 
														{
															authid = in + t[i1].start;
															authids = t[i1].end-t[i1].start;
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
															{
																//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
															}
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
															{
																//DEBUG1("[WS]:New values passed to POST %s %s\n", "authid", " " );
															}
															i++;
														}
														else
														{
															
														//	  	JSMN_PRIMITIVE = 0,
														//		JSMN_OBJECT = 1,
														//		JSMN_ARRAY = 2,
														//		JSMN_STRING = 3
														//

															DEBUG("%d i   type %d\n", i, t[ i ].type );
															if(( i1) < r && t[ i ].type != JSMN_ARRAY )
															{
																if( HashmapPut( http->parsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) )
																{
																	DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start), (int)(t[i1].end-t[i1].start), (char *)(in + t[i1].start) );
																}
																
																if( t[ i1 ].type == JSMN_ARRAY || t[ i1 ].type == JSMN_OBJECT )
																{
																	int z=0;
																	
																	//for( z=i+1; z < i+t[ nextEntry ].size ; z++ )
																	//{
																	//	DEBUG("skip entry  %.*s\n", t[z].end-t[z].start, in + t[z].start );
																	//}
																	
																	if( t[ i1 ].type == JSMN_ARRAY )
																	{
																		DEBUG("Next  entry is array %d\n", t[ i1 ].size );
																		i += t[ i1 ].size;
																	}
																		
																	i++;
																	//
																	DEBUG1("current %d skip %d next %d\n", t[ i ].size-1, t[ i1 ].size-1, t[ i1+1 ].size );
																}
																else
																{
																	if( queryrawbs->bs_Size != 0 )
																	{
																		BufStringAddSize( queryrawbs, "&", 1 );
																	}
																	BufStringAddSize( queryrawbs, in + t[ i ].start, t[i].end-t[i].start );
																	BufStringAddSize( queryrawbs, "=", 1 );
																	BufStringAddSize( queryrawbs, in + t[i1].start, t[i1].end-t[i1].start );
																		
																	i++;
																}
															}
															else
															{
																DEBUG("Cannot add value: %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start) );
																i++;
															}
														}
													} // end of going through json
													DEBUG("Checking path '%s'\n", pathParts[ 0 ] );
													
#ifdef ENABLE_WEBSOCKETS_THREADS
													// threads
													pthread_t thread;
													memset( &thread, 0, sizeof( pthread_t ) );
													wstdata->http = http;
													wstdata->wsi = wsi;
													wstdata->fcd = fcd;
													wstdata->queryrawbs = queryrawbs;
													// Multithread mode
#ifdef USE_PTHREAD
													if( pthread_create( &thread, NULL, (void *(*)(void *))WSThread, ( void *)wstdata ) != 0 )
													{
													}
#else
#ifdef USE_WORKERS
													SystemBase *lsb = (SystemBase *)fcd->fcd_SystemBase;
													WorkerManagerRun( SLIB->sl_WorkerManager,  WSThread, wstdata, http );
#else
#endif
#endif
#else
													
													if( strcmp( pathParts[ 0 ], "system.library" ) == 0 && error == 0 )
													{
														http->h_WSocket = wsi;
														
														struct timeval start, stop;
														gettimeofday(&start, NULL);
														
														http->content = queryrawbs->bs_Buffer;
														queryrawbs->bs_Buffer = NULL;
														
														http->h_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
														
														Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, fcd->fcd_ActiveSession );
														
														gettimeofday(&stop, NULL);
														double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
														
														DEBUG("WS ->SysWebRequest took %f seconds\n", secs );
						
														if( response != NULL )
														{
															unsigned char *buf;
															char jsontemp[ 2048 ];
															int n;
															
															// If it is not JSON!
															if( response->content != NULL && ( response->content[ 0 ] != '[' && response->content[ 0 ] != '{' ) )
															{
																if( strcmp( response->content, "fail<!--separate-->{\"response\":\"user session not found\"}" )  == 0 )
																{
																	returnError = -1;
																}
																
																static int END_CHAR_SIGNS = 3;
																char *end = "\"}}";
															
																int jsonsize = sprintf( jsontemp, 
																	"{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%.*s\",\"data\":\"",
																	requestis,
																	requestid 
																);
																
																buf = (unsigned char *)FCalloc( 
																	LWS_SEND_BUFFER_PRE_PADDING + jsonsize + (response->sizeOfContent << 1) + 1 + 
																	END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) 
																);
																if( buf != NULL )
																{
																	memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp, jsonsize );
																	
																	char *locptr = (char *) buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize;
																	int z = 0;
																	int znew = 0;
																	int len = (int)response->sizeOfContent;
																	unsigned char car;
																	
																	// Add escape characters to single and double quotes!
																	for( ; z < len; z++ )
																	{
																		car = response->content[ z ];
																		switch( car )
																		{
																			case '\\':
																				locptr[ znew++ ] = '\\';
																				break;
																			// Always add escape chars on unescaped double quotes
																			case '"':
																				locptr[ znew++ ] = '\\';
																				locptr[ znew++ ] = '\\';
																				break;
																			// New line
																			case 10:
																				locptr[ znew++ ] = '\\';
																				car = 'n';
																				break;
																			// Line feed
																			case 13:
																				locptr[ znew++ ] = '\\'; 
																				car = 'r';
																				break;
																			// Tab
																			case 9:
																				locptr[ znew++ ] = '\\';
																				car = 't';
																				break;
																		}
																		locptr[ znew++ ] = car;
																	}

																	if( locptr[ znew-1 ] == 0 ) {znew--; DEBUG("ZNEW\n");}
																	memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING + jsonsize + znew, end, END_CHAR_SIGNS );
																	//DEBUG("--->  strlen %d  znew + jsonsize %d\n",  strlen( buf+LWS_SEND_BUFFER_PRE_PADDING ), znew + jsonsize );

																	n = lws_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING, znew + jsonsize + END_CHAR_SIGNS, LWS_WRITE_TEXT );
																	
																	Log( FLOG_INFO, "Websocket call: '%s'\n",  buf+LWS_SEND_BUFFER_PRE_PADDING, response->content );
																	//FERROR("\n\n\nWS\n\n'%s'\n ----------------------------------------------------------\HTTP %s\n\n\n", buf+LWS_SEND_BUFFER_PRE_PADDING, response->content );
																	
																	FFree( buf );
																}
															}
															else
															{
																if( response->content != NULL )
																{
																	//DEBUG("\n\n\nJSON\n\n\n");
																
																	if( strcmp( response->content, "{\"response\":\"user session not found\"}" )  == 0 )
																	{
																		returnError = -1;
																	}
																
																	int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
																	char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
																	int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%.*s\",\"data\":", requestis,  requestid );
															
																	buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + response->sizeOfContent + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
																	if( buf != NULL )
																	{
																		//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
																		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
																		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, response->content,  response->sizeOfContent );
																		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize+response->sizeOfContent, end,  END_CHAR_SIGNS );
							
																		n = lws_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , response->sizeOfContent+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT);

																		FFree( buf );
																	}
																}
																else		// content == NULL
																{
																	int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
																	char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
																	int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%.*s\",\"data\":", requestis,  requestid );
																	
																	buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
																	if( buf != NULL )
																	{
																		//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
																		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
																		memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, end,  END_CHAR_SIGNS );
																		
																		n = lws_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT);
																		
																		FFree( buf );
																	}
																}
															}
															
															HttpFree( response );
														}
														DEBUG1("[WS]:SysWebRequest return %d\n", n  );
													}
													else
													{
														char response[ 1024 ];
														int resplen = sprintf( response, "{\"response\":\"cannot parse command or bad library was called : %s\"}", pathParts[ 0 ] );
														
														char jsontemp[ 1024 ];
														static int END_CHAR_SIGNS = 2;
														char *end = "}}";
														int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%.*s\",\"data\":", requestis,  requestid );
															
														unsigned char * buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + jsonsize + resplen + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
														if( buf != NULL )
														{
															memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, jsontemp,  jsonsize );
															memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize, response,  resplen );
															memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING+jsonsize+resplen, end,  END_CHAR_SIGNS );
							
															n = lws_write( wsi, buf + LWS_SEND_BUFFER_PRE_PADDING , resplen+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT);
														
															FFree( buf );
														}
													}
													
													DEBUG("http %p URI \n", http );
													if( http != NULL )
													{
														DEBUG("http %p URI \n", http->uri );
														UriFree( http->uri );
														
														if( http->rawRequestPath != NULL )
														{
															FFree( http->rawRequestPath );
															http->rawRequestPath = NULL;
														}
													}

													DEBUG("Before http\n");
													HttpFree( http );
													DEBUG("Before bufstring del\n");
													BufStringDelete( queryrawbs );
													DEBUG("After bufstring del\n");
													
#endif
												}
											}
										}
										
										//
										// events, no need to respoe
										//
										
										else if( strncmp( "event",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
										{
											//DEBUG1("Event type\n");
											
											//if( t[8].type == JSMN_OBJECT)
											{
												char *requestid = NULL;
												int requestis = 0;
												char *path = NULL;
												int paths = 0;
												char *authid = NULL;
												int authids = 0;
												
												Http *http = HttpNew( );
												if( http != NULL )
												{
													http->h_RequestSource = HTTP_SOURCE_WS;
													http->parsedPostContent = HashmapNew();
													http->uri = UriNew();
													
													UserSession *s = fcd->fcd_ActiveSession;
													if( s != NULL )
													{
														DEBUG("Session ptr %p  session %p\n", s, s->us_SessionID );
														if( HashmapPut( http->parsedPostContent, StringDuplicate( "sessionid" ), StringDuplicate( s->us_SessionID ) ) )
														{
															DEBUG1("[WS]:New values passed to POST %s\n", s->us_SessionID );
														}
													
														int i, i1;
														char *pathParts[ 1024 ];		// could be allocated in future
														memset( pathParts, 0, 1024 );
													
														BufString *queryrawbs = BufStringNewSize( 2048 );
													
														for( i = 7 ; i < r ; i++ )
														{
															i1 = i + 1;
															if (jsoneq( in, &t[i], "requestid") == 0) 
															{
																requestid = in + t[i1].start;
																requestis =  t[i1].end-t[i1].start;
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
																{
																	//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
																}
																i++;
															}
															else if (jsoneq( in, &t[i], "path") == 0) 
															{
																// this is first path, URI
															
																if( path == NULL )
																{
																	path = in + t[i1].start;
																	paths = t[i1].end-t[i1].start;
																
																	if( http->uri != NULL )
																	{
																		http->uri->queryRaw = StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start );
																	}
																
																	http->rawRequestPath = StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start );
																
																	DEBUG1("Parsing path %s\n", path );
																
																	path[ paths ] = 0;
																	int j = 1;
																
																	// Don't overwrite first path if it is set!
																	//if( !pathParts[ 0 ] )
																	{
																		pathParts[ 0 ] = path;
																	}
																
																	int selpart = 1;
																
																	for( j = 1 ; j < paths ; j++ )
																	{
																		if( path[ j ] == '/' )
																		{
																			DEBUG1("New path part created %s  path %s\n", pathParts[ selpart ], &(path[j]) );
																		
																			pathParts[ selpart++ ] = &path[ j + 1 ];
																			path[ j ] = 0;
																		}
																	}
																	i++;
																}
																else
																{
																	// this is path parameter
																	if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
																	{
																		//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, (char *)(in + t[i].start), t[i1].end-t[i1].start, (char *)(in + t[i1].start) );
																	}
																	i++;
																}
															}
															else if (jsoneq( in, &t[i], "authId") == 0) 
															{
																authid = in + t[i1].start;
																authids = t[i1].end-t[i1].start;
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
																{
																	//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
																}
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) )
																{
																	//DEBUG1("[WS]:New values passed to POST %s %s\n", "authid", " " );
																}
																i++;
															}
															else
															{
																{
																	DEBUG("%d i   type %d\n", i, t[ i ].type );
																	if(( i1) < r && t[ i ].type != JSMN_ARRAY )
																	{
																		if( HashmapPut( http->parsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) )
																		{
																			DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start), (int)(t[i1].end-t[i1].start), (char *)(in + t[ i1 ].start) );
																		}
																
																		if( t[ i1 ].type == JSMN_ARRAY || t[ i1 ].type == JSMN_OBJECT )
																		{
																			int z=0;
																			
																			//for( z=i+1; z < i+t[ nextEntry ].size ; z++ )
																			//{
																			//	DEBUG("skip entry  %.*s\n", t[z].end-t[z].start, in + t[z].start );
																			//}
																		
																			if( t[ i1 ].type == JSMN_ARRAY )
																			{
																				DEBUG("Next  entry is array %d\n", t[ i1 ].size );
																				i += t[ i1 ].size;
																			}
																		
																			i++;
																			//
																			DEBUG1("current %d skip %d next %d\n", t[ i ].size-1, t[ i1 ].size-1, t[ i1+1 ].size );
																		}
																		else
																		{
																			if( queryrawbs->bs_Size != 0 )
																			{
																				BufStringAddSize( queryrawbs, "&", 1 );
																			}
																			BufStringAddSize( queryrawbs, in + t[ i ].start, t[i].end-t[i].start );
																			BufStringAddSize( queryrawbs, "=", 1 );
																			BufStringAddSize( queryrawbs, in + t[i1].start, t[i1].end-t[i1].start );
																		
																			i++;
																		}
																	}
																	else
																	{
																		DEBUG("Cannot add value: %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start) );
																			i++;
																	}
																}
															}
														} // end of going through json
													
														if( strcmp( pathParts[ 0 ], "system.library" ) == 0)
														{
															http->h_WSocket = wsi;
														
															struct timeval start, stop;
															gettimeofday(&start, NULL);
														
															http->content = queryrawbs->bs_Buffer;
															queryrawbs->bs_Buffer = NULL;
															
															http->h_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
															
															Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, fcd->fcd_ActiveSession );
														
															gettimeofday(&stop, NULL);
															double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
														
															DEBUG("\n\nWS ->SysWebRequest took %f seconds\n", secs );
														
															if( response != NULL )
															{
																if( response->content != NULL && strcmp( response->content, "fail<!--separate-->{\"response\":\"user session not found\"}" )  == 0 )
																{
																	returnError = -1;
																}
																
																HttpFree( response );
															
																BufStringDelete( queryrawbs );
															}
														}

														if( http != NULL )
														{
															UriFree( http->uri );
															if( http->rawRequestPath != NULL )
															{
																FFree( http->rawRequestPath );
																http->rawRequestPath = NULL;
															}
														}

														HttpFree( http );
													}
												} // session != NULL
												else
												{
													FERROR("User session is NULL\n");
												}
											}
										}
									}
								}
							}
							else
							{
								FERROR("Found type %10s \n %10s\n", (char *)(in + t[ 2 ].start), (char *)(in + t[ 1 ].start) );
							}
						}
					}
					else
					{
						FERROR("Object expected\n");
					}
				}
			}
			
		break;
		
		case LWS_CALLBACK_OPENSSL_PERFORM_CLIENT_CERT_VERIFICATION:
			DEBUG1("[WS]: LWS_CALLBACK_OPENSSL_PERFORM_CLIENT_CERT_VERIFICATION\n");
			break;
		
		case LWS_CALLBACK_FILTER_NETWORK_CONNECTION:
			DEBUG1("[WS]: LWS_CALLBACK_FILTER_NETWORK_CONNECTION\n");
			break;
		
		case LWS_CALLBACK_CLIENT_FILTER_PRE_ESTABLISH:
			DEBUG1("[WS]: LWS_CALLBACK_CLIENT_FILTER_PRE_ESTABLISH\n");
			break;
		
		case LWS_CALLBACK_OPENSSL_LOAD_EXTRA_CLIENT_VERIFY_CERTS:
			DEBUG1("[WS]: LWS_CALLBACK_OPENSSL_LOAD_EXTRA_CLIENT_VERIFY_CERTS\n");
		break;

	//
	 // this just demonstrates how to use the protocol filter. If you won't
	 // study and reject connections based on header content, you don't need
	 // to handle this callback
	 //

	case LWS_CALLBACK_FILTER_PROTOCOL_CONNECTION:
		dump_handshake_info((struct lws_tokens *)(long)user);
		// you could return non-zero here and kill the connection 
		DEBUG1("[WS]: Filter protocol\n");
		break;
		
	case LWS_CALLBACK_CLIENT_APPEND_HANDSHAKE_HEADER:
		DEBUG1("[WS]: LWS_CALLBACK_CLIENT_APPEND_HANDSHAKE_HEADER\n");
		break;

	default:
		DEBUG1("[WS]: Default Call, size %d\n", (int)len );
		if( len > 0 && len < 500 && in != NULL )
		{
			//DEBUG1("[WS]: Default Call, message size %d : %.*s \n", len, len, in );
		}
		break;
	}
	nothreads--;

	return returnError;
}

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
	{
		NULL, NULL, 0, 0, 0, NULL, 0 		// End of list 
	}
};

void hand(int s )
{
	DEBUG("Signal\n");
}

/**
 * Main Websockets thread
 *
 * @param data pointer to Websockets thread
 * @return 0 when success, otherwise error number
 */
int WebsocketThread( FThread *data )
{
	WebSocket *ws = (WebSocket *)data->t_Data;
	if( ws->ws_Context == NULL )
	{
		FERROR("WsContext is empty\n");
		return 0;
	}
	
	DEBUG1("[WS]:Websocket thread started\n");
	
	//signal( SIGPIPE, SIG_IGN );
	//signal( SIGPIPE, hand );

	while( TRUE )
	{
		//pthread_yield();
		int n = lws_service( ws->ws_Context, 500 );
		
		if( ws->ws_Quit == TRUE && nothreads <= 0 )
		{
			break;
		}
	}

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
	DEBUG1("[WS]:Starting websocket thread\n");
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
	
	DEBUG1("[WS]: New websocket\n");
	
	pthread_mutex_init( &nothreadsmutex, NULL );
	
	if( ( ws = FCalloc( 1, sizeof( WebSocket ) ) ) != NULL )
	{
		char *fhome = getenv( "FRIEND_HOME" );
		ws->ws_FCM = lsb->fcm;
		
		ws->ws_Port = port;
		ws->ws_UseSSL = sslOn;
		ws->ws_OldTime = 0;
		ws->ws_InterfaceName[ 0 ] = 0;
		memset( &(ws->ws_Info), 0, sizeof ws->ws_Info );
		ws->ws_Interface = NULL;
		
		if( ws->ws_UseSSL == TRUE )
		{
			INFO("[WS]:WebSocket: SSL Enabled\n");
			
			ws->ws_CertPath = lsb->RSA_SERVER_CERT;
			ws->ws_KeyPath = lsb->RSA_SERVER_KEY;
			
			DEBUG1("[WS]: server cert %s keycert %s\n", ws->ws_CertPath, ws->ws_KeyPath );
		
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
		ws->ws_Info.ssl_cert_filepath = ws->ws_CertPath;
		ws->ws_Info.ssl_private_key_filepath = ws->ws_KeyPath;
		ws->ws_Info.options = ws->ws_Opts;// | LWS_SERVER_OPTION_REQUIRE_VALID_OPENSSL_CLIENT_CERT;
		if( ws->ws_UseSSL == TRUE ) 
		{
			ws->ws_Info.options |= LWS_SERVER_OPTION_REDIRECT_HTTP_TO_HTTPS|LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT;
		}
		
		ws->ws_Info.user = ws;
		//ws->ws_Info.extensions = lws_get_internal_extensions();
//		ws->ws_Info.extensions->per_context_private_data = ws;
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
		
		//lws_set_log_level( 0, lwsl_emit_syslog);

		ws->ws_Context = lws_create_context( &(ws->ws_Info) );
		if (ws->ws_Context == NULL) 
		{
			FERROR( "[WS]: libwebsocket init failed, cannot create context\n");

			FFree( ws );
			return NULL;
		}
		
		INFO("[WS]: NEW Websockets ptr %p context %p\n", ws, ws->ws_Context);

		ws->ws_Buf[ LWS_SEND_BUFFER_PRE_PADDING ] = 'x';
			
	}
	else
	{
		FERROR("[WS]:Cannot allocate memory for WebSocket\n");
	}
	
	DEBUG1("[WS]: Websocket created\n");
	
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
		DEBUG("Websocket close in progress\n");
		
#ifdef ENABLE_WEBSOCKETS_THREADS
		while( TRUE )
		{
			if( nothreads <= 0 && ws->ws_Thread->t_Launched == FALSE )
			{
				break;
			}
			DEBUG("Threads %d\n", nothreads );
			usleep( 100000 );
		}
#endif
		
		if( ws->ws_Thread )
		{
			ThreadDelete( ws->ws_Thread );
		}
		
		if( ws->ws_Context != NULL )
		{
			lws_context_destroy( ws->ws_Context );
			ws->ws_Context = NULL;
		}
		
		if( ws->ws_CertPath != NULL )
		{
			//FFree( ws->ws_CertPath );
			//FFree( ws->ws_KeyPath );
		}
			
		FFree( ws );
	}
	
	pthread_mutex_destroy( &nothreadsmutex );
}


//
// this protocol server (always the first one) just knows how to do HTTP 
//

static int callback_http( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len)
{
	
	int n;
	char client_name[ 128 ];
	char client_ip[ 128 ];
	
	WebSocket *ws =  (WebSocket *)in;//  lws_wsi_user(lws_get_parent(wsi));
	//struct lws_pollargs *pa = (struct lws_pollargs *)in;
	//lws_context_user ( wsi );
	
	//DEBUG1("[WS]:CALLBACKHTTP get context user WS %p context %p  USER %p reason %d\n", ws, this, user, reason );

	switch( reason ) 
	{
		case LWS_CALLBACK_HTTP:
			DEBUG1( "[WS]:serving HTTP URI %s\n", (char *)in );
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

