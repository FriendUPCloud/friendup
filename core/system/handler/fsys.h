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

#ifndef __SYSTEM_FSYS_H__
#define __SYSTEM_FSYS_H__

#include <core/types.h>
#include <core/library.h>
#include <util/hooks.h>
#include <util/hashmap.h>
#include <util/tagitem.h>
//#include <user/userlibrary.h>
#include <util/buffered_string.h>
#include <system/handler/file.h>

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
	void                    *(*Mount)( struct FHandler *s, struct TagItem *ti );
	int                     (*UnMount)( struct FHandler *s, void *f );
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
	char                  *(*Execute)( struct File *s, const char *path, const char *args );
	int                     (*Copy)( struct File *s, const char *dst, const char *src );
	
	BufString               *(*Info)( struct File *s, const char *path );
	BufString               *(*Dir)( struct File *s, const char *path );
}FHandler;

//
// Filesystem structure and database description
//

typedef struct Filesystem
{
	MinNode             node;
	ULONG               fs_ID;
	ULONG               fs_UserID;
	char                *fs_Name;
	char                *fs_Type;
	char                *fs_ShortDescription;
	char                *fs_Server;
	ULONG               fs_Port;
	char                *fs_Path;
	char                *fs_Username;
	char                *fs_Password;
	char                *fs_Config;
	ULONG               fs_Mounted;
	ULONG               fs_GroupID;
	ULONG               fs_DeviceID;
	ULONG               fs_Authorisation;
	
}Filesystem;

static ULONG FilesystemDesc[] = { 
    SQLT_TABNAME, (ULONG)"Filesystem",       SQLT_STRUCTSIZE, sizeof( struct Filesystem ), 
	SQLT_IDINT,   (ULONG)"ID",          offsetof( struct Filesystem, fs_ID ), 
	SQLT_INT,     (ULONG)"UserID",          offsetof( struct Filesystem, fs_UserID ), 
	SQLT_INT,     (ULONG)"GroupID", offsetof( struct Filesystem, fs_GroupID ),
	SQLT_INT,     (ULONG)"DeviceID", offsetof( struct Filesystem, fs_DeviceID ),
	SQLT_STR,     (ULONG)"Name",        offsetof( struct Filesystem, fs_Name ),
	SQLT_STR,     (ULONG)"Type",    offsetof( struct Filesystem, fs_Type ),
	SQLT_STR,     (ULONG)"ShortDescription",    offsetof( struct Filesystem, fs_ShortDescription ),
	SQLT_STR,     (ULONG)"Server",       offsetof( struct Filesystem, fs_Server ),
	SQLT_INT,     (ULONG)"Port",   offsetof( struct Filesystem, fs_Port ),
	SQLT_STR,     (ULONG)"Path",  offsetof( struct Filesystem, fs_Path ),
	SQLT_STR,     (ULONG)"Username", offsetof( struct Filesystem, fs_Username ),
	SQLT_STR,     (ULONG)"Password", offsetof( struct Filesystem, fs_Password ),
	SQLT_INT,     (ULONG)"Config", offsetof( struct Filesystem, fs_Config ),
	SQLT_INT,     (ULONG)"Mounted", offsetof( struct Filesystem, fs_Mounted ),
	SQLT_INT,     (ULONG)"Authorisation", offsetof( struct Filesystem, fs_Authorisation ),
	SQLT_NODE,    (ULONG)"node",        offsetof( struct Filesystem, node ),
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

// remove filesystem structure from memory

void FilesystemDelete( Filesystem *fs );

//int UnMountFS( void *l, struct TagItem *tl );

//int MountFS(void *l, struct TagItem *tl );

#endif // __SYSTEM_FSYS_H_

//
