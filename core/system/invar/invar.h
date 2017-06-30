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
 *  INVAR definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */

//
//
// INVAR
// Network Only Memory
//

#ifndef __SYSTEM_INVAR_INVAR_H__
#define __SYSTEM_INVAR_INVAR_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/mysqllibrary.h>
#include <stddef.h>

/*
 CREATE TABLE IF NOT EXISTS `FINVAREntry` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Name` varchar(1024) DEFAULT NULL,
   `Data` mediumtext DEFAULT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */


typedef struct INVAREntry
{
	struct MinNode 		node;
	FULONG 					ne_ID;				// database ID
	FULONG 					ne_Pointer;		// memory pointer to this field
	FULONG						ne_GroupPointer;		// pointer to group
	char 						*ne_Name;			// name of entry
	char							*ne_Data;			// data
	void 							*ne_SpecialData;	// special data
}INVAREntry;

static FULONG INVAREntryDesc[] = { SQLT_TABNAME, (FULONG)"FINVAREntry", SQLT_STRUCTSIZE, sizeof( struct INVAREntry ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( INVAREntry, ne_ID ), 
	SQLT_INT, (FULONG)"Pointer", offsetof( INVAREntry, ne_Pointer ), 
	SQLT_STR, (FULONG)"Name", offsetof( INVAREntry, ne_Name ),
	SQLT_STR, (FULONG)"Data", offsetof( INVAREntry, ne_Data ),
	SQLT_NODE, (FULONG)"node", offsetof( struct INVAREntry, node ),
	SQLT_END };

//
// Load INVAREntry from DB
//
	
INVAREntry *INVAREntryNew( FULONG id, char *name, char *data );

//
// release entry
//

void INVAREntryDelete( INVAREntry *d );

//
// to json, we are not using default conversion routines to gain speed
//

int INVAREntryToJSON( INVAREntry *ne, char *buffer, int len );

//
//
//

int INVAREntryJSONPTR( INVAREntry *ne, char *buffer, int len );
	
/*
 CREATE TABLE IF NOT EXISTS `FINVARGroup` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `Name` bigint(20),
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
 */

typedef struct INVARGroup
{
	struct MinNode node;
	FULONG 					ng_ID;
	FULONG 					ng_Pointer;
	char 						*ng_Name;
	INVAREntry 				*ng_Entries;
}INVARGroup;

static FULONG INVARGroupDesc[] = { SQLT_TABNAME, (FULONG)"FINVARGroup", SQLT_STRUCTSIZE, sizeof( struct INVARGroup ), 
	SQLT_IDINT, (FULONG)"ID", offsetof( INVARGroup, ng_ID ), 
	SQLT_INT, (FULONG)"Pointer", offsetof( INVARGroup, ng_Pointer ), 
	SQLT_STR, (FULONG)"Name", offsetof( INVARGroup, ng_Name ),
	SQLT_NODE, (FULONG)"node", offsetof( struct INVARGroup, node ),
	SQLT_END };

//
// INVARGroup
//

INVARGroup *INVARGroupNew( FULONG id, char *name );

//
// release group
//

void INVARGroupDelete( INVARGroup *d );

//
// to json
//

int INVARGroupToJSON( INVARGroup *ne, char *buffer, int len );

//
//
//

int INVARGroupJSONPTR( INVARGroup *ne, char *buffer, int len );

#endif // __SYSTEM_INVAR_INVAR_H__
