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
 *  Application Cathegory
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

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
	struct MinNode 			node;
	FULONG 					ac_ID;				// id of cathegory
	FULONG 					ac_DictID;		// ID from dictionary ID
	Dictionary				*ac_Dict;
	char 					*ac_Name;			// pointer to string from dictionary
	
}AppCategory;

//static FULONG AppCategoryDesc[] = { SQLT_TABNAME, (FULONG)"FAppCategory", SQLT_STRUCTSIZE, sizeof( struct AppCategory ),
//	SQLT_IDINT, (FULONG)"ID", offsetof( struct AppCategory, ac_ID ),
//	SQLT_INT,(FULONG) "DictID", offsetof( struct AppCategory, ac_DictID ),
//	SQLT_STR, (FULONG)"Name", offsetof( struct AppCategory, ac_Name ),
//	SQLT_NODE, (FULONG)"node", offsetof( struct AppCategory, node ),
//	SQLT_END };

#endif //__DICT_APP_CATEGORY_H__
