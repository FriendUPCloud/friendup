/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

#ifndef __CORE_SQL_DEFS_H__
#define __CORE_SQL_DEFS_H__

//
// database types
//

#define SQL_DATA_STRUCTURE_TABNAME	1
#define SQL_DATA_STRUCTURE_SIZE		3
#define SQL_DATA_STRUCT_START 		4

// information where data information is stored
// remember  TAG, DATA, TAG, DATA, ....START..
//
// 
//static FULONG UserDesc[] = { 
//    SQLT_TABNAME, (FULONG)"FUser",       
//    SQLT_STRUCTSIZE, sizeof( struct User ), 
//    SQLT_IDINT,   (FULONG)"ID",          offsetof( 
//
// So as we see:
// table name is placed on 1st position in array
// structure size is placed on 3rd position in array
// and so on...
//

enum {
		SQLT_TABNAME = 0xff01,	// table name where data will be stored
		SQLT_STRUCTSIZE,		// structure size
		SQLT_IDINT,				// integer value, used as ID
		SQLT_INT,				// integer value
		SQLT_STR,				// string
		SQLT_LONG,				// long
		SQLT_BLOB,				// data blob
		SQLT_VOIDPTR,			// pointer to data
		SQLT_NODE,				// pointer to next structure
		SQLT_SKIPBYTES,
		SQLT_DATETIME,
		SQLT_DATE,				// date
		SQLT_INIT_FUNCTION,		// initialize function
		SQLT_STR_HASH,			// hashed string
		SQLT_END
};

#endif //__CORE_SQL_DEFS_H__

