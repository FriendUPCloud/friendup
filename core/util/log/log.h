
/*

	Logger

*/

#ifndef __UTIL_LOG_LOG_H__
#define __UTIL_LOG_LOG_H__

#include <stdio.h>

#define LOG_ALL		0
#define LOG_WARN	1
#define LOG_INFO	2

/* expands to the first argument */
#define FIRST(...) FIRST_HELPER(__VA_ARGS__, throwaway)
#define FIRST_HELPER( first, ...) first

#define ERROR(...) printf( "\x1B[31m (%s:%d) ", __FILE__, __LINE__ ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define INFO(...) printf( "\x1B[34m (%s:%d) ", __FILE__, __LINE__ ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

/*
 * if there's only one argument, expands to nothing.  if there is more
 * than one argument, expands to a comma followed by everything but
 * the first argument.  only supports up to 9 arguments but can be
 * trivially expanded.
 */
#define REST(...) REST_HELPER(NUM(__VA_ARGS__), __VA_ARGS__)
#define REST_HELPER(qty, ...) REST_HELPER2(qty, __VA_ARGS__)
#define REST_HELPER2(qty, ...) REST_HELPER_##qty(__VA_ARGS__)
#define REST_HELPER_ONE(first)
#define REST_HELPER_TWOORMORE(first, ...) , __VA_ARGS__
#define NUM(...) \
    SELECT_10TH(__VA_ARGS__, TWOORMORE, TWOORMORE, TWOORMORE, TWOORMORE,\
                TWOORMORE, TWOORMORE, TWOORMORE, TWOORMORE, ONE, throwaway)
#define SELECT_10TH(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, ...) a10


// we have 3 levels of debug
// 0 - log all, 1 log

#define DEBUG_LEVEL LOG_ALL

#ifdef __DEBUG
//#define DEBUG( x, ...) printf( " (%s:%d) " x, __FILE__, __LINE__, __VA_ARGS__ );
#define DEBUGNA( x ) printf(  x, __FILE__, __LINE__ );

#define DEBUG(...) printf( "\x1B[32m (%s:%d) ", __FILE__, __LINE__ ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#else
#define DEBUGNA( x )
#define DEBUG( x, ...)
#endif

#endif //__UTIL_LOG_LOG_H__
