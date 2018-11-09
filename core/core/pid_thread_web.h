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
 *  PIDThread definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13 April 2017
 */
/**
 * \ingroup FriendCoreThreadsWeb
 * @{
 */

#ifndef __CORE_PID_THREAD_WEB_H__
#define __CORE_PID_THREAD_WEB_H__

#include <core/types.h>
#include <core/thread.h>
#include <core/nodes.h>
#include "pid_thread_manager.h"
#include <network/http.h>
#include <system/user/user_session.h>

//
//
//

Http *PIDThreadWebRequest( void *sb, char **urlpath, Http *request, UserSession *loggedSession );


#endif // __CORE_PID_THREAD_WEB_H__

/**@}*/
// End of FriendCoreThreadsWeb Doxygen group
