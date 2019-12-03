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
 *  BufferedString
 *
 *  @author PS (Pawel Stefanski), AL (Artur Langner)
 *  @date created 01/2016
 */

/* FIXME: the notation of length/size in this module is not completely clear.
 * Does it include null termination or not? Is the length visible outside the module
 * only the contents of the whole size with null termination?
 *
 */

#include "buffered_string.h"
#include <util/log/log.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <core/types.h>

BufString *BufStringNew(void)
{
	BufString *str = FCalloc(sizeof(BufString), 1 );
		
	if(str){
		str->bs_Size = 0;
		str->bs_Bufsize = BUF_STRING_MAX;
		str->bs_Buffer = FCalloc( str->bs_Bufsize+1, sizeof(char) );
		str->buffer_increments = 0;
		return str;
	}
	return NULL;
}

BufString *BufStringNewSize(unsigned int initial_size)
{
	BufString *str = NULL;
		
	if( ( str = FCalloc( sizeof( BufString ), 1 ) ) != NULL )
	{
		str->bs_Size = 0;
		str->bs_Bufsize = initial_size;
		str->bs_Buffer = FMalloc( str->bs_Bufsize + 1 );
		if (str->bs_Buffer)
		{
			str->bs_Buffer[ 0 ] = 0;
			return str;
		}
		FFree( str );
	}
	return NULL;
}

void BufStringDelete(BufString *bs)
{
	if( bs != NULL )
	{
		if( bs->bs_Buffer )
		{
			FFree( bs->bs_Buffer );
			bs->bs_Buffer = NULL;
		}
		FFree( bs );
	}
}

unsigned int BufStringAdd(BufString *bs, const char *string_to_append)
{
    if(string_to_append == NULL )
    {
        return 1;
    }
    unsigned int appendix_length = strlen(string_to_append);

    return BufStringAddSize(bs, string_to_append, appendix_length);
}

unsigned int BufStringAddSize(BufString *bs, const char *string_to_append, unsigned int string_to_append_length)
{
	if( bs == NULL || string_to_append == NULL || string_to_append_length < 1 )
	{
		FERROR("Cannot add NULL text!\n");
		return 1;
	}

	if ( (string_to_append_length + bs->bs_Size) >= bs->bs_Bufsize){ //not enough place in buffer - reallocate

		unsigned int increment = string_to_append_length;

		//-------------------------------------------------
		/* TK-608, TK-703
		 * Speculatively increase buffer size beyond what is immediately necessary
		 * to reduce total number of realloc calls.
		 */
		if (bs->previous_increment){
			increment = bs->previous_increment + string_to_append_length;
		}
		//-------------------------------------------------

		bs->previous_increment = increment;

		unsigned int new_size = bs->bs_Bufsize + increment + 1/*place for terminator*/;

        char *tmp = FRealloc(bs->bs_Buffer, new_size); //TK-609

        if (tmp) //realloc succedeed and moved the data
        {
            bs->bs_Buffer = tmp;
            bs->bs_Bufsize = new_size;
        }
		else
		{
			FERROR("Cannot allocate memory for buffer!\n");
			return -1;
		}
	}

	// there is space in the buffer, we can put information there
	memcpy( bs->bs_Buffer + bs->bs_Size, string_to_append, string_to_append_length );
	bs->bs_Size += string_to_append_length;
	bs->bs_Buffer[ bs->bs_Size ] = '\0'; //force null termination
	
	return 0;
}

/**
 * Read file to buffered string
 * @param path path to file
 * @return BufString object in file inside or NULL when error appear
 */
BufString *BufStringRead(const char *path )
{
	BufString *bs = NULL;
	FILE *fp = NULL;
	
	if( ( fp = fopen( path, "rb" ) ) != NULL )
	{
		fseek( fp, 0, SEEK_END );
		int fsize = ftell( fp );
		fseek( fp, 0, SEEK_SET );

		if( fsize > 0 )
		{
			bs = BufStringNewSize( fsize+1 );
			fread( bs->bs_Buffer, 1, fsize, fp );
			bs->bs_Buffer[ fsize ] = 0;
		}
		fclose( fp );
	}
	
	return bs;
}

/**
 * Write buffered string into file
 * @param bs pointer to BufString object
 * @param path path to file
 * @return 0 when success otherwise error number
 */
int BufStringWrite( BufString *bs, const char *path )
{
	if( bs != NULL )
	{
		FILE *fp = NULL;
		if( ( fp = fopen( path, "wb" ) ) != NULL )
		{
			fwrite( bs->bs_Buffer, 1 , bs->bs_Size, fp );
			fclose( fp );
		}
	}
	else
	{
		DEBUG("Buffer is empty");
	}
	return 0;
}
