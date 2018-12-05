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
}NotificationManager;


NotificationManager *NotificationManagerNew( void *sb );

void NotificationManagerDelete( NotificationManager *nm );

Notification *NotificationManagerGetDB( NotificationManager *nm, FULONG id );

int NotificationManagerAddNotificationDB( NotificationManager *nm, Notification *n );

int NotificationManagerAddNotificationSentDB( NotificationManager *nm, NotificationSent *ns );

Notification *NotificationManagerGetTreeByNotifSentDB( NotificationManager *nm,  FULONG notifSentId );

int NotificationManagerDeleteNotificationDB( NotificationManager *nm, FULONG nid );

#endif //__SYSTEM_NOTIFICATION_NOTIFICATION_MANAGER_H__

