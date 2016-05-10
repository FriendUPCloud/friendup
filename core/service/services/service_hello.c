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

#include <sys/types.h>
#include <signal.h>
#include <core/types.h>
#include <service/service.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <signal.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>
#include <sys/mman.h>
#include <util/log/log.h>
#include <dlfcn.h>
#include <core/thread.h>
#include <signal.h>

#define NAME "hello"
#define VERSION 		1
#define REVISION		0

typedef struct HelloService
{
	int					hs_PID;
	FThread			*hs_Thread;
}HelloService;

//
// Creste new service
//

Service *ServiceNew( char *command )
{
	Service *service = NULL;
	
	if( ( service = calloc( 1, sizeof( Service ) )  ) != NULL )
	{
		int size = 0;
		
		size = strlen( command );
		if( size > 0 )
		{
			if( ( service->s_Command = calloc( size+1, sizeof( char ) ) ) != NULL )
			{
				memcpy( service->s_Command, command, size*sizeof(char) );
			}
		}
		
		HelloService *hs = calloc( 1, sizeof( HelloService ) );
		if( hs != NULL )
		{
			service->s_SpecialData = hs;
		}
		
		service->s_State = SERVICE_STOPPED;
	}
	
	return (Service *) service;
}

//
// delete Service
//

void ServiceDelete( Service *s )
{
	if( s != NULL )
	{
		
		if( s->s_Command != NULL )
		{
			if( s->s_SpecialData != NULL )
			{
				free( s->s_SpecialData );
			}
			
			free( s->s_Command );
			s->s_Command = NULL;
		}
		
		//free( s );
	}
}

//
// Start Service
//

int thread( FThread *t )
{
	char data[ 2048 ];
	
	HelloService *hs = (HelloService *)t->t_Data;
	//pthread_t ptid = pthread_self();
	hs->hs_PID = (int) getpid();
	
	DEBUG("Before launch THREAD PID %d\n", hs->hs_PID );
	FILE* file = popen("nodejs storage/services/hello/hello.js 2>&1", "r");
	if( file )
	{
		while( ( fgets( data, 2048, file ) ) != NULL )
		{
			
		}
		pclose( file );
	}
	
	//execlp( "nodejs", "nodejs", "storage/services/hello/hello.js", NULL );
		//system( "nodejs storage/services/hello/hello.js  >/dev/null 2>&1" );
//			fclose(stdout);
	//		fclose(stderr);
			//execv ("nodejs storage/services/hello/hello.js", cmd );
			//DEBUG("Uh oh! If this prints, execv() must have failed");
			//exit(EXIT_FAILURE);
			return 0;
}

int ServiceStart( Service *service )
{
	HelloService *hs = (HelloService *)service->s_SpecialData;
	if( hs->hs_PID == 0 )
	{
		//hs->hs_Thread = ThreadNew( thread, hs );
		
		if( (hs->hs_PID = fork()) == 0 )
		{
			execlp( "nodejs", "nodejs", "storage/services/hello/hello.js", NULL );
			exit(0);
		}
		else
		{
			INFO("Service started\n");
		}
		//usleep( 50000 );
		
	DEBUG ("End of parent program, program PID %d", hs->hs_PID );
	}

	service->s_State = SERVICE_STARTED;
	
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *service )
{
	HelloService *hs = (HelloService *)service->s_SpecialData;
	if( hs->hs_PID > 0 )
	{
		char tmp[ 1024 ];
		sprintf( tmp, "kill %d\n", hs->hs_PID );
		DEBUG("STOPSERVICE\n");
		
		kill( hs->hs_PID, SIGUSR1 );
		//pthread_cancel( hs->hs_Thread->t_Thread );
		//pthread_kill( hs->hs_Thread->t_Thread, SIG_TERM );
		//system( tmp );
		DEBUG("STOPSERVICE PID %s\n",  tmp );
		hs->hs_PID = 0;
	}
	service->s_State = SERVICE_STOPPED;
	
	return 0;
}

//
// Stop Service
//

#define DATA_SIZE 1024

int ServiceGetStatus( Service *service )
{
	FILE *pf;
	char data[ DATA_SIZE ];
	
	service->s_State = SERVICE_STOPPED;
 
	// Setup our pipe for reading and execute our command.
	pf = popen("/etc/init.d/nodejs status","r"); 
 
	if( !pf )
	{
		ERROR( "Could not open pipe for output.\n");
		return 0;
	}
 
	// Grab data from process execution
	char *tmp = fgets( data, DATA_SIZE , pf );
	if( tmp != NULL )
	{
		if( strncmp( "NodeJS is running", data, 18 ) == 0 )
		{
			service->s_State = SERVICE_STARTED;
		}
	}

    if( pclose(pf) != 0 )
	{
		ERROR(" Error: Failed to close command stream \n");
		return 0;
	}
    
	return service->s_State;
}

//
// Stop Service
//

int ServiceInstall( Service *s )
{
	system( "apt-get remove nodejs" );
	return 0;
}

//
// Stop Service
//

int ServiceUninstall( Service *s )
{
	system( "apt-get remove nodejs" );
	return 0;
}

//
// Count data
//

char *ServiceRun( struct Service *s )
{
	return NULL;
}

//
// Service command
//

char *ServiceCommand( struct Service *s, const char *cmd )
{

	return NULL;
}

//
// Get Web GUI
//

char *ServiceGetWebGUI( struct Service *s )
{
	return "<div class=\"VContentBottom BackgroundDefault Padding BorderTop\" style=\"height: 30px\">\
					<button type=\"button\" class=\"IconSmall fa-plus \" id=\"BtnAddDockItem\" onclick=\"Application.sendMessage( { command: 'start', id : 'hello' } )\">\
						Start\
					</button>\
					<div class=\"ButtonSpacer\"></div>\
					<button type=\"button\" class=\"IconSmall fa-remove\" id=\"BtnCancel\" onclick=\"Application.sendMessage( { command: 'stop', id : 'hello' } )\">\
						Stop\
					</button>\
				</div>";
}

//
// version/revision/name
//

ULONG GetVersion(void)
{
	return VERSION;
}

ULONG GetRevision(void)
{
	return REVISION;
}

const char *GetName()
{
	return NAME;
}



