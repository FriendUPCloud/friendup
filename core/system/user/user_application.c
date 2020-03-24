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
 *  User Application body
 *
 * file contain all functitons related to user applications
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */

#include "user_application.h"
#include <util/session_id.h>

/**
 * Create new instance of UserApplication
 *
 * @param userid User ID
 * @param appid unique application ID
 * @param userSessionID user session ID
 * @param perm permissions
 * @return new UserApplication structure when success, otherwise NULL
 */
UserApplication *UserAppNew( FULONG userid, FULONG appid, FULONG userSesionID, char *perm )
{
	UserApplication *ua = NULL;
	
	if( ( ua = FCalloc( 1, sizeof(UserApplication) ) ) != NULL )
	{
		ua->ua_UserID = userid;
		ua->ua_ApplicationID = appid;
		ua->ua_UserSessionID = userSesionID;
		ua->ua_DateCreated = time( NULL );
		
		if( perm != NULL )
		{
			int len = strlen( perm );
			if( len > 0 )
			{
				ua->ua_Permissions = StringDuplicate( perm );
			}
		}
		
		ua->ua_AuthID = SessionIDGenerate();
		// to recognize this is application session
		if( ua->ua_AuthID != NULL )
		{
			ua->ua_AuthID[0] = 'A';
			ua->ua_AuthID[1] = 'S';
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
	
	if( app->ua_Data != NULL )
	{
		FFree( app->ua_Data );
		app->ua_Data = NULL;
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
