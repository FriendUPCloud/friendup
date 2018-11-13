/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
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
			
			char *t = ilib->ReadStringNCS( prop, "Database:test", "default" );
			int val = ilib->ReadIntNCS( prop, "Database:number", 223 );
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

