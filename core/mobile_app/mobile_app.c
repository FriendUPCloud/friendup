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
#include <util/sha256.h>
#include <iconv.h>

#define KEEPALIVE_TIME_s 180 //ping time (10 before)
#define ENABLE_MOBILE_APP_NOTIFICATION_TEST_SIGNAL 1
#define USE_ONLY_FIREBASE		//use only firebase

#define WEBSOCKET_SEND_QUEUE

/**
 * Notify user
 *
 * @param lsb pointer to SystemBase
 * @param username pointer to string with user name
 * @param channel_id number of channel
 * @param app application name
 * @param title title of message which will be send to user
 * @param content message which will be send to user
 * @param notification_type type of notification
 * @param extraString additional string which will be send to user
 * @param ctimestamp create message timestamp
 * @return true when message was send
 */

//#define REGISTER_IN_THREAD

#ifdef REGISTER_IN_THREAD

typedef struct NotifRegMsg
{
	void *lsb;
	char *username;
	char *channel_id;
	char *app;
	char *title;
	char *content;
	MobileNotificationTypeT notification_type;
	char *extraString;
	FULONG ctimestamp;
}NotifRegMsg;

#endif


#ifdef REGISTER_IN_THREAD

void ProcessMobileRegister( void *locd );

int MobileAppNotifyUserRegister( void *lsb, const char *username, const char *channel_id, const char *app, const char *title, const char *content, MobileNotificationTypeT notification_type, const char *extraString, FULONG ctimestamp )
{
	NotifRegMsg *nrm = FCalloc( 1, sizeof(NotifRegMsg) );
	if( nrm != NULL )
	{
		nrm->lsb = lsb;
		nrm->username = StringDuplicate( username );
		nrm->channel_id = StringDuplicate( channel_id );
		nrm->app = StringDuplicate( app );
		nrm->title = StringDuplicate( title );
		nrm->message = StringDuplicate( content );
		nrm->notification_type = notification_type;
		nrm->extraString = StringDuplicate( extraString );
		nrm->ctimestamp = ctimestamp;
		pthread_t tmpThread;
		pthread_create( &tmpThread, NULL, (void *)( void * )ProcessMobileRegister, nrm );
	}
	return 0;
}


