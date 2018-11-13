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
 *  User application permissions definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __USER_APP_PERMISSION_H__
#define __USER_APP_PERMISSION_H__

#include <core/types.h>
#include <core/nodes.h>
#include <dictionary/dictionary.h>
//#include <permission/app_permission.h>

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
	FULONG 						uap_ID;
	FULONG 						uap_UserApplicationID;
	FULONG 						uap_UserPermissionID;
	FULONG 						uap_UserAcccesTypeID;
}UserAppPermission;

#endif // __USER_APP_PERMISSION_H__
