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
 *  Role Manager
 *
 * file contain definitions related to RoleManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2019
 */

#include "role_manager.h"

/**
 * Create RoleManager
 *
 * @param sb pointer to SystemBase
 * @return RoleManager structure
 */
RoleManager *RMNew( void *sb )
{
	RoleManager *rm;
	
	if( ( rm = FCalloc( 1, sizeof( RoleManager ) ) ) != NULL )
	{
		rm->rm_SB = sb;
		
		return rm;
	}
	return NULL;
}

/**
 * Delete RoleManager
 *
 * @param rmgr pointer to RoleManager structure which will be deleted
 */
void RMDelete( RoleManager *rmgr )
{
	if( rmgr != NULL )
	{
		FFree( rmgr );
	}
}

FBOOL RMCheckPermission( RoleManager *rmgr, User *u, const char *authid )
{
	FBOOL retValue = FALSE;
	
	return retValue;
}
