#include <unistd.h>
#include <stdio.h>
#include <fcntl.h>
#include <netdb.h>
#include <unistd.h>
#include <sys/select.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/ioctl.h>

#include <pthread.h>

// always in a pipe[], pipe[0] is for read and 
//   pipe[1] is for write 
#define READ_FD  0
#define WRITE_FD 1
/*

typedef struct App
{
	int appPid;
	pthread_t	t_Thread;
	
	int pipes[2];
	fd_set readfd, writefd;
	
	int quit;
}App;

int ExecuteAppFunc( App *papp );


int command()
{
	//system( cmd );
	system( "ls -ltr" );
}

void ExecuteApp( App *papp, char *cmd )
{
	pipe( papp->pipes );
	
	//pthread_setspecific(stdout_key, out);
	//pthread_setspecific(stderr_key, err);
	pthread_create( &(papp->t_Thread), NULL, ( void * (*)(void *) ) &command, papp );//&ExecuteAppFunc, papp );
	
		struct timeval tv;
	
	dup2( papp->pipes[ READ_FD ], STDIN_FILENO );
    //dup2( papp->pipes[ WRITE_FD ], STDOUT_FILENO );
	
	while( papp->quit != 1 )
	{
		printf("Thread: loop\n");
		usleep( 10000 );
		
		tv.tv_sec = 0;
		tv.tv_usec = 500000;
		
		FD_ZERO( &(papp->readfd) );
		FD_ZERO( &(papp->writefd) );
		FD_SET( papp->pipes[ READ_FD ] , &(papp->readfd) );
		FD_SET( papp->pipes[ WRITE_FD ] , &(papp->writefd) );
		
		int ret = select( papp->pipes[0]+1, &(papp->readfd), &(papp->writefd), NULL, &tv );

		if(ret < 0)
		{
			printf("----------------select() failed \n");
		}
		else if( ret == 0 )
		{
			printf("----------------select() timeout quit %d\n", papp->quit );
		}
		else
		{
				if( FD_ISSET( papp->pipes[0] , &(papp->readfd) ) )
				{
					char input[ 100 ];
					int readsize = read( papp->pipes[0],input,100);
					input[ readsize ] = 0; // Read from child’s stdout 
					if( readsize > 0 )
					{
						printf("\n\neapp got message\n: '%s'", input );
					}
				}
				
				if( FD_ISSET( papp->pipes[1] , &(papp->readfd) ) )
				{
					//int readsize = read( app->infd[0],input,100);
					//input[ readsize ] = 0; // Read from child’s stdout 
					//if( readsize > 0 )
					{
						printf("command passed\n");
					}
				}
			}
	}
}


int ExecuteAppFunc( App *papp )
{

}

int main( int argc, char *argv )
{
	App app;
	app.quit = 0;
	printf("main: init\n");
	ExecuteApp( &app, "./testapp" );
	
	usleep( 500000 );
	printf("main: before quit\n");
	app.quit = 1;
	pthread_join( app.t_Thread, NULL );
	
	return 0;
}
*/


// since pipes are unidirectional, we need two pipes.
//   one for data to flow from parent's stdout to child's
//   stdin and the other for child's stdout to flow to
//   parent's stdin 


#define PARENT_WRITE_PIPE	0
#define PARENT_READ_PIPE	1
#define PARENT_MAX_PIPES	2

#define BUFSIZE 1024
 
typedef struct App
{
	int appPid;
	pthread_t	t_Thread;
	
	int pipes[2][2];
	int outfd[2];
	int infd[2];
	fd_set readfd, writefd;
	
	int quit;
	int appQuit;
}App;


