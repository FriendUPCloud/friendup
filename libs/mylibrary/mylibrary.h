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

#ifndef _ECHO_LIBRARY_H_
#define _ECHO_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <network/socket.h>
#include <network/http.h>

typedef struct EchoLibrary
{
	char*        l_Name;    // library name
	double       l_Version; // version information
	void*        handle;
	void*        (*libInit)( void );
	void         (*libClose)( struct Library* l );
	long       (*GetVersion)(void);
	long 				(*GetRevision)(void);
	Http 		*(*WebRequest)( char* func, Http* request );

} EchoLibrary_t;

#endif
