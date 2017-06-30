/*©lpgl*************************************************************************
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


/*

	UserLibrary code

*/

#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>

#include "echo.h"

#define LIB_NAME "echo.library"
#define LIB_VERSION 0.1

void *libInit( void )
{
	struct EchoLibrary* l;

	if( ( l = calloc( sizeof( struct EchoLibrary ), 1 ) ) == NULL )
	{
		return NULL;
	}


	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	l->libClose = dlsym ( l->handle, "libClose");
	l->GetVersion = dlsym ( l->handle, "GetVersion");
	l->WebRequest = dlsym ( l->handle, "WebRequest");

	return l;
}

void libClose( struct EchoLibrary *l )
{
}

double 	GetVersion(void)
{
	return LIB_VERSION;
}

unsigned int WebRequest( char* func, Http_t* request, Socket_t* sock )
{
	if( strcmp( func, "echo" ) == 0 )
	{
		char* text = "*crickets*";
		if( request->uri->query )
		{
			HashmapElement_t* e = HashmapGet( request->uri->query, "text" );
			if( e )
			{
				printf("%s\n", e->data);
				text = e->data;
			}
		}

		Http_t* response = HttpNewSimple( 
			HTTP_200_OK, 4,
			"Content-Type", StringDuplicate( "text/plain" ),
			"Connection", StringDuplicate( "close" )
		);
		HttpAddTextContent( response, text );
		HttpWriteAndFree( response, sock );
		return 200;
	}
	else
	{
		Http404( sock );
		return 404;
	}

}
