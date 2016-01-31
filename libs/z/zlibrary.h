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

#ifndef __Z_LIBRARY_H_
#define __Z_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <util/hooks.h>
#include <util/list.h>
#include <network/socket.h>
#include <network/http.h>

//
//	library
//

typedef struct ZLibrary
{
	char 							*l_Name;	// library name
	double 							l_Version;		// version information
	void 								*handle;
	void 								*(*libInit)( );
	void 								(*libClose)( struct Library *l );
	long 								(*GetVersion)(void);
	long 								(*GetRevision)(void);
	
	int								(*UnpackZIP)( struct ZLibrary *l, const char *name, const char *dir, const char *pass );
	int 								(*PackToZIP)( struct ZLibrary *l, const char *name, const char *dir, const char *pass );

	Http 				*(*ZWebRequest)( struct ZLibrary *l, char* func, Http* request );
	
	void 								*sb;
} ZLibrary;

// 

int UnpackZip( const char *zipfilename, const char *dirname, const char *password );

int PackZip( const char *filename, const char *compresspath, const char *password );

#endif	// __Z_LIBRARY_H_
