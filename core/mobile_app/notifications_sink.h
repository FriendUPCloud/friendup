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
 *  NotificationSink
 *
 * file contain definitions related to NotificationSink
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 21/01/2019
 */

#ifndef __MOBILE_APP_NOTIFICATIONS_SINK_H__
#define __MOBILE_APP_NOTIFICATIONS_SINK_H__

#include "notifications_sink_websocket.h"
#include "mobile_app.h"
#include <pthread.h>
#include <util/hashmap.h>
#include <system/json/jsmn.h>
#include <system/systembase.h>
#include <system/user/user_mobile_app.h>

/*
 * Error types
 */

enum {
	WS_NOTIF_SINK_SUCCESS = 0,
	WS_NOTIF_SINK_ERROR_BAD_JSON,
	WS_NOTIF_SINK_ERROR_WS_NOT_AUTHENTICATED,
	WS_NOTIF_SINK_ERROR_NOTIFICATION_TYPE_NOT_FOUND,
	WS_NOTIF_SINK_ERROR_AUTH_FAILED,
	WS_NOTIF_SINK_ERROR_NO_AUTH_ELEMENTS,
	WS_NOTIF_SINK_ERROR_PARAMETERS_NOT_FOUND,
	WS_NOTIF_SINK_ERROR_TOKENS_NOT_FOUND,
	WS_NOTIF_SINK_ERROR_MAX
};


//
// Data Queue WSI Mutex
//

typedef struct DataQWSIM{
	struct lws			*d_Wsi;
	pthread_mutex_t		d_Mutex;
	FQueue				d_Queue;
	FBOOL				d_Authenticated;
	char				*d_ServerName;
}DataQWSIM;

int WriteMessageToServers( DataQWSIM *d, unsigned char *msg, int len );

#endif // __MOBILE_APP_NOTIFICATIONS_SINK_H__
