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

/*

 CREATE TABLE IF NOT EXISTS `FDOSToken` ( 
   `ID` bigint(20) NOT NULL AUTO_INCREMENT,
   `UserSessionID` varchar(255),
   `TokenID` varchar(255),
   `Timeout` bigint(32) NOT NULL,
   `UsedTimes` int(8) NOT NULL,
   PRIMARY KEY (`ID`)
 ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

*/

typedef struct DOSToken
{
	struct MinNode 			node;
	FULONG 					ct_ID;					// id of command token
	char 					*ct_TokenID;			// Token ID
	FULONG					ct_UserSessionID;		// User Session ID
	UserSession				*ct_UserSession;
	time_t					ct_Timeout;				// Time when token is not valid
	int						ct_UsedTimes;			// number used times
}DOSToken;

static FULONG DOSTokenDesc[] = { SQLT_TABNAME, (FULONG)"FDOSToken", SQLT_STRUCTSIZE, sizeof( struct DOSToken ),
	SQLT_IDINT, (FULONG)"ID", offsetof( DOSToken, ct_ID ),
	SQLT_INT, (FULONG)"UserSessionID", offsetof( DOSToken, ct_UserSessionID ),
	SQLT_STR, (FULONG)"TokenID", offsetof( DOSToken, ct_TokenID ),
	SQLT_INT, (FULONG)"Timeout", offsetof( DOSToken, ct_Timeout ),
	SQLT_INT, (FULONG)"UsedTimes", offsetof( DOSToken, ct_UsedTimes ),
	SQLT_END };

//
// DOSToken
//

DOSToken *DOSTokenNew( UserSession *us, time_t timeout, int usedTimes );

// release DOSToken

void DOSTokenDelete( DOSToken *d );

// release DOSToken All

void DOSTokenDeleteAll( DOSToken *d );

// get DOSToken json description

void DOSTokenJSONDescription( DOSToken *dt, BufString *bs );

#endif //__SYSTEM_TOKEN_DOS_TOKEN_H__

