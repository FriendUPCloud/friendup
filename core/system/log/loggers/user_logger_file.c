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
	FILE                      *sd_FP;
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
		char *fname = "action_logger.log";
		Props *prop = NULL;
		
		// Get a copy of the properties.library
		struct PropertiesLibrary *plib = ( struct PropertiesLibrary *)sb->LibraryPropertiesGet( sb );
		if( plib != NULL )
		{
			char *ptr = getenv("FRIEND_HOME");
			char *path = FCalloc( 1000, sizeof( char ) );
			
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
				fname = plib->ReadString( prop, "Logger:filename", "action_logger.log" );
			}
			else
			{
				FERROR( "Cannot open property file!\n" );
			}
			
			sd->sd_FP = fopen( fname, "wb" );

			if( prop ) plib->Close( prop );
			
			sb->LibraryPropertiesDrop( sb, plib );
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
	
	if( sd->sd_FP != NULL )
	{
		fprintf( sd->sd_FP, "Date: %s, UserID: %lu, UserSessionID: %s, Action: %s, Information: %s\n",  datestring, logEntry.ul_UserID, logEntry.ul_UserSessionID, actions, information );
	}
	
	return 0;
}

