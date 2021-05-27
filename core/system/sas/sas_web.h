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
 *  SAS Web
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 19.03.2020
 */

#ifndef __SYSTEM_SAS_WEB_H__
#define __SYSTEM_SAS_WEB_H__

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

Http* SASWebRequest( SystemBase *l, char **urlpath, Http* request, UserSession *loggedUser );

#endif // __APPLICATIONWEB_H__
