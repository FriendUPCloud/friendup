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

#include <system/support/support_manager.h>

//
//
//

SupportManager *SupportManagerNew( )
{
	SupportManager *sm;
	
	if( ( sm = FCalloc( 1, sizeof( SupportManager ) ) ) != NULL )
	{
		
	}
	else
	{
		ERROR("Cannot allocate memory for SupportManager!\n");
	}
	
	return sm;
}

//
//
//

void SupportManagerDelete( SupportManager *sm )
{
	if( sm != NULL )
	{
		FFree( sm );
	}
}

//
//
//

void SupportManagerThread( SupportManager *sm )
{
	
}

