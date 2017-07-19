/*©mit**************************************************************************
 *                                                                              *
 * Friend Unifying Platform                                                     *
 * ------------------------                                                     *
 *                                                                              * 
 * Copyright 2014-2016 Friend Software Labs AS, all rights reserved.            *
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
 * Tel.: (+47) 40 72 96 56                                                      *
 * Mail: info@friendos.com                                                      *
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
#include "user_group.h"
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

int UMAddRemoteDriveToUser( UserManager *um, CommFCConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName, FULONG remoteID );

//
//
//

int UMRemoveRemoteDriveFromUser( UserManager *um, CommFCConnection *con, const char *locuname, const char *uname, const char *authid, const char *hostname, char *localDevName, char *remoteDevName );


#endif //__SYSTEM_USER_USER_MANAGER_REMOTE_H__
