
#include <stdio.h>
#include "thread.h"


void *test( void * d )
{
	printf("Task\n");
}

int main( int argc, char **argv )
{
void *data;

FThread *ft = ThreadNew( test, data );

usleep( 100000000 );

ThreadDelete( ft );

return 0;
}


