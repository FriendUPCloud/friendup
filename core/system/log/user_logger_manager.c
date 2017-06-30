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
 *  log definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 07/04/2017
 */

#include "user_logger_manager.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <sys/stat.h>
#include <util/buffered_string.h>
#include <dirent.h>

//
//
//

UserLoggerManager *UserLoggerManagerNew( void *sb )
{
	//DEBUG("UserLoggerManagerNew\n\n\n\n\n\n\n\n\n\n");
	UserLoggerManager *ulm;
	
	if( ( ulm = FCalloc( 1, sizeof( UserLoggerManager ) ) ) != NULL )
	{
		char loggerPath[ 1024 ];
		char loadLoggerPath[ 2048 ];
		ulm->ulm_SB = sb;
		
		// read from configuration active logger
		
		struct PropertiesLibrary *plib = NULL;
		char *actLogger = NULL;
		Props *prop = NULL;
		
		if( ( plib = (struct PropertiesLibrary *)LibraryOpen( sb, "properties.library", 0 ) ) != NULL )
		{
			char coresPath[ 1024 ];
			sprintf( coresPath, "%s/cfg/cfg.ini", getenv( "FRIEND_HOME" ) );
			
			prop = plib->Open( coresPath  );
			if( prop != NULL)
			{
				DEBUG("reading actLogger\n");
				actLogger = plib->ReadString( prop, "Logger:active", NULL );
				DEBUG("actLogger %s\n", actLogger );
			}

			// read directory and load loggers
		
			char *fhome = getenv( "FRIEND_HOME" );
			snprintf( loggerPath, sizeof(loggerPath), "%s/loggers", fhome );
		
			DIR *dp = NULL;
			struct dirent *dptr;
		
			DEBUG("UserLoggerManagerNew found directory\n");
		
			if( ( dp = opendir( loggerPath ) ) != NULL )
			{
				DEBUG("UserLoggerManagerNew found directory 1\n");
				while( ( dptr = readdir( dp ) ) != NULL )
				{
					if( strcmp( dptr->d_name, "." ) == 0 || strcmp( dptr->d_name, ".." ) == 0 )
					{
						continue;
					}
					
					strcpy( loadLoggerPath, loggerPath );
					strcat( loadLoggerPath, "/" );
					strcat( loadLoggerPath, dptr->d_name );
					
					UserLogger *nlogger = UserLoggerCreate( sb, loadLoggerPath, dptr->d_name );
					if( nlogger != NULL )
					{
						DEBUG("New logger created: %s\n", dptr->d_name );
						nlogger->node.mln_Succ = (MinNode *)ulm->ulm_Loggers;
						ulm->ulm_Loggers  = nlogger;
						
						// test
						//actLogger = "file.ulogger";
						
						if( actLogger != NULL && strcmp( actLogger, nlogger->Name ) == 0 )
						{
							ulm->ulm_ActiveLogger = nlogger;
							
							if( nlogger->init != NULL )
							{
								nlogger->init( nlogger );
							}
						}
					}
				}
				closedir( dp );
			}
		
			plib->Close( prop );
			
			LibraryClose( plib );
		}
	}
	
	return ulm;
}

//
//
//

void UserLoggerManagerDelete( UserLoggerManager *ulm )
{
	DEBUG("UserLoggerManagerDelete\n");
	if( ulm != NULL )
	{
		UserLogger *ul = ulm->ulm_Loggers;
		UserLogger *dl = ul;
		
		while( ul != NULL )
		{
			dl = ul;
			ul = (UserLogger *)ul->node.mln_Succ;
			
			UserLoggerDelete( dl );
		}
		
		FFree( ulm );
	}
}