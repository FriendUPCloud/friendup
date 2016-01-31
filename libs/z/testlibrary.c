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

#include "zlibrary.h"
#include <core/library.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

int main()
{
	struct ZLibrary *zlib;

	if( ( zlib = (struct ZLibrary *)LibraryOpen( "z.library", 0 ) ) != NULL )
	{
		mkdir("directory", 0700);
		mkdir("output", 0700);
		
		FILE *d = fopen( "directory/test", "wb");
		if( d != NULL )
		{
			int i=0;
			for( i=0 ; i < 900 ; i++ ) fputc( 'a', d );
			fclose( d );
		}
		
		zlib->PackToZIP( zlib, "archive.zip", "directory", NULL );
		
		zlib->UnpackZIP( zlib, "archive.zip", "output", NULL );
		
		//User *u = ulib->Authenticate( ulib, "aajacek", "placek", NULL );
		
		//printf("After auth, error %d %p\n", u->u_Error, u->u_Name );
		
		//if( u )
		//{
		//	ulib->UserFree( ulib, u );
		//}
		
		LibraryClose( (struct Library *)zlib );
	}

	printf("Checking library end\n");

return 0;
}

