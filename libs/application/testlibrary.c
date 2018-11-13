/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

#include "applicationlibrary.h"
#include <core/library.h>
#include <stdio.h>

int main()
{
	struct ApplicationLibrary *ulib;

	if( ( ulib = (struct ApplicationLibrary *)LibraryOpen( "application.library", 0 ) ) != NULL )
	{
		//int error = ulib->UserCreate( ulib, "aajacek", "placek" );

		//printf("Library opened! version %f  error %d\n", ulib->GetVersion(), error );
		
		
		//User *u = ulib->Authenticate( ulib, "aajacek", "placek", NULL );
		
		//printf("After auth, error %d %p\n", u->u_Error, u->u_Name );
		
		//if( u )
		//{
		//	
		//}
		
		//LibraryClose( (struct Library *)ulib );
	}

	printf("Checking library end\n");

return 0;
}

