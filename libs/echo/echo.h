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
 * This is a demo library that shows basic HTTP request handling.
 *
 * How to use: just point your browser to http://localhost:6502/echo.library/echo/123456
 * The library will response with the URL. If the last 'echo' is changed to something else
 * if will respond with a 404 message.
*/

#ifndef _ECHO_LIBRARY_H_
#define _ECHO_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <network/http.h>

typedef struct EchoLibrary
{
	char   *l_Name;    // library name
	FULONG  l_Version; // version information
	void   *handle;
	void   *sb;			// pointer to systembase
	void   *(*libInit)( void );
	void    (*libClose)( struct Library* l );
	long    (*GetVersion)(void);
	long    (*GetRevision)(void);
	Http   *(*WebRequest)( struct Library *l, char* func, Http *request ); // Return HTTP code. 0 means Internal Server Error.
} EchoLibrary_t;

_Static_assert(offsetof(EchoLibrary_t, WebRequest) == offsetof(Library, WebRequest), "Struct fields must match Library type from library.h");

#endif
