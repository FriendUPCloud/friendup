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
	char* path = p->raw;
	char** pathArray = NULL;
	char* pathStart = path;
	p->resolved = TRUE;
	
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
		p->isAbsolute = TRUE;
		p->parts[ part++ ] = &(p->p_CopyRaw[ 1 ]);
	}
	else
	{
		p->parts[ part++ ] = p->p_CopyRaw;
	}
	
	for( i=1 ; i < strLen ; i++ )
	{
		if( p->p_CopyRaw[ i ] == '/' )
		{
			p->parts[ part++ ] = &(p->p_CopyRaw[ i+1 ]);
			p->p_CopyRaw[ i ]  = 0;
		}
	}
	p->size = part;
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
		p->raw = calloc( len + 10, sizeof( char ) );
		p->p_CopyRaw = calloc( len + 10, sizeof( char ) );
		memcpy( p->raw, path, len );
		memcpy( p->p_CopyRaw, path, len );
		p->rawSize = len;
		PathSplit( p );

		// If we have a file segment
		if( path[ p->rawSize - 1 ] != '/' && p->size >= 1 )
		{
			p->file = p->parts[p->size - 1];
			p->extension = strrchr( p->file, '.' );
			if( p->extension )
			{
				p->extension++;
			}
		}
	}
	else
	{
		//DEBUG( "[PathNew] It is nothing.\n" );
		p->raw = NULL;
		p->rawSize = 0;
		p->file = NULL;
		p->extension = 0;
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
	unsigned int size = path1->rawSize + path2->rawSize + 1;
	char* newPath = FMalloc( (size + 10) );
	if( newPath == NULL )
	{
		FERROR("PathJoin, cannot allocate memory for newpath\n");
		return NULL;
	}
	memcpy( newPath, path1->raw, path1->rawSize );
	if( path2->raw[ 0 ] != '/' )
	{
		memcpy( newPath + path1->rawSize + 1, path2->raw, path2->rawSize );
		newPath[path1->rawSize] = '/';
		newPath[size] = 0;
	}
	else
	{
		memcpy( newPath + path1->rawSize, path2->raw, path2->rawSize );
		newPath[size-1] = 0;
	}

	Path* p = PathNew( newPath );
	FFree( newPath );
	return p;
}

void PathResolve( Path* p )
{
	if( p->resolved || !p->size )
	{
		return;
	}

	// First segment is ../; We're not even going to bother...
	if( strcmp( p->parts[0], ".." ) == 0 )
	{
		return;
	}
	
	//char** newPaths = calloc( 1, sizeof(char*) * p->size );
	int copyFrom = 0;
	int copyTo = 0;
	
	unsigned int i;
	for( i = 0; i < p->size; i++ )
	{
		if( strcmp( p->parts[ i ], ".." ) == 0 )
		{
			copyFrom++;
		}
		else
		{
			copyTo++;
			copyFrom++;
		}
		
		p->parts[ copyTo ] = p->parts[ copyFrom ];
	}

	p->size = copyTo;

	// Were we able to resolve the path in its entierty?
	if( copyTo )
	{
		p->resolved = TRUE;
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
	if( path->raw )
	{
		free( path->raw );
		path->raw = NULL;
	}

	// Count the path length
	unsigned int length = path->isAbsolute ? 1 : 0; // Absolute paths starts with /
	for( unsigned int i = 0; i < path->size; i++ )
	{
		length += strlen( path->parts[ i ] );
	}

	length += path->size - 1;     // All the /'s inbetween segments
	length += path->file ? 0 : 1; // Trailing / for directories

	path->raw = FCalloc( length + 1, sizeof( char ) );
	path->rawSize = length;
	path->raw[length] = '\0';

	// Create the path string
	char* raw = path->raw;

	if( path->isAbsolute )
	{
		*(raw++) = '/';
	}

	for( unsigned int i = 0; i < path->size; i++ )
	{
		unsigned int len = strlen( path->parts[i] );
		memcpy( raw, path->parts[i], len );
		raw += len;
		if( i < path->size - 1 )
		{
			*(raw++) = '/';
		}
	}

	// Don't create // if path is just / (has to be longer than 1 char)
	if( !path->file && length > 1 )
	{
		*(raw) = '/';
	}
}

//
//
//

int PathCheckExtension( Path* path, const char* ext )
{
	if( !path->extension )
	{
		return -1;
	}
	return strcmp( path->extension, ext );
}

//
//
//

void PathFree( Path* path )
{
	if( path->raw )
	{
		free( path->raw );
	}
	path->raw = NULL;
	
	if( path->p_CopyRaw )
	{
		free( path->p_CopyRaw );
	}
	path->p_CopyRaw = NULL;

	free( path );
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
