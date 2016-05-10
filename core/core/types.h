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

#ifndef __CORE_TYPES_H__
#define __CORE_TYPES_H__

#include <stdio.h>
#include <util/log/log.h>
#include "missing_defs.h"

#ifndef BOOL
typedef int BOOL;
#endif

#ifndef ULONG
typedef unsigned long ULONG;
#endif

#ifndef LONG
typedef long LONG;
#endif

#ifndef IPTR
typedef unsigned long * IPTR;
#endif

#ifndef BYTE
typedef unsigned char BYTE;
#endif

#ifndef UBYTE
typedef unsigned char UBYTE;
#endif

#ifndef QUAD
typedef long long QUAD;
#endif

#ifndef UQUAD
typedef unsigned long long UQUAD;
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
	aligned_alloc( 16, MSIZE )
#endif
	
#ifndef FFree
#define FFree( PTR ) free( PTR )
#endif

#endif		// __TYPES_H__

