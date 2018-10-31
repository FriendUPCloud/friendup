/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright 2014-2017 Friend Software Labs AS                                  *
*                                                                              *
* Permission is hereby granted, free of charge, to any person obtaining a copy *
* of this software and associated documentation files (the "Software"), to     *
* deal in the Software without restriction, including without limitation the   *
* rights to use, copy, modify, merge, publish, distribute, sublicense, and/or  *
* sell copies of the Software, and to permit persons to whom the Software is   *
* furnished to do so, subject to the following conditions:                     *
*                                                                              *
* The above copyright notice and this permission notice shall be included in   *
* all copies or substantial portions of the Software.                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* MIT License for more details.                                                *
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
