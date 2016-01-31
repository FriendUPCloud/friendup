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

#ifndef __HANDLER_DOSDRIVER_H__
#define __HANDLER_DOSDRIVER_H__

#include <core/types.h>
#include <core/nodes.h>
#include <system/handler/fsys.h>
#include <system/systembase.h>

typedef struct DOSDriver{
	MinNode 						node;
	FHandler						*dd_Handler;
	char								*dd_Name;
	char								*dd_Type;
}DOSDriver;

//int RescanDOSDrivers( void *l );

#endif // __HANDLER_DOSDRIVER_H__
