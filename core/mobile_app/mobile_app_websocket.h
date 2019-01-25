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

#include <libwebsockets.h>

typedef enum {
	MOBILE_APP_ERR_NO_JSON = 1,
	MOBILE_APP_ERR_NO_TYPE = 2,
	MOBILE_APP_ERR_WRONG_TYPE = 3,
	MOBILE_APP_ERR_LOGIN_NO_USERNAME = 4,
	MOBILE_APP_ERR_LOGIN_NO_PASSWORD = 5,
	MOBILE_APP_ERR_LOGIN_INVALID_CREDENTIALS = 6,
	MOBILE_APP_ERR_NO_SESSION = 7,
	MOBILE_APP_ERR_NO_SESSION_NO_CONNECTION = 8,
	MOBILE_APP_ERR_INTERNAL = 9,
} mobile_app_error_t;

typedef enum {
	MOBILE_APP_STATUS_UNKNOWN = 0,
	MOBILE_APP_STATUS_PAUSED = 1,
	MOBILE_APP_STATUS_RESUMED = 2,
} mobile_app_status_t;

int WebsocketAppCallback(struct lws *wsi, int reason, void *user, void *in, size_t len);
