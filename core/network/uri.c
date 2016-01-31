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

#include <core/types.h>
#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "network/uri.h"
#include "util/string.h"
#include "util/list.h"

//
//
//

Uri* UriNew()
{
	Uri* uri = (Uri*) FCalloc( 1, sizeof( Uri ) );
	return uri;
}

//
//
//

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
	char* out = calloc( len + 1,sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
		StringToLowercase( out );
	}
	else
	{
		ERROR("Cannot alloc memory for URI\n");
	}
	*next = ptrEnd + 1;

	return out;
}

//
//
//

char* UriGetAuthority( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	       '------------------'
	           '- Retrives this part
	*/
	if( strLen < 3 || str[0] != '/' || str[1] != '/' )
	{
		//printf("No authority.\n");
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
		ERROR("URI getauthority fail\n");
		return 0;
	}
	char* out = calloc( len + 1, sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
	}
	else
	{
		ERROR("Authority fail\n");
	}
	*next = ptrEnd;

	return out;
}

//
//
//

Authority_t* UriParseAuthority( char* str )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	       '------------------'
	           '- Parses this part into the 3 parts
	*/
	unsigned int strLen = strlen( str );
	unsigned int userLen = 0;

	Authority_t* authority = (Authority_t*) calloc( 1, sizeof( Authority_t ) );

	// Get user (Ignore empty strings)
	char* userEnd = memchr( str, '@', strLen );
	if( userEnd )
	{
		userLen = userEnd - str;
		if( userLen )
		{
			char* userStr = calloc( userLen + 1, sizeof(char) );
			if( userStr != NULL )
			{
				memcpy( userStr, str, userLen );
				userStr[userLen] = 0;
				DEBUG("User:      %s (%d)\n", userStr, userLen);
				authority->user = userStr;
			}
			else
			{
				ERROR("UriParseAuthority calloc fail\n");
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
		char* hostStr = calloc( hostLen + 1, sizeof(char) );
		if( hostStr != NULL )
		{
			memcpy( hostStr, userEnd, hostLen );
			hostStr[hostLen] = 0;
			DEBUG("Host:      %s (%d)\n", hostStr, hostLen);
			authority->host = hostStr;
		}
		else
		{
			ERROR("Cannot allocate memory in Uriauth\n");
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
			char* portStr = calloc( portLen + 1, sizeof(char) );
			if( portStr != NULL )
			{
				memcpy( portStr, hostEnd + 1, portLen );
				portStr[portLen] = 0;
				unsigned int port = StringParseUInt( portStr );
				DEBUG("Port:      %d (%s (%d))\n", port, portStr, portLen);
				authority->port = port;
				free( portStr ); // We don't need this anymore...
			}
			else
			{
				ERROR("Cannot allocate memory for string\n");
			}
		}
	}
	return authority;
}

//
//
//

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
		if( str[i] == '?' || str[i] == '#' )
		{
			ptrEnd = str + i;
			break;
		}
	}
	if( ptrEnd == str )
		return 0;

	unsigned int len = ptrEnd - str;
	char* out = calloc( len + 1, sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
	}
	else
	{
		ERROR("Get Uri Path memory alloc error\n");
	}
	*next = ptrEnd;

	return out;
}

//
//
//

char* UriGetQuery( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                '--------'
	                 Retrives this part -'
	*/
	if( str[0] != '?' )
	{
		ERROR("First sign is not equal to '?'\n");
		return 0;
	}

	char* strEnd = memchr( str, '#', strLen );
	if( !strEnd )
	{
		strEnd = str + strLen;
	}
	str++;

	unsigned int len = strEnd - str;
	char* out = calloc( len + 1, sizeof(char) );
	if( out != NULL )
	{
		memcpy( out, str, len );
		out[len] = 0;
	}
	else
	{
		ERROR("Cannot allocate memory in UriGetQuery\n");
	}
	*next = strEnd;
	return out;
}

//
//
//

Hashmap* UriParseQuery( char* query )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                 '--------'
	                   Parses this part -'
	*/
	Hashmap* map = HashmapNew();
	if( map == NULL )
	{
		ERROR("Map was not created\n");
		return NULL;
	}
	
	if( query[0] == '?' ) query++;
	
	char* keyPtr = query;
	unsigned int keySize = 0;
	char* valuePtr = NULL;
	bool inValue = false;
	for( unsigned int i = 0 ;; i++ )
	{
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
					if( HashmapPut( map, key, value ) )
					{
						DEBUG( "[UriParseQuery] Key:       %s => %s\n", key, value ? value : "" );
					}
					else free( key );
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

//
// So simple :)
//

char* UriGetFragment( char* str, unsigned int strLen, char** next )
{
	/*
	http://user@domain.com:port/path?query=true#fragment
	                                            '------'
	                           Retrives this part -'
	*/
	if( strLen == 1 || *str++ != '#' )
		return 0;

	char* out = calloc( strLen + 1 , sizeof(char));
	if( out != NULL )
	{
		memcpy( out, str, strLen );
		out[strLen] = 0;
	}
	else
	{
		ERROR("Cannot alloc memory in UriGetFragment\n");
	}

	*next = str + strLen;
	return out;
}

//
//
//

Uri* UriParse( char* str )
{
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
		printf( "Scheme:    %s\n", scheme );
		uri->scheme = scheme;
	}
	if( next >= end )
		return uri;

	// Get authority ----------------------------------------------------------
	char* authority = UriGetAuthority( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( authority )
	{
		uri->authority = UriParseAuthority( authority );
		printf( "Authority: %s\n", authority );
		free( authority );
	}
	if( next >= end )
		return uri;
	
	// Get path ---------------------------------------------------------------
	char* pathRaw = UriGetPath( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( pathRaw )
	{
		uri->path = PathNew( pathRaw );
		free( pathRaw );
	}

	if( next >= end )
		return uri;

	// Get query --------------------------------------------------------------
	char* query = UriGetQuery( next, remainingLen, &next );
	remainingLen = strLen - ( next - str );
	if( query )
	{
		uri->query = UriParseQuery( query );
		uri->queryRaw = query;
		printf( "Query:     %s\n", query);
		//free( query );
	}

	if( next >= end )
		return uri;

	// Get fragment -----------------------------------------------------------
	char* fragment = UriGetFragment( next, remainingLen, &next );
	if( fragment )
	{
		printf( "Fragment:  %s\n", fragment);
		uri->fragment = fragment;
	}

	// ------------------------------------------------------------------------

	return uri;
}

//
//
//

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

//
//
//

void UriFree( Uri* uri )
{
	if( !uri )
		return;

	if( uri->scheme )
	{
		free( uri->scheme );
		uri->scheme = NULL;
	}

	if( uri->authority )
	{
		if( uri->authority->user )
			free( uri->authority->user );
		uri->authority->user = NULL;

		if( uri->authority->host )
			free( uri->authority->host );
		uri->authority->host = NULL;

		free( uri->authority );
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
				free( e->data );
			e->data = NULL;
			free( e->key );
			e->key = NULL;
		}
		HashmapFree( uri->query );
		uri->query = NULL;
	}

	if( uri->queryRaw )
	{
		free( uri->queryRaw );
		uri->queryRaw = NULL;
	}
	
	if( uri->fragment )
	{
		free( uri->fragment );
		uri->fragment = NULL;
	}

	free( uri );
}
