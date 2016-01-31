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

#ifndef __CLASS_MAINCLASS_H__
#define __CLASS_MAINCLASS_H__

#include <core/types.h>
#include <class/class.h>

#define METH_Dummy			0x00005000// unused now
#define METH_TEST			(METH_Dummy+1)

#define FA_Main_Dummy		0x00005000
#define FA_Main_SetValue	(FUIA_Dummy+1)

ULONG mainDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__ROOTCLASS_H__
