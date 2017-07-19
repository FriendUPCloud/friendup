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

/** @file
 * 
 *  Uri definitions
 *
 *  @author HT
 *  @date created 2014
 */

#ifndef URI_H_
#define URI_H_

#include <core/types.h>
#include "util/hashmap.h"
#include <network/path.h>

//
//
//

typedef struct Authority
{
	char                  *user;
	char                  *host;
	unsigned short  port;
} Authority;

//
//
//

typedef struct Uri
{
	char                *scheme;
	Authority         *authority;
	Path                 *path;
	char                 *queryRaw;
	Hashmap         *query;
	char                 *fragment;
	FBOOL             valid; // If an illegal character is found, this will be 0, else it'll be 1 (When validation is implemented...)
} Uri;

//
//
//

void UriTest();

//
//
//

Uri* UriNew();

//
//
//

Uri* UriParse( char* str );

//
//
//

Hashmap* UriParseQuery( char* query );

//
//
//

void UriFree( Uri* uri );

#endif