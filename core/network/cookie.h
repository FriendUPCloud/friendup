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