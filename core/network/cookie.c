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
		ERROR("Cannot allocate memory for string\n");
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
