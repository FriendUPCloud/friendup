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
 * Body of  image
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <stdio.h>
#include <stdlib.h>
#include "image.h"
#include <util/string.h>
#include <system/fsys/file.h>
#include <system/fsys/device_handling.h>

#ifdef USE_IMAGE_MAGICK
#include <wand/magick_wand.h>
#else
#include <gd.h>
#endif

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
		int size = (width*height*bpp);
		img->fi_Width = width;
		img->fi_Height = height;
		img->fi_Depth = depth;
		
		if( depth <= 8 )
		{
			bpp = 1;
		}
		else	// 32 bit
		{
			bpp = 4;
		}
		
		if( ( img->fi_Data = FCalloc( size, sizeof( FBYTE ) ) ) != NULL )
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



//
//
//

gdImagePtr ImageRead( File *rootDev, const char *path )
{
	gdImagePtr img = NULL;
	FHandler *fh = rootDev->f_FSys;
	File *rfp = (File *)fh->FileOpen( rootDev, path, "rb" );
	if( rfp != NULL )
	{
		BufString *bs = BufStringNew( );
		char buffer[ 20048 ];
		int len = 0;

		while( ( len = fh->FileRead( rfp, buffer, 20048 ) ) > 0 )
		{
			BufStringAddSize( bs, buffer, len );
		}
		
		img = gdImageCreateFromJpegPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
		if( img == NULL )
		{
			if( img == NULL )
			{
				img = gdImageCreateFromBmpPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
				if( img == NULL )
				{
					img = gdImageCreateFromGifPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
					if( img == NULL )
					{
						img = gdImageCreateFromPngPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
						if( img == NULL )
						{
							img = gdImageCreateFromTgaPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
							if( img == NULL )
							{
								img = gdImageCreateFromTiffPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
								if( img == NULL )
								{
									img = gdImageCreateFromWBMPPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
#ifdef USE_WEBP_LOADER
									if( img == NULL )
									{
										img = gdImageCreateFromWebpPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
									}
#endif
								}
							}
						}
					}
				}
			}
		}
		
		if( img == NULL )
		{
			FERROR("Graphics format not recognized\n");
		}
		
		gdImageDestroy( img );
	}
	else
	{
		FERROR("Cannot open file: %s to read\n", path );
	}
	return img;
}
	
