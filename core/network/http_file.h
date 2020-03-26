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
 *  Http structures and functions definitions
 *
 *  @author PS
 *  @date created 26/03/2020
 */

#ifndef __NETWORK_HTTP_FILE_H__
#define __NETWORK_HTTP_FILE_H__

//
//
//
#include <core/types.h>
#include <time.h>
#include <fcntl.h>
#include <errno.h>
#include "util/hashmap.h"
#include "util/list.h"
#include "network/uri.h"
#include "network/socket.h"
#include <util/tagitem.h>
#include <network/user_session_websocket.h>

typedef struct HttpFile
{
	char			hf_FileName[ 512 ];
	char			hf_FileNameOnDisk[ 128 ];
	char 			*hf_Data;
	FQUAD			hf_FileSize;		// file size
	FILE			*hf_FP;			// when file is stored on server disk
	int				hf_FileHandle;
	struct MinNode 	node;
}HttpFile;

//
// upload file
//

HttpFile *HttpFileNew( char *filename, int fnamesize, char *data, FQUAD size );

//
//
//

void HttpFileDelete( HttpFile *f );

#endif // __NETWORK_HTTP_FILE_H__

