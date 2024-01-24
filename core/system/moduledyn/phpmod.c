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
#define PHP_READ_SIZE 4096
//#define PHP_READ_SIZE 65536

//
// app structure
//

typedef struct App
{
	int			appPid;
	
	int			outfd[2];
	int			infd[2];
	fd_set		readfd;
	fd_set		writefd;
	
	int			quit;
	int			appQuit;
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
	//DEBUG("First command: %s\n", command );
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php '%s' '%s'", epath, earg );
	//DEBUG("Second command: %s\n", command );
	if( !( cx >= 0 && cx < escapedSize ) )
	{
		FERROR( "[PHPmod] snprintf fail\n" );
		FFree( command ); FFree( epath ); FFree( earg );
		return NULL;
	}
	
	DEBUG( "[PHPmod] run app: %s\n", command );
	
	char *buf = FMalloc( PHP_READ_SIZE+16 );
	
	//ListString *ls = ListStringNew();
	BufString *bs = BufStringNew();
	if( bs == NULL )
	{
		FERROR( "[PHPmod] BufStringNew fail\n" );
		FFree( command ); FFree( epath ); FFree( earg ); FFree( buf );
		return NULL;
	}
	
#ifdef USE_NPOPEN
#ifdef USE_NPOPEN_POLL
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPmod] cannot open pipe: %s\n", strerror( errno ) );
		BufStringDelete( bs );
		FFree( buf );
		return NULL;
	}
	
	//DEBUG("[PHPmod] command launched\n");

	int size = 0;
	int errCounter = 0;

	struct pollfd fds[2];

	// watch stdin for input 
	fds[0].fd = pofd.np_FD[ NPOPEN_CONSOLE ];// STDIN_FILENO;
	fds[0].events = POLLIN;

	// watch stdout for ability to write
	fds[1].fd = STDOUT_FILENO;
	fds[1].events = POLLOUT;
	
	// Set to non block
	fcntl( fds[1].fd, F_SETFL, O_NONBLOCK );

	int ret = 0;

	int time = GetUnixTime();

	while( TRUE )
	{
		//DEBUG("[PHPmod] in loop\n");
		
		ret = poll( fds, 2, 250 ); // HT - set it to 250 ms..

		if( ret == 0 )
		{
			//DEBUG("Timeout!\n");
			break;
		}
		else if( ret < 0 )
		{
			//DEBUG("Error\n");
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE );

		//DEBUG( "[PHPmod] Adding %d of data\n", size );
		if( size > 0 )
		{
			//DEBUG( "[PHPmod] before adding to list\n");
			//ListStringAdd( ls, buf, size );
			BufStringAddSize( bs, buf, size );
			//DEBUG( "[PHPmod] after adding to list\n");
			res += size;
		}
		else
		{
			errCounter++;
			DEBUG("ErrCounter: %d\n", errCounter );

			break;
		}
	}
	
	DEBUG("[PHPmod] File read - took %d ms\n", GetUnixTime() - time );
	
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
		//DEBUG("[PHPmod] in loop\n");
		
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
	
	DEBUG("[PHPmod] File read\n");
	
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
	
	int reads = 0;
	while( !feof( pipe ) )
	{
		reads = fread( buf, sizeof( char ), PHP_READ_SIZE, pipe );
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

	//ListStringJoin( ls );
	
	//char *final = ls->ls_Data;
	//ls->ls_Data = NULL;
	//ListStringDelete( ls );
	char *final = bs->bs_Buffer;
	bs->bs_Buffer = NULL;
	BufStringDelete( bs );

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

int Stream( struct EModule *mod, const char *path, const char *args, Http *request, Http **httpResponse )
{
	DEBUG("[PHPstream] call stream\n");
	if( path == NULL || args == NULL )
	{
		DEBUG("[PHPstream] path or args = NULL\n");
		return 0;
	}

	if( !request->http_Socket )
	{
		DEBUG( "[PHPstream] No such socket!\n" );
		return 0;
	}

	int res = 0;

	// Escape the input, so that remove code injection is not possible.
	char *earg = StringShellEscape( args );
	unsigned int eargLen = strlen( earg );
	char *epath = StringShellEscape( path );
	unsigned int epathLen = strlen( epath );
	int escapedSize = eargLen + epathLen + 1024;

	char *command = NULL;
	if( ( command = FCalloc( 1024 + strlen( path ) + ( args != NULL ? strlen( args ) : 0 ), sizeof( char ) ) ) == NULL )
	{
		FERROR("Cannot allocate memory for data\n");
		FFree( epath ); FFree( earg );
		return 0;
	}

	DEBUG("[PHPstream] Stream\n");
	
	// Remove dangerous crap!
	FilterPHPVar( earg );
	FilterPHPVar( epath );

	sprintf( command, "php '%s' '%s'", path, args != NULL ? args : "" );
	
	// Make the commandline string with the safe, escaped arguments, and check for buffer overflows.
	int cx = snprintf( command, escapedSize, "php '%s' '%s'", epath, earg );
	
	if( !( cx >= 0 && cx < escapedSize ) )
	{
		FERROR( "[PHPstream] snprintf fail\n" );
		FFree( command ); FFree( epath ); FFree( earg );
		return 0;
	}
	
	DEBUG( "[PHPstream] run app: %s\n", command );
	
	char *buf = FMalloc( PHP_READ_SIZE+16 );
	
	Http *response = HttpNewSimpleA( HTTP_200_OK, request,  
		HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( "text/plain; charset=utf-8", 25 ),
		//HTTP_HEADER_CONTENT_TYPE, (FULONG)StringDuplicateN( "text/event-stream", 17 ),
		HTTP_HEADER_CONNECTION, (FULONG)StringDuplicateN( "close", 5 ),
		TAG_DONE, TAG_DONE );
	response->http_RequestSource = request->http_RequestSource;
	response->http_Stream = TRUE;
	response->http_Socket = request->http_Socket;
	response->http_ResponseID = request->http_ResponseID;
	
	*httpResponse = response;
	
	HttpWrite( response, request->http_Socket );
	
#ifdef USE_NPOPEN
#ifdef USE_NPOPEN_POLL
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPstream] cannot open pipe: %s\n", strerror( errno ) );
		FFree( buf );
		return 0;
	}
	
	int size = 0;
	int errCounter = 0;

	struct pollfd fds[2];

	// watch stdin for input 
	fds[0].fd = pofd.np_FD[ NPOPEN_CONSOLE ];// STDIN_FILENO;
	fds[0].events = POLLIN;

	// watch stdout for ability to write
	fds[1].fd = STDOUT_FILENO;
	fds[1].events = POLLOUT;
	
	// Set to non block
	fcntl( fds[1].fd, F_SETFL, O_NONBLOCK );

	int ret = 0;

	int time = GetUnixTime();
	
	while( TRUE )
	{
		ret = poll( fds, 2, 250 ); // HT - set it to 250 ms..

		if( ret == 0 )
		{
			break;
		}
		else if( ret < 0 )
		{
			break;
		}
		size = read( pofd.np_FD[ NPOPEN_CONSOLE ], buf, PHP_READ_SIZE );

		if( size > 0 )
		{
			response->http_Socket->s_Interface->SocketWrite( response->http_Socket, buf, size );
			
			res += size;
		}
		else
		{
			errCounter++;
			DEBUG("ErrCounter: %d\n", errCounter );

			break;
		}
	}
	
	DEBUG("[PHPstream] File read - took %d ms\n", GetUnixTime() - time );
	
	// Free pipe if it's there
	newpclose( &pofd );
	
