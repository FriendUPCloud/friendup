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
/**
 * @file
 *
 * Definition of  dictionary
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#ifndef __DICTIONARY_DICTIONARY_H__
#define __DICTIONARY_DICTIONARY_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>

/*
 CREATE TABLE IF NOT EXISTS `FDictionary` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `CategoryID` bigint(20),
   `Message` text DEFAULT NULL,
   `Language` varchar(10) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 
 CREATE TABLE IF NOT EXISTS  `FCategory` (
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Name` varchar(255) DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */


typedef struct Dictionary
{
	struct MinNode 		node;
	FULONG 					d_ID;				// id of cathegory
	FULONG 					d_CategoryID;
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


static FULONG DictionaryDesc[] = { SQLT_TABNAME, (FULONG)"FDictionary", SQLT_STRUCTSIZE, sizeof( struct Dictionary ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( Dictionary, d_ID ), 
	SQLT_STR, (FULONG)"CategoryID", offsetof( Dictionary, d_CategoryID ),
	SQLT_STR, (FULONG)"Message", offsetof( Dictionary, d_Name ),
	SQLT_STR, (FULONG)"Language", offsetof( Dictionary, d_Lang ),
	SQLT_NODE, (FULONG)"node", offsetof( struct Dictionary, node ),
	SQLT_END };
	

// Load dictionary from DB
	
Dictionary *DictionaryNew( struct SQLLibrary *mysqllib );

// release dictionary

void DictionaryDelete( Dictionary *d );

#endif //__DICTIONARY_DICTIONARY_H__
