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


