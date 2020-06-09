/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  User Session
 *
 * file contain all functitons related to user sessions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_session.h"
#include <util/string.h>
#include <system/systembase.h>
#include <system/token/dos_token.h>
#include <system/application/application_manager.h>

extern SystemBase *SLIB;

/**
 * Create new User Session
 *
 * @param sessid sessionID
 * @param devid deviceID
 * @return new UserSession structure when success, otherwise NULL
 */
UserSession *UserSessionNew( char *sessid, char *devid )
{
	UserSession *s;
	if( ( s = FCalloc( 1, sizeof(UserSession) ) ) != NULL )
	{
		s->us_SessionID = StringDuplicate( sessid );
		s->us_DeviceIdentity = StringDuplicate( devid );
		
		UserSessionInit( s );
		
		INFO("Mutex initialized\n");
	}
	return s;
}

/**
 * UserSession init
 *
 * @param us pointer to UserSession which will be initalized
 */
void UserSessionInit( UserSession *us )
{
	if( us != NULL )
	{
		pthread_mutex_init( &us->us_Mutex, NULL );
		
		us->us_WSReqManager = WebsocketReqManagerNew();
		
		FQDeInit( &(us->us_MsgQueue) );
	}
}

/**
 * Delete UserSession
 *
 * @param us pointer to UserSession which will be deleted
 */
void UserSessionDelete( UserSession *us )
{
	if( us != NULL )
	{
		Log( FLOG_DEBUG, "\nUserSessionDelete will be removed: %s\n\n", us->us_SessionID );
		int count = 0;
		int nrOfSessionsAttached = 0;

		// we must wait till all tasks will be finished
		while( TRUE )
		{
            if( us->us_InUseCounter <= 0 )
			{
				break;
			}
			else
			{
				count++;
				if( count > 50 )
				{
					Log( FLOG_INFO, "UserSessionDelete: number of working functions on user session: %d  sessionid: %s\n", us->us_InUseCounter, us->us_SessionID );
					WorkerManagerDebug( SLIB );
					count = 0;
					break;
				}
			}
			usleep( 100 );
		}
		
		DOSToken *dosToken = (DOSToken *)us->us_DOSToken;
		if( dosToken != NULL )
		{
			dosToken->ct_UserSession = NULL;
			dosToken->ct_UserSessionID = 0;
		}
		
		if( count > 50 )
		{
			Log( FLOG_DEBUG, "UserRemoveSession will be called\n");
		}
		
		if( us->us_User != NULL )
		{
			nrOfSessionsAttached = UserRemoveSession( us->us_User, us );
			us->us_User = NULL;
		}
		SystemBase *lsb = SLIB;//(SystemBase *)us->us_SB;

		DEBUG("[UserSessionDelete] Remove session %p\n", us );

		// Remove session from SAS
		//
		
		SASManagerRemUserSession( lsb->sl_SASManager, us );
		
		DEBUG("[UserSessionDelete] User removed from app session\n");
		
		WSCData *data = NULL;

		Log( FLOG_DEBUG, "[UserSessionDelete] Lock DetachWebsocketFromSession\n");
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			us->us_Wsi = NULL;
			data = (WSCData *)us->us_WSD;
			us->us_WSD = NULL;
			FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		}
		
		if( us->us_WSD != NULL )
		{
			if( FRIEND_MUTEX_LOCK( &(data->wsc_Mutex) ) == 0 )
			{
				if( us->us_WSD != NULL )
				{
					data->wsc_UserSession = NULL;
					data->wsc_Wsi = NULL;
				}
				FRIEND_MUTEX_UNLOCK( &(data->wsc_Mutex) );
			}
		}
		
		FQDeInitFree( &(us->us_MsgQueue) );
		//UserSessionWebsocketDeInit( &(us->us_Websockets) );

		DEBUG("[UserSessionDelete] Session released  sessid: %s device: %s \n", us->us_SessionID, us->us_DeviceIdentity );

		// first clear WebsocketReqManager and then remove it
		WebsocketReqManager *wrm = NULL;
		if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
		{
			if( us->us_WSReqManager != NULL )
			{
				wrm = us->us_WSReqManager;
				us->us_WSReqManager = NULL;
			}
		
			if( us->us_DeviceIdentity != NULL )
			{
				FFree( us->us_DeviceIdentity );
			}
	
			if( us->us_SessionID != NULL )
			{
				FFree( us->us_SessionID );
			}
			FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
		}
		
		if( wrm != NULL )
		{
			WebsocketReqManagerDelete( wrm );
		}
		pthread_mutex_destroy( &(us->us_Mutex) );
		
		// lets remove application sessions from system
		ApplicationManagerRemoveApplicationSessionByUserSessionID( lsb->sl_ApplicationManager, us->us_ID );
		
		//if( nrOfSessionsAttached <= 0 && us->us_UserID > 0 )
		//{
		//	ApplicationManagerRemoveApplicationSessionByUserID( lsb->sl_ApplicationManager, us->us_UserID );
		//}
	
		FFree( us );
		
		if( count > 50 )
		{
			Log( FLOG_DEBUG, "Session removed\n");
		}
	}
}

