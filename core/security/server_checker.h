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
 *  Server Checker
 *
 * This code should be used to check server state and fix problems when something is wrong.
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 22/05/2018
 */

#ifndef __SECURITY_SERVER_CHECKER_H__
#define __SECURITY_SERVER_CHECKER_H__

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

//
//
//

void CheckServerAndRestart( void* sb );

#endif // __SECURITY_SERVER_CHECKER_H__

