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

//
// test properties library
//

#include "propertieslibrary.h"
#include <core/library.h>
#include <stdio.h>

int main()
{
	struct PropertiesLibrary *plib;

	if( ( plib = (struct PropertiesLibrary *)LibraryOpen( "properties.library", 0 ) ) != NULL )
	{

		printf("<<<<<<<Library opened! version %ld\n", plib->GetVersion() );
		
		Props *prop = NULL;
		
		if( ( prop = plib->Open( "test.ini" ) ) != NULL )
		{
			printf("TEST.................\n");
			
			char *t = plib->ReadString( prop, "Database:test", "default" );
			int val = plib->ReadInt( prop, "Database:number", 223 );
			if( t )
			{
				printf("plib %s  %d\n", t, val );
			}
			
			plib->Close( prop );
		}
		
		LibraryClose( (struct Library *)plib );
	}

return 0;
}

