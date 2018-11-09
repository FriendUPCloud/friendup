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

#ifndef __Z_LIBRARY_H_
#define __Z_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <util/hooks.h>
#include <util/list.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/user/user_session.h>

//
//	library
//

typedef struct ZLibrary
{
	char 		*l_Name;			// library name
	FULONG 		l_Version;			// version information
	void 		*l_Handle;
	void						*sb; // system base
	void *		(*libInit)( void *sb );
	void 		(*libClose)( struct ZLibrary *l ); //FIXME: should this be ZLibrary instead of Library?
	FULONG 		(*GetVersion)(void);
	FULONG 		(*GetRevision)(void);
	
	int                (*Pack)( struct ZLibrary *l, const char *name, const char *dir, int cutfilename, const char *pass, Http *request, int numberOfFiles );
	int                (*Unpack)( struct ZLibrary *l, const char *name, const char *dir, const char *pass, Http *request );
	
	Http              *(*ZWebRequest)( struct ZLibrary *l, char* func, Http* request );
} ZLibrary;

#endif	// __Z_LIBRARY_H_
