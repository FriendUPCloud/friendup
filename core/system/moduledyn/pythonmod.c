/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include "util/string.h"
#include "util/list.h"
#ifdef __LINUX__
#include <linux/limits.h>
#else
#ifndef ARG_MAX
#define ARG_MAX 20000
#endif
#endif
#include <system/systembase.h>

#define SUFFIX "py"
#define LBUFFER_SIZE 8192

//
// app structure
//

typedef struct App
{
	int appPid;
	
	int outfd[2];
	int infd[2];
	fd_set readfd, writefd;
	
	int quit;
	int appQuit;
}App;

//
//
//

int eApp( char *command )
{
	return 0;
}


//
// Run python module
//

struct dataWithLength
{
	void *data;
	int length;
};

struct linkedCharArray
{
	char *data;
	int length;
	void *next;
};

char *Run( struct EModule *mod, const char *path, const char *args, FULONG *length )
{
	DEBUG("[Pythonmod] call run\n");

	FULONG res = 0;

	// Escape the input, so that remove code injection is not possible.
	char *earg = StringShellEscape( args );
	unsigned int eargLen = strlen( earg );
	char *epath = StringShellEscape( path );
	unsigned int epathLen = strlen( epath );
	int escapedSize = eargLen + epathLen + 1024;

	int siz = eargLen + epathLen + 128;
	
	char *command = NULL;
	if( ( command = calloc( 1024 + strlen( path ) + ( args != NULL ? strlen( args ) : 0 ), sizeof( char ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for data\n");
		free( epath ); free( earg );
		return NULL;
	}

	DEBUG("[Pythonmod] Run\n");
	
	//
	// here there should be prepared command
	//

	sprintf( command, "python \"%s\" \"%s\";", path, args != NULL ? args : "" );
	
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php \"%s\" \"%s\";", epath, earg );
	if( !( cx >= 0 && cx < escapedSize ) )
	{
		FERROR( "[Pythonmod] snprintf\n" );
		free( command ); free( epath ); free( earg );
		return NULL;
	}
	
	DEBUG( "[Pythonmod] run app: '%s'\n", command );
	
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		FERROR("[Pythonmod] cannot open pipe\n");
		free( command ); free( epath ); free( earg );
		return NULL;
	}
	
	//char *buffer = NULL;
	char *temp = NULL;
	char *result = NULL;
	char *gptr = NULL;
	
	
	// List of chunks
	struct linkedCharArray *chr = calloc( 1, sizeof( struct linkedCharArray ) );
	struct linkedCharArray *lnk = chr;
	
	DEBUG("[PHPmod] command launched\n");
	int errors = 0;
	
	while( !feof( pipe ) )
	{
		// Make a new buffer and read
		lnk->data = calloc( LBUFFER_SIZE + 1, sizeof( char ) );
		if( !lnk->data )
		{
			lnk->next = NULL;
			errors++;
			break;
		}
		int reads = fread( lnk->data, sizeof( char ), LBUFFER_SIZE, pipe );
		if( reads > 0 )
		{
			lnk->length = reads;
			
			// This is how the total size is now
			res += reads;
		}
		struct linkedCharArray *l = calloc( 1, sizeof( struct linkedCharArray ) );
		lnk->next = ( void *)l;
		lnk = l;
	}
	 
	//DEBUG("[PHPmod] received bytes %d  : %100s\n", bs->bs_Size, bs->bs_Buffer );
	
	// Free buffer if it's there
	pclose( pipe );
	
	// Set the length
	if( length != NULL ) *length = res;
	
	// Put the new string together
	char *final = calloc( res + 1, sizeof( char ) );
	lnk = chr;
	int offset = 0;
	struct linkedCharArray *tmp = NULL;
	do
	{
		if( lnk->data && lnk->length )
		{
			memcpy( final + offset, lnk->data, lnk->length );
			offset += lnk->length;
			free( lnk->data ); 
		}
		tmp = lnk->next;
		free( lnk );
	}
	while( ( lnk = tmp ) != NULL );
	
	// Don't accept errors
	if( errors > 0 )
	{
		free( final ); free( command ); free( epath ); free( earg );
		return NULL;
	}
	DEBUG( "[Pythonmod] We are now complete..\n" );
	free( command ); free( epath ); free( earg );
	return final;
}

//
// Suffix information
//

const char *GetSuffix()
{
	return SUFFIX;
}




/*char *Runsw2( struct EModule *mod, const char *path, const char *args, int *length )
{

	DEBUG("[Python mod] mod run\n");

	FULONG res = 0;

	// Escape the input, so that remove code injection is not possible.
	char* earg = StringShellEscape( args );
	unsigned int eargLen = strlen( earg );
	char* epath = StringShellEscape( path );
	unsigned int epathLen = strlen( epath );
	int escapedSize = eargLen + epathLen + 1024;

	int siz = eargLen + epathLen+ 128;
	if( ( command = calloc( 1024 + strlen( path ) + ( args != NULL ? strlen( args ) : 0 ), sizeof( char ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for data\n");
		free( earg );
		free( epath );
		return NULL;
	}

	DEBUG("[Python mod] Run\n");
	
	//
	//
	// here there should be prepared command
	//
	//

	
	//DEBUG( "[Python mod] run with arglength: %d (max length is %d)\n", eargLen, (int)ARG_MAX );

//	sprintf( command, "php \"%s\" \"%s\";", epath, earg );
	sprintf( command, "php \"%s\" \"%s\";", path, args != NULL ? args : "" );
	
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php \"%s\" \"%s\";", epath, earg );
	if( !( cx >= 0 && cx < escapedSize ) )
	{
		FERROR( "[PHP mod] snprintf\n" );
		return NULL;
	}
	*/
	/*
	DEBUG( "[PHP mod] run app: '%s'\n", command );
	
	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		//free( command );
		FERROR("[PHP mod] cannot open pipe\n");
		return 0;
	}
*/
	/*
#define BUFFER_SIZE 8192
	char buffer[ BUFFER_SIZE ];
	char *temp = NULL;
	char *result = NULL;
	char *gptr = NULL;
	FULONG size = 0;
	
	DEBUG("[PHP mod] command launched\n");
*/

	/*
	 if( earg )
	{
		free( earg );
		earg = NULL;
	}*/
	
	/*if( epath )
	{
		free( epath );
		epath = NULL;
	}*//*
	
	//DEBUG( "[PHP mod] agruments memory free\n" );
	
	App *app = calloc( sizeof( App ), 1 );
	if( app == NULL )
	{
		printf("[PHPmod] Cannot allocate memory for app\n");
		return NULL;
	}
	
	DEBUG( "[PHPmod] memory for app allocated\n" );
	
	pipe( app->outfd ); // Where the parent is going to write to 
	pipe( app->infd ); // From where parent is going to read
	
	DEBUG( "[PHPmod] pipes created\n" );
	
	app->appQuit = 0;
	
	if( (app->appPid = fork()) < 0 )
	{	
		printf("Cannot FORK!\n");
	}
	else if( app->appPid == 0 )
	{
		//printf("[PHPmod] Child is working\n");
		
		close( STDOUT_FILENO );
		close( STDIN_FILENO );
		
		//printf("[PHPmod] IO closed\n");
		
		dup2( app->outfd[0], STDIN_FILENO );
		dup2( app->infd[1], STDOUT_FILENO );
		close( app->outfd[0]); // Not required for the child 
		close( app->outfd[1]);
		close( app->infd[0]);
		close( app->infd[1]);
		
		//printf("[PHPmod] Before opening command\n");
		
		system( command );
		
		//printf("[PHPmod] Application finished work\n");

		//app->appQuit = 1;
	}
	else
	{
		printf("[PHPmod] Host\n");
		
		//char input[ 100 ];
		struct timeval tv;
		
		//app->quit = 0;
		int ret = 0;
		
		close( app->outfd[0] ); // These are being used by the child 
		close( app->infd[1] );
		
		while( app->quit != 1 )
		{
			FD_ZERO( &(app->readfd) );
			FD_ZERO( &(app->writefd) );
			FD_SET( app->infd[0] , &(app->readfd) );
			FD_SET( app->outfd[1] , &(app->writefd) );
			
			tv.tv_sec = 0;
			tv.tv_usec = 1000000;

			ret = 0;

			ret = select( app->infd[0]+1, &(app->readfd), NULL, NULL, &tv );

			printf("[PHPmod] Thread: after select res: %d\n", ret );
			if(ret < 0)
			{
				printf("[PHPmod] ERROR select() failed \n");
			}
			//else if( ret == 0 )
			//{
			//	printf("[PHPmod] ERROR! timeout \n");
			//	break;
			//}
			else
			{
				if( FD_ISSET( app->infd[0] , &(app->readfd) ) )
				{
					FD_CLR( app->infd[0], &(app->readfd) );
					
					char buffer[ BUFFER_SIZE ];
					
//#define BUF_SIZE 1024
					
					char *gptr = NULL;

					if( ( size = read( app->infd[0], buffer, BUFFER_SIZE ) ) > 0 )
					//while( read( app->infd[0], buffer, BUFFER_SIZE ) > 0 )//( gptr = fgets( buffer, BUFFER_SIZE, pipe ) ) != NULL )
					{
						//size = strlen( buffer );
						DEBUG("[PHPmod] inside buffer  size %ld\n", size );

						// If our string ptr is null, allocate mem for it!
						if( result == NULL )
						{
							if( ( result = calloc( size + 1, sizeof( char ) ) ) != NULL )
							{
								// Copy buffer to result string
								memcpy( result, buffer, size );
								// Add to total size
								res += size;
							}
							else
							{
								DEBUG("[PHPmod] Cannot alloc mem result!\n");
							}
							DEBUG( "[PHPmod] Done reading buffer (now total size of %ld)\n", res );
						// Ah, it's already there, lets add to it!
						}
						else
						{
							DEBUG("[PHPmod] TEMP res size %ld %s\n", res, temp );
							// Make a temp string
							if( ( temp = calloc( res + 1, sizeof( char ) ) ) != NULL )
							{
								// Copy the existing data to the temp string
								memcpy( temp, result, res );
					
								// Free result for now!
								if( result != NULL )
								{
									free( result ); 
									result = NULL;
								}
					
								// Add room for the new string!
								if( ( result = calloc( res+size, sizeof(char) ) ) != NULL )
								{
									// Copy the temp string back over
									memcpy( result, temp, res );
									// Add the new parts
									memcpy( &(result[ res ]), buffer, size );
						
									// The new total size is:
									res += size;
								}

								// Free up the temp string
								free( temp );
								temp = NULL;
							}
							DEBUG("[PHPmod] else\n");
						}
						
						DEBUG("[PHPmod] read loop\n");
					}
					DEBUG("[PHPmod] read loop end\n");
		
					app->quit = 1;
					
				}	
			}
		}
		close( app->outfd[1] );
		close( app->infd[0] );
		printf("[PHPmod] Closing busniess\n");
	}
	
	printf("[PHPmod] Before free app ----readed %ld\n", res );
	*length = (int)res;
	
	free( app );

	return result;
}

*/
