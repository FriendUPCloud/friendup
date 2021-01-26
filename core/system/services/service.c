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
 * Service body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

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

/**
 * Open Service from file
 *
 * @param sysbase pointer to SystemBase
 * @param name name of server which will be loaded
 * @param version version of service which we want to open
 * @param sm pointer to CommunicationService
 * @param sendMessage pointer to function which will be used to send messages
 * @return pointer to new Service structure or NULL when error appear
 */
Service* ServiceOpen( void *sysbase, char* name, long version __attribute__((unused)), void *sm, void *(*sendMessage)(void *a, void *b) )
{
	FBOOL loaded = FALSE;
	char currentDirectory[ PATH_MAX ];
	char loadServicePath[ PATH_MAX ];
	memset( currentDirectory, 0, sizeof(currentDirectory) );
	memset( loadServicePath, 0, sizeof(loadServicePath) );

	// Open service
	if( name == NULL )
	{
		FERROR("Cannot load NULL Service\n");
		return NULL;
	}
	
	Service *service = NULL;
	void *handle = NULL;

	// there is no need to multiply by sizeof(char)
	if( getcwd( currentDirectory, sizeof ( currentDirectory ) ) == NULL )
	{
		FERROR("getcwd failed!");
		exit(5);
	}
	DEBUG( "[ServiceOpen] Current directory %s\n", currentDirectory );

	// we should check and get lib from current dirrectory first (compatybility)

	if( ( handle = dlopen ( name, RTLD_NOW/*|RTLD_GLOBAL*/ ) ) != NULL )
	{
		loaded = TRUE;
	}
	else
	{
		FERROR( "[ServiceOpen] Cannot open file '%s'\n", name );
		char* error = dlerror();
		if( error )
		{
			FERROR( "[ServiceOpen] Library error: %s  DYNAMIC LINK ERROR\n", error );
		}
		return NULL;
	}

	char* error = dlerror();
	if( error )
	{
		FERROR ( "[ServiceOpen] Library error: %s\n", error );
	}

	DEBUG( "[ServiceOpen] Before init\n" );

	Service *tserv = FCalloc( 1, sizeof( Service ) );
	if( tserv != NULL )
	{
		tserv->ServiceNew = dlsym( handle, "ServiceNew" );
		service = tserv->ServiceNew( sysbase, name );
		FFree( tserv );
	}

	if( service != NULL )
	{
		service->s_Handle = handle;
		service->GetVersion = dlsym( service->s_Handle, "ServiceDelete" );;// (void *)GetVersion;
		//service->ServiceNew = ServiceNew;//dlsym( service->s_Handle, "ServiceNew" );
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
		
		DEBUG( "[ServiceOpen] After init: name %s\n", service->GetName() );
		// allow services to use FC connections
		
		service->CommServiceSendMsg = (void * (*)(void *, DataForm *))sendMessage;
		service->s_CommService = sm;
	
		DEBUG( "[ServiceOpen] Completed initialization...\n" );
	}
	else
	{
		DEBUG("[ServiceOpen] Error while init\n");
	}
	
	return service;
}

/**
 * Close Service
 *
 * @param service pointer to Service which will be closed
 */
void ServiceClose( Service* service )
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
