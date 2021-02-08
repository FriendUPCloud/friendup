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
 *  AppSessionManager structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 04/02/2021
 */

#ifndef __SYSTEM_APPLICATION_APP_SESSIONMANAGER_H__
#define __SYSTEM_APPLICATION_APP_SESSIONMANAGER_H__

#include <core/types.h>
#include "appsession.h"
#include <system/usergroup/user_group.h>
#include <util/libchash.h>

//
// User Session Manager structure
//

typedef struct AppSessionManager
{
	void							*asm_SB;
	
	AppSession						*asm_Sessions;							// list of all app sessions
	FHashTable						*asm_SessionsHT;						// Hashmap of sessions

	int								asm_SessionCounter;
	
	pthread_mutex_t					asm_Mutex;		// mutex
} AppSessionManager;


//
// Create new UserSessionManager
//

AppSessionManager *AppSessionManagerNew( void *sb );

//
// delete ServiceManager
//

void AppSessionManagerDelete( AppSessionManager *smgr );

//
//
//

int AppSessionManagerSessionsDeleteDB( AppSessionManager *asmgr, const char *authid );

//
//
//

AppSessionManager *AppSessionManagerGetSessionByID( AppSessionManager *usm, char *id );

//
//
//

AppSession *AppSessionManagerGetSessionByAuthIDFromDB( AppSessionManager *asmgr, char *sessionid );

//
//
//

AppSession *AppSessionManagerAppSessionAddToList( AppSessionManager *smgr, AppSession *s );

//
//
//

AppSession *AppSessionManagerAppSessionAdd( AppSessionManager *smgr, AppSession *s );

//
//
//

int AppSessionManagerAppSessionRemove( AppSessionManager *smgr, AppSession *remsess );

#endif //__SYSTEM_APPLICATION_APP_SESSIONMANAGER_H__
