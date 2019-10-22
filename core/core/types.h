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
#include <stdint.h>
#include <util/log/log.h>
#include <linux/limits.h>
#include "missing_defs.h"

#if __BYTE_ORDER__ == __ORDER_BIG_ENDIAN__
#define	IS_BIG_ENDIAN			1
#else
#define	IS_LITTLE_ENDIAN		1
#endif

// Check windows
#if _WIN32 || _WIN64
   #if _WIN64
     #define ENV64BIT
  #else
    #define ENV32BIT
  #endif
#endif

// Check GCC
#if __GNUC__
  #if __x86_64__ || __ppc64__
    #define ENV64BIT
  #else
    #define ENV32BIT
  #endif
#endif

#define SHIFT_LEFT( val, at) (val<<at)
#define SHIFT_RIGHT( val, at) (val>>at)

typedef int8_t FBOOL;

typedef unsigned long FULONG;

typedef long FLONG;

typedef uint64_t * IPTR;

typedef unsigned char FBYTE;

typedef unsigned char FUBYTE;

typedef int16_t FWORD;

typedef uint16_t FUWORD;

typedef int32_t FINT;

typedef uint32_t FUINT;

#ifndef FQUAD
typedef int64_t FQUAD;
#endif

#ifndef FUQUAD
typedef uint64_t FUQUAD;
#endif

//#ifndef FQUAD
//typedef long long FQUAD;
//#endif

//#ifndef FUQUAD
//typedef unsigned long long FUQUAD;
//#endif

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

#ifndef FCallocAlign
#define FCallocAlign( MSIZE, MTYPE ) \
	calloc( (((uintptr_t)MSIZE+15) & ~ (uintptr_t)0x0F), MTYPE )
#endif

#ifndef FMallocAlign
#define FMallocAlign( MSIZE ) \
	malloc( (((uintptr_t)MSIZE+15) & ~ (uintptr_t)0x0F) )
#endif

#ifndef FCalloc
#define FCalloc( MSIZE, MTYPE ) \
	calloc( MSIZE, MTYPE )
#endif

#ifndef FMalloc
#define FMalloc( MSIZE ) \
	malloc( MSIZE )
#endif

#define FRealloc(ptr, size) realloc(ptr, size)

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

