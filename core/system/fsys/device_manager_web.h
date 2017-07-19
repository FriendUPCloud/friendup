/*©mit***************************************************************************
 *                                                                              *
 * Friend Unifying Platform                                                     *
 * ------------------------                                                     *
 *                                                                              *
 * Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
 * Tel.: (+47) 40 72 96 56                                                      *
 * Mail: info@friendos.com                                                      *
 *                                                                              *
 **©****************************************************************************/
/** @file
 * 
 *  Device manager definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#ifndef __SYSTEM_FSYS_HANDLER_DEVICE_MANAGER_WEB_H__
#define __SYSTEM_FSYS_HANDLER_DEVICE_MANAGER_WEB_H__

#include <core/types.h>
#include "file.h"
#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_session.h>

Http *DeviceMWebRequest( void *m, char **urlpath, Http* request, UserSession *session, int *result );

#endif // __SYSTEM_HANDLER_DEVICE_MANAGER_WEB_H__
