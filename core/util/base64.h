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

void build_decoding_table();

//
//
//

void base64_cleanup();

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

char* Base64Decode( const unsigned char* data, unsigned int length, int *finalLength );

#endif
