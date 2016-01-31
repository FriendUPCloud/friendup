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

#ifndef __USER_APPLICATION_H__
#define __USER_APPLICATION_H__

#include <core/types.h>
#include <core/nodes.h>

typedef struct UserApplication
{
	ULONG               ua_ID;
	ULONG               ua_ApplicationID;
	char *              ua_Permissions;     // <- in json format
	void *              ua_Next;
} 
UserApplication;

#endif // __USER_APPLICATION_H__
