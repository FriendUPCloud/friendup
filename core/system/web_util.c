/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 *  Additional web functionality
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/10/2015
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <util/string.h>
#include "web_util.h"

const char *hsearchs = "---http-headers-begin---\n";
const int  hsearchLens = 25;
const char *hsearche = "---http-headers-end---\n";
const int hsearchLene = 23;

/**
 * Find headers in data
 *
 * @param data pointer to data where request is
 * @param dataLength length of source message
 * @return -1 on fail >= 0 on success
 */

int FindEmbeddedHeaders( char *data, int dataLength )
{
	if( !data ) return -1;
	
	int len = ( dataLength ? dataLength : (int)strlen( data ) ) - hsearchLene;
	if( len < 0 ) return -1;
	
	int i = 0; for( ; i < len; i++ )
	{
		if( strncmp( hsearchs, data + i, hsearchLens ) == 0 )
		{
			return i;
		}
	}
	return -1;
}

/**
 * Check embedded headers in data
 *
 * @param data pointer to data where request is
 * @param dataLength length of source message
 * @param header pointer to http header which we want to get
 * @return pointer to content of requested header
 */
char *CheckEmbeddedHeaders( char *data, int dataLength, const char *header )
{
	// Setup the data - length minus end of headers
	int len = dataLength ? dataLength : (int)strlen( data ) - hsearchLene;
	if( len < 0 ) return NULL;
	
	int pos = FindEmbeddedHeaders( data, dataLength );
	
	// Error.. no headers
	if( pos == -1 ) return NULL;
	
	// Find the header and return the data
	unsigned int hlen = strlen( header );
	
	int i = pos; 
	for( ; i < len; i++ )
	{
		// Found our header
		if( strncmp( header, data + i, hlen ) == 0 )
		{
			i += hlen + 1;
			int mode = 0;
			int charPos = 0;
			int charLength = 0;
			int e = i;
			
			// Scan till newline to get our header value
			for( ; e < len; e++ )
			{
				if( mode == 0 && data[e] != ' ' )
				{
					mode = 1;
					charPos = e;
				}
				if( mode == 1 && data[e] != '\n' )
				{
					charLength++;
				}
				else if( mode == 1 && data[e] == '\n' )
				{
					break;
				}
			}
			
			if( charPos > 0 && charLength )
			{
				int block = charLength;
				char *value = FCalloc( block + 1, 1 );
				if( value != NULL )
				{
					memcpy( value, data + charPos, block );
				}
				return value;
			}
		}
		// Found header end
		if( strncmp( hsearche, data + i, hsearchLene ) == 0 ) 
		{
			return NULL;
		}
	}
	return NULL;
}

/**
 * Strip embedded headers from http request
 *
 * @param data pointer to 
 * @param dataLength length of source message
 * @return 0 if message was sent otherwise error number
 */
int StripEmbeddedHeaders( char **data, unsigned int dataLength )
{
	// Setup the data
	char *pdata = *data;
	
	int len = (int) ( dataLength ? dataLength : strlen( pdata ) ) - hsearchLene;
	int flen = (int) (dataLength ? dataLength : strlen( pdata ) );
	if( len < 0 ) return -2;
	
	int i = 0; for( ; i < len; i++ )
	{
		// Finding end
		if( strncmp( hsearche, pdata + i, hsearchLene ) == 0 )
		{
			int dataLength = flen - ( i + hsearchLene );
			
			char *result = FCalloc( dataLength + 1, 1 );
			if( result != NULL )
			{
				memcpy( result, pdata + i + hsearchLene, dataLength );
				free( *data ); *data = result;
			}
			else
			{
				return -1;
			}
			return dataLength;
		}
	}
	return -1;
}
