/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************�*/

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

char *MakeString ( int length )
{
	return ( char *)FCallocAlign( length, sizeof(char) );
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
		FFree ( *string );
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
	if( !str )
	{
		DEBUG("Cannot duplicate string in size 0\n");
		return NULL;
	}
	
	char* copy;
	if( len <= 0 )
	{
		FERROR("Cannot duplicate string in size 0\n");
		return NULL;
	}
	//copy = FMallocAlign( len + 1 );
	copy = FCallocAlign( len + 1, 1 );
	if( copy == NULL )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( copy, str, len );
	copy[ len ] = 0;
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
		DEBUG("Cannot duplicate string in size 0\n");
		return NULL;
	}
	len = strlen( str );
	newStr = FMallocAlign( len + 1 );
	//newStr = FCallocAlign( len + 1, 1 );
	if( !newStr )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( newStr, str, len+1 );
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
	
	newStr = FMallocAlign( len + 1 );
	if( newStr == NULL )
	{
		FERROR("Cannot allocate memory in StringDuplicateN\n");
		return NULL;
	}
	memcpy( newStr, str, len );
	newStr[ len ] = 0;
	
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
	FFree( str );
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
	//char *dst = FMallocAlign( size + 1);
	char *dst = FCallocAlign( size + 1, 1 );
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
	
	//*dst = 0;
	
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
	
	int memsize = ( SHIFT_LEFT( strlen( src ), 2) );
	//char *enc = FCalloc( ( SHIFT_LEFT( strlen( src ), 2) ), sizeof( char ) );
	//char *enc = FMallocAlign( memsize );
	char *enc = FCallocAlign( memsize, 1 );
	char *res = enc;
	for( ; *src; src++ )
	{
		// if we don't have an index on the current character in the 
		// table, then add it pure, else, encode it
		if( _rfc3986[ (int)*src ] ) 
		{
			sprintf( enc, "%c", _rfc3986[ (int)*src ] );
		}
		else 
		{
			sprintf( enc, "%%%02X", ( unsigned char)*src );
		}
		while( *( ++enc ) != '\0' ){};
	}
	//enc[ memsize-1 ] = 0;
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
			v = ( ( SHIFT_LEFT(v, 3) ) + ( SHIFT_LEFT( v, 1) ) ) + ( str[i] - '0' );
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
	char* combined = FMallocAlign( len1 + len2 + 1 );

	// Out of memory?
	if( !combined )
	{
		FERROR("Cannot allocate memory in StringAppend\n");
		return NULL;
	}

	strcpy( combined, str1 );
	strcpy( combined + len1, str2 );
	combined[ len1 + len2 ] = 0;
	return combined;
}

//
//
//

FBOOL CharIsDigit( char c )
{
	return c >= '0' && c <= '9';
}

FBOOL CharIsUpAlpha( char c )
{
	return c >= 'A' && c <= 'Z';
}

FBOOL CharIsLoAlpha( char c )
{
	return c >= 'a' && c <= 'z';
}

FBOOL CharIsAlpha( char c )
{
	return CharIsUpAlpha( c ) || CharIsLoAlpha( c );
}

FBOOL CharIsAlphanumeric( char c )
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
		nl->l_Data = ns;
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
		nl->l_Data = ns;
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
		a[i++] = lptr->l_Data;
		l = lptr;
		lptr = lptr->next;
		free( l );
	}
	a[i++] = lptr->l_Data;
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
	//char* estr = FMallocAlign( estrLen + 1 );
	char* estr = FCallocAlign( estrLen + 1, 1 );
	//char* estr = calloc( estrLen + 1, sizeof(char) );
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

static inline void preKmp(char *x, int m, int kmpNext[]) {
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

FQUAD FindInBinaryPOS(char *x, int m, char *y, FQUAD n) 
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
			return j-i;
		}
	}
	return -1;
}

//
//
//

FQUAD FindInBinarySimple( char *x, int m, char *y, FQUAD n )
{
	FQUAD i;
	
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

//
//
//

void HashedString ( char **str )
{
	unsigned char temp[SHA_DIGEST_LENGTH];
	memset( temp, 0x0, SHA_DIGEST_LENGTH );
	
	//char *buf = FMallocAlign( ( SHIFT_LEFT( SHA_DIGEST_LENGTH, 1) ) + 1 );
	char *buf = FCallocAlign( ( SHIFT_LEFT( SHA_DIGEST_LENGTH, 1) ) + 1, 1 );
	//char *buf = FCalloc( ( SHIFT_LEFT( SHA_DIGEST_LENGTH, 1) ) + 1, sizeof( char ) );

	if( buf != NULL )
	{
		SHA1( ( unsigned char *)*str, strlen( *str ), temp);

		int i = 0;
		for ( ; i < SHA_DIGEST_LENGTH; i++ )
		{
			sprintf( (char*)&(buf[ SHIFT_LEFT( i, 1) ]), "%02x", temp[i] );
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

//
// Escape string to JSON
//

char *EscapeStringToJSON( char *str )
{
	if( strstr( str, "\\" ) != NULL )
	{
		int size = strlen( str );
		char *ret = FMalloc( (size*2)+1 );
		if( ret != NULL )
		{
			char *dst = ret;
			char *src = str;
			
			while( *src != 0 )
			{
				if( *src == '\\' )
				{
					*dst = '\\';
					dst++;
				}
				else if( *src == '\n' )
				{
					*dst = '\\';
					dst++;
				}
				
				*dst = *src;
				src++;
				dst++;
			}
			*dst = 0;
		}
		return ret;
	}
	
	return NULL; // there is no need to escape string
}

int StringNToInt( char *s, int len )
{
	if( len > 63 ) return 0;
	char chars[ 64 ];
	memcpy( chars, s, len );
	chars[ len ] = 0;
	return atoi( chars );
}

//destination has to be at least twice as long as src (in worst case)
void string_escape_quotes(const char *src, char *dst)
{
	while( *src )
	{
		if (*src == '"')
		{
			*dst = '\\';
            dst++;
		}
		*dst = *src;
		dst++;
		src++;
	}
	*dst = 0;
}
