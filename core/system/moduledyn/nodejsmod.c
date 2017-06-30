/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
*                                                                              *
*****************************************************************************©*/


#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include "systembase.h"
#include <util/log/log.h>
#include <properties/propertieslibrary.h>
#include <core/library.h>

#define SUFFIX "njs"
#define BUFFER_SIZE 1024

//
// popen/pclose definitions
//

FILE *popen( const char *c, const char *v );

//
// Run module function
//

char *Run( struct EModule *mod, const char *path, const char *args, FULONG *length )
{
	DEBUG("NODEJS mod run\n");

	FULONG res = 0;
	char command[ BUFFER_SIZE ];
	char *temp = NULL;
	char *result = NULL;
    unsigned long size = 0;
	
	//
	// we must read path to node
	//
	/*
	struct PropertiesLibrary *plib = NULL;
	Props *prop = NULL;
	char *nodepath = NULL;
	
	if( ( plib = (struct PropertiesLibrary *)LibraryOpen( "properties.library", 0 ) ) != NULL )
	{
		prop = plib->Open( "cfg.ini" );
		if( prop != NULL)
		{
			//
			//
			// if node is global, there is no need to provide config
			//
			
			DEBUG("[Nodemod] reading nodepath\n");
			nodepath = plib->ReadString( prop, "NodeJS:path", "/usr/bin/" );
			DEBUG("[Nodemod] user %s\n", nodepath );

		}else{
			nodepath = "/usr/bin/";
		}
		//DEBUG("PROPERTIES LIBRARY OPENED, poitner to props %p!   %s  %s  %s  %s  %d\n", prop, login, pass, host, dbname, port );
		LibraryClose( (struct Library *)plib );
	}

	//
	//
	// we are calling native application and read output from it
	//
	//

	if( nodepath != NULL )
	{
		if( nodepath[ strlen( nodepath )-1 ] == '/' )
		{
			sprintf( command, "%snode %s %s", nodepath, path, args );
		}else{
			sprintf( command, "%s/node %s %s", nodepath, path, args );
		}
	}else{
		sprintf( command, "node %s %s", path, args );
	}
*/
    FILE* pipe = popen( command, "r");
    if( !pipe )
    {
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
                }else{
                    printf("Cannot alloc mem result\n");
                }
    		}else{
    			//DEBUG("TEMP res size %d %s\n", res, temp );
    			if( ( temp = calloc( res+1, sizeof(char) ) ) != NULL )
    			{
    				memcpy( temp, result, res );
                    //DEBUG("Data copy %s\n", temp );
    				if( result != NULL ){ free( result ); result = NULL; }
                    //DEBUGNA("before result calloc\n");
    				if( ( result = calloc( res+size+1, sizeof(char) ) ) != NULL ){
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

	return result;
}

//
//
//

const char *GetSuffix()
{
	return SUFFIX;
}
