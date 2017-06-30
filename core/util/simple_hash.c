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
