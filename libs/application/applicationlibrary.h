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

	Application Library

*/

#ifndef __APPLICATION_LIBRARY_H_
#define __APPLICATION_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/handler/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/application/application.h>
#include <z/zlibrary.h>

//
//	library
//

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct ApplicationLibrary
{
	char 		*l_Name;	// library name
	double 		l_Version;		// version information
	void 		*handle;
	void		*sb; // system base
	void 		*(*libInit)( void * );
	void 		(*libClose)( struct Library *l );
	long 		(*GetVersion)(void);
	long 		(*GetRevision)(void);
	
/*
	// user.library structure
	BOOL		(*UserExist)( struct ApplicationLibrary *l, const char *name );
	User 		*(*Authenticate)( struct ApplicationLibrary *l, const char *name, const char *pass, const char *sessionId );
	void 		(*Logout)( struct ApplicationLibrary *l, const char *name );
	User		*(*IsSessionValid)( struct ApplicationLibrary *l, const char *sessionId );
	int			(*UserCreate)( struct ApplicationLibrary *l, const char *name, const char *pass );
	void		(*UserFree)( struct ApplicationLibrary *l, User *u );
	void		(*SetFullName)( struct ApplicationLibrary *l, struct User *u, const char *fname );
	void		(*SetEmail)( struct ApplicationLibrary *l, struct User *u, const char *mail );
	void 		*(*UserGetBySession)( struct ApplicationLibrary *l,  const char *sessionId );
	void 		*(*UserGet)( struct ApplicationLibrary *l, const char *name );
	void		(*UserUpdateDb)( struct ApplicationLibrary *l, User *usr );*/
	
	Application					*(*GetApplicationFromDB)( struct ApplicationLibrary *l, const char *where );

	Http 				*(*AppWebRequest)( struct ApplicationLibrary *l, char **func, Http* request );

	Application 					*al_ApplicationList;
	MYSQLLibrary				*al_sqllib;
	ZLibrary						*al_zlib;

} ApplicationLibrary;

// internal functions

void HashedString ( char **str );

Application *GetApplicationFromDB( struct ApplicationLibrary *l, const char *where );

// 

#endif	// __APPLICATION_LIBRARY_H_
