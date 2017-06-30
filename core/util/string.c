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

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include <string.h>
#include <ctype.h>
#include <assert.h>
#include <stddef.h>
#include "util/string.h"
#include "util/list.h"
#include <openssl/sha.h>

//
//
//

inline char *MakeString ( int length )
{
	return ( char *)FCalloc ( length, sizeof(char) );
	/*if ( c != NULL )
	{
		return c;
	}
	return NULL;*/
}

//
// Find the first occurance of compare in str
//

int SubStrCmp ( char *str, char *compare )
{
	char* res;
	if ( str == NULL || compare == NULL ) return -1;

	res = strstr(str, compare);
	if (!res)
	{
		return -1;
	}
	else
	{
		return res - str;
	}
}

//
// Gives stringlength of str (safely, only use with sprintf!)
//

int PStrlen ( char *str )
{
	if ( str == NULL ) return 4; // length of "null"
	return strlen ( str );
}

//
// Make string safe! If it is not null terminated - fix it!
//

int SafeString ( char **string, int length )
{
	if ( length == 0 ) length = strlen ( *string );
	if ( ( *string )[length-1] != '\0' )
	{
		char *newStr = MakeString ( length );
		sprintf ( newStr, "%.*s", length, *string );
		free ( *string );
		*string = newStr;
		return length + 1;
	}
	return length;
}

//
// A kind of safe strlen func
//

int SafeStrlen ( char **string, int maxlen )
{
	// Test if the string is properly null terminated
	// if it is not, fix it
	if ( SafeString ( string, maxlen ) > maxlen )
	{
		return maxlen;
	}
	// else just return the length
	return strlen ( *string );
}

//
// Duplicate N characters from a string, and add a null-terminator
// Warning: Does not check that str contains at least len characters!
//

