/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var Gui = {
	// Just show a simple notification
	ShowBubbleNotification: function( text, image )
	{
		if( !image ) image = false;
		var v = document.createElement( 'div' );
		v.className = 'BubbleNotification';
		v.innerHTML = '<div class="Text">' + text + '</div>';
		if( image )
		{
			v.innerHTML += '<div class="Image"><img src="' + image + '"/></div>';
		}
		setTimeout( function()
		{
			v.classList.add( 'Showing' );
		}, 5 );
		setTimeout( function()
		{
			v.classList.remove( 'Showing' );
			setTimeout( function()
			{
				ge( 'Screen' ).removeChild( v );
			}, 500 );
		}, 3005 );
		ge( 'Screen' ).appendChild( v );
	}
};
