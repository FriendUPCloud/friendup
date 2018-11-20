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
 * Friend web-application template
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/10/2017
 */

Application.run = function( msg )
{
	// Make a new window with some flags
	this.view = new View(
	{
		title: 'title_holder',
		width: width_holder,
		height:  height_holder
	} );

	// Load the html into the view
	if ( html_path != 'htmlpath_holder' )
	{
		var self = this;
		var f = new File( 'html_holder' );
		f.onLoad = function( data )
		{
			// Set it as window content
			self.view.setContent( data );
		}
		f.load();
	}
	else
	{
		self.view.setContent( html_template );
	}

	// On closing the window, quit.
	this.view.onClose = function()
	{
		Application.quit();
	}
};

// Message handling
Application.receiveMessage = function( msg )
{
	/*switch( msg.command )
	{
	case 'about':
		this.about();
		break;
	}
	*/
};

var html_template = 'html_holder';
var html_path = 'htmlpath_holder';
