/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
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

char *mktemp(char *template);

//void usleep( long );

//void pclose( FILE *f );

#endif // __CORE_MISSING_DEFS_H__
