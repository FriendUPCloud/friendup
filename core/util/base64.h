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
 * Base64 Encode    definitions
 *
 *  @author 
 *  @date created 28 Nov 2014
 */

#ifndef __UTIL_BASE64_H__
#define __UTIL_BASE64_H__

//
//
//

char* Base64Encode( const unsigned char* data, int length, int *dstlen );

//
//
//

char *Base64EncodeString( const unsigned char *chr );

//
//
//

char *MarkAndBase64EncodeString( const char *chr );

//
//
//

char* Base64Decode( const unsigned char* data, int length, int *finalLength );

#endif
