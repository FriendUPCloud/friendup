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

#endif // __SYSTEM_DATATYPES_IMAGES_H__
