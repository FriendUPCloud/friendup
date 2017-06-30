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
 *  File permissions    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 28 Nov 2016
 */

#ifndef __SYSTEM_HANDLER_FILE_PERMISSIONS_H__
#define __SYSTEM_HANDLER_FILE_PERMISSIONS_H__

#include <core/types.h>
//#include <system/handler/file.h>
#include <core/nodes.h>
#include <mysql/mysqllibrary.h>

typedef struct UGAccessEl
{
	MinNode 				node;
	//UserGroup			*uga_Group;					// which user groups have access
	void						*uga_Group;					// which user groups have access
	char 					uga_Access[ 5 ];	// user group access rights
}UGAccessEl;

typedef struct UAccessEl
{
	MinNode 				node;
	//User 					*ua_User;					// which users have access
	void 						*ua_User;					// which users have access
	char						ua_Access[ 5 ]; // user access rights
}UAccessEl;


//
// Database structure
//

enum 
{
	ACCESS_TYPE_USER = 0,
	ACCESS_TYPE_GROUP,		// 1
	ACCESS_TYPE_OTHER		// 2
};

//
// current version support only access to:
// user - owner
// group - all his groups
// others - other people
//

//
// Lock structure and database description
//

typedef struct FilePermission
{
	MinNode					node;
	FULONG					fp_ID;
	FULONG 					fp_DeviceID;
	char							*fp_Path;
	
	UGAccessEl				*fp_GroupAccess;			// group access list
	//UAccessEl				*fl_UserAccess;				// user access list
	char							fp_UserAccess[ 5 ]; // user access rights
	char							fp_OtherAccess[ 5 ]; // other access rights
}FilePermission;

//
//
//

static FULONG FilePermissionDesc[] = { 
    SQLT_TABNAME, (FULONG)"FFilePermission",       SQLT_STRUCTSIZE, sizeof( struct FilePermission ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct FilePermission, fp_ID ),							// points to user/group
	SQLT_INT,   (FULONG)"DeviceID",          offsetof( struct FilePermission, fp_DeviceID ), 
	SQLT_STR,     (FULONG)"Path",        offsetof( struct FilePermission, fp_Path ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct FilePermission, node ),
	SQLT_END
};

/*
 CREATE TABLE `FFilePermission` (
 `ID` bigint(32) NOT NULL AUTO_INCREMENT,
 `DeviceID` bigint(32) NOT NULL,
 `Path` text DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

ALTER TABLE `FFilePermission` ADD FULLTEXT(`Path`);
 */
//SELECT * FROM `FFilePermission` WHERE MATCH(`Path`) AGAINST('stefkos');

/*
static FULONG FPermLinkDesc[] = { 
    SQLT_TABNAME, (FULONG)"FPermLink",       SQLT_STRUCTSIZE, sizeof( struct FilePermission ), 
	SQLT_INT,     (FULONG)"PermissionID", offsetof( struct FilePermission, l_PermID ),
	SQLT_INT,     (FULONG)"ObjectID", offsetof( struct FilePermission, ID ),
	SQLT_INT,     (FULONG)"Type", offsetof( struct FilePermission, l_Type ),
	SQLT_STR,     (FULONG)"Access", offsetof( struct FilePermission, Acceess ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct FilePermission, node ),
	SQLT_END 
};
*/

/*
CREATE TABLE `FPermLink` (
 `PermissionID` bigint(32) NOT NULL,
 `ObjectID` bigint(32),
 `Type` int(3) NOT NULL,
 `Access` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ;
*/

//
//
//

FilePermission *FilePermissionNew();

//
//
//

void FilePermissionDelete( FilePermission *fp );

#endif // __SYSTEM_HANDLER_FILE_PERMISSIONS_H__
