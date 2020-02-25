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
 *  Uri body
 *
 *  @author HT
 *  @date created 2014
 */

#include <core/types.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "network/uri.h"
#include "util/string.h"
#include "util/list.h"

/**
 * Create new Uri structure
 *
 * @return new Uri structure when success, otherwise NULL
 */

Uri* UriNew()
{
	Uri* uri = (Uri*) FCalloc( 1, sizeof( Uri ) );
	return uri;
}

/**
 * Get uri scheme from string
 *
 * @param str string with url
 * @param strLen length of provided string
 * @param next pointer to string after url scheme
 * @return new string with uri scheme
 */
char* UriGetScheme( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	'--'
	  '- Retrives this part
	*/
	char* ptrEnd = str;
	char c;
	for( unsigned int i = 0; i < strLen; i++ )
	{
		c = str[i];
		// The scheme is terminated with :
		if( c == ':' )
		{
			break;
		}
		// Check for disallowed characters in the scheme
		else if( !( CharIsAlpha( c ) || CharIsDigit( c ) || c == '+' || c == '-' || c == '.' ) )
		{
			// We found a disallowed character, this is not a scheme.
			return 0;
		}
		else
		{
			ptrEnd++;
		}
	}
	unsigned int len = ptrEnd - str;
	char* out = FCalloc( len + 32,sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
		StringToLowercase( out );
	}
	else
	{
		FERROR("Cannot alloc memory for URI\n");
	}
	*next = ptrEnd + 1;

	return out;
}

/**
 * Get authority from string
 *
 * @param str string with url
 * @param strLen length of provided string
 * @param next pointer to string after authority
 * @return new string with authority part
 */
char* UriGetAuthority( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	       '------------------'
	           '- Retrives this part
	*/
	if( strLen < 3 || str[0] != '/' || str[1] != '/' )
	{
		return 0;
	}

	char* ptrEnd = str + strLen;
	for( unsigned int i = 2; i < strLen; i++ )
	{
		if( str[i] == '/' || str[i] == '?' || str[i] == '#' )
		{
			ptrEnd = str + i;
			break;
		}
	}
	if( ptrEnd == str )
	{
		return 0;
	}

	str += 2;
	unsigned int len = ptrEnd - str;
	if( !len )
	{
		FERROR("URI getauthority fail\n");
		return 0;
	}
	char* out = FCalloc( len + 1, sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
	}
	else
	{
		FERROR("Authority fail\n");
	}
	*next = ptrEnd;

	return out;
}

/**
 * Get authority from string
 *
 * @param str string with url
 * @return new Authority structure when succes, otherwise NULL
 */
Authority *UriParseAuthority( char* str )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	       '------------------'
	           '- Parses this part into the 3 parts
	*/
	unsigned int strLen = strlen( str );
	unsigned int userLen = 0;

	Authority *authority = (Authority*) FCalloc( 1, sizeof( Authority ) );

	// Get user (Ignore empty strings)
	char* userEnd = memchr( str, '@', strLen );
	if( userEnd )
	{
		userLen = userEnd - str;
		if( userLen )
		{
			char* userStr = FCalloc( userLen + 1, sizeof(char) );
			if( userStr != NULL )
			{
				memcpy( userStr, str, userLen );
				userStr[userLen] = 0;
				authority->user = userStr;
			}
			else
			{
				FERROR("UriParseAuthority calloc fail\n");
			}
		}
		userEnd++;
	}
	else
	{
		userEnd = str;
	}

	// Get host (Ignore empty strings)
	char* hostEnd = memchr( userEnd, ']', strLen - userLen ); // IP literal?
	if( !hostEnd )
	{
		hostEnd = memchr( userEnd, ':', strLen - userLen );
	}
	else
	{
		hostEnd++;
	}
	
	if( !hostEnd )
	{
		hostEnd = str + strLen;
	}
	
	unsigned int hostLen = hostEnd - userEnd;
	if( hostLen )
	{
		char* hostStr = FCalloc( hostLen + 1, sizeof(char) );
		if( hostStr != NULL )
		{
			memcpy( hostStr, userEnd, hostLen );
			hostStr[hostLen] = 0;
			authority->host = hostStr;
		}
		else
		{
			FERROR("Cannot allocate memory in Uriauth\n");
			return NULL;
		}
	}

	// Get port (Ignore empty strings)
	if( hostEnd != str + strLen )
	{
		unsigned int portLen = strLen - ( hostEnd + 1 - str );
		if( portLen )
		{
			// We could possible avoid a calloc here by passing the str and strlen.
			// Could save a cycle or two if we're desperate...
			char* portStr = FCalloc( portLen + 1, sizeof(char) );
			if( portStr != NULL )
			{
				memcpy( portStr, hostEnd + 1, portLen );
				portStr[portLen] = 0;
				unsigned int port = StringParseUInt( portStr );

				authority->port = port;
				FFree( portStr ); // We don't need this anymore...
			}
			else
			{
				FERROR("Cannot allocate memory for string\n");
			}
		}
	}
	return authority;
}

