/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <util/string.h>
#include <util/list.h>
#include <network/path.h>


//
//
//

static inline void PathSplit( Path* p )
{
	char* path = p->p_Raw;
	char** pathArray = NULL;
	char* pathStart = path;
	p->p_Resolved = TRUE;
	
	if( pathStart == NULL )
	{
		FERROR("Cannot split path, pathstart = NULL\n");
		return;
	}
	
	//DEBUG("STRLENPATH %s\n", pathStart );
	unsigned int strLen = strlen( pathStart );
	unsigned int i = 0;
	int part = 0;
	
	if( *pathStart == '/' )
	{
		p->p_IsAbsolute = TRUE;
		p->p_Parts[ part++ ] = &(p->p_CopyRaw[ 1 ]);
	}
	else
	{
		p->p_Parts[ part++ ] = p->p_CopyRaw;
	}
	
	for( i=1 ; i < strLen ; i++ )
	{
		if( p->p_CopyRaw[ i ] == '/' )
		{
			p->p_Parts[ part++ ] = &(p->p_CopyRaw[ i+1 ]);
			p->p_CopyRaw[ i ]  = 0;
		}
	}
	p->p_Size = part;
}

//
//
//

Path* PathNew( const char* path )
{
	if( path == NULL )
	{
		FERROR("PathNew path = NULL!\n");
		return NULL;
	}
	
	Path* p = (Path*) calloc( 1, sizeof( Path ) );
	if( p == NULL )
	{
		FERROR("[PathNew] Cannot allocate memory for path\n");
		return NULL;
	}

	int len = strlen( path );
	if( len > 0 )
	{
		//DEBUG( "[PathNew] Here it is: %d\n", len );
		if( ( p->p_Raw = FCalloc( len + 10, sizeof( char ) ) ) != NULL )
		{
			memcpy( p->p_Raw, path, len );
		}
		if( ( p->p_CopyRaw = FCalloc( len + 10, sizeof( char ) ) ) != NULL )
		{
			memcpy( p->p_CopyRaw, path, len );
		}
		p->p_RawSize = len;
		PathSplit( p );

		// If we have a file segment
		if( path[ p->p_RawSize - 1 ] != '/' && p->p_Size >= 1 )
		{
			p->p_File = p->p_Parts[p->p_Size - 1];
			p->p_Extension = strrchr( p->p_File, '.' );
			if( p->p_Extension )
			{
				p->p_Extension++;
			}
		}
	}
	else
	{
		//DEBUG( "[PathNew] It is nothing.\n" );
		p->p_Raw = NULL;
		p->p_RawSize = 0;
		p->p_File = NULL;
		p->p_Extension = 0;
	}

	// Update the raw path (Double slashes, etc will be removed from the raw string);
	PathMake( p );

	return p;
}

//
// Combine two paths
//

Path* PathJoin( Path* path1, Path* path2 )
{
	unsigned int size = path1->p_RawSize + path2->p_RawSize + 1;
	char* newPath = FMalloc( (size + 10) );
	if( newPath == NULL )
	{
		FERROR("PathJoin, cannot allocate memory for newpath\n");
		return NULL;
	}
	memcpy( newPath, path1->p_Raw, path1->p_RawSize );
	if( path2->p_Raw[ 0 ] != '/' )
	{
		memcpy( newPath + path1->p_RawSize + 1, path2->p_Raw, path2->p_RawSize );
		newPath[ path1->p_RawSize ] = '/';
		newPath[size] = 0;
	}
	else
	{
		memcpy( newPath + path1->p_RawSize, path2->p_Raw, path2->p_RawSize );
		newPath[size-1] = 0;
	}

	Path* p = PathNew( newPath );
	FFree( newPath );
	return p;
}

void PathResolve( Path* p )
{
	if( p->p_Resolved || !p->p_Size )
	{
		return;
	}

	// First segment is ../; We're not even going to bother...
	if( strcmp( p->p_Parts[0], ".." ) == 0 )
	{
		return;
	}
	
	//char** newPaths = calloc( 1, sizeof(char*) * p->size );
	int copyFrom = 0;
	int copyTo = 0;
	
	unsigned int i;
	for( i = 0; i < p->p_Size; i++ )
	{
		if( strcmp( p->p_Parts[ i ], ".." ) == 0 )
		{
			copyFrom++;
		}
		else
		{
			copyTo++;
			copyFrom++;
		}
		
		p->p_Parts[ copyTo ] = p->p_Parts[ copyFrom ];
	}

	p->p_Size = copyTo;

	// Were we able to resolve the path in its entierty?
	if( copyTo )
	{
		p->p_Resolved = TRUE;
	}

	// Update the raw path
	PathMake( p );
}


//
//
//

void PathMake( Path* path )
{
	// Free the previous path, if any
	if( path->p_Raw != NULL )
	{
		FFree( path->p_Raw );
		path->p_Raw = NULL;
	}

	// Count the path length
	unsigned int length = path->p_IsAbsolute ? 1 : 0; // Absolute paths starts with /
	for( unsigned int i = 0; i < path->p_Size; i++ )
	{
		length += strlen( path->p_Parts[ i ] );
	}

	length += path->p_Size - 1;     // All the /'s inbetween segments
	length += path->p_File ? 0 : 1; // Trailing / for directories

	if( ( path->p_Raw = FCalloc( (length + 1), sizeof( char ) ) ) != NULL )
	{
		path->p_Raw[length] = '\0';
	}
	else
	{
		return;
	}
	path->p_RawSize = length;
	
	// Create the path string
	char* raw = path->p_Raw;

	if( path->p_IsAbsolute )
	{
		*(raw++) = '/';
	}

	for( unsigned int i = 0; i < path->p_Size; i++ )
	{
		unsigned int len = strlen( path->p_Parts[i] );
		memcpy( raw, path->p_Parts[i], len );
		raw += len;
		if( i < path->p_Size - 1 )
		{
			*(raw++) = '/';
		}
	}

	// Don't create // if path is just / (has to be longer than 1 char)
	if( path->p_File == NULL && length > 1 )
	{
		(*raw) = '/';
	}
}

//
//
//

int PathCheckExtension( Path* path, const char* ext )
{
	if( path->p_Extension == NULL )
	{
		return -1;
	}
	return strcmp( path->p_Extension, ext );
}

//
//
//

void PathFree( Path* path )
{
	if( path != NULL )
	{
		if( path->p_Raw )
		{
			FFree( path->p_Raw );
		}
	
		if( path->p_CopyRaw )
		{
			FFree( path->p_CopyRaw );
		}
		path->p_CopyRaw = NULL;

		FFree( path );
	}
}

/*
	Path* path = PathNew( "/hello/how/../world" );
	PathResolve( path );
	printf("%s\n", path->raw);
	PathFree( path );

	path = PathNew( "very/important/info/../../segfault/much/nope/../wow" );
	PathResolve( path );
	printf("%s\n", path->raw);
	PathFree( path );

	path = PathNew( "///we/can/maybe/segfault/../../../..///..//nope//////" );
	PathResolve( path );
	printf("%s\n", path->raw);
	PathFree( path );
	return 0;
*/
