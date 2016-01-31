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

#ifndef __MODULE_MODULE_H__
#define __MODULE_MODULE_H__

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>

#include <core/types.h>
#include <core/library.h>
//#include <core/friendcore_manager.h>

#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
#include <user/userlibrary.h>

#include <system/handler/fsys.h>
#include <util/buffered_string.h>
#include <mysql/mysqllibrary.h>
#include <application/applicationlibrary.h>

//
// Execute Module structure
//

typedef struct EModule
{
	struct MinNode node;		// list of modules
	char *Name;					// name of module
	char *Path;					// full path to module
	void *handle;				// handle to dynamic object

	char *		(*Run)( struct EModule *em, const char *path, const char *args, int *length );
	char *		(*GetSuffix)( );

}EModule;

//
// Execute Module create/delete functions
//

EModule *EModuleCreate( const char *path, const char *name );

void EModuleDelete( EModule *mod );

/*
 * type = module;
handler = treeroot;
language = php;
version = 1;
 */

#endif // __MODULE_MODULE_H__
