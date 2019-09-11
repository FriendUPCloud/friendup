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
 *  Server entry point
 *
 *  @author HT (Hogne Tildstad)
 *  @author PS (Pawel Stefansky)
 *  @date pushed on 22/9/16
 */

#include "core/friend_core.h"
#include "core/friendcore_manager.h"
#include "network/uri.h"

#include <execinfo.h>
#include <signal.h>
#include <stdio.h>
#include <stdio_ext.h>
#include <string.h>
#include <stdlib.h>

#include <class/phpproxyclass.h>
#include <time.h>

#include <system/systembase.h>
#include <application/applicationlibrary.h>
#include <db/sqllib.h>
#include <config/properties.h>
#include <util/base64.h>

char CRASH_LOG_FILENAME[ 92 ];

//
//
//

SystemBase *SLIB;                       ///< Global SystemBase structure

FriendCoreManager *coreManager;         ///< Global FriendCoreManager structure

static const char *_program_name;

int RunTest( SystemBase *SLIB );

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
int main( int argc __attribute__((unused)), char *argv[])
{
	_program_name = argv[0];

	build_decoding_table();

	srand( time( NULL ) );
	
	if( PropertiesCheck() != 0 )
	{
		FERROR("cfg.ini have errors, please fix them and re-run FriendCore\n");
		return 1;
	}
	
	{
		time_t rawtime;
		struct tm timeinfo;
		rawtime = time(NULL);
		localtime_r(&rawtime, &timeinfo);

		snprintf( CRASH_LOG_FILENAME, sizeof(CRASH_LOG_FILENAME), "log/crash-%d-%02d-%02d_%02d-%02d-%02d.log", timeinfo.tm_year+1900, (int)(timeinfo.tm_mon+1), timeinfo.tm_mday, timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec );
		
		mkdir( "log", S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
	}

	char *cwd = NULL;
	char *envvar = NULL;

	// Setup "Progdir:" in ENV
	{
		cwd = FCalloc( 1024, sizeof(char) );
		envvar = FCalloc( 1048, sizeof(char) );

		if( getcwd( cwd, 1023 ) != NULL )
		{
			if( cwd[ strlen( cwd ) - 1 ] == '/' )
			{
				snprintf( envvar, 1048, "FRIEND_HOME=%s", cwd );
			}
			else
			{
				snprintf( envvar, 1048, "FRIEND_HOME=%s/", cwd );
			}

			//setenv("FRIEND_HOME", cwd, 1 );
			putenv( envvar );
			INFO("FRIEND_HOME set to: %s\n", cwd );
		}
	}

	// 500 MB log
	LogNew("friend_core_log", "log.cfg", 1, FLOG_LIVE, FLOG_LIVE, 524288000 );

	LOG( FLOG_INFO, "Core started log\n" );

	if( ( SLIB =  SystemInit() ) != NULL ) // (struct SystemLibrary *)LibraryOpen( "system.library", 0 ) ) != NULL )
	{
		//SLIB->SystemInitExternal( SLIB );

		RunTest( SLIB );

		SLIB->SystemClose( SLIB );

		LogDelete();
	}
	else
	{
		unsetenv("FRIEND_HOME");
		Log( FLOG_PANIC, "Cannot open 'system.library'\n");
		FFree( envvar );
		FFree( cwd );
		LogDelete();
		return 1;
	}

	unsetenv("FRIEND_HOME");
	if( envvar != NULL )
	{
		FFree( envvar );
	}
	FFree( cwd );
	
	base64_cleanup();

	return 0;
}


