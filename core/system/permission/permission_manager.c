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
 *  Permission Manager body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/05/2019
 */

#include "permission_manager.h"
#include <system/systembase.h>

/**
 * Create Permission Manager
 *
 * @param sb pointer to SystemBase
 * @return PermissionManager
 */
PermissionManager *PermissionManagerNew( void *sb )
{
	PermissionManager *pm = FCalloc( 1, sizeof( PermissionManager ) );
	if( pm != NULL )
	{
		pm->pm_SB = sb;
		pthread_mutex_init( &(pm->pm_Mutex), NULL );
	}
	return pm;
}

/**
 * Delete Permission Manager
 *
 * @param pm permission manager to remove
 */
void PermissionManagerDelete( PermissionManager *pm )
{
	if( pm != NULL )
	{
		pthread_mutex_destroy( &(pm->pm_Mutex) );
		FFree( pm );
	}
}

/**
 * Check application permission
 *
 * @param pm pointer to PermissionManager
 * @param key used to find permissions
 * @param appname application name
 * @return TRUE when access is granted, otherwise FALSE
 */

FBOOL PermissionManagerCheckAppPermission( PermissionManager *pm, char *key, char *appname )
{
/*
Uses: module=system&command=checkapppermission&key=%key%&appname=%appname%
*/
	FBOOL retVal = FALSE;
	if( pm != NULL )
	{
		SystemBase *sb = (SystemBase *)pm->pm_SB;
		int len = 512;
		if( key != NULL )
		{
			len += strlen( key );
		}
		if( appname != NULL )
		{
			len += strlen( appname );
		}
		
		char *command = FMalloc( len );
		if( command != NULL )
		{
			//module=system&command=checkapppermission&key=%key%&appname=%appname%
			snprintf( command, len, "command=checkapppermission&key=%s&appname=%s;", key, appname );
			
			DEBUG("Run command via php: '%s'\n", command );
			FULONG dataLength;

			char *data = sb->sl_PHPModule->Run( sb->sl_PHPModule, "modules/system/module.php", command, &dataLength );
			if( data != NULL )
			{
				if( strncmp( data, "ok", 2 ) == 0 )
				{
					retVal = TRUE;
				}
				FFree( data );
			}
			FFree( command );
		}
	}
	return retVal;
}

FBOOL PermissionManagerCheckPermission( PermissionManager *pm, char *type, char *identifier )
{
/*
Uses: module=system&command=checkuserpermission&type=%type%&identifier=%identifier%

Users of level Admin always gets true.

Ofcourse module calls need user session id etc as standard (&sessionid=%thesession%).
*/
	FBOOL retVal = FALSE;
	if( pm != NULL )
	{
		SystemBase *sb = (SystemBase *)pm->pm_SB;
		int len = 512;
		if( type != NULL )
		{
			len += strlen( type );
		}
		if( identifier != NULL )
		{
			len += strlen( identifier );
		}
		
		char *command = FMalloc( len );
		if( command != NULL )
		{
			//module=system&command=checkapppermission&key=%key%&appname=%appname%
			snprintf( command, len, "command=checkuserpermission&type=%s&identifier=%s;", type, identifier );
			
			DEBUG("Run command via php: '%s'\n", command );
			FULONG dataLength;

			char *data = sb->sl_PHPModule->Run( sb->sl_PHPModule, "modules/system/module.php", command, &dataLength );
			if( data != NULL )
			{
				if( strncmp( data, "ok", 2 ) == 0 )
				{
					retVal = TRUE;
				}
				FFree( data );
			}
			FFree( command );
		}
	}
	return retVal;
}
