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

int websocket_notifications_sink_callback(struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len);

void websocket_notifications_set_auth_key(const char *key); //called only at startup from systembase.c