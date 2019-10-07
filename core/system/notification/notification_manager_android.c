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
 *  Notification Manager Android
 *
 * file contain definitions related to NotificationManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/09/2018
 */

#include "notification_manager.h"
#include <system/systembase.h>
#include <mobile_app/mobile_app.h>
#include <mobile_app/notifications_sink.h>
#include <network/http_client.h>

//
//
//

void NotificationAndroidSendingThread( FThread *data )
{
	data->t_Launched = TRUE;
	NotificationManager *nm = (NotificationManager *)data->t_Data;
	
	// create HTTP call
	
	char tmp[ 256 ];
	snprintf( tmp, sizeof(tmp), "/fcm/send" );
	char headers[ 512 ];
	snprintf( headers, sizeof(headers), "Content-type: application/json\nAuthorization: key=%s", nm->nm_FirebaseKey );
	
	nm->nm_AndroidSendHttpClient = HttpClientNew( TRUE, FALSE, tmp, headers, NULL );// msg );

	while( data->t_Quit != TRUE )
	{
		DEBUG("NotificationAndroidSendingThread: Before condition\n");
		if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
		{
			pthread_cond_wait( &(nm->nm_AndroidSendCond), &(nm->nm_AndroidSendMutex) );
			FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
			DEBUG("NotificationAndroidSendingThread: Got cond call\n");

			if( data->t_Quit == TRUE )
			{
				break;
			}
			
			FQEntry *e = NULL;
			
			while( TRUE )
			{
				if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
				{
					nm->nm_AndroidSendInUse++;
					
					FQueue *q = &(nm->nm_AndroidSendMessages);
					if( ( e = FQPop( q ) ) != NULL )
					{
						FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
					
						// send message
						nm->nm_AndroidSendHttpClient->hc_Content = (char *)e->fq_Data;
						
						Log( FLOG_INFO, "Send message to android device: %s<\n", nm->nm_AndroidSendHttpClient->hc_Content );
						
						BufString *bs = HttpClientCall( nm->nm_AndroidSendHttpClient, FIREBASE_HOST, 443, TRUE );
						if( bs != NULL )
						{
							DEBUG("Call done\n");
							char *pos = strstr( bs->bs_Buffer, "\r\n\r\n" );
							if( pos != NULL )
							{
								Log( FLOG_INFO, "Response from firebase : %s\n", pos );
							}
							BufStringDelete( bs );
						}
						// release data
				
						if( e != NULL )
						{
							FFree( e->fq_Data );
							FFree( e );
						}
					} // if( ( e = FQPop( q ) ) != NULL )
					else
					{
						FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
						break;
					}
					
					if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
					{
						nm->nm_AndroidSendInUse--;
						FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
					}
				} // if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
			}	// while TRUE
		}
	}	// while( data->t_Quit != TRUE )
	
	nm->nm_AndroidSendHttpClient->hc_Content = NULL;	//must be set to NULL becaouse we overwrite point to send messages (e->fq_Data)
	HttpClientDelete( nm->nm_AndroidSendHttpClient );
	
	data->t_Launched = FALSE;
}

/**
 * Send notification to Firebase server
 * 
 * @param nm pointer to NotificationManager
 * @param notif Notification structure
 * @param ID NotificationSent  ID
 * @param action actions after which messages were sent
 * @param tokens device tokens separated by coma
 * @return 0 when success, otherwise error number
 */

