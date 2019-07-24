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
/*This header is used to interface with websocket.c */

/* This module provides a websocket protocol to accept mobile app notifications
 * from other systems. It requires authentication based on cfg.ini
 *
 * ******************************************************************
 * Messages originating from the notification source (eg. FriendChat server):
 *
 * Login (start of session):
 * Source:   { "t" : "auth", "key" : "some_magic_key_in_cfg.ini" }
 * Response: { "t" : "auth", "status" : 1}
 * Response status 1 means that the operation succedeed.
 *
 * Notification:
 * Source:   { "t" : "notify", "username" : "username_as_in_friend_core", "channel_id" : "123",
 *             "notification_type": 0, "title" : "title of the notification", "message" : "contents of the notification" }
 * Response: { "t" : "notify", "status" : 1 }
 * username - the login as used within Friend Core
 * channel_id - new notification with identical channel_id as an older one will replace it (as seen on user's mobile device),
 *              this should be a magic value that is specific to the source system. 
 * notification_type - can be any of mobile_notification_type_t from mobile_app.h
 * 
 * Response status 1 means that the operation succedeed.
 * ******************************************************************
 * Messages originating from the server: none
 */

#include <libwebsockets.h>
#include <stddef.h>

int WebsocketNotificationsSinkCallback(struct lws *wsi, int reason, void *user, void *in, ssize_t len);

void WebsocketNotificationsSetAuthKey(const char *key); //called only at startup from systembase.c
