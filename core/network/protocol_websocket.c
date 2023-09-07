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

// disable / enable debug
//#undef DEBUG
//#define DEBUG( ...)
//#undef DEBUG1
//#define DEBUG1( ...)

extern SystemBase *SLIB;

//#define USE_WORKERS 1		// use workers for WS calls
//#define USE_PTHREAD 1		//
//#define USE_WORKERS_PING
#define USE_PTHREAD_PING 1	// use pthread for PING-PONG calls
#define INPUT_QUEUE			// use queue to collect all incoming messages. All this messages will be parsed and executed in different thread

// enabled for development/IDE
//#define ENABLE_WEBSOCKETS_THREADS 1

typedef struct WSThreadData
{
	WSCData						*wstd_WSD;
	UserSession					*wstd_UserSession;		// hold session in case when libwebsockets will release WSCData
	Http						*wstd_Http;
	char						*wstd_PathParts[ 1024 ];	// to avoid memory allocation
	BufString					*wstd_Queryrawbs;
	char 						*wstd_Requestid;
	char						*wstd_Path;
	char						*wstd_Request;
	int							wstd_RequestLen;
	char						*wstd_Msg;
	size_t						wstd_Len;
	pthread_t					wstd_Thread;
}WSThreadData;

static int MAX_SIZE_WS_MESSAGE = WS_PROTOCOL_BUFFER_SIZE-2048;

/**
 * Release WSThread data
 **/

void releaseWSData( WSThreadData *data )
{
	if( data == NULL )
	{
		return;
	}
	
	DEBUG("Release WS data\n");
	
	Http *http = data->wstd_Http;
	if( http != NULL )
	{
		UriFree( http->http_Uri );
		http->http_Uri = NULL;
		
		if( http->http_RawRequestPath != NULL )
		{
			FFree( http->http_RawRequestPath );
			http->http_RawRequestPath = NULL;
		}
		HttpFree( http );
	}
	
	if( data->wstd_Msg != NULL )
	{
		FFree( data->wstd_Msg );
		data->wstd_Msg = NULL;
	}
	
	if( data->wstd_Requestid != NULL )
	{
		FFree( data->wstd_Requestid );
	}
	if( data->wstd_Path != NULL )
	{
		FFree( data->wstd_Path );
	}
	
	BufStringDelete( data->wstd_Queryrawbs );
	
	FFree( data );
}

/**
 * Websocket ping thread
 *
 * @param p pointer to WSThreadData
 */

void WSThreadPing( WSThreadData *data )
{
	UserSession *us = data->wstd_WSD->wsc_UserSession;
	if( us != NULL )
	{
		unsigned char *answer = NULL;
	
		if( FRIEND_MUTEX_LOCK( &(data->wstd_WSD->wsc_Mutex) ) == 0 )
		{
			if( us->us_WSD == NULL || data->wstd_WSD->wsc_UserSession == NULL )
			{
				if( data != NULL )
				{
					if( data->wstd_Requestid != NULL )
					{
						FFree( data->wstd_Requestid );
					}
					FRIEND_MUTEX_UNLOCK( &(data->wstd_WSD->wsc_Mutex) );
					FFree( data );
				}
				
				// Decrease counter
				if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
				{
					us->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
				}
				return;
			}
			FRIEND_MUTEX_UNLOCK( &(data->wstd_WSD->wsc_Mutex) );
		}
	
		if( ( answer = FMalloc( 1024 ) ) != NULL )
		{
			FBOOL userSessionLocked = FALSE;
			if( FRIEND_MUTEX_LOCK( &(data->wstd_WSD->wsc_Mutex) ) == 0 )
			{
				data->wstd_WSD->wsc_UpdateLoggedTimeCounter++;
				if( data->wstd_WSD->wsc_UpdateLoggedTimeCounter > SLIB->l_UpdateLoggedTimeOnUserMax )
				{
					char tmpQuery[ 64 ];
					us->us_LastActionTime = time(NULL);
					snprintf( tmpQuery, sizeof(tmpQuery), "UPDATE FUser Set LastActionTime=%ld where ID=%ld", us->us_LastActionTime, us->us_UserID );
				
					SQLLibrary *sqlLib = SLIB->LibrarySQLGet( SLIB );
					if( sqlLib != NULL )
					{
						sqlLib->QueryWithoutResults(  sqlLib, tmpQuery );
	
						SLIB->LibrarySQLDrop( SLIB, sqlLib );
					}
				
					data->wstd_WSD->wsc_UpdateLoggedTimeCounter = 0;
				}
				
				if( data->wstd_WSD->wsc_UserSession != NULL )
				{
					us = data->wstd_WSD->wsc_UserSession;
					if( us != NULL )
					{
						if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
						{
							us->us_InUseCounter++;
							userSessionLocked = TRUE;
							FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
						}
					}
				}
				FRIEND_MUTEX_UNLOCK( &(data->wstd_WSD->wsc_Mutex) );
			}
			
			if( userSessionLocked == TRUE )
			{
				int answersize = snprintf( (char *)answer, 1024, "{\"type\":\"con\",\"data\":{\"type\":\"pong\",\"data\":\"%s\"}}", data->wstd_Requestid );
				UserSessionWebsocketWrite( us, answer, answersize, LWS_WRITE_TEXT );
				
				if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
				{
					us->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
				}
			}
			FFree( answer );
		}
	}
}

static inline int jsoneqin(const char *json, const jsmntok_t *tok, const char *s) {
	if (tok->type == JSMN_STRING && (int) strlen(s) == tok->end - tok->start &&
			strncmp(json + tok->start, s, tok->end - tok->start) == 0) {
		return 0;
	}
	return -1;
}


