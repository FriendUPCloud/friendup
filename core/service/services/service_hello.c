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

int hthread( FThread *t )
{
	char data[ 2048 ];
	
	Service *s = (Service *)t->t_Data;
	HelloService *hs = (HelloService *)s->s_SpecialData;
	//pthread_t ptid = pthread_self();
	hs->hs_PID = (int) getpid();
	
	DEBUG("Before launch THREAD PID %d\n", hs->hs_PID );
	FILE* file = popen("nodejs storage/hello-server/hello.js 2>&1", "r");
	if( file )
	{
		unsigned char *buf;
		
		buf = (unsigned char *)FCalloc( LWS_SEND_BUFFER_PRE_PADDING + 2048 +LWS_SEND_BUFFER_POST_PADDING + 128, sizeof( char ) );
		if( buf != NULL )
		{
			
			//DEBUG1("[WS]:Wrote to websockets %d, string %s size %d\n", n, response->content, strlen( response->content ) );
			//n = lws_write( wsi,  response->content, response->sizeOfContent, LWS_WRITE_TEXT);

			while( ( fgets( data, 2048, file ) ) != NULL )
			{
				int len = strlen( data );
				if( s->s_WSI != NULL && len > 0 )
				{
					memcpy( buf+LWS_SEND_BUFFER_PRE_PADDING, data,  len );
					int n = lws_write( s->s_WSI, buf + LWS_SEND_BUFFER_PRE_PADDING , len, LWS_WRITE_TEXT);
					
					DEBUG1("Wrote to websockets %d bytes\n", n );
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
	
	//execlp( "nodejs", "nodejs", "storage/services/hello/hello.js", NULL );
		//system( "nodejs storage/services/hello/hello.js  >/dev/null 2>&1" );
//			fclose(stdout);
	//		fclose(stderr);
			//execv ("nodejs storage/services/hello/hello.js", cmd );
			//DEBUG("Uh oh! If this prints, execv() must have failed");
			//exit(EXIT_FAILURE);
			
	t->t_Launched = FALSE;
	return 0;
}

int ServiceStart( Service *service )
{
	HelloService *hs = (HelloService *)service->s_SpecialData;
	//if( hs->hs_PID == 0 )
	{
		hs->hs_Thread = ThreadNew( hthread, service, TRUE );
		
		DEBUG ("End of parent program, program PID %d", hs->hs_PID );
	}

	service->s_State = SERVICE_STARTED;
	
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *service, char *data )
{
	HelloService *hs = (HelloService *)service->s_SpecialData;
	
	ThreadCancel( hs->hs_Thread, TRUE );
	/*
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
	}*/
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
	pf = popen("/etc/init.d/nodejs status","r"); 
 
	if( !pf )
	{
		FERROR( "Could not open pipe for output.\n");
		return NULL;
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
		FERROR(" Error: Failed to close command stream \n");
		return NULL;
	}
    
   char *status = FCalloc( 256, sizeof( char ) );
	
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
    
	return status;
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



