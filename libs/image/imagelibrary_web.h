/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Lesser   *
* General Public License, found in the file license_lgpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 * 
 * Image Library Web definitions
 *
 *  @author PS (Pawel Stefanski)
 *  @date created 2016
 */

#ifndef __LIBS_IMAGE_LIBRARY_WEB_H__
#define __LIBS_IMAGE_LIBRARY_WEB_H__

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
#include <system/fsys/fsys_activity.h>

//
// Handle webrequest calls
//

Http* WebRequestImage( struct ImageLibrary *l, UserSession *usr, char **urlpath, Http* request, Socket* sock );

#endif // __LIBS_IMAGE_LIBRARY_WEB_H__
