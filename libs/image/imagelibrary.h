/*©lpgl*************************************************************************
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

// DONT FORGET TO USE THAT AS TEMPLATE

typedef struct ImageLibrary
{
	char                 *l_Name;	// library name
	FULONG                l_Version;		// version information
	void						*l_Handle;
	void						*sb; // system base
	void						*(*libInit)( void * );
	void						(*libClose)( struct Library *l );
	FULONG                (*GetVersion)(void);
	FULONG                (*GetRevision)(void);

#ifdef USE_IMAGE_MAGICK
	Image 					*(*ImageRead)( struct ImageLibrary *im, File *rootDev, const char *path );
	int 						(*ImageWrite)( struct ImageLibrary *im, Image *img, File *rootDev, const char *path );
	int 						(*ResizeImage)( struct ImageLibrary *im, Image **image, int w, int h );
#else
	gdImagePtr 			(*ImageRead)( struct ImageLibrary *im, File *rootDev, const char *path );
	int 						(*ImageWrite)( struct ImageLibrary *im, File *rootDev, gdImagePtr img, const char *path );
	int 						(*ResizeImage)( struct ImageLibrary *im, gdImagePtr *image, int w, int h );
#endif
	Http 					*(*WebRequest)( struct ImageLibrary *l, UserSession *usr, char **func, Http* request );

	
} ImageLibrary;

// 

#endif	// __IMAGE_LIBRARY_H_

