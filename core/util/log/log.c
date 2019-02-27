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
            if (FRIEND_MUTEX_LOCK( &slg.logMutex ) == 0)
            {

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

                if( changeFileName == TRUE )
                {
                    //char fname[ 512 ];

                    if( slg.ff_MaxSize != 0 )
                    {
						snprintf( slg.ff_DestinationPath, slg.ff_DestinationPathLength, "%s%s-%d-%02d-%02d-%02d.log", slg.ff_Path, slg.ff_Fname, slg.ff_LogNumber, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
                        //snprintf( fname, sizeof(fname), "%s-%d-%02d-%02d-%02d.log", slg.ff_Fname, slg.ff_LogNumber, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
                    }
                    else
                    {
						snprintf( slg.ff_DestinationPath, slg.ff_DestinationPathLength, "%s%s-%02d-%02d-%02d.log", slg.ff_Path, slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
                        //snprintf( fname, sizeof(fname), "%s-%02d-%02d-%02d.log", slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day );
                    }

                    if( slg.ff_FP != NULL )
                    {
                        fclose( slg.ff_FP );
                        slg.ff_FP = NULL;
                    }
                    slg.ff_FP = fopen( slg.ff_DestinationPath, "a+");
                    if( slg.ff_FP == NULL )
                    {
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

	// console output will be used for debug
    if (lev >= slg.ff_Level)
    {
        printf("%ld: ", pthread_self() );
        va_list args;
        va_start(args, fmt);
        //printf(fmt, args);
        vprintf( fmt, args);
        va_end(args);
    }
}
//
// parse_config - Parse config file. Argument cfg_name is path
// of config file name to be parsed. Function opens config file
// and parses LOGLEVEL and LOGTOFILE flags from it.
//


    /*
    char* strclr(const char* clr, char* str, ...)
    {
        // String buffers
        static char output[MAXMSG];
        char string[MAXMSG];

        // Read args
        va_list args;
        va_start(args, str);
        vsprintf(string, str, args);
        va_end(args);

        // Colorize string
        sprintf(output, "%s%s%s", clr, string, CLR_RESET);

        return output;
    }


    int LogParseConfig(const char *cfg_name)
    {
    	FILE *file;
    	char line[ 1024 ];
    	size_t len = 0;
    	ssize_t read;
    	int ret = 0;

    	file = fopen(cfg_name, "r");
    	if(file == NULL) return 0;

    	while ((read = getline(&line, &len, file)) != -1)
    	{
    		if(strstr(line, "LOGLEVEL") != NULL)
    		{
    			slg.ff_Level = atoi(line+8);
    			ret = 1;
    		}
    		if(strstr(line, "LOGFILELEVEL") != NULL)
    		{
    			slg.ff_Level = atoi(line+12);
    			ret = 1;
    		}
    		else if(strstr(line, "LOGTOFILE") != NULL)
    		{
    			slg.ff_ToFile = atoi(line+9);
    			ret = 1;
    		}
    		else if(strstr(line, "PRETTYLOG") != NULL)
    		{
    			slg.ff_Pretty = atoi(line+9);
    			ret = 1;
    		}
    	}
    	fclose(file);
    	return ret;
    }*/




//
// slog - Log exiting process. Function takes arguments and saves
// log in file if LOGTOFILE flag is enabled from config. Otherwise
// it just prints log without saveing in file. Argument level is
// logging level and flag is slog flags defined in slog.h header.
//

    /*
    void slog(int level, int flag, const char *msg, ...)
    {
        if (slg.td_safe)
        {
            if (FRIEND_MUTEX_LOCK(&slog_mutex))
            {
                printf("<%s:%d> %s: [ERROR] Can not lock mutex: %d\n",
                    __FILE__, __LINE__, __FUNCTION__, errno);
                exit(EXIT_FAILURE);
            }
        }


        SlogDate mdate;
        char string[MAXMSG];
        char prints[MAXMSG];
        char color[32], alarm[32];
        char *output;

        slog_get_date(&mdate);
        bzero(string, sizeof(string));
        bzero(prints, sizeof(prints));
        bzero(color, sizeof(color));
        bzero(alarm, sizeof(alarm));


        va_list args;
        va_start(args, msg);
        vsprintf(string, msg, args);
        va_end(args);

        if(!level || level <= slg.level || level <= slg.file_level)
        {
            switch(flag)
            {
                case SLOG_LIVE:
                    strncpy(color, CLR_NORMAL, sizeof(color));
                    strncpy(alarm, "LIVE", sizeof(alarm));
                    break;
                case SLOG_INFO:
                    strncpy(color, CLR_GREEN, sizeof(color));
                    strncpy(alarm, "INFO", sizeof(alarm));
                    break;
                case SLOG_WARN:
                    strncpy(color, CLR_YELLOW, sizeof(color));
                    strncpy(alarm, "WARN", sizeof(alarm));
                    break;
                case SLOG_DEBUG:
                    strncpy(color, CLR_BLUE, sizeof(color));
                    strncpy(alarm, "DEBUG", sizeof(alarm));
                    break;
                case SLOG_ERROR:
                    strncpy(color, CLR_RED, sizeof(color));
                    strncpy(alarm, "ERROR", sizeof(alarm));
                    break;
                case SLOG_FATAL:
                    strncpy(color, CLR_RED, sizeof(color));
                    strncpy(alarm, "FATAL", sizeof(alarm));
                    break;
                case SLOG_PANIC:
                    strncpy(color, CLR_WHITE, sizeof(color));
                    strncpy(alarm, "PANIC", sizeof(alarm));
                    break;
                case SLOG_NONE:
                    strncpy(prints, string, sizeof(string));
                    break;
                default:
                    strncpy(prints, string, sizeof(string));
                    flag = SLOG_NONE;
                    break;
            }

            if (level <= slg.level || slg.pretty)
            {
                if (flag != SLOG_NONE) sprintf(prints, "[%s] %s", strclr(color, alarm), string);
                if (level <= slg.level) printf("%s", slog_get(&mdate, "%s\n", prints));
            }

            if (slg.to_file && level <= slg.file_level)
            {
                if (slg.pretty) output = slog_get(&mdate, "%s\n", prints);
                else
                {
                    if (flag != SLOG_NONE) sprintf(prints, "[%s] %s", alarm, string);
                    output = slog_get(&mdate, "%s\n", prints);
                }

                slog_to_file(output, slg.fname, &mdate);
            }
        }

        if (slg.td_safe)
        {
            if (FRIEND_MUTEX_UNLOCK(&slog_mutex))
            {
                printf("<%s:%d> %s: [ERROR] Can not deinitialize mutex: %d\n",
                    __FILE__, __LINE__, __FUNCTION__, errno);
                exit(EXIT_FAILURE);
            }
        }
    }
    */

