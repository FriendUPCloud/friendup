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

