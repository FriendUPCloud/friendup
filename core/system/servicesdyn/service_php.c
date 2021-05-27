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
 *  PHP Service
 *
 * file contain all PHP service functitons
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
#include <system/module/module.h>
#include <system/systembase.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <system/systembase.h>

#define NAME "php"
#define VERSION 		1
#define REVISION		0

//
//
//

enum {
	STATE_STOPPING = 0,
	STATE_STOPPED,
	STATE_STARTED,
	STATE_RUNNING,
	STATE_PAUSED
};

//
// single running mod instance
//

typedef struct PHPInstance
{
	void						*pi_PHPService;
	
	pid_t						pi_PID;
	
	FULONG						pi_Ptr;
	FBOOL						pi_TaskClosed;
	char						*pi_Command;
	int							pi_CommandLen;
	int							pi_State;
	UserSession					*pi_US;				// pointer to websocket connection via user session
	
	FThread						*pi_Thread;
	MinNode						node;
}PHPInstance;

//
// main service structure
//

typedef struct PHPService
{
	SystemBase				*ps_SB;
	//FThread						*ps_Thread;
	pthread_mutex_t			ps_Mutex; 
	pthread_cond_t 			ps_StartCond;	// start condition
	
	PHPInstance 			*ps_Instances;
	int 					ps_ModsNumber;
}PHPService;

//
// same as Escape + return len
//

char* StringShellEscapeSize( const char* str, int *len )
{
	DEBUG("StringShellEscape %s\n", str );
	
	unsigned int strLen = str ? strlen( str ) : 0;
	unsigned int estrLen = 0;
	
	// We must escape \'s and "'s from the args!
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estrLen += 2;
		}
		else if(str[i] == '"')
		{
			estrLen += 2;
		}
		else
		{
			estrLen++;
		}
	}
	char* estr = calloc( estrLen + 1, sizeof(char) );
	if( estr == NULL )
	{
		FERROR("Cannot allocate memory in StringShellEscape\n");
		return NULL;
	}
	unsigned int j = 0;
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else if(str[i] == '"')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else
			estr[j++] = str[i];
	}
	estr[ estrLen ] = 0;
	*len = estrLen;
	
	return estr;
}

//
// popen
//

#define READ 0
#define WRITE 1

pid_t popen2(const char *command, pid_t *p, int *infp, int *outfp)
{
	int p_stdin[2], p_stdout[2];
	pid_t pid;

	if( pipe(p_stdin) != 0 )
	{
		return -1;
	}
	
	if( pipe(p_stdout) != 0 )
	{
		return -1;
	}

	pid = *p = fork();

	if (pid < 0)
	{
		return pid;
	}
	else if (pid == 0)
	{
		dup2( p_stdin[READ], STDIN_FILENO );
		dup2( p_stdout[WRITE], STDOUT_FILENO );

	//close unuse descriptors on child process.
		close(p_stdin[READ]);
		close(p_stdin[WRITE]);
		close(p_stdout[READ]);
		close(p_stdout[WRITE]);

		//can change to any exec* function family.
		execl("/bin/bash", "bash", "-c", command, NULL);
		perror("execl");
		exit(1);
	}

	// close unused descriptors on parent process.
	close(p_stdin[READ]);
	close(p_stdout[WRITE]);

	if (infp == NULL)
	{
		close(p_stdin[WRITE]);
	}
	else
	{
		*infp = p_stdin[WRITE];
	}

	if (outfp == NULL)
	{
		close(p_stdout[READ]);
	}
	else
	{
		*outfp = p_stdout[READ];
	}

	return pid;
}

int pclose2(pid_t pid) 
{
	int internal_stat;
	waitpid(pid, &internal_stat, 0);
	return 0;// WEXITSTATUS(internal_stat);
}

//
// Creste new service
//

