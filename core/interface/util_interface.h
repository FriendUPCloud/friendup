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
 *  Util Interface definition
 *
 *  @author PS (Pawel Stefanski)
 *  @date pushed 22/05/2020
 */
#ifndef __INTERFACE_UTIL_INTERFACE_H__
#define __INTERFACE_UTIL_INTERFACE_H__

#include <util/log/log.h>
#include <system/support/support_manager.h>

typedef struct UtilInterface
{
	void						(*Log)( int lev, char* fmt, ...);
	FQUAD						(*GetUniqueFileID)( SupportManager *sm );
}UtilInterface;

//
// init function
//

static inline void UtilInterfaceInit( UtilInterface *ui )
{
	ui->Log = Log;
	ui->GetUniqueFileID = SupportManagerGetTempFileID;
}

#endif // __INTERFACE_UTIL_INTERFACE_H__

