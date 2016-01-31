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


#ifndef __APPLICATION_H__
#define __APPLICATION_H__

#include <time.h>
#include <core/types.h>
#include <mysql/mysqllibrary.h>
#include "app_category.h"
#include "app_permission.h"

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
	ULONG 				*a_ID;
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


static ULONG ApplicationDesc[] = { SQLT_TABNAME, (ULONG)"FApplication", SQLT_STRUCTSIZE, sizeof( struct Application ), 
	SQLT_IDINT, (ULONG)"ID", offsetof( struct Application, a_ID ), 
	SQLT_IDINT, (ULONG)"UserID", offsetof( struct Application, a_UserID ), 
	SQLT_STR, (ULONG)"Name", offsetof( struct Application, a_Name ),
	SQLT_STR, (ULONG)"InstallPath", offsetof( struct Application, a_InstallPath ),
	SQLT_STR, (ULONG)"Permissions", offsetof( struct Application, a_Permissions ),
	SQLT_STR, (ULONG)"DateInstalled", offsetof( struct Application, a_DateInstalled ),
	SQLT_STR, (ULONG)"DateModified", offsetof( struct Application, a_DateModified ),
	SQLT_STR, (ULONG)"Config", offsetof( struct Application, a_Config ),
	SQLT_NODE, (ULONG)"node", offsetof( struct Application, node ),
	SQLT_END };

#endif //__APPLICATION_H__
