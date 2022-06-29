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
 *  Database auto update
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 26/02/2021
 */

#ifndef __DB_H__
#define __DB_H__

#include <core/types.h>
#include <util/tagitem.h>
#include <db/sqllib.h>
#include <system/systembase.h>

enum {
	UPDATE_DB_TYPE_GLOBAL = 0,
	UPDATE_DB_TYPE_INTERNAL
};

/*
CREATE TABLE IF NOT EXISTS `FDBUpdate` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Filename` varchar(255) NOT NULL,
  `Created` bigint(20) NOT NULL,
  `Updated` bigint(20) NOT NULL,
  `Script` varchar(1024) NOT NULL,
  `Error` varchar(1024) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

*/

typedef struct DBUpdate
{
	FQUAD			dbu_ID;
	char			*dbu_Filename;
	char			*dbu_Script;
	time_t			dbu_Created;
	time_t			dbu_Updated;
	char			*dbu_Error;
	
	MinNode			node;
}DBUpdate;

//
// SQL structure
//

static FULONG DBUpdateDesc[] = { 
	SQLT_TABNAME, (FULONG)"FDBUpdate",       
	SQLT_STRUCTSIZE, sizeof( struct DBUpdate ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct DBUpdate, dbu_ID ), 
	SQLT_STR,     (FULONG)"Filename",        offsetof( struct DBUpdate, dbu_Filename ),
	SQLT_INT,     (FULONG)"Created",    offsetof( struct DBUpdate, dbu_Created ),
	SQLT_INT,     (FULONG)"Updated",    offsetof( struct DBUpdate, dbu_Updated ),
	SQLT_STR,     (FULONG)"Script",        offsetof( struct DBUpdate, dbu_Script ),
	SQLT_STR,     (FULONG)"Error",       offsetof( struct DBUpdate, dbu_Error ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct DBUpdate, node ),
	SQLT_END 
};

//
//
//

DBUpdate *DBUpdateNew( );

//
//
//

void DBUpdateDelete( DBUpdate *dbu );

//
//
//

void DBUpdateDeleteAll( DBUpdate *dbu );

//
//
//

void CheckAndUpdateDB( SystemBase *sb, int type );


#endif // __DB_H__


