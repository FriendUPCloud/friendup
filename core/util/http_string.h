/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
