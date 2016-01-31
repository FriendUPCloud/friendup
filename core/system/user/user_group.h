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

#ifndef __USER_GROUP_H__
#define __USER_GROUP_H__

#include <core/types.h>
#include <core/nodes.h>
#include <mysql/sql_defs.h>

/*

CREATE TABLE `FUserToGroup` (
 `UserID` bigint(20) NOT NULL,
 `UserGroupID` bigint(20) NOT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
*/

/*
CREATE TABLE `FUserGroup` (
 `ID` bigint(20) NOT NULL AUTO_INCREMENT,
 `Name` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

typedef struct UserGroup
{
	struct MinNode 		node;
	ULONG 					ug_ID;
	char 						*ug_Name;
}UserGroup;


#if ((__GNUC__ * 100) + __GNUC_MINOR__) >= 402
#define GCC_DIAG_STR(s) #s
#define GCC_DIAG_JOINSTR(x,y) GCC_DIAG_STR(x ## y)
# define GCC_DIAG_DO_PRAGMA(x) _Pragma (#x)
# define GCC_DIAG_PRAGMA(x) GCC_DIAG_DO_PRAGMA(GCC diagnostic x)
# if ((__GNUC__ * 100) + __GNUC_MINOR__) >= 406
#  define GCC_DIAG_OFF(x) GCC_DIAG_PRAGMA(push) \
	GCC_DIAG_PRAGMA(ignored GCC_DIAG_JOINSTR(-W,x))
#  define GCC_DIAG_ON(x) GCC_DIAG_PRAGMA(pop)
# else
#  define GCC_DIAG_OFF(x) GCC_DIAG_PRAGMA(ignored GCC_DIAG_JOINSTR(-W,x))
#  define GCC_DIAG_ON(x)  GCC_DIAG_PRAGMA(warning GCC_DIAG_JOINSTR(-W,x))
# endif
#else
# define GCC_DIAG_OFF(x)
# define GCC_DIAG_ON(x)
#endif


//#pragma GCC diagnostic push
//#pragma GCC diagnostic ignored " -Wconversion"

GCC_DIAG_OFF(int-to-pointer-cast);

static ULONG GroupDesc[] = { SQLT_TABNAME, (ULONG)"FUserGroup", SQLT_STRUCTSIZE, sizeof( struct UserGroup ), 
	SQLT_IDINT, (ULONG)"ID", offsetof( struct UserGroup, ug_ID ), 
	SQLT_STR, (ULONG)"Name", offsetof( struct UserGroup, ug_Name ),
	SQLT_NODE, (ULONG)"node", offsetof( struct UserGroup, node ),
	SQLT_END };
	
GCC_DIAG_ON(int-to-pointer-cast);
//#pragma GCC diagnostic pop

#endif // __USER_GROUP_H__
