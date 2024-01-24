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
 *  Module definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __MODULE_MODULE_H__
#define __MODULE_MODULE_H__

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <dirent.h>

#include <core/types.h>
#include <core/library.h>

#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>

#include <system/fsys/fsys.h>
#include <util/buffered_string.h>
#include <db/sqllib.h>
#include <application/applicationlibrary.h>

struct EModule;

typedef char *(*module_run_func_t)(struct EModule *em, const char *path, const char *args, FULONG *length);
typedef int (*module_stream_func_t)(struct EModule *em, const char *path, const char *args, Http *request, Http **httpResponse);

//
// Execute Module structure
//

typedef struct EModule
{
	struct MinNode					node;		// list of modules
	char							*em_Name;					// name of module
	char							*em_Path;					// full path to module
	void							*em_Handle;				// handle to dynamic object
	module_run_func_t				Run;
	module_stream_func_t			Stream;
	char							*(*GetSuffix)( );
	void							*em_SB;

}EModule;

//
// Execute Module create/delete functions
//

EModule *EModuleCreate( void *sb, const char *path, const char *name );

//
//
//

void EModuleDelete( EModule *mod );

#endif // __MODULE_MODULE_H__
