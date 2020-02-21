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
 *  Notification Manager
 *
 * file contain definitions related to NotificationManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 04/12/2018
 */

#ifndef __SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__
#define __SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>
#include <system/user/user_mobile_app.h>
#include <util/friendqueue.h>
#include <network/http_client.h>
#include "notification.h"

#define APNS_SANDBOX_HOST "gateway.sandbox.push.apple.com"
#define APNS_SANDBOX_PORT 2195

#define APNS_HOST "gateway.push.apple.com"
#define APNS_PORT 2195

#define FIREBASE_HOST "fcm.googleapis.com"

#define DEVICE_BINARY_SIZE 32
#define MAXPAYLOAD_SIZE 4032

#define TIME_OF_OLDER_MESSAGES_TO_REMOVE 8
#define TIME_OF_CHECKING_NOTIFICATIONS 7

//
// External server connections
//

typedef struct ExternalServerConnection
{
	void			*esc_Connection;
	MinNode			node;
}ExternalServerConnection;

//
// Notification Manager structure
//

typedef struct NotificationManager
{
	void						*nm_SB;
	SQLLibrary					*nm_SQLLib;
	FThread						*nm_TimeoutThread;
	Notification				*nm_Notifications;
	pthread_mutex_t				nm_Mutex;
	
	FThread						*nm_IOSSendThread;
	pthread_mutex_t				nm_IOSSendMutex;
	pthread_cond_t				nm_IOSSendCond;
	FQueue						nm_IOSSendMessages;
	int							nm_IOSSendInUse;
	
	FThread						*nm_AndroidSendThread;
	pthread_mutex_t				nm_AndroidSendMutex;
	pthread_cond_t				nm_AndroidSendCond;
	FQueue						nm_AndroidSendMessages;
	int							nm_AndroidSendInUse;
	HttpClient					*nm_AndroidSendHttpClient;
	
	FQueue						nm_ExtServiceMessage;
	pthread_mutex_t				nm_ExtServiceMutex;
	
	char						*nm_APNSCert;
	time_t						nm_APNSNotificationTimeout;
	FBOOL						nm_APNSSandBox;
	char						*nm_FirebaseKey;
	char						*nm_FirebaseHost;
	
	int							nm_NumberOfLaunchedThreads;
	ExternalServerConnection	*nm_ESConnections;
}NotificationManager;

NotificationManager *NotificationManagerNew( void *sb );

void NotificationManagerDelete( NotificationManager *nm );

Notification *NotificationManagerGetDB( NotificationManager *nm, FULONG id );

int NotificationManagerAddNotificationDB( NotificationManager *nm, Notification *n );

int NotificationManagerAddToList( NotificationManager *nm, Notification *n );

int NotificationManagerAddNotificationSentDB( NotificationManager *nm, NotificationSent *ns );

Notification *NotificationManagerGetTreeByNotifSentDB( NotificationManager *nm,  FULONG notifSentId );

NotificationSent *NotificationManagerGetNotificationsSentDB( NotificationManager *nm,  FULONG ID );

NotificationSent *NotificationManagerGetNotificationsSentByStatusDB( NotificationManager *nm,  FULONG ID, int status );

NotificationSent *NotificationManagerGetNotificationsSentByStatusAndUMAIDDB( NotificationManager *nm, int status, FULONG umaID );

int NotificationManagerDeleteNotificationDB( NotificationManager *nm, FULONG nid );

int NotificationManagerDeleteNotificationSentDB( NotificationManager *nm, FULONG nid );

Notification *NotificationManagerRemoveNotification( NotificationManager *nm, FULONG nsid );

int NotificationManagerNotificationSentSetStatusDB( NotificationManager *nm, FULONG nid, int status );

int NotificationManagerDeleteOldNotificationDB( NotificationManager *nm );

void NotificationManagerTimeoutThread( FThread *data );

int NotificationManagerNotificationSendIOS( NotificationManager *nm, const char *title, const char *content, const char *sound, int badge, const char *app, const char *extras, char *tokens );

int NotificationManagerNotificationSendIOSQueue( NotificationManager *nm, const char *title, const char *content, const char *sound, int badge, const char *app, const char *extras, char *tokens );

int NotificationManagerNotificationSendAndroid( NotificationManager *nm, Notification *notif, FULONG ID, char *action, char *tokens );

int NotificationManagerNotificationSendAndroidQueue( NotificationManager *nm, Notification *notif, FULONG ID, char *action, char *tokens );

NotificationSent *NotificationManagerGetNotificationsSentByStatusPlatformAndUMAIDDB( NotificationManager *nm, int status, int platform, FULONG umaID );

int NotificationManagerAddExternalConnection( NotificationManager *nm, void *con );

int NotificationManagerRemoveExternalConnection( NotificationManager *nm, void *con );

int NotificationManagerSendInformationToConnections( NotificationManager *nm, char *sername, char *msg, int len );

int NotificationManagerSendEventToConnections( NotificationManager *nm, Http *req, char *sername, const char *reqid, const char *sertype, const char *func, const char *action, char *msg );

char *NotificationManagerSendRequestToConnections( NotificationManager *nm, Http *req, UserSession *ses, char *sername, const char *type, const char *group, const char *action, const char *params );

int NotificationManagerAddIncomingRequestES( NotificationManager *nm, char *reqid, char *message );

void NotificationIOSSendingThread( FThread *data );

void NotificationAndroidSendingThread( FThread *data );

#endif //__SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__

