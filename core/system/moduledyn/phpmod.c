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
#include <util/newpopen.h>

#define SUFFIX "php"
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
// Run php module
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

//
// Remove dangerous stuff from strings
//

char *FilterPHPVar( char *line )
{
	if( line == NULL )
	{
		return NULL;
	}
	
	int len = strlen( line ) + 1;
	int i = 0; for( ; i < len; i++ )
	{
		// Skip escaped characters
		if( i < len - 1 && line[ i ] == '\\' )
		{
			i++;
			continue;
		}
		// Kill unwanted stuff
		if( line[ i ] == '`' || line[ i ] == '\'' )
		{
			line[ i ] = ' ';
		}
		else if( line[ i ] == '"' || line[ i ] == '\n' || line[ i ] == '\r' )
		{
			line[ i ] = ' '; // Eradicate!
		}
	}
	return line;
}

#define USE_NPOPEN
#define USE_NPOPEN_POLL

/**
 * @brief Run a PHP module with arguments
 *
 */
char *Run( struct EModule *mod, const char *path, const char *args, FULONG *length )
{
	DEBUG("[PHPmod] call run\n");
	if( path == NULL || args == NULL )
	{
		DEBUG("[PHPmod] path or args = NULL\n");
		return NULL;
	}

	FULONG res = 0;

	// Escape the input, so that remove code injection is not possible.
	char *earg = StringShellEscape( args );
	unsigned int eargLen = strlen( earg );
	char *epath = StringShellEscape( path );
	unsigned int epathLen = strlen( epath );
	int escapedSize = eargLen + epathLen + 1024;

	//int siz = eargLen + epathLen + 128;
	
	char *command = NULL;
	if( ( command = FCalloc( 1024 + strlen( path ) + ( args != NULL ? strlen( args ) : 0 ), sizeof( char ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for data\n");
		FFree( epath ); FFree( earg );
		return NULL;
	}

	DEBUG("[PHPmod] Run\n");
	
	//
	// here there should be prepared command
	//
	
	// Remove dangerous crap!
	FilterPHPVar( earg );
	FilterPHPVar( epath );

	sprintf( command, "php '%s' '%s'", path, args != NULL ? args : "" );
	DEBUG("First command: %s\n", command );
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php '%s' '%s'", epath, earg );
	DEBUG("Second command: %s\n", command );
	if( !( cx >= 0 && cx < escapedSize ) )
	{
		FERROR( "[PHPmod] snprintf\n" );
		FFree( command ); FFree( epath ); FFree( earg );
		return NULL;
	}
	
	DEBUG( "[PHPmod] run app: %s\n", command );
	
#define PHP_READ_SIZE 65536
	
	char *buf = FMalloc( PHP_READ_SIZE+16 );
	
	ListString *ls = ListStringNew();
	
#ifdef USE_NPOPEN
#ifdef USE_NPOPEN_POLL
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPmod] cannot open pipe: %s\n", strerror( errno ) );
		//ListStringDelete( ls );
		FFree( buf );
		return NULL;
	}
	
	DEBUG("[PHPmod] command launched\n");

	int size = 0;
	int errCounter = 0;

	struct pollfd fds[2];

	// watch stdin for input 
	fds[0].fd = pofd.np_FD[ NPOPEN_CONSOLE ];// STDIN_FILENO;
	fds[0].events = POLLIN;

	// watch stdout for ability to write
	fds[1].fd = STDOUT_FILENO;
	fds[1].events = POLLOUT;

	while( TRUE )
	{
		DEBUG("[PHPmod] in loop\n");
		
		int ret = poll( fds, 2, MOD_TIMEOUT * 1000);

		if( ret == 0 )
		{
			DEBUG("Timeout!\n");
			break;
		}
		else if(  ret < 0 )
		{
			DEBUG("Error\n");
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE);

		DEBUG( "[PHPmod] Adding %d of data\n", size );
		if( size > 0 )
		{
			DEBUG( "[PHPmod] before adding to list\n");
			ListStringAdd( ls, buf, size );
			DEBUG( "[PHPmod] after adding to list\n");
			res += size;
		}
		else
		{
			errCounter++;
			DEBUG("ErrCounter: %d\n", errCounter );

			break;
		}
	}
	
	DEBUG("[PHPmod] File readed\n");
	
	// Free pipe if it's there
	newpclose( &pofd );
#else
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPmod] cannot open pipe: %s\n", strerror( errno ) );
		ListStringDelete( ls );
		FFree( buf );
		return NULL;
	}
	
	DEBUG("[PHPmod] command launched\n");

	//printf("<=<=<=<=%s\n", command );
	fd_set set;
	struct timeval timeout;
	int size = 0;
	int errCounter = 0;

	// Initialize the timeout data structure. 
	timeout.tv_sec = MOD_TIMEOUT;
	timeout.tv_usec = 0;
	
	while( TRUE )
	{
		// Initialize the file descriptor set.
		FD_ZERO( &set );
		if( pofd.np_FD[ NPOPEN_CONSOLE ] < 1 )
		{
			FERROR("Console output is < 0!\n");
			break;
		}
		FD_SET( pofd.np_FD[ NPOPEN_CONSOLE ], &set);
		DEBUG("[PHPmod] in loop\n");
		
		int ret = select( pofd.np_FD[ NPOPEN_CONSOLE ]+1, &set, NULL, NULL, &timeout );
		// Make a new buffer and read
		if( ret == 0 )
		{
			DEBUG("Timeout!\n");
			break;
		}
		else if(  ret < 0 )
		{
			DEBUG("Error\n");
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE);

		DEBUG( "[PHPmod] Adding %d of data\n", size );
		if( size > 0 )
		{
			DEBUG( "[PHPmod] before adding to list\n");
			ListStringAdd( ls, buf, size );
			DEBUG( "[PHPmod] after adding to list\n");
			res += size;
		}
		else
		{
			errCounter++;
			DEBUG("ErrCounter: %d\n", errCounter );
			if( errCounter > 1 )
			{
				break;
			}
		}
	}
	
	DEBUG("[PHPmod] File readed\n");
	
	// Free pipe if it's there
	newpclose( &pofd );

