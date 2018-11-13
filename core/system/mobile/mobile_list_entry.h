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
 *  Mobile List Entry
 *
 * file contain definitions related to MobileListEntry
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/10/2018
 */

#ifndef __SYSTEM_MOBILE_MOBILE_LIST_ENTRY_H__
#define __SYSTEM_MOBILE_MOBILE_LIST_ENTRY_H__

#include <core/types.h>
#include <system/user/user_session.h>
#include <system/user/user_sessionmanager.h>
#include <system/user/user.h>
#include <system/user/user_mobile_app.h>

//
// Mobile List Entry structure
//

typedef struct MobileListEntry
{
	UserMobileApp			*mm_UMApp;
	MinNode					node;
} MobileListEntry;


MobileListEntry *MobileListEntryNew( UserMobileApp *uma );

void MobileListEntryDelete( MobileListEntry *ent );

void MobileListEntryDeleteAll( MobileListEntry *ent );

void MobileListEntryInit( MobileListEntry *app );

void MobileListEntryInit( MobileListEntry *ent );


#endif //__SYSTEM_MOBILE_MOBILE_MANAGER_H__
