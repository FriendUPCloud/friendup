/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/


#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <util/log/log.h>
#include "util/base64.h"
#include <core/types.h>
#include <string.h>


//                   0000000000000000111111111111111122222222222222223333333333333333
//                   0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF


const char* CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char encoding_table[] = { 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
                                 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
                                 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
                                 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
                                 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
                                 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
                                 'w', 'x', 'y', 'z', '0', '1', '2', '3',
                                 '4', '5', '6', '7', '8', '9', '+', '/' };
static char *decoding_table = NULL;
static int mod_table[] = { 0, 2, 1 };

//
//
//

void build_decoding_table()
{
	decoding_table = FCalloc( 1, 256 );
	
    for( int i = 0; i < 64; i++ )
	{
		decoding_table[ ( unsigned char ) encoding_table[ i ] ] = i;
	}
}

//
//
//

void base64_cleanup()
{
    FFree( decoding_table );
    decoding_table = NULL;
}

//
//
//

char *Base64Encode( const unsigned char* data, int length, int *dstlen )
{
	int outSize = (int)ceil( (float)length / 3.0f ) << 2;
	int reminder = length % 3;
	int padding = reminder ? 3 - reminder : 0;
	int encSize = outSize - padding;

	unsigned char c1 = 0, c2 = 0, c3 = 0;
	int j = 0, i;

	char* encoded = (char *)FMalloc( (outSize + 16) );	// was +1 before
	if( encoded == NULL )
	{
		FERROR("Cannot allocate memory in Base64Encode\n");
		return NULL;
	}

	for( i = 0; i < encSize; i++ )
	{
		switch( i & 3 )
		{
			case 0:	
				c1 = data[ j++ ];
				encoded[i] = CHARS[ c1 >> 2 ];
				break;
			case 1:
				c2 = ( j < length ) ? data[ j++ ] : 0;
				encoded[i] = CHARS[ ( ( c1 << 4 ) | ( c2 >> 4 ) ) & 0x3F ];
				break;
			case 2:
				c3 = ( j < length ) ? data[ j++ ] : 0;
				encoded[i] = CHARS[ ( ( c2 << 2 ) | ( c3 >> 6 ) ) & 0x3F ];
				break;
			case 3:
				encoded[i] = CHARS[ c3 & 0x3F ];
				break;
		}
	}

	if( padding > 0 )
	{
		encoded[i++] = '=';
	}
	if( padding > 1 )
	{
		encoded[i++] = '=';
	}
	encoded[i] = 0;
	
	*dstlen = outSize;

	return encoded;
}

// Single argument version
char *Base64EncodeString( const unsigned char *chr )
{
	int size = 0;
	return Base64Encode( chr, strlen( (const char *)chr ), &size );
}

// Mark the base64 encoded string and return it
char *MarkAndBase64EncodeString( const char *chr )
{
	char *str = Base64EncodeString( (const unsigned char *)chr );
	// 13 length <!--base64-->, +1 for terminator
	char *fin = FCalloc( strlen( str ) + 14, sizeof( char ) );
	if( fin != NULL )
	{
		sprintf( fin, "%s%s", "<!--base64-->", str );
		FFree( str );
		return fin;
	}
	FFree( str );
	return NULL;
}

//
//
//

/* Unstable code! Please test! */
char *Base64Decode( const unsigned char* data, unsigned int length, int *finalLength )
{
	//if( decoding_table == NULL ) build_decoding_table();
	if( length <= 0 )
	{
		return NULL;
	}
	
	if( length % 4 != 0 )
	{
		FERROR("Cannot decode entry, beacouse size is incorect: %d\n", length );
		return NULL;
	}

	// Length / 4 * 3
	//int output_length = ( ( ( length >> 4 ) + ( length >> 4 ) ) );
	//output_length += output_length << 1;
	unsigned int output_length = ((length + 3) / 4) * 3;
    
	if( data[ length - 1 ] == '=' ) ( output_length )--;
	if( data[ length - 2 ] == '=' ) ( output_length )--;

	unsigned char *decoded_data = FCalloc( output_length + 1, sizeof( char ) );
    
	if( decoded_data == NULL )
	{
		FERROR("Decoded data is equal to NULL\n");
		return NULL;
	}

	unsigned int i, j;
	for( i = 0, j = 0; i < length; )
	{
		//DEBUG(" i : %d dataptr %p\n", i, data );
		unsigned long long sextet_a = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_b = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_c = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_d = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];

		unsigned long long triple =   ( sextet_a << 18 )  // 3 * 6
									+ ( sextet_b << 12 )  // 2 * 6
									+ ( sextet_c << 6  )  // 1 * 6
									+ ( sextet_d       ); // 0 * 6

		int x = j;
		if( j < output_length) decoded_data[j++] = (triple >> 16 ) & 0xFF; // 2 * 8
		if( j < output_length) decoded_data[j++] = (triple >> 8  ) & 0xFF; // 1 * 8
		if( j < output_length) decoded_data[j++] = (triple       ) & 0xFF; // 0 * 8
		//printf(" %c %c %c", decoded_data[x], decoded_data[x+1], decoded_data[x+2] );
	}
	
	*finalLength = output_length;

	// Clean up and return
	//base64_cleanup();
	
	return (char *)decoded_data;
}

