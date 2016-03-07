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

#ifndef __APP_PERMISSION_H__
#define __APP_PERMISSION_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/dictionary/dictionary.h>

/*
 
 CREATE TABLE IF NOT EXISTS `FriendMaster.FAppPermission` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `DictID` bigint(20),
   `Name` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

 */

typedef struct AppPermission
{
	struct MinNode 		node;
	ULONG 					p_ID;					// id of permission
	ULONG 					p_DictID;				// ID from dictionary ID
	Dictionary				*p_Dict;				// pointer to dictionary entry
	char 	 					*p_Name;			// pointer to string from dictionary
}AppPermission;

static ULONG AppPermissionDesc[] = { SQLT_TABNAME, (ULONG)"FAppPermission", SQLT_STRUCTSIZE, sizeof( struct AppPermission ), 
	SQLT_IDINT, (ULONG)"ID", offsetof( struct AppPermission, p_ID ), 
	SQLT_INT,(ULONG) "DictID", offsetof( struct AppPermission, p_DictID ),
	SQLT_STR, (ULONG)"Name", offsetof( struct AppPermission, p_Name ),
	SQLT_NODE, (ULONG)"node", offsetof( struct AppPermission, node ),
	SQLT_END };


#endif //__APP_PERMISSION_H__
