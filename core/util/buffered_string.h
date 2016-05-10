
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
