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
 *  Application
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_APPLICATION_APPLICATION_H__
#define __SYSTEM_APPLICATION_APPLICATION_H__

#include <time.h>
#include <core/types.h>
#include <db/sqllib.h>
#include "app_category.h"
#include "app_permission.h"
#include <system/user/user.h>

/*

CREATE TABLE IF NOT EXISTS `Application` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) DEFAULT NULL,
  `API` varchar(255) DEFAULT NULL,
  `Version` varchar(255) DEFAULT NULL,
  `Author` varchar(255) DEFAULT NULL,
  `CategoryId` bigint(20),
  `E-mail` varchar(255) DEFAULT NULL,
  `Description` varchar(512) NOT NULL,
  `PEGI` bigint(20),
  `DateCreated` TIMESTAMP,
  `DateInstalled` TIMESTAMP,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

/*
 {
	"Name": "i18n_Bookmarks",
	"API": "v1.0",
	"Version": "0.1",
	"Author": "Hogne Titlestad",
	"Category": "System/Preferences",
	"E-mail": "hogne@ideverket.no",
	"Permissions": [
		"Storage Local Read/Write",
		"Module System"
	],
	"Description_no": "Et verktøy som holder vedlike dine bokmerker og gir deg muligheten til å knytte til nettverks- og lokale filsystemer."
}
 */

typedef struct Application
{
	FULONG 				*a_ID;
	int					*a_UserID;				// id of owner
	char 				*a_Name;				// Name
	char				*a_InstallPath;		// install path on disk
	char				*a_Permissions;		// Permissions
	char 			    *a_DateInstalled;		//
	char		 	    *a_DateModified;	//
	char				*a_Config;		// Config
	MinNode 			node;
}Application;


static FULONG ApplicationDesc[] = { SQLT_TABNAME, (FULONG)"FApplication", SQLT_STRUCTSIZE, sizeof( struct Application ),
	SQLT_IDINT, (FULONG)"ID", offsetof( struct Application, a_ID ),
	SQLT_INT, (FULONG)"UserID", offsetof( struct Application, a_UserID ),
	SQLT_STR, (FULONG)"Name", offsetof( struct Application, a_Name ),
	SQLT_STR, (FULONG)"InstallPath", offsetof( struct Application, a_InstallPath ),
	SQLT_STR, (FULONG)"Permissions", offsetof( struct Application, a_Permissions ),
	SQLT_STR, (FULONG)"DateInstalled", offsetof( struct Application, a_DateInstalled ),
	SQLT_STR, (FULONG)"DateModified", offsetof( struct Application, a_DateModified ),
	SQLT_STR, (FULONG)"Config", offsetof( struct Application, a_Config ),
	SQLT_NODE, (FULONG)"node", offsetof( struct Application, node ),
	SQLT_END };

#endif //__SYSTEM_APPLICATION_APPLICATION_H__
