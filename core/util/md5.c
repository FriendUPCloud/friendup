/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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
