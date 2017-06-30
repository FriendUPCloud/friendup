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
 *  User Group
 *
 * file contain definitions related to user groups
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __USER_GROUP_H__
#define __USER_GROUP_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/sql_defs.h>
#include <stddef.h>

/*

CREATE TABLE `FUserToGroup` (
 `UserID` bigint(20) NOT NULL,
 `UserGroupID` bigint(20) NOT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
*/

/*
CREATE TABLE `FUserGroup` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `Name` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

typedef struct UserGroup
{
	struct MinNode 		node;
	FULONG 					ug_ID;
	char 						*ug_Name;
	FULONG 					ug_UserID;
	char 						*ug_Type;
}UserGroup;

//#pragma GCC diagnostic push
//#pragma GCC diagnostic ignored " -Wconversion"

//GCC_DIAG_OFF(int-to-pointer-cast);

static FULONG GroupDesc[] = { SQLT_TABNAME, (FULONG)"FUserGroup", SQLT_STRUCTSIZE, sizeof( struct UserGroup ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( struct UserGroup, ug_ID ), 
	SQLT_INT, (FULONG)"UserID", offsetof( struct UserGroup, ug_UserID ),
	SQLT_STR, (FULONG)"Name", offsetof( struct UserGroup, ug_Name ),
	SQLT_STR, (FULONG)"Type", offsetof( struct UserGroup, ug_Type ),
	SQLT_NODE, (FULONG)"node", offsetof( struct UserGroup, node ),
	SQLT_END };
	
//GCC_DIAG_ON(int-to-pointer-cast);
//#pragma GCC diagnostic pop

//
//
//

UserGroup *UserGroupNew( FULONG id, char *name, FULONG uid, char *type );

//
//
//

int UserGroupDelete( UserGroup *ug );

//
//
//

int UserGroupDeleteAll(UserGroup* ug);

#endif // __USER_GROUP_H__
