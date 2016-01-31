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
#include <user/userlibrary.h>
#include "fsys.h"
#include <dlfcn.h>

//
// Filesystems
//

FHandler *FHandlerCreate( const char *path, const char *name )
{
	FHandler *fsys = NULL;

	if( name == NULL )
	{
		ERROR("Name parameter is NULL!\n");
		return NULL;
	}
	
	int nameLen = strlen( name );
	if( nameLen < 4 )
	{
		ERROR("Name size < 4  '%s'\n", name );
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
			memcpy( fsys->Name, name, nameLen );
	
		int len = strlen( path );
		if( ( fsys->Path = FCalloc( len + 1, sizeof(char) ) ) != NULL )
			memcpy( fsys->Path, path, len );

		if( ( fsys->handle = dlopen ( path, RTLD_NOW ) ) != NULL )
		{
			DEBUG("SYSTEMLIB FSYSCREATE, getting pointer to libs\n");
			
			fsys->GetSuffix = dlsym ( fsys->handle, "GetSuffix");
			fsys->GetPrefix = dlsym ( fsys->handle, "GetPrefix");
			
			//printf(" -------->%s\n", fsys->GetPrefix() );
			
			fsys->init = dlsym( fsys->handle, "init");
			fsys->deinit = dlsym( fsys->handle, "deinit");
			
			fsys->Mount = dlsym( fsys->handle, "Mount");
			fsys->UnMount = dlsym( fsys->handle, "UnMount");
			
			fsys->FileOpen = dlsym( fsys->handle, "FileOpen");
			fsys->FileClose = dlsym( fsys->handle, "FileClose");
			fsys->FileRead = dlsym( fsys->handle, "FileRead");
			fsys->FileWrite = dlsym( fsys->handle, "FileWrite");
			fsys->FileSeek = dlsym( fsys->handle, "FileSeek");
			
			fsys->Info = dlsym( fsys->handle, "Info");
			fsys->MakeDir = dlsym( fsys->handle, "MakeDir");
			fsys->Delete = dlsym( fsys->handle, "Delete");
			fsys->Rename = dlsym( fsys->handle, "Rename");
			fsys->Execute = dlsym( fsys->handle, "Execute");
			fsys->Copy = dlsym( fsys->handle, "Copy" );
			
			fsys->Dir = dlsym( fsys->handle, "Dir");
			
			fsys->init( fsys );
		}
		else
		{
			char* error = dlerror();
			
			ERROR("[ERROR]: Cannot open filesystem %s - error %s\n", path, error );
			if( fsys->Path ) free( fsys->Path );
			if( fsys->Name ) free( fsys->Name );
			free( fsys );
 			return NULL;
		}
	}
	return fsys;
}

//
// delete fsys
//

void FHandlerDelete( FHandler *fsys )
{
	if( fsys != NULL )
	{
		fsys->deinit( fsys );
		
		if( fsys->Name )
		{
			free( fsys->Name );
		}

		if( fsys->Path )
		{
			free( fsys->Path );
		}

		if( fsys->handle )
		{
			dlclose ( fsys->handle );
		}

		free( fsys );
	}
}

//
// Free Filesystem structure
//

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
