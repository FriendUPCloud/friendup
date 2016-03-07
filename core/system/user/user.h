/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __USER_USER_H__
#define __USER_USER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/sql_defs.h>
#include <system/user/user_application.h>
#include "user_group.h"
#include <system/handler/file.h>
#include <libwebsockets.h>
#include <network/websocket_client.h>

/*
CREATE TABLE IF NOT EXISTS `FriendMaster.FUser` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `FullName` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `LoggedTime` bigint(32) NOT NULL,
  `CreatedTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

typedef struct User
{
	struct MinNode                   node;
	ULONG                            u_ID;
	char                             *u_Name;
	char                             *u_Password;
	char                             *u_FullName;
	char                             *u_Email;
	int                              u_Error;            // if error

	char                             *u_SessionID;       // session id
	time_t                           u_LoggedTime;       // last login/auth time
	time_t                           u_CreatedTime;
	
	File									*u_MountedDevs;     // root file]
	File 									*u_WebDAVDevs;		// shared webdav resources 
	
	UserGroup                        **u_Groups;         // pointer to groups
	UserApplication                  **u_Applications;   // pointer to application settings
	
	WebsocketClient				*u_WSConnections;
	
	BOOL								u_InitialDevMount;
} User;

static ULONG UserDesc[] = { 
    SQLT_TABNAME, (ULONG)"FUser",       SQLT_STRUCTSIZE, sizeof( struct User ), 
	SQLT_IDINT,   (ULONG)"ID",          offsetof( struct User, u_ID ), 
	SQLT_STR,     (ULONG)"Name",        offsetof( struct User, u_Name ),
	SQLT_STR,     (ULONG)"Password",    offsetof( struct User, u_Password ),
	SQLT_STR,     (ULONG)"Fullname",    offsetof( struct User, u_FullName ),
	SQLT_STR,     (ULONG)"Email",       offsetof( struct User, u_Email ),
	SQLT_STR,     (ULONG)"SessionID",   offsetof( struct User, u_SessionID ),
	SQLT_INT,     (ULONG)"LoggedTime",  offsetof( struct User, u_LoggedTime ),
	SQLT_INT,     (ULONG)"CreatedTime", offsetof( struct User, u_CreatedTime ),
	SQLT_NODE,    (ULONG)"node",        offsetof( struct User, node ),
	SQLT_END 
};

#endif // __USER_USER_H__
