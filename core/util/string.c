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

#include <stdio.h>
#include <stdlib.h>
#include <memory.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>
#include <assert.h>
#include <stddef.h>
#include "util/string.h"
#include "util/list.h"

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
	if ( str == NULL || compare == NULL ) return -1;

	char* res = strstr(str, compare);
	if(!res)
		return -1;
	else
		return res - str;
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

char* StringDuplicateN( char* str, unsigned int len )
{
	if( len == 0 )
	{
		ERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	char* copy = FCalloc( len + 1, sizeof(char) );
	if( !copy )
	{
		ERROR("Cannot allocate memory in StringDuplicateN\n");
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
	if( !str )
	{
		ERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	int len = strlen( str );
	char* newStr = calloc( len + 1, sizeof( char ) );
	if( !newStr )
	{
		ERROR("Cannot allocate memory in StringDuplicateN\n");
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
	if( !str )
	{
		return;
	}
	char* ptr = str;
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
	int i = 0, ii = 0; for ( ; i < len; i++ )
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

ULONG UrlDecode( char* dst, const char* src )
{
	char* org_dst = dst;
	char ch, a, b;
	do 
	{
		ch = *src++;
		if( ch == '%' && isxdigit( a = src[0] ) && isxdigit( b = src[1] ) ) 
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
	char *dst = calloc( strlen( src ) + 1, sizeof(char ) );
	if( dst == NULL )
	{
		ERROR("Cannot alloc memory for decoded url\n");
		return NULL;
	}
	char* org_dst = dst;
	char ch, a, b;
	do 
	{
		ch = *src++;
		if( ch == '%' && isxdigit( a = src[0] ) && isxdigit( b = src[1] ) ) 
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
			v = ( v * 10 ) + ( str[i] - '0' );
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
		ERROR("Cannot allocate memory in StringAppend\n");
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

inline BOOL CharIsDigit( char c )
{
	return c >= '0' && c <= '9';
}

inline BOOL CharIsUpAlpha( char c )
{
	return c >= 'A' && c <= 'Z';
}

inline BOOL CharIsLoAlpha( char c )
{
	return c >= 'a' && c <= 'z';
}

inline BOOL CharIsAlpha( char c )
{
	return CharIsUpAlpha( c ) || CharIsLoAlpha( c );
}

inline BOOL CharIsAlphanumeric( char c )
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

BOOL CharIsCTL( char c )
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
			ERROR("Cannot allocate memory in StringSplit\n");
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
		ERROR("Cannot allocate memory in String Split\n");
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
		ERROR("Cannot allocate memory in StringShellEscape\n");
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

int FindInBinaryPOS(char *x, int m, char *y, int n) 
{
	int i, j, kmpNext[ m ];

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
			return j-i;
		}
	}
	return -1;
}
