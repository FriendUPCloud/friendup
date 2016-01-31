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

/*

	ZLibrary code

*/

#include <core/types.h>
#include <core/library.h>
#include "zlibrary.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include <network/http.h>
#include <openssl/sha.h>
#include <propertieslibrary.h>
#include <util/buffered_string.h>
#include <system/json/json_converter.h>


#define LIB_NAME "z.library"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//

void *libInit( void *sb )
{
	struct ZLibrary *l;
	printf("Z.library libinit\n");

	if( ( l = calloc( sizeof( struct ZLibrary ), 1 ) ) == NULL )
	{
		return NULL;
	}


	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	//l->libInit//no need
	l->libClose = dlsym ( l->handle, "libClose");
	l->GetVersion = dlsym ( l->handle, "GetVersion");
	l->GetRevision = dlsym( l->handle, "GetRevision");

	l->UnpackZIP = dlsym ( l->handle, "UnpackZIP");
	l->PackToZIP = dlsym ( l->handle, "PackToZIP");

	l->ZWebRequest = dlsym( l->handle, "ZWebRequest" );
	
	l->sb = sb;
	
	return l;
}

//
//
//

void libClose( struct ZLibrary *l )
{
	
	DEBUG("Z.library close\n");
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
//
//


int check_file_exists(const char* filename)
{
    FILE* ftestexist = fopen(filename,"rb");
    if (ftestexist == NULL)
        return 0;
    fclose(ftestexist);
    return 1;
}

//
//
//

int UnpackZIP( struct ZLibrary *l, const char *name, const char *dir, const char *pass )
{
	return UnpackZip( name, dir, pass );
}

//
//
//

int PackToZIP( struct ZLibrary *l, const char *name, const char *dir, const char *pass )
{
	return PackZip( name, dir, pass );
}

//
// network handler
//

unsigned int ZWebRequest( struct ZLibrary *l, char* func, Http* request, Socket* sock )
{
	unsigned int result = 0;
	/*
	DEBUG("APPLIBRARY WEBREQUEST %s\n", func );
	
	if( strcmp( func, "help" ) == 0 )
	{
		Http_t* response = HttpNewSimple( 
			HTTP_200_OK, 4,
			"Content-Type", StringDuplicate( "text/plain" ),
			"Connection", StringDuplicate( "close" )
		);
		
		HttpAddTextContent( response, \
			"list - return installed application list\n \
			register - register application in db \
			install - install application for user \
			remove - remove application \
			getPermissions - get permissions for application \
			" );			// out of memory/user not found
		
		HttpWriteAndFree( response, sock );
		result = 200;
	
		//
		// list of all applications avaiable on server
		//
		
	}else if( strcmp( func, "list" ) == 0 )
	{
		Http_t* response = HttpNewSimple( 
			HTTP_200_OK, 4,
			"Content-Type", StringDuplicate( "text/plain" ),
			"Connection", StringDuplicate( "close" )
		);
		*/
		
		/*
		}else if( strcmp( func, "install" ) == 0 )
		{
		}
		else
		{
			ERROR("ERROR: Cannot allocate memory for BufferString\n");
		}
		
		HttpWriteAndFree( response, sock );
		result = 200;
		*/
		
		/*
	}else if( strcmp( func, "list" ) == 0 )
	{
		Http_t* response = HttpNewSimple( 
			HTTP_200_OK, 4,
			"Content-Type", StringDuplicate( "text/plain" ),
			"Connection", StringDuplicate( "close" )
		);
		
	}
	else
	{
		Http404( sock );
		return 404;
	}*/
	return result;
}

//
// additional stuff
//

char* StringDuplicate( const char* str )
{
	DEBUG("SD str ptr %p\n", str );
	if( str == NULL )
	{
		return NULL;
	}
	int size = strlen( str );
	
	DEBUG("String duplacate %d\n", size );
	
	char *tmp = calloc( size + 1, sizeof( char ) );
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
	char *c = calloc ( length, sizeof ( char ) );
	if ( c != NULL )
	{
		memset( c, 0, length );
		//bzero ( ( void *)c, length );
		return c;
	}
	return NULL;
	//return calloc ( length + 1, sizeof ( char ) );
}

// Create HASH
// TODO: Use stronger key!
//

void HashedString ( char **str )
{
	/*
	printf ( "[HashedString] Hashing\n" );
	unsigned char temp[SHA_DIGEST_LENGTH];
	memset( temp, 0x0, SHA_DIGEST_LENGTH );
	
	char *buf = MakeString ( SHA_DIGEST_LENGTH * 2 );

	SHA1( ( unsigned char *)*str, strlen( *str ), temp);

	int i = 0;
	for ( ; i < SHA_DIGEST_LENGTH; i++ )
		sprintf( (char*)&(buf[i*2]), "%02x", temp[i] );

	if ( *str ) free ( *str );
	*str = buf;
	printf ( "[HashedString] Hashed\n" );
	*/
}



