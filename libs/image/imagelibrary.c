/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

/*

	ImageLibrary code

*/

#include <stdio.h>
#include <limits.h>
#include <stdlib.h>
#include <core/types.h>
#include <core/library.h>
#include <util/log/log.h>
#include <dlfcn.h>
#include <string.h>
#include <util/string.h>
#include "imagelibrary.h"
#include <util/buffered_string.h>
#include <ctype.h>
#include <system/systembase.h>

#define LIB_NAME "image.library"
#define LIB_VERSION			1
#define LIB_REVISION		0

//
// init library
//

void *libInit( void *sb )
{
	struct ImageLibrary *l = NULL;
	DEBUG("[ImageLibrary] Init\n");

	if( ( l = calloc( 1, sizeof( struct ImageLibrary ) ) ) == NULL )
		return NULL;

	l->l_Name = LIB_NAME;
	l->l_Version = LIB_VERSION;
	l->libClose           = dlsym( l->l_Handle, "libClose");
	l->GetVersion         = dlsym( l->l_Handle, "GetVersion");
	l->GetRevision        = dlsym( l->l_Handle, "GetRevision");

	// user.library structure
	l->ResizeImage               = dlsym( l->l_Handle, "FResizeImage");
	l->ImageRead               = dlsym( l->l_Handle, "ImageRead");
	l->ImageWrite               = dlsym( l->l_Handle, "ImageWrite");
	
	l->sb = sb;

#ifdef USE_IMAGE_MAGICK
	MagickWandGenesis();
#endif

	return ( void *)l;
}

//
//
//

void libClose( struct ImageLibrary *l )
{
#ifdef USE_IMAGE_MAGICK
	MagickWandTerminus();
#endif
	
	DEBUG("[ImageLibrary] close\n");
}

//
//
//

FULONG GetVersion(void)
{
	return LIB_VERSION;
}

FULONG GetRevision(void)
{
	return LIB_REVISION;
}




#ifdef USE_IMAGE_MAGICK

//
//
//

Image *ImageRead( struct ImageLibrary *im, File *rootDev, const char *path )
{
	Image *img = NULL;
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
		
		ExceptionInfo *ei=AcquireExceptionInfo();
        ImageInfo *ii=CloneImageInfo((ImageInfo *) NULL);
								
		img = BlobToImage( ii, bs->bs_Buffer, bs->bs_Size, ei );
		
		if( img == NULL )
		{
			FERROR("Cannot convert file data to image\n");
		}
		
		DestroyExceptionInfo( ei );
		DestroyImageInfo( ii );
		
		BufStringDelete( bs );
		
		fh->FileClose( rootDev, rfp );
	}
	else
	{
		FERROR("Cannot open file: %s to read\n", path );
	}
}
	
//
//
//
	
int ImageWrite( struct ImageLibrary *im, Image *img, File *rootDev, const char *path )
{
	FHandler *fh = rootDev->f_FSys;
	File *rfp = (File *)fh->FileOpen( rootDev, path, "wb" );
	if( rfp != NULL )
	{
		char *buffer = NULL;
		size_t length = 0;

		
		ExceptionInfo *ei=AcquireExceptionInfo();
        ImageInfo *ii=CloneImageInfo((ImageInfo *) NULL);
								
		buffer =  ImageToBlob( ii, img, &length, ei );
		
		if( buffer == NULL )
		{
			FERROR("Cannot image to data\n");
			DestroyExceptionInfo( ei );
			DestroyImageInfo( ii );
			fh->FileClose( rootDev, rfp );
			
			return 2;
		}
		else
		{
			fh->FileWrite( rfp, buffer, length );
		}
		
		DestroyExceptionInfo( ei );
		DestroyImageInfo( ii );

		
		fh->FileClose( rootDev, rfp );
	}
	else
	{
		FERROR("Cannot open file: %s to write\n", path );
		return 1;
	}
	return 0;
}

//
//
//

int FResizeImage( struct ImageLibrary *im, Image **image, int w, int h )
{
	if( image != NULL )
	{
		ExceptionInfo *ei=AcquireExceptionInfo();
		
		///filters are in resamples.h
		Image* newImage = ResizeImage( *image, w, h, LanczosFilter, 1.0, ei );
		if( newImage != NULL )
		{
			DeleteImage( *image );
			*image = newImage;
		}
		
		DestroyExceptionInfo( ei );
	}
	else
	{
		FERROR("Cannot resize empty image\n");
	}
	
	return 0;
}

#else


//
//
//

