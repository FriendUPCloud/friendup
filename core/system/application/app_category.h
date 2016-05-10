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

#ifndef __DICT_APP_CATEGORY_H__
#define __DICT_APP_CATEGORY_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/dictionary/dictionary.h>

/*
 CREATE TABLE IF NOT EXISTS `FriendMaster.FAppCategory` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `DictID` bigint(20),
   `Name` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */


typedef struct AppCategory
{
	struct MinNode 		node;
	ULONG 					ac_ID;				// id of cathegory
	ULONG 					ac_DictID;		// ID from dictionary ID
	Dictionary				*ac_Dict;
	char 						*ac_Name;			// pointer to string from dictionary
	
}AppCategory;

static ULONG AppCategoryDesc[] = { SQLT_TABNAME, (ULONG)"FAppCategory", SQLT_STRUCTSIZE, sizeof( struct AppCategory ), 
	SQLT_IDINT, (ULONG)"ID", offsetof( struct AppCategory, ac_ID ), 
	SQLT_INT,(ULONG) "DictID", offsetof( struct AppCategory, ac_DictID ),
	SQLT_STR, (ULONG)"Name", offsetof( struct AppCategory, ac_Name ),
	SQLT_NODE, (ULONG)"node", offsetof( struct AppCategory, node ),
	SQLT_END };

#endif //__DICT_APP_CATEGORY_H__