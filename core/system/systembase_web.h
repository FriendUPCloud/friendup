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
 *  SystemBase Web functions definitions
 *
 *  @author HT
 *  @date created 2015
 */

#ifndef __SYSTEM_SYSTEMBASE_WEB_H__
#define __SYSTEM_SYSTEMBASE_WEB_H__

#include <core/types.h>
#include <core/library.h>
#include "systembase.h"

Http *SysWebRequest( struct SystemBase *l, char **urlpath, Http **request, UserSession *loggedSession, int *result );

char *GetArgsAndReplaceSession( Http *request, UserSession *loggedSession, FBOOL *returnedAsFile );


#endif