char* StringDuplicateN( char* str, int len )
{
	char* copy;
	if( len <= 0 )
	{
		FERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	copy = FCalloc( len + 1, sizeof(char) );
	if( copy == NULL )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( copy, str, len );
	copy[len] = 0;
	return copy;
}

//
//
//

char* StringDuplicate( const char* str )
{
	int len;
	char *newStr;
	if( !str )
	{
		FERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	len = strlen( str );
	newStr = calloc( len + 1, sizeof( char ) );
	if( !newStr )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( newStr, str, len );
	return newStr;
}

//
//
//

char* StringDuplicateEOL( const char* str )
{
	int len = 0;
	char *newStr;
	char *p = (char *)str;
	if( str == NULL )
	{
		FERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	
	while( *p != 0 )
	{
		if( *p == '\n' || *p == '\r' )
		{
			break;
		}
		//printf("%c\n", *p );
		
		len++;
		p++;
	}
	
	newStr = FCalloc( len + 1, sizeof( char ) );
	if( newStr == NULL )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( newStr, str, len );
	return newStr;
}

//
// Overwrite string with 0 before freeing
//

void StringSecureFree( char* str )
{
	char *ptr;
	if( !str )
	{
		return;
	}
	ptr = str;
	while( *ptr )
	{
		*(ptr++) = 0;
	}
	free( str );
	return;
}

//
// Show string length, but with " " becoming "\ "
//

int StrLenSafeSpaces( char *str )
{
	unsigned int r = 0, i = 0; 
	for( ; i < strlen( str ); i++, r++ )
	{
		if ( str[i] == ' ' ) r++;
	}
	return r;
}

// Add escape chars to string (requires that the string is long enough)
// " " becomes "\ "
//

void AddEscapeChars( char *str )
{
	int len = strlen( str );
	char *tmp = MakeString( len );
	int i = 0, ii = 0; 
	for ( ; i < len; i++ )
	{
		if( str[i] == ' ' )
		{
			tmp[ii++] = '\\';
		}
		tmp[ii++] = str[i];
	}
	strcpy( str, tmp );
}

//
// Decode string
//

FULONG UrlDecode( char* dst, const char* src )
{
	char* org_dst = dst;
	char ch, a, b;
	DEBUG( "Decoding: %s\n", src );
	do 
	{
		ch = *src++;
		// Interpreting + as spaces!
		if( ch == '+' )
		{
			ch = ' ';
		}
		else if( ch == '%' && isxdigit( a = src[0] ) && isxdigit( b = src[1] ) ) 
		{
			if( a < 'A' ) a -= '0';
			else if( a < 'a' ) a -= 'A' - 10;
			else a -= 'a' - 10;
			if ( b < 'A' ) b -= '0';
			else if( b < 'a' ) b -= 'A' - 10;
			else b -= 'a' - 10;
			ch = 16 * a + b;
			src += 2;
		}
		*dst++ = ch;
	} 
	while( ch );
	return ( dst - org_dst ) - 1;
}

//
// Decode string
//

char *UrlDecodeToMem( const char* src )
{
	if( src == NULL )
	{
		return NULL;
	}
	int size = strlen( src );
	char *dst = calloc( size + 1, sizeof(char ) );
	if( dst == NULL )
	{
		FERROR("Cannot alloc memory for decoded url\n");
		return NULL;
	}
	char* org_dst = dst;
	char ch, a, b;
	do 
	{
		ch = *src++;
		// Interpreting + as spaces!
		if( ch == '+' )
		{
			ch = ' ';
		}
		else if( ch == '%' && isxdigit( a = src[0] ) && isxdigit( b = src[1] ) ) 
		{
			if( a < 'A' ) a -= '0';
			else if( a < 'a' ) a -= 'A' - 10;
			else a -= 'a' - 10;
			if ( b < 'A' ) b -= '0';
			else if( b < 'a' ) b -= 'A' - 10;
			else b -= 'a' - 10;
			ch = 16 * a + b;
			src += 2;
		}
		*dst++ = ch;
	} 
	while( ch );
	return org_dst;
}

char _rfc3986[ 256 ] = { 0 };
void _UrlEncodeInitTables()
{
	int i = 0; for( ; i < 256; i++ )
		_rfc3986[ i ] = isalnum( i ) || i == '~' || i == '-' || i == '.' || i == '_' ? i : 0;
}
char *UrlEncodeToMem( const char *src )
{
	if( _rfc3986[0] == 0 ) _UrlEncodeInitTables();
	
	char *enc = FCalloc( ( strlen( src ) << 2 ), sizeof( char ) );
	char *res = enc;
	for( ; *src; src++ )
	{
		// if we don't have an index on the current character in the 
		// table, then add it pure, else, encode it
		if( _rfc3986[ *src ] ) 
		{
			sprintf( enc, "%c", _rfc3986[ *src ] );
		}
		else 
		{
			sprintf( enc, "%%%02X", ( unsigned char)*src );
		}
		while( *( ++enc ) != NULL ){};
	}
    return res;
}

// Note: If the number is too large to fit in an uint, this function will simply overflow.
//       It's safe, but can be unexpected.
//       Returns 0 if a non-digit character was found

unsigned int StringParseUInt( char* str )
{
	unsigned int len = strlen( str );
	unsigned int v = 0;
	for( unsigned int i = 0; i < len; i++ )
	{
		if( str[i] >= '0' && str[i] <= '9' )
		{
			v = ( ( v << 3 ) + ( v << 1 ) ) + ( str[i] - '0' );
		}
		else
		{
			return 0;
		}
	}
	return v;
}

//
//
//

char* StringAppend( const char* str1, const char* str2 )
{
	unsigned int len1 = strlen( str1 );
	unsigned int len2 = strlen( str2 );
	char* combined = calloc( len1 + len2 + 1, sizeof(char) );

	// Out of memory?
	if( !combined )
	{
		FERROR("Cannot allocate memory in StringAppend\n");
		return NULL;
	}

	strcpy( combined, str1 );
	strcpy( combined + len1, str2 );
	combined[len1 + len2] = 0;
	return combined;
}

//
//
//

inline FBOOL CharIsDigit( char c )
{
	return c >= '0' && c <= '9';
}

inline FBOOL CharIsUpAlpha( char c )
{
	return c >= 'A' && c <= 'Z';
}

inline FBOOL CharIsLoAlpha( char c )
{
	return c >= 'a' && c <= 'z';
}

inline FBOOL CharIsAlpha( char c )
{
	return CharIsUpAlpha( c ) || CharIsLoAlpha( c );
}

inline FBOOL CharIsAlphanumeric( char c )
{
	return CharIsAlpha( c ) || CharIsDigit( c );	
}

//
//
//

char CharAlphaToUp( char c )
{
	if( CharIsLoAlpha( c ) )
		return c & ~0x20;
	return c;
}

//
//
//

char CharAlphaToLow( char c )
{
	if( CharIsUpAlpha( c ) )
		return c | 0x20;
	return c;
}

//
//
//

FBOOL CharIsCTL( char c )
{
	return c < 0x20 || c == 0x7F;
}

//
//
//

void StringToLowercase( char* str )
{
	unsigned int i = 0;
	while( str[i] )
	{
		str[i] = CharAlphaToLow( str[i] );
		i++;
	}
}

//
//
//

void StringToUppercase( char* str )
{
	unsigned int i = 0;
	while( str[i] )
	{
		str[i] = CharAlphaToUp( str[i] );
		i++;
	}
}

//
//
//

int StringCheckExtension( char* str, char* ext )
{
	if( !str || !ext )
		return -1;
	char* extension = strrchr( str, '.' );
	if( extension && extension - str > 2 )
	{
		return strcmp( ++extension, ext );
	}else{
		return -1;
	}
}

//
//
//

char** StringSplit( char* str, char delimiter, unsigned int* length )
{
	if( !str )
	{
		*length = 0;
		return NULL;
	}
	
	char* ptr = strchr( str, delimiter );
	if( ptr == NULL )
	{
		// No delimiter found; No splitting needed.
		char** a = calloc( 1, sizeof( char* ) );
		if( a == NULL )
		{
			FERROR("Cannot allocate memory in StringSplit\n");
			return NULL;
		}
		a[0] = StringDuplicate( str );
		*length = 1;
		return a;
	}

	List* l = ListNew();
	List* lptr = l;
	unsigned int c = 0;
	char* sptr = str;
	while( ptr != NULL )
	{
		// Copy sub string and append to list
		char* ns = StringDuplicateN( sptr, ptr - sptr );
		List* nl = ListNew();
		nl->data = ns;
		lptr->next = nl;
		lptr = nl;

		sptr = ptr + 1;
		ptr = strchr( sptr, delimiter );

		c++;
	}

	// If the last delimiter wasn't at the end of the string,
	// copy the remaining part of the string.
	if( sptr[0] != 0 )
	{
		char* ns = StringDuplicate( sptr );
		List* nl = ListNew();
		nl->data = ns;
		lptr->next = nl;
		lptr = nl;
		c++;
	}

	// Make the array and free the list
	unsigned int i = 0;
	char** a = calloc( c, sizeof( char *) );
	if( a == NULL )
	{
		FERROR("Cannot allocate memory in String Split\n");
		return NULL;
	}
	lptr = l->next;
	free( l );
	while( lptr->next )
	{
		a[i++] = lptr->data;
		l = lptr;
		lptr = lptr->next;
		free( l );
	}
	a[i++] = lptr->data;
	free( lptr );
	*length = c;

	return a;
}

//
//
//

char* StringShellEscape( const char* str )
{
	//DEBUG("StringShellEscape %s\n", str );
	
	unsigned int strLen = str ? strlen( str ) : 0;
	unsigned int estrLen = 0;

	// We must escape \'s and "'s from the args!
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estrLen += 2;
		}
		else if(str[i] == '"')
		{
			estrLen += 2;
		}
		else
		{
			estrLen++;
		}
	}
	char* estr = calloc( estrLen + 1, sizeof(char) );
	if( estr == NULL )
	{
		FERROR("Cannot allocate memory in StringShellEscape\n");
		return NULL;
	}
	unsigned int j = 0;
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else if(str[i] == '"')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else
			estr[j++] = str[i];
	}
	estr[ estrLen ] = 0;

	return estr;
}

