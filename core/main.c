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

/**
 *  @file
 *  Server entry point
 *
 *  @author HT (Hogne Tildstad)
 *  @author PS (Pawel Stefansky)
 *  @date pushed on 22/9/16
 */

#include "core/friend_core.h"
#include "core/friendcore_manager.h"
#include "network/uri.h"

#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

//#include <class/rootclass.h>
#include <class/phpproxyclass.h>
#include <time.h>

#include <system/systembase.h>
#include <application/applicationlibrary.h>
#include <mysql/mysqllibrary.h>
#include <properties/propertieslibrary.h>

//
//
//

SystemBase *SLIB;                       ///< Global SystemBase structure

FriendCoreManager *coreManager;         ///< Global FriendCoreManager structure

/**
 * Handles ctrl-c interruption signals.
 *
 * Called when a system interruption happens. This function cleans everything
 * and exits with an error number.
 *
 * @return system error number
 */
void InterruptSignalHandler(int signum)
{
	INFO("\nCaught signal %d\n",signum);

	// Cleanup and close up stuff here
	if( coreManager != NULL )
	{
		FriendCoreManagerDelete( coreManager );
		coreManager = NULL;
	}
}

/**
 * Friend Server entry.
 *
 * Runs the server on the machine. This function performs the following tasks:
 * - sets-up interrupt handler
 * - creates "Progdir:" in the ENV environement variable
 * - create a log file named "friend_core_log" appended with the date
 * - performs a SystemInit
 * - creates a FriendCoreManager and assigns it to the SLIB object
 * - initialise external libraries
 * - launches the FriendCoreManager in which the main loop is located
 * - exits gracefully when RunFriendCoreManager returns
 * .
 * @param[in]argc not used in this version
 * @param[in]argv not used in this version
 * @return 0 when success, otherwise error number
 * @sa SystemInit, FriendCoreManagerNew, SetFriendCoreManager, FriendCoreManagerRun
 */
int main( int argc, char *argv[] )
{
	// Catch ctrl-c to gracefully shut down
	signal( SIGINT, InterruptSignalHandler );
	signal( SIGKILL, InterruptSignalHandler );
	
	srand( time( NULL ) );
	
	char *cwd;
	char *envvar;
	
	// Setup "Progdir:" in ENV
	{
		cwd = FCalloc( 1024, sizeof(char) );
		envvar = FCalloc( 1048, sizeof(char) );
		
		if( getcwd(cwd, 1024 ) != NULL )
		{
			if( cwd[ strlen( cwd ) - 1 ] == '/' )
			{
				sprintf( envvar, "FRIEND_HOME=%s", cwd );
			}
			else
			{
				sprintf( envvar, "FRIEND_HOME=%s/", cwd );
			}
			
			putenv( envvar );
			INFO("FRIEND_HOME set to: %s\n", cwd );
		}
	}
	
	// 500 MB log
	LogNew("friend_core_log", "log.cfg", 1, FLOG_LIVE, FLOG_LIVE, 524288000 );
	
	LOG( FLOG_INFO, "Core started log\n" );
	
	if( ( SLIB =  SystemInit() ) != NULL ) // (struct SystemLibrary *)LibraryOpen( "system.library", 0 ) ) != NULL )
	{
		SLIB->SystemInitExternal( SLIB );
		
		FriendCoreManagerRun( SLIB->fcm );
		
		SLIB->SystemClose( SLIB );
		
		LogDelete();
	}
	else
	{
		Log( FLOG_PANIC, "Cannot open 'system.library'\n");
		FFree( envvar );
		FFree( cwd );
		LogDelete();
		return 1;
	}
	
	FFree( envvar );
	FFree( cwd );

	return 0;
}

