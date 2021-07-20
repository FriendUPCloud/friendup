/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  sqlite.library code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/09/2017
 */

#include <stdio.h>
#include <core/types.h>
#include <core/library.h>
#include <db/sqllib.h>
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <interface/properties_interface.h>
#include <core/nodes.h>
#include <time.h>
#include <system/systembase.h>
#include <ctype.h>
#include <sqlite3.h> 
#include <stddef.h>

#define LIB_NAME "sqlite.library"
#define LIB_VERSION 1
#define LIB_REVISION 0

typedef struct SQLiteResult
{
	int rows, cols;
	int currentRow;
	char ***data;
	char *errMsg;
}SQLiteResult;

typedef struct SQLiteRow
{
	FULONG *desc;	// pointer to descriptor
	MinNode *node;	// pointer to last node
}SQLiteRow;

//
// internal callbacks
//

static int RowsNrCallback( void *data, int argc, char **argv, char **azColName )
{
	SQLiteResult *sqlres = (SQLiteResult *)data;
	sqlres->rows++;
	if( sqlres->cols == 0 )
	{
		sqlres->cols = argc;
	}
	return 0;
}

static int GetDataCallback( void * data, int argc, char **argv, char **azColName )
{
	SQLiteResult *sqlres = (SQLiteResult *)data;
	int i;
	
	if( ( sqlres->data[ sqlres->currentRow ] = FCalloc( sqlres->cols, sizeof( char * ) ) ) != NULL )
	{
		for( i=0; i<argc; i++ )
		{
			sqlres->data[ sqlres->currentRow ][ i ] = StringDuplicate( argv[ i ] );
		}
	}
	sqlres->currentRow++;

	return 0;
}

static int LoadGetDataCallback( void * data, int argc, char **argv, char **azColName )
{
	SQLiteResult *sqlres = (SQLiteResult *)data;
	int i;
	
	if( ( sqlres->data[ sqlres->currentRow ] = FCalloc( sqlres->cols, sizeof( char * ) ) ) != NULL )
	{
		for( i=0; i<argc; i++ )
		{
			sqlres->data[ sqlres->currentRow ][ i ] = StringDuplicate( argv[ i ] );
		}
	}
	sqlres->currentRow++;

	return 0;
}

/**
 * return version of library
 *
 * @return library version
 */
long GetVersion(void)
{
	return LIB_VERSION;
}

/**
 * return revision of library
 *
 * @return library revision
 */
long GetRevision(void)
{
	return LIB_REVISION;
}

typedef struct SpecialData
{
	char *msg;
}SpecialData;

/**
 * Load data from database
 *
 * @param l pointer to sql.library structure
 * @param desc pointer to taglist which represent DB to C structure conversion
 * @param where pointer to string which represent "where" part of query. If value is equal to NULL all data are taken from db.
 * @param entries pointer to interger where number of loaded entries will be returned
 * @return pointer to new structure or list of structures.
 */
