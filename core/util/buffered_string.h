/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

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
