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
#include "notifications_sink.h"

extern SystemBase *SLIB;

//static Hashmap *globalSocketAuthMap; //maps websockets to boolean values that are true then the websocket is authenticated
//static char *_auth_key;

#define WEBSOCKET_SEND_QUEUE

static FBOOL VerifyAuthKey( const char *key_name, const char *key_to_verify );

static int ReplyError( DataQWSIM *d, int error_code);

void ProcessIncomingRequest( DataQWSIM *d, char *data, size_t len, void *udata );

//
// Information used by threads
//

typedef struct SinkProcessMessage{
	DataQWSIM *d;
	char *data;
	size_t len;
	void *udata;
}SinkProcessMessage;

int globalServerEntriesNr = 0;
char **globalServerEntries = NULL;

/**
 * Write message to websocket
 *
 * @param d pointer to DataQWSIM structure
 * @param msg pointer to string where message is stored
 * @param len length of message
 * @return number of bytes written to websocket
 */

static inline int WriteMessageSink( DataQWSIM *d, unsigned char *msg, int len )
{
	//MobileAppNotif *man = (MobileAppNotif *) mac->user_data;
	//if( man != NULL )
	{
		DEBUG("WriteMessageSink\n"); 
		FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
		if( en != NULL )
		{
			DEBUG("Message added to queue: '%s'\n", msg );
			en->fq_Data = FMalloc( len+64+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
			memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, msg, len );
			
			en->fq_Size = len;
			FERROR("\t\t\t\t\t\t\t\t\t\t\tSENDMESSSAGE\n<%s> size: %d\n\n\n\n", msg, len );
	
			//FQPushFIFO( &(man->man_Queue), en );
			//lws_callback_on_writable( mac->websocket_ptr );
			if( FRIEND_MUTEX_LOCK( &d->d_Mutex ) == 0 )
			{
				FQPushFIFO( &(d->d_Queue), en );
				lws_callback_on_writable( d->d_Wsi );
				FRIEND_MUTEX_UNLOCK( &(d->d_Mutex) );
			}
		}
	}
	return len;
}

/**
 * Write message to websocket
 *
 * @param d pointer to DataQWSIM structure
 * @param msg pointer to string where message is stored
 * @param len length of message
 * @return number of bytes written to websocket
 */

