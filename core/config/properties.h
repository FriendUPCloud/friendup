/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*

	Properties

*/

#ifndef __CONFIG_PROPERTIES_H_
#define __CONFIG_PROPERTIES_H_

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

int PropertiesCheck( );

// properties.library structure
// open property file
Props                *PropertiesOpen( const char *name );
// close property file
void                 PropertiesClose( Props *p );
// get string from property file
char                 *ReadString( Props *p, char *name, char *def );
//
char				*ReadStringNCS( Props *p, char *name, char *def );
//
char				*ReadStringNCSUpper( Props *p, char *name, char *def );
// read integer from property file
int                  ReadInt( Props *p, const char *name, int def );
//
int                  ReadIntNCS( Props *p, const char *name, int def );
// read double variable from property file
double               ReadDouble( Props *p, const char *name, double def );
// read bool variable from property file
int                  ReadBool( Props *p, const char *name, int def );
// get configuration directory
const char           *GetConfigDirectory( );
// get all keys and values in section. Return number of entries and keys + values in ptrs
int                  ReadGroupEntries( Props *p, const char *name, char ***keys, char ***values );
// 

#endif	// __CONFIG_PROPERTIES_H_

