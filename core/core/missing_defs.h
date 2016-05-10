/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

#ifndef __CORE_MISSING_DEFS_H__
#define __CORE_MISSING_DEFS_H__

// definitions needed by some developer tools to enable highlighting

#ifndef ENABLE_WEBSOCKETS
#define ENABLE_WEBSOCKETS
#endif

#ifndef _POSIX_SOURCE
#define _POSIX_SOURCE
#endif

#define _XOPEN_SOURCE 600

#ifndef __USE_POSIX
#define __USE_POSIX
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// missing definitions for different linux distros

FILE *popen( const char *c, const char *v );

int fchmod (int __fd, __mode_t __mode) ;

int pipe2( int *pipefd, int opt );

void usleep( long );

//void pclose( FILE *f );

#endif // __CORE_MISSING_DEFS_H__
