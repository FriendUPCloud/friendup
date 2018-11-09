/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 * System/Command Body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <string.h>
#include <sys/wait.h>
#include <errno.h>
#include <string.h>
#include <util/log/log.h>
#include "command.h"

#define READ   0
#define WRITE  1

/**
 * Call system dos program
 *
 * @param command command line which will be executed by the system
 * @param type mode, read or write
 * @param pid pointer to place where PID will be stored
 * @return pointer to file descriptor
 */

FILE * CommandRun( char *command, char *type, int *pid )
{
	int child_pid;
	int fd[2];
	if (pipe(fd) != 0)
	{
		FERROR("pipe call failed");
		exit(5);
	}

	if( ( child_pid = fork() ) == -1 )
	{
		FERROR( "Fork error" );
		return NULL;
	}

	// child process 
	if( child_pid == 0 )
	{
		if( type[0] == 'r' )
		{
			close( fd[ READ ]  );    //Close the READ end of the pipe since the child's fd is write-only
			dup2( fd[ WRITE ], 1 ); //Redirect stdout to pipe
		}
		else
		{
			close( fd[ WRITE ] );    //Close the WRITE end of the pipe since the child's fd is read-only
			dup2( fd [ READ ], 0 );   //Redirect stdin to pipe
		}
		
		execl("/bin/sh", "/bin/sh", "-c", command, NULL);
		exit(0);
	}
	else
	{
		if( type[0] == 'r' )
		{
			close( fd[ WRITE ] ); //Close the WRITE end of the pipe since parent's fd is read-only
		}
		else
		{
			close( fd[ READ ] ); //Close the READ end of the pipe since parent's fd is write-only
		}
	}

	*pid = child_pid;

	if( type[0] == 'r' )
	{
		return  fdopen( fd[ READ ], "r" );
	}

	return fdopen( fd[ WRITE ], "w" );
}

/**
 * Close Command call 
 *
 * @param fp pointer to file descriptor
 * @param pid pid which will be used to check if program was closed
 * @return success (0) or fail value (-1)
 */
int CommandClose( FILE * fp, unsigned int pid )
{
	int stat = 0;

	fclose( fp );
	while( waitpid( pid, &stat, 0 ) == -1 )
	{
		if( errno != EINTR )
		{
			stat = -1;
			break;
		}
	}

	return stat;
}


/*

int main()
{
    int pid;
    char *command = "ping 8.8.8.8"; 
    FILE * fp = CommandRun(command, "r", pid);
    char command_out[1024] = {0};
    //stringstream output;

	int j = 0;
    //Using read() so that I have the option of using select() if I want non-blocking flow
    while (read(fileno(fp), command_out, sizeof(command_out)-1) != 0)
    {
        kill(pid, 9);
        memset(&command_out, 0, sizeof(command_out));
    }

    // unused
	char buffer[ 2048 ];
	memset( buffer, 0, 2048 );
	int i = 0;
	while( TRUE )
	{
		buffer[ i ] = (char) getc( fp );
		if( buffer[ i ] == '\n' )
		{
			break;
		}
		i++;
	}
	// unused
	
    //string token;
    //while (getline(output, token, '\n'))

    CommandClose(fp, pid);

    return 0;
	}

*/
