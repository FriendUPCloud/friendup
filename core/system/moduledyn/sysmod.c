/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include <core/library.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <system/systembase.h>
#include <util/log/log.h>
#include <util/string.h>

#define SUFFIX "sys"
#define BUFFER_SIZE 1024

FILE *popen( const char *c, const char *v );
//void pclose( FILE *f );

char *Run( struct EModule *mod, const char *path, const char *args, FULONG *length )
{

	DEBUG("SYS mod run\n");

	FULONG res = 0;
	int siz = strlen( args ) + strlen( path ) + 128;
	char *command = (char *)MakeString( siz );
	char *temp = NULL;
	char *result = NULL;
    unsigned long size = 0;

	DEBUG( "Allocated %d bytes for command string\n", siz );

	//
	//
	// we are calling native application and read output from it
	//
	//

	sprintf( command, "%s %s", path, args );

    FILE* pipe = popen( command, "r");
    if( !pipe )
    {
    	free( command );
    	return 0;
    }

    char buffer[ BUFFER_SIZE ];
    
    while( !feof( pipe ) ) 
    {
        char *gptr;

    	if( ( gptr = fgets( buffer, BUFFER_SIZE, pipe ) ) != NULL )
    	{
            size = strlen( buffer );
            //DEBUG("inside buffer '%s' size %d\n", buffer, size );

    		if( result == NULL )
    		{
    			if( ( result = calloc( size+1, sizeof(char) ) ) != NULL ){
    				memcpy( result, buffer, size );
                    result[ size ] = 0;

    				res += size;
                    //DEBUG("SYS: copy %d  res %d\n", size, res );
                }
                else
                {
                    printf("Cannot alloc mem result\n");
                }
    		}
    		else
    		{
    			//DEBUG("TEMP res size %d %s\n", res, temp );
    			if( ( temp = calloc( res+1, sizeof(char) ) ) != NULL )
    			{
    				memcpy( temp, result, res );
                    //DEBUG("Data copy %s\n", temp );
    				if( result != NULL ){ free( result ); result = NULL; }
                    //DEBUGNA("before result calloc\n");
    				if( ( result = calloc( res+size+1, sizeof(char) ) ) != NULL )
    				{
    					memcpy( result, temp, res );
    					memcpy( &(result[ res ]), buffer, size );

                        //DEBUG("res %d size %d result %s\n", res, size, result );
    					res += size;
    				}

    				free( temp );
    				temp = NULL;
    			}
    		}
    		//res += (FULONG)size;
    	}
    }
    pclose( pipe );
	free( command );

	return result;
}


const char *GetSuffix()
{
	return SUFFIX;
}
