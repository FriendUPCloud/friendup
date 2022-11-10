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
#include "sas_manager.h"
#include <system/systembase.h>
#include "sas_session.h"
#include <core/functions.h>

/**
 * Create SAS Manager
 *
 * @param sb pointer to SystemBase
 * @return SASManager
 */

SASManager *SASManagerNew( void *sb )
{
	SASManager *as = NULL;
	
	if( ( as = FCalloc( 1, sizeof( SASManager ) ) ) != NULL )
	{
		as->sasm_SB = sb;
		pthread_mutex_init( &(as->sasm_Mutex), NULL );
	}
	else
	{
		FERROR("Cannot allocate memory for SASManager\n");
	}
	
	return as;
}

/**
 * Delete SAS Manager
 *
 * @param asm application session to remove
 */

void SASManagerDelete( SASManager *asm )
{
	DEBUG("[AppSessionManagerGetSession] AppSessionManagerDelete\n");
	if( asm != NULL )
	{
		pthread_mutex_destroy( &(asm->sasm_Mutex) );
		
		FFree( asm );
	}
}
