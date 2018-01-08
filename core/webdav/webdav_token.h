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
	time_t						wt_CreateTime;
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
