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


#ifndef __SYSTEM_HANDLER_LOCK_H__
#define __SYSTEM_HANDLER_LOCK_H__

#include <core/types.h>
#include <mysql/mysqllibrary.h>
#include <time.h>
#include <system/systembase.h>

enum
{
	LOCK_READ = 0,
	LOCK_READ_EXCLUSIVE,
	LOCK_WRITE
	//LOCL_WRITE_EXCLUSIVE		// write is always exclusive
};

//
// Lock structure and database description
//

typedef struct Lock
{
	MinNode             node;
	ULONG					l_ID;
	ULONG 				l_OwnerID;
	char						*l_Path;
	int						l_Type;
	time_t					l_LockTime;
}Lock;

static ULONG LockDesc[] = { 
    SQLT_TABNAME, (ULONG)"Lock",       SQLT_STRUCTSIZE, sizeof( struct Lock ), 
	SQLT_IDINT,   (ULONG)"ID",          offsetof( struct Lock, l_ID ),
	SQLT_IDINT,   (ULONG)"OwnerID",          offsetof( struct Lock, l_OwnerID ), 
	SQLT_STR,     (ULONG)"Path",        offsetof( struct Lock, l_Path ),
	SQLT_INT,     (ULONG)"Type", offsetof( struct Lock, l_Type ),
	SQLT_INT,     (ULONG)"Time", offsetof( struct Lock, l_LockTime ),
	SQLT_NODE,    (ULONG)"node",        offsetof( struct Lock, node ),
	SQLT_END 
};

int LockDelete( User *usr, char *path );

#endif //__SYSTEM_HANDLER_LOCK_H__
