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
 *  Filesystem body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>

#include <core/types.h>
#include <core/library.h>
#include <core/friendcore_manager.h>

#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
#include <util/string.h>
#include <system/auth/authmodule.h>
#include "fsys.h"
#include <dlfcn.h>

/**
 * Function create FHandler handler
 *
 * @param path path to filesystem file on disk
 * @param name name which will represent filesystem handler
 * @return new FHandler structure when success, otherwise NULL
 */
FHandler *FHandlerCreate( const char *path, const char *name )
{
	FHandler *fsys = NULL;

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

	const char *suffix = &(name[ nameLen - 4 ]);

	DEBUG("FSYS create %s  suffix %s\n", path, suffix );

	if( strcmp( suffix, "fsys") != 0 )
	{
		DEBUG("FSYS create suffix %s\n", suffix );
		return NULL;
	}

	if( ( fsys = FCalloc( sizeof(FHandler), 1 ) ) != NULL )
	{
		if( ( fsys->Name = FCalloc( nameLen + 1, sizeof(char) ) ) != NULL )
		{
			memcpy( fsys->Name, name, nameLen );
		}
	
		int len = strlen( path );
		if( ( fsys->Path = FCalloc( len + 1, sizeof(char) ) ) != NULL )
		{
			memcpy( fsys->Path, path, len );
		}

		if( ( fsys->handle = dlopen ( path, RTLD_LAZY ) ) != NULL )
		{
			DEBUG("SYSTEMLIB FSYSCREATE, getting pointer to libs\n");
			
			fsys->GetSuffix = dlsym ( fsys->handle, "GetSuffix");
			fsys->GetPrefix = dlsym ( fsys->handle, "GetPrefix");
			
			//printf(" -------->%s\n", fsys->GetPrefix() );
			
			fsys->init = dlsym( fsys->handle, "init");
			fsys->deinit = dlsym( fsys->handle, "deinit");
			
			fsys->Mount = dlsym( fsys->handle, "Mount");
			fsys->UnMount = dlsym( fsys->handle, "UnMount");
			fsys->Release = dlsym( fsys->handle, "Release");
			
			fsys->FileOpen = dlsym( fsys->handle, "FileOpen");
			fsys->FileClose = dlsym( fsys->handle, "FileClose");
			fsys->FileRead = dlsym( fsys->handle, "FileRead");
			fsys->FileWrite = dlsym( fsys->handle, "FileWrite");
			fsys->FileSeek = dlsym( fsys->handle, "FileSeek");
			
			fsys->Info = dlsym( fsys->handle, "Info");
			fsys->Call = dlsym( fsys->handle, "Call");
			fsys->MakeDir = dlsym( fsys->handle, "MakeDir");
			fsys->Delete = dlsym( fsys->handle, "Delete");
			fsys->Rename = dlsym( fsys->handle, "Rename");
			fsys->Execute = dlsym( fsys->handle, "Execute");
			fsys->Copy = dlsym( fsys->handle, "Copy" );
			
			fsys->InfoGet = dlsym( fsys->handle, "InfoGet" );
			fsys->InfoSet = dlsym( fsys->handle, "InfoSet" );
			
			fsys->Dir = dlsym( fsys->handle, "Dir");
			
			fsys->init( fsys );
		}
		else
		{
			char* error = dlerror();
			
			FERROR("[ERROR]: Cannot open filesystem %s - error %s\n", path, error );
			if( fsys->Path ) FFree( fsys->Path );
			if( fsys->Name ) FFree( fsys->Name );
			FFree( fsys );
 			return NULL;
		}
	}
	return fsys;
}

/**
 * Function delete FHandler handler
 *
 * @param fsys pointer to FHandler structure which will be deleted
 */
void FHandlerDelete( FHandler *fsys )
{
	if( fsys != NULL )
	{
		DEBUG( "\t\t\t\tFSYS deinit %p", fsys->deinit );
		fsys->deinit( fsys );
		
		if( fsys->Name )
		{
			FFree( fsys->Name );
		}

		if( fsys->Path )
		{
			FFree( fsys->Path );
		}

		if( fsys->handle )
		{
			dlclose ( fsys->handle );
		}

		FFree( fsys );
	}
}

/**
 * Function delete Filesystem structure
 *
 * @param fs pointer to Filesystem structure which will be deleted
 */
void FilesystemDelete( Filesystem *fs )
{
	if( fs->fs_Name != NULL )
	{
		FFree( fs->fs_Name );
	}
	
	if( fs->fs_Type != NULL )
	{
		FFree( fs->fs_Type );
	}

	if( fs->fs_ShortDescription != NULL )
	{
		FFree( fs->fs_ShortDescription );
	}
	
	if( fs->fs_Server )
	{
		FFree( fs->fs_Server );
	}

	if( fs->fs_Path != NULL )
	{
		FFree( fs->fs_Path );
	}
	
	if( fs->fs_Username != NULL )
	{
		FFree( fs->fs_Username );
	}
	
	if( fs->fs_Password != NULL )
	{
		FFree( fs->fs_Password );
	}
}

