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
 *  Module body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <dlfcn.h>
#include <core/library.h>
#include "module.h"

/**
 * Load and create module
 *
 * @param path path to module on disk
 * @param name name which will be used to recognize module
 * @return new EModule structure when success, otherwise NULL
 */
EModule *EModuleCreate( void *sb, const char *path, const char *name )
{
	EModule *mod = NULL;
	char *suffix = NULL;

	if( name == NULL || strlen( name ) < 4 )
	{
		return NULL;
	}

	suffix =(char *) &(name[ strlen( name )-4 ]);

	DEBUG("Emodule create %s  suffix %s\n", path, suffix );

	if( strcmp( suffix, "emod") != 0 )
	{
		DEBUG("Emodule create suffix %s\n", suffix );
		return NULL;
	}

	if( ( mod = FCalloc( sizeof(EModule), 1 ) ) != NULL )
	{
		if( ( mod->em_Name = FCalloc( strlen( name )+1, sizeof(char) ) ) != NULL )
		{
			strcpy( mod->em_Name, name );
		}

		if( ( mod->em_Path = FCalloc( strlen( path )+1, sizeof(char) ) ) != NULL )
		{
			strcpy( mod->em_Path, path );
		}

		if( ( mod->em_Handle = dlopen( path, RTLD_NOW ) ) != NULL )
		{
			mod->Run = dlsym( mod->em_Handle, "Run");
			mod->Stream = dlsym( mod->em_Handle, "Stream");
			mod->GetSuffix = dlsym( mod->em_Handle, "GetSuffix");
		}
		
		mod->em_SB = sb;
	}
	return mod;
}

/**
 * Delete module
 *
 * @param mod pointer to EModule which will be deleted
 */
void EModuleDelete( EModule *mod )
{
	if( mod != NULL )
	{
		if( mod->em_Name )
		{
			FFree( mod->em_Name );
		}

		if( mod->em_Path )
		{
			FFree( mod->em_Path );
		}

		if( mod->em_Handle )
		{
			dlclose ( mod->em_Handle );
		}
		FFree( mod );
	}
}
