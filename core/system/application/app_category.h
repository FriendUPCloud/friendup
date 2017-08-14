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
	FULONG 					ac_ID;				// id of cathegory
	FULONG 					ac_DictID;		// ID from dictionary ID
	Dictionary				*ac_Dict;
	char 						*ac_Name;			// pointer to string from dictionary
	
}AppCategory;

static FULONG AppCategoryDesc[] = { SQLT_TABNAME, (FULONG)"FAppCategory", SQLT_STRUCTSIZE, sizeof( struct AppCategory ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( struct AppCategory, ac_ID ), 
	SQLT_INT,(FULONG) "DictID", offsetof( struct AppCategory, ac_DictID ),
	SQLT_STR, (FULONG)"Name", offsetof( struct AppCategory, ac_Name ),
	SQLT_NODE, (FULONG)"node", offsetof( struct AppCategory, node ),
	SQLT_END };

#endif //__DICT_APP_CATEGORY_H__