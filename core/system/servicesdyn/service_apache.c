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
 *  Apache Service
 *
 * file contain all apache service functitons
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <core/types.h>
#include <system/services/service.h>
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
#include <system/systembase.h>

#define NAME "apache"
#define VERSION 		1
#define REVISION		0

typedef struct ApacheService
{
	int					hs_PID;
	FThread				*hs_Thread;
	SystemBase			*hs_SB;
}ApacheService;

//
// Creste new service
//

Service *ServiceNew( void *sysbase, char *command )
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
		
		if( ( service->s_SpecialData = FCalloc( 1, sizeof( ApacheService ) ) ) != NULL )
		{
			ApacheService *hs = (ApacheService *)service->s_SpecialData;
			hs->hs_SB = sysbase;
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
	if( s )
	{
		if( s->s_Command )
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
	
	Service *s = (Service *)t->t_Data;
	ApacheService *hs = (ApacheService *)s->s_SpecialData;
	//pthread_t ptid = pthread_self();
	hs->hs_PID = (int) getpid();
	
	DEBUG("Before launch THREAD PID %d\n", hs->hs_PID );
	FILE* file = popen("/etc/init.d/apache2 start 2>&1", "r");
	if( file )
	{
		unsigned char *buf;
		
		buf = (unsigned char *)FCalloc( 2048 + 128, sizeof( char ) );
		if( buf != NULL )
		{
			while( ( fgets( data, 2048, file ) ) != NULL )
			{
				if( s->s_UserSession != NULL )
				{
					int len = strlen( data );
					
					DEBUG1( "Apache service WS pointer %p\n", s->s_UserSession ); 
					
					memcpy( buf, data,  len );

					hs->hs_SB->WebsocketWrite( s->s_UserSession, buf , len, LWS_WRITE_TEXT );

					//DEBUG1("Wrote to websockets %d bytes\n", n );
				}
				else
				{
					DEBUG1("Websockets context not provided to NodeJS service, output is going to null\n");
				}
			}
			FFree( buf );
		}
		pclose( file );
	}
	
	t->t_Launched = FALSE;
	
	return 0;
}

//
// Start Service
//

int ServiceStart( Service *service )
{
	ApacheService *hs = (ApacheService *)service->s_SpecialData;
	//if( hs->hs_PID == 0 )
 	DEBUG("Start apache service\n");
	{
		hs->hs_Thread = ThreadNew( thread, service, TRUE, NULL );
	}
	
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *service, char *data )
{
	ApacheService *hs = (ApacheService *)service->s_SpecialData;
	
	system( "/etc/init.d/apache2 stop" );
	
	ThreadCancel( hs->hs_Thread, TRUE );
	
	service->s_State = SERVICE_STOPPED;
	
	return 0;
}

//
// Stop Service
//

#define DATA_SIZE 1024

char *ServiceGetStatus( Service *service, int *len )
{
	FILE *pf;
	char data[ DATA_SIZE ];
	
	service->s_State = SERVICE_STOPPED;
 
	// Setup our pipe for reading and execute our command.
	pf = popen("/etc/init.d/apache2 status","r"); 
 
	if( !pf )
	{
		FERROR( "Could not open pipe for output.\n");
		return NULL;
	}
 
	// Grab data from process execution
	char *tmp = fgets( data, DATA_SIZE , pf );
	if( tmp != NULL )
	{
		if( strncmp( "Apache2 is running", data, 18 ) == 0 )
		{
			service->s_State = SERVICE_STARTED;
		}
	}

    if( pclose(pf) != 0 )
	{
		FERROR(" Error: Failed to close command stream \n");
		return NULL;
	}
	
	char *status = FCalloc( 256, sizeof( char ) );
	if( status != NULL )
	{
		switch( service->s_State )
		{
			case SERVICE_STOPPED:
				strcpy( status, "stopped" );
				break;
			case SERVICE_STARTED:
				strcpy( status, "started" );
				break;
			case SERVICE_PAUSED:
				strcpy( status, "paused" );
				break;
		}
		*len = strlen( status );
	}
	return status;
}

//
// Stop Service
//

int ServiceInstall( Service *s )
{
	system( "apt-get remove apache" );
	return 0;
}

//
// Stop Service
//

int ServiceUninstall( Service *s )
{
	system( "apt-get remove apache" );
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

char *ServiceCommand( struct Service *s, const char *serv, const char *cmd, Hashmap *params )
{

	return NULL;
}

//
// Get Web GUI
//

char *ServiceGetWebGUI( struct Service *s )
{
	
	return "<div class=\"VContentBottom BackgroundDefault Padding BorderTop\" style=\"height: 30px\">\
					<button type=\"button\" class=\"IconSmall fa-plus \" id=\"BtnAddDockItem\" onclick=\"Application.sendMessage( { command: 'start', id : 'apache' } )\">\
						Start\
					</button>\
					<div class=\"ButtonSpacer\"></div>\
					<button type=\"button\" class=\"IconSmall fa-remove\" id=\"BtnCancel\" onclick=\"Application.sendMessage( { command: 'stop', id : 'apache' } )\">\
						Stop\
					</button>\
				</div>";
}

//
// version/revision/name
//

FULONG GetVersion(void)
{
	return VERSION;
}

FULONG GetRevision(void)
{
	return REVISION;
}

const char *GetName()
{
	return NAME;
}

//
// Service Thread
//
/*
int ServiceThread( FThread *ptr )
{
	Service *service = (Service *)ptr->t_Data;
	
	system( service->s_Command );

	return 0;
}*/






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


