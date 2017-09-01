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

#ifndef __CORE_MISSING_DEFS_H__
#define __CORE_MISSING_DEFS_H__

#define DEFAULT_TMP_DIRECTORY "/tmp/Friendup/"

// definitions needed by some developer tools to enable highlighting

#ifndef _POSIX_SOURCE
#define _POSIX_SOURCE
#endif

#define _XOPEN_SOURCE 600

#ifndef __USE_POSIX
#define __USE_POSIX
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <winsock2.h>
#define inline __inline
#define __mode_t int
#define __useconds_t unsigned long long
#else
#include <netdb.h>
#endif

// missing definitions for different linux distros

FILE *popen( const char *c, const char *v );

int fchmod (int __fd, __mode_t __mode) ;

int pipe2( int *pipefd, int opt );

FILE *fdopen (int __fd, const char *__modes);

int usleep (__useconds_t __useconds);

struct hostent *gethostbyname2 (const char *__name, int __af);

void pthread_yield();
//void usleep( long );

//void pclose( FILE *f );

#endif // __CORE_MISSING_DEFS_H__
