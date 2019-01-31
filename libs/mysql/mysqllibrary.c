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
 *  mysql.library code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
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
#include <mysql.h>

#define LIB_NAME "mysql.library"
#define LIB_VERSION 1
#define LIB_REVISION 0

// special data

typedef struct SpecialData{
	int							sd_Protocol;
}SpecialData;

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

/**
 * Load data from database
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param where pointer to string which represent "where" part of query. If value is equal to NULL all data are taken from db.
 * @param entries pointer to interger where number of loaded entries will be returned
 * @return pointer to new structure or list of structures.
 */
void *Load( struct SQLLibrary *l, FULONG *descr, char *where, int *entries )
{
	//char tmpQuery[ 1024 ];
	BufString *tmpQuerybs = BufStringNew();
	void *firstObject = NULL;
	DEBUG("[MYSQLLibrary] Load\n");
	
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
	FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ]; 
	
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
	
	if( mysql_query( l->con.sql_Con, tmpQuerybs->bs_Buffer ) )
	{
		FERROR("Cannot run query: '%s'\n", tmpQuerybs->bs_Buffer );
		BufStringDelete( tmpQuerybs );
		FERROR( "[MYSQLLibrary]  %s\n", mysql_error( l->con.sql_Con ) );
		return NULL;
	}
	
	DEBUG("[MYSQLLibrary] SQL SELECT QUERY '%s\n", tmpQuerybs->bs_Buffer );
	BufStringDelete( tmpQuerybs );

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if( result == NULL )
	{
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

	while( ( row = mysql_fetch_row( result ) ) != NULL )
	{
		unsigned long *lengths = mysql_fetch_lengths(result);
		(*entries)++;
		
		void *data = FCalloc( 1, descr[ SQL_DATA_STRUCTURE_SIZE ] );
		int dataUsed = 0; // Tell if we need to free data..
		
		// Link the first object (which holds the start of the data)
		if( firstObject == NULL ) firstObject = data;
		
		FUBYTE *strptr = (FUBYTE *)data;	// pointer to structure to which will will insert data
		
		// first 2 entries inform about table and size, rest information provided is about columns
		dptr = &descr[ SQL_DATA_STRUCT_START ]; 
		
		int i = 0;
			
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
							int tmp = 0;
							if( row[ i ] != NULL )
							{
								tmp = (int)atol( row[ i ] );
							}
							memcpy( strptr + dptr[ 2 ], &tmp, sizeof( int ) );
						}
						break;
					case SQLT_STR:
						{
							if( row[i] != NULL )
							{
								//int len = strlen( row[i] );
								char *tmpval = calloc( lengths[i] + 1, sizeof( char ) );
								if( tmpval )
								{
									// Copy mysql data
									memcpy( tmpval, row[i], lengths[i] );
									// Add tmpval to string pointer list..
									memcpy( strptr + dptr[2], &tmpval, sizeof( char * ) );
								}
							}
							else
							{

							}
						}
						break;
						
					case SQLT_DATETIME:
						{
							//struct tm ltm;
							//ltm.tm_year += 1900;
							//ltm.tm_mon ++;
							struct tm extm;
							if( sscanf( (char *)row[i], "%d-%d-%d %d:%d:%d", &(extm.tm_year), &(extm.tm_mon), &(extm.tm_mday), &(extm.tm_hour), &(extm.tm_min), &(extm.tm_sec) ) != EOF )
							{
							}
							if( extm.tm_year > 1900 )
							{
								extm.tm_year -= 1900;
							}
							
							memcpy( strptr + dptr[ 2 ], &extm, sizeof( struct tm ) );
							DEBUG("[MYSQLLibrary] TIMESTAMP load %s\n", row[ i ] );
						}
						break;
						
					case SQLT_DATE:
						{
							struct tm *ltm = (struct tm *)strptr + dptr[ 2 ];
							struct tm extm;
							if( sscanf( (char *)row[i], "%d-%d-%d", &(extm.tm_year), &(extm.tm_mon), &(extm.tm_mday) ) != EOF )
							{
								extm.tm_hour = extm.tm_min = extm.tm_sec = 0;
							}
							if( extm.tm_year > 1900 )
							{
								extm.tm_year -= 1900;
							}
							memcpy( strptr + dptr[ 2 ], &extm, sizeof( struct tm ) );
							
							DEBUG("[MYSQLLibrary] DATE load %s\n", row[ i ] );
							
							DEBUG("[MYSQLLibrary] Year %d  month %d  day %d\n", ltm->tm_year, ltm->tm_mon, ltm->tm_mday );
						}
						break;

					case SQLT_LONG:
						{
							FLONG tmp = 0;
							if( row[ i ] != NULL )
							{
								char *end;
								tmp = (FLONG)strtoll( row[ i ], &end, 0 );
							}
							memcpy( strptr + dptr[ 2 ], &tmp, sizeof( FLONG ) );
						}
					break;
					
					case SQLT_BLOB:
						{
							DEBUG("[MYSQLLibrary] Read BLOB\n");
							ListString *ls = ListStringNew();
							if( ls != NULL )
							{
								ListStringAdd( ls, row[i], lengths[i] );
								
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
							//DEBUG("[MYSQLLibrary] Init function found, calling it\n");
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

	mysql_free_result( result );
	DEBUG("[MYSQLLibrary] Load END\n");
	
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
	DEBUG("[MYSQLLibrary] Update\n");
	
	if( descr == NULL || data == NULL )
	{
		BufStringDelete( querybs );
		DEBUG("[MYSQLLibrary] Data structure or description was not provided!\n");
		return 0;
	}
	
	if( descr[ 0 ] != SQLT_TABNAME )
	{
		BufStringDelete( querybs );
		DEBUG("[MYSQLLibrary] SQLT_TABNAME was not provided!\n");
		return 0;
	}
	
	char *whereColName = NULL;
	int whereColValue = -1;
	FULONG *dptr = &descr[ SQL_DATA_STRUCT_START ];
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
	
	int lsize = sprintf( tmpQuery, "UPDATE %s set ", (char *)descr[ 1 ] );
	BufStringAddSize( querybs, tmpQuery, lsize );

	DEBUG("[MYSQLLibrary] Update SQL: %s\n", tmpQuery );
	
	dptr = &descr[ SQL_DATA_STRUCT_START ];		// first 2 entries inform about table, rest information provided is about columns
	
	int cols = 0;
	
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
					
					//DEBUG("[MYSQLLibrary] : we dont update PRIMARY KEY %d\n", primaryId );
				}
				break;
				
			case SQLT_INT:
				{
					char tmp[ 256 ];
					int tmpint;
					int sprintfsize = 0;
					
					memcpy( &tmpint, strptr + dptr[ 2 ], sizeof( int ) );
					if( cols == 0 )
					{
						sprintfsize = sprintf( tmp, " %s = %d", (char *)dptr[ 1 ], tmpint );
					}
					else
					{
						sprintfsize = sprintf( tmp, ", %s = %d", (char *)dptr[ 1 ], tmpint );
					}
					//strcat( tmpQuery, tmp );
					BufStringAddSize( querybs, tmp, sprintfsize );
					cols++;

					//DEBUG("[MYSQLLibrary] update set int %d to %s\n", tmpint, (char *)dptr[ 1 ] );
				}
				break;
				
			case SQLT_STR:
				{
					char tmp[ 256 ];
					char *tmpchar;
					memcpy( &tmpchar, strptr + dptr[ 2 ], sizeof( char *) );
					//DEBUG("[MYSQLLibrary] update, pointer %p\n", tmpchar );
					int sprintfsize = 0;
					
					if( tmpchar != NULL )
					{
						char *ttext = NULL;
						char *esctext = NULL;
						
						int tmpcharsize = strlen( tmpchar );
						int ttextsize = strlen( (char *)dptr[ 1 ] ) + ( tmpcharsize << 1 ) + 256;
						
						if( ( ttext = FCalloc( ttextsize, sizeof(char) ) ) != NULL )
						{
							if( ( esctext = FCalloc( (tmpcharsize << 1 ) + 1, sizeof(char) ) ) != NULL )
							{
								mysql_real_escape_string( l->con.sql_Con, esctext, tmpchar, tmpcharsize );
								
								if( cols == 0 )
								{
									sprintfsize = sprintf( ttext, " %s = '%s'", (char *)dptr[ 1 ], esctext );
								}
								else
								{
									sprintfsize = sprintf( ttext, ", %s = '%s'", (char *)dptr[ 1 ], esctext );
								}
								//strcat( tmpQuery, tmp );
								BufStringAddSize( querybs, ttext, sprintfsize );
								FFree( esctext );
							}
							FFree( ttext );
						}
						
						//DEBUG("[MYSQLLibrary] update set string %s to %s\n", tmpchar, (char *)dptr[ 1 ] );
						
						cols++;
					}
					else	// string was set to NULL
					{
						if( cols == 0 )
						{
							sprintfsize = sprintf( tmp, " %s = NULL", (char *)dptr[ 1 ] );
						}
						else
						{
							sprintfsize = sprintf( tmp, ", %s = NULL", (char *)dptr[ 1 ] );
						}
						BufStringAddSize( querybs, tmp, sprintfsize );
						//strcat( tmpQuery, tmp );
						
						cols++;
					}
						
				}
				break;
				
				case SQLT_DATETIME:
				{
					int sprintfsize = 0;
					// '2015-08-10 16:28:31'
					char date[ 64 ];
					char tmp[ 256 ];
					
					time_t *timepointer = (time_t *)( strptr+dptr[2] );
					struct tm *tp;
					tp = localtime( timepointer );

					if( (dptr[2]) != 0 )
					{
						if( tp->tm_year < 1901 ) tp->tm_year += 1900;
						if( tp->tm_mon < 1 ) tp->tm_mon = 1;
						if( tp->tm_mday < 1 ) tp->tm_mday = 1;
						sprintf( date, "%04d-%02d-%02d %02d:%02d:%02d", tp->tm_year, tp->tm_mon, tp->tm_mday, tp->tm_hour, tp->tm_min, tp->tm_sec );
						
						//DEBUG("[MYSQLLibrary] DATE serialised %s\n", date );
					
						if( cols == 0 )
						{
							sprintfsize = sprintf( tmp, " %s = '%s'", (char *)dptr[ 1 ], date );
						}
						else
						{
							sprintfsize = sprintf( tmp, ", %s = '%s'", (char *)dptr[ 1 ], date );
						}
						BufStringAddSize( querybs, tmp, sprintfsize );
						//strcat( tmpQuery, tmp );
						cols++;
					}
				}
			break;
			
			case SQLT_DATE:
				{
					int sprintfsize = 0;
					char date[ 64 ];
					char tmp[ 256 ];
					
					struct tm *tp = (struct tm *)( strptr+dptr[2]);

					if( (dptr[2]) != 0 )
					{
						if( tp->tm_year < 1901 ) tp->tm_year += 1900;
						if( tp->tm_mon < 1 ) tp->tm_mon = 1;
						if( tp->tm_mday < 1 ) tp->tm_mday = 1;
						sprintf( date, "%04d-%02d-%02d", tp->tm_year, tp->tm_mon, tp->tm_mday );
						
						//DEBUG("[MYSQLLibrary] DATE serialised %s\n", date );
					
						if( cols == 0 )
						{
							sprintfsize = sprintf( tmp, " %s = '%s'", (char *)dptr[ 1 ], date );
						}
						else
						{
							sprintfsize = sprintf( tmp, ", %s = '%s'", (char *)dptr[ 1 ], date );
						}
						BufStringAddSize( querybs, tmp, sprintfsize );
						//strcat( tmpQuery, tmp );
						cols++;
					}
				}
			break;
		}
		
		//cols++;
		dptr += 3;
	}
	
	if( primaryIdName != NULL )
	{
		char tmpvar[ 256 ];
		int sprintfsize = sprintf( tmpvar, " where %s = %d", primaryIdName, primaryId );
		//DEBUG("SQL update %s\n", tmpQuery );
		//strcat( tmpQuery, tmpvar );
		BufStringAddSize( querybs, tmpvar, sprintfsize );
	}
	DEBUG("[MYSQLLibrary] UPDATE QUERY '%s'\n", querybs->bs_Buffer );
	
	if( mysql_query( l->con.sql_Con, querybs->bs_Buffer ) )
	{
		FERROR("Query error!\n");
		BufStringDelete( querybs );
		
		return 2;
	}
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
	
	DEBUG("[MYSQLLibrary] Save\n");
	
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
	//int entries = 0;
	int statementEntry = 0;
	
	MYSQL_STMT *stmt;
	MYSQL_BIND bindTable[ FRIEND_MAX_BIND ];
	long bindLength[ FRIEND_MAX_BIND ];
	ListString *bindData[ FRIEND_MAX_BIND ];
	
	memset( bindTable, 0, sizeof(bindTable) );
	
	stmt = mysql_stmt_init( l->con.sql_Con );
	if( stmt != NULL )
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
					//opt++;
				}
				break;
				
				case SQLT_INT:
				{
					char tmp[ 256 ];
					int tmpint;
					memcpy( &tmpint, strptr + dptr[2], sizeof( int ) );
					int locsize = sprintf( tmp, " %d", tmpint );
					
					if( opt > 0 )
					{
						BufStringAddSize( tablequerybs, ",", 1 );
						BufStringAddSize( dataquerybs, ",", 1 );
					}
					BufStringAdd( tablequerybs, (char *)dptr[ 1 ]  );
					BufStringAddSize( dataquerybs, tmp, locsize );

					opt++;
				}
				break;
				
				case SQLT_STR:
				{
					char *tmpchar;

					memcpy( &tmpchar, strptr+dptr[2], sizeof( char *) );

					if( tmpchar != NULL )
					{
						if( opt > 0 )
						{
							BufStringAddSize( tablequerybs, ",", 1 );
							BufStringAddSize( dataquerybs, ",", 1 );
						}

						BufStringAddSize( dataquerybs, "'", 1 );
						BufStringAdd( tablequerybs, (char *)dptr[ 1 ] );

						char *esctext;
						int tmpcharsize = strlen( tmpchar );
						if( ( esctext = FCalloc( (tmpcharsize << 1 ) + 1, sizeof(char) ) ) != NULL )
						{
							mysql_real_escape_string( l->con.sql_Con, esctext, tmpchar, tmpcharsize );
							//BufStringAdd( dataquerybs, tmpchar );
							BufStringAdd( dataquerybs, esctext );
							
							FFree( esctext );
						}
						BufStringAddSize( dataquerybs, "'", 1 );
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
						
						if( opt > 0 )
						{
							BufStringAddSize( tablequerybs, ",", 1 );
							BufStringAddSize( dataquerybs, ",", 1 );
						}

						BufStringAddSize( dataquerybs, "'", 1 );
						BufStringAdd( tablequerybs, (char *)dptr[ 1 ] );

						BufStringAdd( dataquerybs, date );
						BufStringAddSize( dataquerybs, "'", 1 );

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
						
						if( opt > 0 )
						{
							BufStringAddSize( tablequerybs, ",", 1 );
							BufStringAddSize( dataquerybs, ",", 1 );
						}

						BufStringAddSize( dataquerybs, "'", 1 );
						BufStringAdd( tablequerybs, (char *)dptr[ 1 ] );

						BufStringAdd( dataquerybs, date );
						BufStringAddSize( dataquerybs, "'", 1 );

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
						if( opt > 0 )
						{
							BufStringAddSize( tablequerybs, ",", 1 );
							BufStringAddSize( dataquerybs, ",", 1 );
						}
					
						BufStringAdd( tablequerybs, (char *)dptr[ 1 ] );
						BufStringAddSize( dataquerybs, "?", 1 );
					
						bindData[ statementEntry ] = ls;
						bindTable[ statementEntry ].buffer_type = MYSQL_TYPE_STRING;
						bindTable[ statementEntry ].buffer         = (void *) &(bindData[ statementEntry ]->ls_Data);
						bindTable[ statementEntry ].is_unsigned    = 1;
						bindTable[ statementEntry ].length= (long unsigned int *) bindLength[ statementEntry ];
						bindTable[ statementEntry ].is_null= 0;

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
	
		int finalqsize = tablequerybs->bs_Size + dataquerybs->bs_Size + 256;
		
		if( ( finalQuery = FCalloc( finalqsize, sizeof(char) ) ) != NULL )
		{
			
			sprintf( finalQuery, "INSERT INTO %s ( %s ) VALUES( %s )", (char *)descr[ 1 ], tablequerybs->bs_Buffer, dataquerybs->bs_Buffer );

			if (mysql_stmt_prepare(stmt, finalQuery, strlen(finalQuery)))
			{
				FERROR( "\n mysql_stmt_prepare(), INSERT failed");
				FERROR( "\n %s", mysql_stmt_error(stmt));
				mysql_stmt_close( stmt ); // Free
				BufStringDelete( tablequerybs );
				BufStringDelete( dataquerybs );
				FFree( finalQuery );
				return 3;
			}
	
			// Bind the buffers 
			if (mysql_stmt_bind_param( stmt, bindTable ) )
			{
				FERROR("param bind failed! ");
				FERROR(" %s\n", mysql_stmt_error(stmt) );
				mysql_stmt_close( stmt ); // Free
				BufStringDelete( tablequerybs );
				BufStringDelete( dataquerybs );
				FFree( finalQuery );
				return 1;
			}

			if( statementEntry > 0 )
			{
				int i;
		
				for( i=0; i < statementEntry ; i++ )
				{
					// Supply data in chunks to server 
					if (mysql_stmt_send_long_data(stmt, i, bindData[ i ]->ls_Data , bindData[ i ]->ls_Size ) )
					{
						FERROR( " send_long_data failed %s\n", mysql_stmt_error(stmt));
					}
				}
			}

			// Now, execute the query 
			if ( mysql_stmt_execute(stmt) )
			{
				FERROR("mysql_stmt_execute failed %s\n", mysql_stmt_error(stmt));
			}
		
			// Free up!
			mysql_stmt_close( stmt );
			
			FFree( finalQuery );
		}

		if( primaryid != NULL )
		{
			FULONG uid = mysql_insert_id( l->con.sql_Con );
			memcpy( primaryid, &uid, sizeof( FULONG ) );
			DEBUG("[MYSQLLibrary] New entry created in DB, ID: %lu\n", uid );
		}
	}
	BufStringDelete( tablequerybs );
	BufStringDelete( dataquerybs );
	
	return 0;
}

