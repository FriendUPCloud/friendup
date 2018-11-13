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
 * System/Command header
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SYSTEM_COMMAND_H__
#define __SYSTEM_COMMAND_H__

#include <sys/types.h>
#include <unistd.h>
#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>

//
//
//

FILE * CommandRun( char *command, char *type, int *pid );

//
//
//

int CommandClose( FILE * fp, unsigned int pid );

#endif // __SYSTEM_COMMAND_H__
