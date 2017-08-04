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
 *  Filesystem definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 23 March 2017
 */

#ifndef __SYSTEM_FSYS_FSYS_H__
#define __SYSTEM_FSYS_FSYS_H__

#include <core/types.h>
#include <core/library.h>
#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
//#include <user/userlibrary.h>
#include <util/base64.h>
#include <util/buffered_string.h>
#include <system/fsys/file.h>
#include <network/websocket_client.h>
#include <system/user/user_session.h>

//
//
//

enum {
	FSYS_OUTPUT_JSON = 0,
	FSYS_OUTPUT_WEBDAV
};

//
// 
//

enum {
	FFile_Read = 0,
	FFile_Write,
	FFile_Append
};

#define     FSys_Dummy          0x000e0001
#define     FSys_MakeDir        (FSys_Dummy+1)
#define     FSys_Delete         (FSys_Dummy+2)
#define     FSys_Rename         (FSys_Dummy+3)
#define     FSys_Execute        (FSys_Dummy+4)
#define     FSys_Dir            (FSys_Dummy+5)
#define     FSys_OpenDirectory  (FSys_Dummy+6)
#define     FSys_Read           (FSys_Dummy+7)

//
// Filesystem handler
//

typedef struct FHandler
{
	struct MinNode node;

	char                    *Name;
	char                    *Path;			
	void                    *handle;		// lib handler
	
	void                    (*init)( struct FHandler *s );
	void                    (*deinit)( struct FHandler *s );
	
	char                    *(*GetSuffix)();
	char                    *(*GetPrefix)();
	
	// ONLY USED BY system.library
	void                    *(*Mount)( struct FHandler *s, struct TagItem *ti, User *us );
	int                     (*UnMount)( struct FHandler *s, void *f, User *usr );
	int                     (*Release)( struct FHandler *s, void *f );
	
	//
	void                    *(*FileOpen)( struct File *s, const char *path, char *mode );
	int                     (*FileClose)( struct File *s, void *fp );
	int                     (*FileRead)( struct File *s, char *buf, int size );
	int                     (*FileWrite)( struct File *s, char *buf, int size );
	int                     (*FileSeek)( struct File *s, int pos );
	
	// mount / unmount will be system.library function, will return pointer to root file
	int                     (*MakeDir)( struct File *s, const char *path );
	int                     (*Delete)( struct File *s, const char *path );
	int                     (*Rename)( struct File *s, const char *path, const char *nname );
	char                  *(*Execute)( struct File *s, const char *path, const char *args, WebsocketClient *wsc );
	int                     (*Copy)( struct File *s, const char *dst, const char *src );
	
	char                   *(*InfoGet)( struct File *s, const char *path, const char *key );
	int                     (*InfoSet)( struct File *s, const char *path, const char *key, const char *value );
	
	BufString               *(*Info)( struct File *s, const char *path );
	BufString               *(*Call)( struct File *s, const char *path, char *args );
	BufString               *(*Dir)( struct File *s, const char *path );
	
	void                     *fh_SpecialData;
}FHandler;

//
// Filesystem structure and database description
//

typedef struct Filesystem
{
	MinNode             node;
	FULONG               fs_ID;
	FULONG               fs_UserID;
	char                *fs_Name;
	char                *fs_Type;
	char                *fs_ShortDescription;
	char                *fs_Server;
	FULONG               fs_Port;
	char                *fs_Path;
	char                *fs_Username;
	char                *fs_Password;
	char                *fs_Config;
	FULONG               fs_Mounted;
	FULONG               fs_GroupID;
	FULONG               fs_DeviceID;
	FULONG               fs_Authorized;
	FULONG               fs_Owner;
} Filesystem;

static const FULONG FilesystemDesc[] = { 
    SQLT_TABNAME, (FULONG)"Filesystem",       SQLT_STRUCTSIZE, sizeof( struct Filesystem ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct Filesystem, fs_ID ), 
	SQLT_INT,     (FULONG)"UserID",          offsetof( struct Filesystem, fs_UserID ), 
	SQLT_INT,     (FULONG)"GroupID", offsetof( struct Filesystem, fs_GroupID ),
	SQLT_INT,     (FULONG)"DeviceID", offsetof( struct Filesystem, fs_DeviceID ),
	SQLT_STR,     (FULONG)"Name",        offsetof( struct Filesystem, fs_Name ),
	SQLT_STR,     (FULONG)"Type",    offsetof( struct Filesystem, fs_Type ),
	SQLT_STR,     (FULONG)"ShortDescription",    offsetof( struct Filesystem, fs_ShortDescription ),
	SQLT_STR,     (FULONG)"Server",       offsetof( struct Filesystem, fs_Server ),
	SQLT_INT,     (FULONG)"Port",   offsetof( struct Filesystem, fs_Port ),
	SQLT_STR,     (FULONG)"Path",  offsetof( struct Filesystem, fs_Path ),
	SQLT_STR,     (FULONG)"Username", offsetof( struct Filesystem, fs_Username ),
	SQLT_STR,     (FULONG)"Password", offsetof( struct Filesystem, fs_Password ),
	SQLT_STR,     (FULONG)"Config", offsetof( struct Filesystem, fs_Config ),
	SQLT_INT,     (FULONG)"Mounted", offsetof( struct Filesystem, fs_Mounted ),
	SQLT_INT,     (FULONG)"Authorized", offsetof( struct Filesystem, fs_Authorized ),
	SQLT_INT,     (FULONG)"Owner", offsetof( struct Filesystem, fs_Owner ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct Filesystem, node ),
	SQLT_END 
};

//
// Create filesystem entry
//

FHandler *FHandlerCreate( const char *path, const char *name );

//
// Delete filesystem
//

void FHandlerDelete( FHandler *fsys );

//
// remove filesystem structure from memory
//

void FilesystemDelete( Filesystem *fs );

#endif // __SYSTEM_FSYS_FSYS_H_

//
