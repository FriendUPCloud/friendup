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
 * Definition of  image
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#ifndef __SYSTEM_DATATYPES_IMAGES_H__
#define __SYSTEM_DATATYPES_IMAGES_H__

#include <core/types.h>
#include <util/key_value_list.h>

//
//
//

typedef struct FPixel
{
	char f_Red;
	char f_Green;
	char f_Blue;
	char f_Alpha;
}FPixel;

//
//
//

typedef struct FImage
{
	int fi_Width;
	int fi_Height;
	int fi_Depth;
	FBOOL fi_Interlace;
	int fi_DPI;
	int fi_ColorMapSize;
	FPixel fi_ColorMap[ 256 ];
	FBYTE *fi_Data;
	
	KeyValueList *fi_Comments;
	int fi_CommentsNumber;  //number of KeyValueList entries
}FImage;

//
// create image
//

FImage *ImageNew( int width, int height, int depth );

//
// delete image
//

void ImageDelete( FImage *img );

//
// add comment
//

int ImageAddComment( FImage *img, char *key, char *value );

//
// clean comments
//

int IimageDeleteComments( FImage *img );

//
//
//

//gdImagePtr ImageRead( File *rootDev, const char *path );

#endif // __SYSTEM_DATATYPES_IMAGES_H__
