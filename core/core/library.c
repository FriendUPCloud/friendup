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

/**
 * @file
 *
 * Library opening and closing
 *
 * @author PS (Pawel Stefansky)
 * @author HT (Hogne Tildstad)
 * @author JMN (John Michael Nilsen)
 * @date first pushed on 06/02/2015
 */

#include <core/types.h>
#include "library.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <unistd.h>
#include <system/systembase.h>


/**
 * Opens a library
 *
 * @param sb pointer to a already opened Sysbase.library
 * @param name pointer to the name of the library to open
 * @param version version number of the library to choose
 * @return void pointer to the newly opened library
 * @return NULL if case of error (library name not found, version not found
 * 		or other errors)
 */
void *LibraryOpen( void *sb, const char *name, long version )
{
	if( !name )
	{
		FERROR("Cannot open library with empty name!\n");
		return NULL;
	}
	DEBUG("Lib open\n");
	
	if( !sb )
	{
		FERROR("Cannot open library with SysBase.library pointer! for %s\n", name );
		//return NULL;
	}
		
	FBOOL loaded = FALSE;
	char currentDirectory[ 255 ];
	char loadLibraryPath[ 512 ];
	memset( &currentDirectory, 0, 255 );
	memset( &loadLibraryPath, 0, 512 );

	// Open library
	if( name == NULL )
	{
		return NULL;
	}
	
	struct Library *library = NULL;
	void *handle = NULL;
	long ( *GetVersion )( void );
	long ( *GetRevision )( void );
	void * ( *libInit )( void * );

	// there is no need to multiply by sizeof(char)
	getcwd( currentDirectory, sizeof ( currentDirectory ) );
	//DEBUG( "[LibraryOpen] Current directory %s\n", currentDirectory );

	// we should check and get lib from current dirrectory first (compatybility)
	
	sprintf ( loadLibraryPath, "%s/%s", currentDirectory, name );
	DEBUG("[LibraryOpen] Open library %s\n", loadLibraryPath );

	if( ( handle = dlopen ( loadLibraryPath, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
	{
		GetVersion = dlsym( handle, "GetVersion");

		if( GetVersion != NULL )
		{
			DEBUG("[LibraryOpen] Version checking, found %ld req %ld\n", GetVersion(), version );
			
			if( GetVersion() >= version )
			{
				loaded = TRUE;
			}
			else
			{
				DEBUG( "[LibraryOpen] Version fail\n" );
			}
		}
		else
		{
			DEBUG( "[LibraryOpen] GetVersion fail\n" );
		}
	}
	else
	{
		//FERROR( "[LibraryOpen] Cannot open file\n" );
	}

	char* error = dlerror();
	
	//
	// checking library in libs/
	//

	if( loaded == FALSE )
	{
		// there is no need to multiply by sizeof(char)
		getcwd( currentDirectory, sizeof ( currentDirectory ) );

		// we should check and get lib from "current dirrectory"/libs/
	
		sprintf ( loadLibraryPath, "%s/libs/%s", currentDirectory, name );
		DEBUG( "[LibraryOpen] Open library %s\n", loadLibraryPath );

		if( ( handle = dlopen ( loadLibraryPath, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
		{
			GetVersion = dlsym( handle, "GetVersion" );

			if( GetVersion != NULL )
			{
				if( GetVersion() >= version )
				{
					loaded = TRUE;
				}
				else
				{
					DEBUG( "[LibraryOpen] Version fail\n" );
				}
			}
			else
			{
				DEBUG( "[LibraryOpen] GetVersion fail\n" );
			}
		}
		else
		{
			DEBUG( "[LibraryOpen] Cannot open file\n" );
		}

		char* error = dlerror();
		if( error )
		{
			FERROR( "[LibraryOpen] Library error: %s  DYNAMIC LINK ERROR\n", error );
		}
	}

	// somehow we couldn't load lib, we are trying to find it in root folder

	if( loaded == FALSE )
	{
		if( ( handle = dlopen( name, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
		{
			GetVersion = dlsym( handle, "GetVersion");

			if( GetVersion != NULL )
			{
				if( GetVersion() >= version )
				{
					loaded = TRUE;
				}
				else
				{
					DEBUG( "[LibraryOpen]: Cannot open library in version %ld, required version is %ld\n", version, GetVersion() );
					dlclose( handle );
					return NULL;
				}
			}
		}
		else
		{
			DEBUG ( "[LibraryOpen] Library was not possible to open: %s file %s\n", dlerror (), name );
			return NULL;
		}
	}

	if( loaded == FALSE )
	{
		DEBUG( "[LibraryOpen] Couldn't find or open library %s\n", name );
		return NULL;
	}
	DEBUG( "[LibraryOpen] Before lib init\n" );

	libInit = dlsym( handle, "libInit" );

	if( libInit == NULL )
	{
		DEBUG( "[LibraryOpen] libInit/libClose not found in library!\n" );
		return NULL;
	}
	DEBUG( "[LibraryOpen] Before init\n" );

	library = libInit( sb );
	
	if( library != NULL )
	{
		//library->sb = sb;
		
		DEBUG( "[LibraryOpen] After init\n" );

		library->handle = handle;
		library->GetVersion = GetVersion;
		library->GetRevision = dlsym( library->handle, "GetRevision" );
		library->libClose = dlsym( library->handle, "libClose" );
	
		DEBUG( "[LibraryOpen] Completed initialization...\n" );
	}
	else
	{
		DEBUG("[LibraryOpen] Error while init\n");
	}
	
	return library;
}

/**
 * Closes an opened library
 *
 * @param lib pointer to the library to close
 */
void LibraryClose( void *lib )
{
	if( lib == NULL ) return;
	
	struct Library *library = (struct Library *)lib;

	DEBUG( "[LibraryOpen] Closing library %p\n", library );

	library->libClose( (void *)library );

	if( library->handle != NULL )
	{
		dlclose( library->handle );
		library->handle = NULL;
	}
	FFree( library );
	DEBUG( "[LibraryOpen] Lib closed memory free\n" );
}

