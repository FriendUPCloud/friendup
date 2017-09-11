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

/*

	SQL Library definition

*/

#ifndef __CORE_SQLLIB_H_
#define __CORE_SQLLIB_H_

#include <time.h>
#include <core/types.h>
#include <core/library.h>

#include "sql_defs.h"

enum {
		SQL_STATUS_NEW = 0,
		SQL_STATUS_READY,
		SQL_STATUS_BUSY
};

typedef struct SQLConnection
{
	char 			*sql_Host;		// host
	char 			*sql_User;		// user
	char 			*sql_Pass;		// password
	char			*sql_DBName; // database name
	int				sql_Port;		// port

	void			*sql_Con;
	//MYSQL 			*sql_Con;			// sql connection
	void			*sql_SpecialData;
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

typedef struct SQLLibrary
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
	int						(*Connect)( struct SQLLibrary *l, const char *host, const char *name, const char *usr, const char *pass, int port );
	int						(*Reconnect)( struct SQLLibrary *l );
	int						(*Disconnect)( struct SQLLibrary *l );
	void					*(*Load)( struct SQLLibrary *l, const FULONG *descr, char *where, int *entries );
	int						(*Save)( struct SQLLibrary *l, const FULONG *descr, void *data );
	int						(*Update)( struct SQLLibrary *l, const FULONG *descr, void *data );
	void 					(*Delete)( struct SQLLibrary *l, const FULONG *descr, void *data );
	void					(*DeleteWhere)( struct SQLLibrary *l, const FULONG *descr, char *where );
	void 					*(*Query)( struct SQLLibrary *l, const char *sel );
	int 					(*NumberOfRecords)( struct SQLLibrary *l, const FULONG *descr, char *where );
	int 					(*NumberOfRecordsCustomQuery)( struct SQLLibrary *l, const char *query );
	char 					**(*FetchRow)( struct SQLLibrary *l, void *res );
	void 					(*FreeResult)( struct SQLLibrary *l, void *res );
	int						(*NumberOfRows)( struct SQLLibrary *l, void *res );
	int						(*QueryWithoutResults)( struct SQLLibrary *l, const char *sel );
	int						(*SNPrintF)( struct SQLLibrary *l, char *str, size_t stringSize, const char *fmt, ... );
	char					*(*MakeEscapedString)( struct SQLLibrary *l, char *str );
	int						(*GetStatus)( struct Library *l );

	SQLConnection con;
	
} SQLLibrary;

// 

#endif	// __CORE_SQLLIB_H_
