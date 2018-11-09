/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

#include "simple_hash.h"

FUWORD mask[5] = { 0x4e25, 0xf4a1, 0x5437, 0xab41, 0x0000 };

//
//
//

void Smear( FUWORD* id )
{
	FUINT i, j;
	for ( i = 0; i < 5; i++ )
	{
		for ( j = i; j < 5; j++ )
		{
			if ( i != j )
			{
				id[i] ^= id[j];
			}
		}
	}
 
	for ( i = 0; i < 5; i++ )
	{
		id[i] ^= mask[i];
	}
}

//
//
//
 
void Unsmear( FUWORD* id )
{
	FUINT i, j;
	for ( i = 0; i < 5; i++ )
	{
		id[i] ^= mask[i];
	}
	
	for ( i = 0; i < 5; i++ )
	{
		for ( j = 0; j < i; j++ )
		{
			if ( i != j )
			{
				id[4-i] ^= id[4-j];
			}
		}
	}
}
