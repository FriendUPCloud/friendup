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
 *  Http String
 *
 * buffered string used to store http request
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 08/02/2016
 */


#include "http_string.h"
#include <util/log/log.h>

//
// initialization
//

HttpString *HttpStringNew( int bufsize )
{
	HttpString *str = NULL;
	
	if( ( str = FCalloc( sizeof( HttpString ), 1 ) ) != NULL )
	{
		str->ht_Size = 0;
		str->ht_Bufsize = bufsize;
		str->ht_MAX_SIZE = bufsize;
		
		if( ( str->ht_Buffer = FCalloc( str->ht_Bufsize + 1, sizeof( char ) ) ) != NULL )
		{
			return str;
		}
		FFree( str );
	}
	
	return NULL;
}

//
// remove buffer
//

void HttpStringDelete( HttpString *bs )
{
	if( bs != NULL )
	{
		if( bs->ht_Buffer )
		{
			FFree( bs->ht_Buffer );
		}
		FFree( bs );
	}
}

//
// add text to buffer
//

int HttpStringAdd( HttpString *bs, const char *ntext, int len )
{
	if( ntext == NULL )
	{
		FERROR("Cannot add NULL text!\n");
		return 1;
	}
	
	//
	// if its small request then
	// there is no need to store data inside file
	//
	
	if( bs->ht_Size == 0 )
	{
		// buffer is too small to handle data, we must extend it
		
		if( len > bs->ht_MAX_SIZE )
		{
			int allsize = ( (len / bs->ht_MAX_SIZE) + 1) * bs->ht_MAX_SIZE;
			char *tmp;
			
			if( ( tmp = FCalloc( allsize + 10, sizeof(char) ) ) != NULL )
			{
				memcpy( tmp, ntext, len );
				bs->ht_Bufsize = allsize;
				bs->ht_Size = len;
				
				FFree( bs->ht_Buffer );
				bs->ht_Buffer = tmp;
			}
			else
			{
				FERROR("Cannot allocate memory for BUFString\n");
				return -1;
			}
		}
		else	// buffer is enough to hold data, just copy it
		{
			memcpy( bs->ht_Buffer, ntext, len );
			bs->ht_Size = len;
		}
		return 0;
	}
	
	/*
	//FERROR("requestnot null!!!%p\n", bs->ht_Reqest);
	if( bs->ht_Reqest != NULL )
	{
		//FERROR("requestnot null!!!\n");
		if( bs->ht_Reqest->http_ContentType == HTTP_CONTENT_TYPE_MULTIPART )
		{
			//FERROR("MULTIPART!!!\n");
		}
	}
	*/
		
	int addsize = len;
	//	int modsize = (bs->bs_Size / bs->bs_MAX_SIZE) * bs->bs_MAX_SIZE;
	int newsize = (bs->ht_Size + addsize);
	
	if( newsize > bs->ht_Bufsize )
	{
		char *tmp;
		int allsize = ( (newsize / bs->ht_MAX_SIZE) + 1) * bs->ht_MAX_SIZE;
		
		if( ( tmp = FCalloc( allsize + 10, sizeof(char) ) ) != NULL )
		{
			memcpy( tmp, bs->ht_Buffer, bs->ht_Size );
			memcpy( &(tmp[ bs->ht_Size ]), ntext, len );
			
			bs->ht_Bufsize = allsize;
			bs->ht_Size = newsize;
			
			FFree( bs->ht_Buffer );
			bs->ht_Buffer = tmp;
		}
		else
		{
			FERROR("Cannot allocate memory for buffer!\n");
			return -1;
		}
		// there is no space in the buffer, we must extend it
	}
	else
	{
		// there is some space in buffer, we can put information there
		memcpy( &(bs->ht_Buffer[ bs->ht_Size ] ), ntext, len );
		bs->ht_Size = newsize;
	}
	
	return 0;
}

