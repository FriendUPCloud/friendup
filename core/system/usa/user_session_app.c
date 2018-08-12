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
 *  User Session App
 *
 * file contain body related to user sessions app
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 25/07/2016
 */

#include "user_session_app.h"
#include <util/string.h>
#include <system/systembase.h>
#include <system/token/dos_token.h>

extern SystemBase *SLIB;

/**
 * Create new User Session App
 *
 * @param us pointer to UserSession
 * @param appID Application ID
 * @return new UserSessionApp structure when success, otherwise NULL
 */
UserSessionApp *UserSessionAppNew( UserSession *us, FULONG appID )
{
	UserSessionApp *s;
	if( ( s = FCalloc( 1, sizeof(UserSessionApp) ) ) != NULL )
	{
		s->usa_DeviceIdentity = StringDuplicate( us->us_DeviceIdentity );
		s->usa_UserSessionID = us->us_ID;
		s->usa_UserSession = us;
		s->usa_UserID = us->us_UserID;
		s->usa_User = us->us_User;
		s->usa_ApplicationID = appID;
		
		UserSessionAppInit( s );
		
		INFO("Mutex initialized\n");
	}
	return s;
}

/**
 * UserSessionApp init
 *
 * @param us pointer to UserSessionApp which will be initalized
 */
void UserSessionAppInit( UserSessionApp *us )
{
	if( us != NULL )
	{

	}
}

/**
 * Delete UserSessionApp
 *
 * @param us pointer to UserSessionApp which will be deleted
 */
void UserSessionAppDelete( UserSessionApp *us )
{
	if( us != NULL )
	{

		if( us->usa_DeviceIdentity != NULL )
		{
			FFree( us->usa_DeviceIdentity );
		}

		FFree( us );
	}
}