#define MAX_SIZE_WS_MESSAGE (WS_PROTOCOL_BUFFER_SIZE-2048)

/**
 * Write data to websockets
 * If message is bigger then WS buffer then message is encoded, splitted and send
 *
 * @param us pointer to UserSession
 * @param msgptr pointer to message
 * @param msglen length of the messsage
 * @param type type of websocket message which will be send
 * @return number of bytes sent
 */
int UserSessionWebsocketWrite( UserSession *us, unsigned char *msgptr, int msglen, int type )
{
	int retval = 0;

	/*
	if( us == NULL || us->us_WSD == NULL || us->us_Wsi == NULL )
	{
		DEBUG("[UserSessionWebsocketWrite] empty us %p wsd %p wsi %p\n", us, us->us_WSD, us->us_Wsi );
		return 0;
	}
	*/

	if( msglen > MAX_SIZE_WS_MESSAGE ) // message is too big, we must split data into chunks
	{
		DEBUG("[UserSessionWebsocketWrite] WebsocketWrite\n");
		char *encmsg = Base64Encode( (const unsigned char *)msgptr, msglen, &msglen );
		if( encmsg != NULL )
		{
			DEBUG("WebsocketWrite1\n");
			char *msgToSend = encmsg;
			//Sending big message, size 116244 (-2046 chunks of max: 63487)
			int totalChunk = (msglen / MAX_SIZE_WS_MESSAGE)+1;
			int actChunk = 0;
			
			int END_CHAR_SIGNS = 4;
			char *end = "\"}}}";
			
			DEBUG("[UserSessionWebsocketWrite] Sending big message, size %d (%d chunks of max: %d)\n", msglen, totalChunk, MAX_SIZE_WS_MESSAGE );
		
			//if( us->us_Wsi != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
				{
					us->us_InUseCounter++;
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
							
							retval += msglen;
					
							msgToSend += copysize;
							msglen -= MAX_SIZE_WS_MESSAGE;

							DEBUG( "[UserSessionWebsocketWrite] Determined chunk: %d\n", actChunk );
					
							FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
							en->fq_Data = queueMsg;
							en->fq_Size = queueMsgLen;
							en->fq_Priority = 3;	// default priority
				
							//DEBUG("FQPush: %p\n 
							FQPushFIFO( &(us->us_MsgQueue), en );

						// callback writeable was here
						}
					}
					
					us->us_InUseCounter--;
				
					WSCData *wsd = us->us_WSD;
					FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
					
					if( us->us_WSD != NULL )
					{
						/*
						if( FRIEND_MUTEX_LOCK( &(wsd->wsc_Mutex) ) == 0 )
						{
							wsd->wsc_InUseCounter++;
							FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
						*/
							if( wsd->wsc_Wsi != NULL )
							{
								lws_callback_on_writable( wsd->wsc_Wsi );
								lws_cancel_service_pt( wsd->wsc_Wsi );
							}
						/*
							if( FRIEND_MUTEX_LOCK( &(wsd->wsc_Mutex) ) == 0 )
							{
								wsd->wsc_InUseCounter--;
								FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
							}
						}*/
					}
				}
			}

			FFree( encmsg );
		}
	}
	else
	{
		DEBUG("[UserSessionWebsocketWrite] no chunked\n");
		//if( us->us_WSD != NULL )
		{
			if( FRIEND_MUTEX_LOCK( &(us->us_Mutex) ) == 0 )
			{
				WSCData *wsd = us->us_WSD;
				// double check
				DEBUG("[UserSessionWebsocketWrite] no chnked 1\n");

				us->us_InUseCounter++;

				FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
				if( en != NULL )
				{
					en->fq_Data = FMalloc( msglen+10+LWS_SEND_BUFFER_PRE_PADDING+LWS_SEND_BUFFER_POST_PADDING );
					memcpy( en->fq_Data+LWS_SEND_BUFFER_PRE_PADDING, msgptr, msglen );
					en->fq_Size = msglen;
					en->fq_Priority = 3;	// default priority
			
					FQPushFIFO( &(us->us_MsgQueue), en );
					retval += msglen;
			
					DEBUG("[UserSessionWebsocketWrite] Send message to WSI, ptr: %p\n", us->us_Wsi );

					DEBUG("[UserSessionWebsocketWrite] In use counter %d\n", us->us_InUseCounter );
				
					us->us_InUseCounter--;
				}

				FRIEND_MUTEX_UNLOCK( &(us->us_Mutex) );
				
				if( us->us_Wsi != NULL )
				{
					/*
					if( FRIEND_MUTEX_LOCK( &(wsd->wsc_Mutex) ) == 0 )
					{
						wsd->wsc_InUseCounter++;
						FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
						*/
						if( wsd->wsc_Wsi != NULL )
						{
							lws_callback_on_writable( wsd->wsc_Wsi );
							lws_cancel_service_pt( wsd->wsc_Wsi );
						}
						/*
						if( FRIEND_MUTEX_LOCK( &(wsd->wsc_Mutex) ) == 0 )
						{
							wsd->wsc_InUseCounter--;
							FRIEND_MUTEX_UNLOCK( &(wsd->wsc_Mutex) );
						}
						
					}*/
				}
			}
		}
	}

	return retval;
}

