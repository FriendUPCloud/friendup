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


#ifndef __SYSTEM_USER_REMOTE_USER_H__
#define __SYSTEM_USER_REMOTE_USER_H__

#include <core/types.h>
#include <core/nodes.h>

#include <mysql/sql_defs.h>
#include <system/user/user_application.h>
#include <system/handler/file.h>
#include <libwebsockets.h>
#include <network/websocket_client.h>
#include <service/service.h>
#include <hardware/printer/printer.h>
#include <time.h>
#include <service/comm_service.h>
/** @file
 * 
 *  Remote User definition
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

//
// remote drive
//

typedef struct RemoteDrive
{
	MinNode						node;
	char								*rd_Name;
	char								*rd_LocalName;
	char								*rd_RemoteName;
}RemoteDrive;

//
// remote user structure
//

typedef struct RemoteUser
{
	MinNode						node;
	FULONG						ru_ID;
	char								*ru_Name;
	char								*ru_Password;
	char								*ru_Host;

	char								*ru_SessionID;       // session id ,  generated only when user is taken from db
	char								*ru_AuthID; // authentication id
	time_t							ru_Timestamp;       // last action time
	int								ru_ConNumber;		// number of connections
	
	RemoteDrive					*ru_RemoteDrives;	// remote drives
	CommFCConnection		*ru_Connection;		// FC - FC connection
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
