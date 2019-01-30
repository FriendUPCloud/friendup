/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/types.h>
#include <libxml2/libxml/tree.h>
#include <libxml2/libxml/parser.h>
#include <util/log/log.h>
#include <network/http.h>

#include <system/systembase.h>

#include <libwebsockets.h>
#include <core/thread.h>
#include <time.h>
#include <util/friendqueue.h>

#undef DEBUG
#define DEBUG( ...)
#undef DEBUG1
#define DEBUG1( ...)

extern SystemBase *SLIB;

#define USE_WORKERS 1
//#define USE_WORKERS_PING
#define USE_PTHREAD_PING 1

// enabled for development/IDE
#define ENABLE_WEBSOCKETS_THREADS 1
//#define USE_PTHREAD 1

pthread_mutex_t WSThreadMutex;
int WSThreadNum = 0;

typedef struct WSThreadData
{
	FCWSData *fcd;
	Http *http;
	char *pathParts[ 1024 ];
	BufString *queryrawbs;
	//struct lws *wsi;
	char *requestid;
	char *path;
	char *request;
	int requestLen;
}WSThreadData;

static int MAX_SIZE_WS_MESSAGE = WS_PROTOCOL_BUFFER_SIZE-2048;

/**
 * Write data to websockets, inline function
 * If message is bigger then WS buffer then message is encoded, splitted and send
 *
 * @param wsi pointer to websocket structure
 * @param msgptr pointer to message
 * @param msglen length of the messsage
 * @param type type of websocket message which will be send
 * @return number of bytes sent
 */
