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
 * Definition of DOS token
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (26/03/2018)
 */

#ifndef __SYSTEM_TOKEN_DOS_TOKEN_H__
#define __SYSTEM_TOKEN_DOS_TOKEN_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>

#ifndef DOSTOKEN_MAX_PATH_SIZE
#define DOSTOKEN_MAX_PATH_SIZE 32
#endif

/*

 CREATE TABLE IF NOT EXISTS `FDOSToken` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `UserSessionID` varchar(255),
   `UserID` bigint(20) NOT NULL,
   `TokenID` varchar(255),
   `Commands` text,
   `Timeout` bigint(32) NOT NULL,
   `UsedTimes` int(8) NOT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

*/

typedef struct DOSTokenPath
{
	char				*path[ DOSTOKEN_MAX_PATH_SIZE ];
}DOSTokenPath;

typedef struct DOSToken
{
	struct MinNode 			node;
	FULONG 					ct_ID;					// id of command token
	char 					*ct_TokenID;			// Token ID
	FULONG					ct_UserSessionID;		// User Session ID
	UserSession				*ct_UserSession;
	FULONG					ct_UserID;				// user id
	User					*ct_User;				// pointer to User
	char					*ct_Commands;			// allowed commands
	time_t					ct_Timeout;				// Time when token is not valid
	int						ct_UsedTimes;			// number used times
	int						ct_MaxAccess;			// number of access entries
	DOSTokenPath			*ct_AccessPath;			// access to functions
}DOSToken;



//
// DOSToken
//

DOSToken *DOSTokenNew( UserSession *us, time_t timeout, int usedTimes );

// Init DOSToken

void DOSTokenInit( DOSToken *dt );

// release DOSToken

void DOSTokenDelete( DOSToken *d );

// release DOSToken All

void DOSTokenDeleteAll( DOSToken *d );

// get DOSToken json description

void DOSTokenJSONDescription( DOSToken *dt, BufString *bs );

static FULONG DOSTokenDesc[] = { SQLT_TABNAME, (FULONG)"FDOSToken", SQLT_STRUCTSIZE, sizeof( struct DOSToken ),
	SQLT_IDINT, (FULONG)"ID", offsetof( DOSToken, ct_ID ),
	SQLT_INT, (FULONG)"UserSessionID", offsetof( DOSToken, ct_UserSessionID ),
	SQLT_INT, (FULONG)"UserID", offsetof( DOSToken, ct_UserID ),
	SQLT_STR, (FULONG)"TokenID", offsetof( DOSToken, ct_TokenID ),
	SQLT_STR, (FULONG)"Commands", offsetof( DOSToken, ct_Commands ),
	SQLT_INT, (FULONG)"Timeout", offsetof( DOSToken, ct_Timeout ),
	SQLT_INT, (FULONG)"UsedTimes", offsetof( DOSToken, ct_UsedTimes ),
	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&DOSTokenInit,
	SQLT_END };

#endif //__SYSTEM_TOKEN_DOS_TOKEN_H__

