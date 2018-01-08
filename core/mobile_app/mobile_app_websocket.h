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

#include <libwebsockets.h>

typedef enum {
	MOBILE_APP_ERR_NO_JSON = 1,
	MOBILE_APP_ERR_NO_TYPE = 2,
	MOBILE_APP_ERR_WRONG_TYPE = 3,
	MOBILE_APP_ERR_LOGIN_NO_USERNAME = 4,
	MOBILE_APP_ERR_LOGIN_NO_PASSWORD = 5,
	MOBILE_APP_ERR_LOGIN_INVALID_CREDENTIALS = 6,
	MOBILE_APP_ERR_NO_SESSION = 7,
	MOBILE_APP_ERR_INTERNAL = 8,
} mobile_app_error_t;

typedef enum {
	MOBILE_APP_STATUS_UNKNOWN = 0,
	MOBILE_APP_STATUS_PAUSED = 1,
	MOBILE_APP_STATUS_RESUMED = 2,
} mobile_app_status_t;

int websocket_app_callback(struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len);
