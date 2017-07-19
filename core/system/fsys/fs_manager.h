/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
**©****************************************************************************/
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
