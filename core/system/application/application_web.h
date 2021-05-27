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
 *  Application Web
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __SYSTEM_APPLICATION_APPLICATIONWEB_H__
#define __SYSTEM_APPLICATION_APPLICATIONWEB_H__

#include <core/types.h>
#include <core/library.h>
#include <mysql.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/application/application.h>
#include <z/zlibrary.h>
#include <system/systembase.h>

Http* ApplicationWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedUser );

#endif // __SYSTEM_APPLICATION_APPLICATIONWEB_H__
