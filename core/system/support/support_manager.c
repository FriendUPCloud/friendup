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

/**
 * Create new SupportManager
 *
 * @return new SupportManager structure when success, otherwise NULL
 */
SupportManager *SupportManagerNew( )
{
	SupportManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( SupportManager ) ) ) != NULL )
	{
		
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
		FFree( sm );
	}
}

//
// internal SupportManager thread
//

void SupportManagerThread( SupportManager *sm )
{
	
}

