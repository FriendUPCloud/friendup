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


#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <openssl/md5.h>
#include <util/log/log.h>

/*
void compute_md5(char *str, unsigned char digest[16]) {
    MD5Context ctx;
    MD5Init(&ctx);
    MD5Update(&ctx, str, strlen(str));
    MD5Final(digest, &ctx);
}
*/

char *StrToMD5Str( char *dst, int dstsize, const char *str, int length )
{
	int n;
	MD5_CTX c;
	unsigned char digest[16];
	
	memset( dst, 0, dstsize );

	MD5_Init(&c);

	while (length > 0) 
	{
		if (length > 512) 
		{
			MD5_Update(&c, str, 512);
		}else{
			MD5_Update(&c, str, length);
		}
		length -= 512;
		str += 512;
	}

	MD5_Final(digest, &c);

	for (n = 0; n < 16; ++n) 
	{
		snprintf(&(dst[n << 1]), 32, "%02x", (unsigned int)digest[n]);
	}

	return dst;
}
