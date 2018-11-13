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
 *  Communcation Service Security Body
 *
 * All functions related to ConnectionInfo structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/09/2016
 */

#include "connection_info.h"

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

/**
 * Create new ConnectionInfo structure
 *
 * @return return new ConnectionInfo structure when success, otherwise NULL
 */

/*
ConnectionInfo *ConnectionInfoNew()
{
	ConnectionInfo *cc = FCalloc( 1, sizeof( ConnectionInfo ) );
	if( cc != NULL )
	{
		
	}
	
	return cc;
}
*/

/**
 * Delete ConnectionInfo
 *
 * @param cc pointer to ConnectionInfo which will be deleted
 */

/*
void ConnectionInfoDelete( ConnectionInfo *cc )
{
	if( cc != NULL )
	{
		DEBUG("[ConnectionInfoDelete] Delete %p\n", cc );

		if( cc->ci_FCID != NULL )
		{
			FFree( cc->ci_FCID );
		}
		if( cc->ci_DestinationFCID != NULL )
		{
			FFree( cc->ci_DestinationFCID );
		}
		if( cc->ci_Address != NULL )
		{
			FFree( cc->ci_Address );
		}
		if( cc->ci_SSLInfo != NULL )
		{
			FFree( cc->ci_SSLInfo );
		}
		if( cc->ci_PEM != NULL )
		{
			FFree( cc->ci_PEM );
		}
		DEBUG("[ConnectionInfoDelete] Delete %p END\n", cc );
		
		FFree( cc );
	}
}
*/
/**
 * Delete All ConnectionInfo's
 *
 * @param cc pointer to first ConnectionInfo in list which will be deleted (list)
 */
/*
void ConnectionInfoDeleteAll( ConnectionInfo *cc )
{
	while( cc != NULL )
	{
		ConnectionInfo *rem = cc;
		cc = (ConnectionInfo *)cc->node.mln_Succ;
		
		ConnectionInfoDelete( rem );
	}
}
*/