Service *ServiceNew( void *sysbase, char *command )
{
	Service *service = NULL;
	
	if( ( service = FCalloc( 1, sizeof( Service ) )  ) != NULL )
	{
		int size = 0;
		
		size = strlen( command );
		if( size > 0 )
		{
			if( ( service->s_Command = FCalloc( size+1, sizeof( char ) ) ) != NULL )
			{
				memcpy( service->s_Command, command, size*sizeof(char) );
			}
		}
		
		PHPService *hs = FCalloc( 1, sizeof( PHPService ) );
		if( hs != NULL )
		{
			hs->ps_SB = sysbase;
			pthread_mutex_init( &hs->ps_Mutex, NULL );
			pthread_cond_init( &hs->ps_StartCond, NULL );
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
	if( s )
	{
		if( s->s_Command )
		{
			if( s->s_SpecialData != NULL )
			{
				PHPService *hs =(PHPService *) s->s_SpecialData;
				if( hs != NULL )
				{
					pthread_mutex_destroy( &hs->ps_Mutex );
					pthread_cond_destroy( &hs->ps_StartCond );
				}
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
	PHPInstance *si = (PHPInstance *)t->t_Data;
	
	si->pi_State = STATE_RUNNING;

	DEBUG("[PHPService] call run\n");

	FULONG res = 0;

	// Escape the input, so that remove code injection is not possible.
	
	char *command = NULL;
	if( ( command = FCalloc( 1024 +si->pi_CommandLen, sizeof( char ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for data\n");
		return -1;
	}

	DEBUG("[PHPService] Run\n");
	
	//
	// here there should be prepared command
	//

	sprintf( command, "php %s;", si->pi_Command );
	
	DEBUG( "[PHPmod] run app: '%s'\n", command );
	
	PHPService *pserv = (PHPService *) si->pi_PHPService;
	
	int inid;
	int outid;
	
	//FILE *pipe = popen( command, "r" );
	
	DEBUG("Before popen2\n");
	si->pi_PID = popen2( command, &si->pi_PID ,&inid, &outid );
	/*
	if( !pipe )
	{
		FERROR("[PHPmod] cannot open pipe\n");
		free( command );
		return -2;
	}*/
	DEBUG("Before cond wait\n");
	//FRIEND_MUTEX_LOCK( &pserv->ps_Mutex );
	//pthread_cond_wait( &pserv->ps_StartCond, &pserv->ps_Mutex );
	//FRIEND_MUTEX_UNLOCK( &pserv->ps_Mutex );
	
	DEBUG("[PHPmod] command launched: %.*s\n", si->pi_CommandLen+8, command );
	
#define MY_BUF_SIZE 10024
	
	unsigned char *buf = FCalloc( MY_BUF_SIZE, sizeof( char ) );

	SystemBase *sb = (SystemBase *)pserv->ps_SB;
	FriendCoreManager *fcm = NULL;
	if( sb != NULL )
	{
		fcm = sb->fcm;
	
		if( buf != NULL )
		{
			while( TRUE )// !feof( outid ) )
			{
				if( fcm != NULL && fcm->fcm_Shutdown == TRUE )
				{
					break;
				}
			
				// Make a new buffer and read
				//int reads = fread( buf, sizeof( char ), MY_BUF_SIZE, outid );
				int reads = read( outid, buf, MY_BUF_SIZE );
				if( reads > 0 )
				{
					DEBUG("Message replyed %.*s\n", reads, buf );
					// This is how the total size is now
					res += reads;
				
					if( si->pi_US != NULL )
					{
						sb->WebsocketWrite( si->pi_US , buf, reads, LWS_WRITE_TEXT );
			
						DEBUG1("Wrote to websockets %lu bytes\n", res );
					}
					else
					{
						DEBUG1("Websockets context not provided to NodeJS service, output is going to null\n");
					}
				}
				else
				{
					break;
				}
			
				if( t->t_Quit == TRUE )
				{
					si->pi_State = STATE_STOPPING;
					DEBUG("Quit called\n");
					break;
				}
			}
			FFree( buf );
		}
		else
		{
			FERROR("Cannot allocate memory for sendbuffer or buffer\n");
		}
	}

	pclose2( si->pi_PID );
	
	DEBUG( "[PHPmod] We are now complete..\n" );
	FFree( command ); 
	
	si->pi_TaskClosed = TRUE;
	t->t_Launched = FALSE;
	
	return 0;
}

//
// Start Service
//

int ServiceStart( Service *service )
{

	service->s_State = SERVICE_STARTED;
	
	return 0;
}

//
// Stop Service
//

int ServiceStop( Service *service, char *data )
{
	
	//ThreadCancel( hs->hs_Thread, TRUE );
	
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
	pf = popen("php test","r"); 
 
	if( !pf )
	{
		FERROR( "Could not open pipe for output.\n");
		return 0;
	}
 
	// Grab data from process execution
	char *tmp = fgets( data, DATA_SIZE , pf );
	if( tmp != NULL )
	{
		if( strncmp( "Could not open input file", data, 25 ) == 0 )
		{
			service->s_State = SERVICE_STARTED;
		}
	}

    if( pclose(pf) != 0 )
	{
		FERROR(" Error: Failed to close command stream \n");
		return 0;
	}
    
    BufString *bs = BufStringNew();
	PHPInstance *pip = (PHPInstance *) service->s_SpecialData;
	int entry = 0;
	char temp[ 2048 ];
	
	switch( service->s_State )
	{
		case SERVICE_STOPPED:
			BufStringAddSize( bs, "\"status\":\"stopped\",", 19 );
			break;
		case SERVICE_STARTED:
			BufStringAddSize( bs, "\"status\":\"started\",", 19 );
			break;
		case SERVICE_PAUSED:
			BufStringAddSize( bs, "\"status\":\"paused\",", 19 );
			break;
	}
	
	BufStringAddSize( bs, "\"data\":{", 8 );
	while( pip != NULL )
	{
		if( entry == 0 )
		{
			sprintf( temp, "\"pid\":\"%d\"", pip->pi_PID );
		}
		else
		{
			sprintf( temp, ",\"pid\":\"%d\"", pip->pi_PID );
		}
		
		BufStringAddSize( bs, temp, strlen(temp) );
		
		switch( pip->pi_State )
		{
			case STATE_STOPPED:
				BufStringAddSize( bs, ",\"status\":\"stopped\"", 19 );
				break;
			case SERVICE_STARTED:
				BufStringAddSize( bs, ",\"status\":\"started\"", 19 );
				break;
			case STATE_RUNNING:
				BufStringAddSize( bs, ",\"status\":\"running\"", 19 );
				break;
		}
		
		pip = (PHPInstance *)pip->node.mln_Succ;
		entry++;
	}
	BufStringAddSize( bs, "} }", 3 );
	
	*len = bs->bs_Size;
	char *status = bs->bs_Buffer;
	bs->bs_Buffer = NULL;
	BufStringDelete( bs );
    
	return status;
}

//
// Stop Service
//

int ServiceInstall( Service *s )
{
	return 0;
}

//
// Stop Service
//

int ServiceUninstall( Service *s )
{
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

char *ServiceCommand( struct Service *s, const char *serv, const char *cmd, Hashmap *params  )
{
	char *response = NULL;
	PHPInstance *phpi = FCalloc( 1, sizeof( PHPInstance ) );
	if( phpi != NULL )
	{
		phpi->pi_Command = StringShellEscapeSize( cmd, &(phpi->pi_CommandLen) );
		phpi->pi_State = STATE_STARTED;
		
		if( s->s_SpecialData != NULL )
		{
			PHPService *hs =(PHPService *) s->s_SpecialData;
			FRIEND_MUTEX_LOCK( &hs->ps_Mutex );
			
			phpi->node.mln_Succ = (MinNode *)hs->ps_Instances;
			hs->ps_Instances = phpi;
			
			phpi->pi_US = s->s_UserSession;
			phpi->pi_PHPService = hs;
			
			FRIEND_MUTEX_UNLOCK( &hs->ps_Mutex );
			
			phpi->pi_Thread = ThreadNew( thread, phpi, TRUE, NULL );
			
			response = (char *)FCalloc( 1024, sizeof( char ) );
			if( response != NULL )
			{
				sprintf( response, "{\"pid\":\"%ld\"}",(FULONG) phpi->pi_PID );
			}
		}
		else
		{
			FFree( phpi );
		}
	}
	else
	{
		FERROR("Cannot allocate memory for PHPInstance\n");
	}
	return response;
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



