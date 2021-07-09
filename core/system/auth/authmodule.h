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
 *  AuthenticationModule header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created on 01/2017
 */

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
// Auth module
//

typedef struct AuthMod
{
	MinNode								node;		// list of modules
	char								*am_Name;   // logini module name
	FULONG								am_Version; // version information
	void								*am_Handle;

	void								*sb;
	int									(*libInit)( struct AuthMod *l , void * );
	void								(*libClose)( struct AuthMod *l );
	FULONG								(*GetVersion)(void);
	FULONG								(*GetRevision)(void);

	// check if user exist in database, by name
	FBOOL								(*UserExistByName)( struct AuthMod *l, Http *r, const char *name );
	// authenticate user, if user is authenticated to login, it returns User structure
	UserSession							*(*Authenticate)( struct AuthMod *l, Http *r, struct UserSession *loguser, char *name, char *pass, char *devname, char *sessionId, FULONG *blockTime );
	// check password
	FBOOL 								(*CheckPassword)( struct AuthMod *l, Http *r, User *usr, char *pass, FULONG *blockTime, char *devname );
	// update password
	int 								(*UpdatePassword)( struct AuthMod *l, Http *r, User *usr, char *pass );
	// logout user
	void								(*Logout)( struct AuthMod *l, Http *r, char *s );
	// check if user serssion is still valid, return filled user structure
	UserSession							*(*IsSessionValid)( struct AuthMod *l, Http *r, const char *sessionId );
	// set attribute
	void								(*SetAttribute)( struct AuthMod *l, Http *r, struct User *u, const char *param, void *val );
	// update user in database
	void								(*UserUpdate)( struct AuthMod *l, Http *r, User *usr );
	// test textual application user permission
	int 								(*UserAppPermission)( struct AuthMod *l, Http *r, int userId, int applicationId, const char *permission ); 

	void 								*SpecialData;
	int									am_BlockAccountTimeout;
	int									am_BlockAccountAttempts;
} AuthMod;

//
//
//

AuthMod *AuthModNew( void *sb, const char *path, const char* name, long version, AuthMod *defaultAuthMod );

//
//
//

void AuthModDelete( AuthMod * logmod );

// 

#endif // __SYSTEM_AUTH_AUTHMODULE_H__
