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
 *  User Application body
 *
 * file contain all functitons related to user applications
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_application.h"

/**
 * Create new instance of UserApplication
 *
 * @param id User ID
 * @param appid unique application ID
 * @param perm permissions
 * @param authid authentication ID
 * @return new UserApplication structure when success, otherwise NULL
 */
UserApplication *UserAppNew( FULONG id, FULONG appid, char *perm, char *authid )
{
	UserApplication *ua = NULL;
	
	if( ( ua = FCalloc( 1, sizeof(UserApplication) ) ) != NULL )
	{
		ua->ua_UserID = id;
		ua->ua_ApplicationID = appid;
		int len = strlen( perm );
		
		if( len > 0 )
		{
			ua->ua_Permissions = FCalloc( len+10, sizeof( char ) );
			if( ua->ua_Permissions != NULL )
			{
				strcpy( ua->ua_Permissions, perm );
			}
		}
		
		int lenauth = strlen( authid );
		if( lenauth > 0 )
		{
			ua->ua_AuthID = FCalloc( len+10, sizeof( char ) );
			if( ua->ua_AuthID != NULL )
			{
				strcpy( ua->ua_AuthID, authid );
			}
		}
		
		DEBUG("[UserAppNew] Added user application perm: %s authid %s\n", ua->ua_Permissions, ua->ua_AuthID );
	}
	else
	{
		FERROR("Cannot allocate memory for UserApplication\n");
	}
	
	return ua;
}

/**
 * Delete UserApplication
 *
 * @param app pointer to UserApplication which will be deleted
 */
void UserAppDelete( UserApplication *app )
{
	if( app->ua_Permissions != NULL )
	{
		FFree( app->ua_Permissions );
		app->ua_Permissions = NULL;
	}
	
	if( app->ua_AuthID != NULL )
	{
		FFree( app->ua_AuthID );
		app->ua_AuthID = NULL;
	}
	
	FFree( app );
}

/**
 * Delete UserApplication linked list
 *
 * @param ua pointer to UserApplication first element in list
 */
void UserAppDeleteAll( UserApplication *ua )
{
	UserApplication *rem = ua;
	UserApplication *next = ua;
	
	while( next != NULL )
	{
		rem = next;
		next = (UserApplication *)next->node.mln_Succ;
		
		UserAppDelete( rem );
	}
}
