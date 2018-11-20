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
 *  Lock    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 6 Feb 2015
 */
#ifndef __SYSTEM_FSYS_HANDLER_DOOR_NOTIFICATTION_H__
#define __SYSTEM_FSYS_HANDLER_DOOR_NOTIFICATTION_H__

#include <core/types.h>
#include <db/sqllib.h>
#include <time.h>
#include <system/systembase.h>
#include "file_permissions.h"
#include <system/user/user_session.h>

//
// Lock types
//

enum
{
	LOCK_READ = 0,
	LOCK_READ_EXCLUSIVE,
	LOCK_WRITE
	//LOCL_WRITE_EXCLUSIVE		// write is always exclusive
};

//
// Lock structure and database description
//

typedef struct DoorNotification
{
	MinNode				node;
	FULONG				dn_ID;
	FULONG 				dn_OwnerID;
	FULONG				dn_DeviceID;
	char				*dn_Path;
	int				dn_Type;
	time_t				dn_LockTime;
	void 				*dn_SB;
}DoorNotification;

//
//
//

static FULONG DoorNotificationDesc[] = { 
	SQLT_TABNAME, (FULONG)"FDoorNotification",       SQLT_STRUCTSIZE, sizeof( struct DoorNotification ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct DoorNotification, dn_ID ),
	SQLT_INT,   (FULONG)"OwnerID",          offsetof( struct DoorNotification, dn_OwnerID ),
	SQLT_INT,   (FULONG)"DeviceID",          offsetof( struct DoorNotification, dn_DeviceID ), 
	SQLT_STR,     (FULONG)"Path",        offsetof( struct DoorNotification, dn_Path ),
	SQLT_INT,     (FULONG)"Type", offsetof( struct DoorNotification, dn_Type ),
	SQLT_INT,     (FULONG)"Time", offsetof( struct DoorNotification, dn_LockTime ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct DoorNotification, node ),
	SQLT_END 
};

/*
 CREATE TABLE `FDoorNotification` (
 `ID` bigint(32) NOT NULL AUTO_INCREMENT,
 `OwnerID` bigint(32) NOT NULL,
 `DeviceID` bigint(32) NOT NULL,
 `Path` text DEFAULT NULL,
 `Type` bigint(2) NOT NULL,
 `Time` bigint(32) NOT NULL,
 PRIMARY KEY (`ID`)
 ) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */

DoorNotification *DoorNotificationNew( );

//
// Free DoorNotification from memory
//

void DoorNotificationDelete( DoorNotification *lck );

//
// Free all DoorNotifications from memory
//

void DoorNotificationDeleteAll( DoorNotification *lck );

//
// Lock path in DB
//

FULONG DoorNotificationStartDB( SQLLibrary *sqllib, File *device, UserSession *ses, char *path, int type );

//
// Update FFileLock table
//

int DoorNotificationUpdateDB( SQLLibrary *sqllib, File *device, char *path, FULONG id );

//
// Remove lock from database
//

int DoorNotificationRemoveDB( SQLLibrary *sqllib, FULONG id );

//
// Get all locks set on path
//

DoorNotification *DoorNotificationGetNotificationsFromPath( SQLLibrary *sqllib, File *device, char *path );

//
// Communicate changes on path
//

int DoorNotificationCommunicateChanges( void *lsb, UserSession *ses, File *device, char *path );

//
// Remove old DoorNotifications from DB
//

int DoorNotificationRemoveEntries( void *lsb );

//
// Remove old entries from DB
//

int DoorNotificationRemoveEntries( void *lsb );

//
// Remove old entries from DB by User
//

int DoorNotificationRemoveEntriesByUser( void *lsb, FULONG uid );

//
// Notify that disks have changed
//

int DoorNotificationCommunicateDiskUpdate( void *lsb, User *owner, UserSession *sessions, File *device );


#endif // __SYSTEM_FSYS_HANDLER_DOOR_NOTIFICATTION_H__