//
// same as Escape + return len
//

char* StringShellEscapeSize( const char* str, int *len )
{
	DEBUG("StringShellEscape %s\n", str );
	
	unsigned int strLen = str ? strlen( str ) : 0;
	unsigned int estrLen = 0;

	// We must escape \'s and "'s from the args!
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estrLen += 2;
		}
		else if(str[i] == '"')
		{
			estrLen += 2;
		}
		else
		{
			estrLen++;
		}
	}
	char* estr = calloc( estrLen + 1, sizeof(char) );
	if( estr == NULL )
	{
		FERROR("Cannot allocate memory in StringShellEscape\n");
		return NULL;
	}
	unsigned int j = 0;
	for( unsigned int i = 0; i < strLen; i++ )
	{
		if(str[i] == '\\')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else if(str[i] == '"')
		{
			estr[j++] = '\\';
			estr[j++] = str[i];
		}
		else
			estr[j++] = str[i];
	}
	estr[ estrLen ] = 0;
	*len = estrLen;

	return estr;
}

//
//
//

inline void preKmp(char *x, int m, int kmpNext[]) {
	int i, j;

	i = 0;
	j = kmpNext[0] = -1;
	while (i < m) 
	{
		while (j > -1 && x[i] != x[j])
		{
			j = kmpNext[j];
		}
		i++;
		j++;
		if (x[i] == x[j])
		{
			kmpNext[i] = kmpNext[j];
		}
		else
		{
			kmpNext[i] = j;
		}
	}
}

