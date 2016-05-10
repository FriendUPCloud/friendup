

#include <stdio.h>


int main( int arc, char *argv )
{
	int a=1, b=9;
	char tmp[ 20 ];

	printf("TESTAPP: start, 10 end of the game\n");
	int option = 0;

	while( option != 9 )
	{
		option = 0;

		printf("TESTAPP: select option 1 put numbers, 2 mult, 3 div, 4 display res, 9 quit\n");

//start:
		//tmp[ 0 ] = getchar( );
		//tmp[ 1 ] = 0;
		//option = atoi( tmp );
		
		fflush( stdin );
		int ret = scanf( "%d", &option );
		//printf("ret %d\n", ret );
		//if( ret < 1 )
		//{
		//	goto start;
		//}

		printf( "TESTAPP: Option selected %d\n", option );

		switch( option )
		{
			case 1:
				printf("put a\n");
				scanf( "%d", &a );
				printf("put b\n");
				scanf( "%d", &b );
			break;

			case 2:
				printf("TESTAPP: Mul result %d\n", a*b );
			break;

			case 3:
				printf("TESTAPP: Div result %d\n", a/b );
			break;

			case 4:
				printf("TESTAPP: A is %d B is %d\n", a, b );
			break;
		}
	}
	printf("TESTAPP: program quit\n");

	return 0;
}


