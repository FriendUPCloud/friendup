
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
 *  Keys Body
 *
 * All functions related to Keys structure
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 09/10/2017
 */

#include <stddef.h>

#include <core/types.h>
#include <core/nodes.h>

#include <db/sql_defs.h>
#include <time.h>

#include "fkey.h"

/**
 * Create new FKey
 *
 * @return new FKey structure when success, otherwise NULL
 */
FKey *FKeyNew()
{
	FKey *key = FCalloc( 1, sizeof(FKey) );
	if( key != NULL )
	{
		
	}
	return key;
}

/**
 * Delete FKey
 *
 * @param cc pointer to FKey which will be deleted
 */
void FKeyDelete( FKey *cc )
{
	if( cc != NULL )
	{
		
		if( cc->k_Name != NULL )
		{
			FFree( cc->k_Name );
			cc->k_Name = NULL;
		}
		if( cc->k_Type != NULL )
		{
			FFree( cc->k_Type );
			cc->k_Type = NULL;
		}
		if( cc->k_Data != NULL )
		{
			FFree( cc->k_Data );
			cc->k_Data = NULL;
		}
		if( cc->k_PublicKey != NULL )
		{
			FFree( cc->k_PublicKey );
			cc->k_PublicKey = NULL;
		}
		if( cc->k_Signature != NULL )
		{
			FFree( cc->k_Signature );
			cc->k_Signature = NULL;
		}
		FFree( cc );
	}
}

/**
 * Delete FKey list
 *
 * @param cc pointer to FKey list which will be deleted
 */
void FKeyDeleteAll( FKey *cc )
{
	FKey *k = cc;
	while( k != NULL )
	{
		FKey *rem = k;
		k = (FKey *) k->node.mln_Succ;
		
		FKeyDelete( rem );
	}
}
