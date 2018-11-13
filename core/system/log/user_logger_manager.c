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
#include <system/systembase.h>

/**
 * Create new UserLoggerManager
 *
 * @param sb pointer to SystemBase
 * @return new UserLoggerManager structure when success, otherwise NULL
 */
UserLoggerManager *UserLoggerManagerNew( void *sb )
{
	UserLoggerManager *ulm;
	
	if( ( ulm = FCalloc( 1, sizeof( UserLoggerManager ) ) ) != NULL )
	{
		char loggerPath[ 1024 ];
		char loadLoggerPath[ 2048 ];
		SystemBase *locsb = (SystemBase *)sb;
		ulm->ulm_SB = sb;
		
		// read from configuration active logger
		
		struct PropertiesInterface *plib = NULL;
		char *actLogger = NULL;
		Props *prop = NULL;
		
		plib = &( locsb->sl_PropertiesInterface );
		{
			char coresPath[ 1024 ];
			sprintf( coresPath, "%s/cfg/cfg.ini", getenv( "FRIEND_HOME" ) );
			
			prop = plib->Open( coresPath  );
			if( prop != NULL)
			{
				DEBUG("reading actLogger\n");
				actLogger = plib->ReadStringNCS( prop, "Logger:active", NULL );
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
		}
	}
	
	return ulm;
}

/**
 * Delete UserLoggerManager
 *
 * @param ulm pointer to UserLoggerManager which will be deleted
 */
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
