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
// test image library
//

#include "imagelibrary.h"
#include <core/library.h>
#include <stdio.h>

int main()
{
	struct ImageLibrary *ilib;

	if( ( ilib = (struct ImageLibrary *)LibraryOpen( "image.library", 0 ) ) != NULL )
	{

		printf("<<<<<<<Library opened! version %ld\n", ilib->GetVersion() );
		/*
		Image *img = NULL;
		
		if( ( img = ilib->ImageRead ( "test.ini" ) ) != NULL )
		{
			printf("TEST.................\n");
			
			char *t = ilib->ReadString( prop, "Database:test", "default" );
			int val = ilib->ReadInt( prop, "Database:number", 223 );
			if( t )
			{
				printf("plib %s  %d\n", t, val );
			}
			
			ilib->Close( prop );
		}*/
		
		LibraryClose( (struct Library *)ilib );
	}

return 0;
}