#endif
#else // USE_NPOPEN

	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		FERROR("[PHPmod] cannot open pipe\n");
		free( command ); free( epath ); free( earg );
		return NULL;
	}
	
	while( !feof( pipe ) )
	{
		int reads = fread( buf, sizeof( char ), PHP_READ_SIZE, pipe );
		if( reads > 0 )
		{
			//BufStringAddSize( bs, buf, reads );
			ListStringAdd( ls, buf, reads );
			res += reads;
		}
	}
	
	pclose( pipe );
#endif
	
	// Free buffer if it's there
	FFree( buf );
	
	// Set the length
	if( length != NULL )
	{
		*length = ( unsigned long int )res;
	}

	ListStringJoin( ls );
	
	char *final = ls->ls_Data;
	ls->ls_Data = NULL;
	ListStringDelete( ls );

	if( command != NULL )
	{
		FFree( command );
	}
	
	if( epath != NULL )
	{
		FFree( epath );
	}
	
	if( earg != NULL )
	{
		FFree( earg );
	}
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

	DEBUG("[PHP mod] mod run\n");

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

	DEBUG("[PHP mod] Run\n");
	
	//
	//
	// here there should be prepared command
	//
	//

	
	//DEBUG( "[PHP mod] run with arglength: %d (max length is %d)\n", eargLen, (int)ARG_MAX );

//	sprintf( command, "php \"%s\" \"%s\"", epath, earg );
	sprintf( command, "php \"%s\" \"%s\"", path, args != NULL ? args : "" );
	
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php \"%s\" \"%s\"", epath, earg );
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
				printf("[PHPmod] FERROR select() failed \n");
			}
			//else if( ret == 0 )
			//{
			//	printf("[PHPmod] FERROR! timeout \n");
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