void *Load( struct SQLLibrary *l, const FULONG *descr, char *where, int *entries )
//void *Load( struct SQLLibrary *l, FULONG *descr, char *where, int *entries )
{
	//char tmpQuery[ 1024 ];
	BufString *tmpQuerybs = BufStringNew();
	void *firstObject = NULL;
	DEBUG("[SQLite] Load\n");
	
	// Check if there was a description structure for the table
	if( descr == NULL  )
	{
		FERROR("Data description was not provided!\n");
		return NULL;
	}
	
	// Check if a table name is specified
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		FERROR("SQLT_TABNAME was not provided!\n");
		return NULL;
	}

	char tmpvar[ 512 ];
	int pos = 0;
	int size = 0;
	BufStringAdd( tmpQuerybs, "SELECT " );
	FULONG *dptr = (FULONG *)&descr[ SQL_DATA_STRUCT_START ]; 
	
	while( dptr[0] != SQLT_END )
	{
		if( dptr[0] != SQLT_NODE && dptr[0] != SQLT_INIT_FUNCTION )
		{
			if( pos == 0 )
			{
				size = snprintf( tmpvar, sizeof(tmpvar),"`%s`", (char *)dptr[ 1 ] );
			}
			else
			{
				size = snprintf( tmpvar, sizeof(tmpvar),",`%s`", (char *)dptr[ 1 ] );
			}
			pos++;
			
			BufStringAddSize( tmpQuerybs, tmpvar, size );
		}
		dptr += 3;
	}
	
	// Check that there is a where query

	if( where != NULL )
	{
		size = snprintf( tmpvar, sizeof(tmpvar), " FROM %s WHERE %s", (char *)descr[ 1 ], where );
	}
	// Just select all
	else
	{
		size = snprintf( tmpvar, sizeof(tmpvar), " FROM %s", (char *)descr[ 1 ] );
	}
	
	BufStringAddSize( tmpQuerybs, tmpvar, size );
	sqlite3_stmt *stmt;
	
	if( sqlite3_prepare_v2( l->con.sql_Con, tmpQuerybs->bs_Buffer, -1, &stmt, 0 ) != SQLITE_OK )
	{
		FERROR("Cannot run query: '%s'\n", tmpQuerybs->bs_Buffer );
		BufStringDelete( tmpQuerybs );
		FERROR( "[SQLite]  %s\n", sqlite3_errmsg( l->con.sql_Con ) );
		return NULL;
	}

	// This is where the data starts!
	MinNode *node = NULL;
	
	int j = 0;
	*entries = 0;

	//
	// Receiving data as linked list of objects
	//

	int ret_code = 0;
    while( ( ret_code = sqlite3_step( stmt ) ) == SQLITE_ROW )
	{
		(*entries)++;
		
		void *data = FCalloc( 1, descr[ SQL_DATA_STRUCTURE_SIZE ] );
		int dataUsed = 0; // Tell if we need to free data..
		
		// Link the first object (which holds the start of the data)
		if( firstObject == NULL ) firstObject = data;
		
		FUBYTE *strptr = (FUBYTE *)data;	// pointer to structure to which will will insert data
		
		// first 2 entries inform about table and size, rest information provided is about columns
		dptr = (FULONG *)&descr[ SQL_DATA_STRUCT_START ]; 
		
		int i = 0;
		int col = 0;
			
		// While the column is not the last
		while( dptr[0] != SQLT_END )
		{
			switch( dptr[ 0 ] )
			{
				case SQLT_NODE:
					{
						dataUsed = 1;
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
							int tmp = sqlite3_column_int( stmt, col++ );
							memcpy( strptr + dptr[ 2 ], &tmp, sizeof( int ) );
						}
						break;
					case SQLT_STR:
						{
							char *data = (char *)sqlite3_column_text( stmt, col++ );
							if( data != NULL )
							{
								int len = strlen( data );
								char *tmpval = calloc( len + 1, sizeof( char ) );
								if( tmpval )
								{
									// Copy mysql data
									memcpy( tmpval, data, len );
									// Add tmpval to string pointer list..
									memcpy( strptr + dptr[2], &tmpval, sizeof( char * ) );
								}
							}
						}
						break;
						
					case SQLT_DATETIME:
						{
							//struct tm ltm;
							//ltm.tm_year += 1900;
							//ltm.tm_mon ++;
							struct tm *ltm = (struct tm *)strptr + dptr[ 2 ];
							
							char *data = (char *)sqlite3_column_text( stmt, col++ );
							if( data != NULL )
							{
								if( sscanf( (char *)data, "%d-%d-%d %d:%d:%d", &(ltm->tm_year), &(ltm->tm_mon), &(ltm->tm_mday), &(ltm->tm_hour), &(ltm->tm_min), &(ltm->tm_sec) ) != EOF )
								{
								}
								if( ltm->tm_year > 1900 )
								{
									ltm->tm_year -= 1900;
								}
							}
							//memcpy( strptr + dptr[ 2 ], &lotime, sizeof( time_t ) );
							DEBUG("[SQLite] TIMESTAMP load %s\n", data );
						}
						break;
						
					case SQLT_DATE:
						{
							struct tm *ltm = (struct tm *)strptr + dptr[ 2 ];
							char *data = (char *)sqlite3_column_text( stmt, col++ );
							if( data != NULL )
							{
								if( sscanf( (char *)data, "%d-%d-%d", &(ltm->tm_year), &(ltm->tm_mon), &(ltm->tm_mday) ) != EOF )
								{
									ltm->tm_hour = ltm->tm_min = ltm->tm_sec = 0;
								}
								if( ltm->tm_year > 1900 )
								{
									ltm->tm_year -= 1900;
								}
								DEBUG("[SQLite] DATE load %s\n", data );
							}
							DEBUG("[SQLite] Year %d  month %d  day %d\n", ltm->tm_year, ltm->tm_mon, ltm->tm_mday );
						}
						break;

					case SQLT_LONG:
						{
							FLONG tmp = 0;
							char *data = (char *)sqlite3_column_text( stmt, col++ );
							if( data != NULL )
							{
								char *end;
								tmp = (FLONG)strtoll( data, &end, 0 );
							}
							memcpy( strptr + dptr[ 2 ], &tmp, sizeof( FLONG ) );
						}
					break;
					
					case SQLT_BLOB:
						{
							DEBUG("[SQLite] Read BLOB\n");
							ListString *ls = ListStringNew();
							if( ls != NULL )
							{
								const char *data = sqlite3_column_blob( stmt, col++ );
								ListStringAdd( ls, (char *)data, strlen(data) );
								
								ListStringJoin( ls );
							}
							else
							{
								FERROR("Cannot allocate memory for BLOB\n");
							}
							
							// copy pointer to this list
							memcpy( strptr + dptr[2], &ls, sizeof( ListString * ) );
							//ListStringDelete( ls );
						}
					break;
					
						case SQLT_INIT_FUNCTION:
						{
							DEBUG("[SQLite] Init function found, calling it\n");
							if( ((void *)dptr[2]) != NULL && data != NULL )
							{
								void (*funcptr)( void * ) = (void *)(void *)dptr[2];
								funcptr( (void *)data );
							}
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
			{
				firstObject = NULL;
			}
			FFree( data );
		}
	}

	sqlite3_finalize( stmt );
	BufStringDelete( tmpQuerybs );
	
	DEBUG("[SQLite] Load END\n");
	
	return firstObject;
}

/**
 * Update data in database. Structure must contain primaryID key.
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param data pointer to object which will be updated in DB
 * @return 0 when success, otherwise error number
 */
int Update( struct SQLLibrary *l, FULONG *descr, void *data )
{
	BufString *querybs = BufStringNew();
	char tmpQuery[ 2048 ];
	int primaryId = -1;
	char *primaryIdName = NULL;
	DEBUG("[SQLite] Update\n");
	sqlite3_stmt *stmt;
	
	if( descr == NULL || data == NULL )
	{
		BufStringDelete( querybs );
		DEBUG("[SQLite] Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		BufStringDelete( querybs );
		DEBUG("[SQLite] SQLT_TABNAME was not provided!\n");
		return 0;
	}
	
	//"UPDATE %s set SessionID = '%s', LastActionTime = '%lld' where Name = '%s'"
	
	int lsize = sprintf( tmpQuery, "UPDATE %s set ", (char *)descr[ 1 ] );
	BufStringAddSize( querybs, tmpQuery, lsize );

	DEBUG("[SQLite] Update SQL: %s\n", tmpQuery );
	
	char *whereColName = NULL;
	int whereColValue = -1;
	FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];
	unsigned char *strptr = (unsigned char *)data;	// pointer to structure to which will will insert data
	int pos = 0;
	
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
			default:
				{
					char tmp[ 256 ];
					int size = 0;
					
					if( pos++ == 0 )
					{
						size = snprintf( tmp, sizeof(tmp), "`%s`=? ", (char *) dptr[ 1 ] );
					}
					else
					{
						size = snprintf( tmp, sizeof(tmp), ",`%s`=? ", (char *) dptr[ 1 ] );
					}
					BufStringAddSize( querybs, tmp, size );
				}
				break;
		}
		if( whereColName != NULL )
		{
			break;
		}
		dptr += 3;
	}
	
	if( primaryIdName != NULL )
	{
		char tmpvar[ 256 ];
		int sprintfsize = sprintf( tmpvar, " where %s = %d", primaryIdName, primaryId );
		BufStringAddSize( querybs, tmpvar, sprintfsize );
	}
	DEBUG("[SQLite] UPDATE QUERY '%s'\n", tmpQuery );
	
	dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	
	int cols = 1;
	
	int rc = sqlite3_prepare( l->con.sql_Con, querybs->bs_Buffer, -1, &stmt, 0 );
	
	if( rc == SQLITE_OK )
	{
		while( dptr[0] != SQLT_END )
		{
			switch( dptr[ 0 ] )
			{
				case SQLT_IDINT:	// primary key
					{
						// we just skip that in update
					
						int tmpint;
						memcpy( &tmpint, strptr + dptr[ 2 ], sizeof( int ) );
						primaryId = tmpint;
						primaryIdName = ( char *)dptr[ 1 ];
					
						DEBUG("[SQLite] : we dont update PRIMARY KEY %d\n", primaryId );
					}
					break;
				
				case SQLT_INT:
					{
						char tmp[ 256 ];
						int tmpint;
						int sprintfsize = 0;
					
						memcpy( &tmpint, strptr + dptr[ 2 ], sizeof( int ) );

						sqlite3_bind_int( stmt, cols, tmpint );
					
						cols++;

						DEBUG("[SQLite] update set int %d to %s\n", tmpint, (char *)dptr[ 1 ] );
					}
					break;
				
				case SQLT_STR:
					{
						char *tmpchar;
						memcpy( &tmpchar, strptr + dptr[ 2 ], sizeof( char *) );
						DEBUG("[SQLite] update, pointer %p\n", tmpchar );
						int sprintfsize = 0;
					
						if( tmpchar != NULL )
						{
							sqlite3_bind_text( stmt, cols, tmpchar, strlen(tmpchar), SQLITE_STATIC );

							DEBUG("[SQLite] update set string %s to %s\n", tmpchar, (char *)dptr[ 1 ] );
						}
						else	// string was set to NULL
						{
							sqlite3_bind_text( stmt, cols, NULL, 0, SQLITE_STATIC );
						}
						cols++;
					}
					break;
				
					case SQLT_DATETIME:
					{
						// '2015-08-10 16:28:31'
						char date[ 64 ];
					
						time_t *timepointer = (time_t *)( strptr+dptr[2] );
						struct tm *tp;
						tp = localtime( timepointer );

						if( (dptr[2]) != 0 )
						{
							if( tp->tm_year < 1901 ) tp->tm_year += 1900;
							if( tp->tm_mon < 1 ) tp->tm_mon = 1;
							if( tp->tm_mday < 1 ) tp->tm_mday = 1;
							sprintf( date, "%04d-%02d-%02d %02d:%02d:%02d", tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
						
							DEBUG("[SQLite] DATE serialised %s\n", date );
					
							sqlite3_bind_text( stmt, cols, date, strlen(date), SQLITE_TRANSIENT );
							cols++;
						}
					}
				break;
			
				case SQLT_DATE:
					{
						int sprintfsize = 0;
						char date[ 64 ];

						struct tm *tp = (struct tm *)( strptr+dptr[2]);

						if( (dptr[2]) != 0 )
						{
							if( tp->tm_year < 1901 ) tp->tm_year += 1900;
							if( tp->tm_mon < 1 ) tp->tm_mon = 1;
							if( tp->tm_mday < 1 ) tp->tm_mday = 1;
							sprintf( date, "%04d-%02d-%02d", tp->tm_year, tp->tm_mon, tp->tm_mday );
						
							DEBUG("[SQLite] DATE serialised %s\n", date );
					
							sqlite3_bind_text( stmt, cols, date, strlen(date), SQLITE_TRANSIENT );
							cols++;
						}
					}
				break;
			}
			dptr += 3;
		}
	}	// statement OK

	BufStringDelete( querybs );
	
	return 0;
}

