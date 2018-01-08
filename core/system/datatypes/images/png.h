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
