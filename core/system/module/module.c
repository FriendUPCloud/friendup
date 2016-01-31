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

#include <dlfcn.h>
#include <core/library.h>
#include "module.h"


//
//
//

EModule *EModuleCreate( const char *path, const char *name )
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

	if( ( mod = calloc( sizeof(EModule), 1 ) ) != NULL )
	{
		if( ( mod->Name = calloc( strlen( name )+1, sizeof(char) ) ) != NULL )
		{
			strcpy( mod->Name, name );
		}

		if( ( mod->Path = calloc( strlen( path )+1, sizeof(char) ) ) != NULL )
		{
			strcpy( mod->Path, path );
		}

		if( ( mod->handle = dlopen ( path, RTLD_NOW ) ) != NULL )
		{
			DEBUG("SYSTEMLIB EMODULECREATE, getting pointer to libs\n");
			mod->Run = dlsym( mod->handle, "Run");
			mod->GetSuffix = dlsym ( mod->handle, "GetSuffix");
		}
	}
	return mod;
}

//
// delete module
//


void EModuleDelete( EModule *mod )
{
	if( mod != NULL )
	{
		if( mod->Name )
		{
			free( mod->Name );
		}

		if( mod->Path )
		{
			free( mod->Path );
		}

		if( mod->handle )
		{
			dlclose ( mod->handle );
		}

		free( mod );
	}

}
