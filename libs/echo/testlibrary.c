/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

#include "userlibrary.h"
#include <core/library.h>
#include <stdio.h>

int main()
{
	struct UserLibrary *ulib;

	if( ( ulib = (struct UserLibrary *)LibraryOpen( "user.library", 0 ) ) != NULL )
	{

		printf("Library opened! version %f\n", ulib->GetVersion() );
		LibraryClose( (struct Library *)ulib );
	}

return 0;
}

