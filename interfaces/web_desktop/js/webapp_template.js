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
	var flags =
	{
		'title'            : 'title_holder',
		'width'            : width_holder,
		'height'           : height_holder,
		'min-width'        : width_holder,
		'min-height'       : height_holder,
		'loadinganimation' : true
	};

	if ( screen_holder )
	{
		Application.screen = new Screen( { title: 'title_holder' } );
		Application.screen.onclose = function()
		{
			Application.quit();
		}
	}

	// Make a new window with some flags
	Application.mainView = new View( flags );

	// Displays the 'About' option in the menu
	Application.drawMenu();

	// Load the html into the view
	var f = new File( 'Progdir:index.html' );
	f.onLoad = function( data )
	{
		// Set it as window content
		Application.mainView.setContent( data );
	}
	f.load();

	// On closing the window, quit.
	Application.mainView.onClose = function()
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
	var f = new File( 'Progdir:about.html' );
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
        about1_holder author_holder
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
    "Init": "init_holder",
    "E-mail": "email_holder",
    "Description": "description_holder",
    "Permissions":
    [

    ],
	"Trusted": "no"
}
<ENDCUTCONFIG>
<CUTFOLDERINFO>
{
    "name": "title_holder",
	"type": "application",
	"jsx": "jsx_holder",
    "author": "author_holder",
    "category": "category_holder",
    "init": "init_holder",
    "email": "email_holder",
    "description": "description_holder",
    "permissions":
    [

    ],
	"trusted": "no"
}
<ENDCUTFOLDERINFO>
