

/*
 * 
 * 
 * 
 */

#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <util/log/log.h>
#include "util/base64.h"
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
	decoding_table = calloc( 1, 256 );
	
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
    free( decoding_table );
    decoding_table = NULL;
}

//
//
//

char* Base64Encode( const unsigned char* data, int length )
{
	int outSize = ceil( (float)length / 3.0f ) * 4;
	int reminder = length % 3;
	int padding = reminder ? 3 - reminder : 0;
	int encSize = outSize - padding;

	unsigned char c1, c2, c3;
	c1 = c2 = c3 = 0;
	int j = 0, i;

	char* encoded = calloc( outSize + 1, sizeof(char) );
	if( encoded == NULL )
	{
		ERROR("Cannot allocate memory in Base64Encode\n");
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
		encoded[i++] = '=';
	if( padding > 1 )
		encoded[i++] = '=';
	encoded[i] = 0;

	return encoded;
}

//
//
//

/* Unstable code! Please test! */
char* Base64Decode( const unsigned char* data, int length, int *finalLength )
{
	if( decoding_table == NULL ) build_decoding_table();

	if( length % 4 != 0 ) return NULL;

	int output_length = length / 4 * 3;
    
	if( data[ length - 1 ] == '=' ) ( output_length )--;
	if( data[ length - 2 ] == '=' ) ( output_length )--;

	unsigned char *decoded_data = calloc( 1, output_length + 1 );
    
	if( decoded_data == NULL ) return NULL;

	for( int i = 0, j = 0; i < length; )
	{
		unsigned long long sextet_a = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_b = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_c = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];
		unsigned long long sextet_d = data[i] == '=' ? 0 & i++ : decoding_table[data[i++]];

		unsigned long long triple =   ( sextet_a << 3 * 6 )
									+ ( sextet_b << 2 * 6 )
									+ ( sextet_c << 1 * 6 )
									+ ( sextet_d << 0 * 6 );

		if( j < output_length) decoded_data[j++] = (triple >> 2 * 8 ) & 0xFF;
		if( j < output_length) decoded_data[j++] = (triple >> 1 * 8 ) & 0xFF;
		if( j < output_length) decoded_data[j++] = (triple >> 0 * 8 ) & 0xFF;
	}
	
	*finalLength = output_length;

	// Clean up and return
	base64_cleanup();
	
	return (char *)decoded_data;
}

