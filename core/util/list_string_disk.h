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
 *  String based on list definition + function store data in file
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 19/05/2020
 */

#ifndef __UTIL_STRINGLIST_DISK_H__
#define __UTIL_STRINGLIST_DISK_H__

#include <stdio.h>
#include <stdlib.h>
#include <core/types.h>

#define LIST_STRING_DISK_MAX_IN_MEM 10*1024*1024

#define LIST_STRING_TEMP_FILE_TEMPLATE "/tmp/Friendup/FriendListStringDisk_XXXXXXXXXXXXXXXXXX"

typedef struct ListStringDisk
{
	char						*lsd_Data;
	FQUAD						lsd_Size;					// size == 0, first element without data
	
	FILE						*lsd_File;			// poitner to file
	char						*lsd_FName;		// pointer to file name
	char						lsd_TemFileName[ 128 ];
	int							lsd_FileHandler;
	FBOOL						lsd_ListJoined;
	struct ListStringDisk		*lsd_Next;
	struct ListStringDisk		*lsd_Last;		// we always hold pointer to last structure
}ListStringDisk;

//
// create list
//

ListStringDisk *ListStringDiskNew();

//
// remove list and all entries
//

void ListStringDiskDelete(ListStringDisk *ls);

//
// add entry to list
//

FQUAD ListStringDiskAdd( ListStringDisk *add, char *data, FLONG size );

//
// join all lists to one string
//

int ListStringDiskJoin( ListStringDisk *ls );

#endif // __UTIL_STRINGLIST_DISK_H__

