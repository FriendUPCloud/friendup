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
 *  Support Manager header
 *
 * file contain definition of functitons related to all misc functionalities which support FC
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#ifndef __SUPPORT_SUPPORT_MANAGER_H__
#define __SUPPORT_SUPPORT_MANAGER_H__

#include <core/types.h>
#include <network/file_download.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

//
//
//

typedef struct SupportManager
{
	void				*cm_SB;
	
	FUQUAD				cm_CacheSize;
	FUQUAD 				cm_CacheMax;

	pthread_mutex_t		cm_Mutex;
	FQUAD				cm_TempFileID;		// function used to get file ID
}SupportManager;

//
//
//

SupportManager *SupportManagerNew( void *sb );

//
//
//

void SupportManagerDelete( SupportManager *sm );

//
//
//

void SupportManagerThread( SupportManager *sm );

//
//
//

FQUAD SupportManagerGetTempFileID( SupportManager *sm );

#endif //__SUPPORT_SUPPORT_MANAGER_H__
