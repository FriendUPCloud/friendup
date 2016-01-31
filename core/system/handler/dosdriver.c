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
#include <user/userlibrary.h>

#include <system/handler/fsys.h>
#include <util/buffered_string.h>
#include <mysql/mysqllibrary.h>
#include <application/applicationlibrary.h>
#include <properties/propertieslibrary.h>
#include <system/systembase.h>
#include "dosdriver.h"

void DOSDriverDelete( DOSDriver *ddrive );

//
// DOSDrive create
//

DOSDriver *DOSDriverCreate( SystemBase *sl, const char *path, char *name )
{
	if( !sl || name == NULL || ( name != NULL && strlen( name ) < 4 ) )
	{
		ERROR("Cannot create DOSDriver\n");
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
			//ERROR("[ERROR]: Handler not found %s, cannot create DOSDriver!\n");
			sl->sl_Error = FSys_Error_NOFSAvaiable;
			DOSDriverDelete( ddrive );
			return NULL;
		}
	}
	
	return ddrive;
}

//
// delete DOSDriver
//


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
