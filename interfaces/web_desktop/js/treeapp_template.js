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
