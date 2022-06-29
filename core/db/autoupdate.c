/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  Database auto update body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 26/02/2021
 */

#include <core/types.h>
#include <util/tagitem.h>
#include <db/sqllib.h>
#include "autoupdate.h"

/**
 * Create DBUpdate object
 * @return new DBUpdate structure when success, otherwise NULL
 */
DBUpdate *DBUpdateNew( )
{
	DBUpdate *ob = NULL;
	if( ( ob = FCalloc( 1, sizeof( DBUpdate ) ) ) != NULL )
	{
		
	}
	return ob;
}

/**
 * Delete DBUpdate object
 * @param dbu pointer to DBUpdate object which will be deleted
 */
void DBUpdateDelete( DBUpdate *dbu )
{
	if( dbu != NULL )
	{
		if( dbu->dbu_Filename != NULL )
		{
			FFree( dbu->dbu_Filename );
		}
		if( dbu->dbu_Error != NULL )
		{
			FFree( dbu->dbu_Error );
		}
		if( dbu->dbu_Script != NULL )
		{
			FFree( dbu->dbu_Script );
		}
		FFree( dbu );
	}
}

/**
 * Delete all DBUpdate objects
 * @param dbu pointer to DBUpdate object which will be deleted
 */
void DBUpdateDeleteAll( DBUpdate *dbu )
{
	while( dbu != NULL )
	{
		DBUpdate *rdbu = dbu;
		dbu = (DBUpdate *) dbu->node.mln_Succ;
		
		DBUpdateDelete( rdbu );
	}
}

//
// we need structure which will hold name of scripts and their numbers
//

typedef struct DBUpdateEntry
{
	int number;
	char name[ 512 ];
}DBUpdateEntry;

static inline char *ReadDBFile( char *fname, int *fs )
{
	FILE *fp;
	char *script = NULL;
	
	if( ( fp = fopen( fname, "rb" ) ) != NULL )
	{
		fseek( fp, 0, SEEK_END );
		int fsize = (int)ftell( fp );
		fseek( fp, 0, SEEK_SET );
		
		if( fsize > 0 )
		{
			if( ( script = FCalloc( (fsize+1), sizeof(char) ) ) != NULL )
			{
				int readbytes = 0;
				if( ( readbytes = fread( script, fsize, 1, fp ) ) > 0 )
				{
					
				}
				*fs = (int)fsize;
			}
		}
		fclose( fp );
	}
	return script;
}

/**
 * Function check and update DB
 * @param l pointer to SystemBase
 */

#define USE_NEW_WAY

int compareDBUpdateEntry( const void* a, const void* b )
{
	DBUpdateEntry *a1 = (DBUpdateEntry *)a;
	DBUpdateEntry *b1 = (DBUpdateEntry *)b;
	//DEBUG("Compare %d - %d\n", a1->number, b1->number );
	return a1->number - b1->number;
}

