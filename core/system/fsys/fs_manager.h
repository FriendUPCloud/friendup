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
/** @file
 *
 *  Filesystem manager    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 28 Nov 2016
 */

#ifndef __SYSTEM_FSYS_FSMANAGER_H__
#define __SYSTEM_FSYS_FSMANAGER_H__

#include <core/types.h>
#include "file.h"
//#include "file_lock.h"
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

FBOOL FSManagerCheckAccess( FSManager *fm, const char *path, FULONG devid, User *usr, char *perm );

//
// return access rights in json format
//

BufString *FSManagerGetAccess( FSManager *fm, const char *path, FULONG devid, User *usr );


//
// second function which protect files/folders/drivers
//

int FSManagerProtect3( FSManager *fm, User *usr, char *path, FULONG devid, char *userc, char *groupc, char *othersc );

// FSMProtect
//
// accgroups - string in format  userA:ARWED,userB:ARWED,userC:ARWED;groupA:ARWED,groupB:ARWED;other:ARWED

int FSManagerProtect( FSManager *fm, const char *path, FULONG devid, char *accgroups );

//
//
//

BufString *FSManagerAddPermissionsToDir( FSManager *fm, BufString *recv, FULONG devid, User *usr  );

#endif // __SYSTEM_FSYS_FSMANAGER_H__
