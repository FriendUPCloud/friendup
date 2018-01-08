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

/*
    
	TagList

*/

#ifndef __UTILITY_TAGITEM_H_
#define __UTILITY_TAGITEM_H_

#include <core/types.h>


typedef FULONG Tag;

#pragma pack(4)

typedef struct TagItem
{
    Tag		ti_Tag;	// description
    FULONG	ti_Data;	// data
}TagItem;

#pragma pack()

//	tag constans

#define TAG_DONE   (0L)   // END
#define TAG_END    (0L)   // END
#define TAG_IGNORE (1L)   // IGNORE
#define TAG_MORE   (2L)   // POINTER TO ANOTHER TAG ARRAY
#define TAG_SKIP   (3L)   // SKIP TAG

// USER TAG
#define TAG_USER    ((FULONG)( SHIFT_INC(1L,31) ))
#define TAG_OS	    (16L)   // TAG USED BY OS


// FOR FilterTagArray
#define TAGFILTER_AND 0 	// exclude everything but filter hits
#define TAGFILTER_NOT 1 	// exclude only filter hits

// MAPPING FOR MapTags
#define MAP_REMOVE_NOT_FOUND 0	// remove this if isnt in taglist
#define MAP_KEEP_NOT_FOUND   1	// keep this one if they arent

// MARCRO FOR TAGLIST
//#define TAGLIST(args...) ((struct TagItem *)(IPTR []){ args, TAG_DONE })

#endif //TAGITEM_H__

