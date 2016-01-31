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

/*

	Library

*/

#ifndef __MYSQL_LIBRARY_H_
#define __MYSQL_LIBRARY_H_

#include <time.h>
#include <core/types.h>
#include <core/library.h>
#include <mysql.h>

#include "sql_defs.h"

typedef struct SQLConnection
{
	char 			*sql_Host;		// host
	char 			*sql_User;		// user
	char 			*sql_Pass;		// password

	MYSQL 		*sql_Con;			// sql connection
	
}SQLConnection;

//
//
// Example structure
// struct User{
// int a; char *b; };
//
// 
// ULONG d[] = { SQLT_TABNAME, "FriendUser", SQLT_IDINT, "ID", SQLT_STR, "NAME", SQLT_END };
//

//
//	library
//

typedef struct MYSQLLibrary
{
	char 		*l_Name;			// library name
	ULONG 		l_Version;			// version information
	void 		*l_Handle;
	void						*sb; // system base
	void *		(*libInit)( void *sb );
	void 		(*libClose)( struct Library *l );
	ULONG 		(*GetVersion)(void);
	ULONG 		(*GetRevision)(void);

	// mysql.library structure
	//int						(*Connect)( struct MYSQLLibrary *l, const char *name );
	//int						(*Disconnect)( struct MYSQLLibrary *l );
	void						*(*Load)( struct MYSQLLibrary *l, ULONG *descr, char *where, int *entries );
	int						(*Save)( struct MYSQLLibrary *l, ULONG *descr, void *data );
	int						(*Update)( struct MYSQLLibrary *l, ULONG *descr, void *data );
	void 						(*Delete)( struct MYSQLLibrary *l, ULONG *descr, void *data );
	MYSQL_RES 			*(*Select)( struct MYSQLLibrary *l, const char *sel );
	int 						(*NumberOfRecords)( struct MYSQLLibrary *l, ULONG *descr, char *where );
	MYSQL_ROW 		(*FetchRow)( struct MYSQLLibrary *l, MYSQL_RES *res );
	void 						(*FreeResult)( struct MYSQLLibrary *l, MYSQL_RES *res );

	SQLConnection con;
	
} MYSQLLibrary;

// 

#endif	// __MYSQL_LIBRARY_H_