void eApp( App *app, char *command )
{
	int counter = 0;
	
	pipe( app->outfd ); // Where the parent is going to write to 
	pipe( app->infd ); // From where parent is going to read
	app->appQuit = 0;
	
	if( (app->appPid = fork()) < 0 )
	{	
		printf("Cannot FORK!\n");
	}else if( app->appPid == 0 )
	{
		printf("Child is working\n");
		
		close( STDOUT_FILENO );
		close( STDIN_FILENO );
		dup2( app->outfd[0], STDIN_FILENO );
		dup2( app->infd[1], STDOUT_FILENO );
		close( app->outfd[0]); // Not required for the child 
		close( app->outfd[1]);
		close( app->infd[0]);
		close( app->infd[1]);
		
		//printf("Call command\n");
		
		system( command );
		/*if( execlp( command, command, NULL, (const char *)0) < 0) {
			app->appQuit = 1;
		}*/
		usleep( 1000000 );

		app->appQuit = 1;
	}
	else
	{
		printf("Host\n");
		
		char input[ BUFSIZE ];
		struct timeval tv;
		
		//app->quit = 0;
		int ret = 0;
		
		close( app->outfd[0] ); // These are being used by the child 
		close( app->infd[1] );
		
		while( app->quit != 1 )
		{
			FD_ZERO( &app->readfd );
			FD_ZERO( &app->writefd );
			FD_SET( app->infd[0] , &(app->readfd) );
			FD_SET( app->outfd[1] , &(app->writefd) );
			
			tv.tv_sec = 0;
			tv.tv_usec = 1000000;
			
			//printf("Thread: waiting for select  in %d  out %d\n", app->infd[0], app->outfd[1] );
			
			ret = 0;
			//ioctl( app->outfd[1], FIONREAD, &ret);	// react on write message to app
			//ioctl( app->infd[1], FIONREAD, &ret);	// read message from app
			
			ret = select( app->infd[0]+1, &(app->readfd), NULL, NULL, NULL );//&tv );
			//ret = select( app->infd[1]+1, &(app->readfd), &(app->writefd), NULL, &tv );
			printf("Thread: after select res: %d\n", ret );
			if(ret < 0)
			{
				printf("----------------select() failed \n");
			}
			else if( ret == 0 )
			{
				printf("----------------select() timeout quit %d\n", app->quit );
				//break;
				if( (counter % 10 ) == 0 )
				{
					char t[ 2 ] = { '1', 0 };
					write( app->outfd[1], t, 3 );
					printf("Wrote chars %s count %d\n", t, counter );
				}
				counter++;
				//
				usleep( 10000 );
			}
			else
			{
				//printf("getmsg\n");
				if( FD_ISSET( app->infd[0] , &(app->readfd) ) )
				{
					FD_CLR( app->infd[0], &(app->readfd) );
					
					int readsize = read( app->infd[0],input,BUFSIZE );
					input[ readsize ] = 0; // Read from child’s stdout 
					if( readsize > 0 )
					{
						printf(": '%s'\n", input );
					}
				}
				/*
				if( FD_ISSET( app->outfd[1] , &(app->readfd) ) )
				{
					//int readsize = read( app->infd[0],input,100);
					//input[ readsize ] = 0; // Read from child’s stdout 
					//if( readsize > 0 )
					{
						//printf("command passed\n");
					}
				}*/
			}
			printf("loop ret %d  appquit %d\n", ret, app->appQuit );
			//usleep( 100000 );
			//write( app->outfd[1],"2^32\n",5); // Write to child’s stdin 
			//input[ read( app->infd[0],input,100) ] = 0; // Read from child’s stdout 
			//printf("eapp: %s",input );
			
			if( app->appQuit == 1 )
			{
				printf("Application finished\n");
				break;
			}
			
		}
		close( app->outfd[1] );
		close( app->infd[0] );
		printf("Closing busniess\n");
	}
}


