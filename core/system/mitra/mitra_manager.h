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
 *  Mitra Manager
 *
 * file contain definitions related to Mitra Manager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 14/07/2020
 */

#ifndef __SYSTEM_MITRA_MITRA_MANAGER_H__
#define __SYSTEM_MITRA_MITRA_MANAGER_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/usergroup/user_group.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>

//
// Role Manager structure
//

typedef struct MitraManager
{
	char								*mm_AuthToken;
	char								*mm_WindowsHost;
	char								*mm_HostForClient;
	char								*mm_ServiceLogin;
	char								*mm_ServicePassword;
	int									mm_WindowsPort;
	void								*mm_SB;
	SQLLibrary							*mm_Sqllib;	// pointer to library
}MitraManager;


//
// Create new RoleManager
//

MitraManager *MitraManagerNew( void *sb );

//
// delete RoleManager
//

void MitraManagerDelete( MitraManager *smgr );

//
//
//

void MitraManagerCheckAndAddToken( MitraManager *mm, FBOOL force );

//
//
//

int MitraManagerGetUserData( MitraManager *mmgr, char *username, char **uname, char **domain, char **pass, char **host );

//
//
//

BufString *MitraManagerCall( MitraManager *mm, char *path, int *errCode );

#endif //__SYSTEM_MITRA_MITRA_MANAGER_H__

