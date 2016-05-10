

#include "worker_manager.h"

typedef struct Data
{
    int number;
}Data;

//Data mainData[ 5000 ];

void test( void *d )
{
    //FThread *ft = (FThread *)d;
    Data *dat = (Data *)d;
    
    int tim = rand()%144;
    int i;
    INFO("test function %d : %d\n", tim, dat->number );
    
    for( i=0 ; i < tim ; i++ )
    {
        printf("task: %d  i %d tim %d\n" , dat->number, i, tim );
        usleep( 1000 );
    }
    INFO("task quit: %d\n", dat->number );
    
    free( dat );
}

//
//
//

int main( int argc, char **argv )
{
    srand( time( NULL ) );
    
	WorkerManager *wm;
    
    wm = WorkerManagerNew( 100 );
    if( wm != NULL )
    {
        int i;
        for( i = 0 ; i < 5000 ; i++ )
        {
            Data *d = calloc( 1, sizeof(Data));
            d->number = i;
            //mainData[ i ].number = i;
            printf("Launching task %d/%d\n", i, 100 );
            WorkerManagerRun( wm, test, d );
            //usleep( 100 );
            printf("Launching task %d/%d END\n", i, 100 );
           
        }
        printf("EXIT\n");
        //usleep( 100000000 );
        WorkerManagerDelete( wm );
    }

	return 0;
}

