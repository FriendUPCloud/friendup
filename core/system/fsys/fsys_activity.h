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
 *  Filesystem activity definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 28/08/2017
 */

#ifndef __SYSTEM_FSYS_FSYS_ACTIVITY_H__
#define __SYSTEM_FSYS_FSYS_ACTIVITY_H__

#include <core/types.h>
#include <core/library.h>
#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
#include <util/base64.h>
#include <util/buffered_string.h>
#include <db/sql_defs.h>

//
// Filesystem structure and database description
//

typedef struct FilesystemActivity
{
	MinNode				node;
	FULONG				fsa_ID;             // entry id
	FULONG				fsa_FilesystemID;   // filesystem id
	struct tm			fsa_ToDate;         // till what date this entry will be used
	time_t				fsa_ToDateTimeT;
	FLONG				fsa_StoredBytesLeft;  // how many bytes user can store, this entry is updated each month
	FLONG				fsa_ReadedBytesLeft;  // how many bytes user can read, this entry is updated each month
} FilesystemActivity;

static const FULONG FilesystemActivityDesc[] = { 
    SQLT_TABNAME, (FULONG)"FilesystemActivity",       SQLT_STRUCTSIZE, sizeof( struct FilesystemActivity ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct FilesystemActivity, fsa_ID ), 
	SQLT_INT,     (FULONG)"FilesystemID",          offsetof( struct FilesystemActivity, fsa_FilesystemID ), 
	SQLT_DATE,    (FULONG)"ToDate", offsetof( struct FilesystemActivity, fsa_ToDate ),
	SQLT_INT,     (FULONG)"StoredBytesLeft", offsetof( struct FilesystemActivity, fsa_StoredBytesLeft ),
	SQLT_INT,     (FULONG)"ReadedBytesLeft", offsetof( struct FilesystemActivity, fsa_ReadedBytesLeft ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct FilesystemActivity, node ),
	SQLT_END 
};

//
//
//

int LoadFilesystemActivityDB( void *sb, FilesystemActivity *act, FULONG id, FBOOL byDate );

//
//
//

int UpdateFilesystemActivityDB( void *sb, FilesystemActivity *act );

//
//
//

static inline int FileSystemActivityCheckAndUpdate( void *sb, FilesystemActivity *fsa, int bytes )
{
	DEBUG("[FileSystemActivityCheckAndUpdate] store %d left %lu ID %lu\n", bytes, fsa->fsa_StoredBytesLeft, fsa->fsa_ID );
	if( fsa->fsa_StoredBytesLeft != 0 )	// 0 == unlimited bytes to store
	{
		int left = fsa->fsa_StoredBytesLeft;
		if( (fsa->fsa_StoredBytesLeft-bytes) <= 0 )
		{
			fsa->fsa_StoredBytesLeft = -1;
			UpdateFilesystemActivityDB( sb, fsa );
			return left;
		}
		else
		{
			fsa->fsa_StoredBytesLeft -= bytes;
		}
	}
	return bytes;
}

#endif // __SYSTEM_FSYS_FSYS_ACTIVITY_H__
