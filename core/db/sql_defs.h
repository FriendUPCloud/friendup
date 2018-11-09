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

#define SQL_DATA_TABLE_NAME		1
#define SQL_DATA_STRUCTURE_SIZE	3
#define SQL_DATA_STRUCT_START 	4		// information where data information is stored
										// remember  TAG, DATA, TAG, DATA, ....START...

enum {
		SQLT_TABNAME = 0xff01,
		SQLT_STRUCTSIZE,
		SQLT_IDINT,
		SQLT_INT,
		SQLT_STR,
		SQLT_LONG,
		SQLT_BLOB,
		SQLT_VOIDPTR,
		SQLT_NODE,		// pointer to next structure
		SQLT_SKIPBYTES,
		SQLT_DATETIME,
		SQLT_DATE,
		SQLT_INIT_FUNCTION,
		SQLT_END
};

#endif //__CORE_SQL_DEFS_H__

