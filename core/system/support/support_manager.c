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
 *  Support Manager Body
 *
 * file contain all functitons related to all misc functionalities which support FC
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2015
 */

#include <system/support/support_manager.h>
#include <mutex/mutex_manager.h>

/**
 * Create new SupportManager
 *
 * @param sb pointer to SystemBase
 * @return new SupportManager structure when success, otherwise NULL
 */
SupportManager *SupportManagerNew( void *sb )
{
	SupportManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( SupportManager ) ) ) != NULL )
	{
		sm->cm_SB = sb;
		
		pthread_mutex_init( &(sm->cm_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for SupportManager!\n");
	}
	
	return sm;
}

/**
 * Delete SupportManager
 *
 * @param sm pointer to SupportManager which will be deleted
 */
void SupportManagerDelete( SupportManager *sm )
{
	if( sm != NULL )
	{
		pthread_mutex_destroy( &(sm->cm_Mutex) );
		FFree( sm );
	}
}

/**
 * Get Temporary file ID
 *
 * @param sm pointer to SupportManager which will be deleted
 * @return unique file ID
 */
FQUAD SupportManagerGetTempFileID( SupportManager *sm )
{
	FQUAD val = 0;
	if( sm != NULL )
	{
		if( FRIEND_MUTEX_LOCK( &(sm->cm_Mutex) ) == 0 )
		{
			val = sm->cm_TempFileID++;
			FRIEND_MUTEX_UNLOCK( &(sm->cm_Mutex) );
		}
		FFree( sm );
	}
	return val;
}

//
// internal SupportManager thread
//

void SupportManagerThread( SupportManager *sm )
{
	
}

