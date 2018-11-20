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
	char                 *scheme;
	Authority            *authority;
	Path                 *path;
	char                 *queryRaw;
	Hashmap              *query;
	char                 *fragment;
	FBOOL                 redirect;
	FBOOL                 valid; // If an illegal character is found, this will be 0, else it'll be 1 (When validation is implemented...)
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
