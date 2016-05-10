

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