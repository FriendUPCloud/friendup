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
