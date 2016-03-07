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

#ifndef __CORE_FUNCTIONS_H__
#define __CORE_FUNCTIONS_H__

#define LIST_FOR_EACH( LIST, ENTRY ) \
	for( ENTRY = LIST; ENTRY != NULL ; ENTRY = ENTRY->node.mln_Succ )

#define LIST_ADD_HEAD( LIST, ENTRY ) \
		ENTRY->node.mln_Succ =(MinNode *) LIST; \
		LIST = ENTRY;
		
#endif //__CORE_FUNCTIONS_H__
