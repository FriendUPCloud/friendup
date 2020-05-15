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
 *  Application Session Manager
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_APPLICATION_APPLICATION_MANAGER_H__
#define __SYSTEM_APPLICATION_APPLICATION_MANAGER_H__

#include <system/application/application.h>

//
// application manager structure
//

typedef struct ApplicationManager
{
	pthread_mutex_t					am_Mutex;
	void							*am_SB;
}ApplicationManager;

//
// functions
//

ApplicationManager *ApplicationManagerNew( void *sb );

//
//
//

void ApplicationManagerDelete( ApplicationManager *asmm );

//
//
//

void ApplicationManagerRemoveApplicationSessionByUserID( ApplicationManager *am, FUQUAD id );

//
//
//

void ApplicationManagerRemoveApplicationSessionByUserSessionID( ApplicationManager *lasm, FUQUAD id );

//
//
//

void ApplicationManagerRemoveDetachedApplicationSession( ApplicationManager *am );

#endif // __SYSTEM_APPLICATION_APPLICATION_MANAGER_H__
