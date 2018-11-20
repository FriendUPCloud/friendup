/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
