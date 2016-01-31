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

#ifndef __DICTIONARY_DICTIONARY_H__
#define __DICTIONARY_DICTIONARY_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/mysqllibrary.h>
#include <stddef.h>

/*
 CREATE TABLE IF NOT EXISTS `FDictionary` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `CategoryID` bigint(20),
   `Name` varchar(255) DEFAULT NULL,
   `Language` varchar(10) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */


typedef struct Dictionary
{
	struct MinNode 		node;
	ULONG 					d_ID;				// id of cathegory
	ULONG 					d_CategoryID;
	char 						*d_Name;			// name of category
	char							*d_Lang;			// language
}Dictionary;

//
// Category numbers
//

enum Category{
	APP_PERM =0,
	APP_CATEGORY = 1,
	ERROR_STRING =2
};


static ULONG DictionaryDesc[] = { SQLT_TABNAME, (ULONG)"FDictionary", SQLT_STRUCTSIZE, sizeof( struct Dictionary ), 
	SQLT_IDINT, (ULONG)"ID", offsetof( Dictionary, d_ID ), 
	SQLT_STR, (ULONG)"CategoryID", offsetof( Dictionary, d_CategoryID ),
	SQLT_STR, (ULONG)"Name", offsetof( Dictionary, d_Name ),
	SQLT_STR, (ULONG)"Language", offsetof( Dictionary, d_Lang ),
	SQLT_NODE, (ULONG)"node", offsetof( struct Dictionary, node ),
	SQLT_END };
	

// Load dictionary from DB
	
Dictionary *DictionaryNew( struct MYSQLLibrary *mysqllib );

// release dictionary

void DictionaryDelete( Dictionary *d );

#endif //__DICTIONARY_DICTIONARY_H__
