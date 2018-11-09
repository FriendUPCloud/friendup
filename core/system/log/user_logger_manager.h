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
 *  @date created 07/04/2017
 */

#ifndef __UTIL_USER_LOGGER_MANAGER_H__
#define __UTIL_USER_LOGGER_MANAGER_H__

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>
#include "user_logger.h"
#include <util/log/log.h>

//
// definition
//

typedef struct UserLoggerManager
{
	void                         *ulm_SB; // pointer to SystemBase
	UserLogger             *ulm_Loggers;
	UserLogger             *ulm_ActiveLogger;
}UserLoggerManager;

//
//
//

UserLoggerManager *UserLoggerManagerNew( void *sb );

//
//
//

void UserLoggerManagerDelete( UserLoggerManager *ulm );

//
//
//

static inline void UserLoggerStore( UserLoggerManager *ulm, UserSession *ses, char *path, char *information )
{
	DEBUG("SESSION %p\n", ses );
	if( ulm->ulm_ActiveLogger != NULL && ses != NULL )
	{
		ulm->ulm_ActiveLogger->StoreInformation( ulm->ulm_ActiveLogger, ses, path, information );
	}
}


#endif // __UTIL_USER_LOGGER_MANAGER_H__
