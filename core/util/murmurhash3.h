/*

<LICENSE TEMPLATE>

*/
//-----------------------------------------------------------------------------
// MurmurHash3 was written by Austin Appleby, and is placed in the public domain.

#ifndef __UTIL_MURMURHASH3_H__
#define __UTIL_MURMURHASH3_H__

//-----------------------------------------------------------------------------
// Platform-specific functions and macros

// Microsoft Visual Studio

#if defined(_MSC_VER) && (_MSC_VER < 1600)

typedef unsigned char uint8_t;
typedef unsigned int uint32_t;
typedef unsigned __int64 uint64_t;

// Other compilers

#else   // defined(_MSC_VER)

#include <stdint.h>

#endif // !defined(_MSC_VER)

//
//
//

void MurmurHash3_32 ( const void * key, int len,
                          uint32_t seed, void * out );

//
//
//

//void MurmurHash3_x86_32  ( const void * key, int len, uint32_t seed, void * out );

//
//
//

void MurmurHash3_x86_128 ( const void * key, int len, uint32_t seed, void * out );

//
//
//

void MurmurHash3_x64_128 ( const void * key, int len, uint32_t seed, void * out );

#ifndef MURMURHASH3
#ifdef ENV64BIT
#define MURMURHASH3( KEY, KEYLEN, OUT ) MurmurHash3_x64_128 ( KEY, KEYLEN, 0, OUT )
#else
#define MURMURHASH3( KEY, KEYLEN, OUT ) MurmurHash3_x86_128 ( KEY, KEYLEN, 0, OUT )
#endif // MURMURHASH3
#endif

//-----------------------------------------------------------------------------

#endif // _MURMURHASH3_H_
