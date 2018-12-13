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

#endif //__SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__