/**
 * Get path from string
 *
 * @param str string with url
 * @param strLen length of provided string
 * @param next pointer to string after authority
 * @return new string with authority part
 */
char* UriGetPath( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                           '---'
	         Retrives this part -'
	*/
	char* ptrEnd = str + strLen;
	for( unsigned int i = 0; i < strLen; i++ )
	{
		// %3C <  %3E >
		if( str[i] == '%' )
		{
			if( str[i+1] == '3' && (str[i+2] == 'C' || str[i+2] == 'E') )
			{
				str[i] = ' ';
			}
			else if( str[i+1] == '2' && str[i+2] == '2' )
			{
				str[i] = ' ';
			}
		}
		if( str[i] == '?' || str[i] == '#' )
		{
			ptrEnd = str + i;
			break;
		}
	}
	if( ptrEnd == str )
	{
		return NULL;
	}

	unsigned int len = ptrEnd - str;
	if( len > 0 )
	{
		char* out = FCalloc( len + 1, sizeof(char) );
		if( out != NULL )
		{
			memcpy( out, str, len );
			out[len] = 0;
		}
		else
		{
			FERROR("Get Uri Path memory alloc error\n");
		}
		*next = ptrEnd;

		return out;
	}
	return NULL;
}

/**
 * Get query  from string
 *
 * @param str string with url
 * @param strLen length of provided string
 * @param next pointer to string after authority
 * @return new string with query part
 */
char* UriGetQuery( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                '--------'
	                 Retrives this part -'
	*/
	if( str[0] != '?' )
	{
		FERROR("First sign is not equal to '?'\n");
		return 0;
	}

	char* strEnd = memchr( str, '#', strLen );
	if( !strEnd )
	{
		strEnd = str + strLen;
	}
	str++;

	char* out = NULL;
	unsigned int len = strEnd - str;
	if( len > 0 )
	{
		out = FCalloc( len + 1, sizeof(char) );
		if( out != NULL )
		{
			memcpy( out, str, len );
			out[len] = 0;
		}
		else
		{
			FERROR("Cannot allocate memory in UriGetQuery\n");
		}
	}
	*next = strEnd;
	return out;
}

/**
 * Get query in Hashmap form
 *
 * @param query string with query
 * @return new Hashmap structure when success, otherwise NULL
 */
