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
 *  Filesystem Remote manager    definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14 April 2017
 */

#ifndef __SYSTEM_FSYS_FS_REMOTE_MANAGER_WEB_H__
#define __SYSTEM_FSYS_FS_REMOTE_MANAGER_WEB_H__

#include <core/types.h>
#include "file.h"
#include "file_permissions.h"
#include <system/user/user.h>
#include <system/user/user_session.h>

Http *FSMRemoteWebRequest( void *m, char **urlpath, Http* request, UserSession *session, int *result );

#endif // __SYSTEM_FSYS_FS_REMOTE_MANAGER_WEB_H__
