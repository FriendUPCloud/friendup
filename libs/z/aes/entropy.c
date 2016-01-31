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

#ifdef _WIN32
#include <windows.h>
#else
#include <sys/stat.h>
#include <fcntl.h>
#endif

#if defined(__cplusplus)
extern "C"
{
#endif

#ifdef _WIN32
int entropy_fun(unsigned char buf[], unsigned int len)
{
    HCRYPTPROV provider;
    unsigned __int64 pentium_tsc[1];
    unsigned int i;
    int result = 0;


    if (CryptAcquireContext(&provider, NULL, NULL, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT | CRYPT_SILENT))
    {
        result = CryptGenRandom(provider, len, buf);
        CryptReleaseContext(provider, 0);
        if (result)
            return len;
    }

    QueryPerformanceCounter((LARGE_INTEGER *)pentium_tsc);

    for(i = 0; i < 8 && i < len; ++i)
        buf[i] = ((unsigned char*)pentium_tsc)[i];

    return i;
}
#else
int entropy_fun(unsigned char buf[], unsigned int len)
{
    int frand = open("/dev/random", O_RDONLY);
    int rlen = 0;
    if (frand != -1)
    {
        rlen = read(frand, buf, len);
        close(frand);
    }
    return rlen;
}
#endif

#if defined(__cplusplus)
}
#endif
