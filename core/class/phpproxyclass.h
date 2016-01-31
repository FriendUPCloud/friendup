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

#ifndef __CLASS_PHPPROXYCLASS_H__
#define __CLASS_PHPPROXYCLASS_H__

#include <core/types.h>
#include <class/class.h>
#include <util/hooks.h>

#define FC_PHPProxyClass     "PHPProxyClass"

struct FUIPProcess
{
	ULONG MethodID;
	ULONG data;
};

#define FM_PHPProxy_Dummy			0x00000200
#define FM_PHPProxy_Process		(FM_PHPProxy_Dummy+1)

#define FA_PHPProxy_Dummy			0x00002000
#define FA_PHPProxy_Parameters	(FA_PHPProxy_Dummy+1)
#define FA_PHPProxy_Results		(FA_PHPProxy_Dummy+2)

ULONG phpproxyDispatcher( struct Class *c, Object *o, struct Msg *m );


#endif //__CLASS_PHPPROXYCLASS_H__
