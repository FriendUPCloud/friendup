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
 *  User Mobile Application
 *
 * file contain definitions related to user mobile application
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 07/09/2018
 */

#ifndef __SYSTEM_USER_USERMOBILEAPP_H__
#define __SYSTEM_USER_USERMOBILEAPP_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <network/websocket_client.h>
#include <system/user/user.h>
#include <websockets/websocket_req_manager.h>
#include <util/friendqueue.h>

//
//
//

enum {
	USER_MOBILE_APP_STATUS_APPROVED = 0,
	USER_MOBILE_APP_STATUS_BLOCKED
};

//
//
//

typedef struct UserMobileApp
{
	MinNode			node;
	FULONG			uma_ID;
	FULONG			uma_UserID;
	User			*uma_User;
	char			*uma_AppToken;
	char			*uma_DeviceID;
	char			*uma_AppVersion;
	char			*uma_Platform;
	char			*uma_PlatformVersion;
	char			*uma_Core;
	time_t			uma_CreateTS;
	time_t			uma_LastStartTS;
	int				uma_Status;
	
	WebsocketClient	*uma_WSClient;
}UserMobileApp;

//
//
//

UserMobileApp *UserMobileAppNew();

//
//
//

void UserMobileAppDelete( UserMobileApp *app );

//
//
//

void UserMobileAppDeleteAll( UserMobileApp *app );

//
//
//

void UserMobileAppInit( UserMobileApp *app );

/*
CREATE TABLE IF NOT EXISTS `FUserMobileApp` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(32) NOT NULL,
  `AppToken` varchar(255) DEFAULT NULL,
  `DeviceID` varchar(255) DEFAULT NULL,
  `AppVersion` varchar(255) DEFAULT NULL,
  `Platform` varchar(255) DEFAULT NULL,
  `PlatformVersion` varchar(255) DEFAULT NULL,
  `Core` varchar(255) DEFAULT NULL,
  `CreateTS` bigint(32) NOT NULL,
  `LastStartTS` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

static FULONG UserMobileAppDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserMobileApp",       
    SQLT_STRUCTSIZE, sizeof( struct UserMobileApp ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserMobileApp, uma_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserMobileApp, uma_UserID ),
	SQLT_STR,     (FULONG)"AppToken",       offsetof( struct UserMobileApp, uma_AppToken ),
	SQLT_STR,     (FULONG)"DeviceID",       offsetof( struct UserMobileApp, uma_DeviceID ),
	SQLT_STR,     (FULONG)"AppVersion",   offsetof( struct UserMobileApp, uma_AppVersion ),
	SQLT_STR,     (FULONG)"Platform",   offsetof( struct UserMobileApp, uma_Platform ),
	SQLT_STR,     (FULONG)"PlatformVersion",   offsetof( struct UserMobileApp, uma_PlatformVersion ),
	SQLT_STR,     (FULONG)"Core",   offsetof( struct UserMobileApp, uma_Core ),
	SQLT_INT,     (FULONG)"CreateTS", offsetof( struct UserMobileApp, uma_CreateTS ),
	SQLT_INT,     (FULONG)"LastStartTS", offsetof( struct UserMobileApp, uma_LastStartTS ),
	SQLT_INT,     (FULONG)"Status", offsetof( struct UserMobileApp, uma_Status ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&UserMobileAppInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserMobileApp, node ),
	SQLT_END 
};

#endif // __SYSTEM_USER_USERMOBILEAPP_H__
