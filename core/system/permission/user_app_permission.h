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
