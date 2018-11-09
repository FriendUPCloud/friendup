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
 * PNG file type definition
 *
 * @author PS (Pawel Stefansky)
 * @date created PS (31/03/2017)
 */

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <png.h>
#include "image.h"

#ifndef __SYSTEM_DATATYPES_IMAGE_PNG_H__
#define __SYSTEM_DATATYPES_IMAGE_PNG_H__

//
//  Write a PNG file, either as an 8bpp paletted image, or a 32bpp image.
//

int ImageSavePNG( FImage *img, const char *filename );

//
//
//

FImage *ImageLoadPNG( const char *fname );

#endif // __SYSTEM_DATATYPES_IMAGE_PNG_H__
