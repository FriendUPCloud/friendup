/*©mit**************************************************************************
 *                                                                              *
 * Friend Unifying Platform                                                     *
 * ------------------------                                                     *
 *                                                                              * 
 * Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
 * Tel.: (+47) 40 72 96 56                                                      *
 * Mail: info@friendos.com                                                      *
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