#else
	NPOpenFD pofd;
	int err = newpopen( command, &pofd );
	if( err != 0 )
	{
		FERROR("[PHPstream] cannot open pipe: %s\n", strerror( errno ) );
		FFree( buf );
		return 0;
	}
	
	DEBUG("[PHPstream] command launched\n");

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

		DEBUG( "[PHPstream] Adding %d of data\n", size );
		if( size > 0 )
		{
			response->http_Socket->s_Interface->SocketWrite( response->http_Socket, buf, size );
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
	
	DEBUG("[PHPstream] File read\n");
	
	// Free pipe if it's there
	newpclose( &pofd );

#endif
#else // USE_NPOPEN

	FILE *pipe = popen( command, "r" );
	if( !pipe )
	{
		FERROR("[PHPstream] cannot open pipe\n");
		free( command ); free( epath ); free( earg );
		return 0;
	}
	
	int reads = 0;
	while( !feof( pipe ) )
	{
		reads = fread( buf, sizeof( char ), PHP_READ_SIZE, pipe );
		if( reads > 0 )
		{
			response->http_Socket->s_Interface->SocketWrite( response->http_Socket buf, size );
			res += reads;
		}
	}
	DEBUG( "[Streaming] Read: %s\n", buf );
	pclose( pipe );
#endif

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
	
	return res;
}

//
// Suffix information
//

const char *GetSuffix()
{
	return SUFFIX;
}

