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
 *  Token Web header
 *
 *  All functions related to Tokens
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 01/12/2017
 */

#ifndef __SYSTEM_TOKEN_TOKEN_WEB_H__
#define __SYSTEM_TOKEN_TOKEN_WEB_H__

#include <core/types.h>
#include <core/nodes.h>
#include <network/http.h>
#include <system/user/user_session.h>

//
//
//

Http *TokenWebRequest( void *m, char **urlpath, Http **request, UserSession *loggedSession, int *result );

#endif // __SYSTEM_TOKEN_TOKEN_WEB_H__

