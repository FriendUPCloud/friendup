/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 * Application Library code
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#include <core/types.h>
#include <core/library.h>
#include "applicationlibrary.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <openssl/sha.h>
#include <interface/properties_interface.h>
#include <system/auth/authmodule.h>
#include <system/application/application.h>
#include <util/buffered_string.h>
#include <system/json/json_converter.h>

#define LIB_NAME "application.library"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//

void *libInit( void *sb )
{
	struct ApplicationLibrary *l;
	DEBUG("[Application.library] libinit\n");

	if( ( l = FCalloc( sizeof( struct ApplicationLibrary ), 1 ) ) == NULL )
	{
		return NULL;
	}


	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	//l->libInit//no need
	l->libClose = dlsym ( l->l_Handle, "libClose");
	l->GetVersion = dlsym ( l->l_Handle, "GetVersion");
	l->GetRevision = dlsym( l->l_Handle, "GetRevision");
	l->GetApplicationFromDB  = dlsym( l->l_Handle, "GetApplicationFromDB" );

	l->sb = sb;

	l->AppWebRequest = dlsym( l->l_Handle, "AppWebRequest" );

	l->al_sqllib = (struct SQLLibrary *)LibraryOpen( sb, "mysql.library", 0 );
	
	l->al_zlib = (struct ZLibrary *)LibraryOpen( sb, "z.library", 0 );
	
	//l->al_ApplicationList = GetApplicationFromDB( l, NULL );
	
	return l;
}

//
//
//

void libClose( struct ApplicationLibrary *l )
{
	DEBUG("[Application.library] Closing\n");
	
	Application *ar = l->al_ApplicationList;
	Application *an = ar;
	while( ar != NULL )
	{
		an = (Application *)an->node.mln_Succ;
	}
	
	if( l->al_zlib != NULL )
	{
		LibraryClose( (struct Library *)l->al_zlib );
	}
	
	if( l->al_sqllib != NULL )
	{
		LibraryClose( (struct Library *)l->al_sqllib );
	}
	
	DEBUG("[Application.library] close\n");
}

//
//
//

long GetVersion(void)
{
	return LIB_VERSION;
}

long GetRevision(void)
{
	return LIB_REVISION;
}


//
// application data free
//

void ApplicationFree( struct ApplicationLibrary *l, Application *app )
{
	
	/*
	if( user->u_Groups != NULL )
	{
		free( user->u_Groups );
	}
	
	if( user->u_Name != NULL )
	{
		free( user->u_Name ); user->u_Name = NULL;
	}

	if( user->u_Password != NULL )
	{
		free( user->u_Password ); user->u_Password = NULL;
	}
	
	if( user->u_SessionID )
	{
		free( user->u_SessionID ); user->u_SessionID = NULL;
	}
*/
	free( app );
}

//
//
//

int SetSQLConnection( struct ApplicationLibrary *l, SQLLibrary *lib )
{
	l->al_sqllib = lib;
	
	
	
	return 0;
}

//
// get applications from DB
//

Application *GetApplicationFromDB( struct ApplicationLibrary *l, const char *where )
{
	if( l->al_sqllib )
	{
		int num = 0;
		return l->al_sqllib->Load( l->al_sqllib, ApplicationDesc, (char *)where, &num );
	}
	return NULL;
}

//
// additional stuff
//

char* StringDuplicate( const char* str )
{
	if( str == NULL )
	{
		return NULL;
	}
	int size = strlen( str );
	
	char *tmp = FCallocAlign( size + 1, sizeof( char ) );
	if( tmp == NULL )
	{
		return NULL;
	}
	
	return strcpy( tmp, str );
}

//
//
//

char *MakeString ( int length )
{
	length++;
	char *c = FCallocAlign( length, sizeof ( char ) );
	if ( c != NULL )
	{
		memset( c, 0, length );
		//bzero ( ( void *)c, length );
		return c;
	}
	return NULL;
	//return calloc ( length + 1, sizeof ( char ) );
}
