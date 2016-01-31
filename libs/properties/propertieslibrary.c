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

/*

	PropertiesLibrary code

*/

#include <stdio.h>
#include <limits.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include "propertieslibrary.h"

#define LIB_NAME "properties.library"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//

void *libInit( void *sb )
{
	struct PropertiesLibrary *l = NULL;
	DEBUG("PROPERTY LIBRARY INIT\n");

	if( ( l = calloc( 1, sizeof( struct PropertiesLibrary ) ) ) == NULL )
		return NULL;

	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	l->libClose           = dlsym( l->l_Handle, "libClose");
	l->GetVersion         = dlsym( l->l_Handle, "GetVersion");
	l->GetRevision        = dlsym( l->l_Handle, "GetRevision");

	// user.library structure
	l->Open               = dlsym( l->l_Handle, "Open");
	l->Close              = dlsym( l->l_Handle, "Close");
	l->ReadString         = dlsym( l->l_Handle, "ReadString");
	l->ReadInt            = dlsym( l->l_Handle, "ReadInt");
	l->ReadDouble         = dlsym( l->l_Handle, "ReadDouble");
	l->ReadBool           = dlsym( l->l_Handle, "ReadBool" );
	l->GetConfigDirectory = dlsym( l->l_Handle, "GetConfigDirectory" );
	
	l->sb = sb;

	return ( void *)l;
}

//
//
//

void libClose( struct PropertiesLibrary *l )
{
	DEBUG("Properties library close\n");
}

//
//
//

ULONG GetVersion(void)
{
	return LIB_VERSION;
}

ULONG GetRevision(void)
{
	return LIB_REVISION;
}


//
//
//

char *realpath(const char *path, char *resolved_path);

const char *GetConfigDirectory( struct PropertiesLibrary *s )
{
	char *ptr = NULL;
	
	ptr = getenv("FRIEND_HOME");
	//ptr = realpath( "properties.library", s->pl_LibsPath );
	if( ptr )
	{
		strcat( s->pl_LibsPath, "cfg/" );
		return s->pl_LibsPath;
	}
	else
	{
		DEBUG("[ERROR]: Cannot find configuration path!\n");
	}
	
	return "";
}

//
//
//

Props *Open( const char *path )
{
	Props *prop = NULL;
	
	DEBUG("[PropertiesLibrary] openfile %s\n", path );

	if( ( prop = calloc( 1, sizeof( Props ) ) ) != NULL )
	{
		prop->p_Dict = iniparser_load( path );
		
		DEBUG("[PropertiesLibrary] dictionary pointer %p\n", prop->p_Dict );
		
		if( prop->p_Dict == NULL )
		{
			free( prop );
			return NULL;
		}
	}

	return prop;
}

//
//
//

void Close( Props *p )
{
	if( p != NULL )
	{
		if( p->p_Dict != NULL )
		{
			iniparser_freedict( p->p_Dict );
			p->p_Dict = NULL;
		}
		free( p );
	}
}

//
//
//

char *ReadString( Props *p, char *name, char *def )
{
	if( p != NULL )
	{
		return iniparser_getstring( p->p_Dict, name, def );
	}

	return NULL;
}

//
//
//

int ReadInt( Props *p, const char *name, int def )
{
	if( p != NULL )
	{
		return iniparser_getint( p->p_Dict, name, def );
	}

	return 0;
}

//
//
//

double ReadDouble( Props *p, const char *name, double def )
{
	if( p != NULL )
	{
		return iniparser_getdouble( p->p_Dict, name, def );
	}

	return 0;
}

//
//
//

int ReadBool( Props *p, const char *name, int def )
{
	if( p != NULL )
	{
		return iniparser_getboolean( p->p_Dict, name, def );
	}

	return 0;
}



