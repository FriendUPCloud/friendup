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
 *  WebdavToken Defintions
 *
 * All functions related to Webdav structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#ifndef __WEBDAV_WEBDAV_TOKEN_H__
#define __WEBDAV_WEBDAV_TOKEN_H__

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>
#include <system/user/user_session.h>
#include <security/fkey.h>

#define WEBDAV_TOKEN_LENGTH 32

//
// WebdavToken structure
//

typedef struct WebdavToken
{
	MinNode						node;
	UserSession					*wt_UserSession;
	char						wt_Nonce[ WEBDAV_TOKEN_LENGTH+1 ];
	char						wt_CNonce[ WEBDAV_TOKEN_LENGTH+1 ];
	char						wt_Realm[ WEBDAV_TOKEN_LENGTH+1 ];
	char						wt_Opaque[ WEBDAV_TOKEN_LENGTH+1 ];
	FKey						*wt_Key;
	time_t						wt_CreationTime;
}WebdavToken;

//
//
//

WebdavToken *WebdavTokenNew();

//
//
//

void WebdavTokenDelete( WebdavToken *cc );

//
//
//

void WebdavTokenDeleteAll( WebdavToken *cc );


#endif // __WEBDAV_WEBDAV_TOKEN_H__
