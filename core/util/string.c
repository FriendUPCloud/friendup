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
		if( newStr != NULL )
		{
			sprintf ( newStr, "%.*s", length, *string );
			FFree ( *string );
			*string = newStr;
		}
		else
		{
			return 0;
		}
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
	copy = FCallocAlign( (len + 16), 1 );
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
	if( str == NULL )
	{
		return;
	}
	int len = strlen( str );
	char *tmp = MakeString( len );
	if( tmp != NULL )
	{
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
		FFree( tmp );
	}
}

//
// Decode string
//

FULONG UrlDecode( char* dst, const char* src )
{
	// Do not touch non-encoded strings
	if( strstr( src, "%" ) == NULL )
	{
		int len = strlen( src );
		memcpy( dst, src, len + 1 );
		return len;
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

	// Do not touch non-encoded strings
	if( strstr( src, "%" ) == NULL )
	{
		return StringDuplicate( src );
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





static const char c2x_table[] = "0123456789ABCDEF";

 #define apr_isalnum(c) (isalnum(((unsigned char)(c))))

int apreq_encode(char *dest, const char *src, const int slen)
{
    char *d = dest;
    const unsigned char *s = (const unsigned char *)src;
    unsigned char c;
	int pos = 0;

    for ( ; s < (const unsigned char *)src + slen; ++s) {
        c = *s;
        if ( c < 0x80 && (apr_isalnum(c)
                          || c == '-' || c == '.'
                          || c == '_' || c == '~') )
            *d++ = c;

        else if ( c == ' ' )
            *d++ = '+';

        else {
//#if APR_CHARSET_EBCDIC
//            c = apr_xlate_conv_byte(ap_hdrs_to_ascii, (unsigned char)c);
//#endif
			printf("pos : %d\n", pos++ );
            *d++ = '%';
            *d++ = c2x_table[c >> 4];
            *d++ = c2x_table[c & 0xf];
        }
    }
    *d = 0;

    return d - dest;
}




char _rfc3986[ 256 ] = { 0 };


void _UrlEncodeInitTables()
{
	int i = 0; for( ; i < 256; i++ )
		_rfc3986[ i ] = isalnum( i ) || i == '~' || i == '-' || i == '.' || i == '_' ? i : 0;
}
char * UrlEncodeToMem( const char *src )
{
	if( _rfc3986[0] == 0 )
	{
		_UrlEncodeInitTables();
	}
	
	int memsize = ( strlen( src )*4);
	char *res = NULL;
	char *enc = FCalloc( memsize, 1 );// FCallocAlign( memsize, 1 );
	if( enc != NULL )
	{
		apreq_encode( enc, src, strlen( src ) );
		res = enc;
		/*
		
		for( ; *src; src++ )
		{
			int pos = 0;
			unsigned short int var = (unsigned short int) *src;
			printf("var : %d\n", var );
			if( var > 255 ) var = 255;
			// if we don't have an index on the current character in the 
			// table, then add it pure, else, encode it
			if( _rfc3986[ var ] ) 
			{
				pos = sprintf( enc, "%c", (char)_rfc3986[ var ] );
			}
			else 
			{
				pos = sprintf( enc, "%%%02X", ( unsigned char)*src );
			}
			printf("Add: %d  c : %c intsrc %d rfc %c\n", pos, *src, (int)*src, _rfc3986[ var ] );
			enc += pos;
			
			//while( *( ++enc ) != 0 ){ printf("|");};
			printf("\n");
		}
		*/
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

static inline void preKmp(char *x, int m, int *kmpNext )
{
	int i, j;

	i = 0;
	j = kmpNext[0] = -1;
	
	while( i < m ) 
	{
		while( j > -1 && x[i] != x[j] )
		{
			j = kmpNext[ j ];
		}
		i++;
		j++;
		if( x[i] == x[j] )
		{
			kmpNext[ i ] = kmpNext[ j ];
		}
		else
		{
			kmpNext[ i ] = j;
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

FQUAD FindInBinaryPOS( char *findString, int m, char *findIn, FQUAD n) 
{
	FQUAD j;
	int i;
	//int kmpNext[ m ];
	int *kmpNext;
	kmpNext = FMalloc( (m+1)*sizeof(int) );
	if( kmpNext == NULL )
	{
		DEBUG("Cannot allocate memory for kmpNext!\n");
		return -1;
	}

	// Preprocessing 
	preKmp( findString, m, kmpNext );

	// Searching 
	j = 0;
	i = 0;

	while( j < n ) 
	{
		//printf("find j %ld i %d\n", j, i );
		
		while( i > -1 && findString[ i ] != findIn[ j ] )
		{
			i = kmpNext[ i ];
		}
		i++;
		j++;
		
		if( i >= m )
		{
			FFree( kmpNext );
			return j-i;
		}
	}
	FFree( kmpNext );
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
	
	if( *str != NULL )
	{
		FFree ( *str );
		*str = NULL;
	}
	
	*str = FCallocAlign( ( SHIFT_LEFT( SHA_DIGEST_LENGTH, 1) ) + 1, 1 );
	if( *str != NULL )
	{
		char *buf = *str;
		SHA1( ( unsigned char *)*str, strlen( *str ), temp);

		int i = 0;
		for ( ; i < SHA_DIGEST_LENGTH; i++ )
		{
			sprintf( (char*)&(buf[ SHIFT_LEFT( i, 1) ]), "%02x", temp[i] );
		}

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
		char *ret = FMalloc( (size<<1)+1 ); // * 2 == <<1
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

#include <uchar.h>
#include <locale.h>

#define __STD_UTF_16__

//Pointer arrays must always include the array size, because pointers do not know about the size of the supposed array size.
void utf8_to_utf16(unsigned char* const utf8_str, int utf8_str_size, char16_t* utf16_str_output, int utf16_str_output_size) {
	//First, grab the first byte of the UTF-8 string
	unsigned char* utf8_currentCodeUnit = utf8_str;
	char16_t* utf16_currentCodeUnit = utf16_str_output;
	int utf8_str_iterator = 0;
	int utf16_str_iterator = 0;

	//In a while loop, we check if the UTF-16 iterator is less than the max output size. If true, then we check if UTF-8 iterator
	//is less than UTF-8 max string size. This conditional checking based on order of precedence is intentionally done so it
	//prevents the while loop from continuing onwards if the iterators are outside of the intended sizes.
	while (*utf8_currentCodeUnit && (utf16_str_iterator < utf16_str_output_size || utf8_str_iterator < utf8_str_size)) {
		//Figure out the current code unit to determine the range. It is split into 6 main groups, each of which handles the data
		//differently from one another.
		if (*utf8_currentCodeUnit < 0x80) {
			//0..127, the ASCII range.

			//We directly plug in the values to the UTF-16 code unit.
			*utf16_currentCodeUnit = (char16_t) (*utf8_currentCodeUnit);
			utf16_currentCodeUnit++;
			utf16_str_iterator++;

			//Increment the current code unit pointer to the next code unit
			utf8_currentCodeUnit++;

			//Increment the iterator to keep track of where we are in the UTF-8 string
			utf8_str_iterator++;
		}
		else if (*utf8_currentCodeUnit < 0xC0) {
			//0x80..0xBF, we ignore. These are reserved for UTF-8 encoding.
			utf8_currentCodeUnit++;
			utf8_str_iterator++;
		}
		else if (*utf8_currentCodeUnit < 0xE0) {
			//128..2047, the extended ASCII range, and into the Basic Multilingual Plane.

			//Work on the first code unit.
			char16_t highShort = (char16_t) ((*utf8_currentCodeUnit) & 0x1F);

			//Increment the current code unit pointer to the next code unit
			utf8_currentCodeUnit++;

			//Work on the second code unit.
			char16_t lowShort = (char16_t) ((*utf8_currentCodeUnit) & 0x3F);

			//Increment the current code unit pointer to the next code unit
			utf8_currentCodeUnit++;

			//Create the UTF-16 code unit, then increment the iterator.
			//Credits to @tbeu. 
			//Thanks to @k6l2 for explaining why we need 6 instead of 8.
			//It's because 0x3F is 6 bits of information from the low short. By shifting 8 bits, you are 
			//adding 2 extra zeroes in between the actual data of both shorts.
			int unicode = (highShort << 6) | lowShort;

			//Check to make sure the "unicode" is in the range [0..D7FF] and [E000..FFFF].
			if ((0 <= unicode && unicode <= 0xD7FF) || (0xE000 <= unicode && unicode <= 0xFFFF)) {
				//Directly set the value to the UTF-16 code unit.
				*utf16_currentCodeUnit = (char16_t) unicode;
				utf16_currentCodeUnit++;
				utf16_str_iterator++;
			}

			//Increment the iterator to keep track of where we are in the UTF-8 string
			utf8_str_iterator += 2;
		}
		else if (*utf8_currentCodeUnit < 0xF0) {
			//2048..65535, the remaining Basic Multilingual Plane.

			//Work on the UTF-8 code units one by one.
			//If drawn out, it would be 1110aaaa 10bbbbcc 10ccdddd
			//Where a is 4th byte, b is 3rd byte, c is 2nd byte, and d is 1st byte.
			char16_t fourthChar = (char16_t) ((*utf8_currentCodeUnit) & 0xF);
			utf8_currentCodeUnit++;
			char16_t thirdChar = (char16_t) ((*utf8_currentCodeUnit) & 0x3C) >> 2;
			char16_t secondCharHigh = (char16_t) ((*utf8_currentCodeUnit) & 0x3);
			utf8_currentCodeUnit++;
			char16_t secondCharLow = (char16_t) ((*utf8_currentCodeUnit) & 0x30) >> 4;
			char16_t firstChar = (char16_t) ((*utf8_currentCodeUnit) & 0xF);
			utf8_currentCodeUnit++;

			//Create the resulting UTF-16 code unit, then increment the iterator.
			int unicode = (fourthChar << 12) | (thirdChar << 8) | (secondCharHigh << 6) | (secondCharLow << 4) | firstChar;

			//Check to make sure the "unicode" is in the range [0..D7FF] and [E000..FFFF].
			//According to math, UTF-8 encoded "unicode" should always fall within these two ranges.
			if ((0 <= unicode && unicode <= 0xD7FF) || (0xE000 <= unicode && unicode <= 0xFFFF)) {
				//Directly set the value to the UTF-16 code unit.
				*utf16_currentCodeUnit = (char16_t) unicode;
				utf16_currentCodeUnit++;
				utf16_str_iterator++;
			}

			//Increment the iterator to keep track of where we are in the UTF-8 string
			utf8_str_iterator += 3;
		}
		else if (*utf8_currentCodeUnit < 0xF8) {
			//65536..10FFFF, the Unicode UTF range

			//Work on the UTF-8 code units one by one.
			//If drawn out, it would be 11110abb 10bbcccc 10ddddee 10eeffff
			//Where a is 6th byte, b is 5th byte, c is 4th byte, and so on.
			char16_t sixthChar = (char16_t) ((*utf8_currentCodeUnit) & 0x4) >> 2;
			char16_t fifthCharHigh = (char16_t) ((*utf8_currentCodeUnit) & 0x3);
			utf8_currentCodeUnit++;
			char16_t fifthCharLow = (char16_t) ((*utf8_currentCodeUnit) & 0x30) >> 4;
			char16_t fourthChar = (char16_t) ((*utf8_currentCodeUnit) & 0xF);
			utf8_currentCodeUnit++;
			char16_t thirdChar = (char16_t) ((*utf8_currentCodeUnit) & 0x3C) >> 2;
			char16_t secondCharHigh = (char16_t) ((*utf8_currentCodeUnit) & 0x3);
			utf8_currentCodeUnit++;
			char16_t secondCharLow = (char16_t) ((*utf8_currentCodeUnit) & 0x30) >> 4;
			char16_t firstChar = (char16_t) ((*utf8_currentCodeUnit) & 0xF);
			utf8_currentCodeUnit++;

			int unicode = (sixthChar << 4) | (fifthCharHigh << 2) | fifthCharLow | (fourthChar << 12) | (thirdChar << 8) | (secondCharHigh << 6) | (secondCharLow << 4) | firstChar;
			char16_t highSurrogate = (unicode - 0x10000) / 0x400 + 0xD800;
			char16_t lowSurrogate = (unicode - 0x10000) % 0x400 + 0xDC00;

			//Set the UTF-16 code units
			*utf16_currentCodeUnit = lowSurrogate;
			utf16_currentCodeUnit++;
			utf16_str_iterator++;

			//Check to see if we're still below the output string size before continuing, otherwise, we cut off here.
			if (utf16_str_iterator < utf16_str_output_size) {
				*utf16_currentCodeUnit = highSurrogate;
				utf16_currentCodeUnit++;
				utf16_str_iterator++;
			}

			//Increment the iterator to keep track of where we are in the UTF-8 string
			utf8_str_iterator += 4;
		}
		else {
			//Invalid UTF-8 code unit, we ignore.
			utf8_currentCodeUnit++;
			utf8_str_iterator++;
		}
	}

	//We clean up the output string if the UTF-16 iterator is still less than the output string size.
	while (utf16_str_iterator < utf16_str_output_size) {
		*utf16_currentCodeUnit = '\0';
		utf16_currentCodeUnit++;
		utf16_str_iterator++;
	}
}

/*
 * The utf8_check() function scans the '\0'-terminated string starting
 * at s. It returns a pointer to the first byte of the first malformed
 * or overlong UTF-8 sequence found, or NULL if the string contains
 * only correct UTF-8. It also spots UTF-8 sequences that could cause
 * trouble if converted to UTF-16, namely surrogate characters
 * (U+D800..U+DFFF) and non-Unicode positions (U+FFFE..U+FFFF). This
 * routine is very likely to find a malformed sequence if the input
 * uses any other encoding than UTF-8. It therefore can be used as a
 * very effective heuristic for distinguishing between UTF-8 and other
 * encodings.
 *
 * I wrote this code mainly as a specification of functionality; there
 * are no doubt performance optimizations possible for certain CPUs.
 *
 * Markus Kuhn <http://www.cl.cam.ac.uk/~mgk25/> -- 2005-03-30
 * License: http://www.cl.cam.ac.uk/~mgk25/short-license.html
 */

#include <stdlib.h>

unsigned char *utf8_check(unsigned char *s)
{
	while( *s )
	{
		if( *s < 0x80 )
		{
		/* 0xxxxxxx */
			s++;
		}
		else if( (s[0] & 0xe0) == 0xc0 )
		{
			/* 110XXXXx 10xxxxxx */
			if( (s[1] & 0xc0) != 0x80 || ( s[0] & 0xfe) == 0xc0 )                        /* overlong? */
			{
				return s;
			}
			else
			{
				s += 2;
			}
		}
		else if( (s[0] & 0xf0) == 0xe0 )
		{
			/* 1110XXXX 10Xxxxxx 10xxxxxx */
			if( (s[1] & 0xc0) != 0x80 ||
				(s[2] & 0xc0) != 0x80 ||
				(s[0] == 0xe0 && (s[1] & 0xe0) == 0x80) ||    /* overlong? */
				(s[0] == 0xed && (s[1] & 0xe0) == 0xa0) ||    /* surrogate? */
				(s[0] == 0xef && s[1] == 0xbf &&
				(s[2] & 0xfe) == 0xbe))                      /* U+FFFE or U+FFFF? */
			{
				return s;
			}
			else
			{
				s += 3;
			}
		}
		else if( (s[0] & 0xf8) == 0xf0 )
		{
			/* 11110XXX 10XXxxxx 10xxxxxx 10xxxxxx */
			if( (s[1] & 0xc0) != 0x80 ||
				(s[2] & 0xc0) != 0x80 ||
				(s[3] & 0xc0) != 0x80 ||
				(s[0] == 0xf0 && (s[1] & 0xf0) == 0x80) ||    /* overlong? */
				(s[0] == 0xf4 && s[1] > 0x8f) || s[0] > 0xf4) /* > U+10FFFF? */
			{
				return s;
			}
			else
			{
				s += 4;
			}
		}
		else
		{
			return s;
		}
	}

  return NULL;
}
