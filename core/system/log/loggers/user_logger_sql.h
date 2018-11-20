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
 *  user loger sql definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 03/04/2017
 */

#ifndef __UTIL_LOG_LOGGERS_USER_LOGGER_SQL_H__
#define __UTIL_LOG_LOGGERS_USER_LOGGER_SQL_H__

#include <system/log/user_logger.h>
#include <db/sqllib.h>

//
//
//


/*
 CREATE TABLE IF NOT EXISTS `FUserLog` (
	 `ID` bigint(32) NOT NULL AUTO_INCREMENT,
	 `UsersessiondID` varchar(255) DEFAULT NULL,
	 `UserID` bigint(32) NOT NULL,
	 `Action` varchar(255) DEFAULT NULL,
	 `Information` varchar(255) DEFAULT NULL,
	 `CreatedTime` bigint(32) NOT NULL,
	 PRIMARY KEY (`ID`)
	 ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
	 */

//
//
//

typedef struct UserLoggerSQL
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
}UserLoggerSQL;

#endif // __UTIL_LOG_LOGGERS_USER_LOGGER_SQL_H__