#define FLUSH_QUEUE() if( us != NULL ) \
		{ \
			FQueue *q = &(us->us_Websockets.us_MsgQueue); \
			if( q->fq_First != NULL ) \
			{ \
				lws_callback_on_writable( us->us_Websockets.us_Wsi ); \
			} \
		}

void ParseAndCallThread( void *d );

void *ParseAndCall( WSThreadData *wstd );

/**
 * Main FriendCore websocket callback
 *
 * @param wsi pointer to main Websockets structure
 * @param reason type of received message (lws_callback_reasons type)
 * @param userData user data (FC_Data)
 * @param tin message in table of chars
 * @param len size of provided message
 * @return 0 when success, otherwise error number
 */
int FC_Callback( struct lws *wsi, enum lws_callback_reasons reason, void *userData, void *tin, ssize_t len)
{
    signal(SIGPIPE, SIG_IGN);
    
	WSCData *wsd =  (WSCData *)userData;// lws_context_user ( this );
	
	if( reason == LWS_CALLBACK_ESTABLISHED )
	{
		pthread_mutex_init( &(wsd->wsc_Mutex), NULL );
		wsd->wsc_Status = WSC_STATUS_ACTIVE;
		#ifdef WS_COMPRESSION
		lws_set_extension_option( wsi, "permessage-deflate", "rx_buf_size", "16");
		lws_set_extension_option( wsi, "permessage-deflate", "tx_buf_size", "16");
		#endif
		return 0;
	}
	
	if( !wsd || wsd->wsc_Status == WSC_STATUS_TO_BE_REMOVED )
	{
		//DEBUG( "WSD IS BEING SHUT DOWN %p\n", wsd );
		return 0;
	}
	
	int returnError = 0;
	
	if( FRIEND_MUTEX_LOCK( &( wsd->wsc_Mutex ) ) == 0 )
	{
		DEBUG("FC_Callback: reason: %d wsiptr %p fcwdptr %p\n", reason, wsi, userData );

		char *in = NULL;

		DEBUG("[WS] before switch\n");
		
		switch( reason )
		{
			case LWS_CALLBACK_WS_PEER_INITIATED_CLOSE:
				INFO("[WS] Callback peer session closed wsiptr %p\n", wsi);
			break;
			
			/*case LWS_CALLBACK_CLIENT_CLOSED:
				DEBUG("[WS] Callback client closed!\n");
				if( FRIEND_MUTEX_LOCK( &( wsd->wsc_Mutex ) ) == 0 )
				{
					wsd->wsc_Status = WSC_STATUS_TO_BE_REMOVED;
					FRIEND_MUTEX_UNLOCK( &( wsd->wsc_Mutex ) );
				}
				break;*/
			case LWS_CALLBACK_CLOSED:
				{
					UserSession *us = (UserSession *)wsd->wsc_UserSession;
					
					if( us != NULL )
					{
						wsd->wsc_Status = WSC_STATUS_TO_BE_REMOVED;
						
						FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
						while( TRUE )
						{
							if( wsd->wsc_InUseCounter <= 0 )
							{
								DEBUG("[WS] Callback closed!\n");
								break;
							}
							DEBUG("[WS] Closing WS, number: %d\n", wsd->wsc_InUseCounter );
						
							if( wsd->wsc_UserSession == NULL )
							{
								DEBUG("[WS] wsc_UserSession is equal to NULL\n");
								break;
							}
							
							DEBUG( "[WS] Waiting: %d\n", wsd->wsc_InUseCounter );
							Log( FLOG_DEBUG, "[WS] Waiting to close (inuse: %s)\n", wsd->wsc_InUseCounter );
						}
						
						DEBUG( "[WS] Detaching websocket from session...\n" );
						DetachWebsocketFromSession( wsd, wsi );
						DEBUG( "[WS]  - Detached websocket from session\n" );
						
						FRIEND_MUTEX_LOCK( &( wsd->wsc_Mutex ) );
						
						if( wsd->wsc_Buffer != NULL )
						{
							BufStringDelete( wsd->wsc_Buffer );
							wsd->wsc_Buffer = NULL;
						}
						Log( FLOG_DEBUG, "[WS] Callback session closed\n");
					}
								
				}
			break;
			
			case LWS_CALLBACK_WSI_DESTROY:
				INFO("[WS] Destroy WSI!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n");
				break;

			case LWS_CALLBACK_RECEIVE:
				{
					wsd->wsc_Wsi = wsi;

					UserSession *us = (UserSession *)wsd->wsc_UserSession;
					
					if( wsd->wsc_Buffer == NULL )
					{
						wsd->wsc_Buffer = BufStringNew();
					}
					
					const size_t remaining = lws_remaining_packet_payload( wsi );
					// if nothing left and this is last message
					if( !remaining && lws_is_final_fragment( wsi ) )
					{
						BufStringAddSize( wsd->wsc_Buffer, tin, len );
						
						if( wsd->wsc_Buffer->bs_Size > 0 )
						{
							in = wsd->wsc_Buffer->bs_Buffer;
							len = wsd->wsc_Buffer->bs_Size;
							wsd->wsc_Buffer->bs_Buffer = NULL;
								
							BufStringDelete( wsd->wsc_Buffer );
							wsd->wsc_Buffer = BufStringNew();
						}

						//DEBUG1("[WS] Callback receive (no remaining): %s\n", in );
					}
					else // only fragment was received
					{
						//DEBUG1("[WS] Only received: %p, %s, %p, %d\n", wsd->wsc_Buffer, (char *)tin, tin, len );
						BufStringAddSize( wsd->wsc_Buffer, tin, len );
						
						FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
						return 0;
					}
					
					// if we want to move full calls to WS threads
					
	#ifdef INPUT_QUEUE
					WSThreadData *wstd = FCalloc( 1, sizeof( WSThreadData ) );
					if( wstd != NULL )
					{
						DEBUG("[WS] Pass wsd to thread: %p\n", wsd );
						wstd->wstd_WSD = wsd;
						wstd->wstd_Msg = in;
						wstd->wstd_Len = len;
						wstd->wstd_UserSession = wsd->wsc_UserSession;	// lets be sure that wsd is not released

						//
						// Using Websocket thread to read/write messages, rest should happen in userspace
						//
						
						if( us != NULL )
						{
							if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
							{
								us->us_LastPingTime = time( NULL );
								us->us_InUseCounter++; // Increase use (parseandcall)
								DEBUG( "[WS] Increase for parse and call: %d\n", us->us_InUseCounter );
								FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
							}
						}
						
						pthread_t t;

						if( pthread_create( &t, NULL, (void *(*)(void *))ParseAndCall, ( void *)wstd ) != 0 )
						{
							FERROR("\n\n\nCreate thread failed!: %p\n\n", wsi );
							// Failed!
							
							releaseWSData( wstd );
							
							if( wsd->wsc_UserSession != NULL )
							{
								us = (UserSession *)wsd->wsc_UserSession;
								if( us != NULL )
								{
									if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
									{
										us->us_InUseCounter--;
										FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
									}
								}
							}
						}
					}
	#else
					ParseAndCall( wsd, tin, len );
	#endif
					
					DEBUG("[WS] Webcall finished!\n");
					
					if( wsd->wsc_UserSession != NULL && us != NULL && us->us_MsgQueue.fq_First != NULL )
					{
						lws_callback_on_writable( wsi );
					}
				}
				
	#ifndef INPUT_QUEUE
				/*
				if( len > 0 )
				{
					char *c = (char *)tin;
					c[ 0 ] = 0;
				}
				*/
	#endif
			break;
			
			case LWS_CALLBACK_SERVER_WRITEABLE:
				DEBUG1("[WS] LWS_CALLBACK_SERVER_WRITEABLE\n");
				
				if( wsd->wsc_Status == 0 || wsd->wsc_UserSession == NULL || wsd->wsc_Wsi == NULL || wsd->wsc_Status == WSC_STATUS_TO_BE_REMOVED )
				{
					DEBUG("[WS] Cannot write message, WS Client is equal to NULL, fcwd %p wsiptr %p\n", wsd, wsi );
					
					FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
					return 0;
				}

				FQEntry *e = NULL;

				UserSession *us = (UserSession *)wsd->wsc_UserSession;
				if( us != NULL )
				{
					//
					// User Session messages are stored in UserSession structure. We have to lock session before we want to get message from queue
					//
					
					if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
					{
						us->us_InUseCounter++;
						
						FQueue *q = &(us->us_MsgQueue);
						
						if( q->fq_First != NULL )
						{
							e = FQPop( q );
							
							us->us_InUseCounter--;
							FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
							unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
							
							// Previously was t[ e->fq_Size + 1 ] = 0, but seemed to corrupt the last character
							t[ e->fq_Size ] = 0;

							lws_write( wsi, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size, LWS_WRITE_TEXT );
					
	#ifdef __PERF_MEAS
							Log( FLOG_INFO, "PERFCHECK: Websocket message sent time: %f\n", ((GetCurrentTimestampD()-e->fq_stime)) );
	#endif

							int errret = lws_send_pipe_choked( wsi );
					
						    // Hogne removed printing the entire message
							//DEBUG1("Sending message, size: %d PRE %d msg %s\n", e->fq_Size, LWS_SEND_BUFFER_PRE_PADDING, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING );
							DEBUG1("Sending message, size: %d PRE %d.\n", e->fq_Size, LWS_SEND_BUFFER_PRE_PADDING );
							if( e != NULL )
							{
								DEBUG("[WS] Release: %p\n", e->fq_Data );
								FFree( e->fq_Data );
								FFree( e );
							}
						
							if( wsd->wsc_UserSession == NULL )
							{
								break;
							}
						}
						else
						{
							us->us_InUseCounter--;
							FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
						}
						
						if( q->fq_First != NULL )
						{
							lws_callback_on_writable( wsi );
						}
					}
				}

				DEBUG("[WS] Writable END, wsi ptr %p fcwsptr %p\n", wsi, wsd );

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
			//Log( FLOG_INFO, "[WS] Filter protocol\n");
			break;
		
		case LWS_CALLBACK_PROTOCOL_DESTROY:
			// protocol will be destroyed
			if( wsd != NULL )
			{
				wsd->wsc_Status = WSC_STATUS_DELETED;
				
				if( wsd->wsc_Buffer != NULL )
				{
					BufStringDelete( wsd->wsc_Buffer );
					wsd->wsc_Buffer = NULL;
				}
				
				FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
				pthread_mutex_destroy( &(wsd->wsc_Mutex) );
				return 0;
			}
			break;
			
		//case LWS_CALLBACK_GET_THREAD_ID:
		//	return (uint64_t)pthread_self();
			
		default:
			{
			// disabled for test
				if( wsd != NULL )
				{
					UserSession *us = (UserSession *)wsd->wsc_UserSession;

					if( us != NULL && us->us_MsgQueue.fq_First != NULL )
					{
						lws_callback_on_writable( wsi );
					}
				}
			}
			break;
		}

		DEBUG("[WS] END of callback\n");
		FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
	}
	
	return returnError;
}

