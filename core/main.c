/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*

	Start point

*/

#include "core/friend_core.h"
#include "core/friendcore_manager.h"
#include "network/uri.h"

#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include <class/rootclass.h>
#include <class/phpproxyclass.h>

#include <system/systembase.h>
#include <application/applicationlibrary.h>
#include <mysql/mysqllibrary.h>
#include <properties/propertieslibrary.h>

//
// there is no definition of putenv on linux
//

void putenv( const char *c );

//
//
//

FriendCoreManager *coreManager;

// system.library to rule them all
SystemBase *SLIB;

pthread_mutex_t sslmut;

//
// ctrl-c interrupt signal
//

void InterruptSignalHandler(int signum)
{
	printf("Caught signal %d\n",signum);

	// Cleanup and close up stuff here
	//if( signum == SIGUSR1 )
	//coreManager->fcm_FriendCores->fci_Shutdown = TRUE;
	{
		if( coreManager != NULL )
		{
			FriendCoreManagerDelete( coreManager );
			coreManager = NULL;
		}
	}

	//exit( signum );
}

//
// main function
//

int main()
{
	//UriTest();
	//return 0;

	// Catch ctrl-c to gracefully shut down
	signal( SIGINT, InterruptSignalHandler );
	signal( SIGKILL, InterruptSignalHandler );
	signal( SIGSTOP, InterruptSignalHandler );
	signal( SIGUSR1, InterruptSignalHandler );
	signal( SIGABRT, InterruptSignalHandler );
	
	// Setup "Progdir:" in ENV
	{
		char cwd[ 1024 ];
		char envvar[ 1048 ];
		
		if( getcwd(cwd, sizeof( cwd ) ) != NULL )
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
			printf("FRIEND_HOME set to: %s\n", cwd );
		}
	}
	
	if( ( SLIB =  SystemInit() ) != NULL ) // (struct SystemLibrary *)LibraryOpen( "system.library", 0 ) ) != NULL )
	{
		// we cannot open libs inside another init
		
		pthread_mutex_init( &sslmut, NULL );
		
		// Keep it simple!
		coreManager = FriendCoreManagerNew();
		if( coreManager != NULL )
		{
			SLIB->SetFriendCoreManager( SLIB, coreManager );
			FriendCoreManagerRun( coreManager );
		}
		else
		{
			ERROR("Cannot Run FriendCoreManager!\n");
		}
		
		// Double check if we're killed in some other way
		if( coreManager != NULL )
		{
			FriendCoreManagerDelete( coreManager );
		}
		
		pthread_mutex_destroy( &sslmut );
		
		SLIB->SystemClose( SLIB );
	}
	else
	{
		ERROR("Cannot open 'system.library'\n");
	}

	return 0;
}