void ProcessMobileRegister( void *locd )
{
	pthread_detach( pthread_self() );

	NotifRegMsg *notregmsg = (NotifRegMsg *)locd;
	if( notregmsg == NULL )
	{
		pthread_exit( NULL );
		return;
	}
	void *lsb = notregmsg->lsb;
	char *username = notregmsg->username;
	char *channel_id = notregmsg->channel_id;
	char *app = notregmsg->app;
	char *title = notregmsg->title;
	char *message = notregmsg->message;
	MobileNotificationTypeT notification_type = notregmsg->notification_type;
	char *extraString = notregmsg->extraString;
	FULONG ctimestamp = notregmsg->ctimestamp;
	
	pthread_detach( pthread_self() );
	
#else
int MobileAppNotifyUserRegister( void *lsb, const char *username, const char *channel_id, const char *app, const char *title, const char *content, MobileNotificationTypeT notification_type, const char *extraString, FULONG ctimestamp )
{
#endif
	SystemBase *sb = (SystemBase *)lsb;
	Notification *notif = NULL;
	FBOOL wsMessageSent = FALSE;
	
	// get message length
	
	unsigned int reqLengith = 0;
	
	//DEBUG("\n\n\n\n---------------------------------------------MobileAppNotifyUserRegister\n");
	
	// if value was not passed, create new Notification
	
	char *escapedChannelId = json_escape_string( channel_id );
	char *escapedTitle = json_escape_string( title );
	char *escapedContent = json_escape_string( content );
	char *escapedApp = NULL;
	char *escapedExtraString = NULL;
	FULONG userID = 0;
	
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
	
	// Create notification structure in memory
	notif = NotificationNew();
	if( notif != NULL )
	{
		notif->n_Application = escapedApp;
		notif->n_Channel = escapedChannelId;
		notif->n_UserName = StringDuplicate( username );
		notif->n_Title = escapedTitle;
		notif->n_Content = escapedContent;
		notif->n_Extra = escapedExtraString;
		notif->n_NotificationType = notification_type;
		notif->n_Status = NOTIFY_ACTION_REGISTER;
		notif->n_OriginalCreateT = ctimestamp;
	}
	
	// store notification in DB
	NotificationManagerAddNotificationDB( sb->sl_NotificationManager, notif );
	
	reqLengith += strlen( notif->n_Channel ) + strlen( notif->n_Content ) + strlen( notif->n_Title ) + LWS_PRE + 512/*some slack*/;
	
	// allocate memory for message
	
	char *jsonMessage = FMalloc( reqLengith );
	
	DEBUG("[MobileAppNotifyUserRegister] start\n");
	
	// inform user there is notification for him
	// if there is no connection it means user cannot get message
	// then send him notification via mobile devices
	
	int bytesSent = 0;
	User *usr = UMGetUserByName( sb->sl_UM, username );
	if( usr != NULL )
	{
		userID = usr->u_ID;
		time_t timestamp = time( NULL );
		//
		if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
		{
			usr->u_InUse++;
			FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
		}
		
		{
			UserSessListEntry  *usl = usr->u_SessionsList;
			while( usl != NULL )
			{
				UserSession *locses = (UserSession *)usl->us;
				if( locses != NULL )
				{
					if( FRIEND_MUTEX_LOCK( &locses->us_Mutex ) == 0 )
					{
						locses->us_InUseCounter++;
						FRIEND_MUTEX_UNLOCK( &locses->us_Mutex );
					}
					
					DEBUG("[AdminWebRequest] Send Message through websockets: %s clients: %p timestamptrue: %d\n", locses->us_DeviceIdentity, locses->us_WSD, ( ( (timestamp - locses->us_LastActionTime) < sb->sl_RemoveUserSessionsAfterTime ) ) );
				
					if( ( ( (timestamp - locses->us_LastActionTime) < sb->sl_RemoveUserSessionsAfterTime ) ) && locses->us_WSD != NULL )
					{
						int msgLen = 0;
						NotificationSent *lns = NotificationSentNew();
						lns->ns_NotificationID = notif->n_ID;
						lns->ns_RequestID = locses->us_ID;
						lns->ns_Target = MOBILE_APP_TYPE_NONE;	// none means WS
						lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
						
						// store notification for user session in database
						NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
					
						if( notif->n_Extra )
						{ //TK-1039
							msgLen = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu, \"source\":\"ws\"}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Extra, notif->n_Application, lns->ns_ID );
						}
						else
						{
							msgLen = snprintf( jsonMessage, reqLengith, "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu, \"source\":\"ws\"}", notif->n_Channel, notif->n_Content, notif->n_Title, notif->n_Application, lns->ns_ID );
						}
					
						int msgsize = reqLengith + msgLen;
						char *sndbuffer = FMalloc( msgsize );
					
						DEBUG("\t\t\t\t\t\t\t jsonMessage '%s' len %d \n", jsonMessage, reqLengith );
						int lenmsg = snprintf( sndbuffer, msgsize-1, "{\"type\":\"msg\",\"data\":{\"type\":\"notification\",\"data\":{\"id\":\"%lu\",\"notificationData\":%s}}}", lns->ns_ID , jsonMessage );
					
						Log( FLOG_INFO, "Send notification through Websockets: '%s' len %d \n", sndbuffer, msgsize );
					
						bytesSent += WebSocketSendMessageInt( locses, sndbuffer, lenmsg );
						FFree( sndbuffer );
						
						// add NotificationSent to Notification
						lns->node.mln_Succ = (MinNode *)notif->n_NotificationsSent;
						notif->n_NotificationsSent = lns;
					}
					
					if( FRIEND_MUTEX_LOCK( &locses->us_Mutex ) == 0 )
					{
						locses->us_InUseCounter--;
						FRIEND_MUTEX_UNLOCK( &locses->us_Mutex );
					}
				} // locses = NULL
				usl = (UserSessListEntry *)usl->node.mln_Succ;
			}
		}
		
		if( FRIEND_MUTEX_LOCK( &usr->u_Mutex ) == 0 )
		{
			usr->u_InUse--;
			FRIEND_MUTEX_UNLOCK( &usr->u_Mutex );
		}
	}	// usr != NULL
	else
	{
		userID = UMGetUserIDByName( sb->sl_UM, username );
	}
	
	Log( FLOG_INFO, "User: %s userid: %lu will get content: %s\n", username, userID, content );
	
	if( bytesSent > 0 )
	{
		wsMessageSent = TRUE;
	}
	
	// if message was sent via Websockets
	// then Notification must be added to list, which will be checked before
	if( wsMessageSent == TRUE )
	{
		NotificationManagerAddToList( sb->sl_NotificationManager, notif );
	}
	
	DEBUG("NotificationRegister: get all connections by name: %s\n", username );

#ifdef USE_ONLY_FIREBASE
	
	BufString *bsMobileReceivedMessage = BufStringNew();
	
	if( wsMessageSent == FALSE )
	{
		DEBUG("Sending messages across Firebase devices\n");
		
		// android
		
		BufString *bs = MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_ANDROID, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
		if( bs != NULL )
		{
			NotificationManagerNotificationSendFirebaseQueue( sb->sl_NotificationManager, notif, 1, "register", bs->bs_Buffer, MOBILE_APP_TYPE_ANDROID );
			Log( FLOG_INFO, "Firebase tokens which should get notification: %s (Android)", bs->bs_Buffer );
			BufStringDelete( bs );
		}
		
		bs = MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_IOS, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
		if( bs != NULL )
		{
			NotificationManagerNotificationSendFirebaseQueue( sb->sl_NotificationManager, notif, 1, "register", bs->bs_Buffer, MOBILE_APP_TYPE_IOS );
			Log( FLOG_INFO, "Firebase tokens which should get notification: %s (IOS)", bs->bs_Buffer );
			BufStringDelete( bs );
		}
	}
	
	/*				
	// this way all of devices which were not avaiable during sending will get message
	// they will not get them in one case, when Notification attached to it will be removed
	 */
	BufStringDelete( bsMobileReceivedMessage );
#else
	BufString *bsMobileReceivedMessage = BufStringNew();
	
	if( wsMessageSent == FALSE )
	{
		DEBUG("Sending messages across Android devices\n");
		BufString *bs = MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_ANDROID, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
		if( bs != NULL )
		{
			NotificationManagerNotificationSendAndroidQueue( sb->sl_NotificationManager, notif, 1, "register", bs->bs_Buffer );
			//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "register", bs->bs_Buffer );
			//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "register", "\"fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg\"" );
			Log( FLOG_INFO, "Android tokens which should get notification: %s", bs->bs_Buffer );
			BufStringDelete( bs );
		}
		//UserMobileApp *lmaroot = MobleManagerGetMobileAppByUserPlatformDBm( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_IOS, USER_MOBILE_APP_STATUS_APPROVED, FALSE );
	}
	
	/*				
	// this way all of devices which were not avaiable during sending will get message
	// they will not get them in one case, when Notification attached to it will be removed
	 */
	BufStringDelete( bsMobileReceivedMessage );
	
	// message to user Android: "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\"}"
	// message from example to APNS: /client.py '{"auth":"72e3e9ff5ac019cb41aed52c795d9f4c","action":"notify","payload":"hellooooo","sound":"default","token":"1f3b66d2d16e402b5235e1f6f703b7b2a7aacc265b5af526875551475a90e3fe","badge":1,"category":"whatever"}'
	
	DEBUG("[MobileAppNotifyUserRegister] send message to other mobile apps, message was alerady sent? %d\n", wsMessageSent );

	if( wsMessageSent == FALSE && sb->sl_NotificationManager->nm_APNSCert != NULL )
	{
		char *tokens = MobleManagerGetIOSAppTokensDBm( sb->sl_MobileManager, userID );
		if( tokens != NULL )
		{
			Log( FLOG_INFO, "Send notification through Mobile App: IOS '%s' : tokens %s\n", notif->n_Content, tokens );
			NotificationManagerNotificationSendIOSQueue( sb->sl_NotificationManager, notif->n_Title, notif->n_Content, "default", 1, notif->n_Application, notif->n_Extra, tokens );
			//NotificationManagerNotificationSendIOS( sb->sl_NotificationManager, notif->n_Title, notif->n_Content, "default", 1, notif->n_Application, notif->n_Extra, tokens );
			FFree( tokens );
		}
		else
		{
			Log( FLOG_ERROR, "[MobileAppNotifyUserRegister] IOS tokens are equal to NULL for user: %lu\n", userID );
		}
	}
	else
	{
		FERROR("Message was sent through websockets or there is no valid Apple APNS certyficate!\n");
	}
#endif

	FFree( jsonMessage );
	
	// message was not sent via Websockets, there is no need to put it into queue
	if( wsMessageSent == FALSE )
	{
		NotificationDelete( notif );
		//return -1;
	}

#ifdef REGISTER_IN_THREAD
	if( username != NULL ) FFree( username );
	if( channel_id != NULL ) FFree( channel_id );
	if( app != NULL ) FFree( app );
	if( title != NULL ) FFree( title );
	if( message != NULL ) FFree( message );
	if( extraString != NULL ) FFree( extraString );
	pthread_exit( NULL );
#else
	//pthread_exit( NULL );
	return 0;
#endif
}


/**
 * Notify user update
 *
 * @param username pointer to string with user name
 * @param notif pointer to Notfication structure
 * @param action id of action
 * @return 0 when message was send, otherwise error number
 */
int MobileAppNotifyUserUpdate( void *lsb, const char *username, Notification *notif, int action )
{
	if( username == NULL )
	{
		Log( FLOG_ERROR, "[MobileAppNotifyUserUpdate]: Username is NULL!\n");
		return 1;
	}
	SystemBase *sb = (SystemBase *)lsb;
	
	// get message length
	
	unsigned int reqLengith = LWS_PRE + 512;
	
	DEBUG("[MobileAppNotifyUserUpdate] start\n");
	
	if( notif != NULL )
	{
		if( notif->n_NotificationsSent == NULL )
		{
			// memory leak check
			//notif->n_NotificationsSent = NotificationManagerGetNotificationsSentDB( sb->sl_NotificationManager, notif->n_ID );
		}
	}
	else	// Notification was not provided by function, must be read from DB
	{
		DEBUG("notif is equal to NULL\n");
		return 1;
	}
	
	if( notif != NULL )
	{
		if( notif->n_Channel != NULL )
		{
			reqLengith += strlen( notif->n_Channel );
		}
		
		if( notif->n_Content != NULL )
		{
			reqLengith += strlen( notif->n_Content );
		}
		
		if( notif->n_Title != NULL )
		{
			reqLengith += strlen( notif->n_Title );
		}
		
		if( notif->n_Application != NULL )
		{
			reqLengith += strlen( notif->n_Application );
		}
		
		if( notif->n_Extra != NULL )
		{
			reqLengith += strlen( notif->n_Extra );
		}
	}
	else
	{
		FERROR("Cannot find notification!\n");
		return 1;
	}

	FULONG userID = UMGetUserIDByName( sb->sl_UM, username );
	
#ifdef USE_ONLY_FIREBASE
	BufString *bs = MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_ANDROID, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
	if( bs != NULL )
	{
		NotificationManagerNotificationSendFirebaseQueue( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer, MOBILE_APP_TYPE_ANDROID );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", "\"fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg\"" );
		Log( FLOG_INFO, "Android (update) tokens which should get notification: %s (Android)", bs->bs_Buffer );
		BufStringDelete( bs );
	}
	bs = MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_IOS, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
	if( bs != NULL )
	{
		NotificationManagerNotificationSendFirebaseQueue( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer, MOBILE_APP_TYPE_IOS );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", "\"fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg\"" );
		Log( FLOG_INFO, "Android (update) tokens which should get notification: %s (IOS)", bs->bs_Buffer );
		BufStringDelete( bs );
	}
