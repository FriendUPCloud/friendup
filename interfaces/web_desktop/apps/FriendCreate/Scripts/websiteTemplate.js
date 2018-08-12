<CUTMAIN>
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
	this.mainView = new View(
	{
		title: 'title_holder',
		width: width_holder,
		height:  height_holder
	} );

	// Displays the 'About' option in the menu
	this.drawMenu();

	// Load the html into the view
	var self = this;
	var f = new File( 'Progdir:Templates/index.html' );
	f.onLoad = function( data )
	{
		// Set it as window content
		self.mainView.setContent( data );
	}
	f.load();

	// On closing the window, quit.
	this.mainView.onClose = function()
	{
		Application.quit();
	}
};

// Redraws the main application pulldown menu
Application.drawMenu = function()
{
	this.mainView.setMenuItems(
	[
		{
			name: 'file_holder',
			items:
			[
				{
					name: i18n( 'About' ),
					command: 'about'
				}
			]
		}
	] );
};

// Message handling
Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
	case 'about':
		this.about();
		break;
	}
};

// About box
Application.about = function()
{
	if( this.aboutWindow )
		return;
	this.aboutWindow = new View(
	{
		title: 'about0_holder title_holder',
		width: 400,
		height: 300
	} );
	var v = this.aboutWindow;
	this.aboutWindow.onClose = function()
	{
		Application.aboutWindow = false;
	}
	var f = new File( 'Progdir:Templates/about.html' );
	f.i18n();

	var self = this;
	f.onLoad = function( data )
	{
		self.aboutWindow.setContent( data );
	}
	f.load();
};
<ENDCUTMAIN>
<CUTINDEX>
<object data="url_holder" width="100%" height="100%">
    <embed src="url_holder" width="100%" height="100%"> </embed>
    Error: Embedded data could not be displayed.
</object>
<ENDCUTINDEX>
<CUTABOUT>
<div class="VContentTop Padding ScrollArea" id="vt">
    <p>
        <strong>title_holder</strong>
    </p>
    <p>
        about1_holder
    </p>
    <p>
        about2_holder (email_holder)
    </p>
</div>
<div class="VContentBottom BorderTop BackgroundDefault Padding" id="vb">
    <p class="Layout">
        <button type="button" class="Button IconSmall fa-close" onclick="Application.sendMessage( { type: 'view', method: 'close' } )">&nbsp;close_holder</button>
    </p>
</div>
<style>
    #vt
    {
        bottom: 50px;
    }
    #vb
    {
        height: 50px;
    }
</style>
<ENDCUTABOUT>
<CUTCONFIG>
{
    "Name": "title_holder",
    "API": "v1",
    "Version": "0.1",
    "Author": "author_holder",
    "Category": "category_holder",
    "Init": "main.js",
    "E-mail": "email_holder",
    "Description": "description_holder",
    "Permissions":
    [

    ],
	"Trusted": "no"
}
<ENDCUTCONFIG>
