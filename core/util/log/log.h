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
 *  log definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 18/01/2016
 */

#ifndef __UTIL_LOG_LOG_H__
#define __UTIL_LOG_LOG_H__

#include <core/types.h>
#include <stdio.h>
#include <stdint.h>
#include <time.h>
#include <pthread.h>

#ifdef LOG_TIMESTAMP
#include <sys/time.h>

static inline long long currentTimestamp() {
    struct timeval te; 
    gettimeofday(&te, NULL); // get current time
    long long milliseconds = te.tv_sec*1000LL + te.tv_usec/1000; // calculate milliseconds
    // printf("milliseconds: %lld\n", milliseconds);
    return milliseconds;
}
#endif // LOG_TIMESTAMP

#define LOG_ALL		0
#define LOG_WARN	1
#define LOG_INFO	2

// Loging flags 
#define FLOG_NONE   0
#define FLOG_LIVE   1
#define FLOG_INFO   2
#define FLOG_WARN   3
#define FLOG_DEBUG  4
#define FLOG_ERROR  5
#define FLOG_FATAL  6
#define FLOG_PANIC  7


// Supported colors 
#define CLR_NORMAL   "\x1B[0m"
#define CLR_RED      "\x1B[31m"
#define CLR_GREEN    "\x1B[32m"
#define CLR_YELLOW   "\x1B[33m"
#define CLR_BLUE     "\x1B[34m"
#define CLR_NAGENTA  "\x1B[35m"
#define CLR_CYAN     "\x1B[36m"
#define CLR_WHITE    "\x1B[37m"
#define CLR_RESET    "\033[0m"

// Date variables 
typedef struct FlogDate{
    int fd_Year; 
    int fd_Mon; 
    int fd_Day;
    int fd_Hour;
    int fd_Min;
    int fd_Sec;
    int fd_Usec;
} FlogDate;

// Flags 
typedef struct FlogFlags{
	const char			*ff_Fname;
	char				*ff_Path;
	char				*ff_DestinationPath;
	int					ff_DestinationPathLength;
	short				ff_FileLevel;
	short				ff_Level;
	short				ff_ToFile;
	short				ff_ToConsole;
	short				ff_Pretty;
	short				ff_Time;
	short				ff_TdSafe;
	FILE				*ff_FP;
	char				ff_DateString[ 256 ];
	uint64_t			ff_Size;
	uint64_t			ff_MaxSize;
	int					ff_LogNumber;
	
	FlogDate			ff_FD;
	pthread_mutex_t		logMutex;
	int					ff_ArchiveFiles;
	char				**ff_FileNames;
} FlogFlags;


int LogNew( const char* fname, const char* conf, int toFile, int lvl, int flvl, int maxSize );

void LogDelete( );

int LogParseConfig(const char *cfg_name);

void Log( int lev, char* fmt, ...) ;


/* expands to the first argument */
#define FIRST(...) FIRST_HELPER(__VA_ARGS__, throwaway)
#define FIRST_HELPER( first, ...) first

extern FlogFlags slg;

#define FINFO(...) \
	if( slg.ff_ToFile == 1 ) { \
		time_t rawtime; \
		struct tm timeinfo; \
		rawtime = time(NULL); \
		localtime_r( &rawtime, &timeinfo );  \
\
		slg.ff_FD.fd_Year = timeinfo.tm_year+1900; \
		slg.ff_FD.fd_Mon = timeinfo.tm_mon+1; \
		slg.ff_FD.fd_Day = timeinfo.tm_mday; \
		slg.ff_FD.fd_Hour = timeinfo.tm_hour; \
		slg.ff_FD.fd_Min = timeinfo.tm_min; \
		slg.ff_FD.fd_Sec = timeinfo.tm_sec; \
		\
\
		if( slg.ff_FD.fd_Day != slg.ff_Time ) \
		{ \
			snprintf( slg.ff_DateString, sizeof(slg.ff_DateString), "%s-%02d-%02d-%02d.log",slg.ff_Fname, slg.ff_FD.fd_Year, slg.ff_FD.fd_Mon, slg.ff_FD.fd_Day ); \
			if( slg.ff_FP != NULL ) \
			{ \
				fclose( slg.ff_FP ); \
				slg.ff_FP = NULL; \
			} \
			slg.ff_FP = fopen( slg.ff_DateString, "a"); \
			if( slg.ff_FP == NULL ) \
			{ \
				printf("Cannot create or open logfile\n"); \
			}  \
\
			slg.ff_Time = slg.ff_FD.fd_Day; \
		} \
\
		 if (pthread_mutex_lock(&slg.logMutex) == 0) \
		 { \
			/*fprintf( slg.ff_FP, "\x1B[34m (%s:%d) ", __FILE__, __LINE__ ); fprintf( slg.ff_FP, FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) ); */ \
			pthread_mutex_unlock(&slg.logMutex);  \
		} \
	} \
	 \
	{ \
		printf( "\x1B[34m (%s:%d) ", __FILE__, __LINE__ ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) ); \
	} 

#define QUOTE(name) #name
#define STR(macro) QUOTE(macro)

#define LOG( LEV, ...)  Log( LEV,  "(" __FILE__ " " STR(__LINE__ ) ") " FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#ifdef __DEBUG
#define FERROR(...) printf( "\x1B[31m (%s:%d) %ld ", __FILE__, __LINE__, pthread_self()  ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define INFO(...) printf( "\x1B[34m (%s:%d) %ld ", __FILE__, __LINE__, pthread_self()  ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )
#else
#define FERROR(...)

#define INFO(...)
#endif

//#define INFO( ...) printf( "\x1B[31m (%s:%d) ", __FILE__, __LINE__ );  Log( 1, FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) ) 

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

#ifdef LOG_TIMESTAMP

#define DEBUG(...) printf( "\x1B[32m (%s:%d) %ld Time: %lld ", __FILE__, __LINE__, pthread_self(), currentTimestamp() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define DEBUG1(...) printf( "\x1B[37m (%s:%d) %ld Time: %lld ", __FILE__, __LINE__, pthread_self(), currentTimestamp() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define DEBUG2(...) printf( "\x1B[33m (%s:%d) %ld Time: %lld ", __FILE__, __LINE__, pthread_self(), currentTimestamp() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#else

#define DEBUG(...) printf( "\x1B[32m (%s:%d) %ld ", __FILE__, __LINE__, pthread_self() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define DEBUG1(...) printf( "\x1B[37m (%s:%d) %ld ", __FILE__, __LINE__, pthread_self() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )

#define DEBUG2(...) printf( "\x1B[33m (%s:%d) %ld ", __FILE__, __LINE__, pthread_self() ); printf( FIRST(__VA_ARGS__) " " REST(__VA_ARGS__) )
#endif

#else
#define DEBUGNA( x )
#define DEBUG( x, ...)
#define DEBUG1( x, ...)
#define DEBUG2( x, ...)
#endif

#endif //__UTIL_LOG_LOG_H__
