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
 *  Permission Manager header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/05/2019
 */

#ifndef __SYSTEM_PERMISSION_PERMISSION_MANAGER_H__
#define __SYSTEM_PERMISSION_PERMISSION_MANAGER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/dictionary/dictionary.h>

//
// Permission Manager
//

typedef struct PermissionManager
{
	void						*pm_SB;
	pthread_mutex_t				pm_Mutex;
}PermissionManager;

//

PermissionManager *PermissionManagerNew( void *sb );

void PermissionManagerDelete( PermissionManager *pm );

FBOOL PermissionManagerCheckAppPermission( PermissionManager *pm, char *key,char *appname );

FBOOL PermissionManagerCheckPermission( PermissionManager *pm, const char *sessionid, const char *authid, const char *args );
//FBOOL PermissionManagerCheckPermission( PermissionManager *pm, UserSession *us, const char *auth, FULONG obid, const char *obtype, char *type );

#endif //__SYSTEM_PERMISSION_PERMISSION_MANAGER_H__

