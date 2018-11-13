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
 *  Application Permission
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

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
	struct MinNode 			node;
	FULONG 					p_ID;					// id of permission
	FULONG 					p_DictID;				// ID from dictionary ID
	Dictionary				*p_Dict;				// pointer to dictionary entry
	char 	 				*p_Name;			// pointer to string from dictionary
}AppPermission;

//static FULONG AppPermissionDesc[] = { SQLT_TABNAME, (FULONG)"FAppPermission", SQLT_STRUCTSIZE, sizeof( struct AppPermission ),
//	SQLT_IDINT, (FULONG)"ID", offsetof( struct AppPermission, p_ID ),
//	SQLT_INT,(FULONG) "DictID", offsetof( struct AppPermission, p_DictID ),
//	SQLT_STR, (FULONG)"Name", offsetof( struct AppPermission, p_Name ),
//	SQLT_NODE, (FULONG)"node", offsetof( struct AppPermission, node ),
//	SQLT_END };


#endif //__APP_PERMISSION_H__
