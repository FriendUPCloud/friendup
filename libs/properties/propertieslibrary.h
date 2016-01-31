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

	Library

*/

#ifndef __PROPERTIES_LIBRARY_H_
#define __PROPERTIES_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include "iniparser.h"

//
// definition of property file
//

typedef struct Props
{
	dictionary             *p_Dict;
	FILE                   *p_File;
}Props;

//
//	library
//

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct PropertiesLibrary
{
	char                 *l_Name;	// library name
	ULONG                l_Version;		// version information
	void                 *l_Handle;
	void				  *sb; // system base
	void                 *(*libInit)( void * );
	void                 (*libClose)( struct Library *l );
	ULONG                (*GetVersion)(void);
	ULONG                (*GetRevision)(void);

	// properties.library structure
	// open property file
	Props                *(*Open)( const char *name );
	// close property file
	void                 (*Close)( Props *p );
	// get string from property file
	char                 *(*ReadString)( Props *p, char *name, char *def );
	// read integer from property file
	int                  (*ReadInt)( Props *p, const char *name, int def );
	// read double variable from property file
	double               (*ReadDouble)( Props *p, const char *name, double def );
	// read bool variable from property file
	int                  (*ReadBool)( Props *p, const char *name, int def );
	// get configuration directory
	const char           *(*GetConfigDirectory)( struct PropertiesLibrary *s );
	
	char                 pl_LibsPath[ 1024 ];

} PropertiesLibrary;

// 

#endif	// __PROPERTIES_LIBRARY_H_

