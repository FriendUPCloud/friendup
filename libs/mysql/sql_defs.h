/*©lpgl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/


#ifndef __SQL_DEFS_H__
#define __SQL_DEFS_H__

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
		SQLT_INIT_FUNCTION,
		SQLT_END
};

#endif //__SQL_DEFS_H__
