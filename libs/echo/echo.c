/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
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
		HttpAddTextContent( response, request->http_Uri->uri_Path->raw );
		return response;
	}
	else
	{
		Http* response = HttpNewSimple(HTTP_404_NOT_FOUND, tags);
		HttpAddTextContent( response, "404 response text :)" );
		return response;
	}
}
