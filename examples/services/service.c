

/*
 * 
 * Service
 * 
 * Service is a long run process which will run native program in loop
 */

#include <core/types.h>
#include "service.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <signal.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <sys/time.h>
#include <sys/types.h>

int mypclose(FILE *fp);
FILE * mypopen(const char *cmdstring, const char *type);

//
//
//

Service *ServiceNew( char *command, BOOL autostart )
{
	Service *service = NULL;
	
	if( ( service = calloc( 1, sizeof( Service ) )  ) != NULL )
	{
		printf("ServiceNew\n");
		int size = strlen( command );
		if( size > 0 )
		{
			if( ( service->s_Command = calloc( size+1, sizeof( char ) ) ) != NULL )
			{
				memcpy( service->s_Command, command, size*sizeof(char) );
			}
		}
		
		service->s_Buffer = calloc( SERVICE_BUFFER_MAX, sizeof(BYTE) );
		service->s_State = SERVICE_STOPPED;
		
		if( autostart )
		{
			printf("Starting thread\n");
			service->s_Thread = ThreadNew( ServiceThread, service );
			if( service->s_Thread == NULL )
			{
				ServiceDelete( service );
			}
		}
	}
	
	return service;
}

//
//
//

void ServiceDelete( Service *s )
{
	if( s )
	{
		if( s->s_Thread )
		{
			ThreadDelete( s->s_Thread );
		}
		
		if( s->s_Buffer )
		{
			free( s->s_Buffer );
			s->s_Buffer = NULL;
		}
		free( s );
	}
}

//
//
//

int ServiceStart( Service *s )
{
	if( !s->s_Thread )
	{
		s->s_Thread = ThreadNew( ServiceThread, s );
	}
	return 0;
}

//
//
//

int ServiceStop( Service *s )
{
	return 0;
}

//
//
//

int ServiceThread( FThread *ptr )
{
	Service *service = (Service *)ptr->t_Data;
	fd_set readfd, writefd;
	time_t startTime = time(NULL);
	struct timeval tv;
	
	printf("Thread: Service thread start\n");
	
	service->s_Pipe = (FILE *)popen( service->s_Command, "r" );
	
	if( service->s_Pipe )
	{
		int ret, ret2 = 0;
		printf("Thread: pipe opened\n");
		
		while( ptr->t_Quit != TRUE )
		{
			FD_ZERO( &readfd );
			FD_ZERO( &writefd );
			FD_SET( fileno( service->s_Pipe ) , &readfd);
			//FD_SET( fileno( service->s_Pipe ) , &writefd);

			// Select Timeout Hardcode with 1 secs 
			tv.tv_sec = 0;
			tv.tv_usec = SERVICE_TIMEOUT;
			
			printf("Thread: waiting for select\n");
			ret = select( fileno( service->s_Pipe )+1, &readfd, &writefd, NULL, &tv );
			printf("Thread: after select res: %d\n", ret );
			if(ret < 0)
			{
				printf("select() failed \n");
			}
			else if( ret == 0 )
			{
				printf("select() timeout\n");
				//break;
			}
			else
			{
				if( FD_ISSET(fileno( service->s_Pipe ), &readfd) )
				{
					if( fgets( service->s_Buffer, SERVICE_BUFFER_MAX, service->s_Pipe ) != NULL )
					{
						//cout << buf;
						//strBuf << buf;
					}
					/// No Problem if there is no data ouput by script 
					else
					{
						//ret2 = -1;
						printf("fgets() failed \n");
					}
				}
				else
				{
					ret2 = -1;
					printf("FD_ISSET() failed \n");
				}
				
				if( FD_ISSET(fileno( service->s_Pipe ), &writefd) )
				{
					printf("WAITING for input!\n");
				}
			}
		}
		pclose( service->s_Pipe );
		
	}else{
		return 1;
	}
	return 0;
}






/*
FILE * pPipe = popen(script.c_str(), "r");
if (pPipe == NULL)
{
//        cout << "popen() failed:"<< strerror(errno) << endl;
    return -1;
}

while(1)
{
    

    
        //cout << "Data is available now" <<endl;
        
    }

    // Check the Script-timeout 
    if((startTime + scriptTmOut) < time(NULL))
    {
    //    cout<<"Script Timeout"<<endl;
        break ;
    }
}

*/

/*


FILE * mypopen(const char *cmdstring, const char *type){
    int     i;
    int     pfd[2];
    pid_t   pid;
    FILE    *fp;

    // only allow "r" "e" or "w" 
    if ((type[0] != 'r' && type[0] != 'w' && type[0] != 'e') || type[1] != 0) {
        //errno = EINVAL;     // required by POSIX 
        return(NULL);
    }

    if (childpid == NULL) {     // first time through 
        // allocate zeroed out array for child pids 
        maxfd = 256;
        if ((childpid = calloc(maxfd, sizeof(pid_t))) == NULL)
            return(NULL);
    }

    if (pipe(pfd) < 0)
        return(NULL);   // errno set by pipe() 

    if ((pid = fork()) < 0) {
        return(NULL);   // errno set by fork() 
    } else if (pid == 0) {                          // child 
        if (*type == 'e') {
            close(pfd[0]);
            if (pfd[1] != STDERR_FILENO) {
                dup2(pfd[1], STDERR_FILENO);
                close(pfd[1]);
            }
        } else if (*type == 'r') {
            close(pfd[0]);
            if (pfd[1] != STDOUT_FILENO) {
                dup2(pfd[1], STDOUT_FILENO);
                close(pfd[1]);
            }
        } else {
            close(pfd[1]);
            if (pfd[0] != STDIN_FILENO) {
                dup2(pfd[0], STDIN_FILENO);
                close(pfd[0]);
            }
        }

        // close all descriptors in childpid[] 
        for (i = 0; i < maxfd; i++)
            if (childpid[i] > 0)
                close(i);

        execl("/bin/sh", "sh", "-c", cmdstring, (char *)0);
        _exit(127);
    }

    // parent continues... 
    if (*type == 'e') {
        close(pfd[1]);
        if ((fp = fdopen(pfd[0], "r")) == NULL)
            return(NULL);
    } else if (*type == 'r') {
        close(pfd[1]);
        if ((fp = fdopen(pfd[0], type)) == NULL)
            return(NULL);

    } else {
        close(pfd[0]);
        if ((fp = fdopen(pfd[1], type)) == NULL)
            return(NULL);
    }

    childpid[fileno(fp)] = pid; // remember child pid for this fd 
    return(fp);
}

int mypclose(FILE *fp) {
    int     fd, stat;
    pid_t   pid;

    if (childpid == NULL) {
        errno = EINVAL;
        return(-1);     // popen() has never been called 
    }

    fd = fileno(fp);
    if ((pid = childpid[fd]) == 0) {
        errno = EINVAL;
        return(-1);     // fp wasn't opened by popen() 
    }

    childpid[fd] = 0;
    if (fclose(fp) == EOF)
        return(-1);

    while (waitpid(pid, &stat, 0) < 0)
        if (errno != EINTR)
            return(-1); // error other than EINTR from waitpid() 

    return(stat);   // return child's termination status 
}

*/


