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

/**
 *  @file device_handling.h
 *  Device handling header
 *
 *  @author PS (Pawel Stefanski)
 *  @date 2015
 */

#ifndef __SYSTEM_DEVICE_HANDLING_H__
#define __SYSTEM_DEVICE_HANDLING_H__

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

File *GetUserDeviceByUserID( SystemBase *l, MYSQLLibrary *sqllib, FULONG uid, const char *devname );

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

int MountDoorByRow( SystemBase *l, User *usr, MYSQL_ROW row, User *mountUser );

//
//
//

int CheckAndMountWorkgroupDrive( SystemBase *l, char *type, User *usr, FUQUAD id, int mounted );

//
//
//

int RefreshUserDrives( SystemBase *l, User *u, BufString *bs );

//
// find comma and return position
//

inline int ColonPosition( const char *c )
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

/**
 * Get root device by name
 *
 * @param usr user to which device belong
 * @param devname device name
 * @return pointer to device (File *)
 */

inline File *GetRootDeviceByName( User *usr, char *devname )
{
	//
	// Check mounted devices for user
	
	if( usr == NULL )
	{
		FERROR("GetRootDEviceByName: user == NULL\n");
		return NULL;
	}

	File *lDev = usr->u_MountedDevs;
	File *actDev = NULL;
	
	if( !usr->u_MountedDevs )
	{
		FERROR( "Looks like we have NO mounted devs..\n" );
	}
	
	while( lDev != NULL )
	{
		//DEBUG("Checking dev act ptr %p next ptr %p\n", lDev, lDev->node.mln_Succ ); 
		//INFO("devname %s  ldevname %s lfile (%s)\n", devname, lDev->f_Name, lDev->f_Mounted ? "mounted" : "not mounted" );
		
		if( lDev->f_Name && strcmp( devname, lDev->f_Name ) == 0 ) //&& lDev->f_Mounted == TRUE )
		{
			if( lDev->f_SharedFile == NULL )
			//if( usr == lDev->f_User )		// if its our current user then we compare name
			{
				actDev = lDev;
			}
			else
			{
				actDev = lDev->f_SharedFile;
			}
			INFO("Found file name '%s' path '%s' (%s)\n", actDev->f_Name, actDev->f_Path, actDev->f_FSysName );
			break;
		}
		
		lDev = (File *)lDev->node.mln_Succ;
	}
	
	if( actDev == NULL )
	{
		FERROR( "Cannot find mounted device by name: %s\n", devname );
	}
	
	return actDev;
}

#endif // __SYSTEM_DEVICE_HANDLING_H__
