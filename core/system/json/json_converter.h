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

#ifndef __JSON_JSON_CONVERTER_H__
#define __JSON_JSON_CONVERTER_H__

#include <core/types.h>
#include <mysql/sql_defs.h>
#include <util/buffered_string.h>

BufString *GetJSONFromStructure( ULONG *desc, void *data );

void *GetStructureFromJSON( ULONG *desc, const char *data );

#endif // __JSON_JSON_CONVERTER_H__
