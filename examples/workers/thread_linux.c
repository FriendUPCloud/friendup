/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#include <core/thread.h>
#include <log/log.h>
#include <pthread.h>

//
// create new thread
//

FThread *ThreadNew( void *func, void *data )
{
	if( !func || !data ) return NULL;
	
	FThread *nt = (FThread *)calloc( 1, sizeof( FThread ) );
	if( nt == NULL )
	{
		ERROR("[ThreadNew] Cannot allocate memory for Thread\n");
		return NULL;
	}
	int error = 0;

	if( nt != NULL )
	{
		nt->t_Function = func;
		nt->t_Data = data;
		
		//DEBUG("ThreadNew create thread func ptr %x\n", func );

		if( ( error = pthread_create( &(nt->t_Thread), NULL, func, nt ) ) == 0 )
		{
			// WE ALWAYS PASS POINTER TO THREAD AND ALLOW DEVELOPER TO HANDLE  quit
			//DEBUG("[ThreadNew] STARTED\n" );
		}
		else
		{
			free( nt );
			DEBUG("[ThreadNew] error: %d\n", error );
			return NULL;
		}
	}
	else
	{
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
	if( t->t_Thread )
	{
		t->t_Quit = TRUE;
		
		DEBUG("[ThreadDelete] Asking thread %p to quit.\n", t );
		
		pthread_join( t->t_Thread, NULL );
		
		DEBUG("[ThreadDelete] Thread finished work (%p)..\n", t );
		
		free( t );
	}
}

//#endif // __LINUX__
