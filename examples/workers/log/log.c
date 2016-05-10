/*
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

#include "log.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

FILE *fp;

//
// init log
//

int LogNew( char *fname )
{
	time_t t = time(NULL);
struct tm tm = *localtime(&t);
	
	return 0;
}

//
// release log
//

void LogDelete( )
{
	if( fp != NULL )
	{
		fclose( fp );
		fp = NULL;
	}
}
