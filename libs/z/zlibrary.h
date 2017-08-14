/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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
	void 		(*libClose)( struct Library *l );
	FULONG 		(*GetVersion)(void);
	FULONG 		(*GetRevision)(void);
	
	int                (*Pack)( struct ZLibrary *l, const char *name, const char *dir, int cutfilename, const char *pass, Http *request, int numberOfFiles );
	int                (*Unpack)( struct ZLibrary *l, const char *name, const char *dir, const char *pass, Http *request );
	
	Http              *(*ZWebRequest)( struct ZLibrary *l, char* func, Http* request );
} ZLibrary;

#endif	// __Z_LIBRARY_H_
