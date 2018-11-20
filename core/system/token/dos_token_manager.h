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
 * Definition of DOS token manager
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (27/03/2018)
 */

#ifndef __SYSTEM_TOKEN_DOS_TOKEN_MANAGER_H__
#define __SYSTEM_TOKEN_DOS_TOKEN_MANAGER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>
#include "dos_token.h"

typedef struct DOSTokenManager
{
	struct MinNode 			node;
	DOSToken				*dtm_Tokens;
	pthread_mutex_t			dtm_Mutex;
	void					*dtm_SB;	// SystemBase
}DOSTokenManager;

//
// DOSTokenManager
//

DOSTokenManager *DOSTokenManagerNew( void *sb );

//
// release DOSTokenManager
//

void DOSTokenManagerDelete( DOSTokenManager *d );

//
// add DOSToken
//

int DOSTokenManagerAddDOSToken( DOSTokenManager *d, DOSToken *dt );

//
// delete DOSToken
//

int DOSTokenManagerDeleteToken( DOSTokenManager *d, char *id );

//
// get DOSToken
//

DOSToken *DOSTokenManagerGetDOSToken( DOSTokenManager *d, const char *tokenID );

//
// list all DOSTokens
//

BufString *DOSTokenManagerList( DOSTokenManager *dtm );

//
// erase user session
//

int DOSTokenManagerEraseUserSession( DOSTokenManager *dtm, UserSession *s );

//
// auto delete tokens
//

void DOSTokenManagerAutoDelete( DOSTokenManager *d );

#endif //__SYSTEM_TOKEN_DOS_TOKEN_MANAGER_H__


