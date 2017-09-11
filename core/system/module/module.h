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

//
// Execute Module structure
//

typedef struct EModule
{
	struct MinNode node;		// list of modules
	char *Name;					// name of module
	char *Path;					// full path to module
	void *handle;				// handle to dynamic object

	char         *(*Run)( struct EModule *em, const char *path, const char *args, FULONG *length );
	char         *(*GetSuffix)( );
	
	void          *em_SB;

}EModule;

//
// Execute Module create/delete functions
//

EModule *EModuleCreate( void *sb, const char *path, const char *name );

//
//
//

void EModuleDelete( EModule *mod );

/*
 * type = module;
handler = treeroot;
language = php;
version = 1;
 */

#endif // __MODULE_MODULE_H__
