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

	MySQLLibrary code

*/

#include <stdio.h>
#include <core/types.h>
#include <core/library.h>
#include "mysqllibrary.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <propertieslibrary.h>
#include <core/nodes.h>
#include <time.h>
#include <system/systembase.h>

#define LIB_NAME "mysql.library"
#define LIB_VERSION 0
#define LIB_REVISION 1

//
// init library
//

void *libInit( void *sb )
{
	struct MYSQLLibrary *l = NULL;
	DEBUG("libinit\n");

	if( ( l = calloc( 1, sizeof( struct MYSQLLibrary ) ) ) == NULL )
	{
		return NULL;
	}


	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	//l->libInit//no need
	l->libClose = dlsym ( l->l_Handle, "libClose");
	l->GetVersion = dlsym ( l->l_Handle, "GetVersion");

	// mysql.library structure
	l->Load = dlsym ( l->l_Handle, "Load");
	l->Save = dlsym ( l->l_Handle, "Save");
	l->Update = dlsym ( l->l_Handle, "Update");
	l->Delete = dlsym ( l->l_Handle, "Delete");
	l->Select = dlsym ( l->l_Handle, "Select");
	l->NumberOfRecords = dlsym( l->l_Handle, "NumberOfRecords");
	l->FetchRow = dlsym ( l->l_Handle, "FetchRow");
	l->FreeResult = dlsym ( l->l_Handle, "FreeResult");

	
	char *host = "localhost";
	char *login = "root";
	char *pass = "root";
	char *dbname = "FriendMaster";
	int port = 3306;
	Props *prop = NULL;
	
	SystemBase *lsb = (SystemBase *)sb;
	
	// Get a copy of the properties.library
	struct PropertiesLibrary *plib = ( struct PropertiesLibrary *)lsb->LibraryPropertiesGet( lsb );
	
	DEBUG("Plibcheck %p lsb %p\n", plib, lsb );
	if( plib != NULL && plib->Open != NULL )
	{
		char *ptr = getenv("FRIEND_HOME");
		char *path = calloc( 1000, sizeof( char ) );
	
		if( ptr != NULL )
			sprintf( path, "%scfg/cfg.ini", ptr );
	
		DEBUG( "Opening config file: %s\n", path );
		
		prop = plib->Open( path );
		free( path );
		
		if( prop != NULL)
		{
			DEBUG("[MYSQLLibrary] reading login\n");
			login = plib->ReadString( prop, "DatabaseUser:login", "root" );
			DEBUG("[MYSQLLibrary] user %s\n", login );
			pass = plib->ReadString( prop, "DatabaseUser:password", "root" );
			DEBUG("[MYSQLLibrary] password %s\n", pass );
			host = plib->ReadString( prop, "DatabaseUser:host", "localhost" );
			DEBUG("[MYSQLLibrary] host %s\n", host );
			dbname = plib->ReadString( prop, "DatabaseUser:dbname", "FriendMaster" );
			DEBUG("[MYSQLLibrary] dbname %s\n",dbname );
			port = plib->ReadInt( prop, "DatabaseUser:port", 3306 );
			DEBUG("[MYSQLLibrary] port read %d\n", port );
		}
		else
		{
			ERROR( "Prop is just NULL!\n" );
		}
		//DEBUG("PROPERTIES LIBRARY OPENED, poitner to props %p!   %s  %s  %s  %s  %d\n", prop, login, pass, host, dbname, port );
	}
	
	DEBUG("[MYSQLLibrary] before connecting to database host %s dbname %s\n", host, dbname );
	
	l->sb = sb;
	
	// Initialize mysql connection
	l->con.sql_Con = mysql_init(NULL);
	void *connection = mysql_real_connect( l->con.sql_Con, host, login, pass, dbname, port, NULL, 0 );
	if( connection == NULL )
	{
		if( prop ) plib->Close( prop );
		lsb->LibraryPropertiesDrop( lsb, plib );
		return NULL;
	}
	
	// Make sure connection is maintained
	int reconnect = 1;
	mysql_options( connection, MYSQL_OPT_RECONNECT, &reconnect );
	
	if( plib != NULL )
	{
		if( prop ) plib->Close( prop );
		DEBUG("[MYSQLLibrary] propertyLIBRARY close!\n");
		lsb->LibraryPropertiesDrop( lsb, plib );
	}
	
	return ( void *)l;
}

