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
#include <util/sha256.h>

typedef struct UtilInterface
{
	void						(*Log)( int lev, char* fmt, ...);
	char						*(*EncodeStringLenSHA256)( char *data, int len );
	char						*(*EncodeStringSHA256)( char *data );
	char						*(*DatabaseEncodeStringLen)( char *data, int len );
	char						*(*DatabaseEncodeString)( char *data );
}UtilInterface;

//
// init function
//

static inline void UtilInterfaceInit( UtilInterface *ui )
{
	ui->Log = Log;
	ui->EncodeStringLenSHA256 = EncodeStringLenSHA256;
	ui->EncodeStringSHA256 = EncodeStringSHA256;
	ui->DatabaseEncodeStringLen = EncodeStringLenSHA256;		// default encode function
	ui->DatabaseEncodeString = EncodeStringSHA256;				// default encode function
}

#endif // __INTERFACE_UTIL_INTERFACE_H__

