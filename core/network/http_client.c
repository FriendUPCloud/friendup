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
/** @file
 * 
 *  HttpClient functions body
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>
#include "http_client.h"

/**
 * Function create HttpClient call
 *
 * @param post set to TRUE if you want to use POST to send messages, otherwise FALSE
 * @param param pointer to additional http tags (as string)
 * @return new HttpClient structure or NULL when problem appear
 */
HttpClient *HttpClientNew( FBOOL post, char *param )
{
	HttpClient *c = NULL;
	
	if( ( c = FCalloc( 1, sizeof(HttpClient) ) ) != NULL )
	{
		char temp[ 2048 ];
		int size = 0;
		
		//POST /oauth/token HTTP/1.1
		if( post == TRUE )
		{
			size = snprintf( temp, 2048, "POST %s HTTP/1.1", param );
		}
		else
		{
			size = snprintf( temp, 2048, "GET %s HTTP/1.1", param );
		}
		
		c->hc_MainLine = StringDuplicateN( temp, size );
	}
	
	return c;
}

/**
 * Function delete HttpClient
 *
 * @param c pointer to HttpClient which will be deleted
 */
void HttpClientFree( HttpClient *c )
{
	if( c != NULL )
	{
		int i;
		
		for( i=0 ; i < HTTP_HEADER_END ; i++ )
		{
			if( c->hc_Headers[ i ] != NULL )
			{
				FFree( c->hc_Headers[ i ] );
			}
		}
		
		if( c->hc_MainLine != NULL )
		{
			FFree( c->hc_MainLine );
		}
		
		FFree( c );
	}
}