static inline int WebsocketWriteInline( void *wsi, unsigned char *msgptr, int msglen, int type )
{
	//Log( FLOG_DEBUG, "WSwriteinline pointer: %p\n", wsi );
	int result = 0;
	WebsocketServerClient *cl = (WebsocketServerClient *)wsi;

	if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
	{
		cl->wsc_InUseCounter++;
		FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
	}
	
	if( msglen > MAX_SIZE_WS_MESSAGE ) // message is too big, we must split data into chunks
	{
		char *encmsg = Base64Encode( (const unsigned char *)msgptr, msglen, &msglen );
		if( encmsg != NULL )
		{
			char *msgToSend = encmsg;
			int totalChunk = (msglen / MAX_SIZE_WS_MESSAGE)+1;
			int actChunk = 0;
			
			int END_CHAR_SIGNS = 4;
			char *end = "\"}}}";
			
			DEBUG("[WS] Sending big message, size %d (%d chunks of max: %d)\n", msglen, totalChunk, MAX_SIZE_WS_MESSAGE );
		
			for( actChunk = 0; actChunk < totalChunk ; actChunk++ )
			{
				unsigned char *queueMsg = FMalloc( WS_PROTOCOL_BUFFER_SIZE );
				if( queueMsg != NULL )
				{
					unsigned char *queueMsgPtr = queueMsg + LWS_SEND_BUFFER_PRE_PADDING;
					int queueMsgLen = 0;
					
					int txtmsgpos = sprintf( (char *)queueMsgPtr, "{\"type\":\"con\",\"data\":{\"type\":\"chunk\",\"data\":{\"id\":\"%p\",\"total\":\"%d\",\"part\":\"%d\",\"data\":\"", encmsg, totalChunk, actChunk );
					int copysize = msglen;
					if( copysize > MAX_SIZE_WS_MESSAGE )
					{
						copysize = MAX_SIZE_WS_MESSAGE;
					}
					
					queueMsgLen = txtmsgpos;
					queueMsgPtr += txtmsgpos;
					// queue   |    PRE_PADDING  |  txtmsgpos   |  body  |  END_CHARS  | POST_PADDING

					memcpy( queueMsgPtr, msgToSend, copysize );
					queueMsgLen += copysize;
					queueMsgPtr += copysize;
					
					memcpy( queueMsgPtr, end, END_CHAR_SIGNS );
					queueMsgPtr += END_CHAR_SIGNS;
					queueMsgLen += END_CHAR_SIGNS;
					*queueMsgPtr = 0;	//end message with NULL
					
					msgToSend += copysize;
					msglen -= MAX_SIZE_WS_MESSAGE;

					DEBUG( "Determined chunk: %d\n", actChunk );

					if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
					{
						FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
						en->fq_Data = queueMsg;
						en->fq_Size = queueMsgLen;
				
						FQPushFIFO( &(cl->wsc_MsgQueue), en );
						lws_callback_on_writable( cl->wsc_Wsi );

						FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
					}
				}
			}

			//lws_callback_on_writable( cl->wc_Wsi );
			FFree( encmsg );
		}
	}
	else
	{
		if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
		{
			if( cl->wsc_Wsi != NULL && cl->wsc_UserSession != NULL )
			{
				int val;
			
				UserSession *us = ( UserSession *)cl->wsc_UserSession;
				FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
				if( en != NULL )
				{
					en->fq_Data = FMalloc( msglen+10+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
					memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, msgptr, msglen );
					en->fq_Size = msglen;
			
					FQPushFIFO( &(cl->wsc_MsgQueue), en );
				}
			}
			
			DEBUG("Send message to WSI, ptr: %p\n", cl->wsc_Wsi );
			if( cl->wsc_Wsi != NULL )
			{
				lws_callback_on_writable( cl->wsc_Wsi );
			}
			FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
		}
	}
	if( cl->wsc_Wsi != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(cl->wsc_Mutex) ) == 0 )
		{
			cl->wsc_InUseCounter--;
			FRIEND_MUTEX_UNLOCK( &(cl->wsc_Mutex) );
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
 * @return number of bytes sent
 */
int WebsocketWrite( void *wsi, unsigned char *msgptr, int msglen, int type )
{
	return WebsocketWriteInline( wsi,  msgptr, msglen, type );
}

/**
 * Websocket request thread
 *
 * @param d pointer to WSThreadData
 */

void WSThread( void *d )
{
	WSThreadData *data = (WSThreadData *)d;
#ifdef USE_PTHREAD
	pthread_detach( pthread_self() );
#endif
	
	FRIEND_MUTEX_LOCK( &WSThreadMutex );
	WSThreadNum++;
	FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
	Http *http = data->http;
	char **pathParts = data->pathParts;
	int error = 0;
	BufString *queryrawbs = data->queryrawbs;
	FCWSData *fcd = data->fcd;
	
	WebsocketServerClient *wscl = fcd->fcd_WSClient;
	struct lws *wsi = wscl->wsc_Wsi;
	
	FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
	wscl->wsc_InUseCounter++;
	FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
	
	if( wscl->wsc_ToBeRemoved == TRUE || wscl->wsc_UserSession == NULL )
	{
		FERROR("Error session is NULL\n");
		if( http != NULL )
		{
			UriFree( http->uri );
			
			if( http->rawRequestPath != NULL )
			{
				FFree( http->rawRequestPath );
				http->rawRequestPath = NULL;
			}
			HttpFree( http );
		}
		
		FFree( data->requestid );
		FFree( data->path );
		
		BufStringDelete( queryrawbs );
		
		FFree( data );
		
		FRIEND_MUTEX_LOCK( &WSThreadMutex );
		WSThreadNum--;
		FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
		
		FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
		wscl->wsc_InUseCounter--;
		FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
		
#ifdef USE_PTHREAD
		pthread_exit( 0 );
#endif
		return;
	}
	
	UserSession *ses = (UserSession *)wscl->wsc_UserSession;
	
	int returnError = 0; //this value must be returned to WSI!
	
	if( strcmp( pathParts[ 0 ], "system.library" ) == 0 && error == 0 )
	{
		http->h_WSocket = wscl;//fcd->fcd_WSClient;
		
		struct timeval start, stop;
		gettimeofday(&start, NULL);
		
		http->content = queryrawbs->bs_Buffer;
		queryrawbs->bs_Buffer = NULL;
		
		http->h_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
		
		int respcode = 0;
		Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, ses, &respcode );
		
		if( respcode == -666 )
		{
			INFO("Logout function called.");
			if( http != NULL )
			{
				UriFree( http->uri );
			
				if( http->rawRequestPath != NULL )
				{
					FFree( http->rawRequestPath );
					http->rawRequestPath = NULL;
				}
			}
			
			FFree( data->requestid );
			FFree( data->path );

			HttpFree( http );
			BufStringDelete( queryrawbs );
	
			FFree( data );
			HttpFree( response );
			
			FRIEND_MUTEX_LOCK( &WSThreadMutex );
			WSThreadNum--;
			FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
			
			FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
			wscl->wsc_InUseCounter--;
			FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );

#ifdef USE_PTHREAD
			pthread_exit(0);
#endif
			return;
		}
		
		gettimeofday(&stop, NULL);
		double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
		FBOOL fileReadCall = FALSE;
		
		if( pathParts[1] != NULL && pathParts[2] != NULL )
		{
			if( strcmp( pathParts[1], "file" ) == 0 && strcmp( pathParts[2], "read" ) == 0 )
			{
				Log( FLOG_INFO, "[WS] A. SysWebRequest took %f seconds, err: %d response: '%.*s'\n" , secs, response->errorCode, 200, response->content );
				fileReadCall = TRUE;
			}
			else
			{	// we also dont want to have large responses in logs
				Log( FLOG_INFO, "[WS] B. SysWebRequest took %f seconds, err: %d response: '%.*s'\n" , secs, response->errorCode, 200, response->content );
			}
		}
		else
		{
			Log( FLOG_INFO, "[WS] C. SysWebRequest took %f seconds, err: %d response: '%s'\n" , secs, response->errorCode, response->content );
		}
		
		if( response != NULL )
		{
			unsigned char *buf;
			char jsontemp[ 2048 ];
			
			//Log( FLOG_INFO, "[WS] Trying to check response content..\n" );
			
			// If it is not JSON!
			if( (response->content != NULL && ( response->content[ 0 ] != '[' && response->content[ 0 ] != '{' ) ) || fileReadCall == TRUE )
			{
				//Log( FLOG_INFO, "[WS] Has NON JSON response content..\n" );
				char *d = response->content;
				if( d[0] == 'f' && d[1] == 'a' && d[2] == 'i' && d[3] == 'l' )
				{
					char *code = strstr( d, "\"code\":");

					if( code != NULL && 0 == strncmp( code, "\"code\":\"11\"", 11 ) )
					{
						returnError = -1;
					}
				}

				static int END_CHAR_SIGNS = 3;
				char *end = "\"}}";
				
				int jsonsize = sprintf( jsontemp, 
					"{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%s\",\"data\":\"",
					data->requestid 
				);
				
				buf = (unsigned char *)FCalloc( 
					jsonsize + ( SHIFT_LEFT( response->sizeOfContent, 1 ) ) + 1 + 
					END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) 
				);
				
				if( buf != NULL )
				{
					memcpy( buf, jsontemp, jsonsize );
					
					char *locptr = (char *) buf+jsonsize;
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
					
					//Log( FLOG_INFO, "[WS] NO JSON - Passed FOR loop..\n" );
					
					if( locptr[ znew-1 ] == 0 ) {znew--; DEBUG("ZNEW\n");}
					memcpy( buf + jsonsize + znew, end, END_CHAR_SIGNS );

					//Log( FLOG_INFO, "[WS] NO JSON - Passed memcpy..\n" );

					if( wscl->wsc_UserSession != NULL )
					{
						//Log( FLOG_INFO, "[WS] NO JSON - WRITING..\n" );
						WebsocketWriteInline( wscl, buf, znew + jsonsize + END_CHAR_SIGNS, LWS_WRITE_TEXT );
					}
					
					FFree( buf );
				}
			}
			else
			{
				if( response->content != NULL )
				{
					if( strcmp( response->content, "{\"response\":\"user session not found\"}" )  == 0 )
					{
						returnError = -1;
					}
					
					int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
					char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
					int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
					
					buf = (unsigned char *)FCalloc( jsonsize + response->sizeOfContent + END_CHAR_SIGNS + 128, sizeof( char ) );
					if( buf != NULL )
					{
						//unsigned char buf[ response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
						memcpy( buf, jsontemp,  jsonsize );
						memcpy( buf+jsonsize, response->content, response->sizeOfContent );
						memcpy( buf+jsonsize+response->sizeOfContent, end, END_CHAR_SIGNS );
						
						//if( fcd->fcd_WSClient != NULL )
						{
							WebsocketWriteInline( wscl, buf , response->sizeOfContent+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
						}
						FFree( buf );
					}
				}
				else		// content == NULL
				{
					int END_CHAR_SIGNS = response->sizeOfContent > 0 ? 2 : 4;
					char *end = response->sizeOfContent > 0 ? "}}" : "\"\"}}";
					int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
					
					buf = (unsigned char *)FCalloc( jsonsize + END_CHAR_SIGNS + 128, sizeof( char ) );
					if( buf != NULL )
					{
						memcpy( buf, jsontemp, jsonsize );
						memcpy( buf+jsonsize, end, END_CHAR_SIGNS );
						
						if( wscl->wsc_UserSession != NULL )//&& fcd->fcd_WSClient != NULL )
						{
							WebsocketWriteInline( wscl, buf, jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
						}
						FFree( buf );
					}
				}
			}
			
			HttpFree( response );
		}
		DEBUG1("[WS] SysWebRequest return\n"  );
		Log( FLOG_INFO, "WS messages sent LOCKTEST\n");
	}
	else
	{
		Log( FLOG_INFO, "[WS] No response at all..\n" );
		char response[ 1024 ];
		char dictmsgbuf1[ 196 ];
		snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), SLIB->sl_Dictionary->d_Msg[DICT_CANNOT_PARSE_COMMAND_OR_NE_LIB], pathParts[ 0 ] );
		
		int resplen = sprintf( response, "{\"response\":\"%s\"}", dictmsgbuf1 );

		char jsontemp[ 1024 ];
		static int END_CHAR_SIGNS = 2;
		char *end = "}}";
		int jsonsize = sprintf( jsontemp, "{ \"type\":\"msg\", \"data\":{ \"type\":\"response\", \"requestid\":\"%s\",\"data\":", data->requestid );
		
		unsigned char * buf = (unsigned char *)FCalloc( jsonsize + resplen + END_CHAR_SIGNS + 128, sizeof( char ) );
		if( buf != NULL )
		{
			memcpy( buf, jsontemp,  jsonsize );
			memcpy( buf+jsonsize, response,  resplen );
			memcpy( buf+jsonsize+resplen, end,  END_CHAR_SIGNS );
			
			if( wscl->wsc_UserSession != NULL && fcd->fcd_WSClient != NULL )
			{
				WebsocketWriteInline( fcd->fcd_WSClient, buf, resplen+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
			}
			FFree( buf );
		}
		Log( FLOG_INFO, "WS no response end LOCKTEST\n");
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
	
	FFree( data->requestid );
	FFree( data->path );

	HttpFree( http );
	BufStringDelete( queryrawbs );
	
	FFree( data );
    
	FRIEND_MUTEX_LOCK( &WSThreadMutex );
	WSThreadNum--;
	FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
	FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
	wscl->wsc_InUseCounter--;
	FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
	
	Log( FLOG_INFO, "WS END mutexes unlocked\n");
	
#ifdef USE_PTHREAD
	pthread_exit( 0 );
#endif
	return;
}