int WriteMessageToServers( DataQWSIM *d, unsigned char *msg, int len )
{
	return WriteMessageSink( d, msg, len );
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
int WebsocketNotificationsSinkCallback(struct lws* wsi, int reason, void* user, void* in, ssize_t len)
{
	MobileAppNotif *man = (MobileAppNotif *)user;
	//DEBUG("notifications websocket callback, reason %d, len %zu, wsi %p lenasint %d\n", reason, len, wsi, (int) len);
	DEBUG("notifications websocket callback, reason %d, len %ld, wsi %p lenasint %d is bigger then 0: %d\n", reason, len, wsi, (int) len,  (len > 0)  );
	char *buf = NULL;
	if( reason == LWS_CALLBACK_RECEIVE && in != NULL && (len > 0) )
	{
		int s = (int)len;
		// copy received bufffer
		buf = FMalloc( s+64 );
		memcpy( buf, in, s );
		buf[ s ] = 0;
	}
	Log( FLOG_INFO, "[WebsocketNotificationsSinkCallback] incoming msg, reason: %d msg len: %d\n", reason, len );
	
	switch( reason )
	{
		case LWS_CALLBACK_PROTOCOL_INIT:
		{

		}
		break;
	
		case LWS_CALLBACK_ESTABLISHED:
		{
			if( man != NULL )
			{
				DataQWSIM *locd = FCalloc( 1, sizeof( DataQWSIM ) );
				if( locd != NULL )
				{
					pthread_mutex_init( &locd->d_Mutex, NULL );
					locd->d_Wsi = wsi;
					memset( &(locd->d_Queue), 0, sizeof( locd->d_Queue ) );
					FQInit( &(locd->d_Queue) );
					locd->d_Authenticated = TRUE;
					man->man_Data = locd;
				}
			}
		}
		break;
	
		case LWS_CALLBACK_CLOSED:
		{
			MobileAppNotif *man = (MobileAppNotif *)user;
			if( man != NULL && man->man_Data != NULL )
			{
				while( man->man_InUse > 0 )
				{
					
					usleep( 500 );
				}
				
				DataQWSIM *d = (DataQWSIM *)man->man_Data;
				if( d != NULL )
				{
					NotificationManagerRemoveExternalConnection( SLIB->sl_NotificationManager, d );
					
					if( d->d_ServerName != NULL )
					{
						FFree( d->d_ServerName );
						d->d_ServerName = NULL;
					}
					//HashmapRemove( globalSocketAuthMap, websocketHash );
					pthread_mutex_destroy( &(d->d_Mutex) );
					FQDeInitFree( &(d->d_Queue) );
					FFree( d );
				}	
				man->man_Data = NULL;
			}
		}
		break;
		
		case LWS_CALLBACK_SERVER_WRITEABLE:
		{
#ifdef WEBSOCKET_SEND_QUEUE
			MobileAppNotif *man = (MobileAppNotif *)user;
			if( man != NULL && man->man_Data != NULL )
			{
				DataQWSIM *d = (DataQWSIM *)man->man_Data;
				FQEntry *e = NULL;
				FRIEND_MUTEX_LOCK( &d->d_Mutex );
				FQueue *q = &(d->d_Queue);
			
				//DEBUG("[websocket_app_callback] WRITABLE CALLBACK, q %p\n", q );
			
				if( ( e = FQPop( q ) ) != NULL )
				{
					FRIEND_MUTEX_UNLOCK( &d->d_Mutex );
					unsigned char *t = e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING;
					t[ e->fq_Size+1 ] = 0;

					//INFO("\t\t\t\t\t\t\t\t\t\t\tSENDMESSSAGE\n<%s> size: %d\n\n\n\n", e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size );
					int res = lws_write( wsi, e->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, e->fq_Size, LWS_WRITE_TEXT );
					//DEBUG("[websocket_app_callback] message sent: %s len %d\n", e->fq_Data, res );

					int v = lws_send_pipe_choked( wsi );
				
					if( e != NULL )
					{
						//DEBUG("Release: %p\n", e->fq_Data );
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
					//DEBUG("[websocket_app_callback] No message in queue\n");
					FRIEND_MUTEX_UNLOCK( &d->d_Mutex );
				}
			
				if( d != NULL && d->d_Queue.fq_First != NULL )
				{
					//DEBUG("We have message to send, calling writable\n");
					lws_callback_on_writable( wsi );
				}
			}
#endif
		}
		break;
		
		case LWS_CALLBACK_RECEIVE:
		{
			MobileAppNotif *man = (MobileAppNotif *)user;
			if( man != NULL && man->man_Data != NULL )
			{
				DataQWSIM *d = (DataQWSIM *)man->man_Data;
				ProcessIncomingRequest( d, buf, len, user );
				buf = NULL;
			}
		}
		break;
	}
	
	if( buf != NULL )
	{
		FFree( buf );
	}
	
	return 0;
}

typedef struct UMsg
{
	char *usrname;
	MinNode node;
}UMsg;

/**
 * Process incoming request
 *
 * @param d pointer to DataQWSIM
 * @param data pointer to string where message is stored
 * @param len length of message
 * @return 0 when success, otherwise error number
 */

#define DISABLE_NOTIFICATION_THREADING

// definition
void ProcessSinkMessage( void *locd );

#ifndef DISABLE_NOTIFICATION_THREADING
int ProcessIncomingRequest( DataQWSIM *d, char *data, size_t len, void *udata )
{
	SinkProcessMessage *spm = FCalloc( 1, sizeof( SinkProcessMessage ) );
	if( spm != NULL )
	{
		spm->d = d;
		spm->data = data;
		spm->len = len;
		spm->udata = udata;

		pthread_t tmpThread;
		pthread_create( &tmpThread, NULL, (void *)( void * )ProcessSinkMessage, spm );

	}
	return 0;
}
#endif

#ifdef DISABLE_NOTIFICATION_THREADING
void ProcessIncomingRequest( DataQWSIM *d, char *data, size_t len, void *udata )
{
#else
void ProcessSinkMessage( void *locd )
{
	SinkProcessMessage *spm = (SinkProcessMessage *)locd;
	pthread_detach( pthread_self() );
	if( spm == NULL )
	{
		return;
	}
	if( FRIEND_MUTEX_LOCK( &(spm->d->d_Mutex) ) == 0 )
	{
		MobileAppNotif *man = (MobileAppNotif *)spm->udata;
		man->man_InUse++;
		FRIEND_MUTEX_UNLOCK( &spm->d->d_Mutex );
	}
	
	DataQWSIM *d = spm->d;
	char *data = spm->data;
	size_t len = spm->len;
	void *udata = spm->udata;
#endif
	
	Log( FLOG_INFO, "[NotificationSink] Incoming notification request: <%*s>\n", (unsigned int)len, data);

	jsmn_parser parser;
	jsmn_init( &parser );
	jsmntok_t t[512]; //should be enough

	int tokens_found = jsmn_parse( &parser, data, len, t, sizeof(t)/sizeof(t[0]) );
	
	DEBUG( "Token found: %d", tokens_found );
	if( tokens_found < 1 )
	{
		ReplyError( d, WS_NOTIF_SINK_ERROR_TOKENS_NOT_FOUND );
		goto error_point;
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

	// request : 
	// {
	// type : 'user',
	// data : {
	// type : 'list',
	// data : {
	// requestid : <string>,
	// },
	// },
	// }

	
	//json_t json = { .string = data, .string_length = len, .token_count = tokens_found, .tokens = t };
	
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
				static int LOCAL_REPLY_LEN = 512 + LWS_PRE;
				char reply[ LOCAL_REPLY_LEN ];
				// first check if service is already authenticated maybe?
				
				for( p = 5; p < 9 ; p++ )
				{
					int firstSize = t[p].end - t[p].start;

					if ( strncmp( data + t[p].start, "serviceKey", firstSize ) == 0 )
					{
						p++;
						int secondSize = t[p].end - t[p].start;
						authKey = FCalloc( secondSize + 16, sizeof(char) );
						strncpy( authKey, data + t[p].start, secondSize );
					}
					else if ( strncmp( data + t[p].start, "serviceName", firstSize ) == 0 )
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
					ReplyError( d, WS_NOTIF_SINK_ERROR_NO_AUTH_ELEMENTS );
					goto error_point;
				}
				
				if( VerifyAuthKey( authName, authKey ) == FALSE )
				{
					FFree( authKey );
					FFree( authName );
					ReplyError( d, WS_NOTIF_SINK_ERROR_AUTH_FAILED );
					goto error_point;
				}
				
				d->d_Authenticated = TRUE;
				d->d_ServerName = StringDuplicate( authName );
				
				int msize = strlen("{\"type\":\"authenticate\",\"data\":{\"status\":0 }}");
				//int msize = snprintf( reply + LWS_PRE, LOCAL_REPLY_LEN, "{\"type\":\"authenticate\",\"data\":{\"status\":0 }}" );
				strcpy( reply + LWS_PRE, "{\"type\":\"authenticate\",\"data\":{\"status\":0 }}" );
				
#ifdef WEBSOCKET_SEND_QUEUE
				WriteMessageSink( d, (unsigned char *)(reply)+LWS_PRE, msize );
#else
				
				unsigned int json_message_length = strlen( reply + LWS_PRE );
				lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );
#endif
				FFree( authKey );
				FFree( authName );
				
				NotificationManagerAddExternalConnection( SLIB->sl_NotificationManager, d );
				
				goto error_point;
			}
			else if( d->d_Authenticated ) 
			{
				int dlen =  t[3].end - t[3].start;
				msize = t[2].end - t[2].start;
				//DEBUG("Check1:  %.*s\n", 10, data + t[2].start );
				/*
				if( strncmp( data + t[2].start, "service", msize ) == 0 && strncmp( data + t[3].start, "data", dlen ) == 0 )
				{
					
				}
				else 
					*/
				if( strncmp( data + t[2].start, "ping", msize ) == 0 && strncmp( data + t[3].start, "data", dlen ) == 0 ) 
				{
					static int bufferSize = LWS_PRE+256;
					char *reply = FMalloc( bufferSize );
					//char reply[ 128 ];
					DEBUG("size: %d\n", t[4].end-t[4].start );
					DEBUG("Data: %s\n", (char *)(data + t[4].start));
					//DEBUG("received message: %s {\"type\":\"pong\",\"data\":\"%.*s\"}", (int)(t[4].end-t[4].start), (char *)(data + t[4].start) );
					//int locmsglen = snprintf( reply + LWS_PRE, bufferSize ,"{\"type\":\"pong\",\"data\":\"%.*s\"}", t[4].end-t[4].start,data + t[4].start );
					int locmsglen = sprintf( reply + LWS_PRE ,"{\"type\":\"pong\",\"data\":\"%.*s\"}", t[4].end-t[4].start,data + t[4].start );
#ifdef WEBSOCKET_SEND_QUEUE
					WriteMessageSink( d, (unsigned char *)reply+LWS_PRE, locmsglen );
#else
					unsigned int json_message_length = strlen( reply + LWS_PRE );
					lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );				
#endif
					FFree( reply );
				}
				else if( strncmp( data + t[2].start, "service", msize ) == 0 && strncmp( data + t[3].start, "data", dlen ) == 0 ) 
				{
					// check object type
				
					if( strncmp( data + t[5].start, "type", t[5].end - t[5].start) == 0) 
					{
						msize = t[6].end - t[6].start;
						
						if( strncmp( data + t[6].start, "notification", msize) == 0) 
						{
							// 6 notification, 7 data, 8 object, 9 variables
							
							DEBUG( "\n\nnotification \\o/\n" );
							int p;
							int notification_type = -1;
							//char *username = NULL;
							char *channel_id = NULL;
							char *title = NULL;
							char *message = NULL;
							char *application = NULL;
							char *extra = NULL;
							FULONG timecreated = 0;
							
							UMsg *ulistroot = NULL;
							//List *usersList = ListNew(); // list of users
							
							// 8 -> 25
							for( p = 8 ; p < tokens_found ; p++ )
							{
								int size = t[p].end - t[p].start;
								if( strncmp( data + t[p].start, "notification_type", size) == 0) 
								{
									p++;
									if( (t[p].end - t[p].start) >= 1 )
									{
										char *tmp = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
										if( tmp != NULL )
										{
											DEBUG("TYPE: %s\n", tmp );
											notification_type = atoi( tmp );
											FFree( tmp );
										}
									}
								}
								
								// username -  users
								// "users":[ "username", "pawel", ....]
								
								else if( strncmp( data + t[p].start, "users", size) == 0) 
								{
									DEBUG("Found array of users\n");
									p++;
									if( t[p].type == JSMN_ARRAY ) 
									{
										int j;
										int locsize = t[p].size;
										p++;
										for( j=0 ; j < locsize ; j++ )
										{
											char *username = StringDuplicateN( data + t[p].start, (int)(t[p].end - t[p].start) );
											DEBUG("This user will get message: %s\n", username );
											UMsg *le = FCalloc( 1, sizeof(UMsg) );
											if( le != NULL )
											{
												le->usrname = username;
												le->node.mln_Succ = (MinNode *)ulistroot;
												ulistroot = le;
											}
											//ListAdd( &usersList, username );
											p++;
										}
										p--;
									}
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
								else if( strncmp( data + t[p].start, "application", size) == 0) 
								{
									p++;
									application = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
								else if( strncmp( data + t[p].start, "extra", size) == 0) 
								{
									p++;
									extra = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
								}
								else if( strncmp( data + t[p].start, "timecreated", size) == 0) 
								{
									char *tmp;
									p++;
									tmp = StringDuplicateN( data + t[p].start, t[p].end - t[p].start );
									if( tmp != NULL )
									{
										char *end;
										timecreated = strtoul( tmp, &end, 0);
										FFree( tmp );
									}
								}
							}
							
							if( notification_type >= 0 )
							{
								if( ulistroot == NULL || channel_id == NULL || title == NULL || message == NULL )
								{
									DEBUG( "channel_id: %s title: %s message: %s\n", channel_id, title , message );
									UMsg *le = ulistroot;
									while( le != NULL )
									{
										UMsg *dme = le;
										le = (UMsg *)le->node.mln_Succ;
								
										if( dme->usrname != NULL )
										{
											FFree( dme->usrname );
										}
										FFree( dme );
									}
									if( channel_id != NULL ) FFree( channel_id );
									if( title != NULL ) FFree( title );
									if( message != NULL ) FFree( message );
									if( application != NULL ) FFree( application );
									if( extra != NULL ) FFree( extra );
									ReplyError( d, WS_NOTIF_SINK_ERROR_PARAMETERS_NOT_FOUND );
									goto error_point;
								}
								
								// debug purpose
								BufString *debugUserList = BufStringNew();
								UMsg *le = ulistroot;
								while( le != NULL )
								{
									char temp[ 256 ];
									int size = snprintf( temp, sizeof(temp), " User: %s", le->usrname );
									BufStringAddSize( debugUserList, temp, size );
									le = (UMsg *)le->node.mln_Succ;
								}
								if( debugUserList->bs_Size > 0 )
								{
									Log( FLOG_INFO, "This users will get notifications: %s\n", debugUserList->bs_Buffer );
								}
								else
								{
									Log( FLOG_ERROR, "Notification Error! No users in recipients list\n");
								}
								BufStringDelete( debugUserList );
								
								int returnStatus = 0;
								le = ulistroot;
								while( le != NULL )
								{
									if( le->usrname != NULL )
									{
										int status = MobileAppNotifyUserRegister( SLIB, (char *)le->usrname, channel_id, application, title, message, (MobileNotificationTypeT)notification_type, extra, timecreated );

										if( status != 0 )
										{
											returnStatus = status;
										}
									}
									le = (UMsg *)le->node.mln_Succ;
								}
								
								char reply[256];
								int msize = sprintf(reply + LWS_PRE, "{ \"type\" : \"service\", \"data\" : { \"type\" : \"notification\", \"data\" : { \"status\" : %d }}}", returnStatus );
#ifdef WEBSOCKET_SEND_QUEUE
								WriteMessageSink( d, (unsigned char *)reply+LWS_PRE, msize );
#else
								unsigned int json_message_length = strlen( reply + LWS_PRE );
								lws_write( wsi, (unsigned char*)reply+LWS_PRE, json_message_length, LWS_WRITE_TEXT );
#endif
							}
							else
							{
								ReplyError( d, WS_NOTIF_SINK_ERROR_NOTIFICATION_TYPE_NOT_FOUND );
								goto error_point;
							}
							
							UMsg *le = ulistroot;
							while( le != NULL )
							{
								UMsg *dme = le;
								le = (UMsg *)le->node.mln_Succ;
								
								if( dme->usrname != NULL )
								{
									FFree( dme->usrname );
								}
								FFree( dme );
							}
							
							//if( username != NULL ) FFree( username );
							if( channel_id != NULL ) FFree( channel_id );
							if( title != NULL ) FFree( title );
							if( message != NULL ) FFree( message );
							if( application != NULL ) FFree( application );
							if( extra != NULL ) FFree( extra );
						}
						else //DEBUG("Check2:  %.*s\n", 10, data + t[6].start );
					
						if( strncmp( data + t[6].start, "user", msize ) == 0 )
						{
							char *reqid = NULL;
						
							//DEBUG("Check3:  %.*s\n", 10, data + t[10].start );
							if( strncmp( data + t[10].start, "list", t[10].end - t[10].start) == 0) 
							{
								if( strncmp( data + t[13].start, "requestid", t[13].end - t[13].start) == 0) 
								{
									reqid = StringDuplicateN( data + t[14].start, t[14].end - t[14].start );
								}
							
								//DEBUG("Check1: %.*s\n", 10, data + t[15].start );
							
								if( reqid != NULL )
								{
									BufString *bs = BufStringNew();
									UMReturnAllUsers( SLIB->sl_UM, bs, NULL );
									DEBUG("Return message: %s\n", bs->bs_Buffer );
									NotificationManagerSendEventToConnections( SLIB->sl_NotificationManager, NULL, NULL, reqid, NULL, NULL, NULL, bs->bs_Buffer );
									BufStringDelete( bs );
									FFree( reqid );
								}
								else
								{
									DEBUG("Reqid == NULL\n");
								}
							}
							else if( strncmp( data + t[10].start, "get", t[10].end - t[10].start) == 0) 
							{
								char *uuid = NULL;
							
								if( strncmp( data + t[13].start, "requestid", t[13].end - t[13].start) == 0) 
								{
									reqid = StringDuplicateN( data + t[14].start, t[14].end - t[14].start );
								}
								if( strncmp( data + t[15].start, "userid", t[15].end - t[15].start) == 0) 
								{
									uuid = StringDuplicateN( data + t[16].start, t[16].end - t[16].start );
								}
							
								DEBUG("Check1:  %s\n", reqid );
								DEBUG("Check2:  %s\n", uuid );
						
								if( reqid != NULL && uuid != NULL )
								{
									BufString *bs = BufStringNew();
									//BufStringAddSize( bs, "{", 1 );
								
									User *usr = UMGetUserByUUIDDB( SLIB->sl_UM, uuid );
									if( usr != NULL )
									{
										char udata[ 1024 ];
										int udatalen = snprintf( udata, sizeof(udata), "{\"userid\":\"%s\",\"name\":\"%s\",\"lastupdate\":%lu", \
											usr->u_UUID, usr->u_Name, usr->u_ModifyTime
										);
									
										// add first part to response string
										BufStringAddSize( bs, udata, udatalen );
										
										// status
										
										if( usr->u_Status == USER_STATUS_DISABLED )
										{
											udatalen = snprintf( udata, sizeof(udata), ",\"isdisabled\":true" );
											BufStringAddSize( bs, udata, udatalen );
										}
										
										// if field is not empty, must be provided
										if( usr->u_FullName != NULL )
										{
											udatalen = snprintf( udata, sizeof(udata), ",\"fullname\":\"%s\"", usr->u_FullName );
											BufStringAddSize( bs, udata, udatalen );
										}
										if( usr->u_Email != NULL )
										{
											udatalen = snprintf( udata, sizeof(udata), ",\"email\":\"%s\"", usr->u_Email );
											BufStringAddSize( bs, udata, udatalen );
										}
										BufStringAddSize( bs, "}", 1 );
										NotificationManagerSendEventToConnections( SLIB->sl_NotificationManager, NULL, NULL, reqid, NULL, NULL, NULL, bs->bs_Buffer );
									}
									else
									{
										char udata[ 1024 ];
										int udatalen = snprintf( udata, sizeof(udata), "{\"type\":\"reply\",\"data\":{\"requestid\":\"%s\",\"error\":\"%s\"}}", \
											reqid, "User not found"
										);
										//BufStringAddSize( bs, udata, udatalen );
										WriteMessageSink( d, (unsigned char *)(udata)+LWS_PRE, udatalen );
									}
								
									BufStringDelete( bs );
								
									FFree( reqid );
									FFree( uuid );
								}
								else
								{
									DEBUG("Reqid == NULL\n");
									char udata[ 1024 ];
									int udatalen = snprintf( udata, sizeof(udata), "{\"type\":\"reply\",\"data\":{\"requestid\":\"%s\",\"error\":\"%s\"}}", \
										reqid, "User not found"
									);
									WriteMessageSink( d, (unsigned char *)(udata)+LWS_PRE, udatalen );
								}
							}
						}
						
						//
						// information about user groups
						//
						
						else if( strncmp( data + t[6].start, "group", msize ) == 0 )
						{
							char *reqid = NULL;
							if( strncmp( data + t[10].start, "list", t[10].end - t[10].start) == 0) 
							{
								if( strncmp( data + t[13].start, "requestid", t[13].end - t[13].start) == 0) 
								{
									reqid = StringDuplicateN( data + t[14].start, t[14].end - t[14].start );
								}
								if( reqid != NULL )
								{
									// send message about current groups and users
				
									BufString *bs = BufStringNew();
									UGMReturnAllAndMembers( SLIB->sl_UGM, bs, "Workgroup" );
									NotificationManagerSendEventToConnections( SLIB->sl_NotificationManager, NULL, NULL, reqid, NULL, NULL, NULL, bs->bs_Buffer );
									BufStringDelete( bs );
									FFree( reqid );
								}
								else
								{
									DEBUG("Reqid == NULL\n");
								}
							}
						}
						
						//
						// information about presence rooms
						//
						
						if( strncmp( data + t[6].start, "room", msize) == 0) 
						{
							char *reqid = NULL;
							//{"type":"service","data":{"type":"room","data":{"type":"create","requestid":"EXTSER_1581518992698024_ID","data":{"ownerUserId":"df0499e006056004359160d3041d95b0","name":"blabla"}}}}
							
							
							//{"type":"service","data":{"type":"room","data":{"requestId":"bladdibla","response":null,"error":"ERR_NO_OWNER"}}}
							//pos 13: error":"ERR_NO_OWNER"}}}
							//14: ERR_NO_OWNER"}}}

							
							DEBUG("External service incoming: room notification\npos 9: %s\npos 13: %s\n14: %s\n", data + t[9].start, data + t[13].start, data + t[14].start );
							
							if( strncmp( data + t[9].start, "requestId", t[9].end - t[9].start) == 0) 
							{
								reqid = StringDuplicateN( data + t[10].start, t[10].end - t[10].start );
							}
							
							if( NotificationManagerAddIncomingRequestES( SLIB->sl_NotificationManager, reqid, StringDuplicate( data ) ) != 0 )
							{
								FERROR("Notification from external service could not be added to queue!\n");
							}
						}
					}
				}	// is authenticated
				else
				{
					DEBUG( "Not authenticated! omg!!!" );
					ReplyError( d, WS_NOTIF_SINK_ERROR_WS_NOT_AUTHENTICATED );
					goto error_point;
				}
			}
		}	// "type" in json
		else
		{
			ReplyError( d, WS_NOTIF_SINK_ERROR_BAD_JSON );
			goto error_point;
		}
	}	// JSON OBJECT
	
error_point:

#ifndef DISABLE_NOTIFICATION_THREADING
	if( FRIEND_MUTEX_LOCK( &(spm->d->d_Mutex) ) == 0 )
	{
		MobileAppNotif *man = (MobileAppNotif *)spm->udata;
		man->man_InUse--;
		FRIEND_MUTEX_UNLOCK( &spm->d->d_Mutex );
	}

	if( spm->data != NULL )
	{
		FFree( spm->data );
	}
	FFree( spm );
#else	
	if( data )
	{
		FFree( data );
	}
#endif
	
	return;
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
		//_auth_key = NULL;
		DEBUG("Notifications key not set, the service will be disabled\n");
		return;
	}
	//_auth_key = FCalloc(len+1, sizeof(char));
	//strcpy(_auth_key, key);
	//DEBUG("Notifications key is <%s>\n", _auth_key);
}

