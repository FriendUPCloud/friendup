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

#ifndef __WEBUTIL_H__
#define __WEBUTIL_H__

#include <stdio.h>
#include <util/log/log.h>

// 
// Some helper functions on http data
//

// Find where the headers start -1 on fail >= 0 on success
int FindEmbeddedHeaders( char *data, int dataLength );

// Strip headers
int StripEmbeddedHeaders( char **data, unsigned int dataLength );

char *CheckEmbeddedHeaders( char *data, int dataLength, const char *header );

// Decode string
int UrlDecodeSyslib( char* dst, const char* src );

#endif // __WEBUTIL_H__
