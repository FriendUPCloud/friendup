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
#define LIB_VERSION 1

void *libInit( void )
{
	FERROR("************* library init");
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
	FERROR("************* library close");
}

long GetVersion(void)
{
	return LIB_VERSION;
}


Http* WebRequest (struct Library *l __attribute__((unused)), char* func, Http *request)
{
	FERROR("************* Func is <%s>", func);

	struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicate( "text/plain" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
	};

	if( strcmp( func, "echo" ) == 0 )
	{
		Http *response = HttpNewSimple(HTTP_200_OK, tags);
		HttpAddTextContent( response, request->uri->path->raw );
		return response;
	}
	else
	{
		Http* response = HttpNewSimple(HTTP_404_NOT_FOUND, tags);
		HttpAddTextContent( response, "404 response text :)" );
		return response;
	}
}
