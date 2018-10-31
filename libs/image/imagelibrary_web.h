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
