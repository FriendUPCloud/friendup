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
 *  Server entry point
 *
 *  @author HT (Hogne Tildstad)
 *  @author PS (Pawel Stefansky)
 *  @date pushed on 22/9/16
 */

#include "core/friend_core.h"
#include "core/friendcore_manager.h"
#include "network/uri.h"

#include <execinfo.h>
#include <signal.h>
#include <stdio.h>
#include <stdio_ext.h>
#include <string.h>
#include <stdlib.h>

#include <class/phpproxyclass.h>
#include <time.h>

#include <system/systembase.h>
#include <application/applicationlibrary.h>
#include <db/sqllib.h>
#include <config/properties.h>
#include <util/base64.h>

// memory check
#include <mcheck.h>

char CRASH_LOG_FILENAME[ 92 ];

//
//
//

SystemBase *SLIB;                       ///< Global SystemBase structure

FriendCoreManager *coreManager;         ///< Global FriendCoreManager structure

static const char *_program_name;

static void crash_handler(int sig);
static int addr2line(char const * const program_name, void const * const addr, FILE *target_stream);

/**
 * Handles ctrl-c interruption signals.
 *
 * Called when a system interruption happens. This function cleans everything
 * and exits with an error number.
 *
 * @param signum signal number
 */
void InterruptSignalHandler(int signum)
{
	INFO("\nCaught signal %d\n",signum);

	// Cleanup and close up stuff here
	if( coreManager != NULL )
	{
		FriendCoreManagerDelete( coreManager );
		coreManager = NULL;
	}
}

/**
 * Friend Server entry.
 *
 * Runs the server on the machine. This function performs the following tasks:
 * - sets-up interrupt handler
 * - creates "Progdir:" in the ENV environement variable
 * - create a log file named "friend_core_log" appended with the date
 * - performs a SystemInit
 * - creates a FriendCoreManager and assigns it to the SLIB object
 * - initialise external libraries
 * - launches the FriendCoreManager in which the main loop is located
 * - exits gracefully when RunFriendCoreManager returns
 * .
 * @param[in]argc not used in this version
 * @param[in]argv not used in this version
 * @return 0 when success, otherwise error number
 * @sa SystemInit, FriendCoreManagerNew, SetFriendCoreManager, FriendCoreManagerRun
 */
