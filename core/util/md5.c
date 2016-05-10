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
		snprintf(&(dst[n*2]), 16*2, "%02x", (unsigned int)digest[n]);
	}

	return dst;
}
