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
