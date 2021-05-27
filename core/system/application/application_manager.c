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
 *  App Session Manager
 *
 * file contain all functitons related to application sessions management
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 11/2016
 */
#include "application_manager.h"
#include <system/systembase.h>
//#include "app_session.h"
#include <core/functions.h>

/**
 * Create Application Manager
 *
 * @param sb pointer to SystemBase
 * @return ApplicationManager
 */

ApplicationManager *ApplicationManagerNew( void *sb )
{
	ApplicationManager *as = NULL;
	
	if( ( as = FCalloc( 1, sizeof( ApplicationManager ) ) ) != NULL )
	{
		as->am_SB = sb;
		pthread_mutex_init( &(as->am_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for ApplicationManager\n");
	}
	
	return as;
}

/**
 * Delete Application Manager
 *
 * @param asm application session to remove
 */

void ApplicationManagerDelete( ApplicationManager *asm )
{
	DEBUG("[AppSessionManagerGetSession] AppSessionManagerDelete\n");
	if( asm != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(asm->am_Mutex) ) == 0 )
		{

			FRIEND_MUTEX_UNLOCK( &(asm->am_Mutex) );
		}
		pthread_mutex_destroy( &(asm->am_Mutex) );
		
		FFree( asm );
	}
}

/**
 * Remove Application Session
 *
 * @param asm pointer to application session manager
 * @param id of user which application session will be removed
 */

void ApplicationManagerRemoveApplicationSessionByUserID( ApplicationManager *asm, FUQUAD id )
{
	/*
	if( asm != NULL )
	{
		SystemBase *sb = (SystemBase *)asm->am_SB;
		//select * from FUserApplication ua left outer join FUserSession us on ua.UserID=us.UserID where us.SessionID is null ORDER BY `ua`.`ID` ASC

		SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
		if( sqllib != NULL )
		{
			DEBUG("[ApplicationManagerRemoveApplicationSessionByUserID] start\n");
			char temp[ 1024 ];

			// we remove old entries older then 24 hours
			snprintf( temp, sizeof(temp), "DELETE from FUserApplication ua left outer join FUserSession us on ua.UserID=us.UserID where ua.UserID=%lu AND us.SessionID is null", id );
		
			sqllib->QueryWithoutResults( sqllib, temp );
		
			sb->LibrarySQLDrop( sb, sqllib );
		}
	}
	*/
}

/**
 * Remove Application Session
 *
 * @param asm pointer to application session manager
 * @param id of user which application session will be removed
 */

void ApplicationManagerRemoveApplicationSessionByUserSessionID( ApplicationManager *asm, FUQUAD id )
{
	/*
	if( asm != NULL )
	{
		SystemBase *sb = (SystemBase *)asm->am_SB;
		//select * from FUserApplication ua left outer join FUserSession us on ua.UserID=us.UserID where us.SessionID is null ORDER BY `ua`.`ID` ASC

		SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
		if( sqllib != NULL )
		{
			DEBUG("[ApplicationManagerRemoveApplicationSessionByUserID] start\n");
			char temp[ 1024 ];

			// we remove old entries older then 24 hours
			snprintf( temp, sizeof(temp), "DELETE from FUserApplication where UserSessionID=%lu", id );
		
			sqllib->QueryWithoutResults( sqllib, temp );
		
			sb->LibrarySQLDrop( sb, sqllib );
		}
	}
	*/
}

/**
 * Remove Application Session
 *
 * @param asm pointer to application session manager
 */

void ApplicationManagerRemoveDetachedApplicationSession( ApplicationManager *asm )
{
	/*
	if( asm != NULL )
	{
		SystemBase *sb = (SystemBase *)asm->am_SB;

		SQLLibrary *sqllib = sb->LibrarySQLGet( sb );
		if( sqllib != NULL )
		{
			DEBUG("[ApplicationManagerRemoveApplicationSessionByUserID] start\n");
			char temp[ 1024 ];

			// we remove old entries older then 24 hours
			snprintf( temp, sizeof(temp), "DELETE from FUserApplication ua left outer join FUserSession us on ua.UserSessionID=us.ID where us.SessionID is null" );
		
			sqllib->QueryWithoutResults( sqllib, temp );
		
			sb->LibrarySQLDrop( sb, sqllib );
		}
	}
	*/
}


