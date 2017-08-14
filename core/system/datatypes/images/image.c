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
/**
 * @file
 *
 * Body of  image
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <stdio.h>
#include <stdlib.h>
#include "image.h"
#include <util/string.h>

/**
 * Function create new FImage structure
 *
 * @param width with of new Image
 * @param height height of new Image
 * @param depth depth of new Image (8,16,24,32 bits)
 * @return new FImage structure when success, otherwise NULL
 */
FImage *ImageNew( int width, int height, int depth )
{
	FImage *img = NULL;
	
	DEBUG("[ImageNew] Image new: width: %d height: %d depth: %d\n", width, height, depth );
	
	if( ( img = FCalloc( 1, sizeof(FImage) )  ) != NULL )
	{
		int bpp = 1;
		img->fi_Width = width;
		img->fi_Height = height;
		img->fi_Depth = depth;
		
		if( depth <= 8 )
		{
			
		}
		else	// 32 bit
		{
			bpp = 4;
		}
		
		if( ( img->fi_Data = FCalloc( img->fi_Width*img->fi_Height*bpp, sizeof( FBYTE ) ) ) != NULL )
		{
			
		}
		else
		{
			FERROR( "Cannot allocate memory for image!\n");
			FFree( img );
			return NULL;
		}
	}
	
	return img;
}

/**
 * Delete FImage structure
 *
 * @param img pointer to FImage structure which will be removed
 */
void ImageDelete( FImage *img )
{
	if( img != NULL )
	{
		KeyValueListDeleteAll( img->fi_Comments );
		img->fi_Comments = NULL;
		
		if( img->fi_Data != NULL )
		{
			FFree( img->fi_Data );
		}
		
		FFree( img );
	}
}

/**
 * Add comment to Image
 *
 * @param img pointer to FImage structure
 * @param key key string
 * @param value value string
 * @return 0 when success, otherwise error number
 */
int ImageAddComment( FImage *img, char *key, char *value )
{
	// if image have comment, there is only need to update it
	
	int i = 0;
	for( i=0 ; i < img->fi_CommentsNumber ; i++ )
	{
		if( strcmp( key, img->fi_Comments[ i ].key ) == 0 )
		{
			if( img->fi_Comments[ i ].value != NULL )
			{
				FFree( img->fi_Comments[ i ].value );
			}
			
			img->fi_Comments[ i ].value = StringDuplicate( value );
			
			return 0;
		}
	}
	// if not, new keyvalue entry is created
	
	KeyValueList *kvl = KeyValueListNewWithEntry( key, value );
	if( kvl != NULL )
	{
		DEBUG("[ImageAddComment] comment added %s %s\n", key, value );
		kvl->node.mln_Succ = (MinNode *)img->fi_Comments;
		img->fi_Comments = kvl;
		
		img->fi_CommentsNumber++;
	}
	
	return 0;
}

/**
 * Remove all comments from Image
 *
 * @param img pointer to FImage structure
 * @return 0 when success, otherwise error number
 */
int ImageCleanComments( FImage *img )
{
	if( img != NULL )
	{
		KeyValueListDeleteAll( img->fi_Comments );
		img->fi_Comments = NULL;
	}
	return 0;
}
