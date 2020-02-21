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

/*
FBOOL PermissionManagerCheckPermission( PermissionManager *pm, UserSession *us, const char *auth, FULONG obid, const char *obtype, char *type )
{
//Uses: module=system&command=checkuserpermission&type=%type%&identifier=%identifier%

//Users of level Admin always gets true.

//Ofcourse module calls need user session id etc as standard (&sessionid=%thesession%).

	FBOOL retVal = FALSE;
	if( pm != NULL )
	{
		SystemBase *sb = (SystemBase *)pm->pm_SB;
		int len = 512;
		if( type != NULL )
		{
			len += strlen( type );
		}
		if( auth != NULL )
		{
			len += strlen( auth );
		}
		if( us->us_SessionID != NULL )
		{
			len += strlen( us->us_SessionID );
		}
		
		char *command = FMalloc( len );
		if( command != NULL )
		{
			//module=system&command=checkapppermission&key=%key%&appname=%appname%
			
			if( obid == 0 )
			{
				snprintf( command, len, "command=permissions&sessionid=%s&args=\
{\"type\":\"%s\",\"context\":\"application\", \
\"authid\":\"%s\",\"data\":{\"permission\":[\"PERM_WORKGROUP_GLOBAL\",\"PERM_WORKGROUP_WORKGROUP\"]}\
}", us->us_SessionID, type, auth ); 
			}
			else
			{
				snprintf( command, len, "command=permissions&sessionid=%s&args=\
{\"type\":\"%s\",\"context\":\"application\", \
\"authid\":\"%s\",\"data\":{\"permission\":[\"PERM_WORKGROUP_GLOBAL\",\"PERM_WORKGROUP_WORKGROUP\"]},\
\"object\":\"%s\",\"objectid\":%lu}", us->us_SessionID, type, auth, obtype, obid ); 
			}
			 
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
*/

FBOOL PermissionManagerCheckPermission( PermissionManager *pm, const char *sessionid, const char *authid, const char *args )
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
		if( sessionid != NULL )
		{
			len += strlen( sessionid );
		}
		if( authid != NULL )
		{
			len += strlen( authid );
		}
		if( args != NULL )
		{
			//args = json_unescape_string( args );
			len += strlen( args );
		}
		
		char *command = FMalloc( len );
		if( command != NULL )
		{
			//module=system&command=checkapppermission&key=%key%&appname=%appname%
			
			snprintf( command, len, "command=permissions&sessionid=%s&authid=%s&args=%s", sessionid, authid, args ); 
			 
			DEBUG("Run command via php: '%s'\n", command );
			FULONG dataLength;

			char *data = sb->sl_PHPModule->Run( sb->sl_PHPModule, "modules/system/module.php", command, &dataLength );
			if( data != NULL )
			{
				Log( FLOG_INFO, "[PermissionManagerCheckPermission]\ncall: %s\nreturn: %s\n", command, data );
				//DEBUG( "PermissionManagerCheckPermission: %s", data );
				if( strncmp( data, "ok", 2 ) == 0 )
				{
					retVal = TRUE;
				}
				else
				{
					Log( FLOG_INFO, "[PermissionManagerCheckPermission]\ncall: %s", command );
				}
				FFree( data );
			}
			DEBUG("PermissionManagerCheckPermission: ret: %d\n", retVal );

			FFree( command );
		}
	}
	return retVal;
}
