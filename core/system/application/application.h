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


#ifndef __APPLICATION_H__
#define __APPLICATION_H__

#include <time.h>
#include <core/types.h>
#include <mysql/mysqllibrary.h>
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
	//MYSQL_TIME 		a_DateCreated;		//
	//MYSQL_TIME 		a_DateInstalled;	//
	MinNode 			node;
}Application;


static FULONG ApplicationDesc[] = { SQLT_TABNAME, (FULONG)"FApplication", SQLT_STRUCTSIZE, sizeof( struct Application ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( struct Application, a_ID ), 
	SQLT_IDINT, (FULONG)"UserID", offsetof( struct Application, a_UserID ), 
	SQLT_STR, (FULONG)"Name", offsetof( struct Application, a_Name ),
	SQLT_STR, (FULONG)"InstallPath", offsetof( struct Application, a_InstallPath ),
	SQLT_STR, (FULONG)"Permissions", offsetof( struct Application, a_Permissions ),
	SQLT_STR, (FULONG)"DateInstalled", offsetof( struct Application, a_DateInstalled ),
	SQLT_STR, (FULONG)"DateModified", offsetof( struct Application, a_DateModified ),
	SQLT_STR, (FULONG)"Config", offsetof( struct Application, a_Config ),
	SQLT_NODE, (FULONG)"node", offsetof( struct Application, node ),
	SQLT_END };

#endif //__APPLICATION_H__
