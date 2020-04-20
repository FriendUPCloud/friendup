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
	char					*a_User;
	char					*a_Host;
	unsigned short			a_Port;
} Authority;

//
//
//

typedef struct Uri
{
	char				*uri_Scheme;
	Authority			*uri_Authority;
	Path				*uri_Path;
	char				*uri_QueryRaw;
	Hashmap				*uri_Query;
	char				*uri_Fragment;
	FBOOL				uri_Redirect;
	FBOOL				uri_Valid; // If an illegal character is found, this will be 0, else it'll be 1 (When validation is implemented...)
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
