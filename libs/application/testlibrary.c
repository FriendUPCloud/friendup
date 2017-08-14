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