Hashmap* UriParseQuery( char* query )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                 '--------'
	                   Parses this part -'
	*/
	if( query == NULL )
	{
		return NULL;
	}
	Hashmap* map = HashmapNew();
	if( map == NULL )
	{
		FERROR("Map was not created\n");
		return NULL;
	}
	
	int queryLen = strlen( query );
	if( queryLen <= 0 )
	{
		FERROR("Lenght of query is <= 0\n");
		return NULL;
	}
	
	if( query[0] == '?' ) query++;
	
	char* keyPtr = query;
	unsigned int keySize = 0;
	char* valuePtr = NULL;
	bool inValue = false;
	int braces = 0;
	int qbraces = 0;
	
	for( unsigned int i = 0 ;; i++ )
	{
		// getting json ( data inside braces {} )
		if( query[i] == '{' )
		{
			int spos = i;	// start position
			braces++;
			
			while( braces > 0 )
			{
				if( query[i] == '}' )
				{
					braces--;
				}
				else if( query[i] == '{' )
				{
					braces++;
				}
				else if( query[i] == 0 || query[i] == '\r' )
				{
					braces = 0;
					break;
				}
				i++;
			}
			
			char *c = StringDuplicateN( &(query[spos]), i-spos );
			if( HashmapPut( map, StringDuplicate("post_json"), c ) == MAP_OK )
			{
				DEBUG("POSTJSON1 - %s -\n", c );
			}
			
			if( i <= queryLen )
			{
				break;
			}
		}
		else
		// getting json ( data inside braces [] )
		if( query[i] == '[' )
		{
			int spos = i;	// start position
			qbraces++;
			
			while( qbraces > 0 )
			{
				if( query[i] == ']' )
				{
					qbraces--;
				}
				else if( query[i] == '[' )
				{
					qbraces++;
				}
				else if( query[i] == 0 || query[i] == '\r' )
				{
					qbraces = 0;
					break;
				}
				i++;
			}
			
			char *c = StringDuplicateN( &(query[spos]), i-spos );
			if( HashmapPut( map, StringDuplicate("post_json_tab"), c ) == MAP_OK )
			{
				DEBUG("POSTJSON1 - %s -\n", c );
			}
			i++;
		}
		
		// The first = is a sub-separator. Any more ='s will be assumed part of the value
		if( !inValue && query[i] == '=' )
		{
			valuePtr = query + i + 1;
			keySize = valuePtr - keyPtr - 1;
			inValue = true;
		}
		// If we hit a & separator or the end of the query, add the latest value
		if( query[i] == '&' || query[i] == 0 || query[i] == '#' )
		{
			char* key = NULL;
			char* value = NULL;

			// If we don't have a key, there's no reason to insert anything else
			if( keySize > 0 )
			{
				// But a value is optional
				if( inValue )
				{
					key = StringDuplicateN( keyPtr, valuePtr - keyPtr - 1 );
					value = StringDuplicateN( valuePtr, ( query + i ) - valuePtr );
				}
				else key = StringDuplicateN( keyPtr, ( query + i ) - keyPtr );
				
				keyPtr = query + i + 1;
				inValue = false;
				if( key )
				{
					// TODO: Add support for ?arr[]=something&arr[]=more
					if( HashmapPut( map, key, value ) == MAP_OK )
					{
					}
					// Couldn't add hto hashmap sadly..
					else 
					{
						if( value ) FFree( value );
						FFree( key );
					}
				}
			}
			key = NULL;
			value = NULL;
		}
		if( query[i] == 0 || query[i] == '#' )
		{
			break;
		}
	}
	return map;
}

/**
 * Get last part of path
 *
 * @param str string with url
 * @param strLen length of provided string
 * @param next pointer to string after path
 * @return new string with last path part
 */
char* UriGetFragment( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                            '------'
	                           Retrives this part -'
	*/
	if( strLen == 1 || *str++ != '#' )
		return 0;

	char* out = FCalloc( strLen + 1 , sizeof(char));
	if( out != NULL )
	{
		memcpy( out, str, strLen );
		out[strLen] = 0;
	}
	else
	{
		FERROR("Cannot alloc memory in UriGetFragment\n");
	}

	*next = str + strLen;
	return out;
}

/**
 * Parse url and return it as Uri structure
 *
 * @param str string with url
 * @return new Uri structure when success, otherwise NULL
 */