#if USE_PTHREAD_PING == 1

/**
 * Websocket ping thread
 *
 * @param p pointer to WSThreadData
 */

void WSThreadPing( void *p )
{
	WSThreadData *data = (WSThreadData *)p;
#if USE_PTHREAD_PING == 1
	pthread_detach( pthread_self() );
#endif
	
	FRIEND_MUTEX_LOCK( &WSThreadMutex );
	WSThreadNum++;
	FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
	int n = 0;
	FCWSData *fcd = data->fcd;
	
	unsigned char *answer = FCalloc( 1024, sizeof(char) );
	int answersize = snprintf( (char *)answer, 1024, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%s\"}}", data->requestid );
	
	WebsocketServerClient *wscl = fcd->fcd_WSClient;
	if( wscl == NULL )
	{
		FRIEND_MUTEX_LOCK( &WSThreadMutex );
		WSThreadNum--;
		FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
		FFree( answer );
		FFree( data->requestid );
		FFree( data );
		return;
	}
	
	if( FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) ) == 0 )
	{
		wscl->wsc_InUseCounter++;
		FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
	
		struct lws *wsi = wscl->wsc_Wsi;
	
		UserSession *ses = wscl->wsc_UserSession;
		if( ses != NULL )
		{
			ses->us_LoggedTime = time( NULL );
	
			if( wscl->wsc_UserSession != NULL && fcd->fcd_WSClient != NULL )
			{
				WebsocketWriteInline( fcd->fcd_WSClient, answer, answersize, LWS_WRITE_TEXT );
			}
		}
	
		FFree( answer );
		FFree( data->requestid );
		FFree( data );
	
		FRIEND_MUTEX_LOCK( &WSThreadMutex );
		WSThreadNum--;
		FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
		FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
		wscl->wsc_InUseCounter--;
		FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
	}
	
#if USE_PTHREAD_PING == 1
	pthread_exit( 0 );
#endif
	return;
}
#endif // #if USE_PTHREAD_PING == 1


static inline int jsoneqin(const char *json, const jsmntok_t *tok, const char *s) {
	if (tok->type == JSMN_STRING && (int) strlen(s) == tok->end - tok->start &&
			strncmp(json + tok->start, s, tok->end - tok->start) == 0) {
		return 0;
	}
	return -1;
}


#define FLUSH_QUEUE() if( fcd->fcd_WSClient != NULL ) \
		{ \
			FQueue *q = &(fcd->fcd_WSClient->wsc_MsgQueue); \
			if( q->fq_First != NULL ) \
			{ \
				lws_callback_on_writable( fcd->fcd_WSClient->wsc_Wsi ); \
			} \
		}

