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
 * file contain function definitions related to webdavtokenmanager
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#ifndef __WEBDAV_WEBDAV_TOKEN_MANAGER_H__
#define __WEBDAV_WEBDAV_TOKEN_MANAGER_H__

#include <core/types.h>
#include <network/locfile.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "webdav_token.h"
#include <system/user/user.h>

//
//
//

typedef struct WebdavTokenManager
{
	WebdavToken		*wtm_Tokens;
	void			*wtm_SB;
	pthread_mutex_t	wtm_Mutex;
}WebdavTokenManager;

//
//
//

WebdavTokenManager *WebdavTokenManagerNew( void *sb );

//
//
//

void WebdavTokenManagerDelete( WebdavTokenManager *km );

//
//
//

WebdavToken *WebdavTokenManagerGenerateToken( WebdavTokenManager *tm );

//
//
//

int WebdavTokenManagerAddToken( WebdavTokenManager *wtm, WebdavToken *tok );

//
//
//

WebdavToken *WebdavTokenManagerGetTokenNonce( WebdavTokenManager *wtm, char *nonce );

//
//
//

void WebdavTokenManagerDeleteOld( WebdavTokenManager *wtm );

#endif //__WEBDAV_WEBDAV_TOKEN_MANAGER_H__

