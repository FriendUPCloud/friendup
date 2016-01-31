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


#ifndef URI_H_
#define URI_H_

#include <stdbool.h>
#include "util/hashmap.h"
#include <network/path.h>

//
// TODO: Protect against null-byte poisioning
// TODO: Validation
//

typedef struct Authority
{
	char* user;
	char* host;
	unsigned short port;
} Authority_t;

//
//
//

typedef struct Uri
{
	char*        scheme;
	Authority_t* authority;
	Path*      path;
	char*        queryRaw;
	Hashmap*   query;
	char*        fragment;
	BOOL         valid; // If an illegal character is found, this will be 0, else it'll be 1 (When validation is implemented...)
} Uri;

//
//
//

void UriTest();

Uri* UriNew();

Uri* UriParse( char* str );

Hashmap* UriParseQuery( char* query );

void UriFree( Uri* uri );

#endif