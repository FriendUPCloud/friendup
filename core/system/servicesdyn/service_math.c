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
 *  Math Service
 *
 * file contain all math service functitons
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <stdio.h>
#include <core/types.h>
#include <system/services/service.h>
#include <system/services/service_manager.h>
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
#ifdef __linux__ 
#include <matheval.h>
#endif
#include <util/hashmap.h>

#define NAME "math"
#define VERSION 		1
#define REVISION		0

typedef struct MathServ
{
	char countdata[ 1000 ];	// temporary buffer
	void *f;								// pointer to math stuff
}MathServ;

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
		
		service->s_SpecialData = calloc( 1, sizeof( MathServ ) );
		
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
		if( s->s_SpecialData )
		{
			free( s->s_SpecialData );
		}
		
		if( s->s_Command )
		{
			free( s->s_Command );
			s->s_Command = NULL;
		}
		
		//free( s );
	}
}

//
// Start Service
//

int ServiceStart( Service *service )
{
	//system( "/etc/init.d/apache2 start" );

	service->s_State = SERVICE_STARTED;
	
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *service, char *data )
{
	//system( "/etc/init.d/apache2 stop" );
	
	//service->s_State = SERVICE_STOPPED;
	
	return 0;
}

//
// Stop Service
//

#define DATA_SIZE 1024

char *ServiceGetStatus( Service *service, int *len )
{
	service->s_State = SERVICE_STARTED;

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
	//system( "apt-get remove apache" );
	return 0;
}

//
// Stop Service
//

int ServiceUninstall( Service *s )
{
	//system( "apt-get remove apache" );
	return 0;
}

//
// Count math data
//

char *ServiceRun( struct Service *s )
{
#ifdef __linux__
	MathServ *ms = ( MathServ * ) s->s_SpecialData;
	
	// autochange size
	char *retBuffer = calloc( 1024, sizeof(FBYTE ) );
	
	//int length; /* Length of above buffer. */
	

	ms->f = evaluator_create ( retBuffer );

	DEBUG (" f’(x) = %s\n", evaluator_get_string( ms->f ) );
	
	strncpy( retBuffer, evaluator_get_string( ms->f ), 1024 );
	
	evaluator_destroy( ms->f );
#endif
	return NULL;
}

//
// Equation part
//

typedef struct EQPart
{
	MinNode				node;				// children
#ifdef __linux__
	struct EQPart		*child;
#endif
	int 						id, size, childSize;
	char						data[ 100 ];		// equation
}EQPart;

#define ADD_CHILD( ROOT, LAST, NEW ) \
	if( ROOT->child == NULL ) ROOT->child = NULL; else LAST->node.mln_Succ = (MinNode *)NEW;



char  *splitEQString(char *cptr, EQPart * curr)
{
#ifdef __linux__
	int size = 0;
	int id = 0;
	EQPart *last = curr->child;

	while (*cptr != 0)
	{
		printf("->%c", *cptr);
		if (*cptr == ')')
		{
			printf("New entry: %s\n", curr->data);
			//return curr->size+1;
			break;
		}
		else if (*cptr == '(')
		{
			EQPart *npart = (EQPart *)calloc(1, sizeof(EQPart));
			npart->id = id;

			char num[20];
			sprintf(num, "([%d]", id);
			strcat(curr->data, num);
			curr->size += strlen(num);

			ADD_CHILD( curr, last, npart );

			last = npart;
			cptr = splitEQString(++cptr, npart);

			id++;
			curr->childSize = id;
		}

		curr->data[curr->size++] = *cptr++;
	}

	return cptr;
#endif
}



char *datajoin( char *ptr, EQPart *curr)
{
#ifdef __linux__
	int i = 0;

	DEBUG("===%s size %d\n", curr->data, curr->size);

	while (i < curr->size)
	{
		if (curr->data[i] == '[')
		{
			//DEBUG("found!\n");
			char *end = strchr(&(curr->data[i+1]), ']');
			//DEBUG("found end %x  \n", (unsigned int)end);
			//end = strtok(NULL, "]");
			if (end != NULL)
			{    
				char dsize[20];
				memset(dsize, sizeof(dsize), sizeof(char));
				int dataSize = end - &(curr->data[i + 1]);
				strncpy(dsize, &(curr->data[i+1]), dataSize );
				dsize[dataSize] = 0;
				int find = atoi(dsize);

				EQPart *tmp = curr->child;
				while (1)
				{
					if (find == tmp->id)
					{
						ptr = datajoin(ptr, tmp);
						break;
					}
					tmp = (EQPart *)tmp->node.mln_Succ;
				}

				//DEBUG("Found entry with number %s size %d  ptr end %x ptr act %x  endsign %c\n", dsize, dataSize, (unsigned int)end, (unsigned int)&(curr->data[i]), *end );
				i += dataSize+2;
			}
		}
		//printf("%c i %d\n", curr->data[i], i);

		*ptr++ = curr->data[i];
		i++;
	}
	return ptr;
#endif
}
	
//
// Service command
//

char *ServiceCommand( struct Service *s, const char *serv, const char *cmd, Hashmap *params )
{
#ifdef __linux__
	DEBUG("Math service, input %s\n", cmd );
	char *retBuffer = NULL;
	MathServ *ms = ( MathServ * ) s->s_SpecialData;
	EQPart *eqroot = NULL;		// root entry
	
	const char *servers = cmd;
	char *eq =  "( 2 + 2 ) * ( 4 +2 )";//strtok( (char *)cmd, ";");											// server names
	ServiceManager *sm = (ServiceManager *)s->s_CommService;

	eqroot = calloc( 1, sizeof( EQPart ) );
	
	splitEQString( eq, eqroot );
	
	if( eqroot != NULL )
	{
		
	}
	
	free( eqroot );
	
	return retBuffer;;
#endif
}

//
// Get Web GUI
//

char *ServiceGetWebGUI( struct Service *s )
{
	
	return "\
					<div class=\"HContent25 FloatLeft\">	\
						<strong id=\"lba\">Description:</strong>	\
					</div>	\
					<div class=\"HContent5 FloatLeft\">&nbsp;</div>	\
					<div class=\"HContent70 FloatLeft\">	\
						<textarea class=\"FullWidth\" id=\"eqa\"></textarea>	\
					</div> \
					<div class=\"VContentBottom BackgroundDefault Padding BorderTop\" style=\"height: 30px\">\
					<button type=\"button\" class=\"IconSmall fa-plus \" id=\"BtnAddDockItem\" onclick=\"run( )\">\
						Start\
					</button> \
					<button type=\"button\" class=\"IconSmall fa-plus \" id=\"BtnAddDockItem\" onclick=\"Application.sendMessage( { command: 'start', id : 'math' } )\">\
						Start\
					</button>\
					<script> \
run = function( id, data ){ \
	var f = new Library( 'system.library' ); \
	f.onExecuted = function( e, d ) \
	{ \
		Application.refreshDoors(); \
	} console.log('executed!!!'); \
	var args = { \
		command: 'mount', \
		type: data.type, \
		devname: data.name, \
		path: data.path, \
		mount: { id: id }  \
	};  \
	f.execute( 'device', args ); } </script>";
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
