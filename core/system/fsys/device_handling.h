/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file device_handling.h
 *  Device handling header
 *
 *  @author PS (Pawel Stefanski)
 *  @date 2015
 */

#ifndef __SYSTEM_FSYS_DEVICE_HANDLING_H__
#define __SYSTEM_FSYS_DEVICE_HANDLING_H__

#include <core/types.h>
#include <core/library.h>
#include <system/user/user_session.h>
#include <system/fsys/dosdriver.h>
//#include <system/systembase.h>

//
// Device Manager
//

typedef struct DeviceManager
{
	void				*dm_SB;
	pthread_mutex_t		dm_Mutex;
}DeviceManager;

//
//
//

DeviceManager *DeviceManagerNew( void *sb );

//
//
//

void DeviceManagerDelete( DeviceManager *dm );

//
//
//

int RescanHandlers( DeviceManager *dm );

//
//
//

int RescanDOSDrivers( DeviceManager *dm );

//
//
//

int UnMountFS( DeviceManager *dm, struct TagItem *tl, UserSession *usr );

//
//
//

int MountFS( DeviceManager *dm, struct TagItem *tl, File **mfile, User *usr, char **error );

//
//
//

int UserGroupDeviceMount( DeviceManager *dm, SQLLibrary *sqllib, UserGroup *usrgrp, User *usr, char **error );

//
//
//

int MountFSNoUser( DeviceManager *dm, struct TagItem *tl, File **mfile, char **error );

//
//
//

File *GetFileByPath( User *usr, char **dstpath, const char *path );

//
//
//

int DeviceMountDB( DeviceManager *dm, File *rootDev, FBOOL mount );

//
//
//

File *GetUserDeviceByUserID( DeviceManager *dm, SQLLibrary *sqllib, FULONG uid, const char *devname, char **error );

//
//
//

void UserNotifyFSEvent( DeviceManager *dm, char *evt, char *path );

//
//
//

void UserNotifyFSEvent2( DeviceManager *dm, User *u, char *evt, char *path );

//
//
//

int MountDoorByRow( DeviceManager *dm, User *usr, char **row, User *mountUser );

//
//
//

int CheckAndMountWorkgroupDrive( DeviceManager *dm, char *type, User *usr, FUQUAD id, int mounted );

//
//
//

int RefreshUserDrives( DeviceManager *dm, User *u, BufString *bs, char **error );

//
//
//

int DeviceRelease( DeviceManager *dm, File *rootDev );

//
//
//

int DeviceUnMount( DeviceManager *dm, File *rootDev, User *usr );

//
// find comma and return position
//

static inline int ColonPosition( const char *c )
{
	int res = 0;
	unsigned int i;
	
	for( i=0 ; i < strlen( c ) ; i++ )
	{
		if( c[ i ] == ':' )
		{
			return i;
		}
	}
	
	return res;
}

//
//
//

File *GetRootDeviceByName( User *usr, char *devname );

#endif // __SYSTEM_FSYS_DEVICE_HANDLING_H__