//
// x - find this text   m - its size
// y - in this text we are trying to find our data
//


char *FindInBinary(char *x, int m, char *y, int n) 
{
	int i, j, kmpNext[ m ];
	if( y == NULL )
	{
		return NULL;
	}

	// Preprocessing 
	preKmp(x, m, kmpNext);

	// Searching 
	i = j = 0;
	while (j < n) 
	{
		while (i > -1 && x[i] != y[j])
		{
			i = kmpNext[i];
		}
		i++;
		j++;
		if (i >= m) 
		{
			//OUTPUT(j - i);
			//printf("%d", j-i );
			return &(y[j-i]);
			//i = kmpNext[i];
		}
	}
	return NULL;
}

//
//
//

FQUAD FindInBinaryPOS(char *x, int m, char *y, FUQUAD n) 
{
	FQUAD i, j;
	int kmpNext[ m ];

	// Preprocessing 
	preKmp(x, m, kmpNext);

	// Searching 
	i = j = 0;
	while (j < (FQUAD)n) 
	{
		//printf("find %d\n", j );
		while (i > -1 && x[i] != y[j])
		{
			i = kmpNext[ i ];
		}
		i++;
		j++;
		if (i >= m) 
		{
			DEBUG("Found entry in text\n");
			return j-i;
		}
	}
	return -1;
}

//
//
//

FQUAD FindInBinarySimple( char *x, int m, char *y, FUQUAD n )
{
	FUQUAD i;
	
	//INFO("\n\n\nFIND TEXT %s\n", x );
	
	for( i=0 ; i < n ; i++ )
	{
		//printf("find %lld\n", i );
		if( memcmp( x, y, m ) == 0 )
		{
			//FERROR("Found text %50s ------------------------------ %10s\n", (y-50), y );
			return (FQUAD)i;
		}
		y++;
	}
	return -1;
}


void HashedString ( char **str )
{
	unsigned char temp[SHA_DIGEST_LENGTH];
	memset( temp, 0x0, SHA_DIGEST_LENGTH );
	
	char *buf = FCalloc( ( SHA_DIGEST_LENGTH << 1 ) + 1, sizeof( char ) );

	if( buf != NULL )
	{
		SHA1( ( unsigned char *)*str, strlen( *str ), temp);

		int i = 0;
		for ( ; i < SHA_DIGEST_LENGTH; i++ )
		{
			sprintf( (char*)&(buf[ i << 1 ]), "%02x", temp[i] );
		}

		if ( *str ) 
		{
			FFree ( *str );
		}
		DEBUG ( "[HashedString] Hashing\n" );
		*str = buf;
		DEBUG ( "[HashedString] Hashed\n" );
	}
	else
	{
		FERROR("Cannot allocate memory for hashed string\n");
	}
}

//
//
//

char *GetStringFromJSON( char *text, char *token )
{
	char *valPtr = NULL;
	
	if( ( valPtr = strstr( text, token ) ) != NULL )
	{
		char *retValue;
		char *allocPath = NULL;
	
		valPtr += strlen( token )+4;	// we move to the end of "TOKEN":"
		retValue = valPtr;
		int index = 0;
		// we want to end string by putting 0 on the end
		
		while( *valPtr != 0 )
		{
			char *oldChar = valPtr;
		
			valPtr++;
		
			if( *oldChar != '\\' && *valPtr == '\"' )
			{
				allocPath = StringDuplicateN( retValue, (oldChar+1)-retValue );
				if( allocPath != NULL )
				{
					int len = strlen( allocPath );
					if( allocPath[ len-1 ] == '\\' )
					{
						allocPath[ len-1 ] = 0;
					}
					return allocPath;
				}
				break;
			}
		}
	}
	return NULL;
}

