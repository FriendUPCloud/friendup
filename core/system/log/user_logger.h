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
 *  user log definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 03/04/2017
 */

#ifndef __UTIL_LOG_USER_LOGGER_H__
#define __UTIL_LOG_USER_LOGGER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/user/user_session.h>

//
// user log entry
//

typedef struct UserLog
{
	MinNode         node;
	FUQUAD         ul_ID;
	char                *ul_UserSessionID;
	FUQUAD         ul_UserID;
	char                *ul_Action;
	char                *ul_Information;
	time_t             ul_CreatedTime;
} UserLog;

static FULONG UserLogDesc[] = { 
	SQLT_TABNAME, (FULONG)"FUserLog",       
	SQLT_STRUCTSIZE, sizeof( struct UserLog ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct UserLog, ul_ID ), 
	SQLT_STR,     (FULONG)"UsersessiondID",        offsetof( struct UserLog, ul_UserSessionID ),
	SQLT_INT,     (FULONG)"UserID",    offsetof( struct UserLog, ul_UserID ),
	SQLT_STR,     (FULONG)"Action",    offsetof( struct UserLog, ul_Action ),
	SQLT_STR,     (FULONG)"Information",       offsetof( struct UserLog, ul_Information ),
	SQLT_INT,     (FULONG)"CreatedTime", offsetof( struct UserLog, ul_CreatedTime ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct UserLog, node ),
	SQLT_END 
};

//
//
//

typedef struct UserLogger
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
}UserLogger;

//
// Create UserLogger entry
//

UserLogger *UserLoggerCreate( void *sb, const char *path, const char *name );

//
// Delete UserLogger
//

void UserLoggerDelete( UserLogger *fsys );

#endif // __UTIL_LOG_USER_LOGGER_H__
