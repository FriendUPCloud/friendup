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
 * Remote User
 *
 * All functions related to User structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 29/05/2017
 */

#include "refresh_token.h"
#include <system/systembase.h>

/**
 * Create new Refresh Token
 *
 * @return new RemoteUser structure when success, otherwise NULL
 */
RefreshToken *RefreshTokenNew( )
{
	RefreshToken *rt = NULL;
	
	if( ( rt = FCalloc( 1, sizeof( RefreshToken ) ) ) != NULL )
	{
		
	}
	return rt;
}

/**
 * Remove RemoteUser structure
 *
 * @param usr pointer to RemoteUser structure which will be deleted
 */
void RefreshTokenDelete( RefreshToken *tk )
{
	if( tk != NULL )
	{
		if( tk->rt_Token != NULL )
		{
			FFree( tk->rt_Token );
		}
		
		if( tk->rt_DeviceID != NULL )
		{
			FFree( tk->rt_DeviceID );
		}
		
		FFree( tk );
	}
}
