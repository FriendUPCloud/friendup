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
 *  Refresh Token
 *
 * All functions related to Refresh Token structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 26/02/2021
 */

#ifndef __SYSTEM_SECURITY_REFRESHTOKEN_H__
#define __SYSTEM_SECURITY_REFRESHTOKEN_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <system/fsys/file.h>
#include <libwebsockets.h>
#include <network/websocket_client.h>
#include <system/services/service.h>
#include <hardware/printer/printer.h>
#include <time.h>


/*
CREATE TABLE IF NOT EXISTS `FRefreshToken` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `Token` varchar(512) NOT NULL,
  `DeviceID` varchar(512) NOT NULL,
  `UserID` bigint(20) NOT NULL,
  `CreatedTime` bigint(20) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

*/

//
// Refresh Token
//

typedef struct RefreshToken
{
	MinNode						node;
	FUQUAD						rt_ID;
	char						*rt_Token;
	char						*rt_DeviceID;
	FUQUAD						rt_UserID;
	time_t						rt_CreatedTime;
}RefreshToken;


//
// SQL structure
//

static FULONG RefreshTokenDesc[] = { 
	SQLT_TABNAME, (FULONG)"FRefreshToken",       
	SQLT_STRUCTSIZE, sizeof( struct RefreshToken ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct RefreshToken, rt_ID ), 
	SQLT_STR,     (FULONG)"Token",       offsetof( struct RefreshToken, rt_Token ),
	SQLT_STR,     (FULONG)"DeviceID",    offsetof( struct RefreshToken, rt_DeviceID ),
	SQLT_INT,     (FULONG)"UserID",      offsetof( struct RefreshToken, rt_UserID ),
	SQLT_INT,     (FULONG)"CreatedTime", offsetof( struct RefreshToken, rt_CreatedTime ),
	SQLT_NODE,    (FULONG)"node",        offsetof( struct RefreshToken, node ),
	SQLT_END 
};

RefreshToken *RefreshTokenNew( );

//
//
//

void RefreshTokenDelete( RefreshToken *tk );


#endif // __SYSTEM_SECURITY_REFRESHTOKEN_H__
