
/*
 * 
 * Thread for Linux
 * 
 * 
 */

#include "thread.h"
#include "types.h"

//
// create new thread
//

FThread *ThreadNew( void *func, void *data )
{
	FThread *nt = calloc( 1, sizeof( FThread ) );
	if( nt == NULL )
	{
		ERROR("Cannot allocate memory for Thread\n");
		return NULL;
	}
	int error = 0;

	if( nt != NULL )
	{
		nt->t_Function = func;
		nt->t_Data = data;
		
		DEBUG("ThreadNew create thread func ptr %x\n", func );

		if( ( error = pthread_create( &(nt->t_Thread), NULL, ( void * (*)(void *) )func, nt ) ) )
		{
			// WE ALWAYS PASS POINTER TO THREAD AND ALLOW DEVELOPER TO HANDLE  quit
		}
		
		DEBUG("ThreadNew error: %d\n", error );
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
