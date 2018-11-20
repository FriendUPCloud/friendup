/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

#include "zlibrary.h"
#include <core/library.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

int main()
{
	struct ZLibrary *zlib;

	if( ( zlib = (struct ZLibrary *)LibraryOpen( NULL, "z.library", 0 ) ) != NULL )
	{
		printf("1-----------------unpack fptr %p\n", zlib->Unpack );
		
		mkdir("directory", 0700);
		mkdir("output", 0700);
		
		FILE *d = fopen( "directory/test", "wb");
		if( d != NULL )
		{
			int i=0;
			for( i=0 ; i < 900 ; i++ ) fputc( 'a', d );
			fclose( d );
		}
		
		printf("-----------------pack fptr %p\n", zlib->Pack );
		zlib->Pack( zlib, "archive.zip", "directory", NULL );
		
		printf("-----------------unpack fptr %p\n", zlib->Unpack );
		zlib->Unpack( zlib, "archive.zip", "output", NULL );
	
		zlib->Unpack( zlib, "test1.zip", "output", NULL );
	
		LibraryClose( (struct Library *)zlib );
	}

	printf("Checking library end\n");

return 0;
}

