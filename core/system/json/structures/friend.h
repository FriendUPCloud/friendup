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
 *  Internal Friend structures definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __CORE_SYSTEM_JSON_STRUCTURES_H__
#define __CORE_SYSTEM_JSON_STRUCTURES_H__


#include <core/types.h>
#include <core/nodes.h>
#include <db/sql_defs.h>

typedef struct FriendFile
{
	char 			*ff_Filename;
	char 			*ff_Path;
	FUQUAD 			ff_Size;
	char 			*ff_MetaType;
	char 			*ff_Type;
	struct tm		ff_CreateTime;
	struct tm		ff_ModifyTime;
	MinNode 		node;
}FriendFile;


static FULONG FriendFileDesc[] = { 
    SQLT_TABNAME, (FULONG)"FriendFile",       SQLT_STRUCTSIZE, sizeof( struct FriendFile ), 
	SQLT_STR,   (FULONG)"Filename",          offsetof( struct FriendFile, ff_Filename ), 
	SQLT_STR,   (FULONG)"Path",        offsetof( struct FriendFile, ff_Path ),
	SQLT_INT,   (FULONG)"Filesize",    offsetof( struct FriendFile, ff_Size ),
	SQLT_STR,   (FULONG)"MetaType",    offsetof( struct FriendFile, ff_MetaType ),
	SQLT_STR,   (FULONG)"Type",   offsetof( struct FriendFile, ff_Type ),
	SQLT_DATETIME, (FULONG)"DateModified", offsetof( struct FriendFile, ff_ModifyTime ),
	SQLT_NODE,  (FULONG)"node",        offsetof( struct FriendFile, node ),
	SQLT_END 
};

#endif // __CORE_SYSTEM_JSON_STRUCTURES_H__
