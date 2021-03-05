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
 *  Server Token
 *
 * file contain definitions related to Server Token
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/02/2021
 */

#ifndef __SYSTEM_SECURITY_SECURED_HOST_H__
#define __SYSTEM_SECURITY_SECURED_HOST_H__

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <system/user/user_application.h>
#include <network/user_session_websocket.h>
#include <system/user/user.h>
#include <websockets/websocket_req_manager.h>
#include <util/friendqueue.h>

/*
CREATE TABLE IF NOT EXISTS `FSecuredHost` (
  `ID` bigint(32) NOT NULL AUTO_INCREMENT,
  `Host` varchar(255) DEFAULT NULL,
  `Status` bigint(8) NOT NULL,
  `UserID` bigint(32) NOT NULL,
  `CreateTime` bigint(32) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

*/

enum {
SECURED_HOST_STATUS_NONE = 0,
SECURED_HOST_STATUS_ALLOWED,
SECURED_HOST_STATUS_BLOCKED
};

//
// secured host structure
//

typedef struct SecuredHost
{
	MinNode					node;
	
	FULONG					sh_ID;						// ID
	pthread_mutex_t			sh_Mutex;					// mutex
	
	char					*sh_Host;					// Host name
	FULONG					sh_Status;					// Host status
	FQUAD					sh_UserID;					// ID of user which created host entry
	time_t					sh_CreateTime;				// Time when entry was created
}SecuredHost;

//
//
//

SecuredHost *SecuredHostNew( );

//
//
//

void SecuredHostDelete( SecuredHost *sh );

//
//
//

void SecuredHostInit( SecuredHost *sh );

//
//
//

static FULONG SecuredHostDesc[] = { 
	SQLT_TABNAME, (FULONG)"FSecuredHost",       
	SQLT_STRUCTSIZE, sizeof( struct SecuredHost ), 
	SQLT_IDINT,   (FULONG)"ID",          offsetof( struct SecuredHost, sh_ID ), 
	SQLT_STR,     (FULONG)"Host", offsetof( struct SecuredHost, sh_Host ),
	SQLT_INT,     (FULONG)"Status", offsetof( struct SecuredHost, sh_Status ),
	SQLT_INT,     (FULONG)"UserID",   offsetof( struct SecuredHost, sh_UserID ),
	SQLT_INT,     (FULONG)"CreateTime", offsetof( struct SecuredHost, sh_CreateTime ),

	SQLT_INIT_FUNCTION, (FULONG)"init", (FULONG)&SecuredHostInit,
	SQLT_NODE,    (FULONG)"node",        offsetof( struct SecuredHost, node ),
	SQLT_END 
};

#endif // __SYSTEM_SECURITY_SECURED_HOST_H__


