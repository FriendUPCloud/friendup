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
 * DOSDriver header
 *
 * @author PS (Pawel Stefansky)
 * @date created PS 2015
 */

#ifndef __SYSTEM_FSYS_DOSDRIVER_H__
#define __SYSTEM_FSYS_DOSDRIVER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/fsys/fsys.h>


//
// Filesystem extensions
//


#define DOSDriver_Extension_GetInfo			1
#define DOSDriver_Extension_Copy		(1<<1)
#define DOSDriver_Extension_Move		(1<<2)
#define DOSDriver_Extension_Delete		(1<<3)

//
// structure
//

typedef struct DOSDriver{
	MinNode 							node;
	FHandler							*dd_Handler;
	char								*dd_Name;
	char								*dd_Type;
	unsigned int						dd_Extensions;
}DOSDriver;

//int RescanDOSDrivers( void *l );

#endif // __SYSTEM_FSYS_DOSDRIVER_H__
