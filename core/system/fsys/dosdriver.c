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
 * DOSDriver body
 *
 * @author PS (Pawel Stefansky)
 * @date created PS 2015
 */

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
#include <system/auth/authmodule.h>

#include <system/fsys/fsys.h>
#include <util/buffered_string.h>
#include <db/sqllib.h>
#include <application/applicationlibrary.h>
#include <properties/propertieslibrary.h>
#include <system/systembase.h>
#include "dosdriver.h"

void DOSDriverDelete( DOSDriver *ddrive );

/**
 * Function reads DOSDriver file from filesystem and create C representation
 *
 * @param sl pointer to SystemBase
 * @param path path to file which represent DOSDriver
 * @param name name of DOSDriver
 * @return new DOSDriver structure when success, otherwise NULL
 */
DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name )
{
	if( !sl || name == NULL || ( name != NULL && strlen( name ) < 3 ) )
	{
		FERROR("Cannot create DOSDriver %s\n", name );
		return NULL;
	}
	
	DOSDriver *ddrive = NULL;
	char *type = "type";
	char *handler = "handler";
	
	DEBUG( "[DOSDriverCreate] Trying to create dos driver %s (path: %s)\n", name, path );
	
	if( ( ddrive = FCalloc( 1, sizeof( DOSDriver ) ) ) != NULL )
	{
		ddrive->dd_Name = StringDuplicateN( name, strlen( name ) );
		ddrive->dd_Type = NULL;
		
		struct PropertiesLibrary *plib = NULL;
		Props *prop = NULL;
	
		if( ( plib = (struct PropertiesLibrary *)LibraryOpen( sl, "properties.library", 0 ) ) != NULL )
		{
			char fileName[ 1024 ];
			sprintf( fileName, "%s/dosdriver.ini", path );
			
			prop = plib->Open( fileName );
			if( prop != NULL)
			{
				DEBUG("[SYSTEMLibrary] reading login\n");
				type = plib->ReadStringNCS( prop, "DOSDriver:type", "null" );
				handler = plib->ReadStringNCS( prop, "DOSDriver:handler", "null" );
				
				ddrive->dd_Type = StringDuplicateN( type, strlen( type ) );

				FHandler *efsys = sl->sl_Filesystems;
				while( efsys != NULL )
				{
					DEBUG("[DOSDriverCreate] handler %s Type  %s  fsprefix %s\n", handler, type, efsys->GetPrefix() );
		
					if( strcmp( handler, efsys->GetPrefix() ) == 0 )
					{
						ddrive->dd_Handler = efsys;
						break;
					}
					efsys = (FHandler *)efsys->node.mln_Succ;
				}

				plib->Close( prop );
			}
		
			DEBUG("[DOSDriverCreate] property.library close!\n");
			LibraryClose( (struct Library *)plib );
		}

		if( ddrive->dd_Handler == NULL )
		{
			FERROR("[ERROR]: Handler not found cannot create DOSDriver!\n");
			sl->sl_Error = FSys_Error_NOFSAvaiable;
			DOSDriverDelete( ddrive );
			return NULL;
		}
	}
	
	return ddrive;
}

/**
 * Function delete DOSDriver
 *
 * @param ddrive pointer to DOSDriver
 */
void DOSDriverDelete( DOSDriver *ddrive )
{
	if( ddrive != NULL )
	{
		if( ddrive->dd_Name != NULL )
		{
			FFree( ddrive->dd_Name );
		}
		
		if( ddrive->dd_Type != NULL )
		{
			FFree( ddrive->dd_Type );
		}
			
		FFree( ddrive );
	}
}
