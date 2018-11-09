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
 *  User Application header
 *
 * file contain all functitons related to user applications
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#ifndef __USER_APPLICATION_H__
#define __USER_APPLICATION_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>

//
// structure
//

typedef struct UserApplication
{
	FULONG					ua_ID;
	FULONG					ua_UserID;
	FULONG					ua_ApplicationID;
	char 					*ua_Permissions;     // <- in json format
	char 					*ua_AuthID; 
	MinNode					node;
} 
UserApplication;

static FULONG UserApplicationDesc[] = { 
    SQLT_TABNAME, (FULONG)"FUserApplication",       
    SQLT_STRUCTSIZE, sizeof( struct UserApplication ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserApplication, ua_ID ), 
	SQLT_INT,     (FULONG)"UserID", offsetof( struct UserApplication, ua_UserID ),
	SQLT_INT,     (FULONG)"ApplicationID", offsetof( struct UserApplication, ua_ApplicationID ),
	SQLT_STR,     (FULONG)"Permissions",       offsetof( struct UserApplication, ua_Permissions ),
	SQLT_STR,     (FULONG)"AuthID",       offsetof( struct UserApplication, ua_AuthID ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserApplication, node ),
	SQLT_END 
};

//
//
//

UserApplication *UserAppNew( FULONG id, FULONG appid, char *perm, char *authid );

//
//
//

void UserAppDelete( UserApplication *app );

//
//
//

void UserAppDeleteAll( UserApplication *ua );

#endif // __USER_APPLICATION_H__
