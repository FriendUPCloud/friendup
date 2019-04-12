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
 *  Mobile Application Connection
 *
 * file contain definitions related to MobileAppConnection
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19/12/2018
 */

#ifndef __SYSTEM_MOBILE_MOBILE_APP_CONNECTION_H__
#define __SYSTEM_MOBILE_MOBILE_APP_CONNECTION_H__

#include <core/types.h>

#include <util/friendqueue.h>
#include <libwebsockets.h>
#include <system/user/user_mobile_app.h>
#include <mobile_app/mobile_app_websocket.h>

#define MAX_CONNECTIONS_PER_USER 5

//
// Mobile Application global structure
//

typedef struct MobileAppConnection
{
	struct lws											*mac_WebsocketPtr;
	void												*mac_UserData;
	char												*mac_SessionID;
	void												*mac_UserSession;
	FQueue												mac_Queue;
	pthread_mutex_t										mac_Mutex;
	time_t												mac_LastCommunicationTimestamp;
	//UserMobileAppConnectionsT							*mac_UserConnections;
	void												*mac_UserConnections;
	unsigned int										mac_UserConnectionIndex;
	mobile_app_status_t									mac_AppStatus;
	time_t												mac_MostRecentResumeTimestamp;
	time_t												mac_MostRecentPauseTimestamp;
	UserMobileApp										*mac_UserMobileApp;
	FULONG												mac_UserMobileAppID;
	int													mac_Used;
	//FULONG												mac_UMAID;
}MobileAppConnection;

//
// single user connection structure
//

typedef struct UserMobileAppConnections
{
	char					*umac_Username;
	FULONG					umac_UserID;
	MobileAppConnection		*umac_Connection[ MAX_CONNECTIONS_PER_USER ];
	MinNode					node;
	int						umac_InUse;
}UserMobileAppConnections;

//
//
//

MobileAppConnection *MobileAppConnectionNew( void *wsi, FULONG umaID, void *userSession );

//
//
//

void MobileAppConnectionDelete( MobileAppConnection *mac );

#endif //__SYSTEM_MOBILE_MOBILE_APP_CONNECTION_H__


