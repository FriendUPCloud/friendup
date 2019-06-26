/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// This is an object!
var ScreenOverlay = {
	visibility: false,
	mode: 'login',
	// Public methods ----------------------------------------------------------
	init: function()
	{
		this.div = document.createElement( 'div' );
		this.div.id = 'FriendScreenOverlay';
		document.body.appendChild( this.div );
		// If needed
		this.initPrivate();		
	},
	
	// Private methods ---------------------------------------------------------
	initPrivate: function()
	{
	}
};
// Go ahead and init!
ScreenOverlay.init();