#else
	BufString *bs= MobleManagerAppTokensByUserPlatformDB( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_ANDROID, USER_MOBILE_APP_STATUS_APPROVED, notif->n_ID );
	if( bs != NULL )
	{
		NotificationManagerNotificationSendAndroidQueue( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", bs->bs_Buffer );
		//NotificationManagerNotificationSendAndroid( sb->sl_NotificationManager, notif, 1, "update", "\"fVpPVyTb6OY:APA91bGhIvzwL2kFEdjwQa1ToI147uydLdw0hsauNUtqDx7NoV1EJ6CWjwSCmHDeDw6C4GsZV3jEpnTwk8asplawkCdAmC1NfmVE7GSp-H4nk_HDoYtBrhNz3es2uq-1bHiYqg2punIg\"" );
		Log( FLOG_INFO, "Android (update) tokens which should get notification: %s", bs->bs_Buffer );
		BufStringDelete( bs );
	}

	// message to user Android: "{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\"}"
	// message from example to APNS: /client.py '{"auth":"72e3e9ff5ac019cb41aed52c795d9f4c","action":"notify","payload":"hellooooo","sound":"default","token":"1f3b66d2d16e402b5235e1f6f703b7b2a7aacc265b5af526875551475a90e3fe","badge":1,"category":"whatever"}'
	
	DEBUG("[MobileAppNotifyUserUpdate]: send message to other mobile apps\n");
	
	char *jsonMessageIOS;
	int jsonMessageIosLength = reqLengith+512;

	if( sb->sl_NotificationManager->nm_APNSCert != NULL )
	{
		FULONG userID = 0;
		User *usr = UMGetUserByName( sb->sl_UM, username );
		if( usr != NULL )
		{
			userID = usr->u_ID;
			//UserDelete( usr );	// user cannot be deleted from list!
		}
		
		if( ( jsonMessageIOS = FMalloc( jsonMessageIosLength ) ) != NULL )
		{
			UserMobileApp *lmaroot = MobleManagerGetMobileAppByUserPlatformDBm( sb->sl_MobileManager, userID, MOBILE_APP_TYPE_IOS, USER_MOBILE_APP_STATUS_APPROVED, FALSE );
			UserMobileApp *lma = lmaroot;
			
			if( action == NOTIFY_ACTION_TIMEOUT )
			{
				while( lma != NULL )
				{
					NotificationSent *lns = NotificationSentNew();
					lns->ns_NotificationID = notif->n_ID;
					lns->ns_UserMobileAppID = lma->uma_ID;
					lns->ns_RequestID = (FULONG)lma;
					lns->ns_Target = MOBILE_APP_TYPE_IOS;
					lns->ns_Status = NOTIFICATION_SENT_STATUS_REGISTERED;
					NotificationManagerAddNotificationSentDB( sb->sl_NotificationManager, lns );
					
					Log( FLOG_INFO, "Send notification (update) through Mobile App: IOS '%s' iostoken: %s\n", notif->n_Content, lma->uma_AppToken );
					
					NotificationManagerNotificationSendIOSQueue( sb->sl_NotificationManager, notif->n_Title, notif->n_Content, "default", 1, notif->n_Application, notif->n_Extra, lma->uma_AppToken );
					//NotificationManagerNotificationSendIOS( sb->sl_NotificationManager, notif->n_Title, notif->n_Content, "default", 1, notif->n_Application, notif->n_Extra, lma->uma_AppToken );
					/*
					int msgsize = snprintf( jsonMessageIOS, jsonMessageIosLength, "{\"auth\":\"%s\",\"action\":\"notify\",\"payload\":\"%s\",\"sound\":\"default\",\"token\":\"%s\",\"badge\":1,\"category\":\"whatever\",\"application\":\"%s\",\"action\":\"register\",\"id\":%lu}", sb->l_AppleKeyAPI, notif->n_Content, lma->uma_AppToken, notif->n_Application, lns->ns_ID );
					*/
					
					NotificationSentDelete( lns );

					lma = (UserMobileApp *)lma->node.mln_Succ;
				}
			} // notifSentID == 0
			
			UserMobileAppDeleteAll( lmaroot );

			FFree( jsonMessageIOS );
		}
	}
	else
	{
		INFO("[MobileAppNotifyUserUpdate]: No A!\n");
	}
#endif
	
	return 0;
}
