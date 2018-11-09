/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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