/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*

	Application Library

*/

#ifndef __APPLICATION_LIBRARY_H_
#define __APPLICATION_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <db/sqllib.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
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
	char 		*l_Name;			// library name
	FULONG 		l_Version;			// version information
	void 		*l_Handle;
	void						*sb; // system base
	void *		(*libInit)( void *sb );
	void 		(*libClose)( struct Library *l );
	FULONG 		(*GetVersion)(void);
	FULONG 		(*GetRevision)(void);
	
/*
	// user.library structure
	FBOOL		(*UserExist)( struct ApplicationLibrary *l, const char *name );
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
	SQLLibrary						*al_sqllib;
	ZLibrary						*al_zlib;

} ApplicationLibrary;

// internal functions

//void HashedString ( char **str );

Application *GetApplicationFromDB( struct ApplicationLibrary *l, const char *where );

// 

#endif	// __APPLICATION_LIBRARY_H_
