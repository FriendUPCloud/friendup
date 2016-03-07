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

#ifndef __CORE_SYSTEM_JSON_STRUCTURES_H__
#define __CORE_SYSTEM_JSON_STRUCTURES_H__


#include <core/types.h>
#include <core/nodes.h>
#include <mysql/sql_defs.h>

typedef struct FriendFile
{
	char 			*ff_Filename;
	char 			*ff_Path;
	UQUAD 		ff_Size;
	char 			*ff_MetaType;
	char 			*ff_Type;
	MinNode 		node;
}FriendFile;


static ULONG FriendFileDesc[] = { 
    SQLT_TABNAME, (ULONG)"FriendFile",       SQLT_STRUCTSIZE, sizeof( struct FriendFile ), 
	SQLT_STR,   (ULONG)"Filename",          offsetof( struct FriendFile, ff_Filename ), 
	SQLT_STR,   (ULONG)"Path",        offsetof( struct FriendFile, ff_Path ),
	SQLT_INT,   (ULONG)"Filesize",    offsetof( struct FriendFile, ff_Size ),
	SQLT_STR,   (ULONG)"MetaType",    offsetof( struct FriendFile, ff_MetaType ),
	SQLT_STR,   (ULONG)"Type",   offsetof( struct FriendFile, ff_Type ),
	SQLT_NODE,  (ULONG)"node",        offsetof( struct FriendFile, node ),
	SQLT_END 
};

#endif // __CORE_SYSTEM_JSON_STRUCTURES_H__
