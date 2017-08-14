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

#ifndef __WEBUTIL_H__
#define __WEBUTIL_H__

#include <stdio.h>
#include <util/log/log.h>

// 
// Some helper functions on http data
//

// Find where the headers start -1 on fail >= 0 on success
int FindEmbeddedHeaders( char *data, int dataLength );

// Strip headers
int StripEmbeddedHeaders( char **data, unsigned int dataLength );

char *CheckEmbeddedHeaders( char *data, int dataLength, const char *header );

// Decode string
int UrlDecodeSyslib( char* dst, const char* src );

#endif // __WEBUTIL_H__
