/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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

inline void UserLoggerStore( UserLoggerManager *ulm, UserSession *ses, char *path, char *information )
{
	DEBUG("SESSION %p\n", ses );
	if( ulm->ulm_ActiveLogger != NULL && ses != NULL )
	{
		ulm->ulm_ActiveLogger->StoreInformation( ulm->ulm_ActiveLogger, ses, path, information );
	}
}


#endif // __UTIL_USER_LOGGER_MANAGER_H__
