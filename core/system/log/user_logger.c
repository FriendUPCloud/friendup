
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
/** @file
 *
 * UserLogger body
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <core/types.h>
#include <core/functions.h>
#include <util/log/log.h>
#include "user_logger.h"
#include <dlfcn.h>

/**
 * Create user function logger
 *
 * @param sb pointer to SystemBase
 * @param path path where data will be stored
 * @param name name of log entry (file name for example)
 * @return new UserLogger structure when success, otherwise NULL
 */
UserLogger *UserLoggerCreate( void *sb, const char *path, const char *name )
{
	UserLogger *ulogger = NULL;
	
	if( name == NULL )
	{
		FERROR("Name parameter is NULL!\n");
		return NULL;
	}
	
	int nameLen = strlen( name );
	if( nameLen < 4 )
	{
		FERROR("Name size < 4  '%s'\n", name );
		return NULL;
	}
	
	if( ( ulogger = FCalloc( sizeof( UserLogger ), 1 ) ) != NULL )
	{
		ulogger->ul_SB = sb;
		ulogger->Name = StringDuplicate( name );
		ulogger->Path = StringDuplicate( path );
		
		if( ( ulogger->handle = dlopen ( path, RTLD_NOW ) ) != NULL )
		{
			DEBUG("SYSTEMLIB FSYSCREATE, getting pointer to libs\n");
			
			ulogger->init = dlsym( ulogger->handle, "init");
			ulogger->deinit = dlsym( ulogger->handle, "deinit");
			
			ulogger->StoreInformation = dlsym( ulogger->handle, "StoreInformation");
		}
		else
		{
			char* error = dlerror();
			
			FERROR("[ERROR]: Cannot create logger %s - error %s\n", path, error );
			if( ulogger->Path ) FFree( ulogger->Path );
			if( ulogger->Name ) FFree( ulogger->Name );
			FFree( ulogger );
			return NULL;
		}
	}
	return ulogger;
}

/**
 * Delete UserLogger
 *
 * @param log UserLogger structure which will be deleted
 */
void UserLoggerDelete( UserLogger *log )
{
	if( log != NULL )
	{
		log->deinit( log );
		
		if( log->Name )
		{
			FFree( log->Name );
		}
		
		if( log->Path )
		{
			FFree( log->Path );
		}
		
		if( log->handle )
		{
			dlclose ( log->handle );
		}
		
		FFree( log );
	}
}
