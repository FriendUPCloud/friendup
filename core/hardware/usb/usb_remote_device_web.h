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
 *  USB Remote web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/07/2020
 */

#ifndef __HARDWARE_USB_USB_REMOTE_DEVICE_WEB_H__
#define __HARDWARE_USB_USB_REMOTE_DEVICE_WEB_H__

#include <core/types.h>
#include <core/library.h>
#include <db/sqllib.h>
#include <util/hooks.h>
#include <util/list.h>
#include <system/fsys/file.h>
#include <network/socket.h>
#include <network/http.h>
#include <system/systembase.h>
#include <system/json/json_converter.h>

/**
 * USB Remote Device handler
 *
 * @param lb pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* USBRemoteManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession );

#endif // __HARDWARE_USB_USB_REMOTE_DEVICE_WEB_H__
