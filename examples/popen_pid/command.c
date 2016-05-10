/*
 * 
 * System/Command
 * 
 * 
 */

#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
#include <signal.h>
#include <string.h>
#include <sys/wait.h>
#include <errno.h>
#include <string.h>
//#include <util/log/log.h>

#define ERROR printf

#define READ   0
#define WRITE  1

FILE * CommandRun( char *command, char *type, int *pid )
{
	pid_t child_pid;
	int fd[2];
	pipe(fd);

	if( ( child_pid = fork() ) == -1 )
	{
		ERROR("Fork error");
		return NULL;
	}

	// child process 
	if ( child_pid == 0 )
	{
		if (type == "r")
		{
			close( fd[ READ]  );    //Close the READ end of the pipe since the child's fd is write-only
			dup2( fd[ WRITE ], 1 ); //Redirect stdout to pipe
		}
		else
		{
			close( fd[ WRITE ] );    //Close the WRITE end of the pipe since the child's fd is read-only
			dup2( fd [READ ], 0 );   //Redirect stdin to pipe
		}
		
		execl("/bin/sh", "/bin/sh", "-c", command, NULL);
		exit(0);
	}
	else
	{
		if (type == "r")
		{
			close(fd[WRITE]); //Close the WRITE end of the pipe since parent's fd is read-only
		}
		else
		{
			close(fd[READ]); //Close the READ end of the pipe since parent's fd is write-only
		}
	}

	pid = child_pid;

	if (type == "r")
	{
		return fdopen( fd[ READ ], "r");
	}

	return fdopen( fd[ WRITE ], "w");
}

//
//
//

int CommandClose( FILE * fp, pid_t pid )
{
	int stat;

	fclose( fp );
	while (waitpid(pid, &stat, 0) == -1)
	{
		if (errno != EINTR)
		{
			stat = -1;
			break;
		}
	}

	return stat;
}



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
        printf( " %d: %s\n", j++, command_out );
        kill(pid, 9);
        memset(&command_out, 0, sizeof(command_out));
    }
/*
	char buffer[ 2048 ];
	memset( buffer, 0, 2048 );
	int i = 0;
	while( TRUE )
	{
		buffer[ i ] = (char) getc( fp );
		if( buffer[ i ] == '\n' )
		{
			printf("OUT: %s\n", buffer );
			break;
		}
		i++;
	}*/
	
    //string token;
    //while (getline(output, token, '\n'))
    //    printf("OUT: %s\n", token.c_str());

    CommandClose(fp, pid);

    return 0;
}

