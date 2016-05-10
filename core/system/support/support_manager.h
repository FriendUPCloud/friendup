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

#ifndef __SUPPORT_SUPPORT_MANAGER_H__
#define __SUPPORT_SUPPORT_MANAGER_H__

#include <core/types.h>
#include <network/file.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

//
//
//

typedef struct SupportManager
{
	UQUAD			cm_CacheSize;
	UQUAD 			cm_CacheMax;

}SupportManager;

//
//
//

SupportManager *SupportManagerNew( );

void SupportManagerDelete( SupportManager *sm );

void SupportManagerThread( SupportManager *sm );

#endif //__SUPPORT_SUPPORT_MANAGER_H__