#define FRIEND_MAX_BIND 256

/**
 * Save data in database. Primary ID will be stored in structure
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param data pointer to object which will be updated in DB
 * @return 0 when success, otherwise error number
 */
int Save( struct SQLLibrary *l, const FULONG *descr, void *data )
{
	char *finalQuery = NULL;
	BufString *tablequerybs = BufStringNew();
	BufString *dataquerybs = BufStringNew();
	
	DEBUG("[SQLite] Save\n");
	
	if( descr == NULL || data == NULL )
	{
		BufStringDelete( tablequerybs );
		BufStringDelete( dataquerybs );
		FERROR("Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		BufStringDelete( tablequerybs );
		BufStringDelete( dataquerybs );
		FERROR("SQLT_TABNAME was not provided!\n");
		return 0;
	}

	FULONG *dptr = (FULONG *)&descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	unsigned char *strptr = (unsigned char *)data;	// pointer to structure to which will will insert data
	int opt = 0;
	int *primaryid = NULL;
	int statementEntry = 0;
	
	long bindLength[ FRIEND_MAX_BIND ];
	ListString *bindData[ FRIEND_MAX_BIND ];
	
	sqlite3_stmt *stmt;
	
	while( dptr[0] != SQLT_END )
	{
		switch( dptr[ 0 ] )
		{
			// skip
			case SQLT_IDINT:
				break;
			case SQLT_INT:
			case SQLT_STR:
			case SQLT_DATETIME:
			case SQLT_DATE:
			case SQLT_BLOB:
				if( opt > 0 )
					{
						BufStringAddSize( tablequerybs, ",", 1 );
						BufStringAddSize( dataquerybs, ",", 1 );
					}
					BufStringAdd( tablequerybs, (char *)dptr[ 1 ]  );
					BufStringAddSize( dataquerybs, "?", 1 );
				opt++;
				break;
		}
		dptr += 3;
	}
	
	dptr = (FULONG *)&descr[ SQL_DATA_STRUCT_START ];
	opt = 1;		// seems its starting from 1
	
	int finalqsize = tablequerybs->bs_Size + dataquerybs->bs_Size + 256;
	if( ( finalQuery = FMalloc( finalqsize ) ) != NULL )
	{
		sprintf( finalQuery, "INSERT INTO %s ( %s ) VALUES( %s )", (char *)descr[ 1 ], tablequerybs->bs_Buffer, dataquerybs->bs_Buffer );
		
		int rc = sqlite3_prepare( l->con.sql_Con, finalQuery, -1, &stmt, 0 );
		
		if( rc == SQLITE_OK )
		{
			// we calculate how many entries we will have
			while( dptr[0] != SQLT_END )
			{
				switch( dptr[ 0 ] )
				{
					case SQLT_IDINT:	// primary key
					{
						// we just skip that in save
						primaryid = (int *)(strptr + dptr[ 2 ]);
					}
					break;
				
					case SQLT_INT:
					{
						int tmpint;
						memcpy( &tmpint, strptr + dptr[2], sizeof( int ) );
					
						sqlite3_bind_int64( stmt, opt, tmpint );
						opt++;
					}
					break;
				
					case SQLT_STR:
					{
						char *tmpchar;

						memcpy( &tmpchar, strptr+dptr[2], sizeof( char *) );

						if( tmpchar != NULL )
						{
							sqlite3_bind_text( stmt, opt, tmpchar, strlen(tmpchar), SQLITE_STATIC );
						}
						opt++;
					}
					break;
				
					case SQLT_DATETIME:
					{
						// '2015-08-10 16:28:31'
						char date[ 64 ];
						
						time_t *timepointer = (time_t *)( strptr+dptr[2]);
						struct tm *tp;
							tp = localtime( timepointer );
						if( dptr[2] != 0 )
						{
							if( tp->tm_year < 1901 ) tp->tm_year += 1900;
							if( tp->tm_mon < 1 ) tp->tm_mon = 1;
							if( tp->tm_mday < 1 ) tp->tm_mday = 1;

							sprintf( date, "%04d-%02d-%02d %02d:%02d:%02d", tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
							sqlite3_bind_text( stmt, opt, date, strlen(date), SQLITE_TRANSIENT );
						}
						opt++;
					}
					break;
				
					case SQLT_DATE:
					{
						// '2015-08-10'
						char date[ 64 ];
						
						struct tm *tp = (struct tm *)( strptr+dptr[2]);
						if( dptr[2] != 0 )
						{
							if( tp->tm_year < 1901 ) tp->tm_year += 1900;
							if( tp->tm_mon < 1 ) tp->tm_mon = 1;
							if( tp->tm_mday < 1 ) tp->tm_mday = 1;

							sprintf( date, "%04d-%02d-%02d", tp->tm_year, tp->tm_mon, tp->tm_mday );
						
							sqlite3_bind_text( stmt, opt, date, strlen(date), SQLITE_TRANSIENT );
						}
						opt++;
					}
					break;
				
					case SQLT_BLOB:
					{
						ListString *ls = NULL;

						memcpy( &ls, strptr+dptr[2], sizeof( ListString *) );
					
						if( ls != NULL && ls->ls_Data != NULL )
						{
							sqlite3_bind_blob( stmt, opt, ls->ls_Data, ls->ls_Size, SQLITE_STATIC );
							statementEntry++;
						}
						else
						{
							FERROR("Cannot store blob, buffer is empty!\n");
						}
						opt++;
					}
					break;
				}	// end switch
			dptr += 3;
			}	// end of while, end of table
		// end of if( statement init)
		} // sqlite stmt ok
		
		rc = sqlite3_step( stmt );
    
		if( rc != SQLITE_DONE )
		{
			FERROR("execution failed: %s", sqlite3_errmsg( l->con.sql_Con ) );
		}
        
		sqlite3_finalize( stmt );
		
		if( primaryid != NULL )
		{
			FULONG uid = sqlite3_last_insert_rowid( l->con.sql_Con );
			memcpy( primaryid, &uid, sizeof( FULONG ) );
			DEBUG("[SQLite] New entry created in DB, ID: %lu\n", uid );
		}
		
		FFree( finalQuery );
	}
	BufStringDelete( tablequerybs );
	BufStringDelete( dataquerybs );
	
	return 0;
}

/**
 * Delete data in database. Structure must contain primaryID key.
 *
 * @param l pointer to mysql.library structure
 * @param desc pointer to taglist which represent DB to C structure conversion
 * @param data pointer to object which will be updated in DB
 */
void Delete( struct SQLLibrary *l, FULONG *descr, void *data )
{
	char tmpQuery[ 1024 ];
	int *strptr = (int *)data;		// we are sure that first element in a structure is our SQLT_IDINT

	// we should go trough for structure to find SQLT_IDINT

	sprintf( tmpQuery, "delete from %s where ID = '%d'", (char *)descr[1], *strptr );

	char *errMsg = NULL;
	
	int rc = sqlite3_exec( l->con.sql_Con, tmpQuery, NULL, (void* )NULL, &errMsg );
	if(rc != SQLITE_OK ) 
	{
		FERROR("Error: %s", (char *)sqlite3_errmsg( l->con.sql_Con ) );
	}
}

/**
 * Delete data in database. Call is using custom "where"
 *
 * @param l pointer to mysql.library structure
 * @param desc pointer to taglist which represent DB to C structure conversion
 * @param where pointer to custom "where" part of query
 */
void DeleteWhere( struct SQLLibrary *l, FULONG *descr, char *where )
{
	char tmpQuery[ 2048 ];
	// we should go trough for structure to find SQLT_IDINT

	sprintf( tmpQuery, "delete from %s WHERE %s", (char *)descr[1], where );

	char *errMsg = NULL;
	
	int rc = sqlite3_exec( l->con.sql_Con, tmpQuery, NULL, (void* )NULL, &errMsg );
	if(rc != SQLITE_OK ) 
	{
		FERROR("Error: %s", (char *)sqlite3_errmsg( l->con.sql_Con ) );
	}
}

/**
 * Return last error
 *
 * @param l pointer to mysql.library structure
 * @return error string or null
 */
const char *GetLastError( struct SQLLibrary *l )
{
	if( l != NULL &&  l->con.sql_Con != NULL )
	{

	}
	return NULL;
}

/**
 * Return number of entries in database
 *
 * @param l pointer to mysql.library structure
 * @param desc pointer to taglist which represent DB to C structure conversion
 * @param where pointer to custom "where" part of query
 * @return number of entries found in database
 */
int NumberOfRecords( struct SQLLibrary *l, FULONG *descr, char *where )
{
	char tmpQuery[ 1024 ];
	int intRet = -1;
	DEBUG("[SQLite] NumberOfRecords\n");
	
	if( descr == NULL  )
	{
		FERROR("Data description was not provided!\n");
		return -1;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		FERROR("SQLT_TABNAME was not provided!\n");
		return -2;
	}

	if( where != NULL )
	{
		sprintf( tmpQuery, "select count(*) from %s", where );
	}
	else
	{
		sprintf( tmpQuery, "select count(*) from %s", (char *)descr[ 1 ] );
	}
	
	sqlite3_stmt *stmt = NULL;
	int rc = sqlite3_prepare_v2( l->con.sql_Con, tmpQuery, -1, &stmt, NULL);
	if( rc != SQLITE_OK )
	{
        return -1;
	}

	rc = sqlite3_step( stmt );
	while (rc != SQLITE_DONE && rc != SQLITE_OK)
    {
		int type = sqlite3_column_type( stmt, 0 );
		if (type == SQLITE_INTEGER)
		{
			intRet = sqlite3_column_int( stmt, 0 );
		}
		break;
	}
	
	rc = sqlite3_finalize( stmt );

	DEBUG("[SQLite] NumberOfRecords END\n");
	
	return intRet;
}

/**
 * Return number of entries in database. Function is using custom query
 *
 * @param l pointer to mysql.library structure
 * @param where pointer to custom query
 * @return number of entries found in database
 */
int NumberOfRecordsCustomQuery( struct SQLLibrary *l, const char *query )
{
	DEBUG("[SQLite] NumberOfRecordsCustomQuery START\n");
	int intRet = -1;
	sqlite3_stmt *stmt = NULL;
	int rc = sqlite3_prepare_v2( l->con.sql_Con, query, -1, &stmt, NULL);
	if( rc != SQLITE_OK )
	{
        return -1;
	}
	
	int rowCount = 0;
	rc = sqlite3_step( stmt );
	while (rc != SQLITE_DONE && rc != SQLITE_OK)
    {
		int type = sqlite3_column_type( stmt, 0 );
		if (type == SQLITE_INTEGER)
		{
			intRet = sqlite3_column_int( stmt, 0 );
		}
		break;
	}
	
	rc = sqlite3_finalize( stmt );

	DEBUG("[SQLite] NumberOfRecordsCustomQuery END\n");
	
	return intRet;
}

/**
 * Select function
 *
 * @param l pointer to mysql.library structure
 * @param sel pointer to custom query
 * @return pointer to MYSQL_RES structure
 */
void *Query( struct SQLLibrary *l, const char *sel )
{
	SQLiteResult *res = FCalloc( 1, sizeof(SQLiteResult) );
	if( res != NULL )
	{
		int rc = sqlite3_exec( l->con.sql_Con, sel, RowsNrCallback, (void* )res, &(res->errMsg));
	
		if( rc != SQLITE_OK )
		{
			FERROR("Cannot run query: '%s'\n", sel );
			if( res->errMsg != NULL )
			{
				FFree( res->errMsg );
			}
			FFree( res );
			return NULL;
		}
		
		if( res->rows == 0 )
		{
			FFree( res );
			return NULL;
		}
		
		if( ( res->data = FMalloc( res->rows * sizeof( char ** ) ) ) != NULL )
		{
			rc = sqlite3_exec( l->con.sql_Con, sel, GetDataCallback, (void* )res, &(res->errMsg));
			
			res->currentRow = 0;
		}
	
		DEBUG("[SQLiteLLibrary] SELECT QUERY %s\n", sel );
	}
	return res;
}

/**
 * Call SQL query like insert, update
 *
 * @param l pointer to mysql.library structure
 * @param sel pointer to string with full sql query
 * @return 0 when success, otherwise error number
 */
int QueryWithoutResults( struct SQLLibrary *l, const char *sel )
{
	if( l != NULL )
	{
		if( l->con.sql_Con != NULL )
		{
			char *errMsg = NULL;
			
			int rc = sqlite3_exec( l->con.sql_Con, sel, NULL, (void* )NULL, &errMsg );
			if(rc != SQLITE_OK ) 
			{
				FERROR("Error: %s\n", (char *)sqlite3_errmsg( l->con.sql_Con ) );
				return -1;
			}

			return 0;
		}
		else
		{
			FERROR("Connection is equal to NULL\n");
		}
	}
	else
	{
		FERROR("Mysql.library is NULL\n");
	}
	return -2;
}

/**
 * Return number of rows from sql results
 *
 * @param l pointer to mysql.library structure
 * @param res pointer to SQL response
 * @return 0 number of rows
 */
int NumberOfRows( struct SQLLibrary *l, void *res )
{
	if( res == NULL )
	{
		return 0;
	}
	SQLiteResult *locres = (SQLiteResult *)res;
	return locres->rows;
}

/**
 * Fetch char ** (row) from result
 *
 * @param l pointer to mysql.library structure
 * @param res pointer to MYSQL_RES
 * @return MYSQL_ROW when success, otherwise NULL
 */
char **FetchRow( struct SQLLibrary *l, void *res )
{
	if( res == NULL )
	{
		return NULL;
	}
	SQLiteResult *locres = (SQLiteResult *)res;
	if( locres->currentRow >= locres->rows )
	{
		return NULL;
	}
	return locres->data[ locres->currentRow++ ];
}

/**
 * Free sql result (MYSQL_RES)
 *
 * @param l pointer to mysql.library structure
 * @param res pointer to MYSQL_RES
 */
void FreeResult( struct SQLLibrary *l, void *res )
{
	if( res == NULL )
	{
		return;
	}
	SQLiteResult *locres = (SQLiteResult *)res;
	int i, j;
	
	for( i=0 ; i < locres->rows ; i++ )
	{
		for( j=0 ; j < locres->cols ; j++ )
		{
			if( locres->data[ i ][ j ] != NULL )
			{
				FFree( locres->data[ i ][ j ] );
			}
		}
		FFree( locres->data[ i ] );
	}
	FFree( locres->data );
}

//
//
//

#ifndef breakeven_point
#  define breakeven_point   6	// reasonable value one-size-fits-all value 
#endif

#define FastMemcpy( a, b, c ) \
	{ \
		register size_t nn = (size_t)( c ); \
		if( nn >= breakeven_point ) \
		{ \
			memcpy( ( a ), ( b ), nn); \
		}\
		else if( nn > 0 ) \
		{ \
			register char *dd; \
			register const char *ss; \
			for( ss=( b ), dd=( a ); nn>0; nn--) \
			{ \
				*dd++ = *ss++;\
			} \
		} \
	}

#define FastMemset( a, b, c) \
	{ \
		register size_t nn = (size_t)( c ); \
		if (nn >= breakeven_point ) \
		{ \
			memset( ( a ), (int)( b ), nn); \
		} \
		else if( nn > 0 ) \
		{ \
			register char *dd; \
			register const int cc=(int)( b ); \
			for( dd=( a ); nn>0; nn-- ) \
			{ \
				*dd++ = cc; \
			} \
		} \
	}
	
/**
 * SNPrintf function which escape bad signs from strings
 *
 * @param l pointer to mysql.library structure
 * @param str pointer to char table where string will be stored
 * @param stringSize size of allocated memory for destination string
 * @param fmt format string (like printf)
 * @param ... additional parameters
 * @return length of created string
 */
int SNPrintF( struct SQLLibrary *l, char *str, size_t stringSize, const char *fmt, ... )
{
	va_list ap;
	size_t retStringSize = 0;
	const char *ptr = fmt;
	char *escapedString = NULL;

	if( ptr == NULL )
	{
		ptr = "";
	}
	
	va_start( ap, fmt );

	while( *ptr )
	{
		if( *ptr != '%' )
		{
			const char *q = strchr( ptr+1,'%' );
			size_t n = (size_t)(!q ? (size_t)strlen( ptr ) : (size_t)( q-ptr ) );
			
			if( retStringSize < stringSize )
			{
				size_t avail = stringSize-retStringSize;
				FastMemcpy( str+retStringSize, ptr, ( n>avail ? avail : n ) );
			}
			
			ptr += n;
			retStringSize += n;
		}
		else
		{
			const char *startPointer;
			size_t minWidthField = 0, precision = 0;
			int zeroPadding = 0, specifiedPrecision = 0, justifyLeft = 0;
			int alternateForm = 0, forceSign = 0;
			int spaceForPositive = 1; 
			char lengthModifier = '\0'; 
			char tmp[ 32 ];
			
			char *stringArg;
			size_t stringArgSize;
			
			unsigned char unscharArg;
			size_t numOfZerosToPad = 0;
			size_t zeroPaddingInsertionInd = 0;
			char fmtSpec = '\0';
			
			stringArg = NULL;
			startPointer = ptr; ptr++; 
			
			while (*ptr == '0' || *ptr == '-' || *ptr == '+' ||
				*ptr == ' ' || *ptr == '#' || *ptr == '\'')
			{
				switch( *ptr )
				{
					case '0':
						zeroPadding = 1;
						break;
					case '-':
						justifyLeft = 1;
						break;
					case '+':
						forceSign = 1;
						spaceForPositive = 0;
						break;
					case ' ':
						forceSign = 1;
						break;
					case '#':
						alternateForm = 1;
						break;
					case '\'':
						break;
				}
				ptr++;
			}
			
			// parse field width
			if( *ptr == '*' )
			{
				int j;
				ptr++; j = va_arg(ap, int);
				
				if( j >= 0 )
				{
					minWidthField = j;
				}
				else
				{
					minWidthField = -j;
					justifyLeft = 1;
				}
			}
			else if( isdigit( (int)(*ptr)) )
			{
				unsigned int uj = *ptr++ - '0';
				while( isdigit((int)( *ptr )) )
				{
					uj = 10*uj + (unsigned int)(*ptr++ - '0');
				}
				minWidthField = uj;
			}
			
			if(*ptr == '.' )
			{
				ptr++;
				specifiedPrecision = 1;
				
				if( *ptr == '*' )
				{
					int j = va_arg(ap, int);
					ptr++;
					
					if( j >= 0 )
					{
						precision = j;
					}
					else
					{
						specifiedPrecision = 0; precision = 0;
					}
				}
				else if( isdigit((int)( *ptr )) )
				{
					unsigned int val = *ptr++ - '0';
					while( isdigit( (int)( *ptr )) )
					{
						val = 10* val + (unsigned int)(*ptr++ - '0');
					}
					precision = val;
				}
			}
			
			if( *ptr == 'h' || *ptr == 'l' )
			{
				lengthModifier = *ptr;
				ptr++;
				
				if( lengthModifier == 'l' && *ptr == 'l' )
				{
					lengthModifier = '2';
					ptr++;
				}
			}
			
			fmtSpec = *ptr;
			
			switch( fmtSpec )
			{
				case 'i':
					fmtSpec = 'd';
					break;
					
				case 'D':
					fmtSpec = 'd';
					lengthModifier = 'l';
					break;
					
				case 'U':
					fmtSpec = 'u';
					lengthModifier = 'l';
					break;
					
				case 'O':
					fmtSpec = 'o';
					lengthModifier = 'l';
					break;
					
				default:
					break;
			}
			
			switch( fmtSpec )
			{
				case '%': 
				case 'c': 
				case 's':
					lengthModifier = '\0';
					
					//zeroPadding = 0;    // turn zero padding off for string conversions
					
					stringArgSize = 1;
					
					switch( fmtSpec )
					{
						case '%':
							stringArg = (char *)ptr;
							break;
						case 'c':
						{
							int j = va_arg( ap, int );
							unscharArg = (unsigned char) j;
							stringArg = (char *) &unscharArg;
							break;
						}
						case 's':
							stringArg = (char *)va_arg( ap, const char * );
							if( !stringArg )
							{
								stringArgSize = 0;
							}
							else if( !specifiedPrecision )
							{
								stringArgSize = strlen( stringArg );
							}
							else if( precision == 0 )
							{
								stringArgSize = 0;
							}
							else
							{
								const char *q = memchr( stringArg, '\0', precision <= 0x7fffffff ? precision : 0x7fffffff );
								stringArgSize = !q ? precision : (size_t)(q-stringArg);
							}
							
							if( stringArg != NULL )
							{
								if( escapedString != NULL )
								{
									FFree( escapedString );
									escapedString = NULL;
								}
								
								stringArg = l->MakeEscapedString( l, stringArg );
								stringArgSize = strlen( stringArg );
								/*
								if( ( escapedString = FCalloc( (stringArgSize << 1 ) + 1, sizeof(char) ) ) != NULL )
								{
									stringArgSize = mysql_real_escape_string( l->con.sql_Con, escapedString, stringArg, stringArgSize );
									stringArg = escapedString;
								}
								*/
							}
							
							break;
						default:
							break;
					}
					break;
					
						case 'd':
						case 'u':
						case 'o':
						case 'x':
						case 'X':
						case 'p':
						{
							int argumentSign = 0;
							int intArg = 0;  
							unsigned int uintArg = 0;
							long int longArg = 0;  
							unsigned long int ulongArg = 0;
							
							long long int longLongArg = 0;
							unsigned long long int ulongLongArg = 0;
							void *ptrArg = NULL;
							
							if ( fmtSpec == 'p' )
							{
								lengthModifier = '\0';
								
								ptrArg = va_arg(ap, void *);
								if( ptrArg != NULL )
								{
									argumentSign = 1;
								}
							}
							else if( fmtSpec == 'd' )
							{
								switch( lengthModifier )
								{
									case '\0':
									case 'h':
										intArg = va_arg(ap, int);
										if( intArg > 0 )
										{
											argumentSign =  1;
										}
										else if( intArg < 0 )
										{
											argumentSign = -1;
										}
										break;
									case 'l':
										longArg = va_arg(ap, long int);
										if( longArg > 0 )
										{
											argumentSign =  1;
										}
										else if( longArg < 0 )
										{
											argumentSign = -1;
										}
										break;
										
									case '2':
										longLongArg = va_arg(ap, long long int);
										if( longLongArg > 0 )
										{
											argumentSign =  1;
										}
										else if( longLongArg < 0 )
										{
											argumentSign = -1;
										}
										break;
								}
							}
							else
							{
								switch( lengthModifier )
								{
									case '\0':
									case 'h':
										uintArg = va_arg(ap, unsigned int);
										if( uintArg )
										{
											argumentSign = 1;
										}
										break;
										
									case 'l':
										ulongArg = va_arg(ap, unsigned long int);
										if( ulongArg )
										{
											argumentSign = 1;
										}
										break;
										
									case '2':
										ulongLongArg = va_arg(ap, unsigned long long int);
										if( ulongLongArg )
										{
											argumentSign = 1;
										}
										break;
								}
							}
							stringArg = tmp; stringArgSize = 0;
							
							if( specifiedPrecision )
							{
								zeroPadding = 0;
							}
							if( fmtSpec == 'd' )
							{
								if( forceSign && argumentSign >= 0 )
								{
									tmp[stringArgSize++] = spaceForPositive ? ' ' : '+';
								}
							}
							else if( fmtSpec == 'p' && forceSign && argumentSign > 0 )
							{
								tmp[stringArgSize++] = spaceForPositive ? ' ' : '+';
							}
							else if( alternateForm )
							{
								if( argumentSign != 0 && ( fmtSpec == 'x' || fmtSpec == 'X') )
								{
									tmp[stringArgSize++] = '0'; tmp[stringArgSize++] = fmtSpec;
								}
							}
							zeroPaddingInsertionInd = stringArgSize;
							if( !specifiedPrecision )
							{
								precision = 1;   /* default precision is 1 */
							}
							if( precision == 0 && argumentSign == 0 && fmtSpec != 'p' )
							{
								
							}
							else
							{
								char ftab[5];
								int flen = 0;
								
								ftab[ flen++ ] = '%';
								
								if( !lengthModifier )
								{
								}
								else if( lengthModifier=='2' )
								{
									ftab[ flen++ ] = 'l';
									ftab[ flen++ ] = 'l';
								}
								else
								{
									ftab[ flen++ ] = lengthModifier;
								}
								
								ftab[ flen++ ] = fmtSpec;
								ftab[ flen++ ] = '\0';
								
								if( fmtSpec == 'p' )
								{
									stringArgSize += sprintf( tmp+stringArgSize, ftab, ptrArg );
								}
								else if( fmtSpec == 'd' )
								{
									switch( lengthModifier )
									{
										case '\0':
										case 'h':
											stringArgSize+=sprintf( tmp+stringArgSize, ftab, intArg );
											break;
										case 'l':
											stringArgSize+=sprintf( tmp+stringArgSize, ftab, longArg );
											break;
											//case '2': stringArgSize+=sprintf(tmp+stringArgSize,f,long_long_arg); break;
									}
								}
								else
								{
									switch( lengthModifier )
									{
										case '\0':
										case 'h':
											stringArgSize+=sprintf( tmp+stringArgSize, ftab, uintArg );
											break;
										case 'l':
											stringArgSize+=sprintf( tmp+stringArgSize, ftab, ulongArg );
											break;
										case '2':
											stringArgSize+=sprintf( tmp+stringArgSize, ftab,ulongLongArg );
											break;
									}
								}
								
								if( zeroPaddingInsertionInd < stringArgSize && tmp[ zeroPaddingInsertionInd ] == '-' )
								{
									zeroPaddingInsertionInd++;
								}
								
								if( zeroPaddingInsertionInd+1 < stringArgSize &&
									tmp[ zeroPaddingInsertionInd ]   == '0' &&
									(tmp[ zeroPaddingInsertionInd+1 ] == 'x' ||
									tmp[ zeroPaddingInsertionInd+1] == 'X') )
								{
									zeroPaddingInsertionInd += 2;
								}
							}
							
							{
								size_t num_of_digits = stringArgSize - zeroPaddingInsertionInd;
								
								if( alternateForm && fmtSpec == 'o' && !(zeroPaddingInsertionInd < stringArgSize
									&& tmp[zeroPaddingInsertionInd] == '0') )
								{      
									
									if( !specifiedPrecision || precision < num_of_digits+1 )
									{
										precision = num_of_digits+1; specifiedPrecision = 1;
									}
								}
								
								if( num_of_digits < precision )
								{
									numOfZerosToPad = precision - num_of_digits;
								}
							}
							
							if( !justifyLeft && zeroPadding )
							{
								int n = minWidthField - (stringArgSize+numOfZerosToPad);
								if( n > 0 )
								{
									numOfZerosToPad += n;
								}
							}
							break;
						}
						default:
							zeroPadding = 0;
							justifyLeft = 1;
							minWidthField = 0;
							
							stringArg = (char *)startPointer;
							stringArgSize = ptr - startPointer;

							if( *ptr )
							{
								stringArgSize++;
							}
						break;
			}
			if( *ptr )
			{
				ptr++;
			}
			
			if( !justifyLeft )
			{
				int n = minWidthField - (stringArgSize+numOfZerosToPad);
				if( n > 0 )
				{
					if( retStringSize < stringSize )
					{
						int avail = stringSize-retStringSize;
						FastMemset( str+retStringSize, (zeroPadding?'0':' '), ( n>avail ? avail : n ) );
					}
					retStringSize += n;
				}
			}
			
			if( numOfZerosToPad <= 0 )
			{
				zeroPaddingInsertionInd = 0;
			}
			else
			{
				int n = zeroPaddingInsertionInd;
				if( n > 0 )
				{
					if( retStringSize < stringSize )
					{
						int avail = stringSize-retStringSize;
						FastMemcpy( str+retStringSize, stringArg, ( n>avail ? avail : n) );
					}
					retStringSize += n;
				}
				
				n = numOfZerosToPad;
				if( n > 0 )
				{
					if( retStringSize < stringSize )
					{
						int avail = stringSize-retStringSize;
						FastMemset( str+retStringSize, '0', ( n>avail ? avail : n ) );
					}
					retStringSize += n;
				}
			}
			
			{
				int n = stringArgSize - zeroPaddingInsertionInd;
				if( n > 0 )
				{
					if( retStringSize < stringSize )
					{
						int avail = stringSize-retStringSize;
						FastMemcpy( str+retStringSize, stringArg+zeroPaddingInsertionInd,
									(n>avail?avail:n) );
					}
					retStringSize += n;
				}
			}
			
			if( justifyLeft )
			{
				int n = minWidthField - (stringArgSize+numOfZerosToPad);
				if (n > 0)
				{
					if( retStringSize < stringSize )
					{
						int avail = stringSize-retStringSize;
						FastMemset( str+retStringSize, ' ', ( n>avail ? avail : n ) );
					}
					retStringSize += n;
				}
			}
		}
	}
	
	if (stringSize > 0)
	{ 
		str[ retStringSize <= stringSize-1 ? retStringSize : stringSize-1] = '\0';
	}
	
	va_end(ap);
	
	if( escapedString != NULL )
	{
		FFree( escapedString );
		escapedString = NULL;
	}
	
	return (int) retStringSize;
}

/**
 * Internal function to copy string
 *
 * @param str pointer to string which copy will be made
 * @return pointer to new created string
 */
char* StringDuplicate( const char* str )
{
	if( str == NULL )
	{
		return NULL;
	}
	return strcpy( FCalloc( strlen( str ) + 1, sizeof( char ) ), str );
}

/**
 * Connect mysql.library to database function
 *
 * @param l pointer to mysql.library structure
 * @return 0 when connection will be set, otherwise error number
 */
int Reconnect( struct SQLLibrary *l )
{
	// sqlite do not need reconnect
	
	return 0;
}

/**
 * Connect mysql.library to database function
 *
 * @param l pointer to mysql.library structure
 * @param host host string
 * @param dbname database name string
 * @param usr database user login string
 * @param pass database user password string
 * @param port database internet port
 * @return 0 when connection will be set, otherwise error number
 */
int Connect( struct SQLLibrary *l, const char *host, const char *dbname, const char *usr, const char *pass, int port )
{
	DEBUG("[SQLITE] Connect\n");
	
	// Initialize mysql connection
	if( l->con.sql_Con == NULL )
	{
		sqlite3 *sb;
		int rc = sqlite3_open( dbname, (sqlite3 **)&(l->con.sql_Con));
	}
	
	l->con.sql_Host = StringDuplicate( host );
	l->con.sql_DBName = StringDuplicate( dbname );
	l->con.sql_User = StringDuplicate( usr );
	l->con.sql_Pass = StringDuplicate( pass );
	l->con.sql_Port = port;
	
	SpecialData *sd = FCalloc( 1, sizeof( SpecialData ) );
	if( sd != NULL )
	{
		l->con.sql_SpecialData = sd;
	}
	
	return 0;
}

/**
 * Function disconnect mysql.library from database
 *
 * @param l pointer to mysql.library structure
 * @return 0 when success, otherwise error number
 */
int Disconnect( struct SQLLibrary *l )
{
	DEBUG("[SQLITE] Disconnect\n");
	
	if( l->con.sql_Host != NULL ){ FFree( l->con.sql_Host ); l->con.sql_Host = NULL; }
	if( l->con.sql_DBName != NULL ){ FFree( l->con.sql_DBName );  l->con.sql_DBName = NULL; }
	if( l->con.sql_User != NULL ){ FFree( l->con.sql_User );  l->con.sql_User = NULL; }
	if( l->con.sql_Pass != NULL ){ FFree( l->con.sql_Pass );  l->con.sql_Pass = NULL; }
	if( l->con.sql_SpecialData != NULL )
	{
		FFree( l->con.sql_SpecialData );
	}
	
	sqlite3_close( (sqlite3 *)l->con.sql_Con );
	return 0;
}

/**
 * Create new escaped string
 *
 * @param l pointer to mysql.library structure
 * @param str pointer to char table which will be copyed and escaped
 * @return pointer to new string if success, otherwise NULL
 */
char *MakeEscapedString( struct SQLLibrary *l, char *str )
{
	if( str  == NULL )
	{
		return NULL;
	}
	char *esctext;
	int size = strlen( str );
	
	if( ( esctext = FCalloc( ( size ) + 1, sizeof(char) ) ) != NULL )
	{
		int i, j = 0;
		for( i=0 ; i<size ; i++ )
		{
			if( str[ i ] == '\'' || str[ i ] == '\"' || str[ i ] == ';' )
			{
				
			}
			else
			{
				esctext[ j++ ] = str[ i ];
			}
		}
		
		return esctext;
	}
	return NULL;
}

/**
 * Set option
 * 
 * @param l poitner to sql.library
 * @param params parameters as string
 * @return 0 when success, otherwise error number
 */
int SetOption( struct SQLLibrary *l, char *params )
{
	/*
	 int prot = MYSQL_PROTOCOL_TCP;
        mysql_options( l->con.sql_Con, MYSQL_OPT_PROTOCOL, &prot );
	 */
	return 0;
}

/**
 * Initial library function
 *
 * @param sb pointer to SystemBase
 * @return pointer to new Mysql.library structure
 */
void *libInit( void *sb )
{
	struct SQLLibrary *l = NULL;
	DEBUG("[SQLITE] libinit\n");
	
	if( ( l = FCalloc( 1, sizeof( struct SQLLibrary ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for SQLLibrary\n");
		return NULL;
	}

	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	
	l->libClose = dlsym ( l->l_Handle, "libClose");
	l->GetVersion = dlsym ( l->l_Handle, "GetVersion");

	// mysql.library structure
	l->Load = Load;
	l->Save = dlsym ( l->l_Handle, "Save");
	l->Update = dlsym ( l->l_Handle, "Update");
	l->Delete = dlsym ( l->l_Handle, "Delete");
	l->Query = dlsym ( l->l_Handle, "Query");
	l->NumberOfRecords = dlsym( l->l_Handle, "NumberOfRecords");
	l->NumberOfRecordsCustomQuery = dlsym( l->l_Handle, "NumberOfRecordsCustomQuery");
	l->NumberOfRows = dlsym( l->l_Handle, "NumberOfRows");
	l->GetLastError = dlsym( l->l_Handle, "GetLastError");
	l->FetchRow = dlsym ( l->l_Handle, "FetchRow");
	l->FreeResult = dlsym ( l->l_Handle, "FreeResult");
	l->DeleteWhere = dlsym ( l->l_Handle, "DeleteWhere");
	l->QueryWithoutResults = dlsym ( l->l_Handle, "QueryWithoutResults");
	l->MakeEscapedString = dlsym ( l->l_Handle, "MakeEscapedString");
	l->GetStatus = dlsym ( l->l_Handle, "GetStatus");
	l->SetOption = dlsym ( l->l_Handle, "SetOption");
	l->SNPrintF = SNPrintF;
	l->Connect = Connect;
	l->Disconnect = Disconnect;
	l->Reconnect = Reconnect;
	
	SystemBase *lsb = (SystemBase *)sb;

	return ( void *)l;
}

/**
 * Close mysql.library function
 *
 * @param l pointer to mysql.library structure
 */
void libClose( struct SQLLibrary *l )
{
	if( l->con.sql_Con )
	{
		if( l->con.sql_Host != NULL ){ FFree( l->con.sql_Host );  l->con.sql_Host = NULL; }
		if( l->con.sql_DBName != NULL ){ FFree( l->con.sql_DBName );  l->con.sql_DBName = NULL; }
		if( l->con.sql_User != NULL ){ FFree( l->con.sql_User ); l->con.sql_User = NULL; }
		if( l->con.sql_Pass != NULL ){ FFree( l->con.sql_Pass );  l->con.sql_Pass = NULL; }
		
		sqlite3_close( l->con.sql_Con );
		l->con.sql_Con = NULL;
	}
	DEBUG("[SQLITE] close\n");
}

/**
 * Get Status
 *
 * @param l pointer to mysql.library structure
 */
int GetStatus( struct SQLLibrary *l )
{
	return SQL_STATUS_READY;
}
