

/*

	data types

*/

#ifndef __TYPES_H__
#define __TYPES_H__

#define DEBUG printf
#define ERROR printf

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
typedef char BYTE;
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

#ifndef STRPTR
typedef char * STRPTR;
#endif

#ifndef CONST_STRPTR
typedef const char * CONST_STRPTR;
#endif

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

#endif		// __TYPES_H__

