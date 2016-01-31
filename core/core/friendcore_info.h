/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __CORE_FRIENDCORE_INFO_H__
#define __CORE_FRIENDCORE_INFO_H__

#include <core/types.h>
#include <util/buffered_string.h>

typedef struct FriendcoreInfo
{
	void 						*fci_FCM;
	int 						fci_FCNumber;
}FriendcoreInfo;
/*
static ULONG FilesystemDesc[] = { 
    SQLT_TABNAME, (ULONG)"FriendcoreInfo",       SQLT_STRUCTSIZE, sizeof( struct FriendcoreInfo ), 
//	SQLT_IDINT,   (ULONG)"ID",          offsetof( struct Filesystem, fs_ID ), 
//	SQLT_NODE,    (ULONG)"node",        offsetof( struct Filesystem, node ),
	SQLT_END 
};*/

//
//
//

FriendcoreInfo *FriendCoreInfoNew( void *fcm );

void FriendCoreInfoDelete( FriendcoreInfo *fci );

BufString *FriendCoreInfoGet( FriendcoreInfo *fci );

#endif // __CORE_FRIENDCORE_INFO_H__
