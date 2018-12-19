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
 *  Mobile Manager
 *
 * file contain definitions related to MobileManager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/09/2018
 */

#ifndef __SYSTEM_MOBILE_MOBILE_MANAGER_H__
#define __SYSTEM_MOBILE_MOBILE_MANAGER_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>
#include <system/user/user_mobile_app.h>
#include "mobile_list_entry.h"

#include <util/friendqueue.h>
#include <libwebsockets.h>
#include <system/user/user_mobile_app.h>
#include <mobile_app/mobile_app_websocket.h>
#include <system/mobile/mobile_app_connection.h>

//
// Mobile Manager structure
//

typedef struct MobileManager
{
	void								*mm_SB;

	UserMobileApp						*mm_UMApps;
	pthread_mutex_t						mm_Mutex;		// mutex
	
	UserMobileAppConnections			*mm_UserConnections;
} MobileManager;


MobileManager *MobileManagerNew( void *sb );

void MobileManagerDelete( MobileManager *mmgr );

UserMobileApp *MobleManagerGetByTokenDB( MobileManager *mmgr,  char *id );

UserMobileApp *MobleManagerGetByIDDB( MobileManager *mmgr, FULONG id );

MobileListEntry *MobleManagerGetByUserIDDB( MobileManager *mmgr, FULONG user_id );

MobileListEntry *MobleManagerGetByUserIDDBPlatform( MobileManager *mmgr, FULONG user_id, int type );

MobileListEntry *MobleManagerGetByUserNameDBPlatform( MobileManager *mmgr, FULONG user_id, char *userName, int type );

FULONG MobileManagerGetUMAIDByToken( MobileManager *mmgr, SQLLibrary *sqllib, const char *token );

void MobileManagerRefreshCache( MobileManager *mmgr );

int MobileManagerAddUMA( MobileManager *mm, UserMobileApp *app );

UserMobileApp *MobleManagerGetMobileAppByUserPlatformDBm( MobileManager *mmgr, const char *username, int type );

#endif //__SYSTEM_MOBILE_MOBILE_MANAGER_H__

