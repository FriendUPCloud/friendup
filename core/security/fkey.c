
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
