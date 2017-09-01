/*©lgpl*************************************************************************
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

/*

	Library

*/

#ifndef __MYSQL_LIBRARY_H__
#define __MYSQL_LIBRARY_H__

#include <time.h>
#include <core/types.h>
#include <core/library.h>
//#include <mysql/mysqllibrary.h>
#include <mysql.h>

#include "sql_defs.h"

typedef struct SQLConnection
{
	char 			*sql_Host;		// host
	char 			*sql_User;		// user
	char 			*sql_Pass;		// password
	char			*sql_DBName; // database name
	int				sql_Port;		// port

	MYSQL 			*sql_Con;			// sql connection
	FBOOL			sql_Recconect;	// should I reconnect
}SQLConnection;

//
//
// Example structure
// struct User{
// int a; char *b; };
//
// 
// FULONG d[] = { SQLT_TABNAME, "FriendUser", SQLT_IDINT, "ID", SQLT_STR, "NAME", SQLT_END };
//

//
//	library
//

typedef struct MYSQLLibrary
{
	char 					*l_Name;			// library name
	FULONG 					l_Version;			// version information
	void 					*l_Handle;
	void					*sb; // system base
	void					*(*libInit)( void *sb );
	void 					(*libClose)( struct Library *l );
	FULONG 					(*GetVersion)(void);
	FULONG 					(*GetRevision)(void);

	// mysql.library structure
	int						(*Connect)( struct MYSQLLibrary *l, const char *host, const char *name, const char *usr, const char *pass, int port );
	int						(*Reconnect)( struct MYSQLLibrary *l );
	int						(*Disconnect)( struct MYSQLLibrary *l );
	void					*(*Load)( struct MYSQLLibrary *l, const FULONG *descr, char *where, int *entries );
	int						(*Save)( struct MYSQLLibrary *l, const FULONG *descr, void *data );
	int						(*Update)( struct MYSQLLibrary *l, const FULONG *descr, void *data );
	void 					(*Delete)( struct MYSQLLibrary *l, const FULONG *descr, void *data );
	void					(*DeleteWhere)( struct MYSQLLibrary *l, const FULONG *descr, char *where );
	MYSQL_RES 				*(*Query)( struct MYSQLLibrary *l, const char *sel );
	int 					(*NumberOfRecords)( struct MYSQLLibrary *l, const FULONG *descr, char *where );
	int 					(*NumberOfRecordsCustomQuery)( struct MYSQLLibrary *l, const char *query );
	MYSQL_ROW 				(*FetchRow)( struct MYSQLLibrary *l, MYSQL_RES *res );
	void 					(*FreeResult)( struct MYSQLLibrary *l, MYSQL_RES *res );
	int						(*NumberOfRows)( struct MYSQLLibrary *l, MYSQL_RES *res );
	int						(*QueryWithoutResults)( struct MYSQLLibrary *l, const char *sel );
	int						(*SNPrintF)( struct MYSQLLibrary *l, char *str, size_t stringSize, const char *fmt, ... );
	char					*(*MakeEscapedString)( struct MYSQLLibrary *l, char *str );

	SQLConnection con;
	
} MYSQLLibrary;

// 

#endif	// __MYSQL_LIBRARY_H_
