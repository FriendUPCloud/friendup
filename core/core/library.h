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

#ifndef __CORE_LIBRARY_H_
#define __CORE_LIBRARY_H_

#include "core/types.h"
#include "util/hashmap.h"
#include "network/socket.h"
#include "network/http.h"
//#include "system/systembase.h"

//
// library
//

typedef struct Library
{
	char*        l_Name;    // library name
	ULONG       l_Version; // version information
	void*        handle;
	void *sb;			// pointer to systembase
	void*        (*libInit)( void *sb );
	void         (*libClose)( struct Library* l );
	long		(*GetVersion)( void );
	long		(*GetRevision)( void );
	unsigned int (*WebRequest)( struct Library *l, char* func, Http* request ); // Return HTTP code. 0 means Internal Server Error.
} Library;


//

void* LibraryOpen( void *sb, const char* name, long version );

void LibraryClose( void * library );

// 

#define F_LIBRARY_PATH		"/var/www/lib/,/var/www/mcc/"

#endif // __CORE_LIBRARY_H_