int main( int argc, char *argv[])
{
	int i;
	int mcheckOption = 0;
	
	for( i=0 ; i < argc ; i++ )
	{
		if( strcmp( argv[i], "--mcheck" ) == 0 )
		{
			mcheckOption = 1;
		}
		else if( strcmp( argv[i], "--mcheck_pedantic" ) == 0 )
		{
			mcheckOption = 2;
		}
		else if( strcmp( argv[i], "--mcheck_check_all" ) == 0 )
		{
			mcheckOption = 3;
		}
		else if( strcmp( argv[i], "--mcheck_trace" ) == 0 )
		{
			mtrace();
		}
	}
	
	switch( mcheckOption )
	{
		case 1:
			if( mcheck( NULL ) == 0 )
			{
				DEBUG("MCHECK: initialized!\n");
			}
			else
			{
				DEBUG("MCHECK: NOT initialized!\n");
			}
			break;
		case 2:
			if( mcheck_pedantic( NULL ) == 0 )
			{
				DEBUG("MCHECK_PEDANTIC: initialized!\n");
			}
			else
			{
				DEBUG("MCHECK_PEDANTIC: NOT initialized!\n");
			}
			break;
		case 3:
			mcheck_check_all( );
			
			DEBUG("MCHECK_ALL: initialized!\n");
			
			break;
	}
	
	_program_name = argv[0];
	// Catch ctrl-c to gracefully shut down
	signal( SIGINT, InterruptSignalHandler );
	signal( SIGKILL, InterruptSignalHandler );
	signal( SIGSEGV, crash_handler);
	signal( SIGABRT, crash_handler);
	
	build_decoding_table();

	srand( time( NULL ) );
	
	if( PropertiesCheck() != 0 )
	{
		FERROR("cfg.ini have errors, please fix them and re-run FriendCore\n");
		return 1;
	}
	
	{
		time_t rawtime;
		struct tm timeinfo;
		rawtime = time(NULL);
		localtime_r(&rawtime, &timeinfo);

		snprintf( CRASH_LOG_FILENAME, sizeof(CRASH_LOG_FILENAME), "log/crash-%d-%02d-%02d_%02d-%02d-%02d.log", timeinfo.tm_year+1900, (int)(timeinfo.tm_mon+1), timeinfo.tm_mday, timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec );
		
		mkdir( "log", S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
	}

	char *cwd = NULL;
	char *envvar = NULL;

	// Setup "Progdir:" in ENV
	{
		cwd = FCalloc( 1024, sizeof(char) );
		envvar = FCalloc( 1048, sizeof(char) );

		if( getcwd( cwd, 1023 ) != NULL )
		{
			if( cwd[ strlen( cwd ) - 1 ] == '/' )
			{
				snprintf( envvar, 1048, "FRIEND_HOME=%s", cwd );
			}
			else
			{
				snprintf( envvar, 1048, "FRIEND_HOME=%s/", cwd );
			}

			//setenv("FRIEND_HOME", cwd, 1 );
			putenv( envvar );
			INFO("FRIEND_HOME set to: %s\n", cwd );
		}
	}

	// 500 MB log
	LogNew("friend_core_log", "log.cfg", 1, FLOG_LIVE, FLOG_LIVE, 524288000 );

	LOG( FLOG_INFO, "Core started log\n" );
	
	if( ( SLIB =  SystemInit() ) != NULL ) // (struct SystemLibrary *)LibraryOpen( "system.library", 0 ) ) != NULL )
	{
		SLIB->SystemInitExternal( SLIB );

		FriendCoreManagerRun( SLIB->fcm );

		SLIB->SystemClose( SLIB );

		LogDelete();
	}
	else
	{
		unsetenv("FRIEND_HOME");
		Log( FLOG_PANIC, "Cannot open 'system.library'\n");
		FFree( envvar );
		FFree( cwd );
		LogDelete();
		return 1;
	}

	unsetenv("FRIEND_HOME");
	if( envvar != NULL )
	{
		FFree( envvar );
	}
	FFree( cwd );
	
	base64_cleanup();

	return 0;
}

//Based on https://spin.atomicobject.com/2013/01/13/exceptions-stack-traces-c/
static void crash_handler(int sig __attribute__((unused))){
	FILE *crash_log_file_handle = fopen( CRASH_LOG_FILENAME, "w");

	fprintf(crash_log_file_handle, "\n************ CRASH INFO ************\n");
#ifdef APPVERSION
	fprintf(crash_log_file_handle, "APPVERSION %s\n", APPVERSION);
#else
	fprintf(crash_log_file_handle, "no APPVERSION?\n");
#endif
#ifdef APPGITVERSION
	fprintf(crash_log_file_handle, "APPGITVERSION %s\n", APPGITVERSION);
#else
	fprintf(crash_log_file_handle, "no APPGITVERSION?\n");
#endif

#ifdef __GNU_LIBRARY__
	fprintf(crash_log_file_handle, "glibc %d %d.%d\n", __GNU_LIBRARY__, __GLIBC__, __GLIBC_MINOR__);
#else
	fprintf(crash_log_file_handle, "non-glibc system\n");
#endif

#ifdef __GNUC__
	fprintf(crash_log_file_handle, "gcc %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
#else
	fprintf(crash_log_file_handle, "non-gcc compiler\n");
#endif

#define MAX_STACK_FRAMES 64
	static void *stack_traces[MAX_STACK_FRAMES];

	int i, trace_size = 0;
	char **messages = (char **)NULL;

	trace_size = backtrace(stack_traces, MAX_STACK_FRAMES);
	messages = backtrace_symbols(stack_traces, trace_size);

	/* skip the first couple stack frames (as they are this function and
     our handler) and also skip the last frame as it's (always?) junk. */
	// for (i = 3; i < (trace_size - 1); ++i)
	// we'll use this for now so you can see what's going on
	for (i = 0; i < trace_size; ++i)
	{
		fprintf(crash_log_file_handle, "> %s\n", messages[i]);
		if (addr2line(_program_name, stack_traces[i], crash_log_file_handle) != 0)
		{
			fprintf(crash_log_file_handle, "  error determining line # for: %s\n", messages[i]);
		}

	}
	if (messages) { free(messages); }
	fprintf(crash_log_file_handle, "************ CRASH INFO ************\n");

	fclose(crash_log_file_handle);

	printf("\n\n"
			"#######################################################\n"
			"           Sorry - FriendCore has crashed\n"
			"            log saved to file %s\n"
			"#######################################################\n"
			"\n\n", CRASH_LOG_FILENAME );
	//_exit(1);
	
	FriendCoreLockRelease();
	
	signal( sig, SIG_DFL );
	kill( getpid(), sig );
}

/* Resolve symbol name and source location given the path to the executable
   and an address */
static int addr2line(char const * const program_name, void const * const addr, FILE *target_stream)
{
	char addr2line_cmd[512] = {0};

	/* have addr2line map the address to the relent line in the code */
#ifdef __APPLE__
	/* apple does things differently... */
	sprintf(addr2line_cmd,"atos -o %.256s %p", program_name, addr);
#else
	sprintf(addr2line_cmd,"addr2line -f -p -e %.256s %p", program_name, addr);
#endif

	/* This will print a nicely formatted string specifying the
     function and source line of the address */
	//	return system(addr2line_cmd);

	FILE* fp = popen(addr2line_cmd, "r");
	if (fp == NULL) {
		printf("Failed to run addr2line\n" );
		return 1;
	}

	char line_buffer[256];
	memset(line_buffer, 0, sizeof(line_buffer));
	while (fgets(line_buffer, sizeof(line_buffer)-1, fp) != NULL) {
		fprintf(target_stream, "%s", line_buffer);
	}

	/* close */
	pclose(fp);

	return 0;
}
