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
 *  Keys Defintions
 *
 * All functions related to Keys structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#ifndef __SECURITY_FKEY_H__
#define __SECURITY_FKEY_H__

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

/*
 -- 2017-10-09 -- FKeys table
 CREATE TABLE IF NOT EXISTS `FKeys` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserID` bigint(20) NOT NULL,
  `UniqueID` varchar(255) NOT NULL,
  `RowID` bigint(20) NOT NULL,
  `RowType` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Type` varchar(255) NOT NULL,
  `Blob` longblob,
  `Data` text,
  `PublicKey` text,
  `Signature` text,
  `DateModified` datetime NOT NULL,
  `DateCreated` datetime NOT NULL,
  `IsDeleted` tinyint(4) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
 */

//
// FKey structure
//

typedef struct FKey
{
	MinNode						node;
	FULONG						k_ID;
	FULONG						k_UserID;
	void						*k_User;	//if user == NULL then entry is loaded from DB (not connected)
	char						*k_Name;
	char						*k_Type;
	char						*k_Data;
	char						*k_PublicKey;
	char						*k_Signature;
	struct tm					k_DateCreated;
}FKey;

//
//
//

static FULONG FKeyDesc[] = {
	SQLT_TABNAME, (FULONG)"FKeys",
	SQLT_STRUCTSIZE, sizeof( struct FKey ),
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct FKey, k_ID ),
	SQLT_INT,     (FULONG)"UserID", offsetof( struct FKey, k_UserID ),
	SQLT_STR,     (FULONG)"Name",        offsetof( struct FKey, k_Name ),
	SQLT_STR,     (FULONG)"Type",    offsetof( struct FKey, k_Type ),
	SQLT_STR,     (FULONG)"Data",    offsetof( struct FKey, k_Data ),
	SQLT_STR,     (FULONG)"PublicKey", offsetof( struct FKey, k_PublicKey ),
	SQLT_STR,     (FULONG)"Signature", offsetof( struct FKey, k_Signature ),
	SQLT_DATETIME,(FULONG)"DateCreated", offsetof( struct FKey, k_DateCreated ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct FKey, node ),
	SQLT_END
};

//
//
//

FKey *FKeyNew();

//
//
//

void FKeyDelete( FKey *cc );

//
//
//

void FKeyDeleteAll( FKey *cc );


#endif // __SECURITY_FKEY_H__

