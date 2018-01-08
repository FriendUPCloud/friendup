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
