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
 *  Printer web interface
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 20/01/2017
 */

#ifndef __HARDWARE_PRINTER_PRINTER_WEB_H__
#define __HARDWARE_PRINTER_PRINTER_WEB_H__

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
 * Network handler
 *
 * @param l pointer to SystemBase
 * @param urlpath pointer to table with path entries
 * @param request http request
 * @param loggedSession user session which made this call
 * @return http response
 */

Http* PrinterManagerWebRequest( void *lb, char **urlpath, Http* request, UserSession *loggedSession );

#endif // __HARDWARE_PRINTER_PRINTER_WEB_H__
