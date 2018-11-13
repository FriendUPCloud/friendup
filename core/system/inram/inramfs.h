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
 *  INRAM Filesystem definitions
 * Network Only Memory FileSystem
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SYSTEM_INRAM_INRAMFS_H__
#define __SYSTEM_INRAM_INRAMFS_H__

#include <core/types.h>
#include <core/nodes.h>
#include <stddef.h>
#include <time.h>
#include <util/buffered_string.h>

//
// type of file
//

#define INRAM_ROOT	1
#define INRAM_FILE	2
#define INRAM_DIR		3

#define INRAM_ERROR_DIRECTORY_FOUND 2
#define INRAM_ERROR_FILE_FOUND 1
#define INRAM_ERROR_NO 0
#define INRAM_ERROR_PATH_DO_NOT_EXIST -1
#define INRAM_ERROR_PATH_DEFAULT -2
#define INRAM_ERROR_PATH_WRONG -3

//
// nom file structure
//

/*
	sprintf( tmp, " \"Filename\":\"%s\",", GetFileName( path ) );

		sprintf( tmp, "\"Path\":\"%s:\",", d->f_Name );
	}
	
	sprintf( tmp, "\"Filesize\": %d,",(int) s->st_size );

	if( S_ISDIR( s->st_mode ) )
		BufStringAdd( bs,  "\"MetaType\":\"Directory\",\"Type\":\"Directory\" }" );
	else
		BufStringAdd( bs, "\"MetaType\":\"File\",\"Type\":\"File\" }" );
 */

typedef struct INRAMFile
{
	MinNode node;
	int 				nf_Type;
	char 				*nf_Name;
	char 				*nf_Path;
	BufString 			*nf_Data;
	FUQUAD 				nf_Offset;
	time_t 				*nf_CreateTime;
	
	struct INRAMFile	*nf_Parent;
	struct INRAMFile	*nf_Children;
}INRAMFile;

//
// INRAMFile Create
//

INRAMFile *INRAMFileNew( int type, char *path, char *name );

//
// INRAMFile Delete
//

FLONG INRAMFileDelete( INRAMFile *nf );

//
// Add Children
//

int INRAMFileAddChild( INRAMFile *root, INRAMFile *toadd );

//
// get INRAMFile by name
//

INRAMFile *INRAMFileGetChildByName( INRAMFile *root, char *name );

//
// Remove Children
//

INRAMFile *INRAMFileRemoveChild( INRAMFile *root, INRAMFile *toadd );

//
// Remove all
//

INRAMFile *INRAMFileRemove( INRAMFile *root, INRAMFile *toadd );

//
// Remove Children
//

INRAMFile *INRAMFileRemoveChildByPath( INRAMFile *root, char *path );

//
// Remove all
//

INRAMFile *INRAMFileRemoveByPath( INRAMFile *root, char *path );

//
// Delete all files
//

FLONG INRAMFileDeleteAll( INRAMFile *root );

//
// find pointer to last path
//

INRAMFile *INRAMFileGetLastPath( INRAMFile *root, const char *path, int *error );

//
// make directory in destination path
//

INRAMFile *INRAMFileMakedirPath( INRAMFile *root, char *path, int *error );

#endif //__SYSTEM_INRAM_INRAM_H__
