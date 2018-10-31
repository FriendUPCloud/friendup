/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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

// 

#endif	// __CONFIG_PROPERTIES_H_