void CheckAndUpdateDB( SystemBase *l, int type )
{
	Log( FLOG_INFO, "----------------------------------------------------\n");
	
	SQLLibrary *sqllib = NULL;
	
	if( type == UPDATE_DB_TYPE_GLOBAL )
	{
		sqllib = l->LibrarySQLGet( l );
		Log( FLOG_INFO, "---------Autoupdatedatabase process start-----------\n");
	}
	else
	{
		//sqllib = l->GetInternalDBConnection( l );
		Log( FLOG_INFO, "---------Autoupdatedatabase (internal) process start-----------\n");
	}
	
	Log( FLOG_INFO, "----------------------------------------------------\n");
	
	if( sqllib != NULL )
	{
		
#ifdef USE_NEW_WAY
		DIR *dp = NULL;
		struct dirent *dptr;
		int numberOfFiles = 0;
		
		static const char *createUpdateDBscript = "CREATE TABLE IF NOT EXISTS `FDBUpdate` (\
		`ID` bigint(20) NOT NULL AUTO_INCREMENT,`Filename` varchar(255) NOT NULL,\
		`Created` bigint(20) NOT NULL,\
		`Updated` bigint(20) NOT NULL,\
		`Script` varchar(1024) NOT NULL DEFAULT '',\
		`Error` varchar(1024) DEFAULT NULL,\
		PRIMARY KEY (`ID`)\
		) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;";

		DEBUG("[SystemBase] UpdateDB found directory\n");
		
		// we have to check if FDBUpdate was created, if not then it should be
		
		{
			FBOOL dbExist = FALSE;
			
			void *res = sqllib->Query( sqllib, "desc FDBUpdate" );
			if( res != NULL )
			{
				char **row;
				if( ( row = sqllib->FetchRow( sqllib, res ) ) )
				{
					if( row[ 0 ] != NULL )
					{
						dbExist = TRUE;
					}

				}
				sqllib->FreeResult( sqllib, res );
			}
			
			if( dbExist == FALSE )
			{
				if( sqllib->QueryWithoutResults( sqllib, createUpdateDBscript ) != 0 )
				{
				}
			}
		}
		
		if( type == UPDATE_DB_TYPE_GLOBAL )
		{
			dp = opendir( "sqlupdatescripts" );
		}
		else
		{
			dp = opendir( "sqlinternalupdatescripts" );
		}
		
		// Get number of files in directory
		
		if( dp != NULL )
		{
			while( ( dptr = readdir( dp ) ) != NULL )
			{
				if( strncmp( dptr->d_name, ".", 1 ) == 0 || strncmp( dptr->d_name, "..", 2 ) == 0 )
				{
					continue;
				}
				
				numberOfFiles++;
			}
			closedir( dp );
		}
		
		DBUpdateEntry *dbentries;
		
		if( ( dbentries = FCalloc( numberOfFiles, sizeof(DBUpdateEntry) ) ) != NULL )
		{
			int position = 0;
			
			if( type == UPDATE_DB_TYPE_GLOBAL )
			{
				dp = opendir( "sqlupdatescripts" );
			}
			else
			{
				dp = opendir( "sqlinternalupdatescripts" );
			}
			
			if( dp != NULL )
			{
				int pos = 0;
				DEBUG("[SystemBase] UpdateDB found directory 1\n");
				while( ( dptr = readdir( dp ) ) != NULL )
				{
					char number[ 512 ];
					unsigned int i;
				
					if( strncmp( dptr->d_name, ".", 1 ) == 0 || strncmp( dptr->d_name, "..", 2 ) == 0 )
					{
						continue;
					}
				
					DEBUG("[SystemBase] get number from name: %s\n", dptr->d_name );
					// we must extract number from filename
					strcpy( number, dptr->d_name );
					for( i=0 ; i < strlen( number ) ; i++ )
					{
						if( number[ i ] == '_' )
						{
							number[ i ] = 0;
							break;
						}
					}
					
					DEBUG("[SystemBase] number found: '%s'\n", number );
					
					//
					// get all entries and their numbers
					
					position = atoi( number )-1;
					if( position > 0 )
					{
						dbentries[ pos ].number = position+1;

						DEBUG("[SystemBase] Found script with number %d, script added: %s\n", pos, dptr->d_name );
						strcpy( dbentries[ pos ].name, dptr->d_name );
						pos++;
					}
					else
					{
						numberOfFiles--;
						FERROR("[SystemBase] get number from name: %s FAIL\n", dptr->d_name );
					}
				}
				
				// sort all scripts
				
				qsort( dbentries, pos, sizeof(DBUpdateEntry), compareDBUpdateEntry );
				
				closedir( dp );
			}
			
			DEBUG("[SystemBase] Directories parsed position %d\n", position );
			
			// we must run script which holds changes
			char *lastSQLname = NULL;
			int error = 0;
			// go through all scripts
			int i;
			for( i=0 ; i < numberOfFiles ; i++ )
			{
				int entries;
				char where[ 612 ];
				DBUpdate *dbu = NULL;
				FBOOL rerun = FALSE;
				time_t currTime = time( NULL );
				
				// We should try to load update entry if it was executed on db with error
				snprintf( where, sizeof(where), "Filename='%s'", dbentries[i].name );
				if( ( dbu = sqllib->Load( sqllib, DBUpdateDesc, where, &entries ) ) != NULL )
				{
					// entry failed last time, we have to rerun it
					if( dbu->dbu_Error != NULL && strlen( dbu->dbu_Error ) > 0 )
					{
						rerun = TRUE;
					}
				}

				// if entry does not exist in db or rerun action was required
				if( dbu == NULL || rerun == TRUE )
				{
					int fsize = 0;
					char scriptfname[ 1024 ];
					
					if( type == UPDATE_DB_TYPE_GLOBAL )
					{
						snprintf( scriptfname, sizeof( scriptfname ), "sqlupdatescripts/%s", dbentries[i].name );
					}
					else
					{
						snprintf( scriptfname, sizeof( scriptfname ), "sqlinternalupdatescripts/%s", dbentries[i].name );
					}
					
					BufString *errorString = BufStringNew();
					
					// read file from disk
					
					char *script = ReadDBFile( scriptfname, &fsize );
					if( script != NULL )
					{
						char *command = script;
						int z;

						for( z=1 ; z < fsize ; z++ )
						{
							// if this script contain many entries
							if( strncmp( &(script[ z ]), "----script----" , 14 ) == 0 )
							{
								char *start = &(script[ z ]);
								char *end = strstr( start, "----script-end----" );
								int len = (end - start)-1;
								z += len;
								
								start += 14;
								*end = 0;
								
								DEBUG("[SystemBase] Running script1 : %s from file: %s on database\n", start, scriptfname );
								
								if( sqllib->QueryWithoutResults( sqllib, start ) != 0 )
								{
									error = 1;
									const char *errstr = sqllib->GetLastError( sqllib );
									if( errstr != NULL )
									{
										BufStringAdd( errorString, errstr );
									}
								}
								else
								{
									lastSQLname = dbentries[ i ].name;
								}
								
								command = &script[ z+1 ];
							}
							else	// if script have commands separated by comma
							{
								if( script[ z ] == ';' )
								{
									script[ z ] = 0;
									DEBUG("[SystemBase] Running script: %s from file: %s on database\n", command, scriptfname ); 
									if( strlen( command) > 10 )
									{
										if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
										{
											error = 1;
											const char *errstr = sqllib->GetLastError( sqllib );
											if( errstr != NULL )
											{
												BufStringAdd( errorString, errstr );
											}
										}
										else
										{
											lastSQLname = dbentries[i].name;
										}
									}
									command = &script[ z+1 ];
								}
							}
						}
						
						// error: Duplicate column name
						DEBUG("[SystemBase] Running script : %s from file: %s on database\n", command, scriptfname ); 
						if( strlen( command ) > 10 )
						{
							if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
							{
								error = 1;
							}
							else
							{
								lastSQLname = dbentries[i].name;
							}
						}
					}	// script FCalloc
					
					if( error == 1 )
					{
						if( dbu != NULL )	// entry is created, we only have to update it
						{
							snprintf( scriptfname, sizeof( scriptfname ), "UPDATE FDBUpdate SET Error='%s',Updated=%ld WHERE Filename='%s'", errorString->bs_Buffer, currTime, dbentries[i].name );
							if( sqllib->QueryWithoutResults( sqllib, scriptfname ) != 0 )
							{
							}
						}
						else	// entry was not created, we must do that
						{
							DBUpdate *locdbu = DBUpdateNew();
							if( locdbu != NULL )
							{
								locdbu->dbu_Created = currTime;
								locdbu->dbu_Updated = currTime;
								locdbu->dbu_Filename = dbentries[i].name;
								locdbu->dbu_Error = errorString->bs_Buffer;
								locdbu->dbu_Script = script;
								
								sqllib->Save( sqllib, DBUpdateDesc, locdbu );
								
								locdbu->dbu_Script = NULL;
								locdbu->dbu_Filename = NULL;
								locdbu->dbu_Error = NULL;
								
								DBUpdateDelete( locdbu );
							}
						}
					}
					else	// no error during db update
					{
						if( dbu != NULL )	// entry is created, we only have to update it
						{
							snprintf( scriptfname, sizeof( scriptfname ), "UPDATE FDBUpdate SET Error=NULL,Updated=%ld WHERE Filename='%s'", currTime, dbentries[i].name );
							if( sqllib->QueryWithoutResults( sqllib, scriptfname ) != 0 )
							{
							}
						}
						else	// entry was not created, we must do that
						{
							DBUpdate *locdbu = DBUpdateNew();
							if( locdbu != NULL )
							{
								locdbu->dbu_Created = currTime;
								locdbu->dbu_Updated = currTime;
								locdbu->dbu_Filename = dbentries[i].name;
								locdbu->dbu_Script = script;
								
								sqllib->Save( sqllib, DBUpdateDesc, locdbu );
								
								locdbu->dbu_Script = NULL;
								locdbu->dbu_Filename = NULL;
								
								DBUpdateDelete( locdbu );
							}
						}
					}
					
					if( script != NULL )
					{
						FFree( script );
					}
					
					if( errorString != NULL )
					{
						BufStringDelete( errorString );
					}
				}
				DBUpdateDeleteAll( dbu );
			}

			FFree( dbentries );
		}
#else
		int startUpdatePosition = 0;
		int orgStartUpdateposition = -1;
		
		char query[ 1024 ];
		snprintf( query, sizeof(query), "SELECT * FROM `FGlobalVariables` WHERE `Key`='DB_VERSION'" );
		
		void *res = sqllib->Query( sqllib, query );
		if( res != NULL )
		{
			char **row;
			while( ( row = sqllib->FetchRow( sqllib, res ) ) ) 
			{
				// Id, Key, Value, Comment, date
			
				DEBUG("[SystemBase] \tFound database entry-> ID '%s' Key '%s', Value '%s', Comment '%s', Date '%s'\n", row[ 0 ], row[ 1 ], row[ 2 ], row[ 3 ], row[ 4 ] );
			
				orgStartUpdateposition = startUpdatePosition = atoi( row[ 2 ] );
			}
			sqllib->FreeResult( sqllib, res );
		}
		
		DEBUG("[SystemBase] CheckAndUpdateDB: %d\n", startUpdatePosition );
		
		DIR *dp = NULL;
		struct dirent *dptr;
		int numberOfFiles = 0;
		
		DEBUG("[SystemBase] UpdateDB found directory\n");
		
		if( type == UPDATE_DB_TYPE_GLOBAL )
		{
			dp = opendir( "sqlupdatescripts" );
		}
		else
		{
			dp = opendir( "sqlinternalupdatescripts" );
		}
		
		if( dp != NULL )
		{
			while( ( dptr = readdir( dp ) ) != NULL )
			{
				if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
				{
					continue;
				}
				
				numberOfFiles++;
			}
			closedir( dp );
		}
		
		DBUpdateEntry *dbentries;
		
		if( ( dbentries = FCalloc( numberOfFiles, sizeof(DBUpdateEntry) ) ) != NULL )
		{
			int position = 0;
			
			if( type == UPDATE_DB_TYPE_GLOBAL )
			{
				dp = opendir( "sqlupdatescripts" );
			}
			else
			{
				dp = opendir( "sqlinternalupdatescripts" );
			}
			
			if( dp != NULL )
			{
				DEBUG("[SystemBase] UpdateDB found directory 1\n");
				while( ( dptr = readdir( dp ) ) != NULL )
				{
					char number[ 512 ];
					unsigned int i;
				
					if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
					{
						continue;
					}
				
					DEBUG("[SystemBase] get number from name\n");
					// we must extract number from filename
					strcpy( number, dptr->d_name );
					for( i=0 ; i < strlen( number ) ; i++ )
					{
						if( number[ i ] == '_' )
						{
							number[ i ] = 0;
							break;
						}
					}
					
					DEBUG("[SystemBase] number found: '%s'\n", number );
					
					dbentries[ position ].number = atoi( number );
					if( dbentries[ position ].number > startUpdatePosition )
					{
						DEBUG("[SystemBase] Found script with number %d, script added: %s\n", dbentries[ position ].number, dptr->d_name );
						strcpy( dbentries[ position ].name, dptr->d_name );
						position++;
					}
					else
					{
						DEBUG("[SystemBase] !!!! dbentries[ position ].number <= startUpdatePosition\n");
					}
				}
				closedir( dp );
			}
			
			DEBUG("[SystemBase] Directories parsed startUpdatePosition: %d position %d\n", startUpdatePosition, position );
			
			// we must run script which holds changes
			startUpdatePosition++;
			char *lastSQLname = NULL;
			int error = 0;
			// now FC will update DB script after script
			int i;
			for( i=0 ; i < position ; i++ )
			{
				int j;
				for( j=0; j < position ; j++ )
				{
					DEBUG("[SystemBase] Checking numbers, start: %d actual: %d\n", startUpdatePosition, dbentries[j].number );
					if( startUpdatePosition == dbentries[j].number )
					{
						FILE *fp;
						char scriptfname[ 712 ];
						
						if( type == UPDATE_DB_TYPE_GLOBAL )
						{
							snprintf( scriptfname, sizeof( scriptfname ), "sqlupdatescripts/%s", dbentries[i].name );
						}
						else
						{
							snprintf( scriptfname, sizeof( scriptfname ), "sqlinternalupdatescripts/%s", dbentries[i].name );
						}
						
						//snprintf( scriptfname, sizeof( scriptfname ), "sqlupdatescripts/%s", dbentries[j].name );
						DEBUG("[SystemBase] Found script with ID %d\n", startUpdatePosition );
						
						if( ( fp = fopen( scriptfname, "rb" ) ) != NULL )
						{
							fseek( fp, 0, SEEK_END );
							long fsize = ftell( fp );
							fseek( fp, 0, SEEK_SET );
							
							char *script;
							if( ( script = FCalloc( fsize+1, sizeof(char) ) ) != NULL )
							{
								int readbytes = 0;
								if( ( readbytes = fread( script, fsize, 1, fp ) ) > 0 )
								{
									char *command = script;
									int i;

									for( i=1 ; i < fsize ; i++ )
									{
										if( strncmp( &(script[ i ]), "----script----" , 14 ) == 0 )
										{
											char *start = &(script[ i ]);
											char *end = strstr( start, "----script-end----" );
											int len = (end - start)-1;
											i += len;
											
											start += 14;
											*end = 0;
											
											DEBUG("[SystemBase] Running script1 : %s from file: %s on database\n", start, scriptfname );
											
											if( sqllib->QueryWithoutResults( sqllib, start ) != 0 )
											{
												error = 1;
											}
											else
											{
												lastSQLname = dbentries[ j ].name;
											}
											
											command = &script[ i+1 ];
										}
										else
										{
											if( script[ i ] == ';' )
											{
												script[ i ] = 0;
												DEBUG("[SystemBase] Running script: %s from file: %s on database\n", command, scriptfname ); 
												if( strlen( command) > 10 )
												{
													if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
													{
														error = 1;
													}
													else
													{
														lastSQLname = dbentries[j].name;
													}
												}
												command = &script[ i+1 ];
											}
										}
									}
									// error: Duplicate column name
									DEBUG("[SystemBase] Running script : %s from file: %s on database\n", command, scriptfname ); 
									if( strlen( command ) > 10 )
									{
										if( sqllib->QueryWithoutResults( sqllib, command ) != 0 )
										{
											error = 1;
										}
										else
										{
											lastSQLname = dbentries[j].name;
										}
									}
								}
								FFree( script );
							}
							fclose( fp );
						}
						break;
					}
					
					if( error == 1 )
					{
						break;
					}
				}
				
				if( error == 1 )
				{
					break;
				}
				startUpdatePosition++;
			}
			
			// we must update which update was last
			startUpdatePosition--;
			
			if( orgStartUpdateposition != startUpdatePosition && lastSQLname != NULL )
			{
				DEBUG("[SystemBase] Last script will be updated in DB\n");
				snprintf( query, sizeof(query), "UPDATE `FGlobalVariables` SET `Value`='%d', `Date`='%lu', `Comment`='%s' WHERE `Key`='DB_VERSION'", startUpdatePosition, time(NULL), lastSQLname );
				sqllib->QueryWithoutResults( sqllib, query );
			}
			FFree( dbentries );
		}
#endif // USE_NEW_WAY
		
		Log( FLOG_INFO, "----------------------------------------------------\n");
		if( type == UPDATE_DB_TYPE_GLOBAL )
		{
			l->LibrarySQLDrop( l, sqllib );
			Log( FLOG_INFO, "---------Autoupdatedatabase process END-------------\n");
		}
		else
		{
			//l->DropInternalDBConnection( l, sqllib );
			Log( FLOG_INFO, "---------Autoupdatedatabase (internal) process END-------------\n");
		}
		Log( FLOG_INFO, "----------------------------------------------------\n");
	}
}

/**
 * Function check and update internal DB
 * @param l pointer to SystemBase
 */
void CheckAndUpdateInternalDB( SystemBase *sb )
{
	
}

