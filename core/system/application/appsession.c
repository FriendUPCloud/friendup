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
 *  App Session
 *
 * file contain all functitons related to application session
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/2021
 */

#include "appsession.h"
#include <util/string.h>
#include <system/systembase.h>
#include <system/token/dos_token.h>
#include <system/application/application_manager.h>
#include <util/session_id.h>

/**
 * Create new App Session
 *
 * @param sb pointer to SystemBase
 * @param applicationID application ID
 * @param userID user ID
 * @param authid AuthID. If provided it will be used
 * @param userSessionID user session id which points to 
 * @return new UserSession structure when success, otherwise NULL
 */
AppSession *AppSessionNew( void *sb, FQUAD applicationID, FQUAD userID, char *authid )
{
	AppSession *as;
	if( ( as = FCalloc( 1, sizeof(AppSession) ) ) != NULL )
	{
		if( authid != NULL )
		{
			as->as_AuthID = StringDuplicate( authid );
		}
		else
		{
			as->as_AuthID = SessionIDGenerate();
		}
		
		as->as_UserID = userID;
		as->as_ApplicationID = applicationID;

		AppSessionInit( as, sb );
	}
	return as;
}

/**
 * UserSession init
 *
 * @param us pointer to UserSession which will be initalized
 * @param sb pointer to SessionBase
 */
void AppSessionInit( AppSession *as, void *sb )
{
	if( as != NULL )
	{
		SystemBase *lsb = (SystemBase *)sb;
		pthread_mutex_init( &as->as_Mutex, NULL );
		
		as->as_HashedAuthID = lsb->sl_UtilInterface.DatabaseEncodeString( as->as_AuthID );
	}
}

/**
 * Delete UserSession
 *
 * @param us pointer to UserSession which will be deleted
 */
void AppSessionDelete( AppSession *as )
{
	if( as != NULL )
	{
		Log( FLOG_DEBUG, "AppSessionDelete will be removed: %s\n", as->as_AuthID );

		// we must wait till all tasks will be finished
		while( TRUE )
		{
            if( as->as_InUse <= 0 )
			{
				break;
			}
			DEBUG( "[AppSessionDelete] Trying to wait for use counter to be <= 0\n" );
			usleep( 1000 );
		}

		pthread_mutex_destroy( &(as->as_Mutex) );

		FFree( as );
	}
}