Uri* UriParse( char* str )
{
	if (str == NULL){ //BG-355
		return NULL;
	}
	Uri* uri = UriNew();
	unsigned int strLen = strlen( str );
	unsigned int remainingLen = strLen;
	char* end = str + strLen;
	char* next = str;

	// Get scheme -------------------------------------------------------------
	char* scheme = UriGetScheme( str, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( scheme )
	{
		uri->scheme = scheme;
	}
	
	if( next >= end )
	{
		return uri;
	}

	// Get authority ----------------------------------------------------------
	char* authority = UriGetAuthority( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( authority )
	{
		uri->authority = UriParseAuthority( authority );
		free( authority );
	}
	
	if( next >= end )
	{
		return uri;
	}
	
	// Get path ---------------------------------------------------------------
	char* pathRaw = UriGetPath( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( pathRaw != NULL )
	{
		uri->path = PathNew( pathRaw );
		free( pathRaw );
	}

	if( next >= end )
	{
		return uri;
	}

	// Get query --------------------------------------------------------------
	char* query = UriGetQuery( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( query != NULL )
	{
		uri->query = UriParseQuery( query );
		uri->queryRaw = query;
	}

	if( next >= end )
	{
		return uri;
	}

	// Get fragment -----------------------------------------------------------
	char* fragment = UriGetFragment( next, remainingLen, &next );
	if( fragment )
	{
		uri->fragment = fragment;
	}

	return uri;
}

/**
 * Internal UriTest routine
 */
void UriTest()
{
	char* testUris[] = {
		"FTP://ftp.is.co.za/rfc/rfc1808.txt",
		"http://www.ietf.org/rfc/rfc2396.txt",

		
		"ldap://[2001:db8::7]/c=GB?objectClass?one",
		"mailto:John.Doe@example.com",
		"news:comp.infosystems.www.servers.unix",
		"tel:+1-816-555-1212",
		"telnet://192.0.2.16:80/",
		"urn:oasis:names:specification:docbook:dtd:xml:4.1.2",

		// Break tests
		"http://someone@example.org/noewhere.txt",
		"http://someone@example.org:1337/noewhere.txt",
		"http://someone@:1337/noewhere.txt",
		"http://someone:1337/noewhere.txt",
		"http://someone@example.org:/noewhere.txt",
		"http://someone@:/noewhere.txt",
		"http://e@example.org/noewhere.txt",
		"http://@example.org/noewhere.txt",
		"http://@example.org:1337/noewhere.txt",
		"http://@example.org:/noewhere.txt",

		"ldap://someone@[2001:db8::7]:1337/c=GB?objectClass?one",
		"ldap://[2001:db8::7]:1337/c=GB?objectClass?one",
		"ldap://@[2001:db8::7]:1337/c=GB?objectClass?one",
		"ldap://someone@[2001:db8::7]/c=GB?objectClass?one",
		"ldap://someone@[2001:db8::7]:/c=GB?objectClass?one",

		"//someone@[2001:db8::7]:1337/c=GB?objectClass?one",
		"lda=)/&(p://someone@[2001:db8::7]:1337/c=GB?objectClass?one",

		"la:la/land?ya#h",
		"la:la//land?ya#h",
		"//la:la/land?ya#h",
		"/la:la/land?ya#h",
		"./la:la/land?ya#h",

		"http://www.ietf.org/yeay?1this=_that_&2that=&3this=_=that_&=nope&=&&=",
		"http://someone@example.org:1337/noewhere.txt?Yarr=We're here boys!&%20=%20&NOPE=/#fraggy",

		"http://user@domain.com:1337/some/path/?query=true&works=probably#a_fragment",
		"http://user@domain.com:1337/some/path/?query=true&works=probably#a_fragment",

		"the end"
	};

	for( unsigned int i = 0; i < ( ( sizeof( testUris ) / sizeof(char*) ) - 1 ); i++ )
	{
		Uri* uri = UriParse( testUris[i] );
		UriFree( uri );
	}
}

/**
 * Delete Uri
 *
 * @param uri pointer to Uri structure which will be deleted
 */
void UriFree( Uri* uri )
{
	if( !uri )
	{
		return;
	}

	if( uri->scheme )
	{
		FFree( uri->scheme );
		uri->scheme = NULL;
	}

	if( uri->authority )
	{
		if( uri->authority->user )
		{
			FFree( uri->authority->user );
			uri->authority->user = NULL;
		}

		if( uri->authority->host )
		{
			FFree( uri->authority->host );
			uri->authority->host = NULL;
		}

		FFree( uri->authority );
		uri->authority = NULL;
	}

	if( uri->path )
	{
		PathFree( uri->path );
		uri->path = NULL;
	}

	if( uri->query )
	{
		unsigned int iterator = 0;
		HashmapElement* e = NULL;
		while( ( e = HashmapIterate( uri->query, &iterator ) ) != NULL )
		{
			if( e->data != NULL )
			{
				FFree( e->data );
				e->data = NULL;
			}
			FFree( e->key );
			e->key = NULL;
		}
		HashmapFree( uri->query );
		uri->query = NULL;
	}

	if( uri->queryRaw )
	{
		FFree( uri->queryRaw );
		uri->queryRaw = NULL;
	}
	
	if( uri->fragment )
	{
		FFree( uri->fragment );
		uri->fragment = NULL;
	}

	FFree( uri );
}