//
//
//

static inline int WSSystemLibraryCall( WSThreadData *wstd, UserSession *locus, Http *http, char **pathParts, BufString *queryrawbs )
{
		//char **pathParts = data->wstd_PathParts;
	int error = 0;
	
	int returnError = 0; //this value must be returned to WSI!
	
	if( strcmp( pathParts[ 0 ], "system.library" ) == 0 && error == 0 )
	{
		http->http_WSocket = wstd->wstd_WSD;
		
		struct timeval start, stop;
		gettimeofday(&start, NULL);
		
		http->http_Content = queryrawbs->bs_Buffer;
		queryrawbs->bs_Buffer = NULL;
		
		http->http_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
		
		int respcode = 0;
		Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, locus, &respcode );
		
		if( respcode == -666 )
		{
			INFO("Logout function called.");
			
			HttpFree( response );
		}
		else
		{
			gettimeofday(&stop, NULL);
			double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
			FBOOL fileReadCall = FALSE;
		
			if( response != NULL && pathParts[1] != NULL && pathParts[2] != NULL )
			{
				if( strcmp( pathParts[1], "file" ) == 0 && strcmp( pathParts[2], "read" ) == 0 )
				{
					Log( FLOG_INFO, "[WS] A. SysWebRequest took %f seconds, err: %d response: '%.*s'\n" , secs, response->http_ErrorCode, 200, response->http_Content );
					fileReadCall = TRUE;
				}
				else
				{	// we also dont want to have large responses in logs
					Log( FLOG_INFO, "[WS] B. SysWebRequest took %f seconds, err: %d response: '%.*s'\n" , secs, response->http_ErrorCode, 200, response->http_Content );
				}
			}
			else
			{
				Log( FLOG_INFO, "[WS] C. SysWebRequest took %f seconds\n" , secs );
			}
		
			if( response != NULL )
			{
				unsigned char *buf;
				//char jsontemp[ 2048 ];
#define JSON_TEMP_LEN 2048
				char *jsontemp = FMalloc( JSON_TEMP_LEN );
			
				DEBUG("[WS] Response != NULL\n");
			
				//Log( FLOG_INFO, "[WS] Trying to check response content..\n" );
			
				// If it is not JSON!
				if( (response->http_Content != NULL && ( response->http_Content[ 0 ] != '[' && response->http_Content[ 0 ] != '{' ) ) || fileReadCall == TRUE )
				{
					//Log( FLOG_INFO, "[WS] Has NON JSON response content..\n" );
					DEBUG("Protocol websocket response length: %ld\n", response->http_SizeOfContent );
				
					char *d = response->http_Content;
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
						wstd->wstd_Requestid 
					);
				
					int msgLen = jsonsize + ( 2* response->http_SizeOfContent ) + 1 + END_CHAR_SIGNS + LWS_SEND_BUFFER_POST_PADDING + 128;
					
					buf = (unsigned char *)FCalloc( msgLen , sizeof( char ) );
				
					DEBUG("[WS] buf %p\n", buf );
				
					if( buf != NULL )
					{
						memcpy( buf, jsontemp, jsonsize );
					
						char *locptr = (char *) buf+jsonsize;
						int z = 0;
						int znew = 0;
						int len = (int)response->http_SizeOfContent;
						unsigned char car;
					
						// Add escape characters to single and double quotes!
						for( ; z < len; z++ )
						{
							car = response->http_Content[ z ];
							switch( car )
							{
							case '\\':
								locptr[ znew++ ] = '\\';
								break;
								// Always add escape chars on unescaped double quotes
							case '"':
								locptr[ znew++ ] = '\\';
								//locptr[ znew++ ] = '\\';
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
					

						DEBUG("protocol websocket, before write.... %p\n", locptr );
						if( locptr[ znew-1 ] == 0 )
						{
							znew--;
							DEBUG("ZNEW\n");
						}
						memcpy( buf + jsonsize + znew, end, END_CHAR_SIGNS );
						
						//Log( FLOG_INFO, "[WS] NO JSON - Passed memcpy..\n" );
						DEBUG("[WS] user session ptr %p message len %d\n", locus, msgLen );

						locus->us_LastActionTime = time( NULL );
						UserSessionWebsocketWrite( locus, buf, znew + jsonsize + END_CHAR_SIGNS, LWS_WRITE_TEXT );
					
						FFree( buf );
					}
				}
				else
				{
					if( response->http_Content != NULL )
					{
						if( strcmp( response->http_Content, "{\"response\":\"user session not found\"}" )  == 0 )
						{
							returnError = -1;
						}
					
						int END_CHAR_SIGNS = response->http_SizeOfContent > 0 ? 2 : 4;
						char *end = response->http_SizeOfContent > 0 ? "}}" : "\"\"}}";
						int jsonsize = sprintf( jsontemp, "{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%s\",\"data\":", wstd->wstd_Requestid );
					
						buf = (unsigned char *)FCalloc( jsonsize + response->http_SizeOfContent + END_CHAR_SIGNS + 128, sizeof( char ) );
						if( buf != NULL )
						{
							memcpy( buf, jsontemp,  jsonsize );
							memcpy( buf+jsonsize, response->http_Content, response->http_SizeOfContent );
							memcpy( buf+jsonsize+response->http_SizeOfContent, end, END_CHAR_SIGNS );
						
							UserSessionWebsocketWrite( locus, buf , response->http_SizeOfContent+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
							
							FFree( buf );
						}
					}
					else		// content == NULL
					{
						int END_CHAR_SIGNS = response->http_SizeOfContent > 0 ? 2 : 4;
						char *end = response->http_SizeOfContent > 0 ? "}}" : "\"\"}}";
						int jsonsize = sprintf( jsontemp, "{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%s\",\"data\":", wstd->wstd_Requestid );
					
						buf = (unsigned char *)FCalloc( jsonsize + END_CHAR_SIGNS + 128, sizeof( char ) );
						if( buf != NULL )
						{
							memcpy( buf, jsontemp, jsonsize );
							memcpy( buf+jsonsize, end, END_CHAR_SIGNS );
							
							UserSessionWebsocketWrite( locus, buf, jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
						
							FFree( buf );
						}
					}
				}
			
				response->http_RequestSource = HTTP_SOURCE_WS;
				HttpFree( response );
			
				FFree( jsontemp );
			}
			Log( FLOG_INFO, "[WS] SysWebRequest return\n");
		}	// respcode == -666
	}
	else
	{
		Log( FLOG_INFO, "[WS] No response at all..\n" );
		char response[ 1024 ];
		char dictmsgbuf1[ 196 ];
		snprintf( dictmsgbuf1, 196, SLIB->sl_Dictionary->d_Msg[DICT_CANNOT_PARSE_COMMAND_OR_NE_LIB], pathParts[ 0 ] );
		
		int resplen = sprintf( response, "{\"response\":\"%s\"}", dictmsgbuf1 );

		char jsontemp[ 1024 ];
		static int END_CHAR_SIGNS = 2;
		char *end = "}}";
		int jsonsize = sprintf( jsontemp, "{\"type\":\"msg\",\"data\":{\"type\":\"response\",\"requestid\":\"%s\",\"data\":", wstd->wstd_Requestid );
		
		unsigned char * buf = (unsigned char *)FCalloc( jsonsize + resplen + END_CHAR_SIGNS + 128, sizeof( char ) );
		if( buf != NULL )
		{
			memcpy( buf, jsontemp,  jsonsize );
			memcpy( buf+jsonsize, response,  resplen );
			memcpy( buf+jsonsize+resplen, end,  END_CHAR_SIGNS );
			
			UserSessionWebsocketWrite( locus, buf, resplen+jsonsize+END_CHAR_SIGNS, LWS_WRITE_TEXT );
			
			FFree( buf );
		}
		Log( FLOG_INFO, "WS no response end LOCKTEST\n");
	}
	
	return 0;
}

//
//
//

void *ParseAndCall( WSThreadData *wstd )
{
	pthread_detach( pthread_self() );
	signal(SIGPIPE, SIG_IGN);

	int i, i1;
	int r;
	jsmn_parser p;
	jsmntok_t *t;
	
	if( wstd == NULL || wstd->wstd_WSD->wsc_Status == WSC_STATUS_TO_BE_REMOVED )
	{
		return NULL;
	}
	
	char *in = wstd->wstd_Msg;
	wstd->wstd_Msg = NULL;			// we do not hold message in wstd anymore
	size_t len = wstd->wstd_Len;
	
	UserSession *locus = NULL;
	UserSession *origSession;
	
	if( wstd->wstd_WSD != NULL )
	{
		locus = wstd->wstd_UserSession;
	}
	origSession = locus;
	if( origSession != NULL )
	{
		if( origSession->us_WSD == NULL )
		{
			// This error is happening pretty random!
			// This one leads to websocket errors...
			
			FERROR("[ParseAndCall] There is no WS connection attached to user session!\n");
			// Decrease use for external call
			if( FRIEND_MUTEX_LOCK( &(origSession->us_Mutex) ) == 0 )
			{
				origSession->us_InUseCounter--;
				FRIEND_MUTEX_UNLOCK( &(origSession->us_Mutex) );
			}
			
			releaseWSData( wstd );
			
			// And exit
			//pthread_exit( NULL );
			return NULL;
		}
	}
	
	t = FCalloc( 256, sizeof(jsmntok_t) );
	jsmn_init( &p );
	r = jsmn_parse( &p, in, len, t, 256 );
	
	// Assume the top-level element is an object 
	if( r > 1 && t[0].type == JSMN_OBJECT )
	{
		FBOOL eq = FALSE;
		
		if( t[1].type == JSMN_STRING )
		{
			if( (int) strlen( "type" ) == t[1].end - t[1].start )
			{
				if( strncmp(in + t[1].start, "type", t[1].end - t[1].start) == 0) 
				{
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
							
							char *intstart = NULL;
							int tendstrt = 0;
							
							for( i = 9; i < r ; i++ )
							{
								intstart = in + t[ i ].start;
								tendstrt = t[ i ].end - t[ i ].start;
								
								if( strncmp( "id", intstart, tendstrt ) == 0 )
								{
									id = i+1;
								}
								else if( strncmp( "part", intstart, tendstrt ) == 0 )
								{
									part = i+1;
								}
								else if( strncmp( "total", intstart, tendstrt ) == 0 )
								{
									total = i+1;
								}
								else if( strncmp( "data", intstart, tendstrt ) == 0 )
								{
									data = i+1;
								}
							}
							
							DEBUG("[WS] Chunk received\n");
							
							if( part > 0 && total > 0 && data > 0 && wstd->wstd_WSD->wsc_UserSession != NULL )
							{
								//DEBUG("[WS] Got chunked message: %d\n\n\n%.*s\n\n\n", t[ data ].end-t[ data ].start, t[ data ].end-t[ data ].start, (char *)(in + t[ data ].start) );
								char *idc = StringDuplicateN( in + t[ id ].start, (int)(t[ id ].end - t[ id ].start) );
								part = StringNToInt( in + t[ part ].start,  (int)(t[ part ].end - t[ part ].start) );
								total = StringNToInt( in + t[ total ].start, (int)(t[ total ].end - t[ total ].start) );
								
								//if( us != NULL )
								{
									WebsocketReq *wsreq = WebsocketReqManagerPutChunk( locus->us_WSReqManager, idc, part, total, (char *)(in + t[ data ].start), (int)(t[ data ].end-t[ data ].start) );
									if( wsreq != NULL )
									{
										//DEBUG("\n\n\n\nFINAL MESSAGE %s %lu\n\n\n", wsreq->wr_Message, wsreq->wr_MessageSize );
										if( wsreq->wr_Message != NULL && wsreq->wr_MessageSize > 0 && wsreq->wr_IsBroken == 0 )
										{
											DEBUG("[WS] Callback will be called again!\n");

											if( wstd->wstd_Msg != NULL )
											{
												FFree( wstd->wstd_Msg );
											}
											wstd->wstd_Msg = wsreq->wr_Message;
											wstd->wstd_Len = wsreq->wr_MessageSize;
											
											if( wstd->wstd_Http != NULL )
											{
												UriFree( wstd->wstd_Http->http_Uri );
												wstd->wstd_Http->http_Uri = NULL;
		
												if( wstd->wstd_Http->http_RawRequestPath != NULL )
												{
													FFree( wstd->wstd_Http->http_RawRequestPath );
													wstd->wstd_Http->http_RawRequestPath = NULL;
												}

												HttpFree( wstd->wstd_Http );
												wstd->wstd_Http = NULL;
											}
	
											if( wstd->wstd_Requestid != NULL )
											{
												FFree( wstd->wstd_Requestid );
												wstd->wstd_Requestid = NULL;
											}
											if( wstd->wstd_Path != NULL )
											{
												FFree( wstd->wstd_Path );
												wstd->wstd_Path = NULL;
											}
	
											BufStringDelete( wstd->wstd_Queryrawbs );
											
											ParseAndCall( wstd );
											
											/*
											// Increase use for external (parseandcall)
											
											UserSession *uc = ( UserSession *)wstd->wstd_WSD->wsc_UserSession;
											if( uc != NULL )
											{
												if( FRIEND_MUTEX_LOCK( &(uc->us_Mutex) ) == 0 )
												{
													uc->us_InUseCounter++;
													DEBUG( "[ws] For non-thread parse and call %d\n", uc->us_InUseCounter );
													FRIEND_MUTEX_UNLOCK( &(uc->us_Mutex) );
												}
											}
											
											// We dont want to do anything on pointer which points to old data (released)
											in = NULL;
											// Run in thread
											pthread_t t;
											memset( &t, 0, sizeof( pthread_t ) );
											if( pthread_create( &t, NULL, (void *(*)(void *))ParseAndCall, ( void *)wstd ) != 0 )
											{
												// Failed!
												FFree( wstd );
												if( uc != NULL )
												{
													if( FRIEND_MUTEX_LOCK( &(uc->us_Mutex) ) == 0 )
													{
														uc->us_InUseCounter--;
														FRIEND_MUTEX_UNLOCK( &(uc->us_Mutex) );
													}
												}
											}
											*/
											
											wstd = NULL;
											
											
											//FC_Callback( wsi, reason, user, wsreq->wr_Message, wsreq->wr_MessageSize );
											DEBUG("[WS] Callback was called again!\n");
										}
										else
										{
											if( wsreq->wr_IsBroken )
											{
												Log( FLOG_ERROR, "Message is broken.\n" ); //: '%s'\n", wsreq->wr_Message );
											}
											DEBUG( "[WS] No message!\n" );
										}
										
#ifdef INPUT_QUEUE
										wsreq->wr_Message = NULL; // memory was released by ParseAndCall
#endif
										WebsocketReqDelete( wsreq );
									}
								}
								if( idc != NULL )
								{
									FFree( idc );
								}
								
								//DEBUG("[WS] Found proper chunk message\n");
							}
							else
							{
								DEBUG("[WS] Chunk Message parameters not found!\n");
							}
						}
					}
					else	// connection message
					{
						char *intstart = NULL;
						int tendstrt = 0;
						
						for( i = 4; i < r ; i++ )
						{
							i1 = i + 1;
							
							intstart = in + t[ i ].start;
							tendstrt = t[ i ].end-t[ i ].start;
						
							// Incoming connection is authenticating with sessionid (the Workspace probably)
							if( strncmp( "sessionId",  intstart, tendstrt ) == 0 )
							{
								char session[ DEFAULT_SESSION_ID_SIZE+1 ];
								memset( session, 0, DEFAULT_SESSION_ID_SIZE );
						
								strncpy( session, in + t[ i1 ].start, t[i1 ].end-t[ i1 ].start );

								// We could connect? If so, then just send back a pong..
								if( AttachWebsocketToSession( SLIB, wstd->wstd_WSD->wsc_Wsi, session, NULL, wstd->wstd_WSD ) >= 0 )
								{
									if( wstd->wstd_WSD->wsc_UserSession != NULL )
									{
										locus = wstd->wstd_WSD->wsc_UserSession;
									}
									INFO("[WS] Websocket communication set with user (sessionid) %s\n", session );
									
									//login = TRUE;
								
									char answer[ 1024 ];
									int len = snprintf( answer, 1024, "{\"type\":\"con\",\"data\":{\"type\":\"pong\",\"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
								
									unsigned char *buf;
									//int len = strlen( answer );
									buf = (unsigned char *)FCalloc( len + 256, sizeof( char ) );
									//INFO("[WS] Buf assigned: %p\n", buf );
									if( buf != NULL )
									{
										memcpy( buf, answer,  len );
										INFO("[WS] pointer to UserSession %p\n", locus );
										
										UserSessionWebsocketWrite( locus, buf, len, LWS_WRITE_TEXT );
										
										FFree( buf );
									}
								}
							}
							// Incoming connection is authenticating with authid (from an application or an FS)
							else if( strncmp( "authid",  intstart, tendstrt ) == 0 )
							{
								char authid[ DEFAULT_SESSION_ID_SIZE+1 ];
								memset( authid, 0, DEFAULT_SESSION_ID_SIZE );
						
								// We could connect? If so, then just send back a pong..
								if( AttachWebsocketToSession( SLIB, wstd->wstd_WSD->wsc_Wsi, NULL, authid, wstd->wstd_WSD ) >= 0 )
								{
									if( wstd->wstd_WSD->wsc_UserSession != NULL )
									{
										locus = wstd->wstd_WSD->wsc_UserSession;
									}
									//INFO("[WS] Websocket communication set with user (authid) %s\n", authid );
								
									char answer[ 2048 ];
									snprintf( answer, 2048, "{\"type\":\"con\",\"data\":{\"type\":\"pong\",\"data\":\"%.*s\"}}",t[ i1 ].end-t[ i1 ].start, (char *) (in + t[ i1 ].start) );
								
									unsigned char *buf;
									int len = strlen( answer );
									buf = (unsigned char *)FCalloc( len + 128, sizeof( char ) );
									if( buf != NULL )
									{
										//unsigned char buf[ LWS_SEND_BUFFER_PRE_PADDING + response->sizeOfContent +LWS_SEND_BUFFER_POST_PADDING ];
										memcpy( buf, answer,  len );

										//DEBUG("[WS] Writeline1 %p\n", locus );
										
										UserSessionWebsocketWrite( locus, buf, len, LWS_WRITE_TEXT );
										
										FFree( buf );
									}
								}
							}
						}	// for through parameters
					}	// next type of message
				
					if( in != NULL && strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
					{
						int tsize = t[ 6 ].end-t[ 6 ].start;
						// simple PING
						if( tsize > 0 && strncmp( "ping",  in + t[ 6 ].start, tsize ) == 0 && r > 8 )
						{
							wstd->wstd_Requestid = StringDuplicateN( (char *)(in + t[ 8 ].start), t[ 8 ].end-t[ 8 ].start );

							if( locus != NULL )
							{
								locus->us_LastActionTime = time( NULL );
								
								//sqlLib->SNPrintF( sqlLib, tmpQuery, sizeof(tmpQuery), "UPDATE `FUserSession` SET LastActionTime=%lld,SessionID='%s',UMA_ID=%lu WHERE `DeviceIdentity` = '%s' AND `UserID`=%lu", (long long)loggedSession->us_LoggedTime, loggedSession->us_SessionID, umaID, deviceid,  loggedSession->us_UserID );
								WSThreadPing( wstd );
							}
						}
					}
				}
			}
			
			//
			// regular message - just passing information on an already established connection
			//
			
			else if( strncmp( "msg",  in + t[ 2 ].start, 3 ) == 0 )
			{
				//
				// To catch nasty bug with WS
				//
				
				//Log( FLOG_INFO, "[WS] Incoming message: '%.*s'\n" , 200, in );
				Log( FLOG_INFO, "[WS] Incoming message: '%s'\n" , in );	// for debug
				
				// type object
				if( t[4].type == JSMN_OBJECT)
				{
					if( strncmp( "type",  in + t[ 5 ].start, t[ 5 ].end-t[ 5 ].start ) == 0 )
					{
						if( strncmp( "request",  in + t[ 6 ].start, t[ 6 ].end-t[ 6 ].start ) == 0 )
						{
							if( wstd->wstd_UserSession != NULL && wstd != NULL && locus->us_Status != USER_SESSION_STATUS_TO_REMOVE )
							{
								DEBUG("[WS] Request received\n");
								char *requestid = NULL;
								char *path = NULL;
								int paths = 0;
								char *authid = NULL;
								int authids = 0;
								char *nsess = StringDuplicate( locus->us_SessionID );
								
								Http *http = HttpNew( );
								if( http != NULL )
								{
									http->http_RequestSource = HTTP_SOURCE_WS;
									http->http_ParsedPostContent = HashmapNew();
									http->http_Uri = UriNew();

									if( HashmapPut( http->http_ParsedPostContent, StringDuplicate( "sessionid" ), nsess ) == MAP_OK )
									{
										//DEBUG1("[WS]:New values passed to POST %s\n", s->us_SessionID );
									}

									int i, i1;
									
									//thread
									char **pathParts = wstd->wstd_PathParts;

									BufString *queryrawbs = BufStringNewSize( 2048 );
									
									DEBUG("[WS] Parsing messages\n");
									
									for( i = 7 ; i < r ; i++ )
									{
										i1 = i + 1;
										
										if( i1 >= r )
										{
											FERROR("[WS] Parse message error. No data provided\n");
											break;
										}
										
										if( jsoneqin( in, &t[i], "requestid") == 0) 
										{
											// threads
											wstd->wstd_Requestid = StringDuplicateN(  (char *)(in + t[i1].start), (int)(t[i1].end-t[i1].start) );
											requestid = wstd->wstd_Requestid;
											
											if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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
												wstd->wstd_Path = StringDuplicateN( in + t[i1].start,t[i1].end-t[i1].start );
												path = wstd->wstd_Path;//in + t[i1].start;
												paths = t[i1].end-t[i1].start;
												
												if( http->http_Uri != NULL )
												{
													http->http_Uri->uri_QueryRaw = StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start );
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
												if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
												{
												}
												i++;
											}
										}
										else if (jsoneqin( in, &t[i], "authid") == 0) 
										{
											authid = in + t[i1].start;
											authids = t[i1].end-t[i1].start;
											
											
											if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
											{
												//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
											}
											
											if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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
												if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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

									//static inline int WSSystemLibraryCall( WSThreadData *wstd, UserSession *locus, Http *http, char **pathParts, BufString *queryrawbs )
									wstd->wstd_Http = http;
									wstd->wstd_Queryrawbs = queryrawbs;
									WSSystemLibraryCall( wstd, locus, http, pathParts, queryrawbs );
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
									http->http_RequestSource = HTTP_SOURCE_WS;
									http->http_ParsedPostContent = HashmapNew();
									http->http_Uri = UriNew();
									
									if( FRIEND_MUTEX_LOCK( &( wstd->wstd_WSD->wsc_Mutex ) ) == 0 )
									{
										wstd->wstd_WSD->wsc_InUseCounter++;
										FRIEND_MUTEX_UNLOCK( &( wstd->wstd_WSD->wsc_Mutex ) );
									}
									
									UserSession *ses = wstd->wstd_WSD->wsc_UserSession;
									if( ses != NULL )
									{
										if( wstd->wstd_WSD != NULL && wstd->wstd_WSD->wsc_UserSession != NULL )
										{
											DEBUG("[WS] Session ptr %p  session %p\n", ses, ses->us_SessionID );
											if( HashmapPut( http->http_ParsedPostContent, StringDuplicate( "sessionid" ), StringDuplicate( ses->us_SessionID ) ) == MAP_OK )
											{
												DEBUG1("[WS] New values passed to POST %s\n", ses->us_SessionID );
											}
										}
										
										if( FRIEND_MUTEX_LOCK( &( wstd->wstd_WSD->wsc_Mutex ) ) == 0 )
										{
											wstd->wstd_WSD->wsc_InUseCounter--;
											FRIEND_MUTEX_UNLOCK( &( wstd->wstd_WSD->wsc_Mutex ) );
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
											
												if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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
												
													if( http->http_Uri != NULL )
													{
														http->http_Uri->uri_QueryRaw = StringDuplicateN( path, paths );
													}
												
													http->http_RawRequestPath = StringDuplicateN( path, paths );
													if( paths > 0 )
													{
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
													}
													i++;
												}
												else
												{
													// this is path parameter
													if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN(  in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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
											
												if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( authid, authids ) ) == MAP_OK )
												{
													//DEBUG1("[WS]:New values passed to POST %.*s %.*s\n", t[i].end-t[i].start, in + t[i].start, t[i+1].end-t[i+1].start, in + t[i+1].start );
												}
											
												if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN(  "authid", 6 ), StringDuplicateN( authid, authids ) ) == MAP_OK )
												{

												}
												i++;
											}
											else
											{
												{
													if(( i1) < r && t[ i ].type != JSMN_ARRAY )
													{
														if( HashmapPut( http->http_ParsedPostContent, StringDuplicateN( in + t[ i ].start, t[i].end-t[i].start ), StringDuplicateN( in + t[i1].start, t[i1].end-t[i1].start ) ) == MAP_OK )
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
											struct timeval start, stop;
											gettimeofday(&start, NULL);
										
											http->http_Content = queryrawbs->bs_Buffer;
											queryrawbs->bs_Buffer = NULL;
											
											http->http_ShutdownPtr = &(SLIB->fcm->fcm_Shutdown);
											
											int respcode = 0;
											
											Http *response = SLIB->SysWebRequest( SLIB, &(pathParts[ 1 ]), &http, wstd->wstd_WSD->wsc_UserSession, &respcode );
										
											gettimeofday(&stop, NULL);
											double secs = (double)(stop.tv_usec - start.tv_usec) / 1000000 + (double)(stop.tv_sec - start.tv_sec);
										
											DEBUG("[WS] \t\tWS ->SysWebRequest took %f seconds\n", secs );
											
											if( response != NULL )
											{
												char *d = response->http_Content;
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
											UriFree( http->http_Uri );
											if( http->http_RawRequestPath != NULL )
											{
												FFree( http->http_RawRequestPath );
												http->http_RawRequestPath = NULL;
											}
										}
										HttpFree( http );
									}	// session != null
									else
									{
										if( FRIEND_MUTEX_LOCK( &( wstd->wstd_WSD->wsc_Mutex ) ) == 0 )
										{
											wstd->wstd_WSD->wsc_InUseCounter--;
											FRIEND_MUTEX_UNLOCK( &( wstd->wstd_WSD->wsc_Mutex ) );
										}
									}
								} // http != NULL
								else
								{
									FERROR("[WS] User session is NULL\n");
								}
							}
						}
					}	// type not found
				}	// is JSON_OBJECT
			}
			else	// else if( strncmp( "msg",  in + t[ 2 ].start, 3 ) == 0 )
			{
				FERROR("[WS] Found type %10s \n %10s\n", (char *)(in + t[ 2 ].start), (char *)(in + t[ 1 ].start) );
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
		
		FERROR("[WS] Failed to parse JSON: %d\n", r);
		char locmsg[ 256 ];
		int locmsgsize = snprintf( locmsg, 256, "{\"type\":\"msg\",\"data\":{\"type\":\"error\",\"data\":{\"requestid\":\"%s\"}}}", reqid );
		
		UserSessionWebsocketWrite( locus, (unsigned char *)locmsg, locmsgsize, LWS_WRITE_TEXT );

		FERROR("[WS] Object expected\n");
	}
	
	if( origSession != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(origSession->us_Mutex) ) == 0 )
		{
			origSession->us_InUseCounter--; // Decrease for internal increase
			DEBUG( "[WS] Decreased. %d\n", origSession->us_InUseCounter );
			FRIEND_MUTEX_UNLOCK( &(origSession->us_Mutex) );
		}
		
		if( origSession->us_Status == USER_SESSION_STATUS_TO_REMOVE )
		{
			char *locName = StringDuplicate( origSession->us_SessionID );
			if( locName != NULL )
			{
				UserSessionDelete( origSession );

				if( SLIB->sl_ActiveAuthModule != NULL )
				{
					SLIB->sl_ActiveAuthModule->Logout( SLIB->sl_ActiveAuthModule, NULL, locName );
				}
				FFree( locName );
			}
		}
	}
	
	if( wstd != NULL )
	{
		releaseWSData( wstd );
	}
	
	if( in != NULL )
	{
		FFree( in );
	}
	
	FFree( t );

	return NULL;
}
