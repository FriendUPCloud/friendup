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

		if( ( fsys->handle = dlopen( path, RTLD_NOW|RTLD_GLOBAL ) ) != NULL )
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
			fsys->GetDiskInfo = dlsym( fsys->handle, "GetDiskInfo" );
			
			fsys->InfoGet = dlsym( fsys->handle, "InfoGet" );
			fsys->InfoSet = dlsym( fsys->handle, "InfoSet" );
			
			fsys->Dir = dlsym( fsys->handle, "Dir");
			fsys->GetChangeTimestamp = dlsym( fsys->handle, "GetChangeTimestamp" );
			
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
			dlclose( fsys->handle );
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

/**
 * Function delete Filesystem list structure
 *
 * @param fs pointer to Filesystem list structure which will be deleted
 */
void FilesystemDeleteAll( Filesystem *fs )
{
	while( fs != NULL )
	{
		Filesystem *rem = fs;
		
		fs = (Filesystem *)fs->node.mln_Succ;
		FilesystemDelete( rem );
	}
}
