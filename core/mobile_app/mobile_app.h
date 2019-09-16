/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
#pragma once

/* This module provides internal notification API that is used to send
 * notifications to mobile app users (for example: FriendChat messages
 * or live call requests when the app is paused/suspended).
 *
 * ******************************************************************
 * Messages originating from the app:
 *
 * Login (start of session):
 * App: { "t" : "login", "user" : "someuser", "pass" : "hash_of_somepassword" }
 * Response: { "t" : "login", "status" : 1, "keepalive" : number }
 * Keepalive indicates how often the server will ping. If nothing is received within that time
 * the app should assume that the connection is broken.
 *
 * App is put to pause (suspend/background/etc.):
 * App: { "t" : "pause" }
 * Server: { "t" : "pause", "status" : 1 }
 *
 * App is resumed:
 * App: { "t" : "resume" }
 * Server: { "t" : "resume", "status" : 1 }
 *
 * ******************************************************************
 * Messages originating from the server:
 *
 * Ping request:
 * Server:  {"t":"keepalive","status":1}
 * App:     {"t":"echo"}
 */
#include <stdbool.h>
#include <util/friendqueue.h>
#include <network/websocket_client.h>
#include <system/notification/notification.h>

typedef enum {
	//0 - undefined

	MN_force_all_devices = 1, //show on all devices, regardless of app state

	MN_force_last_device = 2, //show only on most recently used device, regardless of app state

	MN_all_devices = 3, //show on all devices that have the app suspended

	MN_last_device = 4, //show only on most recently used device that has the app suspended
}MobileNotificationTypeT;

enum {
	MOBILE_APP_TYPE_NONE = 0,
	MOBILE_APP_TYPE_ANDROID,
	MOBILE_APP_TYPE_IOS,
	MOBILE_APP_TYPE_WINDOWS,
	MOBILE_APP_TYPE_MAX
};

static char *MobileAppType[] =
{
	"None",
	"Android",
	"iOS",
	"Windows"
};

#define WEBSOCKET_SINK_SEND_QUEUE

typedef struct MobileAppNotif
{
	int						man_Type;
	void					*man_Data;
	int						man_InUse;
}MobileAppNotif;

//
//
//

int MobileAppNotifyUserRegister( void *lsb, const char *username, const char *channel_id, const char *app, const char *title, const char *message, MobileNotificationTypeT notification_type, const char *extraString, FULONG ctimestamp );

//
//
//

int MobileAppNotifyUserUpdate( void *lsb,  const char *username, Notification *notif, int action );