gdImagePtr ImageRead( struct ImageLibrary *im, File *rootDev, const char *path )
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
									if( img == NULL )
									{
										img = gdImageCreateFromWebpPtr( bs->bs_Size, (void *)bs->bs_Buffer ) ;
									}
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
		
		BufStringDelete( bs );
		
		fh->FileClose( rootDev, rfp );
	}
	else
	{
		FERROR("Cannot open file: %s to read\n", path );
	}
	return img;
}
	
//
//
//

#define CHECK_EXT( NAME, A, B, C ) \
	NAME[ 0 ] == A && NAME[ 1 ] == A && NAME[ 2 ] == C 
	
int ImageWrite( struct ImageLibrary *im, File *rootDev, gdImagePtr img, const char *path )
{
	FHandler *fh = rootDev->f_FSys;
	File *rfp = (File *)fh->FileOpen( rootDev, path, "wb" );
	if( rfp != NULL )
	{
		char *buffer = NULL;
		int length = 0;
		int psize = strlen( path );
		
		if( psize > 3 )		//we are checking if file have extension
		{
			char ext[ 4 ];
			strcpy( ext, &(path[ psize-4 ]) );
			ext[ 0 ] = toupper( ext[ 0 ] );
			ext[ 1 ] = toupper( ext[ 1 ] );
			ext[ 2 ] = toupper( ext[ 2 ] );
			
			if( CHECK_EXT( ext,  'P','N','G' ) )
			{
				buffer = gdImagePngPtr( img, &length );
			}else if( CHECK_EXT( ext,  'J','P','G' ) ){
				buffer = gdImageJpegPtr( img, &length, 100 );
			}else if( CHECK_EXT( ext,  'G','I','F' ) ){
				buffer = gdImageGifPtr( img, &length );
			}else if( CHECK_EXT( ext,  'W','E','B' ) ){
				buffer = gdImageWebpPtr( img, &length );
			}else if( CHECK_EXT( ext,  'I','I','F' ) ){
				buffer = gdImageTiffPtr( img, &length );
			}else if( CHECK_EXT( ext,  'B','M','P' ) ){
				buffer = gdImageBmpPtr( img, &length, 100 );
			}
			
			if( buffer == NULL )
			{
				fh->FileClose( rootDev, rfp );
				FERROR("Cannot save picture, GD couldnt create buffer from image\n");
			
				return 2;
			}
			else
			{
				fh->FileWrite( rfp, buffer, length );
			}
		}
		else
		{
			FERROR("Extension name is too short, file format not recognized\n");
		}

		fh->FileClose( rootDev, rfp );
	}
	else
	{
		FERROR("Cannot open file: %s to write\n", path );
		return 1;
	}
	return 0;
}

//
//
//

int FResizeImage( struct ImageLibrary *im, gdImagePtr *image, int w, int h )
{
	if( *image != NULL )
	{
		gdImagePtr newImage  = gdImageCreate( w, h );

		if( newImage != NULL )
		{
			gdImageCopyResized( newImage, *image, 0, 0, 0, 0, newImage->sx, newImage->sy, (*image)->sx, (*image)->sy ); 
			gdImageDestroy( *image );
			*image = newImage;
		}
	}
	else
	{
		FERROR("Cannot resize empty image\n");
		return 1;
	}
	
	return 0;
}

//
// find comma and return position
//

int colonPosition( const char *c )
{
	int res = 0;
	
	for( unsigned int i=0 ; i < strlen( c ) ; i++ )
	{
		if( c[ i ] == ':' )
		{
			return i;
		}
	}
	
	return res;
}

//
// Get DOSDrive and path by path
//

File *GetRootDeviceByPath( User *usr, char **dstpath, const char *path )
{
	File *fhand = NULL;
	char ddrivename[ 256 ];
	
	int dpos = colonPosition( path );
	strncpy( ddrivename, path, dpos );
	ddrivename[ dpos ] = 0;
	
	// Make sure we have a valid path!
	int pl = strlen( path );
	int i = 0; int success = 0;
	for( ; i < pl; i++ )
	{
		if( path[i] == ':' )
		{
			success++;
			break;
		}
	}
	if( success <= 0 )
	{
		FERROR("Path is not correct\n");
		return NULL;
	}
	
	*dstpath = (char *)&path[ dpos + 1 ];

	File *ldr = usr->u_MountedDevs;
	while( ldr != NULL )
	{ 
		if( strcmp( ldr->f_Name, ddrivename ) == 0 )
		{
			fhand = ldr;
			break;
		}
		
		ldr = (File *) ldr->node.mln_Succ;
	}
	
	return fhand;
}

