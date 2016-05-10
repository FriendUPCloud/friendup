/*
 * 
 * 
 * 
 * 
 * 
*/

#ifndef __SYSTEM_COMMAND_H__
#define __SYSTEM_COMMAND_H__

//#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>

FILE * CommandRun( char *command, string type, int *pid );

int CommandClose( FILE * fp, pid_t pid );

#endif // __SYSTEM_COMMAND_H__
