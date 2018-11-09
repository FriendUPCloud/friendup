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
 *  Cluster Node Body
 *
 * All functions related to ClusterNode structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 13/09/2016
 */

#include "cluster_node.h"

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

/**
 * Create new ClusterNode structure
 *
 * @return return new ClusterNode structure when success, otherwise NULL
 */
ClusterNode *ClusterNodeNew()
{
	ClusterNode *cc = FCalloc( 1, sizeof( ClusterNode ) );
	if( cc != NULL )
	{
		
	}
	
	return cc;
}

/**
 * Delete ClusterNode
 *
 * @param cc pointer to ClusterNode which will be deleted
 */
void ClusterNodeDelete( ClusterNode *cc )
{
	if( cc != NULL )
	{
		DEBUG("[ClusterNodeDelete] delete %p\n", cc );
		if( cc->cn_Address != NULL )
		{
			FFree( cc->cn_Address );
		}
		if( cc->cn_FCID != NULL )
		{
			FFree( cc->cn_FCID );
		}
		if( cc->cn_Url != NULL )
		{
			FFree( cc->cn_Url );
		}
		
		DEBUG("[ClusterNodeDelete] delete %p END\n", cc );
		FFree( cc );
	}
}

/**
 * Delete All ClusterNode's
 *
 * @param cc pointer to first ClusterNode in list which will be deleted (list)
 */
void ClusterNodeDeleteAll( ClusterNode *cc )
{
	while( cc != NULL )
	{
		ClusterNode *rem = cc;
		cc = (ClusterNode *)cc->node.mln_Succ;
		
		ClusterNodeDelete( rem );
	}
}

