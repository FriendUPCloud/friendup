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
 *  Remote User definition
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#ifndef __SYSTEM_USER_REMOTE_USER_H__
#define __SYSTEM_USER_REMOTE_USER_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <system/fsys/file.h>
#include <libwebsockets.h>
#include <network/websocket_client.h>
#include <system/services/service.h>
#include <hardware/printer/printer.h>
#include <time.h>
#include <communication/comm_service.h>

//
// remote drive
//

typedef struct RemoteDrive
{
	MinNode						node;
	char						*rd_Name;
	char						*rd_LocalName;
	char						*rd_RemoteName;
	FULONG						rd_DriveID;
	FULONG						rd_RemoteID;
}RemoteDrive;

//
// remote user structure
//

typedef struct RemoteUser
{
	MinNode						node;
	FULONG						ru_ID;
	char						*ru_Name;
	char						*ru_Password;
	char						*ru_Host;
	char						ru_FCID[ FRIEND_CORE_MANAGER_ID_SIZE ];		// we must know which server setup connection

	char						*ru_SessionID;       // session id ,  generated only when user is taken from db
	char						*ru_AuthID; // authentication id
	time_t						ru_Timestamp;       // last action time
	int							ru_ConNumber;		// number of connections
	
	RemoteDrive					*ru_RemoteDrives;	// remote drives
	FConnection					*ru_Connection;		// FC - FC connection
} RemoteUser;

//
//
//

RemoteUser *RemoteUserNew( char *name, char *host );

//
//
//

void RemoteUserDelete( RemoteUser *usr );

//
//
//

int RemoteUserDeleteAll( RemoteUser *usr );

//
//
//

RemoteDrive *RemoteDriveNew( char *localName, char *remoteName );

//
//
//

void RemoteDriveDelete( RemoteDrive *rd );

//
//
//

void RemoteDriveDeleteAll( RemoteDrive *rd );

//
//
//

int RemoteDriveAdd( RemoteUser *ru, char *name );

//
//
//

int RemoteDriveRemove( RemoteUser *ru, char *name );

#endif // __SYSTEM_USER_REMOTE_USER_H__
