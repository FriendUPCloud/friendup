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
 *  INVARManagerWeb definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created March 2016
 */

//
//
// INVARManagerWeb
// Network Only Memory Manager
//

#ifndef __SYSTEM_INRAM_INRAM_MANAGER_WEB_H__
#define __SYSTEM_INRAM_INRAM_MANAGER_WEB_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include "invar.h"

//
//
//

Http *INVARManagerWebRequest( void *m, char **urlpath, Http* request );

#endif // __SYSTEM_INRAM_INRAM_MANAGER_WEB_H__
