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
 *  Autotask
 *
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 17/07/2017
 */

#ifndef __SYSTEM_AUTOTASK_AUTOTASK_H__
#define __SYSTEM_AUTOTASK_AUTOTASK_H__

#include <core/types.h>
#include <core/nodes.h>

typedef struct Autotask
{
	MinNode		node;	// next task in list
	char				*at_Name;	// task name
	char				*at_Command;	// task command
	char				*at_Arguments;	// task argument
	int				at_PID;	// pid of task
	FBOOL			at_Launched;
}Autotask;

//
//
//

Autotask *AutotaskNew( char *command, char *arguments );

//
//
//

void AutotaskDelete( Autotask *at );

#endif // __SYSTEM_AUTOTASK_AUTOTASK_H__
