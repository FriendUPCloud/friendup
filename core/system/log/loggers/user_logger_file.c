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
 * UserLoggerFile logger
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (03/04/2017)
 */

#include "user_logger_file.h"
#include <system/log/user_logger.h>
#include <system/systembase.h>
#include <time.h>

typedef struct SpecialData
{
	FILE				*sd_FP;
	int					sd_Day;
	int					sd_Month;
	int					sd_Year;
	char				sd_FileName[ 1024 ];
	char				*sd_FilePath;
	char				*sd_DstFilePath;
	int					sd_DstFilePathLength;
	pthread_mutex_t		sd_Mutex;
}SpecialData;

//
//
//

void init( struct UserLogger *s )
{
	SystemBase *sb = (SystemBase *)s->ul_SB;
	
	SpecialData *sd = FCalloc( 1, sizeof( SpecialData ) );
	if( sd != NULL )
	{
		char *fname = "action_logger";
		char *fpath = "logs/";
		Props *prop = NULL;
		
		// Get a copy of the properties.library
		struct PropertiesInterface *plib = &(sb->sl_PropertiesInterface);
		if( plib != NULL )
		{
			char *ptr = getenv("FRIEND_HOME");
			char *path = FCalloc( 1024, sizeof( char ) );
			if( path != NULL )
			{
				if( ptr != NULL )
				{
					sprintf( path, "%scfg/cfg.ini", ptr );
				}
			
				DEBUG( "Opening config file: %s\n", path );
			
				prop = plib->Open( path );
				FFree( path );
			
				if( prop != NULL)
				{
					DEBUG("[UserLogger] reading file name\n");
				
					// get filename
					fname = plib->ReadStringNCS( prop, "Logger:filename", "action_logger" );
					if( fname == NULL )
					{
						strcpy( sd->sd_FileName, "action_logger" );
					}
					else
					{
						strcpy( sd->sd_FileName, fname );
					}
				
					// get file path
					fpath = plib->ReadStringNCS( prop, "Logger:filepath", "log/" );
					int size = 5;
					if( fpath != NULL )
					{
						size = strlen( fpath );
						if( ( sd->sd_FilePath = FCalloc( size+64, sizeof(char) ) ) != NULL )
						{
							strcpy( sd->sd_FilePath, fpath );
						}
					}
					else
					{
						if( ( sd->sd_FilePath = FCalloc( size+64, sizeof(char) ) ) != NULL )
						{
							strcpy( sd->sd_FilePath, "log/" );
						}
					}
				
					sd->sd_DstFilePathLength = size+32+strlen(sd->sd_FileName);
					sd->sd_DstFilePath = FCalloc( sd->sd_DstFilePathLength, sizeof(char) );
					//snprintf( sd->sd_DstFilePath, lsize, "%s%s", sd->sd_FilePath, sd->sd_FileName );
				}
				else
				{
					int size = 5;
					FERROR( "Cannot open property file!\n" );
					sd->sd_DstFilePathLength = size+32+strlen(sd->sd_FileName);
					sd->sd_DstFilePath = FCalloc( sd->sd_DstFilePathLength, sizeof(char) );
					strcpy( sd->sd_FilePath, "log/" );
					strcpy( sd->sd_FileName, "action_logger" );
				}
			}

			if( prop ) plib->Close( prop );
			
			time_t rawtime;
			struct tm timeinfo;
			rawtime = time(NULL);
			localtime_r(&rawtime, &timeinfo);

			// Get System Date 
			sd->sd_Year = timeinfo.tm_year+1900;
			sd->sd_Month = (int)(timeinfo.tm_mon+1);
			sd->sd_Day = timeinfo.tm_mday;
			
			snprintf( sd->sd_DstFilePath, sd->sd_DstFilePathLength, "%s%s%-d-%d-%d.log", sd->sd_FilePath, sd->sd_FileName, sd->sd_Year, sd->sd_Month, sd->sd_Day );
			
			mkdir( sd->sd_FilePath, S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
			
			sd->sd_FP = fopen( sd->sd_DstFilePath, "a" );
			
			pthread_mutex_init( &(sd->sd_Mutex), NULL);
		}
		
		s->ul_SD = sd;
	}
}

//
//
//

void deinit( struct UserLogger *s )
{
	DEBUG("UserLoggerFILE deinit\n");
	if( s->ul_SD != NULL )
	{
		SpecialData *sd = s->ul_SD;
		if( sd->sd_FP != NULL )
		{
			fclose( sd->sd_FP );
		}
		
		if( sd->sd_FilePath != NULL )
		{
			FFree( sd->sd_FilePath );
		}
		
		if( sd->sd_DstFilePath != NULL )
		{
			FFree( sd->sd_DstFilePath );
		}
		
		pthread_mutex_destroy( &(sd->sd_Mutex) );
		
		FFree( s->ul_SD );
	}
}

//
//
//

int StoreInformation( struct UserLogger *s, UserSession *session, char *actions, char *information )
{
	SpecialData *sd = s->ul_SD;
	
	UserLog logEntry;
	logEntry.ul_CreatedTime = time( NULL );
	logEntry.ul_Action = actions;
	logEntry.ul_Information = information;
	if( session != NULL )
	{
		logEntry.ul_UserID = session->us_UserID;
		logEntry.ul_UserSessionID = session->us_SessionID;
	}
	else
	{
		logEntry.ul_UserID = 0;
		logEntry.ul_UserSessionID = NULL;
	}
	struct tm *tm = localtime( &logEntry.ul_CreatedTime );
	char datestring[ 64 ];
	strftime( datestring, sizeof(datestring), "%c", tm );
	
	time_t rawtime;
	struct tm timeinfo;
	rawtime = time(NULL);
	localtime_r(&rawtime, &timeinfo);

	// Get System Date 
	sd->sd_Year = timeinfo.tm_year+1900;
	sd->sd_Month = timeinfo.tm_mon+1;
	
	if( sd->sd_FP != NULL )
	{
		FRIEND_MUTEX_LOCK( &(sd->sd_Mutex) );
		// change file name every day
		if( sd->sd_Day != timeinfo.tm_mday )
		{
			sd->sd_Day = timeinfo.tm_mday;
			fclose( sd->sd_FP );
			
			snprintf( sd->sd_DstFilePath, sd->sd_DstFilePathLength, "%s%s-%d-%d-%d.log", sd->sd_FilePath, sd->sd_FileName, sd->sd_Year, sd->sd_Month, sd->sd_Day );
			
			sd->sd_FP = fopen( sd->sd_DstFilePath, "a" );
			//char fileName[ 1024 ];
			//snprintf( fileName, sizeof( fileName ), "%d-%d-%d-%s", sd->sd_Year, sd->sd_Month, sd->sd_Day, sd->sd_FileName );
			
			//sd->sd_FP = fopen( fileName, "a" );
		}
		
		fprintf( sd->sd_FP, "Date: %s, UserID: %lu, UserSessionID: %s, Action: %s, Information: %s\n",  datestring, logEntry.ul_UserID, logEntry.ul_UserSessionID, actions, information );
		
		FRIEND_MUTEX_UNLOCK( &(sd->sd_Mutex) );
	}
	
	return 0;
}

