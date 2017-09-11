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
		SQLT_QUAD,
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

