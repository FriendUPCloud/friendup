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
 * UserLoggerSQL logger
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (03/04/2017)
 */

#include "user_logger_sql.h"
#include <system/log/user_logger.h>
#include <system/systembase.h>

typedef struct SpecialData
{
	SQLLibrary        *sd_LibSQL;
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
		sd->sd_LibSQL = (struct SQLLibrary *)LibraryOpen( sb,  "mysql.library", 0 );
		if( sd->sd_LibSQL == NULL )
		{
			
			//return 0;
		}
		
		char *host = "localhost";
		char *login = "root";
		char *pass = "root";
		char *dbname = "FriendMaster";
		int port = 3306;
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
				DEBUG("[UserLogger] reading login\n");
				login = plib->ReadStringNCS( prop, "Logger:sqllogin", "root" );
				DEBUG("[UserLogger] user %s\n", login );
				pass = plib->ReadStringNCS( prop, "Logger:sqlpassword", "root" );
				DEBUG("[UserLogger] password %s\n", pass );
				host = plib->ReadStringNCS( prop, "Logger:sqlhost", "localhost" );
				DEBUG("[UserLogger] host %s\n", host );
				dbname = plib->ReadStringNCS( prop, "Logger:sqldbname", "FriendMaster" );
				DEBUG("[UserLogger] dbname %s\n",dbname );
				port = plib->ReadIntNCS( prop, "Logger:sqlport", 3306 );
				DEBUG("[UserLogger] port read %d\n", port );
			}
			else
			{
				FERROR( "Cannot open property file!\n" );
			}
			
		
			sd->sd_LibSQL->Connect( sd->sd_LibSQL, host, dbname, login, pass, port );
			
			if( prop ) plib->Close( prop );
			
			sb->LibraryPropertiesDrop( sb, plib );
		}
		
		s->ul_SD = sd;
		pthread_mutex_init( &(sd->sd_Mutex), NULL);
	}
}

//
//
//

void deinit( struct UserLogger *s )
{
	DEBUG("UserLoggerSQL deinit\n");
	if( s->ul_SD != NULL )
	{
		SpecialData *sd = s->ul_SD;
		if( sd->sd_LibSQL != NULL )
		{
			LibraryClose( sd->sd_LibSQL );
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
	
	FRIEND_MUTEX_LOCK( &(sd->sd_Mutex) );
	
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
	if( sd->sd_LibSQL != NULL )
	{
		sd->sd_LibSQL->Save( sd->sd_LibSQL, UserLogDesc, &logEntry );
	}
	
	FRIEND_MUTEX_UNLOCK( &(sd->sd_Mutex) );
	
	return 0;
}

