/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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

typedef enum {
	//0 - undefined

	MN_force_all_devices = 1, //show on all devices, regardless of app state

	MN_force_last_device = 2, //show only on most recently used device, regardless of app state

	MN_all_devices = 3, //show on all devices that have the app suspended

	MN_last_device = 4, //show only on most recently used device that has the app suspended
} mobile_notification_type_t;


/**
 * Sends notification to a user
 *
 * @param username friend username string
 * @param channel_id this is used to replace previous notifications, if two notifications
 *                   with the same channel_id are sent, then the second one replaces the first
 * @param title title of the notification
 * @param message message string to be displayed
 * @param notification_type option flag, see mobile_notification_type_t
 * @param extra_string additional information for workspace
 *                     (eg. launch an app, start a chat etc.), WORKSPACE-SPECIFIC, can be null
 * @return true when success
 */
bool mobile_app_notify_user(const char *username,
		const char *channel_id,
		const char *title,
		const char *message,
		mobile_notification_type_t notification_type,
		const char *extra_string);
