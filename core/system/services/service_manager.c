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
 * ServiceManager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <system/services/service_manager.h>
#include <network/protocol_http.h>
#include <network/path.h>
#include <core/friendcore_manager.h>
#include <util/string.h>
#include <dirent.h> 
#include <util/buffered_string.h>
#include <communication/comm_msg.h>

/**
 * Create new ServiceManager
 *
 * @param fcm pointer to  FriendCoreManager
 * @return new pointer to ServiceManager structure
 */

ServiceManager *ServiceManagerNew( void *fcm )
{
	ServiceManager *smgr = FCalloc( 1, sizeof( ServiceManager ) );
	if( smgr != NULL )
	{
		char tempString[ PATH_MAX ];

		smgr->sm_FCM = fcm;
		
		if( getcwd( tempString, sizeof ( tempString ) ) == NULL )
		{
			FERROR("getcwd failed!");
			exit(5);
		}

		smgr->sm_ServicesPath = FCalloc( PATH_MAX, sizeof( char ) );
		if( smgr->sm_ServicesPath == NULL )
		{
			FFree( smgr );
			FERROR("Cannot allocate memory for ServiceManager!\n");
			return NULL;
		}

		strcpy( smgr->sm_ServicesPath, tempString );
		strcat( smgr->sm_ServicesPath, "/services/");
		// all services will be avaiable in FriendCore folder/services/ subfolder

		DIR           *d;
		struct dirent *dir;
		d = opendir( smgr->sm_ServicesPath );
	
		if( d == NULL )
		{
			// try to open files from libs/ directory
			strcpy( smgr->sm_ServicesPath, tempString );
			strcat( smgr->sm_ServicesPath, "/services/");
			d = opendir( smgr->sm_ServicesPath );
		}
	
		if( d )
		{

			while( ( dir = readdir( d ) ) != NULL )
			{
				if( strncmp( dir->d_name, ".", 1 ) == 0 || strncmp( dir->d_name, "..", 2 ) == 0 )
				{
					continue;
				}

				snprintf( tempString, sizeof(tempString), "%s%s", smgr->sm_ServicesPath, dir->d_name );
				
				struct stat statbuf;
				if ( stat( tempString, &statbuf ) == 0 )
				{
					if( S_ISDIR( statbuf.st_mode ) )
					{
						
					}
					else
					{
						Service *locserv = ServiceOpen( SLIB, tempString, 0, (void *)smgr, (void *)CommServiceSendMsg );
				
						if( locserv != NULL )
						{
							//locserv->ServiceNew( tempString );

							DEBUG("SERVICE created, service %s added to system\n", locserv->GetName() );
					
							locserv ->node.mln_Succ = (MinNode *)smgr->sm_Services;
							smgr->sm_Services = locserv;
						}
						else
						{
							Log( FLOG_ERROR,"Cannot load service %s\n", dir->d_name );
						}
					}
				}
			}
			closedir( d );
		}
	}
	
	return smgr;
}

/**
 * Delete ServiceManager
 *
 * @param smgr pointer to ServiceManager which will be deleted
 */
void ServiceManagerDelete( ServiceManager *smgr )
{
	if( smgr != NULL )
	{
		Service *lserv = smgr->sm_Services;
		Service *rserv = smgr->sm_Services;
		// release and free all modules

		while( lserv != NULL )
		{
			rserv = lserv;
			lserv = (Service *)lserv->node.mln_Succ;
			DEBUG("Remove Service %s\n", rserv->GetName() );
			ServiceClose( rserv );
		}

		if( smgr->sm_ServicesPath )
		{
			FFree( smgr->sm_ServicesPath );
			smgr->sm_ServicesPath = NULL;
		}
	
		FFree( smgr );
	}
	else
	{
		DEBUG("ServerManager = NULL\n");
	}
	
	Log( FLOG_INFO,"ServiceManager delete END\n");
}

/**
 * Find service by the name
 *
 * @param smgr pointer to ServiceManager
 * @param name of the service
 * @return pointer to Service structure or NULL when it couldnt be found
 */

Service *ServiceManagerGetByName( ServiceManager *smgr, char *name )
{
	Service *currServ = smgr->sm_Services;
	
	DEBUG("Get service by name\n");
	
	while( currServ != NULL )
	{
		if( currServ->GetName() != NULL )
		{
			if( strcmp( name, currServ->GetName() ) == 0 )
			{
				DEBUG("Serice returned %s\n", currServ->GetName() );
				return currServ;
			}
		}
		currServ = (Service *) currServ->node.mln_Succ;
	}
	
	DEBUG("Couldn't find service by name '%s'\n", name );
	
	return NULL;
}

/**
 * Change service state UNIMPLEMENTED
 *
 * @param smgr pointer to ServiceManager
 * @param srv pointer to Service on which change will be done
 * @param state new service state
 * @return 0 when success, otherwise error number
 */

int ServiceManagerChangeServiceState( ServiceManager *smgr __attribute__((unused)), Service *srv __attribute__((unused)), int state __attribute__((unused)))
{
	return 0;
}

