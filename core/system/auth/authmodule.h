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


#ifndef __SYSTEM_AUTH_AUTHMODULE_H__
#define __SYSTEM_AUTH_AUTHMODULE_H__

#include "core/types.h"
#include "util/hashmap.h"
#include "network/socket.h"
#include "network/http.h"
#include <system/user/user.h>
#include <system/user/user_session.h>
#include <system/application/application.h>

//
// 60 seconds
// 60 minutes
// 24 hours
// = 86400
//

//#define LOGOUT_TIME         86400	// one day
#define LOGOUT_TIME         3600 // one hour

//
// Auth module
//

typedef struct AuthMod
{
	MinNode						node;		// list of modules
	char								*am_Name;   // logini module name
	FULONG						am_Version; // version information
	void								*am_Handle;

	void								*sb;
	int								(*libInit)( struct AuthMod *l , void * );
	void								(*libClose)( struct AuthMod *l );
	FULONG							(*GetVersion)(void);
	FULONG							(*GetRevision)(void);

	// check if user exist in database, by name
	FBOOL							(*UserExistByName)( struct AuthMod *l, Http *r, const char *name );
	// authenticate user, if user is authenticated to login, it returns User structure
	UserSession					*(*Authenticate)( struct AuthMod *l, Http *r, struct UserSession *loguser, const char *name, const char *pass, const char *devname, const char *sessionId, FULONG *blockTime );
	// check password
	FBOOL 							(*CheckPassword)( struct AuthMod *l, Http *r, User *usr, char *pass, FULONG *blockTime );
	// update password
	int 								(*UpdatePassword)( struct AuthMod *l, Http *r, User *usr, char *pass );
	// logout user
	void								(*Logout)( struct AuthMod *l, Http *r, char *s );
	// check if user serssion is still valid, return filled user structure
	UserSession					*(*IsSessionValid)( struct AuthMod *l, Http *r, const char *sessionId );
	// get all users
	//User								*(*GetAllUsers)( struct AuthMod *l, Http *r );
	// set attribute
	void								(*SetAttribute)( struct AuthMod *l, Http *r, struct User *u, const char *param, void *val );
	// update user in database
	void								(*UserUpdate)( struct AuthMod *l, Http *r, User *usr );
	// test textual application user permission
	int 								(*UserAppPermission)( struct AuthMod *l, Http *r, int userId, int applicationId, const char *permission ); 
	
	//FBOOL 							(*UserIsAdmin)( struct AuthMod *l, Http *r, User *u );
	
	//FBOOL 							(*UserIsAdminByAuthID)( struct AuthMod *l, Http *r, char *auth );
	
	//char								*(*UserGetActiveSessionID)( struct AuthMod *l, Http *r, User *usr );
	
	// handle all webrequests
	Http								*(*WebRequest)( struct AuthMod *l, char **func, Http* request );
	
	void 								*SpecialData;
	int								am_BlockAccountTimeout;
	int								am_BlockAccountAttempts;
} AuthMod;

//
//
//

AuthMod *AuthModNew( void *sb, const char *path, const char* name, long version );

//
//
//

void AuthModDelete( AuthMod * logmod );

// 

#endif // __SYSTEM_AUTH_AUTHMODULE_H__
