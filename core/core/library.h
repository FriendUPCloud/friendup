/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/

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
	FULONG       l_Version; // version information
	void*        handle;
	void *sb;			// pointer to systembase
	void*        (*libInit)( void *sb );
	void         (*libClose)( struct Library* l );
	long		(*GetVersion)( void );
	long		(*GetRevision)( void );
	Http 	*(*WebRequest)( struct Library *l, char* func, Http *request ); // Return HTTP code. 0 means Internal Server Error.
} Library;

//
//
//

void* LibraryOpen( void *sb, const char* name, long version );

//
//
//

void LibraryClose( void * library ); 

#define F_LIBRARY_PATH		"/var/www/lib/,/var/www/mcc/"

#endif // __CORE_LIBRARY_H_