void main() 
{
    //App myapp;
	App *app = (App*)mmap( NULL, sizeof(App), PROT_READ|PROT_WRITE, MAP_ANON|MAP_SHARED, -1, 0 );
	char buf[ 100 ];
	char buffer[ 100 ];
	strcpy( buf, "top" );
	
	//ExecuteApplication( app, "./testapp" );
	//ExecuteApplication( app, "ls -ltr" );
	
	//system("./testapp" );
	//eApp( app, "./testapp" );
	//eApp( app, "ls" );
	eApp( app, "php \"modules/system/module.php\" \"sessionid=5b9c9814c9e185f85b6d55a126556be45bd967a9&module=system&args=false&command=mountlist&authkey=false\";" );

	//usleep( 10000000 );
	//app->quit = 1;
	//usleep( 200 );
	printf("main: End\n");
   
}








void ExecuteApplication( struct App *app, char *command )
{
	struct timeval tv;
	
	// pipes for parent to write and read
    pipe( app->pipes[ PARENT_READ_PIPE ] );
    pipe( app->pipes[ PARENT_WRITE_PIPE ] );
	
	printf("Execute Application\n");
     
    if( !( app->appPid = fork() ) ) 
	{
		printf("Child\n");
        char *argv[]={ command, 0 };
 
        dup2( app->pipes[ PARENT_WRITE_PIPE ][ READ_FD ], STDIN_FILENO );
        dup2( app->pipes[ PARENT_READ_PIPE ][ WRITE_FD ], STDOUT_FILENO );
 
        // Close fds not required by child. Also, we don't
        //   want the exec'ed program to know these existed 
        close( app->pipes[ PARENT_WRITE_PIPE ][ READ_FD ] );
        close( app->pipes[ PARENT_READ_PIPE ][ WRITE_FD ] );
        close( app->pipes[ PARENT_READ_PIPE ][ READ_FD ] );
        close( app->pipes[ PARENT_WRITE_PIPE ][ WRITE_FD ] );
		//printf("Before execution %s\n", command );
          
        execv(argv[0], argv);
    } else {
		printf("Main\n");
        char buffer[ 100 ];
        int count;
		int loopCount = 0;
 
        // close fds not required by parent 
        close( app->pipes[ PARENT_WRITE_PIPE][ READ_FD ] );
        close( app->pipes[ PARENT_READ_PIPE][ WRITE_FD ] );
 
		//printf("Write data\n");
        // Write to child’s stdin
		char lb[ 10 ];
		lb[ 0 ] = '0';
		lb[ 1 ] = 0;
        //write( app->pipes[PARENT_WRITE_PIPE][WRITE_FD], lb, 2 );
		
		while( app->quit != 1 )
		{
			//usleep( 10000 );
		
			FD_ZERO( &app->readfd );
			FD_SET( app->pipes[ 1 ][ READ_FD ] , &(app->readfd) );
			
			tv.tv_sec = 0;
			tv.tv_usec = 1000000;
			
			printf("before select\n");
			//printf("Thread: waiting for select  in %d  out %d\n", app->infd[0], app->outfd[1] );
			int ret = select( app->pipes[ 1 ][ READ_FD ]+1, &(app->readfd), NULL, NULL, &tv );
			if( ret < 0 )
			{
				printf("fail\n");
			}else if( ret == 0 )
			{
				printf("timeout\n");
			}else{
				if( FD_ISSET( app->pipes[ PARENT_READ_PIPE ][ READ_FD ] , &(app->readfd) ) )
				{
					
#define BUF_SIZE 100
					char input[ BUF_SIZE ];
					int readsize = read( app->infd[0],input,BUF_SIZE );
					input[ readsize ] = 0; // Read from child’s stdout 
					if( readsize > 0 )
					{
						printf(": '%s'\n", input );
					}
				}
			}
			
			loopCount++;
			if( loopCount > 100 ) break;
			printf("loop %d\n", loopCount );
		 
		//printf("Before read data\n");
  /*
        // Read from child’s stdout
        count = read( app->pipes[ PARENT_READ_PIPE ][ READ_FD ], buffer, sizeof(buffer)-1);
		printf("Data readed %d\n", count );
        if (count >= 0) {
            buffer[count] = 0;
            printf("buffer %s", buffer);
        } else {
            printf("IO Error\n");
        }*/
		}
    }
}
