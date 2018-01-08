/*©agpl*************************************************************************
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
*****************************************************************************©*/
/** @file
 *
 * FriendUI
 * Handles Friend GUI
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 19/10/2017
 */

// Abstract FUI commands
FriendUI =
{
	addItem: function( item, name, flags, callback )
    {
    	var message =
		{
			type:   'friendui',
			method: 'addItem',
			item: item,
			name: name,
			flags: flags
		};
		if ( callback )
			message.callback = addCallback( callback );
		Application.sendMessage( message );
	},
	removeItem: function( item, callback )
    {
		var message =
		{
			type: 'friendui',
			method: 'removeItem',
			item: item,
		};
		if ( callback )
			message.callback = addPermanentCallback( callback );
		Application.sendMessage( message );
	}
};
