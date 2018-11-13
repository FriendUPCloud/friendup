/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Library management definitions
 *
 * @author PS (Pawel Stefansky)
 * @author HT (Hogne Tildstad)
 * @author JMN (John Michael Nilsen)
 * @date first pushed on 06/02/2015
 * 
 * \defgroup FriendCoreLibrary Friend Core Library Management
 * @{
 */

#ifndef __CORE_LIBRARY_H_
#define __CORE_LIBRARY_H_

#include "core/types.h"
#include "util/hashmap.h"
#include "network/socket.h"
#include "network/http.h"


//
// library
//

typedef struct Library
{
	char*			l_Name;    // library name
	FULONG			l_Version; // version information
	void			*handle;
	void			*sb;			// pointer to systembase
	void			*(*libInit)( void *sb );
	void			(*libClose)( struct Library* l );
	long			(*GetVersion)( void );
	long			(*GetRevision)( void );
	Http 			*(*WebRequest)( struct Library *l, char* func, Http *request ); // Return HTTP code. 0 means Internal Server Error.
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

/**@}*/
// End of FriendCoreLibrary Doxygen group
