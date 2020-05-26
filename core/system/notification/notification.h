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
 * Definition of Notification
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (03/12/2018)
 */

#ifndef __SYSTEM_NOTIFICATION_NOTIFICATION_H__
#define __SYSTEM_NOTIFICATION_NOTIFICATION_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>
#include "notification_sent.h"

enum {
	NOTIFY_ACTION_REGISTER = 0,
	NOTIFY_ACTION_READ,
	NOTIFY_ACTION_TIMEOUT,
	NOTIFY_MAX
};

static char *NotifyActionType[] =
{
	"register",
	"read",
	"timeout"
};

/*

 CREATE TABLE IF NOT EXISTS `FNotification` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Channel` varchar(255),
   `Content` varchar(255),
   `Title` varchar(255),
   `Extra` varchar(255),
   `Application` varchar(255),
   `UserName` varchar(255),
   `Created` bigint(20) NOT NULL,
   `Type` bigint(6) NOT NULL,
   `Status` bigint(6) NOT NULL,
   `OriginalCTimestamp` bigint(20),
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

*/

typedef struct Notification
{
	struct MinNode 			node;
	FULONG 					n_ID;					// id
	char 					*n_Channel;			// Token ID
	char					*n_Content;		// User Session ID
	char					*n_Title;
	char					*n_Extra;				// user id
	char					*n_Application;				// pointer to User
	char					*n_UserName;		// user name which 
	time_t					n_Created;			// date created
	int						n_Status;			// status of notification
	int						n_NotificationType;	// type of notification
	FULONG					n_OriginalCreateT;	// original date of creation
	NotificationSent		*n_NotificationsSent;	// pointer to list of notificationssent structures 
}Notification;



//
// Notification
//

Notification *NotificationNew( );

// Init Notification

void NotificationInit( Notification *n );

// release Notification

void NotificationDelete( Notification *n );

// release Notification All

void NotificationDeleteAll( Notification *n );

//"{\"t\":\"notify\",\"channel\":\"%s\",\"content\":\"%s\",\"title\":\"%s\",\"extra\":\"%s\",\"application\":\"%s\"}", escaped_channel_id, escaped_message, escaped_title, escaped_extra_string, escaped_app );

static FULONG NotificationDesc[] = { SQLT_TABNAME, (FULONG)"FNotification", SQLT_STRUCTSIZE, sizeof( struct Notification ),
	SQLT_IDINT, (FULONG)"ID", offsetof( Notification, n_ID ),
	SQLT_STR, (FULONG)"Channel", offsetof( Notification, n_Channel ),
	SQLT_STR, (FULONG)"Content", offsetof( Notification, n_Content ),
	SQLT_STR, (FULONG)"Title", offsetof( Notification, n_Title ),
	SQLT_STR, (FULONG)"Extra", offsetof( Notification, n_Extra ),
	SQLT_STR, (FULONG)"Application", offsetof( Notification, n_Application ),
	SQLT_STR, (FULONG)"UserName", offsetof( Notification, n_UserName ),
	SQLT_INT, (FULONG)"Created", offsetof( Notification, n_Created ),
	SQLT_INT, (FULONG)"Status", offsetof( Notification, n_Status ),
	SQLT_INT, (FULONG)"Type", offsetof( Notification, n_NotificationType ),
	SQLT_INT, (FULONG)"OriginalCTimestamp", offsetof( Notification, n_OriginalCreateT ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&NotificationInit,
	SQLT_NODE, (FULONG)"node", offsetof( Notification, node ),
	SQLT_END };

#endif //__SYSTEM_NOTIFICATION_NOTIFICATION_H__

