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

/*
 * 
 * 
 * 
 * 
 * */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <util/string.h>
#include "web_util.h"

// 
// Some helper functions on http data
//

// Find where the headers start -1 on fail >= 0 on success
int FindEmbeddedHeaders( char *data, int dataLength )
{
	int len = dataLength ? dataLength : (int)strlen( data );
	const char *search = "---http-headers-begin---\n";
	const char *tmpsearch = "---";
	int slen = sizeof( search );
	if( slen > len ) return -1;
	
	DEBUG("find headers %d\n", dataLength );
	
	int i = 0; for( ; i < len-3; i++ )
	{
		int found = 1;
		int k = 0; 
		
		if( strncmp( tmpsearch, &data[ i ], 3 ) == 0 )
		{
			if( strncmp( search, &data[ i ], 24 ) == 0 )
			{
				return i;
			}
		}
	}
	return -1;
}

// Check a header
char *CheckEmbeddedHeaders( char *data, int dataLength, const char *header )
{
	// Setup the data
	unsigned int len = dataLength ? dataLength : (int)strlen( data );
	int pos = FindEmbeddedHeaders( data, dataLength );
	
	// Error.. no headers
	if( pos == -1 ) return NULL;
	
	// Find the header and return the data
	unsigned int hlen = strlen( header );
	unsigned int i = pos; 
	for( ; i < len; i++ )
	{
		if( i + hlen < len )
		{
			int found = 1;
			unsigned int k = 0; 
			for( ; k < hlen; k++ )
			{
				if( header[k] != data[k+i] )
				{
					found = 0;
					break;
				}
			}
			// We found the header! Now find the content
			if( found == 1 )
			{
				// Advance i past header name
				i += hlen + 1;
				
				// Find the length of the content
				int p = hlen;
				unsigned int contentLen = 0;
				unsigned int u = i; 
				for( ; u < len; u++ )
				{
					if( data[u] == '\n' )
					{
						contentLen = u - i;
						break;
					}
				}
				// Create a string with the content
				if( contentLen != 0 )
				{
					//DEBUG( "We found %s..\n", header );
					char *content = calloc( contentLen + 1, sizeof( char ) );
					int cu = 0;
					int mode = 0;
					for( u = 0; u < contentLen; u++ )
					{
						if( mode == 0 && data[i+u] != ' ' )
							mode++;
						if( mode > 0 )
							content[cu++] = data[i+u];
					}
					return content;
				}
			}
		}
	}
	return NULL;
}

// Strip headers
int StripEmbeddedHeaders( char **data, unsigned int dataLength )
{
	// Setup the data
	char *pdata = *data;
	int len = dataLength ? dataLength : strlen( pdata );
	int pos = FindEmbeddedHeaders( pdata, dataLength );
	
	// Error.. no headers
	if( pos == -1 ) return -1;
	
	// Make a new string and copy relevant info
	char *output = MakeString( pos );
	memcpy( output, pdata, pos );

	// Free original data	
	free( *data );
	
	// New pointer to char array without the headers
	*data = output;
	
	return pos;
}


