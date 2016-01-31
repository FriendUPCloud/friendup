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

#ifndef __USER_APP_PERMISSION_H__
#define __USER_APP_PERMISSION_H__

#include <core/types.h>
#include <core/nodes.h>
#include <dictionary/dictionary.h>
#include <permission/app_permission.h>

/*
 

/*
 
 CREATE TABLE IF NOT EXISTS `FriendMaster.FUserAppPermission` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `UserApplicationID` bigint(20),
   `UserPermissionID` bigint(20),
   `UserAccessTypeID` bigint(20),
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

 */


typedef struct UserAppPermission
{
	struct MinNode			node;
	ULONG 						uap_ID;
	ULONG 						uap_UserApplicationID;
	ULONG 						uap_UserPermissionID;
	ULONG 						uap_UserAcccesTypeID;
}UserAppPermission;

#endif // __USER_APP_PERMISSION_H__
