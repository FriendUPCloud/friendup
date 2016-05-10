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

#include <core/types.h>
#include "service.h"
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

#define VERSION 1.0
#define SUFFIX "apache"

const char *GetSuffix()
{
	return SUFFIX;
}


//
// Service Open
//

Service* ServiceOpen( char* name, long version, void *sm, void (*sendMessage)(void *a, void *b) )
{
	BOOL loaded = FALSE;
	char currentDirectory[ 255 ];
	char loadServicePath[ 512 ];
	memset( &currentDirectory, 0, 255 );
	memset( &loadServicePath, 0, 512 );

	// Open service
	if( name == NULL )
	{
		return NULL;
	}
	
	Service *service = NULL;
	void *handle = NULL;
	long ( *GetVersion )( void );
	void * ( *ServiceNew )( char *cmd );

	// there is no need to multiply by sizeof(char)
	getcwd( currentDirectory, sizeof ( currentDirectory ) );
	DEBUG( "[ServiceOpen] Current directory %s\n", currentDirectory );

	// we should check and get lib from current dirrectory first (compatybility)
	
	sprintf ( loadServicePath, "%s/%s", currentDirectory, name );
	DEBUG("[ServiceOpen] Open library %s\n", loadServicePath );

	if( ( handle = dlopen ( loadServicePath, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
	{
		GetVersion = dlsym( handle, "GetVersion");

		if( GetVersion != NULL )
		{
			DEBUG("[ServiceOpen] Version checking, found %ld req %ld\n", GetVersion(), version );
			
			if( GetVersion() >= version )
			{
				loaded = TRUE;
			}
			else
			{
				DEBUG( "[ServiceOpen] Version fail\n" );
			}
		}
		else
		{
			DEBUG( "[ServiceOpen] GetVersion fail\n" );
		}
	}
	else
	{
		//ERROR( "[ServiceOpen] Cannot open file '%s'\n", name );
	}

	char* error = dlerror();
	if( error )
	{
		//ERROR ( "[ServiceOpen] Library error: %s\n", error );
	}

	//
	// checking library in service/

	if( loaded == FALSE )
	{
		// there is no need to multiply by sizeof(char)
		getcwd( currentDirectory, sizeof ( currentDirectory ) );
		DEBUG( "[ServiceOpen] Current directory %s\n", currentDirectory );

		// we should check and get lib from "current dirrectory" /services/
	
		sprintf ( loadServicePath, "%s/services/%s", currentDirectory, name );
		DEBUG( "[ServiceOpen] Open library %s\n", loadServicePath );

		if( ( handle = dlopen ( loadServicePath, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
		{
			GetVersion = dlsym( handle, "GetVersion" );

			if( GetVersion != NULL )
			{
				if( GetVersion() >= version )
				{
					loaded = TRUE;
				}
				else
				{
					DEBUG( "[ServiceOpen] Version fail\n" );
				}
			}
			else
			{
				DEBUG( "[ServiceOpen] GetVersion fail\n" );
			}
		}
		else
		{
			DEBUG( "[ServiceOpen] Cannot open file\n" );
		}

		char* error = dlerror();
		if( error != NULL )
		{
			DEBUG( "[ServiceOpen] Library error: %s\n", error );
		}
	}

	// somehow we couldn't load lib, we are trying to find it in root folder

	if( loaded == FALSE )
	{
		if( ( handle = dlopen( name, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
		{
			GetVersion = dlsym( handle, "GetVersion");

			if( GetVersion != NULL )
			{
				if( GetVersion() >= version )
				{
					loaded = TRUE;
				}
				else
				{
					DEBUG( "[ServiceOpen]: Cannot open library in version %ld, required version is %ld\n", version, GetVersion() );
					dlclose( handle );
					return NULL;
				}
			}
		}
		else
		{
			DEBUG ( "[ServiceOpen] Library was not possible to open: %s\n", dlerror () );
			return NULL;
		}
	}

	if( loaded == FALSE )
	{
		ERROR( "[ServiceOpen] Couldn't find or open library %s\n", name );
		return NULL;
	}
	DEBUG( "[ServiceOpen] Before lib init\n" );

	ServiceNew = dlsym( handle, "ServiceNew" );

	if( ServiceNew == NULL )
	{
		DEBUG( "[ServiceOpen] ServiceNew/ServiceDelete not found in Service!\n" );
		return NULL;
	}
	DEBUG( "[ServiceOpen] Before init\n" );

	service = ServiceNew( name );
	
	if( service != NULL )
	{
		DEBUG( "[ServiceOpen] After init\n" );

		service->s_Handle = handle;
		service->GetVersion = (void *)GetVersion;
	
		service->ServiceDelete = dlsym( service->s_Handle, "ServiceDelete" );
		service->ServiceStart = dlsym( service->s_Handle, "ServiceStart" );
		service->ServiceStop = dlsym( service->s_Handle, "ServiceStop" );
		service->ServiceInstall = dlsym( service->s_Handle, "ServiceInstall" );
		service->ServiceUninstall = dlsym( service->s_Handle, "ServiceUninstall" );
		service->ServiceGetStatus = dlsym( service->s_Handle, "ServiceGetStatus" );
		service->GetName = dlsym( service->s_Handle, "GetName" );
		service->GetRevision = dlsym( service->s_Handle, "GetRevision" );
		service->ServiceCommand = dlsym( service->s_Handle, "ServiceCommand" );
		service->ServiceGetWebGUI = dlsym( service->s_Handle, "ServiceGetWebGUI" );
		
		// allow services to use FC connections
		
		service->CommServiceSendMsg = sendMessage;
		service->s_CommService = sm;
	
		DEBUG( "[ServiceOpen] Completed initialization...\n" );
	}
	else
	{
		DEBUG("[ServiceOpen] Error while init\n");
	}
	
	return service;
}

//
// Close Service
//

void ServiceClose( struct Service* service )
{
	if( service == NULL )
	{
		return;
	}

	DEBUG( "[ServiceOpen] Closing service %p\n", service );

	service->ServiceDelete( service );

	if( service->s_Handle != NULL )
	{
		dlclose( service->s_Handle );
		service->s_Handle = NULL;
	}
	free( service );
	DEBUG( "[ServiceOpen] Service closed memory free\n" );
}


ULONG GetVersion(void)
{
	return 1;
}

ULONG GetRevision(void)
{
	return 1;
}

//
// Creste new service
//

Service *ServiceNew( char *command  )
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
		
		//service->s_Buffer = calloc( SERVICE_BUFFER_MAX, sizeof(BYTE) );
		service->s_State = SERVICE_STOPPED;
	}
	
	return service;
}

//
// delete Service
//

void ServiceDelete( Service *s )
{
	if( s )
	{/*
		if( s->s_Thread )
		{
			ThreadDelete( s->s_Thread );
		}
		
		if( s->s_Buffer )
		{
			free( s->s_Buffer );
			s->s_Buffer = NULL;
		}*/
		
		if( s->s_Command )
		{
			free( s->s_Command );
			s->s_Command = NULL;
		}
		
		free( s );
	}
}

//
// Start Service
//

int ServiceStart( Service *service )
{
	/*
	service->s_Thread = ThreadNew( service->ServiceThread, service, TRUE );
	if( service->s_Thread == NULL )
	{
		service->s_State = SERVICE_STOPPED;
	}
	service->s_State = SERVICE_STARTED;
	*/
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *s )
{
	return 0;
}

//
// Service Thread
//

int ServiceThread( FThread *ptr )
{
	Service *service = (Service *)ptr->t_Data;
	
	system( service->s_Command );
	
	/*
	service->s_AppMsg = (ServiceAppMsg*)mmap( NULL, sizeof( ServiceAppMsg ), PROT_READ|PROT_WRITE, MAP_SHARED, -1, 0 );
	
	if( service->s_AppMsg != NULL )
	{
		int counter = 0;
	
		pipe( service->s_AppMsg->a_Outfd ); // Where the parent is going to write to 
		pipe( service->s_AppMsg->a_Infd ); // From where parent is going to read
		service->s_AppMsg->a_AppQuit = 0;
	
		if( (service->s_AppMsg->a_AppPid = fork()) < 0 )
		{	
			ERROR("Cannot FORK!\n");
		}else if( service->s_AppMsg->a_AppPid == 0 )
		{
			DEBUG("Child is working\n");
		
			close( STDOUT_FILENO );
			close( STDIN_FILENO );
			dup2( service->s_AppMsg->a_Outfd[0], STDIN_FILENO );
			dup2( service->s_AppMsg->a_Infd[1], STDOUT_FILENO );
			close( service->s_AppMsg->a_Outfd[0] ); // Not required for the child 
			close( service->s_AppMsg->a_Outfd[1] );
			close( service->s_AppMsg->a_Infd[0] );
			close( service->s_AppMsg->a_Infd[1] );
		
			//printf("Call command\n");
		
			system( service->s_Name );
			//usleep( 1000000 );

			service->s_AppMsg->a_AppQuit = 1;
		}
		else
		{
			DEBUG("Host\n");
		
			char input[ 100 ];
			struct timeval tv;
		
			//app->quit = 0;
			int ret = 0;
		
			close( service->s_AppMsg->a_Outfd[0] ); // These are being used by the child 
			close( service->s_AppMsg->a_Infd[1] );
		
			while( service->s_AppMsg->a_Quit != 1 )
			{
				FD_ZERO( &service->s_AppMsg->a_Readfd );
				FD_ZERO( &service->s_AppMsg->a_Writefd );
				FD_SET( service->s_AppMsg->a_Infd[0] , &(service->s_AppMsg->a_Readfd) );
				FD_SET( service->s_AppMsg->a_Outfd[1] , &(service->s_AppMsg->a_Writefd) );
			
				tv.tv_sec = 0;
				tv.tv_usec = 1000000;
			
				//DEBUG("Thread: waiting for select  in %d  out %d\n", app->infd[0], app->outfd[1] );
			
				ret = 0;
				//ioctl( app->outfd[1], FIONREAD, &ret);	// react on write message to app
				//ioctl( app->infd[1], FIONREAD, &ret);	// read message from app
			
				ret = select( service->s_AppMsg->a_Infd[0]+1, &(service->s_AppMsg->a_Readfd), NULL, NULL, &tv );
				//ret = select( service->s_AppMsg->a_Infd[1]+1, &(service->s_AppMsg->a_Readfd), &(service->s_AppMsg->a_Writefd), NULL, &tv );
				DEBUG("Thread: after select res: %d\n", ret );
				if(ret < 0)
				{
					DEBUG("----------------select() failed \n");
				}
				else if( ret == 0 )
				{
					DEBUG("----------------select() timeout quit %d\n", service->s_AppMsg->a_Quit );
					//break;
					if( (counter % 10 ) == 0 )
					{
						char t[ 2 ] = { '1', 0 };
						//write( app->outfd[1], t, 3 );
						DEBUG("Wrote chars %s count %d\n", t, counter );
					}
					counter++;
					//
					usleep( 10000 );
				}
				else
				{
					//DEBUG("getmsg\n");
					if( FD_ISSET( service->s_AppMsg->a_Infd[0] , &(service->s_AppMsg->a_Readfd) ) )
				{
					FD_CLR( service->s_AppMsg->a_Infd[0], &(service->s_AppMsg->a_Readfd) );
#define BUF_SIZE 100
					
					int readsize = read( service->s_AppMsg->a_Infd[0],input,BUF_SIZE );
					input[ readsize ] = 0; // Read from child’s stdout 
					if( readsize > 0 )
					{
						DEBUG(": '%s'\n", input );
					}
				}
			}
			DEBUG("loop ret %d  appquit %d\n", ret, service->s_AppMsg->a_AppQuit );
			usleep( 100000 );
			
			if( service->s_AppMsg->a_AppQuit == 1 )
			{
				DEBUG("Application finished\n");
				break;
			}
			
			}
		close( service->s_AppMsg->a_Outfd[1] );
		close( service->s_AppMsg->a_Infd[0] );
		DEBUG("Closing busniess\n");
		}
	}
	
	munmap( service->s_AppMsg, sizeof( ServiceAppMsg ) );
	*/
	return 0;
}






/*
FILE * pPipe = popen(script.c_str(), "r");
if (pPipe == NULL)
{
//        cout << "popen() failed:"<< strerror(errno) << endl;
    return -1;
}

while(1)
{
    

    
        //cout << "Data is available now" <<endl;
        
    }

    // Check the Script-timeout 
    if((startTime + scriptTmOut) < time(NULL))
    {
    //    cout<<"Script Timeout"<<endl;
        break ;
    }
}

*/


