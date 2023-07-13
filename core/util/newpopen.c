/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include "newpopen.h"
#include <core/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <signal.h>

static void handle_sigchld( int sig )
{
	int saved_errno = errno;
	DEBUG("PHP SIGCHLD handled!\n");
	while( waitpid( (pid_t)(-1), 0, WNOHANG) > 0 ){ DEBUG( "[newpopen] Yeah...\n" ); }
	errno = saved_errno;
}

/**
 * Create pipe stream
 *
 * @param cmd command to execute
 * @param po pointer to NPOpenFD structure
 * @return error number
 */

int newpopen(const char *cmd, NPOpenFD *po )
{
	int in[ 2 ], out[ 2 ];
	pid_t pid;
	int ret = 0;

	ret = pipe( in );
	if( ret < 0 )
	{
		FERROR("Cannot create pipe!\n");
		return ret;
	}
	
	ret = pipe( out );
	if( ret < 0 )
	{
		close( in[0] );
		close( in[1] );
		FERROR("Cannot create pipe out!\n");
		return ret;
	}
	
	fflush( NULL );
	
	pid = vfork();
	
	if( pid == 0 )
	{
		// PS: We're not using the err pipe - it's here for historical reasons
		
		close( in[ 1 ] );
		close( out[ 0 ] );
		//close( err[ 0 ] );
		dup2( in[ 0 ], 0 );
		dup2( out[ 1 ], 1 );
		//dup2( err[ 1 ], 2 );
		
		// Execute command
		struct sigaction sa;
		sa.sa_handler = &handle_sigchld;
		sigemptyset(&sa.sa_mask);
		sa.sa_flags = SA_RESTART; // | SA_NOCLDSTOP; (We may not need this flag)
		if( sigaction(SIGCHLD, &sa, 0) == -1 )
		{
			perror( 0 );
		}
		
		execl( "/bin/sh", "sh", "-c", cmd, NULL );
		perror( "Error with execl...\n" );
		_exit( 0 );
	}
	// Parent
	else if( pid > 0 )
	{
		close( in[ 0 ] );
		close( out[ 1 ] );
		
		po->np_FD[ 0 ] = in[ 1 ];
		po->np_FD[ 1 ] = out[ 0 ];
		po->np_FD[ 2 ] = -1;
		po->npo_PID = getpid();
		// Don't wait for child..
		signal(SIGCHLD, SIG_IGN);
		return ret;
	}
	else
	{
		FERROR("Fork failed: %d\n", ret );
		close( in[0] );
		close( in[1] );
		close( out[0] );
		close( out[1] );
		return ret;
	}

	return 0;
}

/**
 * Close pipes
 *
 * @param po pointer to NPOpenFD structure
 * @return close status
 */

int newpclose( NPOpenFD *po )
{
	int ret, status;
	
	DEBUG("[newpclose] start, %d\n", po->npo_PID);
	
	close( po->np_FD[ NPOPEN_INPUT ] );
	close( po->np_FD[ NPOPEN_CONSOLE ] );
	
	ret = waitpid( po->npo_PID, &status, WNOHANG );
	if( ret == 0 )
	{
		DEBUG("[newpclose] KILL! end ret = 0\n");
		return status;
	}
	DEBUG("[newpclose] end ret\n");
	return ret;
}
