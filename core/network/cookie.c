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

/**
 * @file
 *
 * Cookies
 *
 * @author ML
 * @date
 */

#include <string.h>
#include <stdlib.h>

#include <core/types.h>
#include <util/string.h>
#include <network/cookie.h>
#include <util/log/log.h>

// ----------------------------------------------------------------------------
//
// Parsing cookies
//
// ----------------------------------------------------------------------------

// Parse server cookies (The Set-Cookie field type cookie)
void CookieParse( char* str )
{	
	return;
}

// ----------------------------------------------------------------------------
//
// Creating cookies
//
// ----------------------------------------------------------------------------

// Creating a server cookie (Name is optional)

Cookie* CookieNew( char* name, char* value )
{
	if( !name || !value )
	{
		return NULL;
	}
	Cookie* cookie = (Cookie*) FCalloc( 1, sizeof( Cookie ) );
	if( !cookie )
	{
		return NULL;
	}
	cookie->name = StringDuplicate( name );
	cookie->value = StringDuplicate( value );
	return cookie;
}

//
// Set the expire field
//

void CookieExpires( Cookie* cookie, time_t date )
{
	return;
}

//
// Set the path field
//

void CookiePath( Cookie* cookie, char* path )
{
	if( cookie->path )
	{
		free( cookie->path );
	}
	if( path )
	{
		cookie->path = StringDuplicate( path );
	}
	return;
}

//
// Set the domain field
//

void CookieDomain( Cookie* cookie, char* domain )
{
	if( cookie->domain )
	{
		free( cookie->domain );
	}
	if( domain )
	{
		cookie->domain = StringDuplicate( domain );
	}
	return;
}

//
// Should this cookie only be transmitted over HTTPS?
//

void CookieSecure( Cookie *cookie, int secure )
{
	if( cookie )
	{
		cookie->secure = secure ? 1 : 0;
	}
	return;
}

//
// Should this cookie be available through HTTP(S) only? (Javascript cannot access such cookies)
//

void CookieHttpOnly( Cookie* cookie, int httpOnly )
{
	if( cookie )
	{
		cookie->httpOnly = httpOnly ? 1 : 0;
	}
	return;
}

//
// Set-Cookie: value[; expires=date][; domain=domain][; path=path][; secure]
// Stringify the cookie object
//

char* CookieMake( Cookie* cookie )
{
	if( !cookie->value || !cookie->name )
	{
		return NULL;
	}

	// Determine the size of the completed cookie string ----------------------
	int size = strlen( cookie->name ) + 1 + strlen( cookie->value );

	if( cookie->expiresStr )
	{
		size += 2 + 8 + strlen( cookie->expiresStr ); // "; Expires="
	}

	if( cookie->domain )
	{
		size += 2 + 7 + strlen( cookie->domain ); // "; Domain="
	}

	if( cookie->path )
	{
		size += 2 + 5 + strlen( cookie->path ); // "; Path="
	}

	if( cookie->secure )
	{
		size += 2 + 6; //"; Secure"
	}

	if( cookie->httpOnly )
	{
		size += 2 + 8; //"; HttpOnly"
	}

	// Allocate the required memory -------------------------------------------
	char* str = calloc( size + 1, sizeof(char) );
	if( !str )
	{
		FERROR("Cannot allocate memory for string\n");
		return NULL;
	}
	str[size] = 0;

	// Copy the strings -------------------------------------------------------
	char* ptrDst = str;
	char* ptrSrc = cookie->name;

	while(*ptrSrc)
	{
		*(ptrDst++) = *(ptrSrc++);
	}
	*(ptrDst++) = '=';
	ptrSrc = cookie->value;
	
	while(*ptrSrc)
	{
		*(ptrDst++) = *(ptrSrc++);
	}

	if( cookie->expiresStr )
	{
		const char* EXPIRES = "; Expires=";
		ptrSrc = (char*)EXPIRES;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
		ptrSrc = cookie->expiresStr;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
	}

	if( cookie->domain )
	{
		const char* DOMAIN = "; Domain=";
		ptrSrc = (char*)DOMAIN;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
		ptrSrc = cookie->domain;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
	}

	if( cookie->path )
	{
		const char* PATH = "; Path=";
		ptrSrc = (char*)PATH;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
		ptrSrc = cookie->path;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
	}

	if( cookie->secure )
	{
		const char* SECURE = "; Secure";
		ptrSrc = (char*)SECURE;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
	}

	if( cookie->httpOnly )
	{
		const char* HTTPONLY = "; HttpOnly";
		ptrSrc = (char*)HTTPONLY;
		while(*ptrSrc)
		{
			*(ptrDst++) = *(ptrSrc++);
		}
	}

	return str;
}

//
//
//

void CookieDelete( Cookie* cookie )
{
	if( cookie->name )
	{
		free( cookie->name );
	}
	if( cookie->value )
	{
		StringSecureFree( cookie->value );
	}
	if( cookie->expiresStr )
	{
		free( cookie->expiresStr );
	}
	if( cookie->path )
	{
		free( cookie->path );
	}
	if( cookie->domain )
	{
		free( cookie->domain );
	}
	free( cookie );
	
	return;
}
