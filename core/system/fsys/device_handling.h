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
#include <system/systembase.h>

int RescanHandlers( SystemBase *l );

//
//
//

int RescanDOSDrivers( SystemBase *l );

//
//
//

int UnMountFS( struct SystemBase *l, struct TagItem *tl, UserSession *usr );

//
//
//

int MountFS( struct SystemBase *l, struct TagItem *tl, File **mfile, User *usr );

//
//
//

int UserGroupDeviceMount( SystemBase *l, SQLLibrary *sqllib, UserGroup *usrgrp, User *usr );

//
//
//

int MountFSNoUser( struct SystemBase *l, struct TagItem *tl, File **mfile );

//
//
//

File *GetFileByPath( User *usr, char **dstpath, const char *path );

//
//
//

int DeviceMountDB( SystemBase *l, File *rootDev, FBOOL mount );

//
//
//

File *GetUserDeviceByUserID( SystemBase *l, SQLLibrary *sqllib, FULONG uid, const char *devname );

//
//
//

void UserNotifyFSEvent( struct SystemBase *b, char *evt, char *path );

//
//
//

void UserNotifyFSEvent2( SystemBase *sb, User *u, char *evt, char *path );

//
//
//

int MountDoorByRow( SystemBase *l, User *usr, char **row, User *mountUser );

//
//
//

int CheckAndMountWorkgroupDrive( SystemBase *l, char *type, User *usr, FUQUAD id, int mounted );

//
//
//

int RefreshUserDrives( SystemBase *l, User *u, BufString *bs );

//
//
//

int DeviceRelease( SystemBase *l, File *rootDev );

//
//
//

int DeviceUnMount( SystemBase *l, File *rootDev, User *usr );

//
// find comma and return position
//

static inline int ColonPosition( const char *c )
{
	int res = 0;
	
	for( unsigned int i=0 ; i < strlen( c ) ; i++ )
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