/**
 * Main FriendCore websocket callback
 *
 * @param wsi pointer to main Websockets structure
 * @param reason type of received message (lws_callback_reasons type)
 * @param user user data (FC_Data)
 * @param tin message in table of chars
 * @param len size of provided message
 * @return 0 when success, otherwise error number
 */
int FC_Callback( struct lws *wsi, enum lws_callback_reasons reason, void *user, void *tin, ssize_t len)
{
	FCWSData *fcd =  (FCWSData *) user;// lws_context_user ( this );
	int returnError = 0;
	
	FRIEND_MUTEX_LOCK( &WSThreadMutex );
	WSThreadNum++;
	FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
	char *in = NULL;
	
	if( len > 0 )
	{
		DEBUG("Len: %lu\n", len );
		if( ( in = FMalloc( len+128 ) ) != NULL )	// 16 should be ok
		{
			memcpy( in, tin, len );
		}
	}

	//TK-1220 - sometimes there is junk at the end of the string.
	//The string is not guaranteed to be null terminated where it supposed to.
	char *c = in;
	if ( reason == LWS_CALLBACK_RECEIVE && len>0)
	{
		// No in!
		if( in == NULL )
		{
			DEBUG( "Seems we have a null message (length: %d)\n", (int)len );
			FRIEND_MUTEX_LOCK( &WSThreadMutex );
			WSThreadNum--;
			FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
			
			if( in != NULL )
			{
				FFree( in );
			}
			
			return 0;
		}
		c[len ] = '\0';
		
		// disabled for moment
		//Log( FLOG_INFO, "WS Call, reason: %d, length: %d, message: %s\n", reason, len, c );
	}

	//Log( FLOG_INFO, "WS Call data at %p - %d\n", in, len );
	
	switch( reason )
	{
		case LWS_CALLBACK_ESTABLISHED:
			//pss->fcd_Number = 0;
			INFO("[WS] Callback estabilished %p %p\n", fcd->fcd_SystemBase, fcd->fcd_WSClient );

		break;
		
		case LWS_CALLBACK_WS_PEER_INITIATED_CLOSE:
			//Log( FLOG_INFO, "[WS] LWS_CALLBACK_WS_PEER_INITIATED_CLOSE\n");
			
			INFO("[WS] Callback peer session closed\n");
		break;
		
		case LWS_CALLBACK_CLOSED:
			INFO("[WS] Callback session before closed\n");
			if( fcd->fcd_WSClient != NULL )
			{
				fcd->fcd_WSClient->wsc_ToBeRemoved = TRUE;
				usleep( 2000 );
				int val = 0;
				while( TRUE )
				{
					DEBUG("Check in use %d\n", fcd->fcd_WSClient->wsc_InUseCounter );
					if( fcd->fcd_WSClient->wsc_InUseCounter <= 0 )
					{
						break;
					}
					if( val++ > 5 ) break;
					sleep( 1 );
				}
				
				if( fcd->fcd_Buffer != NULL )
				{
					BufStringDelete( fcd->fcd_Buffer );
				}
				
				DeleteWebSocketConnection( SLIB, wsi, fcd );
				//FFree( fcd->fcd_WSClient );
				fcd->fcd_WSClient = NULL;
			}
			INFO("[WS] Callback session closed\n");

		break;
		
		case LWS_CALLBACK_WSI_DESTROY:
			INFO("[WS] Destroy WSI!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n");
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
				FBOOL login = FALSE;
				
				WebsocketServerClient *wscl = fcd->fcd_WSClient;
				/*
				if( fcd->fcd_WSClient == NULL )
				{
					FRIEND_MUTEX_LOCK( &WSThreadMutex );
					WSThreadNum--;
					FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
					return 0;
				}
				*/
				if( fcd->fcd_WSClient != NULL )
				{
					FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
					wscl->wsc_InUseCounter++;
					wscl->wsc_LastPingTime = time( NULL );
					DEBUG("\t\t\t\t\t->%d\n", wscl->wsc_InUseCounter );
					FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
				}
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
				//DEBUG1("[WS] Callback receive: %s\n", in );
				
				{
					int i, i1;
					int r;
					jsmn_parser p;
					//jsmntok_t t[128]; // We expect no more than 128 tokens
					jsmntok_t *t;
					
					t = FCalloc( 128, sizeof(jsmntok_t) );

					jsmn_init( &p );
					r = jsmn_parse( &p, in, len, t, 128 );
					if( r < 0 ) 
					{
						// "requestid":"fconn-req-42suyyjn-nqy2hd45-l5cuc9z8"
						//'{"type":"msg","data":{"type":"error","requestid":"fconn-req-hx3yz407-eoux1pdy-ba1nblco"\", }}'
						// we do want to find requestid in data
						
						if( fcd != NULL && fcd->fcd_Buffer != NULL && fcd->fcd_Buffer->bs_Size > 0 )
						{
							// if first part of request was found then its a sign that buffer must be erased
							if( strcmp( "{\"type\":\"msg\",\"data\":{\"type\":\"request\",\"requestid\"", in ) == 0 )
							{
								BufStringDelete( fcd->fcd_Buffer );
								fcd->fcd_Buffer = BufStringNew();
							}
						}
						BufStringAddSize( fcd->fcd_Buffer, in, len );
						
						jsmn_init(&p);
						r = jsmn_parse( &p, fcd->fcd_Buffer->bs_Buffer, fcd->fcd_Buffer->bs_Size+1, t, 128 );
						DEBUG("PARSE: msg '%s' len %d ret %d\n", fcd->fcd_Buffer->bs_Buffer, fcd->fcd_Buffer->bs_Size, r );
						if( r > 0 )
						{
							FFree( in );
							in = fcd->fcd_Buffer->bs_Buffer;
							len = fcd->fcd_Buffer->bs_Size;
							fcd->fcd_Buffer->bs_Buffer = NULL;
							
							BufStringDelete( fcd->fcd_Buffer );
							fcd->fcd_Buffer = BufStringNew();
						}
					}

					// Assume the top-level element is an object 
					if (r > 1 && t[0].type == JSMN_OBJECT) 
					{
						FBOOL eq = FALSE;
						
						if (t[1].type == JSMN_STRING )
						{
							//printf("TEST1\n");
							if( (int) strlen( "type" ) == t[1].end - t[1].start )
							{
								//printf("TEST2\n");
								if( strncmp(in + t[1].start, "type", t[1].end - t[1].start) == 0) 
								{
									//printf("TEST3\n");
									eq = TRUE;
								}
							}
						}
						
						if( eq == TRUE ) 
						//if( (&t[1] != NULL) && (jsoneqin( in, &t[1], "type") == 0) ) 
						{
							//
							// connection message - somebody wants to connect!
							//
							
							if( strncmp( "con",  in + t[ 2 ].start, t[ 2 ].end-t[ 2 ].start ) == 0 )
							{
								// We're connecting with a JSON object!
								if( t[4].type == JSMN_OBJECT )
								{
									// we are trying to find now session or authid
									// {"type":"con","data":{"type":"chunk","data":{"id":"chunks-634g582h-6ny4ingy-apl77hpt-9u","part":0,"total":5,"data":"eyJ

									if( r > 14 &&  strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
									{
										if( strncmp( "chunk",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
										{
											int id = 0;
											int part = 0;
											int total = 0;
											int data = 0;
											
											for( i = 9; i < r ; i++ )
											{
												if( strncmp( "id",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
												{
													id = i+1;
												}
												else if( strncmp( "part",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
												{
													part = i+1;
												}
												else if( strncmp( "total",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
												{
													total = i+1;
												}
												else if( strncmp( "data",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
												{
													data = i+1;
												}
											}
											
											DEBUG("Chunk received\n");
											
											if( part > 0 && total > 0 && data > 0 && fcd->fcd_WSClient != NULL )
											{
												//DEBUG("[WS] Got chunked message: %d\n\n\n%.*s\n\n\n", t[ data ].end-t[ data ].start, t[ data ].end-t[ data ].start, (char *)(in + t[ data ].start) );
												char *idc = StringDuplicateN( in + t[ id ].start, (int)(t[ id ].end-t[ id ].start) );
												part = StringNToInt( in + t[ part ].start, (int)(t[ part ].end-t[ part ].start) );
												total = StringNToInt( in + t[ total ].start, (int)(t[ total ].end-t[ total ].start) );
												WebsocketServerClient *cl = (WebsocketServerClient *)fcd->fcd_WSClient;
												if( cl->wsc_UserSession != NULL )
												{
													UserSession *ses = (UserSession *)cl->wsc_UserSession;
													WebsocketReq *wsreq = WebsocketReqManagerPutChunk( ses->us_WSReqManager, idc, part, total, (char *)(in + t[ data ].start), (int)(t[ data ].end-t[ data ].start) );
													if( wsreq != NULL )
													{
														//DEBUG("\n\n\n\nFINAL MESSAGE %s %lu\n\n\n", wsreq->wr_Message, wsreq->wr_MessageSize );
														if( wsreq->wr_Message != NULL && wsreq->wr_MessageSize > 0 && wsreq->wr_IsBroken == 0 )
														{
															FC_Callback( wsi, reason, user, wsreq->wr_Message, wsreq->wr_MessageSize );
														}
														else
														{
															if( wsreq->wr_IsBroken )
															{
																Log( FLOG_ERROR, "Message is broken: '%s'\n", wsreq->wr_Message );
															}
															DEBUG( "No message!\n" );
														}
														
														WebsocketReqDelete( wsreq );
													}
												}
												if( idc != NULL )
												{
													FFree( idc );
												}
												
												DEBUG("Found proper chunk message\n");
											}
											else
											{
												DEBUG("Chunk Message parameters not found!\n");
											}
										}
									}
									else	// connection message
									{
										for( i = 4; i < r ; i++ )
										{
											i1 = i + 1;
										
											// Incoming connection is authenticating with sessionid (the Workspace probably)
											if( strncmp( "sessionId",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
											{
												char session[ DEFAULT_SESSION_ID_SIZE ];
												memset( session, 0, DEFAULT_SESSION_ID_SIZE );
										
												strncpy( session, in + t[ i1 ].start, t[i1 ].end-t[ i1 ].start );
											
												// We could connect? If so, then just send back a pong..
												if( AddWebSocketConnection( SLIB, wsi, session, NULL, fcd ) >= 0 )
												{
													fcd->fcd_Buffer = BufStringNew();
													
													INFO("[WS] Websocket communication set with user (sessionid) %s\n", session );
													
													login = TRUE;
												
													char answer[ 1024 ];
													snprintf( answer, 1024, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
												
													unsigned char *buf;
													int len = strlen( answer );
													buf = (unsigned char *)FCalloc( len + 128, sizeof( char ) );
													if( buf != NULL )
													{
														memcpy( buf, answer,  len );

														if( fcd->fcd_WSClient != NULL )
														{
															WebsocketWriteInline( fcd->fcd_WSClient, buf, len, LWS_WRITE_TEXT );
														}
														FFree( buf );
													}
												}
											}
											// Incoming connection is authenticating with authid (from an application or an FS)
											else if( strncmp( "authid",  in + t[ i ].start, t[ i ].end-t[ i ].start ) == 0 )
											{
												char authid[ DEFAULT_SESSION_ID_SIZE ];
												memset( authid, 0, DEFAULT_SESSION_ID_SIZE );
										
												//strncpy( authid, in + t[ i1 ].start, t[ i1 ].end-t[ i1 ].start );
												{
													// We could connect? If so, then just send back a pong..
													if( AddWebSocketConnection( SLIB, wsi, NULL, authid, fcd ) >= 0 )
													{
														//INFO("[WS] Websocket communication set with user (authid) %s\n", authid );
												
														char answer[ 2048 ];
														snprintf( answer, 2048, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
												
														unsigned char *buf;
														int len = strlen( answer );
														buf = (unsigned char *)FCalloc( len + 128, sizeof( char ) );
														if( buf != NULL )
														{
															//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
															memcpy( buf, answer,  len );

															if( fcd->fcd_WSClient != NULL )
															{
																WebsocketWriteInline( fcd->fcd_WSClient, buf, len, LWS_WRITE_TEXT );
															}
															FFree( buf );
														}
													}
												}
											}
										}	// for through parameters
									}	// next type of message
									
									if( strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
									{
										// simple PING
										if( strncmp( "ping",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 && r > 8 )
										{
#if (ENABLE_WEBSOCKETS_THREADS == 1) || ( USE_PTHREAD_PING == 1 )
											WSThreadData *wstdata = FCalloc( 1, sizeof( WSThreadData ) );
											// threads
											pthread_t thread;
											memset( &thread, 0, sizeof( pthread_t ) );

											//wstdata->wsi = wsi;
											wstdata->fcd = fcd;
											wstdata->requestid = StringDuplicateN( (char *)(in + t[ 8 ].start), t[ 8 ].end-t[ 8 ].start );
											if( wstdata && wstdata->fcd && fcd->fcd_WSClient && fcd->fcd_WSClient->wsc_UserSession )
											{
												UserSession *lus = fcd->fcd_WSClient->wsc_UserSession;
												//Log( FLOG_INFO, "WS Call ping: user session id: '%lu'\n", lus->us_ID );
											}
#if USE_PTHREAD_PING == 1
											// Multithread mode
											if( pthread_create( &thread, NULL,  (void *(*)(void *))WSThreadPing, ( void *)wstdata ) != 0 )
											{
											}
#else // USE_PTHREAD_PING = 1
											//SystemBase *lsb = (SystemBase *)fcd->fcd_SystemBase;
											WorkerManagerRun( SLIB->sl_WorkerManager,  WSThreadPing, wstdata, NULL, "Websocket: PING" );
#endif
											
#else // ENABLE_WEBSOCKETS_THREADS OR USE_PTHREAD_PING
											char answer[ 2048 ];
											snprintf( answer, 2048, "{\"type\":\"con\", \"data\" : { \"type\": \"pong\", \"data\":\"%.*s\"}}",t[ 8 ].end-t[ 8 ].start, (char *)(in + t[ 8 ].start) );
											
											UserSession *ses = (UserSession *)fcd->fcd_ActiveSession;
											if( ses != NULL )
											{
												ses->us_LoggedTime = time( NULL );
												
												int len = strlen( answer );
												WebsocketWriteInline( fcd->fcd_WSClient, answer, len, LWS_WRITE_TEXT );
											
												SQLLibrary *sqllib  = SLIB->LibrarySQLGet( SLIB );
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
														SLIB->LibrarySQLDrop( SLIB, sqllib );
													
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
								// type object
								if( t[4].type == JSMN_OBJECT)
								{
									if( strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
									{
										if( strncmp( "request",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
										{
//#ifdef ENABLE_WEBSOCKETS_THREADS
											WSThreadData *wstdata = FCalloc( 1, sizeof(WSThreadData) );
//#endif
											
											if( wstdata != NULL )
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

													UserSession *s = NULL;
													
													if( fcd->fcd_WSClient != NULL && fcd->fcd_WSClient->wsc_UserSession )
													{
														s = fcd->fcd_WSClient->wsc_UserSession;
													}
													
													if( s != NULL )
													{
														if( HashmapPut( http->parsedPostContent, StringDuplicate( "sessionid" ), StringDuplicate( s->us_SessionID ) ) == MAP_OK )
														{
															//DEBUG1("[WS]:New values passed to POST %s\n", s->us_SessionID );
														}
														
														if( s->us_UserActionInfo[ 0 ] == 0 )
														{
															int fd = lws_get_socket_fd( wsi );
															char add[ 256 ];
															char rip[ 256 ];
															
															lws_get_peer_addresses( wsi, fd, add, sizeof(add), rip, sizeof(rip) );
															//INFO("[WS]: WEBSOCKET call %s - %s\n", add, rip );
															
															snprintf( s->us_UserActionInfo, sizeof( s->us_UserActionInfo ), "%s / %s", add, rip );
														}
													}
													
													int i, i1;
													
													//thread
													char **pathParts = wstdata->pathParts;

													int error = 0;
													BufString *queryrawbs = BufStringNewSize( 2048 );
													
													for( i = 7 ; i < r ; i++ )
													{
														i1 = i + 1;
														
														if( jsoneqin( in, &t[i], "requestid") == 0) 
														{
															// threads
															wstdata->requestid = StringDuplicateN(  (char *)(in + t[i1].start), (int)(t[i1].end-t[i1].start) );
															requestid = wstdata->requestid;
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
															{
																//DEBUG1("[WS] New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, (char *)(in + t[i].start), t[i1].end-t[i1].start, (char *)(in + t[i1].start) );
															}
															i++;
														}
														// We got path!
														else if (jsoneqin( in, &t[i], "path") == 0) 
														{
															// this is first path, URI
															
															if( path == NULL )
															{
																// threads
																wstdata->path = StringDuplicateN(  in + t[i1].start,t[i1].end-t[i1].start );
																path = wstdata->path;//in + t[i1].start;
																paths = t[i1].end-t[i1].start;
																
																if( http->uri != NULL )
																{
																	http->uri->queryRaw = StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start );
																}
															
																path[ paths ] = 0;
																int j = 1;
															
																// Don't overwrite first path if it is set!														
																pathParts[ 0 ] = path;
															
																int selpart = 1;
															
																for( j = 1 ; j < paths ; j++ )
																{
																	if( path[ j ] == '/' )
																	{
																		pathParts[ selpart++ ] = &path[ j + 1 ];
																		path[ j ] = 0;
																	}
																}
																i++;
															}
															
															else
															{
																// this is path parameter
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																{

																}
																i++;
															}
														}
														else if (jsoneqin( in, &t[i], "authid") == 0) 
														{
															authid = in + t[i1].start;
															authids = t[i1].end-t[i1].start;
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
															{
																//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
															}
															
															if( HashmapPut( http->parsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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

															if(( i1) < r && t[ i ].type != JSMN_ARRAY )
															{
																if( HashmapPut( http->parsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																{
																	//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start), (int)(t[i1].end-t[i1].start), (char *)(in + t[i1].start) );
																}
																
																if( t[ i1 ].type == JSMN_ARRAY || t[ i1 ].type == JSMN_OBJECT )
																{
																	int z=0;

																	if( t[ i1 ].type == JSMN_ARRAY )
																	{
																		i += t[ i1 ].size;
																	}
																		
																	i++;
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
																DEBUG("[WS] Cannot add value: %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start) );
																i++;
															}
														}
													} // end of going through json
													

#if (ENABLE_WEBSOCKETS_THREADS == 1) || ( USE_PTHREAD == 1 )
													// threads
													pthread_t thread;
													memset( &thread, 0, sizeof( pthread_t ) );
													wstdata->http = http;
													//wstdata->wsi = wsi;
													wstdata->fcd = fcd;
													wstdata->queryrawbs = queryrawbs;
													// Multithread mode
#if USE_PTHREAD == 1
													if( pthread_create( &thread, NULL, (void *(*)(void *))WSThread, ( void *)wstdata ) != 0 )
													{
													}
#endif
#if USE_WORKERS == 1
													SystemBase *lsb = (SystemBase *)fcd->fcd_SystemBase;
													
													if( fcd->fcd_WSClient != NULL && fcd->fcd_WSClient->wsc_ToBeRemoved == FALSE )
													{
														if( http->uri != NULL )
														{
															WorkerManagerRun( SLIB->sl_WorkerManager,  WSThread, wstdata, http, http->uri->queryRaw );
														}
														else
														{
															WorkerManagerRun( SLIB->sl_WorkerManager,  WSThread, wstdata, http, "ProtocolWebsocket.c: line 1220" );
														}
													}
#endif


#else
													wstdata->http = http;
													wstdata->wsi = wsi;
													wstdata->fcd = fcd;
													wstdata->queryrawbs = queryrawbs;
													WSThread( wstdata );
#endif
												}
											}
										}
										
										//
										// events, no need to respoe
										//
										
										else if( strncmp( "event",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
										{
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
													
													UserSession *s = fcd->fcd_WSClient->wsc_UserSession;
													if( s != NULL )
													{
														DEBUG("[WS] Session ptr %p  session %p\n", s, s->us_SessionID );
														if( HashmapPut( http->parsedPostContent, StringDuplicate( "sessionid" ), StringDuplicate( s->us_SessionID ) ) == MAP_OK )
														{
															DEBUG1("[WS] New values passed to POST %s\n", s->us_SessionID );
														}
													
														int i, i1;
														char *pathParts[ 1024 ];		// could be allocated in future
														memset( pathParts, 0, 1024*sizeof(char *) );
													
														BufString *queryrawbs = BufStringNewSize( 2048 );
													
														for( i = 7 ; i < r ; i++ )
														{
															i1 = i + 1;
															if (jsoneqin( in, &t[i], "requestid") == 0) 
															{
																requestid = in + t[i1].start;
																requestis =  t[i1].end-t[i1].start;
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																{
																	//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
																}
																i++;
															}
															else if (jsoneqin( in, &t[i], "path") == 0) 
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

																	path[ paths ] = 0;
																	int j = 1;
																
																	pathParts[ 0 ] = path;
																
																	int selpart = 1;
																
																	for( j = 1 ; j < paths ; j++ )
																	{
																		if( path[ j ] == '/' )
																		{
																			pathParts[ selpart++ ] = &path[ j + 1 ];
																			path[ j ] = 0;
																		}
																	}
																	i++;
																}
																else
																{
																	// this is path parameter
																	if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																	{
																		//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, (char *)(in + t[i].start), t[i1].end-t[i1].start, (char *)(in + t[i1].start) );
																	}
																	i++;
																}
															}
															else if (jsoneqin( in, &t[i], "authId") == 0) 
															{
																authid = in + t[i1].start;
																authids = t[i1].end-t[i1].start;
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																{
																	//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
																}
															
																if( HashmapPut( http->parsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																{

																}
																i++;
															}
															else
															{
																{
																	if(( i1) < r && t[ i ].type != JSMN_ARRAY )
																	{
																		if( HashmapPut( http->parsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
																		{
																			DEBUG1("[WS] New values passed to POST %.*s %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start), (int)(t[i1].end-t[i1].start), (char *)(in + t[ i1 ].start) );
																		}
																
																		if( t[ i1 ].type == JSMN_ARRAY || t[ i1 ].type == JSMN_OBJECT )
																		{
																			int z=0;

																			if( t[ i1 ].type == JSMN_ARRAY )
																			{
																				DEBUG("[WS] Next  entry is array %d\n", t[ i1 ].size );
																				i += t[ i1 ].size;
																			}
																		
																			i++;
																			//
																			DEBUG1("[WS] current %d skip %d next %d\n", t[ i ].size-1, t[ i1 ].size-1, t[ i1+1 ].size );
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
																		DEBUG("[WS] Cannot add value: %.*s\n", (int)(t[i].end-t[i].start), (char *)(in + t[i].start) );
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
															
															int respcode = 0;
															
															Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, fcd->fcd_WSClient->wsc_UserSession, &respcode );
														
															gettimeofday(&stop, NULL);
															double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
														
															DEBUG("[WS] \t\tWS ->SysWebRequest took %f seconds\n", secs );
														
															if( response != NULL )
															{
																char *d = response->content;
																if( d[0] == 'f' && d[1] == 'a' && d[2] == 'i' && d[3] == 'l' )
																{
																	char *code = strstr( d, "\"code\":");

																	if( code != NULL && 0 == strncmp( code, "\"code\":\"11\"", 11 ) )
																	{
																		//returnError = -1;
																	}
																}
																/*
																if( response->content != NULL && strcmp( response->content, "fail<!--separate-->{\"response\":\"user session not found\"}" )  == 0 )
																{
																	//returnError = -1;
																}
																*/
																
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
						char *reqid = NULL;
						reqid = strstr( in, "\"requestid\"" );
						if( reqid != NULL )
						{
							reqid += 13;
							// we want to remove last "
							char *rem = strstr( reqid, "\"" );
							if( rem != NULL )
							{
								*rem = 0;
							}
						}
						
						FERROR("Failed to parse JSON: %d\n", r);
						unsigned char buf[ 256 ];
						char locmsg[ 256 ];
						int locmsgsize = snprintf( locmsg, sizeof(locmsg), "{\"type\":\"msg\",\"data\":{\"type\":\"error\",\"data\":{\"requestid\":\"%s\"}}}", reqid );
						
						strcpy( (char *)(buf), locmsg );
						
						if( fcd->fcd_WSClient != NULL && fcd->fcd_WSClient->wsc_UserSession != NULL ) //ORDER IS IMPORTANT
						{
							WebsocketWriteInline( fcd->fcd_WSClient, buf, locmsgsize, LWS_WRITE_TEXT );
						}
						
						FRIEND_MUTEX_LOCK( &WSThreadMutex );
						WSThreadNum--;
						FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
						FFree( t );
						
						WebsocketServerClient *wscl = fcd->fcd_WSClient;
						FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
						wscl->wsc_InUseCounter--;
						DEBUG("\t\t\t\t\t->%d\n", wscl->wsc_InUseCounter );
						FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
						
						FLUSH_QUEUE();
						
						if( in != NULL )
						{
							FFree( in );
						}
						
						FERROR("Object expected\n");
						
						return 0;
					}
					
					FFree( t );
				} 
				//WebsocketServerClient *wscl = fcd->fcd_WSClient;
				if( fcd->fcd_WSClient != NULL && login == FALSE )
				{
					FRIEND_MUTEX_LOCK( &(wscl->wsc_Mutex) );
					wscl->wsc_InUseCounter--;
					DEBUG("\t\t\t\t\t->%d\n", wscl->wsc_InUseCounter );
					FRIEND_MUTEX_UNLOCK( &(wscl->wsc_Mutex) );
				}
			}
			
			if( len > 0 )
			{
				char *c = (char *)in;
				c[ 0 ] = 0;
			}
			
		break;
		
		case LWS_CALLBACK_SERVER_WRITEABLE:
			DEBUG1("[WS] LWS_CALLBACK_SERVER_WRITEABLE\n");
			
			if( fcd->fcd_WSClient == NULL )
			{
				if( in != NULL )
				{
					FFree( in );
				}
				return 0;
			}
				
			FRIEND_MUTEX_LOCK( &(fcd->fcd_WSClient->wsc_Mutex) );
			//lws_rx_flow_control( fcd->fcd_WSClient->wc_Wsi, 0 );
			
			FQEntry *e = NULL;
			FQueue *q = &(fcd->fcd_WSClient->wsc_MsgQueue);
			if( ( e = FQPop( q ) ) != NULL )
			{
				FRIEND_MUTEX_UNLOCK( &(fcd->fcd_WSClient->wsc_Mutex) );
				unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
				t[ e->fq_Size+1 ] = 0;

				lws_write( fcd->fcd_WSClient->wsc_Wsi, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size, LWS_WRITE_TEXT );

				int errret = lws_send_pipe_choked( fcd->fcd_WSClient->wsc_Wsi );
				
				//DEBUG1("Sending message, size: %d PRE %d msg %s\n", e->fq_Size, LWS_SEND_BUFFER_PRE_PADDING, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
				if( e != NULL )
				{
					DEBUG("Release: %p\n", e->fq_Data );
					FFree( e->fq_Data );
					FFree( e );
				}
			}
			else
			{
				FRIEND_MUTEX_UNLOCK( &(fcd->fcd_WSClient->wsc_Mutex) );
			}
			
			break;
		
		case LWS_CALLBACK_OPENSSL_PERFORM_CLIENT_CERT_VERIFICATION:
			DEBUG1("[WS] LWS_CALLBACK_OPENSSL_PERFORM_CLIENT_CERT_VERIFICATION\n");
			break;
		
		case LWS_CALLBACK_FILTER_NETWORK_CONNECTION:
			DEBUG1("[WS] LWS_CALLBACK_FILTER_NETWORK_CONNECTION\n");
			break;
		
		case LWS_CALLBACK_CLIENT_FILTER_PRE_ESTABLISH:
			DEBUG1("[WS] LWS_CALLBACK_CLIENT_FILTER_PRE_ESTABLISH\n");
			break;
		
		case LWS_CALLBACK_OPENSSL_LOAD_EXTRA_CLIENT_VERIFY_CERTS:
			DEBUG1("[WS] LWS_CALLBACK_OPENSSL_LOAD_EXTRA_CLIENT_VERIFY_CERTS\n");
		break;

	//
	 // this just demonstrates how to use the protocol filter. If you won't
	 // study and reject connections based on header content, you don't need
	 // to handle this callback
	 //

	case LWS_CALLBACK_FILTER_PROTOCOL_CONNECTION:
		//dump_handshake_info((struct lws_tokens *)(long)user);
		// you could return non-zero here and kill the connection 
		Log( FLOG_INFO, "[WS] Filter protocol\n");
		break;
		
	case LWS_CALLBACK_CLIENT_APPEND_HANDSHAKE_HEADER:
		Log( FLOG_INFO, "[WS] LWS_CALLBACK_CLIENT_APPEND_HANDSHAKE_HEADER\n");
		break;

	default:
		// disabled for test
		//Log( FLOG_INFO, "[WS] Default Call, size: %d - reason: %d\n", (int)len, reason );
		if( len > 0 && len < 500 && in != NULL )
		{
			//DEBUG1("[WS]: Default Call, message size %d : %.*s \n", len, len, in );
		}
		break;
	}

	if( user != NULL )//&& fcd != NULL && reason != LWS_CALLBACK_CLOSED )
	{
		FLUSH_QUEUE();
	}
	
	FRIEND_MUTEX_LOCK( &WSThreadMutex );
	WSThreadNum--;
	FRIEND_MUTEX_UNLOCK( &WSThreadMutex );
	
	if( in != NULL )
	{
		FFree( in );
	}

	return returnError;
}
