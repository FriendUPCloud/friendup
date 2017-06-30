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

/**
 * @file
 *
 * Definition of various types
 *
 * @author PS (Pawel Stefansky)
 * @author HT (Hogne Tildstad)
 * @date first push by PS (10/02/2015)
 */

#ifndef __CORE_TYPES_H__
#define __CORE_TYPES_H__

#include <stdio.h>
#include <stdlib.h>
#include <util/log/log.h>
#include "missing_defs.h"

#ifndef FBOOL
typedef int FBOOL;
#endif

#ifndef FULONG
typedef unsigned long FULONG;
#endif

#ifndef FLONG
typedef long FLONG;
#endif

#ifndef IPTR
typedef unsigned long * IPTR;
#endif

#ifndef FBYTE
typedef unsigned char FBYTE;
#endif

#ifndef FUBYTE
typedef unsigned char FUBYTE;
#endif

#ifndef FWORD
typedef short FWORD;
#endif

#ifndef FUWORD
typedef unsigned short FUWORD;
#endif

#ifndef FINT
typedef int FINT;
#endif

#ifndef FUINT
typedef unsigned int FUINT;
#endif

#ifndef FQUAD
typedef long long FQUAD;
#endif

#ifndef FUQUAD
typedef unsigned long long FUQUAD;
#endif

//#ifndef STRPTR
//typedef char * STRPTR;
//#endif

//#ifndef CONST_STRPTR
//typedef const char * CONST_STRPTR;
//#endif

#ifndef APTR
typedef void * APTR;
#endif

#ifndef NULL
#define NULL 0
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

//
// Our Calloc and Malloc 
//

#ifndef FCalloc
#define FCalloc( MSIZE, MTYPE ) \
	calloc( MSIZE, MTYPE )
#endif

#ifndef FMalloc
#define FMalloc( MSIZE ) \
	malloc( MSIZE )
#endif
	
#ifndef FFree
#define FFree( PTR ) free( PTR )
#endif

#if ((__GNUC__ * 100) + __GNUC_MINOR__) >= 402
#define GCC_DIAG_STR(s) #s
#define GCC_DIAG_JOINSTR(x,y) GCC_DIAG_STR(x ## y)
# define GCC_DIAG_DO_PRAGMA(x) _Pragma (#x)
# define GCC_DIAG_PRAGMA(x) GCC_DIAG_DO_PRAGMA(GCC diagnostic x)
# if ((__GNUC__ * 100) + __GNUC_MINOR__) >= 406
#  define GCC_DIAG_OFF(x) GCC_DIAG_PRAGMA(push) \
	GCC_DIAG_PRAGMA(ignored GCC_DIAG_JOINSTR(-W,x))
#  define GCC_DIAG_ON(x) GCC_DIAG_PRAGMA(pop)
# else
#  define GCC_DIAG_OFF(x) GCC_DIAG_PRAGMA(ignored GCC_DIAG_JOINSTR(-W,x))
#  define GCC_DIAG_ON(x)  GCC_DIAG_PRAGMA(warning GCC_DIAG_JOINSTR(-W,x))
# endif
#else
# define GCC_DIAG_OFF(x)
# define GCC_DIAG_ON(x)
#endif

#ifndef FRIEND_CORE_MANAGER_ID_SIZE
#define FRIEND_CORE_MANAGER_ID_SIZE	128
#endif

#endif		// __TYPES_H__

