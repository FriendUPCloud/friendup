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

#ifndef __APP_SESSION_MANAGER_H__
#define __APP_SESSION_MANAGER_H__

#include <system/application/application.h>
#include <system/application/app_session.h>

//
// app session manager structure
//

typedef struct AppSessionManager
{
	AppSession						*sl_AppSessions;
}AppSessionManager;

//
// functions
//

AppSessionManager *AppSessionManagerNew();

//
//
//

void AppSessionManagerDelete( AppSessionManager *as );

//
//
//

int AppSessionManagerAddSession( AppSessionManager *as, AppSession *nas );

//
//
//

int AppSessionManagerRemSession( AppSessionManager *as, AppSession *nas );

//
//
//

AppSession *AppSessionManagerGetSession( AppSessionManager *as, FUQUAD id );

#endif // __APP_SESSION_MANAGER_H__
