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


//
// buffered string
//

#ifndef __BUFFERED_STRING_H__
#define __BUFFERED_STRING_H__

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <core/types.h>

#define BUF_STRING_MAX 1024 * 12

//
// BufferString structure
//

typedef struct BufString
{
	int             bs_Size;        // current data size
	int             bs_Bufsize;     // buffer size
	int             bs_MAX_SIZE;    // maximum size
	char           *bs_Buffer;      // pointer to buffer
} BufString;

//
// Create Buffer String
//

BufString *BufStringNew();

BufString *BufStringNewSize( int bufsize );

//
// Delete Buffer String
//

void BufStringDelete( BufString *bs );

//
// Add String to Buffer
//

int BufStringAdd( BufString *bs, const char *add );

//
// Add Data to Buffer
//

int BufStringAddSize( BufString *bs, const char *add, int size );


#endif //__BUFFERED_STRING_H__
