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
 *  User Manager
 *
 * file contain definitions related to UserManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/07/2016
 */

#ifndef __SYSTEM_USER_USER_MANAGER_REMOTE_H__
#define __SYSTEM_USER_USER_MANAGER_REMOTE_H__

#include <core/types.h>
#include "user_session.h"
#include <system/usergroup/user_group.h>
#include "user.h"
#include "remote_user.h"
#include "user_manager.h"

//
//
//

int UMAddGlobalRemoteUser( UserManager *um, const char *name, const char *sessid, const char *hostname );

//
//
//

int UMRemoveGlobalRemoteUser( UserManager *um, const char *name, const char *hostname );

//
//
//

int UMAddGlobalRemoteDrive( UserManager *um, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteid );

//
//
//

int UMRemoveGlobalRemoteDrive( UserManager *um, const char *uname, const char *hostname, char *localDevName, char *remoteDevName );

//
//
//

int UMAddRemoteDriveToUser( UserManager *um, FConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteID );

//
//
//

int UMRemoveRemoteDriveFromUser( UserManager *um, FConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName );


#endif //__SYSTEM_USER_USER_MANAGER_REMOTE_H__
