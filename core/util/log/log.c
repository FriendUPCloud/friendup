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
 *  log body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2016
 */

#include "log.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdarg.h>
#include <limits.h>
#include <errno.h>
#include <time.h>
#include <core/library.h>
#include <interface/properties_interface.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <mutex/mutex_manager.h>

// Max size of string
#define MAXMSG 8196

FlogFlags slg;

/**
 * Init logging
 *
 * @param fname log file name
 * @param conf path to configuration file
 * @param toFile 1 if we want store logs inside files
 * @param lvl level of logs which will be displayed on console
 * @param flvl level of logs which will be stored inside log file
 * @param maxSize number of maxiumum chars which will be stored in one log file
 */

int LogNew( const char* fname, const char* conf, int toFile, int lvl, int flvl, int maxSize )
{
    int status = 0;

    slg.ff_Level = lvl;
    slg.ff_FileLevel = flvl;
    slg.ff_ToFile = toFile;
    slg.ff_Pretty = 0;
    slg.ff_Time = -1;
    slg.ff_TdSafe = 1;
    slg.ff_FP = NULL;
    slg.ff_Fname = NULL;
    slg.ff_MaxSize = 0;
    slg.ff_LogNumber = 0;
    slg.ff_Size = 0;
    slg.ff_MaxSize = 0;
    slg.ff_ArchiveFiles = 0;
	slg.ff_ToConsole = 1;

    if( maxSize >= 100000 )
    {
        slg.ff_MaxSize =  (FUQUAD)maxSize;
    }

    {
		Props *prop = NULL;
		char *ptr, path[ 1024 ];
		path[ 0 ] = 0;

		ptr = getenv("FRIEND_HOME");
		if( ptr != NULL )
		{
			sprintf( path, "%scfg/cfg.ini", ptr );
		}

		prop = PropertiesOpen( path );
		if( prop != NULL)
		{
			char *path = NULL;
			
			slg.ff_Level = ReadIntNCS( prop, "Log:level", 1 );
			slg.ff_ArchiveFiles =  ReadIntNCS( prop, "Log:archiveFiles", 0 );

			slg.ff_FileLevel  = ReadIntNCS( prop, "Log:fileLevel", 1 );
			slg.ff_Fname = ReadStringNCS( prop, "Log:fileName", (char *)fname );
			slg.ff_ToConsole = ReadIntNCS( prop, "Log:toConsole", 1 );

			path = ReadStringNCS( prop, "Log:filepath", "log/" );
			
			slg.ff_DestinationPathLength = strlen( slg.ff_Fname ) + strlen( path ) + 32;
			slg.ff_Path = FCalloc( slg.ff_DestinationPathLength, sizeof(char) );
			slg.ff_DestinationPath = FCalloc( slg.ff_DestinationPathLength, sizeof(char) );
			
			strcpy( slg.ff_Path, path );
			mkdir( slg.ff_Path, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
			
            PropertiesClose( prop );
		}
	}

	if ( pthread_mutex_init(&slg.logMutex, NULL) )
	{
		printf("<%s:%d> %s: [ERROR] Cannot initialize mutex: %d\n",  __FILE__, __LINE__, __FUNCTION__, errno );
	}

    if ( conf != NULL && slg.ff_Fname != NULL )
    {
        slg.ff_Fname = fname;
        //status = LogParseConfig(conf);
    }

	if( slg.ff_ArchiveFiles > 0 )
	{
		if( ( slg.ff_FileNames = FCalloc( slg.ff_ArchiveFiles, sizeof( char *) ) ) != NULL )
		{
			int i;
			int size = strlen( slg.ff_Fname );

			for( i=0 ; i < slg.ff_ArchiveFiles ; i++ )
			{
				if( ( slg.ff_FileNames[ i ] = FCalloc( size*2, sizeof(char) ) ) != NULL )
				{

				}
			}
		}
	}

    return 0;
}

/**
 * Release logging
 */

void LogDelete( )
{
	if( slg.ff_FileNames != NULL )
	{
		int i = 0;
		for( ; i < slg.ff_ArchiveFiles; i++ )
		{
			if( slg.ff_FileNames[ i ] != NULL )
			{
				FFree( slg.ff_FileNames[ i ] );
			}
			FFree( slg.ff_FileNames );
		}
	}
    
	if( slg.ff_Path != NULL )
	{
		FFree( slg.ff_Path );
	}
	
	if( slg.ff_DestinationPath != NULL )
	{
		FFree( slg.ff_DestinationPath );
	}

	if( slg.ff_FP != NULL )
	{
		fclose( slg.ff_FP );
		slg.ff_FP = NULL;
	}

	pthread_mutex_destroy( &slg.logMutex );
}

/**
 * Move information to log. Use LOG() macro to store name of file + line number
 *
 * @param lev level of logged message
 * @param fmt format of message (same like in printf)
 * @param ... other parameters
 */

void Log( int lev, char* fmt, ...)
{
	if( !fmt ) return;
	if( slg.ff_ToFile == TRUE )
	//if( 1 == 0 )
	{
		if (lev >= slg.ff_FileLevel)
		{
			//if (FRIEND_MUTEX_LOCK( &slg.logMutex ) == 0)
			//{
				time_t rawtime;
				struct tm timeinfo; memset( &timeinfo, 0, sizeof( struct tm ) );
				rawtime = time(NULL);
				localtime_r(&rawtime, &timeinfo);

				// Get System Date
				slg.ff_FD.fd_Year = timeinfo.tm_year+1900;
				slg.ff_FD.fd_Mon = timeinfo.tm_mon+1;
				slg.ff_FD.fd_Day = timeinfo.tm_mday;
				slg.ff_FD.fd_Hour = timeinfo.tm_hour;
				slg.ff_FD.fd_Min = timeinfo.tm_min;
				slg.ff_FD.fd_Sec = timeinfo.tm_sec;

				FBOOL changeFileName = FALSE;

				if( slg.ff_MaxSize != 0 )
				{
					if( slg.ff_FD.fd_Day != slg.ff_Time || slg.ff_Size >= slg.ff_MaxSize )
					{
						slg.ff_Size = 0;
						slg.ff_LogNumber++;
						changeFileName = TRUE;
					}
				}
				else
				{
					if( slg.ff_FD.fd_Day != slg.ff_Time )
					{
						slg.ff_LogNumber = 0;
						changeFileName = TRUE;
					}
				}

				if (FRIEND_MUTEX_LOCK( &slg.logMutex ) == 0)
			{
				if( changeFileName == TRUE )
				{
					//char fname[ 512 ];

					if( slg.ff_MaxSize != 0 )
					{
						snprintf( slg.ff_DestinationPath, slg.ff_DestinationPathLength, "%s%s-%02d-%02d-%02d-%d.log", slg.ff_Path, slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day, slg.ff_LogNumber );
                        //snprintf( fname, sizeof(fname), "%s-%d-%02d-%02d-%02d.log", slg.ff_Fname, slg.ff_LogNumber, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
					}
					else
					{
						snprintf( slg.ff_DestinationPath, slg.ff_DestinationPathLength, "%s%s-%02d-%02d-%02d.log", slg.ff_Path,	slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
						//snprintf( fname, sizeof(fname), "%s-%02d-%02d-%02d.log", slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon,	slg.ff_FD.fd_Day );
					}

					if( slg.ff_FP != NULL )
					{
						fclose( slg.ff_FP );
						slg.ff_FP = NULL;
					}
					slg.ff_FP = fopen( slg.ff_DestinationPath, "a+");
					if( slg.ff_FP == NULL )
					{
						FERROR("[log.c]: Cannot open new file to store logs\n");
						FRIEND_MUTEX_UNLOCK( &slg.logMutex );
						return;
					}

					slg.ff_Time = slg.ff_FD.fd_Day;

					if( slg.ff_ArchiveFiles > 0 )
					{
						// list have reverse order, on the top we have oldest entries
						if( remove( slg.ff_FileNames[ slg.ff_ArchiveFiles-1 ] )  == 0 )
						{
							//Log( FLOG_DEBUG, "Old file removed: %s\n", slg.ff_FileNames[ slg.ff_ArchiveFiles-1 ] );
						}

						int i=0;
						for( i = 0 ; i < slg.ff_ArchiveFiles-1 ; i++ )
						{
							strcpy( slg.ff_FileNames[ i ], slg.ff_FileNames[ i+1 ] );
						}
						strcpy( slg.ff_FileNames[ slg.ff_ArchiveFiles-1 ], slg.ff_DestinationPath );
					}
				}
				{
					char date[ 256 ];
					slg.ff_Size  += fprintf( slg.ff_FP, "%ld: %02d.%02d.%02d-%02d:%02d:%02d: ", pthread_self(),
											slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon , slg.ff_FD.fd_Day ,
											slg.ff_FD.fd_Hour , slg.ff_FD.fd_Min , slg.ff_FD.fd_Sec );

					//fprintf( slg.ff_FP, "%s", out);
					va_list args;
					va_start(args, fmt);
					//fprintf( slg.ff_FP, fmt, args);
					vfprintf( slg.ff_FP, fmt, args);
					va_end(args);
				}
				FRIEND_MUTEX_UNLOCK( &slg.logMutex );
			} // pthread lock
		} // file level
	} // to file

#ifdef __DEBUG
	// console output will be used for debug
	if( slg.ff_ToConsole == 1 && lev >= slg.ff_Level )
	{
		printf("%ld: ", pthread_self() );
		va_list args;
		va_start(args, fmt);
		//printf(fmt, args);
		vprintf( fmt, args);
		va_end(args);
	}
#endif
}