//
//
//

void libClose( struct MYSQLLibrary *l )
{

	if( l->con.sql_Con )
	{
		DEBUG( "MYSQL library closed connection.\n" );
		mysql_close( l->con.sql_Con );
		l->con.sql_Con = NULL;
	}
	DEBUG("MYSQL library close\n");
}

//
//
//

long GetVersion(void)
{
	return LIB_VERSION;
}

long GetRevision(void)
{
	return LIB_REVISION;
}


//
// load data from database and put into structure
//
// data - pointer to allocated memory by structure
// 
//

void *Load( struct MYSQLLibrary *l, ULONG *descr, char *where, int *entries )
{
	char tmpQuery[ 1024 ];
	void *firstObject = NULL;
	DEBUG("[MYSQLLibrary] Load\n");
	
	if( descr == NULL  )
	{
		ERROR("Data description was not provided!\n");
		return NULL;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		ERROR("SQLT_TABNAME was not provided!\n");
		return NULL;
	}

	if( where != NULL )
	{
		sprintf( tmpQuery, "SELECT * FROM %s WHERE %s", (char *)descr[ 1 ], where );
	}
	else
	{
		sprintf( tmpQuery, "SELECT * FROM %s", (char *)descr[ 1 ] );
	}
	
	if( mysql_query( l->con.sql_Con, tmpQuery ) )
	{
		DEBUG("Cannot run query: '%s'\n", tmpQuery );
		DEBUG( "%s\n", mysql_error( l->con.sql_Con ) );
		return NULL;
	}
	
	DEBUG("SQL SELECt QUERY '%s\n", tmpQuery );

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if (result == NULL) 
	{
		DEBUG("Query return empty results\n");
		return NULL;
 	}

	MYSQL_ROW row;
	
	// This is where the data starts!
	MinNode *node = NULL;
	
	int j = 0;
	*entries = 0;

	//
	// Receiving data as linked list of objects
	//
	DEBUG("[MYSQLLibrary] Before results\n" );

	while( ( row = mysql_fetch_row( result ) ) != NULL )
	{
		DEBUG("[MYSQLLibrary] Parsing rows %d\n", j );
		(*entries)++;
		
		void *data = FCalloc( 1, descr[ SQL_DATA_STRUCTURE_SIZE ] );
		int dataUsed = 0; // Tell if we need to free data..
		
		// Link the first object (which holds the start of the data)
		if( firstObject == NULL ) firstObject = data;
		
		UBYTE *strptr = (UBYTE *)data;	// pointer to structure to which will will insert data
		
		// first 2 entries inform about table and size, rest information provided is about columns
		ULONG *dptr = &descr[ SQL_DATA_STRUCT_START ]; 
		
		int i = 0;
			
		DEBUG("[MYSQLLibrary] Found column one, parsing\n");
			
		while( dptr[0] != SQLT_END )
		{
			//printf("Found on pos %d tag %d   row %s\n", i, dptr[ 0 ], row[ i ] ); 
			//DEBUG("POINTER %p\n", strptr );
			switch( dptr[ 0 ] )
			{
				case SQLT_NODE:
					{
						dataUsed = 1;
						DEBUG("Node found\n");
						MinNode *locnode = (MinNode *)strptr + dptr[ 2 ];						
						if( node != NULL )
						{
							node->mln_Succ = (MinNode *)data;
							node = locnode;
						}
						else node = locnode;
					}
					break;
					case SQLT_IDINT:	// primary key
					case SQLT_INT:
						{
							int tmp = (int)atol( row[ i ] );
							memcpy( strptr + dptr[ 2 ], &tmp, sizeof( int ) );
							//DEBUG("[MYSQLLibrary] parsing  sizeofint %d  col %s = data %s\n", (int)sizeof( int ), dptr[1], row[ i ] );
							
						}
						break;
					case SQLT_STR:
						{
							if( row[i] != NULL )
							{
								int len = strlen( row[i] );
								char *tmpval = calloc( len + 1, sizeof( char ) );
								if( tmpval )
								{
									// Copy mysql data
									memcpy( tmpval, row[i], len );
									// Add tmpval to string pointer list..
									memcpy( strptr + dptr[2], &tmpval, sizeof( char * ) );
								}
							}
							else
							{

							}
						}
						break;
						
					case SQLT_TIMESTAMP:
						{
							struct tm ltm;
							DEBUG("TIMESTAMP load\n");
							
							// REMEMBER, data fix
							ltm.tm_year += 1900;
							ltm.tm_mon ++;
							
							memcpy( strptr + dptr[ 2 ], &ltm, sizeof( struct tm) );
							DEBUG("TIMESTAMP load %s\n", row[ i ] );
							
							DEBUG("Year %d  month %d  day %d\n", ltm.tm_year, ltm.tm_mon, ltm.tm_mday );
						}
						break;

					case SQLT_QUAD:
						{
							
						}
					break;
				}
				
				i++;
				dptr += 3;
		}
		j++;
		// We allocated memory without using it..
		if( dataUsed == 0 ) 
		{
			if( data == firstObject )
				firstObject = NULL;
			free( data );
		}
	}

	mysql_free_result( result );
	DEBUG("[MYSQLLibrary] Load END\n");
	
	return firstObject;
}

