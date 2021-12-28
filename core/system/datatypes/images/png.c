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
 * Body of  png image
 *
 * @author PS (Pawel Stefanski)
 * @date created PS (31/03/2017)
 */

#include <core/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <png.h>
#include "image.h"

/**
 * Save FImage to disk as PNG
 *
 * @param img pointer to FImage structure which will be stored
 * @param filename path with filename where file will be stored
 * @return 0 when success, otherwise error number
 */
int ImageSavePNG( FImage *img, const char *filename )
{
	FILE *fp;
	png_structp png_ptr;
	png_infop info_ptr;
	png_colorp palette;
	png_color_8 sig_bit;
	int pass, number_passes;
	
	DEBUG("ImageSavePNG start");
	
	/* open the file */
	fp = fopen( filename, "wb" );
	if (fp == NULL)
	{
		FERROR("Cannot open file: %s\n", filename );
		return 0;
	}

	png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
	
	if (png_ptr == NULL)
	{
		fclose(fp);
		return 0;
	}
	
	// initialize the image information data
	
	info_ptr = png_create_info_struct(png_ptr);
	if( info_ptr == NULL )
	{
		fclose(fp);
		png_destroy_write_struct(&png_ptr,  (png_infopp)NULL);
		return 0;
	}

#if PNG_LIBPNG_VER_MINOR < 5
	if( setjmp( png_ptr->jmpbuf ) )
	{
		/* If we get here, we had a problem reading the file */
		fclose(fp);
		png_destroy_write_struct(&png_ptr,  (png_infopp)NULL);
		return 0;
	}
#else
	if( setjmp( (struct __jmp_buf_tag *)png_ptr ) )
	{
		/* If we get here, we had a problem reading the file */
		fclose(fp);
		png_destroy_write_struct( &png_ptr,  (png_infopp)NULL);
		return 0;
	}
#endif
	
	png_init_io(png_ptr, fp);
	
	DEBUG("[ImageSavePNG] SAVE width %d height %d depth %d interlace %d\n", img->fi_Width, img->fi_Height, img->fi_Depth, img->fi_Interlace );
	
	png_set_IHDR(png_ptr, info_ptr, img->fi_Width, img->fi_Height, 8,
			  (img->fi_Depth <= 8) ?  PNG_COLOR_TYPE_PALETTE :  PNG_COLOR_TYPE_RGB_ALPHA,
			  (img->fi_Interlace) ? PNG_INTERLACE_ADAM7 : PNG_INTERLACE_NONE,
			  PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

	if (img->fi_DPI  > 0)
	{

		// DPM = DPI * 100 / 2.54 = DPI * 10000 / 254 */ 
		int ppmx, ppmy; 
		ppmx = (img->fi_DPI * 10000 + 127) / 254; 
		ppmy = ppmx;
		png_set_pHYs(png_ptr, info_ptr, ppmx, ppmy, PNG_RESOLUTION_METER);
	}
	
	if (img->fi_Depth <= 8)
	{
		DEBUG("[ImageSavePNG] 8 bit picture\n");
		
		int i;
		palette = (png_colorp) png_malloc(png_ptr,
										  256 * sizeof (png_color));
		// palette
		for (i=0; i < img->fi_ColorMapSize; ++i)
		{
			palette[i].red   = img->fi_ColorMap[i].f_Red;
			palette[i].green = img->fi_ColorMap[i].f_Green;
			palette[i].blue  = img->fi_ColorMap[i].f_Blue;
			/* palette[i].alpha = 256 - img->cmap[i].alpha; */
		}
		png_set_PLTE(png_ptr, info_ptr, palette, img->fi_ColorMapSize);
	}
	else
	{
		DEBUG("[ImageSavePNG] 32bit picture\n");
	}
	
	sig_bit.gray = 0;
	sig_bit.red = 8;
	sig_bit.green = 8;
	sig_bit.blue = 8;
	sig_bit.alpha = 8;
	png_set_sBIT(png_ptr, info_ptr, &sig_bit);
	
	// png_set_gAMA(png_ptr, info_ptr, 2.2);  //
	
	png_text  *text;
	//png_textp *textptr;
	if( img->fi_CommentsNumber > 0 )
	{
		DEBUG("[ImageSavePNG] text found\n");
		if( ( text = malloc( img->fi_CommentsNumber*sizeof(png_text ) ) ) != NULL )
		{
			int pos = 0;
			
			KeyValueList *kvl = img->fi_Comments;
			while( kvl != NULL )
			{
				text[ pos ].compression = PNG_TEXT_COMPRESSION_NONE;
				text[ pos ].key = kvl->key;
				text[ pos ].text = kvl->value;
				text[ pos ].text_length = strlen( kvl->value );
				
				kvl = (KeyValueList *)kvl->node.mln_Succ;
				pos++;
			}
			
			png_set_text(png_ptr, info_ptr, text, pos );
			free( text );
		}
	}
	else
	{

	}
	/*
	 t ext_ptr[*0].key = "aaaa";
	 text_ptr[0].text = "bbbbb";
	 text_ptr[0].compression = PNG_TEXT_COMPRESSION_NONE;
	 text_ptr[1].key = "Author";
	 text_ptr[1].text = "sssss";
	 text_ptr[1].compression = PNG_TEXT_COMPRESSION_NONE;
	 text_ptr[2].compression = PNG_TEXT_COMPRESSION_zTXt;
	 png_set_text(png_ptr, info_ptr, text_ptr, 3);
	 */
	
	//png_set_invert_alpha(png_ptr);
	png_write_info(png_ptr, info_ptr);
	//png_set_swap_alpha(png_ptr);

	if ( img->fi_Interlace )
	{
		number_passes = png_set_interlace_handling(png_ptr);
	}
	else
	{
		number_passes = 1;
	}
	
	if (img->fi_Depth <= 8)
	{
		for (pass = 0; pass < number_passes; pass++)
		{
			int y;

			for (y = 0; y < img->fi_Height; y++)
			{
				png_bytepp p = (png_bytepp)&(img->fi_Data[ y*img->fi_Width ]);
				//png_write_rows( png_ptr, &p, 1);
				png_write_row(png_ptr, (unsigned char *)p );
			}
		}
	}
	else
	{
		for (pass = 0; pass < number_passes; pass++)
		{
			int y;
			int w = img->fi_Width * 4;
			
			for (y = 0; y < img->fi_Height; y++)
			{
				//png_write_rows(png_ptr, (png_bytepp) &(img->fi_Data[  y * img->fi_Width * 4 ]), 1);
				png_write_row(png_ptr, &(img->fi_Data[  y * w ]) );
			}
		}
	}

	png_write_end(png_ptr, info_ptr);
	
	if (img->fi_Depth <= 8)
	{
#if PNG_LIBPNG_VER_MINOR < 5
		png_free(png_ptr, info_ptr->palette);
#else
		png_free( png_ptr, palette );
#endif
	}
	
	//png_destroy_write_struct(&png_ptr, (png_infopp)NULL);
	 png_destroy_write_struct(&png_ptr, &info_ptr);

	fclose(fp);

	return 1;
}

/**
 * Load Image from disk (PNG)
 *
 * @param fname path with filename from which file will be read
 * @return new FImage structure when success, otherwise NULL
 */
FImage *ImageLoadPNG( const char *fname )
{
	png_structp png_ptr = 0;
	png_infop info_ptr = 0;
	png_bytepp data = 0; // arrays of rows containing the image data
	FImage *image = NULL;
	
	png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, 0, 0, 0);
	
	if(!png_ptr)
	{
		return 0; // return NULL-pointer: error
	}
	
	FILE *fp = fopen(fname, "rb");
	if( fp != NULL )
	{
		info_ptr = png_create_info_struct(png_ptr);
		if( info_ptr != NULL )
		{
			png_init_io( png_ptr, fp ); // connect libpng with our fp
			png_read_info(png_ptr, info_ptr); // fill info_ptr
		
			int width = png_get_image_width(png_ptr, info_ptr);
			int height = png_get_image_height(png_ptr, info_ptr);
		
			png_uint_32 bitdepth = png_get_bit_depth(png_ptr, info_ptr); // depth per channel, not pixel!
			png_uint_32 channels = png_get_channels(png_ptr, info_ptr);
			//png_uint_32 color_type = png_get_color_type(png_ptr, info_ptr);

			if( ( image = ImageNew( width, height, (int)(bitdepth*channels) ) ) != NULL )
			{
				png_textp text;
				int num;
				int i;

				num = 0;
				png_get_text(png_ptr, info_ptr, &text, &num);
				image->fi_CommentsNumber = num;

				for (i = 0; i < num; i++)
				{
					KeyValueList *kvl = KeyValueListNewWithEntry( text[ i ].key, text[ i ].text );
				
					kvl->node.mln_Succ = (MinNode *)image->fi_Comments;
					image->fi_Comments = kvl;
				}
				
				unsigned int rowBytes = png_get_rowbytes( png_ptr, info_ptr );
				png_bytep *rows;
				rows = (png_bytep *)malloc( sizeof(png_bytep) * height );
				if( rows != NULL )
				{
					FBYTE *p = image->fi_Data;
				
					for( i=0 ; i < height ; i++ )
					{
						rows[ i ] =  p;
						p += rowBytes;
					}
					png_read_image( png_ptr, rows );
				
					png_read_end( png_ptr, NULL );
					/*
					int j;
					char *ptr = (char *)image->fi_Data;
					
					for( i=0 ; i < height ; i++ )
					{
					for( j=0 ; j < width ; j++ )
					{
						char tmp[4];
						//tmp[0]=ptr[0];tmp[1]=ptr[1];tmp[2]=ptr[2];tmp[3]=ptr[3];
						//ptr[0]=tmp[3];ptr[1]=tmp[2];ptr[2]=tmp[1];ptr[3]=tmp[0];
						
						ptr+=4;
						}
					}
					*/
					free( rows );
				}	
				/*
				png_bytepp rowPtrs = png_get_rowbytes( png_ptr, info_ptr );
				i = 0;
				
				for( i=0 ; i < height ; i++ )
				{
					memcpy( image->fi_Data +(rowBytes*i ), rowPtrs[ i ], rowBytes );
				}
				*/
			}
			png_destroy_read_struct(&png_ptr, &info_ptr, 0); // don't forget to free the pointers
		}
		else
		{
			png_destroy_read_struct(&png_ptr, &info_ptr, 0); // don't forget to free the pointers
			//FERROR("Cannot read png info struct\n");
		}
		
		fclose(fp); // and to close the file
	}
	else
	{
		png_destroy_read_struct(&png_ptr, &info_ptr, 0); // don't forget to free the pointers
		FERROR("Cannot read file : %s\n", fname );
		return NULL;
	}
	
	return image; 
}


