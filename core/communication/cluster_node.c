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