/**
 * Reply error code to user
 *
 * @param d pointer to DataQWSIM
 * @param error_code error code
 * @return -1
 */
static int ReplyError( DataQWSIM *d, int error_code )
{
#ifdef WEBSOCKET_SEND_QUEUE
	char response[ LWS_PRE+64 ];
	int size = snprintf(response, sizeof(response), "{\"type\":\"error\",\"data\":{\"status\":%d}}", error_code);
	WriteMessageSink( d, (unsigned char *)response, size );
#else
	char response[ LWS_PRE+64 ];
	snprintf(response+LWS_PRE, sizeof(response)-LWS_PRE, "{\"type\":\"error\",\"data\":{\"status\":%d}}", error_code);
	DEBUG("Error response: %s\n", response+LWS_PRE);

	DEBUG("WSI %p\n", wsi);
	lws_write(wsi, (unsigned char*)response+LWS_PRE, strlen(response+LWS_PRE), LWS_WRITE_TEXT);

	WebsocketRemove(wsi);
#endif
	return error_code;
}

/**
 * Verify authentication key
 *
 * @param keyName name of the server key
 * @param keyToVerify pointer to string with key
 * @return true when key passed verification, otherwise false
 */
static FBOOL VerifyAuthKey( const char *keyName, const char *keyToVerify )
{
	DEBUG("VerifyAuthKey - keyName <%s> VerifyAuthKey - keyToVerify <%s>\n", keyName, keyToVerify );

	if( keyName != NULL && keyToVerify != NULL )
	{
		int i;
		DEBUG("Keyname != NULL num: %d\n", SLIB->l_ServerKeysNum );
		for( i = 0 ; i < SLIB->l_ServerKeysNum ; i++ )
		{
			DEBUG(" SLIB->l_ServerKeys[i] - %s - SLIB->l_ServerKeyValues[i] - %s | keyName %s - keyToVerify %s\n", SLIB->l_ServerKeys[i]+12, SLIB->l_ServerKeyValues[i], keyName, keyToVerify );
			if( SLIB->l_ServerKeys[i] != NULL && strcmp( keyName, SLIB->l_ServerKeys[i]+12 ) == 0 )
			{
				if( SLIB->l_ServerKeyValues[i] != NULL && strcmp( SLIB->l_ServerKeyValues[i], keyToVerify) == 0 )
				{
					DEBUG("Key is same\n");
					return TRUE;
				}
			}
		}
	}
	return FALSE;
}
