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

/**
 * @file
 *
 * Body of  DOSDriver
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

#include <system/handler/fsys.h>
#include <util/buffered_string.h>
#include <mysql/mysqllibrary.h>
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
				type = plib->ReadString( prop, "DOSDriver:type", "null" );
				//DEBUG("[SYSTEMLibrary] user %s\n", login );
				handler = plib->ReadString( prop, "DOSDriver:handler", "null" );
				
				ddrive->dd_Type = StringDuplicateN( type, strlen( type ) );
				
				DEBUG("DDriver check fs\n");
				
				FHandler *efsys = sl->sl_Filesystems;
				while( efsys != NULL )
				{
					DEBUG("DOSDriverCreate handler %s Type  %s  fsprefix %s\n", handler, type, efsys->GetPrefix() );
		
					if( strcmp( handler, efsys->GetPrefix() ) == 0 )
					{
						ddrive->dd_Handler = efsys;
						INFO("Handler\n");
						break;
					}
					efsys = (FHandler *)efsys->node.mln_Succ;
				}
				DEBUG("DDriver check fs END\n");
				
				plib->Close( prop );
			}
		
			DEBUG("[SystemLibrary] property.library close!\n");
			LibraryClose( (struct Library *)plib );
		}
		
		//DEBUG("PROPERTIES LIBRARY OPENED, poitner to props %p!   %s  %s  %s  %s  %d\n", prop, login, pass, host, dbname, port );
	
		if( ddrive->dd_Handler == NULL )
		{
			//FERROR("[FERROR]: Handler not found %s, cannot create DOSDriver!\n");
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
