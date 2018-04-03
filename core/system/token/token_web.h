/*©mit**************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
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

