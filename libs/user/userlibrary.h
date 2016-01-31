/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*

	Library

*/

#ifndef __USER_LIBRARY_H_
#define __USER_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <network/socket.h>
#include <network/http.h>
#include <stddef.h>
#include <mylibrary/mylibrary.h>
#include <system/user/user_group.h>
#include <system/user/user_application.h>
#include <system/user/user.h>
#include <system/json/json.h>
#include <system/application/application.h>
#include <application/applicationlibrary.h>

//
// 60 seconds
// 60 minutes
// 24 hours
// = 86400
//

#define LOGOUT_TIME 86400


//
//	library
//

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct UserLibrary
{
	char                            *l_Name;   // library name
	ULONG                           l_Version; // version information
	void                            *l_Handle;
	void									*sb;
	void                            *(*libInit)( void * );
	void                            (*libClose)( struct Library *l );
	ULONG                           (*GetVersion)(void);
	ULONG                           (*GetRevision)(void);

	// user.library structure
	// check if user exist in database, by name
	BOOL                            (*UserExistByName)( struct UserLibrary *l, const char *name );
	// authenticate user, if user is authenticated to login, it returns User structure
	User                            *(*Authenticate)( struct UserLibrary *l, struct User *loguser, const char *name, const char *pass, const char *sessionId );
	// check password
	BOOL 							(*CheckPassword)( struct UserLibrary *l, User *usr, char *pass );
	// logout user
	void                            (*Logout)( struct UserLibrary *l, const char *name );
	// check if user serssion is still valid, return filled user structure
	User                            *(*IsSessionValid)( struct UserLibrary *l, const char *sessionId );
	// get all users
	User                            *(*GetAllUsers)( struct UserLibrary *l );
	// create user in database
	int                             (*UserCreate)( struct UserLibrary *l, User *usr );
	// remove user structure
	void                            (*UserFree)( struct UserLibrary *l, User *u );
	// set user full name
	void                            (*SetFullName)( struct UserLibrary *l, struct User *u, const char *fname );
	// set user e-mail
	void                            (*SetEmail)( struct UserLibrary *l, struct User *u, const char *mail );
	// get user by session id
	void                            *(*UserGetBySession)( struct UserLibrary *l,  const char *sessionId );
	// get user by auth id
	void                            *(*UserGetByAuthID)( struct UserLibrary *l,   const char *authId );
	// get by user id
	User 						*(*UserGetByID)( struct UserLibrary *l, ULONG id );
	// get user by his name
	void                            *(*UserGet)( struct UserLibrary *l, const char *name );
	// update user in database
	void                            (*UserUpdateDb)( struct UserLibrary *l, User *usr );
	// delete user, 0 = ok
	int                             (*UserDelete)( struct UserLibrary *l, User *usr );
	
	// test textual application user permission
	int                             (*UserAppPermission)( struct UserLibrary *l, int userId, int applicationId, const char *permission ); 
	
	Application                     *(*GetApplicationFromDB)( struct UserLibrary *l, const char *where );
	
	// handle all webrequests
	Http                   *(*WebRequest)( struct UserLibrary *l, char **func, Http* request );

	//MYSQLLibrary                    *ul_sqlLib;
	UserGroup                       *globalGroups;	// all user groups

} UserLibrary;

// internal functions

void HashedString ( char **str );

// 

#endif	// __USER_LIBRARY_H_
