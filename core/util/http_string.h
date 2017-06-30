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


//
// http string
//

#ifndef __UTIL_HTTP_STRING_H__
#define __UTIL_HTTP_STRING_H__

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <core/types.h>
#include <network/http.h>

#define BUF_STRING_MAX 1024 * 12

//
// BufferString structure
//

typedef struct HttpString
{
	int             ht_Size;        // current data size
	int             ht_Bufsize;     // buffer size
	int             ht_MAX_SIZE;    // maximum size
	char           *ht_Buffer;      // pointer to buffer
	
	Http			*ht_Reqest;		// pointer  to Http request
} HttpString;

//
// Create Http String
//

HttpString *HttpStringNew( int bufsize );

//
// Delete Http String
//

void HttpStringDelete( HttpString *bs );

//
// Add Data to Buffer
//

int HttpStringAdd( HttpString *bs, const char *add, int size );


#endif //__UTIL_HTTP_STRING_H__
