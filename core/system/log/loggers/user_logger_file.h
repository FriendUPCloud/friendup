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
 *  user loger file definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/04/2017
 */

#ifndef __UTIL_LOG_LOGGERS_USER_LOGGER_FILE_H__
#define __UTIL_LOG_LOGGERS_USER_LOGGER_FILE_H__

#include <system/log/user_logger.h>

//
//
//

typedef struct UserLoggerFile
{
	struct MinNode node;
	
	char                    *Name;
	char                    *Path;			
	void                    *handle;		// lib handler
	
	void                    (*init)( struct UserLogger *s );
	void                    (*deinit)( struct UserLogger *s );

	int                     (*StoreInformation)( struct UserLogger *s, UserSession *session, char *actions, char *information );
	
	void                   *ul_SD;  // special data
	void                   *ul_SB; // system base
}UserLoggerFile;

#endif // __UTIL_LOG_LOGGERS_USER_LOGGER_FILE_H__
