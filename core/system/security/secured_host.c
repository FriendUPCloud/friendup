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
 *  Server Token
 *
 * file contain definitions related to Server Token
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 12/02/2021
 */

#include <core/types.h>
#include "secured_host.h"

/**
 * Create new Secured Host
 *
 * @return new SecuredHost structure when success, otherwise NULL
 */

SecuredHost *SecuredHostNew( )
{
	SecuredHost *sh = NULL;
	
	if( ( sh = FCalloc( 1, sizeof( SecuredHost ) ) ) != NULL )
	{
	
		SecuredHostInit( sh );
	}
	
	return sh;
}


/**
 * SecuredHost delete
 *
 * @param sh pointer to SecuredHost
 */
void SecuredHostDelete( SecuredHost *sh )
{
	if( sh != NULL )
	{
		FFree( sh );
	}
}


/**
 * SecuredHost init
 *
 * @param sh pointer to SecuredHost
 */
void SecuredHostInit( SecuredHost *sh )
{
	
}