//
// Handle webrequest calls
//

Http*  WebRequest( struct ImageLibrary *l, UserSession *usr, char **urlpath, Http* request, Socket* sock )
{
	Http* response = NULL;
	
	DEBUG("[ImageLibrary] first command: %s\n", urlpath[ 0 ] );
	SystemBase *sb = (SystemBase *)l->sb;
	
	if( strcmp( urlpath[ 0 ], "help" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HttpAddTextContent( response, \
			"resize - resize image on filesystem\n \
			" );			// out of memory/user not found
		
		//HttpWriteAndFree( response );
	
		//
		// resize image on filesystem
		//
		
	}
	else if( strcmp( urlpath[ 0 ], "resize" ) == 0 )
	{
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG)  StringDuplicate( "text/html" ) },
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
			response = HttpNewSimple( HTTP_200_OK,  tags );
		
		char *path = NULL, *oPath = NULL;
		File *pathRoot = NULL;
		char *toPath = NULL, *otoPath = NULL;
		File *toRoot = NULL;
		int width = 0, height = 0;
		char *error = NULL;
		
		HashmapElement *tst = HashmapGet( request->parsedPostContent, "path" );
		if( tst == NULL ) tst = HashmapGet( request->query, "path" );
		if( tst != NULL  )
		{
			path = UrlDecodeToMem(  (char *) tst->data );
			pathRoot = GetRootDeviceByPath( usr, &oPath, path );
			
			DEBUG("[ImageLibrary] Found PATH parameter %s root %s\n", path, oPath );
		}
		
		tst = HashmapGet( request->parsedPostContent, "to" );
		if( tst == NULL ) tst = HashmapGet( request->query, "to" );
		if( tst != NULL  )
		{
			toPath = UrlDecodeToMem(  (char *) tst->data );
			toRoot = GetRootDeviceByPath( usr, &otoPath, toPath );
			
			DEBUG("[ImageLibrary] Found DESTINATION PATH parameter %s root %s\n", toPath, toRoot );
		}
		
		tst = HashmapGet( request->parsedPostContent, "width" );
		if( tst == NULL ) tst = HashmapGet( request->query, "width" );
		if( tst != NULL  )
		{
			width = atoi(  (char *) tst->data );
		}
		
		tst = HashmapGet( request->parsedPostContent, "height" );
		if( tst == NULL ) tst = HashmapGet( request->query, "height" );
		if( tst != NULL  )
		{
			height = atoi(  (char *) tst->data );
		}
		
		//
		//
		//
		
		if( path != NULL || width <= 0 || height <= 0 )
		{
			gdImagePtr image = l->ImageRead( l, pathRoot, path );
			if( image != NULL )
			{
				image = l->ResizeImage( l, image, width, height );
				if( image != NULL )
				{
					if( toPath != NULL )
					{
						if( l->ImageWrite( l, toRoot, image, toPath ) == 0 )
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Image Converted and stored\"}";
						}
						else
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot save file\"}";
						};
					}
					else
					{
						if( l->ImageWrite( l, pathRoot, image, path ) == 0 )
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Image Converted and stored\"}";
						}
						else
						{
							error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot save file\"}";
						};
					}
				}
				else
				{
					FERROR("Cannot resize image\n");
					error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot resize image\"}";
				}
			}
			else
			{
				FERROR("Cannot read image from path %s\n", path );
				error = "ok<!--separate-->{ \"ErrorMessage\": \"Cannot read image\"}";
			}
		}
		else
		{
			FERROR("'path' parameter was not passed or width|height <= 0 \n");
			error = "ok<!--separate-->{ \"ErrorMessage\": \"'path' parameter was not passed or width|height <= 0\"}";
		}
		
		if( toPath != NULL )
		{
			free( toPath );
		}
		
		if( path != NULL )
		{
			free( path );
		}
		
		if( error != NULL )
		{
			HttpAddTextContent( response, error );
			//HttpWriteAndFree( response );
		}
	}
	else
	{
		struct TagItem tags[] = {
			{	HTTP_HEADER_CONNECTION, (FULONG)StringDuplicate( "close" ) },
			{TAG_DONE, TAG_DONE}
		};
		
		response = HttpNewSimple( HTTP_404_NOT_FOUND,  tags );
	
		//HttpWriteAndFree( response );
		return response;
	}
	return response;
}

#endif


