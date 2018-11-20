/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#ifndef __WEBUTIL_H__
#define __WEBUTIL_H__

#include <stdio.h>
#include <util/log/log.h>

// 
// Some helper functions on http data
//

//
// Find where the headers start -1 on fail >= 0 on success
//

int FindEmbeddedHeaders( char *data, int dataLength );

//
// Strip headers
//

int StripEmbeddedHeaders( char **data, unsigned int dataLength );

//
//
//

char *CheckEmbeddedHeaders( char *data, int dataLength, const char *header );

//
// Decode string
//

int UrlDecodeSyslib( char* dst, const char* src );

#endif // __WEBUTIL_H__
