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
#include "notification.h"

#define APNS_SANDBOX_HOST "gateway.sandbox.push.apple.com"
#define APNS_SANDBOX_PORT 2195

#define APNS_HOST "gateway.push.apple.com"
#define APNS_PORT 2195

#define DEVICE_BINARY_SIZE 32
#define MAXPAYLOAD_SIZE 256

//
// Notification Manager structure
//

typedef struct NotificationManager
{
	void					*nm_SB;
	SQLLibrary				*nm_SQLLib;
	FThread					*nm_TimeoutThread;
	Notification			*nm_Notifications;
	pthread_mutex_t			nm_Mutex;
	char					*nm_APNSCert;
	time_t					nm_APNSNotificationTimeout;
	FBOOL					nm_APNSSandBox;
}NotificationManager;


NotificationManager *NotificationManagerNew( void *sb );

void NotificationManagerDelete( NotificationManager *nm );

Notification *NotificationManagerGetDB( NotificationManager *nm, FULONG id );

int NotificationManagerAddNotificationDB( NotificationManager *nm, Notification *n );

int NotificationManagerAddNotificationSentDB( NotificationManager *nm, NotificationSent *ns );

Notification *NotificationManagerGetTreeByNotifSentDB( NotificationManager *nm,  FULONG notifSentId );

NotificationSent *NotificationManagerGetNotificationsSentDB( NotificationManager *nm,  FULONG ID );

NotificationSent *NotificationManagerGetNotificationsSentByStatusDB( NotificationManager *nm,  FULONG ID, int status );

NotificationSent *NotificationManagerGetNotificationsSentByStatusAndUMAIDDB( NotificationManager *nm, int status, FULONG umaID );

int NotificationManagerDeleteNotificationDB( NotificationManager *nm, FULONG nid );

Notification *NotificationManagerRemoveNotification( NotificationManager *nm, FULONG nsid );

int NotificationManagerNotificationSentSetStatusDB( NotificationManager *nm, FULONG nid, int status );

int NotificationManagerDeleteOldNotificationDB( NotificationManager *nm );

void NotificationManagerTimeoutThread( FThread *data );

int NotificationManagerNotificationSendIOS( NotificationManager *nm, const char *content, const char *sound, int badge, char *userData, char *tokens );

#endif //__SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__