int NotificationManagerNotificationSendAndroid( NotificationManager *nm, Notification *notif, FULONG ID, char *action, char *tokens )
{
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char *host = FIREBASE_HOST;
	
	char tmp[ 256 ];
	snprintf( tmp, sizeof(tmp), "/fcm/send" );
	
	//char *headers = "Content-type: application/json\nAuthorization: key=AAAAlbHMs9M:APA91bGlr6dtUg9USN_fEtT6x9HBtq2kAxuu8sZIMC7SlrXD4rUS9-6d3STODGJKunA08uWknKvwPotD2N-RK9aD9IKEhpbUJ7CwqkEmkW7Zp2qN9wUJKRy-cyivnvkOaq1XuDqNz21Q";
	
	char headers[ 512 ];
	
	snprintf( headers, sizeof(headers), "Content-type: application/json\nAuthorization: key=%s", nm->nm_FirebaseKey );
	int msgSize = 512;
	
	if( tokens != NULL ){ msgSize += strlen( tokens ); }
	if( notif->n_Channel != NULL ){ msgSize += strlen( notif->n_Channel ); }
	if( notif->n_Content != NULL ){ msgSize += strlen( notif->n_Content ); }
	if( notif->n_Title != NULL ){ msgSize += strlen( notif->n_Title ); }
	if( notif->n_Extra != NULL ){ msgSize += strlen( notif->n_Extra ); }
	if( notif->n_Application != NULL ){ msgSize += strlen( notif->n_Application ); }
	
	//jsonMessageLength = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu,\"notifid\":%lu,\"source\":\"notification\"}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID, notif->n_ID );
	
	//char *con = "{\"registration_ids\":[\"fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg\"],\"notification\": {},\"data\":{\"t\":\"notify\",\"channel\":\"cont-65e9c8ad-1424-4c51-ad17-bde621feb283\",\"content\":\"wfwefwef\",\"title\":\"ztest50\",\"extra\":\"{\\\\\\\"roomId\\\\\\\":\\\\\\\"acc-b5de9510-8115-4ed6-bbf0-09a05c14645f\\\\\\\",\\\\\\\"msgId\\\\\\\":\\\\\\\"msg-0087bc36-3429-47b6-acc4-bf8f208f0d2c\\\\\\\"}\",\"application\":\"FriendChat\",\"action\":\"register\",\"id\":70,\"notifid\":1724,\"source\":\"notification\"}}";
	char *msg = FMalloc( msgSize );
	if( msg != NULL )
	{
		snprintf( msg, msgSize, "{\"registration_ids\":[%s],\"notification\": {},\"data\":{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"%s\",\"id\":%lu,\"notifid\":%lu,\"source\":\"notification\",\"createtime\":%lu},\"android\":{\"priority\":\"high\"}}", tokens, notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, action, ID , notif->n_ID, notif->n_OriginalCreateT );
	
		HttpClient *c = HttpClientNew( TRUE, FALSE, tmp, headers, msg );
		if( c != NULL )
		{
			DEBUG("Client created\n");
			BufString *bs = HttpClientCall( c, host, 443, TRUE );
			if( bs != NULL )
			{
				DEBUG("Call done\n");
				char *pos = strstr( bs->bs_Buffer, "\r\n\r\n" );
				if( pos != NULL )
				{
					DEBUG("Response: %s\n", pos );
				}
				BufStringDelete( bs );
			}
			HttpClientDelete( c );
		}
		else
		{
			FERROR("Cannot create client!\n");
		}
		FFree( msg );
	}
	else
	{
		DEBUG("Cannot allocate memory for message\n");
		return -1;
	}
	
	return 0;
}

/**
 * Send notification to Firebase server (in queue)
 * 
 * @param nm pointer to NotificationManager
 * @param notif Notification structure
 * @param ID NotificationSent  ID
 * @param action actions after which messages were sent
 * @param tokens device tokens separated by coma
 * @return 0 when success, otherwise error number
 */

int NotificationManagerNotificationSendAndroidQueue( NotificationManager *nm, Notification *notif, FULONG ID, char *action, char *tokens )
{
	SystemBase *sb = (SystemBase *)nm->nm_SB;
	char *host = FIREBASE_HOST;
	
	
	int msgSize = 512;
	
	if( tokens != NULL ){ msgSize += strlen( tokens ); }
	if( notif->n_Channel != NULL ){ msgSize += strlen( notif->n_Channel ); }
	if( notif->n_Content != NULL ){ msgSize += strlen( notif->n_Content ); }
	if( notif->n_Title != NULL ){ msgSize += strlen( notif->n_Title ); }
	if( notif->n_Extra != NULL ){ msgSize += strlen( notif->n_Extra ); }
	if( notif->n_Application != NULL ){ msgSize += strlen( notif->n_Application ); }
	
	char *msg = FMalloc( msgSize );
	if( msg != NULL )
	{
		int len = snprintf( msg, msgSize, "{\"registration_ids\":[%s],\"notification\": {},\"data\":{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"%s\",\"id\":%lu,\"notifid\":%lu,\"source\":\"notification\",\"createtime\":%lu},\"android\":{\"priority\":\"high\"}}", tokens, notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, action, ID , notif->n_ID, notif->n_OriginalCreateT );
	
		FQEntry *en = FCalloc( 1, sizeof( FQEntry ) );
		if( en != NULL )
		{
			en->fq_Data = (void *)msg;
			en->fq_Size = len;
			
			if( FRIEND_MUTEX_LOCK( &(nm->nm_AndroidSendMutex) ) == 0 )
			{
				FQPushFIFO( &(nm->nm_AndroidSendMessages), en );
				
				pthread_cond_signal( &(nm->nm_AndroidSendCond) );
				FRIEND_MUTEX_UNLOCK( &(nm->nm_AndroidSendMutex) );
			}
		}

		//FFree( msg ); // do not release message if its going to queue
	}
	else
	{
		DEBUG("Cannot allocate memory for message\n");
		return -1;
	}
	
	return 0;
}