//
//
//

int Update( struct MYSQLLibrary *l, ULONG *descr, void *data )
{
	char tmpQuery[ 2048 ];
	int primaryId = -1;
	char *primaryIdName = NULL;
	DEBUG("[MYSQLLibrary] Update\n");
	
	if( descr == NULL || data == NULL )
	{
		DEBUG("Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		DEBUG("SQLT_TABNAME was not provided!\n");
		return 0;
	}
	
	char *whereColName = NULL;
	int whereColValue = -1;
	ULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];
	unsigned char *strptr = (unsigned char *)data;	// pointer to structure to which will will insert data
	
	while( dptr[0] != SQLT_END )
	{
		switch( dptr[ 0 ] )
		{
			case SQLT_IDINT:	// primary key
				{
					memcpy( &whereColValue, strptr + dptr[ 2 ], sizeof( int ) );
					whereColName = (char *) dptr[ 1 ];		// data field name
					break;
				}
		}
		if( whereColName != NULL )
		{
			break;
		}
		
		dptr += 3;
	}

	//"UPDATE %s set SessionID = '%s', LoggedTime = '%lld' where Name = '%s'"
	
	sprintf( tmpQuery, "UPDATE %s set ", (char *)descr[ 1 ] );
	//sprintf( tmpQuery, "UPDATE %s set where %s = %d", (char *)descr[ 1 ], whereColName, whereColValue );
	
	DEBUG("Update SQL: %s\n", tmpQuery );
	
	dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	
	int cols = 0;
	
	while( dptr[0] != SQLT_END )
	{
		//DEBUG("Found on pos %d tag %d   row %s\n", i, dptr[ 0 ], row[ i ] ); 
		DEBUG("Update POINTER %p\n", strptr );
		
		
		switch( dptr[ 0 ] )
		{
			case SQLT_IDINT:	// primary key
				{
					// we just skip that in update
					
					int tmpint;
					memcpy( &tmpint, strptr + dptr[ 2 ], sizeof( int ) );
					primaryId = tmpint;
					primaryIdName = ( char *)dptr[ 1 ];
					
					DEBUG("[MYSQLLibrary] : we dont update PRIMARY KEY %d\n", primaryId );
				}
				break;
				
			case SQLT_INT:
				{
					char tmp[ 256 ];
					int tmpint;
					memcpy( &tmpint, strptr + dptr[ 2 ], sizeof( int ) );
					if( cols == 0 )
					{
						sprintf( tmp, " %s = %d", (char *)dptr[ 1 ], tmpint );
					}
					else
					{
						sprintf( tmp, ", %s = %d", (char *)dptr[ 1 ], tmpint );
					}
					strcat( tmpQuery, tmp );

					DEBUG("[MYSQLLibrary] update set int %d to %s\n", tmpint, (char *)dptr[ 1 ] );
				}
				break;
				
			case SQLT_STR:
				{
					char tmp[ 256 ];
					char *tmpchar;
					memcpy( &tmpchar, strptr + dptr[ 2 ], sizeof( char *) );
					DEBUG("[MYSQLLibrary] update, pointer %p\n", tmpchar );
					if( tmpchar != NULL )
					{
						if( cols == 0 )
						{
							sprintf( tmp, " %s = '%s'", (char *)dptr[ 1 ], tmpchar );
						}
						else
						{
							sprintf( tmp, ", %s = '%s'", (char *)dptr[ 1 ], tmpchar );
						}
						strcat( tmpQuery, tmp );
						
						DEBUG("[MYSQLLibrary] update set string %s to %s\n", tmpchar, (char *)dptr[ 1 ] );
					}
					else	// string was set to NULL
					{
						if( cols == 0 )
							{
								sprintf( tmpQuery, " %s = NULL", (char *)dptr[ 1 ] );
							}
							else
							{
								sprintf( tmpQuery, ", %s = NULL", (char *)dptr[ 1 ] );
							}
						}
					}
				break;
				
				case SQLT_TIMESTAMP:
				{
					// '2015-08-10 16:28:31'
					char date[ 64 ];
					char tmp[ 256 ];
					
					DEBUG("TIMESTAMP update\n");
				
					struct tm *tp = (struct tm *)( strptr+dptr[2]);
					//struct tm tp;
					//memcpy( &tp, strptr+dptr[2], sizeof( struct tm ) );	// copy timestamp pointer
					
					DEBUG("TIMESTAMP update 1\n");
					
					//if( tp != NULL )
					{
						sprintf( date, "%4d-%2d-%2d %2d:%2d:%2d", tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
						//sprintf( date, "%04d-%02d-%02d %02d:%02d:%02d", tp.tm_year, tp.tm_mon, tp.tm_mday, (int)tp.tm_hour, (int)tp.tm_min, (int)tp.tm_sec );
						
						DEBUG("DATE serialised %s\n", date );
					
						if( cols == 0 )
						{
							sprintf( tmp, " %s = '%s'", (char *)dptr[ 1 ], date );
						}
						else
						{
							sprintf( tmp, ", %s = '%s'", (char *)dptr[ 1 ], date );
						}
						strcat( tmpQuery, tmp );
					}
					
					/*
					MYSQL_TIME *tp;
					memcpy( &tp, strptr+dptr[2], sizeof( MYSQL_TIME *) );	// copy timestamp pointer
				
					if( tp != NULL )
					{
						sprintf( date, "%4d-%2d-%2d %2d:%2d:%2d", tp->year, tp->month, tp->day, tp->hour, tp->minute, tp->minute );
					
						if( cols == 0 )
						{
							sprintf( tmp, " %s = '%s'", (char *)dptr[ 1 ], date );
						}
						else
						{
							sprintf( tmp, ", %s = '%s'", (char *)dptr[ 1 ], date );
						}
						strcat( tmpQuery, tmp );
					}
					*/
				}
			break;
		}
		
		cols++;
		dptr += 3;
	}
	
	DEBUG("UPDATE FIRST PART %s\n", tmpQuery );
	
	if( primaryIdName != NULL )
	{
		char tmpvar[ 256 ];
		sprintf( tmpvar, " where %s = %d", primaryIdName, primaryId );
		//DEBUG("SQL update %s\n", tmpQuery );
		strcat( tmpQuery, tmpvar );
	}
	DEBUG("UPDATE QUERY '%s'\n", tmpQuery );
	
	if( mysql_query( l->con.sql_Con, tmpQuery ) )
	{
		ERROR("Query error!\n");
		return 2;
	}
	
	return 0;
}

//
//
//

int Save( struct MYSQLLibrary *l, ULONG *descr, void *data )
{
	char finalQuery[ 4048 ];
	char tableQuery[ 2048 ];
	char dataQuery[ 2048 ];
	
	finalQuery[ 0 ] = 0;
	tableQuery[ 0 ] = 0;
	dataQuery[ 0 ] = 0;
	
	DEBUG("[MYSQLLibrary] Save\n");
	
	if( descr == NULL || data == NULL )
	{
		ERROR("Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		ERROR("SQLT_TABNAME was not provided!\n");
		return 0;
	}

	ULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	unsigned char *strptr = (unsigned char *)data;	// pointer to structure to which will will insert data
	int opt = 0;
	int *primaryid = NULL;
	
	while( dptr[0] != SQLT_END )
	{
		//DEBUG("Found on pos %d tag %d   row %s\n", i, dptr[ 0 ], row[ i ] ); 
		//DEBUG("Update POINTER %p\n", strptr );
		switch( dptr[ 0 ] )
		{
			case SQLT_IDINT:	// primary key
				{
					// we just skip that in save
					//strptr += 8;
					DEBUG("[MYSQLLibrary] : we dont save\n");
					
					primaryid = (int *)(strptr + dptr[ 2 ]);
/*					
					char tmp[ 256 ];
					int tmpint;
					memcpy( &tmpint, strptr + dptr[2], sizeof( int ) );
					sprintf( tmp, " %d", tmpint );
					
					if( opt > 0 )
					{
						strcat( tableQuery, "," );
						strcat( dataQuery, "," );
					}
					strcat( tableQuery, (char *)dptr[ 1 ] );
					strcat( dataQuery, tmp );
					
					DEBUG("[MYSQLLibrary] save set int %d to %s\n", tmpint, (char *)dptr[ 1 ] );
					
					opt++;
	*/				
					opt++;
				}
				break;
				
			case SQLT_INT:
				{
					char tmp[ 256 ];
					int tmpint;
					memcpy( &tmpint, strptr + dptr[2], sizeof( int ) );
					sprintf( tmp, " %d", tmpint );
					
					if( opt > 0 )
					{
						strcat( tableQuery, "," );
						strcat( dataQuery, "," );
					}
					strcat( tableQuery, (char *)dptr[ 1 ] );
					strcat( dataQuery, tmp );
					
					DEBUG("[MYSQLLibrary] save set int %d to %s\n", tmpint, (char *)dptr[ 1 ] );
					
					opt++;
					
				}
				break;
				
			case SQLT_STR:
				{
					char *tmpchar;
					memcpy( &tmpchar, strptr+dptr[2], sizeof( char *) );
					
					DEBUG("[MYSQLLibrary] save  pointer to text %p\n", tmpchar );
					
					if( tmpchar != NULL )
					{
						if( opt > 0 )
						{
							strcat( tableQuery, "," );
							strcat( dataQuery, "," );
						}
						//strcat( tableQuery, "'" );
						strcat( dataQuery, "'" );
						strcat( tableQuery, (char *)dptr[ 1 ] );
						DEBUG("[MYSQLLibrary] save before cat, column name %s\n", (char *)dptr[ 1 ] );
						strcat( dataQuery, tmpchar );
						//strcat( tableQuery, "'" );
						strcat( dataQuery, "'" );
						
						DEBUG("[MYSQLLibrary] save set string %s to %s\n", tmpchar, (char *)dptr[ 1 ] );
					}
					
					opt++;
				}
				break;
				
			case SQLT_TIMESTAMP:
				{
					// '2015-08-10 16:28:31'
					char date[ 64 ];
					
					DEBUG("SQLTimestamp SAVE\n");
				
					struct tm *tp = (struct tm *)( strptr+dptr[2]);
					//memcpy( &tp, strptr+dptr[2], sizeof( MYSQL_TIME *) );	// copy timestamp pointer
				
					//if( tp != NULL )
					{
						//sprintf( date, "%04d-%02d-%02d %02d:%02d:%02d", tp.tm_year, tp.tm_mon, tp.tm_mday, (int)tp.tm_hour, (int)tp.tm_min, (int)tp.tm_sec );
						sprintf( date, "%4d-%2d-%2d %2d:%2d:%2d", tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
					
						if( opt > 0 )
						{
							strcat( tableQuery, "," );
							strcat( dataQuery, "," );
						}
						//strcat( tableQuery, "'" );
						strcat( dataQuery, "'" );
						strcat( tableQuery, (char *)dptr[ 1 ] );
						DEBUG("[MYSQLLibrary] save before cat, column name %s\n", (char *)dptr[ 1 ] );
						strcat( dataQuery, date );
						//strcat( tableQuery, "'" );
						strcat( dataQuery, "'" );
						
						//DEBUG("[MYSQLLibrary] save set string %s to %s\n", tmpchar, (char *)dptr[ 1 ] );
					}
					opt++;
				}
			break;
		}
		
		dptr += 3;
	}
	

	sprintf( finalQuery, "INSERT INTO %s ( %s ) VALUES( %s )", (char *)descr[ 1 ], tableQuery, dataQuery );
	DEBUG("SQL: %s\n", finalQuery );
	
	MYSQL_RES *result = NULL;
	
	if( mysql_query( l->con.sql_Con, finalQuery ) )
	{
		ERROR( "%s\n", mysql_error( l->con.sql_Con ) );
		ERROR("Cannot run query!\n");
		return 2;
	}
	
	
	if( primaryid != NULL )
	{
		/*
		if( ( result = mysql_store_result( l->con.sql_Con) ) == 0 &&
			mysql_field_count( l->con.sql_Con ) == 0 &&
			mysql_insert_id( l->con.sql_Con ) != 0 )
		{*/
			int uid = mysql_insert_id( l->con.sql_Con );
			memcpy( primaryid, &uid, sizeof( int ) );
			DEBUG("NEW ENTRY ID %d\n", uid );
		//}
	}
	

	DEBUG("[MYSQLLibrary]: insert %s\n", finalQuery );
	
	if( result != NULL )
	{
		mysql_free_result( result );
	}
	
	return 0;
}

//
// remove object from database
//

void Delete( struct MYSQLLibrary *l, ULONG *descr, void *data )
{
	char tmpQuery[ 1024 ];
	//ULONG *dptr = &descr[ 2 ];		// first 2 entries inform about table, rest information provided is about columns
	int *strptr = (int *)data;		// we are sure that first element in a structure is our SQLT_IDINT

	// we should go trough for structure to find SQLT_IDINT

	sprintf( tmpQuery, "delete from %s where ID = '%d'", (char *)descr[1], *strptr );

	if( mysql_query( l->con.sql_Con, tmpQuery ) )
	{
		return;
	}

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if (result == NULL) 
	{
		return;
 	}

	mysql_free_result( result );
}


//
// get number of records in database
//

int NumberOfRecords( struct MYSQLLibrary *l, ULONG *descr, char *where )
{
	char tmpQuery[ 1024 ];
	int intRet = -1;
	DEBUG("[MYSQLLibrary] NumberOfRecords\n");
	
	if( descr == NULL  )
	{
		ERROR("Data description was not provided!\n");
		return -1;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		ERROR("SQLT_TABNAME was not provided!\n");
		return -2;
	}

	if( where != NULL )
	{
		sprintf( tmpQuery, "select count(*) from %s where %s", (char *)descr[ 1 ], where );
	}
	else
	{
		sprintf( tmpQuery, "select count(*) from %s", (char *)descr[ 1 ] );
	}
	
	if( mysql_query( l->con.sql_Con, tmpQuery ) )
	{
		DEBUG("Cannot run query: '%s'\n", tmpQuery );
		DEBUG( "%s\n", mysql_error( l->con.sql_Con ) );
		return -3;
	}

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if (result == NULL) 
	{
		DEBUG("Query return empty results\n");
		return -4;
 	}

	MYSQL_ROW row;
	//
	// Receiving data as linked list of objects
	//
	DEBUG("[MYSQLLibrary] Before results\n" );
  
	while ( ( row = mysql_fetch_row( result ) ) ) 
	{
		intRet = (int)atol( row[ 0 ] );
	}

	mysql_free_result( result );
	DEBUG("[MYSQLLibrary] NumberOfRecords END\n");
	
	return intRet;
}

//
//
//

MYSQL_RES *Select( struct MYSQLLibrary *l, const char *sel )
{
	if( mysql_query( l->con.sql_Con, sel ) )
	{
		ERROR("Cannot run query: '%s'\n", sel );
		ERROR( "%s\n", mysql_error( l->con.sql_Con ) );
		return NULL;
	}
	
	DEBUG("SELECT QUERY %s\n", sel );

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
	
	return result;
}

//
//
//

MYSQL_ROW FetchRow( struct MYSQLLibrary *l, MYSQL_RES *res )
{
	return mysql_fetch_row( res );
}

//
//
//

void FreeResult( struct MYSQLLibrary *l, MYSQL_RES *res )
{
	mysql_free_result( res );
}

//
// dupstring
//

char* StringDuplicate( const char* str )
{
	return strcpy( calloc( strlen( str ) + 1, sizeof( char ) ), str );
}


