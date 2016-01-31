
/*
    
	TagList

*/

#ifndef __UTILITY_TAGITEM_H_
#define __UTILITY_TAGITEM_H_

#include <core/types.h>


typedef ULONG Tag;

#pragma pack(4)

struct TagItem
{
    Tag		ti_Tag;	// description
    ULONG	ti_Data;	// data
};

#pragma pack()

//	tag constans

#define TAG_DONE   (0L)   // END
#define TAG_END    (0L)   // END
#define TAG_IGNORE (1L)   // IGNORE
#define TAG_MORE   (2L)   // POINTER TO ANOTHER TAG ARRAY
#define TAG_SKIP   (3L)   // SKIP TAG

// USER TAG
#define TAG_USER    ((ULONG)(1L<<31))
#define TAG_OS	    (16L)   // TAG USED BY OS


// FOR FilterTagArray
#define TAGFILTER_AND 0 	// exclude everything but filter hits
#define TAGFILTER_NOT 1 	// exclude only filter hits

// MAPPING FOR MapTags
#define MAP_REMOVE_NOT_FOUND 0	// remove this if isnt in taglist
#define MAP_KEEP_NOT_FOUND   1	// keep this one if they arent

// MARCRO FOR TAGLIST
#define TAGLIST(args...) ((struct TagItem *)(IPTR []){ args, TAG_DONE })

#endif //TAGITEM_H__

