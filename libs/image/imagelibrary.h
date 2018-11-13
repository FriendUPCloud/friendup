/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*

	Library

*/

#ifndef __IMAGE_LIBRARY_H_
#define __IMAGE_LIBRARY_H_

#include <core/types.h>
#include <core/library.h>
#include <system/fsys/file.h>
#include <system/fsys/fsys.h>
#include <system/user/user.h>
#include <system/user/user_session.h>

#ifdef USE_IMAGE_MAGICK
#include <wand/magick_wand.h>
#else
#include <gd.h>
#endif
//#include <ImageMagick-6/wand/magick_wand.h>

//
//	library
//

typedef struct ImageLibrary
{
	char                 *l_Name;	// library name
	FULONG                l_Version;		// version information
	void				*l_Handle;
	void				*sb; // system base
	void				*(*libInit)( void * );
	void				(*libClose)( struct Library *l );
	FULONG              (*GetVersion)(void);
	FULONG              (*GetRevision)(void);

#ifdef USE_IMAGE_MAGICK
	Image 				*(*ImageRead)( struct ImageLibrary *im, File *rootDev, const char *path );
	int 				(*ImageWrite)( struct ImageLibrary *im, Image *img, File *rootDev, const char *path );
	int 				(*ResizeImage)( struct ImageLibrary *im, Image **image, int w, int h );
#else
	gdImagePtr 			(*ImageRead)( struct ImageLibrary *im, File *rootDev, const char *path );
	int 				(*ImageWrite)( struct ImageLibrary *im, File *rootDev, gdImagePtr img, const char *path );
	int 				(*ResizeImage)( struct ImageLibrary *im, gdImagePtr *image, int w, int h );
#endif
	Http 				*(*WebRequest)( struct ImageLibrary *l, UserSession *usr, char **func, Http* request );
} ImageLibrary;

//
//
//

File *IMGGetRootDeviceByPath( struct ImageLibrary *lib, User *usr, char **dstpath, const char *path );

//
//
//

int FResizeImage( struct ImageLibrary *im, gdImagePtr *image, int w, int h );


// 

#endif	// __IMAGE_LIBRARY_H_