/**
 * Delete data in database. Structure must contain primaryID key.
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param data pointer to object which will be updated in DB
 */
void Delete( struct SQLLibrary *l, FULONG *descr, void *data )
{
	char tmpQuery[ 1024 ];
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

/**
 * Delete data in database. Call is using custom "where"
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param where pointer to custom "where" part of query
 */
void DeleteWhere( struct SQLLibrary *l, FULONG *descr, char *where )
{
	char tmpQuery[ 2048 ];
	// we should go trough for structure to find SQLT_IDINT

	sprintf( tmpQuery, "delete from %s WHERE %s", (char *)descr[1], where );

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

/**
 * Return number of entries in database
 *
 * @param l pointer to mysql.library structure
 * @param descr pointer to taglist which represent DB to C structure conversion
 * @param where pointer to custom "where" part of query
 * @return number of entries found in database
 */
int NumberOfRecords( struct SQLLibrary *l, FULONG *descr, char *where )
{
	char tmpQuery[ 1024 ];
	int intRet = -1;
	DEBUG("[MYSQLLibrary] NumberOfRecords\n");
	
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
	
	if( mysql_query( l->con.sql_Con, tmpQuery ) )
	{
		FERROR("Cannot run query: '%s'\n", tmpQuery );
		FERROR( "%s\n", mysql_error( l->con.sql_Con ) );
		return -3;
	}

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if (result == NULL) 
	{
		return -4;
 	}

	MYSQL_ROW row;
	//
	// Receiving data as linked list of objects
	//

	while ( ( row = mysql_fetch_row( result ) ) ) 
	{
		intRet = (int)atol( row[ 0 ] );
	}

	mysql_free_result( result );
	DEBUG("[MYSQLLibrary] NumberOfRecords END\n");
	
	return intRet;
}

/**
 * Return number of entries in database. Function is using custom query
 *
 * @param l pointer to mysql.library structure
 * @param query pointer to custom query
 * @return number of entries found in database
 */
int NumberOfRecordsCustomQuery( struct SQLLibrary *l, const char *query )
{
	int intRet = -1;
	DEBUG("[MYSQLLibrary] NumberOfRecordsCustomQuery\n");
	
	if( mysql_query( l->con.sql_Con, query ) )
	{
		FERROR("Cannot run query: '%s'\n", query );
		FERROR( "%s\n", mysql_error( l->con.sql_Con ) );
		return -3;
	}

	MYSQL_RES *result = mysql_store_result( l->con.sql_Con );
  
	if (result == NULL) 
	{
		return -4;
 	}
 	
 	intRet = (int)mysql_num_rows( result );

	mysql_free_result( result );
	DEBUG("[MYSQLLibrary] NumberOfRecordsCustomQuery END\n");
	
	return intRet;
}

/**
 * Select function
 *
 * @param l pointer to mysql.library structure
 * @param sel pointer to custom query
 * @return pointer to MYSQL_RES structure
 */
MYSQL_RES *Query( struct SQLLibrary *l, const char *sel )
{
	MYSQL_RES *result = NULL;
	if( sel == NULL )
	{
		return NULL;
	}
	
	if( mysql_query( l->con.sql_Con, sel ) )
	{
		FERROR("Cannot run query: '%s'\n", sel );
		const char *err = mysql_error( l->con.sql_Con );
		FERROR( "%s\n", err );
		
		if( strstr( err, "List connection to MySQL server" ) != NULL )
		{
			l->con.sql_Recconect = TRUE;
		}
		
		return NULL;
	}
	
	DEBUG("[MYSQLLibrary] SELECT QUERY %s\n", sel );

	result = mysql_store_result( l->con.sql_Con );

	return result;
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
			DEBUG("[QueryWithoutResults] sql: %s\n", sel );
			int err = mysql_query( l->con.sql_Con, sel );

			if( err != 0 )
			{
				const char *errstr = mysql_error( l->con.sql_Con );
				
				FERROR("mysql_execute failed  SQL: %s error: %s\n", sel, errstr );
				if( strstr( errstr, "List connection to MySQL server" ) != NULL )
				{
					l->con.sql_Recconect = TRUE;
				}else if( strstr( errstr, "Duplicate column name " ) != NULL )
				{
					return 0;
				}
			}
			else
			{
				MYSQL_RES *results;
				results = mysql_store_result( l->con.sql_Con );
				if( results != NULL )
				{
					mysql_free_result( results );
				}
			}

			return err;
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
int NumberOfRows( struct SQLLibrary *l, MYSQL_RES *res )
{
	return (int)mysql_num_rows( res );
}

/**
 * Fetch MYSQL_ROW from result
 *
 * @param l pointer to mysql.library structure
 * @param res pointer to MYSQL_RES
 * @return MYSQL_ROW when success, otherwise NULL
 */
MYSQL_ROW FetchRow( struct SQLLibrary *l, MYSQL_RES *res )
{
	return mysql_fetch_row( res );
}

/**
 * Free sql result (MYSQL_RES)
 *
 * @param l pointer to mysql.library structure
 * @param res pointer to MYSQL_RES
 */
void FreeResult( struct SQLLibrary *l __attribute__((unused)), MYSQL_RES *res )
{
	mysql_free_result( res );
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

	/* This function can have SQL injection if the arguments are too long.
	 * The last one may leak. To avoid it (until we get rid of this function alltogether)
	 * the byte before the last is reserved for an extra null terminator (as a canary).
	 * If that byte gets overwritten then the whole buffer is erased and zero
	 * length is returned.
	 */
	str[stringSize-2] = '\0';

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
			size_t n = !q ? (size_t)strlen( ptr ) : (size_t)( q-ptr );
			
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
			
			const char *stringArg;
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
							stringArg = ptr;
							break;
						case 'c':
						{
							int j = va_arg( ap, int );
							unscharArg = (unsigned char) j;
							stringArg = (const char *) &unscharArg;
							break;
						}
						case 's':
							stringArg = va_arg( ap, const char * );
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
								
								if( ( escapedString = FCalloc( (stringArgSize *4 ) + 1, sizeof(char) ) ) != NULL )
								{
									stringArgSize = mysql_real_escape_string( l->con.sql_Con, escapedString, stringArg, stringArgSize );
									stringArg = escapedString;
								}
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
							
							stringArg = startPointer;
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
	
	if (str[stringSize-2] != '\0'){ //leak occured - clean up the whole query to avoid SQL injection
		memset(str, 0, stringSize);
		return 0;
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
	void *connection = mysql_real_connect( l->con.sql_Con, l->con.sql_Host, l->con.sql_DBName, l->con.sql_User, l->con.sql_Pass, l->con.sql_Port, NULL, 0 );
	if( connection == NULL )
	{
		FERROR( "[MYSQLLibrary] Failed to connect to database: '%s'.\n", mysql_error(l->con.sql_Con) );
		return -1;
	}
	int reconnect = 1;
	mysql_options( connection, MYSQL_OPT_RECONNECT, &reconnect );
	
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
	DEBUG("[MYSQLLibrary] Connect\n");
	
	// Initialize mysql connection
	if( l->con.sql_Con == NULL )
	{
		l->con.sql_Con = mysql_init(NULL);
	}
	
	mysql_options( l->con.sql_Con, MYSQL_SET_CHARSET_NAME, "utf8" );
	mysql_options( l->con.sql_Con, MYSQL_INIT_COMMAND, "SET NAMES utf8");
	
	void *connection = mysql_real_connect( l->con.sql_Con, host, usr, pass, dbname, port, NULL, 0 );
	if( connection == NULL )
	{
		FERROR( "[MYSQLLibrary] Failed to connect to database: '%s'.\n", mysql_error(l->con.sql_Con) );
		return -1;
	}
	
	l->con.sql_Host = StringDuplicate( host );
	l->con.sql_DBName = StringDuplicate( dbname );
	l->con.sql_User = StringDuplicate( usr );
	l->con.sql_Pass = StringDuplicate( pass );
	l->con.sql_Port = port;
	
	// Make sure connection is maintained
	int reconnect = 1;
	mysql_options( connection, MYSQL_OPT_RECONNECT, &reconnect );
	
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
	DEBUG("[MYSQLLibrary] Disconnect\n");
	
	if( l->con.sql_Host != NULL ){ FFree( l->con.sql_Host ); l->con.sql_Host = NULL; }
	if( l->con.sql_DBName != NULL ){ FFree( l->con.sql_DBName );  l->con.sql_DBName = NULL; }
	if( l->con.sql_User != NULL ){ FFree( l->con.sql_User );  l->con.sql_User = NULL; }
	if( l->con.sql_Pass != NULL ){ FFree( l->con.sql_Pass );  l->con.sql_Pass = NULL; }
	
	mysql_close( l->con.sql_Con );
	return 0;
}

/**
 * Create new escaped string
 *
 * @param l pointer to sql.library structure
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
	
	if( ( esctext = FCalloc( ( size << 1 ) + 1, sizeof(char) ) ) != NULL )
	{
		mysql_real_escape_string( l->con.sql_Con, esctext, str, size );
		
		return esctext;
	}
	return NULL;
}

/**
 * Set option
 * 
 * @param l poitner to sql.library
 * @param opts options as string
 * @return 0 when success, otherwise error number
 */
int SetOption( struct SQLLibrary *l, char *opts )
{
	if( opts != NULL )
	{
		char *par = opts;
		char *val = opts;
		char *optsb = opts;
		
		while( TRUE )
		{
			if( *optsb == ';' || *optsb == 0 )
			{
				*optsb = 0;
				
				if( strcmp( par, "PROTOCOL" ) == 0 )
				{
					if( strcmp( val, "TCP" ) == 0 )
					{
						int prot = MYSQL_PROTOCOL_TCP;
						mysql_options( l->con.sql_Con, MYSQL_OPT_PROTOCOL, &prot );
					}
				}
				
				if( *optsb == 0 )
				{
					break;
				}
				
				par = optsb + 1;
			}
			
			if( *optsb == ',' )
			{
				*optsb = 0;
				val = optsb + 1;
			}
			
			optsb++;
		}
	}
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
	DEBUG("[MYSQLLibrary] libinit\n");
	
	if( ( l = FCalloc( 1, sizeof( struct SQLLibrary ) ) ) == NULL )
	{
		return NULL;
	}

	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	
	l->libClose = dlsym ( l->l_Handle, "libClose");
	l->GetVersion = dlsym ( l->l_Handle, "GetVersion");

	// mysql.library structure
	l->Load = dlsym ( l->l_Handle, "Load");
	l->Save = dlsym ( l->l_Handle, "Save");
	l->Update = dlsym ( l->l_Handle, "Update");
	l->Delete = dlsym ( l->l_Handle, "Delete");
	l->Query = dlsym ( l->l_Handle, "Query");
	l->NumberOfRecords = dlsym( l->l_Handle, "NumberOfRecords");
	l->NumberOfRecordsCustomQuery = dlsym( l->l_Handle, "NumberOfRecordsCustomQuery");
	l->NumberOfRows = dlsym( l->l_Handle, "NumberOfRows");
	l->FetchRow = dlsym ( l->l_Handle, "FetchRow");
	l->FreeResult = dlsym ( l->l_Handle, "FreeResult");
	l->DeleteWhere = dlsym ( l->l_Handle, "DeleteWhere");
	l->QueryWithoutResults = dlsym ( l->l_Handle, "QueryWithoutResults");
	l->GetStatus = dlsym ( l->l_Handle, "GetStatus");
	l->SetOption = dlsym ( l->l_Handle, "SetOption");
	l->SNPrintF = SNPrintF;
	l->Connect = Connect;
	l->Disconnect = Disconnect;
	l->Reconnect = Reconnect;
	
	l->sd = FCalloc( 1, sizeof(SpecialData) );
	if( l->sd == NULL )
	{
		FFree( l );
		return NULL;
	}

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
		if( l->sd )
		{
			FFree( l->sd );
		}
		
		if( l->con.sql_Host != NULL ){ FFree( l->con.sql_Host );  l->con.sql_Host = NULL; }
		if( l->con.sql_DBName != NULL ){ FFree( l->con.sql_DBName );  l->con.sql_DBName = NULL; }
		if( l->con.sql_User != NULL ){ FFree( l->con.sql_User ); l->con.sql_User = NULL; }
		if( l->con.sql_Pass != NULL ){ FFree( l->con.sql_Pass );  l->con.sql_Pass = NULL; }
		
		mysql_close( l->con.sql_Con );
		l->con.sql_Con = NULL;
	}
	DEBUG("[MYSQLLibrary] close\n");
}

/**
 * Get Status
 *
 * @param l pointer to mysql.library structure
 */
int GetStatus( struct SQLLibrary *l )
{
	MYSQL *sql_Con = (MYSQL *)l->con.sql_Con;
	if( sql_Con->status == MYSQL_STATUS_READY )
	{
		return SQL_STATUS_READY;
	}
	return SQL_STATUS_BUSY;
}
