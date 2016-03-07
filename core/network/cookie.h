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

#ifndef __NETWORK_COOKIES_H__
#define __NETWORK_COOKIES_H__

#include "time.h"

//
// structure
//

typedef struct Cookie
{
	char*  name;
	char*  value;
	char*  expiresStr;
	time_t expiresTime;
	char*  path;
	char*  domain;
	int    secure;
	int    httpOnly;
} Cookie;

//
// functions
//

void CookieParse( char* str );

Cookie* CookieNew( char* name, char* value );

void CookieExpires( Cookie* cookie, time_t date );

void CookieMaxAge( Cookie* cookie, unsigned int seconds );

void CookiePath( Cookie* cookie, char* path );

void CookieDomain( Cookie* cookie, char* domain );

void CookieSecure( Cookie* cookie, int secure );

void CookieHttpOnly( Cookie* cookie, int httpOnly );

char* CookieMake( Cookie* cookie );

void CookieDelete( Cookie* cookie );

#endif
