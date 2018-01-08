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
