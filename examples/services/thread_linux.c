
#include <stdio.h>
#include <core/thread.h>


//#ifdef __LINUX__


//
// create new thread
//

FThread *ThreadNew( void *func, void *data )
{
	FThread *nt = calloc( sizeof( FThread ), 1 );
	int error = 0;
	printf("Thread allocaed\n");

	if( nt != NULL )
	{
		nt->t_Function = func;
		nt->t_Data = data;
		printf("Thread data set\n");
		
		if( ( error = pthread_create( &(nt->t_Thread), NULL, ( void * (*)(void *) )func, nt ) ) )
		{
			// WE ALWAYS PASS POINTER TO THREAD AND ALLOW DEVELOPER TO HANDLE  quit
		}
	}
	else{
		return NULL;
	}
	return nt;
}

//
// example
//
/*
	void f( void *args )
	{
	struct FThread *ft = (FThread *)args;
	while( ft->quit != TRUE )
	{
		//...do something
	}

	}
*/


//
// remove thread
//

void ThreadDelete( FThread *t )
{
	if( t->t_Thread != 0 )
	{
		t->t_Quit = TRUE;
		// wait till end
		pthread_join( t->t_Thread, NULL );
	}
}

//#endif // __LINUX__
