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
 * Body of DOS token
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (26/03/2018)
 */

#include <core/types.h>
#include <core/nodes.h>
#include <db/sqllib.h>
#include <stddef.h>
#include <system/user/user_session.h>
#include "dos_token.h"
#include <util/session_id.h>

/**
 * Create DOSToken
 *
 * @param us pointer to UserSession
 * @param timeout number of seconds after which token will be deleted
 * @param usedTimes number of times how many token can be used where -1 is equal to infinity 
 * @return new instance of DOSToken
 */
DOSToken *DOSTokenNew( UserSession *us, time_t timeout, int usedTimes )
{
	DOSToken *dt = FCalloc( 1, sizeof(DOSToken) );
	if( dt != NULL )
	{
		dt->ct_Timeout = time( NULL ) + timeout;
		dt->ct_UserSession = us;
		dt->ct_UserSessionID = us->us_ID;
		dt->ct_TokenID = session_id_generate();
		dt->ct_UsedTimes = usedTimes;	// -1 , unlimited
	}
	return dt;
}

/**
 * Delete DOSToken
 *
 * @param d pointer to DOSToken which will be deleted
 */
void DOSTokenDelete( DOSToken *d )
{
	if( d != NULL )
	{
		FFree( d );
	}
}

/**
 * Delete list of DOSTokens
 *
 * @param d pointer to first DOSToken in list
 */
void DOSTokenDeleteAll( DOSToken *d )
{
	while( d != NULL )
	{
		DOSToken *dt = d;
		d = (DOSToken *)d->node.mln_Succ;
		
		DOSTokenDelete( dt );
	}
}

/**
 * Get DOSToken description (JSON)
 *
 * @param dt pointer to DOSToken
 * @param bs pointer to BufferedString where description will be stored
 */
void DOSTokenJSONDescription( DOSToken *dt, BufString *bs )
{
	char buffer[ 2048 ];
	
	int size = snprintf( buffer, sizeof( buffer ), "{\"ID\":\"%lu\",\"usersessionid\":\"%lu\",\"tokenid\":\"%s\",\"usedtimes\":\"%d\",\"timeout\":\"%lu\"}", dt->ct_ID, dt->ct_UserSessionID, dt->ct_TokenID, dt->ct_UsedTimes, dt->ct_Timeout );
	BufStringAddSize( bs, buffer, size );
}
