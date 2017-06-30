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


#ifndef __USER_APPLICATION_H__
#define __USER_APPLICATION_H__

#include <core/types.h>
#include <core/nodes.h>
//#include <mysql.h>
#include <mysql/mysqllibrary.h>

typedef struct UserApplication
{
	FULONG					ua_ID;
	FULONG               ua_UserID;
	FULONG               ua_ApplicationID;
	char *              ua_Permissions;     // <- in json format
	char *              ua_AuthID; 
	//void *              ua_Next;
	MinNode			node;
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

UserApplication *UserAppDeleteAll( UserApplication *ua );

#endif // __USER_APPLICATION_H__
