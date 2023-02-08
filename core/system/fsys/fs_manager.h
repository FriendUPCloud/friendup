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
 *  Filesystem manager    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 28 11 2016
 */

#ifndef __SYSTEM_FSYS_FSMANAGER_H__
#define __SYSTEM_FSYS_FSMANAGER_H__

#include <core/types.h>
#include "file.h"
#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_session.h>

typedef struct FSManager
{
	void 					*fm_SB;
}FSManager;

//
// create FSManager
//

FSManager *FSManagerNew( void *sb );

//
// delete FSManager
//

void FSManagerDelete( FSManager *fm );

//
// check if user have access to file/directory/door
//

FBOOL FSManagerCheckAccess( FSManager *fm, const char *path, FULONG devid, FUQUAD userid, char *perm );

//
// return access rights in json format
//

BufString *FSManagerGetAccess( FSManager *fm, const char *path, FULONG devid, User *usr );

//
// second function which protect files/folders/drivers
//

int FSManagerProtect3( FSManager *fm, User *usr, char *path, FULONG devid, char *userc, char *groupc, char *othersc );

//
// accgroups - string in format  userA:ARWED,userB:ARWED,userC:ARWED;groupA:ARWED,groupB:ARWED;other:ARWED
//

int FSManagerProtect( FSManager *fm, const char *path, FULONG devid, char *accgroups );

//
//
//

BufString *FSManagerAddPermissionsToDir( FSManager *fm, BufString *recv, FULONG devid, User *usr  );

//
//
//

int FSManagerDeleteSharedEntry( FSManager *fm, char *path, FQUAD uid );

#endif // __SYSTEM_FSYS_FSMANAGER_H__
