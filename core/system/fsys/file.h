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
 *  File and FileShared definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 6 Feb 2015
 */

#ifndef __SYSTEM_FSYS_FILE_H__
#define __SYSTEM_FSYS_FILE_H__

#include <core/types.h>
#include <util/tagitem.h>
#include <db/sqllib.h>
#include <util/list_string.h>
#include "file_permissions.h"
#include "fsys_activity.h"
#include <network/user_session_websocket.h>

//
//
//

#define MODE_READ 1
#define MODE_WRITE 2

//
//
//

enum {
	FType_File = 0,
	FType_Directory
};

#define FILE_MAX_BUFFER	6400

//
// File structure
//

typedef struct File
{
	FULONG						f_ID;               // ID in database
	FULONG						f_KeysID;			// link to FKeys
	FULONG						f_UserGroupID;			// information to which group file is assigned
	void						*f_UserGroup;		// pointer to UserGroup
	struct MinNode				node;               // link to another files, used by Mount
	
	char						*f_Name;            // name of file
	//char						*f_SharedName;		// when device is shared then name = mail+devname
	char						*f_Path;            // path
	//char						*f_SessionID;
	char						*f_SessionIDPTR;	// pointer to sessionid
	char						*f_Config;          // The config of the file system
	int							f_Visible;         // Visible?
	char						*f_Execute;         // Execute something?
	int							f_Type;             // type
	int							f_Raw;              // Do read in raw mode?
	char						*f_FSysName;        // filesystem name required by database
	void						*f_DOSDriver;
	void						*f_FSys;            // filesystem type
	FULONG						f_UserID;			// field from database. User who mounted drive
	void						*f_User;            // user which mounted device / or file (or owner)
	
	// device details
	char						*f_DevServer;
	int							f_DevPort;
	
													// if user != current user device is shared
	FUQUAD						f_Size;             // file size
	FUQUAD						f_Position;         // position where user stopped to read/write
	FULONG						f_DataPassed;       // size in bytes, to read or write (inside buffer)
	char						*f_Buffer;          // [ FILE_MAX_BUFFER ];
	FQUAD						f_BytesStored;		// number of bytes stored in root file
	FQUAD						f_MaxBytesStored;	// maximum bytes which could be stored on disk
	
	struct File					*f_SharedFile;		// points to shared device
	struct File					*f_RootDevice;
	void						*f_SpecialData;     // pointer to special data
	
	FBOOL						f_Mounted;			// if device is mounted use it
	FULONG						f_Pointer;			// pointer to file
	
	FBOOL						f_Stream;			// is file streamed
	Socket						*f_Socket;			// != NULL then data should be streamed
	UserSessionWebsocket		*f_WSocket;			// websocket context, if provided data should be delivered here
	int							f_Operations;		// operation counter
	
	int							f_OperationMode;	// read, write, etc.
	FilesystemActivity			f_Activity;			// information how many bytes user can read/store
} File;


static const FULONG DeviceTDesc[] = {
	SQLT_TABNAME, (FULONG)"FDevice", SQLT_STRUCTSIZE, (FULONG)sizeof( File ), 
	SQLT_IDINT, (FULONG)"ID",           offsetof( struct File, f_ID ), 
	SQLT_NODE, (FULONG)NULL,           offsetof( struct File, node ), 
	SQLT_STR, (FULONG)"NAME",           offsetof( struct File, f_Name ), 
	SQLT_STR, (FULONG)"PATH",          offsetof( struct File, f_Path ), 
	SQLT_INT, (FULONG)"TYPE",          offsetof( struct File, f_Type ), 
	SQLT_STR, (FULONG)"FSYSTYPE_NAME",          offsetof( struct File, f_FSysName ), 
	SQLT_END 
};

//
// File
//

File *FileNew();

//
//
//

void FileDelete( File *);

//
// Shared file
//

typedef struct FileShared
{
	FULONG								fs_ID;               // ID in database
	struct MinNode						node;               // link to another files, used by Mount
	
	char 								*fs_Name;		// file name
	char 								*fs_DeviceName;		// device which file belongs to
	char 								*fs_Path;		// full path
	
	FULONG								fs_IDUser;		// user which share his device (User *)
	char 								*fs_DstUsers;
	
	char 								*fs_Hash;
	time_t                          	fs_CreatedTime;
	struct tm							fs_CreateTimeTM;
	
	ListString							*fs_Data;		// pointer to liststring which represents file data, list must be finalised before it will be atached here
	FULONG 								fs_AppID;		// application ID
} FileShared;



static const FULONG FileSharedTDesc[] = {
	SQLT_TABNAME, (FULONG)"FFileShared", SQLT_STRUCTSIZE, (FULONG) sizeof( struct FileShared ), 
	SQLT_IDINT, (FULONG)"ID",            offsetof( struct FileShared, fs_ID ), 
	SQLT_STR, (FULONG)"Name",            offsetof( struct FileShared, fs_Name ), 
	SQLT_STR, (FULONG)"Devname",         offsetof( struct FileShared, fs_DeviceName ), 
	SQLT_STR, (FULONG)"Path",            offsetof( struct FileShared, fs_Path ), 
	SQLT_INT, (FULONG)"UserID",          offsetof( struct FileShared, fs_IDUser ), 
	SQLT_STR, (FULONG)"DstUserSID",      offsetof( struct FileShared, fs_DstUsers ), 
	SQLT_DATETIME, (FULONG)"DateCreated",     offsetof( struct FileShared, fs_CreatedTime ),
	SQLT_STR, (FULONG)"Hash",            offsetof( struct FileShared, fs_Hash ), 
	SQLT_INT, (FULONG)"AppID",           offsetof( struct FileShared, fs_AppID ), 
	SQLT_BLOB, (FULONG)"FileData",       offsetof( struct FileShared, fs_Data ), 
	SQLT_NODE, (FULONG)NULL,             offsetof( struct FileShared, node ), 
	SQLT_END 
};

//
// File Shared
//

FileShared *FileSharedNew( char *path, char *name );

//
//
//

void FileSharedDelete( FileShared *f );

//
//
//

void FileSharedDeleteAll( FileShared *f );

//
//
//

int FileUploadFileOrDirectory( Http *request, void *us, const char *dst, const char *src, int numberFiles );

//
//
//

int FileDownloadFilesOrFolder( Http *request, void *us, const char *basepath, const char *dst, char *src, int *numberFiles );

//
//
//

int FileOrDirectoryDeleteRec( Http *request, File *srcdev, const char *src, int fod, int *numberFiles );


#endif // __SYSTEM_FSYS_FILE_H__
