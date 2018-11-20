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
 *  Admin Web header
 *
 * All functions related to Remote User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/12/2017
 */

#ifndef __SYSTEM_CONNECTION_CONNECTION_WEB_H__
#define __SYSTEM_CONNECTION_CONNECTION_WEB_H__

#include <core/types.h>
#include <core/nodes.h>
#include <network/http.h>
#include <system/user/user_session.h>

//
//
//

Http *ConnectionWebRequest( void *m, char **urlpath, Http **request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_CONNECTION_CONNECTION_WEB_H__

