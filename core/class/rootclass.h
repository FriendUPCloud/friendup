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

#ifndef __CLASS_ROOTCLASS_H__
#define __CLASS_ROOTCLASS_H__

#include <core/types.h>
#include <class/class.h>
#include <util/hooks.h>

#define METH_Dummy				0xF0000100
#define FM_Root_Test			(METH_Dummy+1)

#define FA_Dummy				0x00001000
#define FA_SetValue				(FA_Dummy+1)		// example parameter

ULONG rootDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__ROOTCLASS_H__

