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

/*******************************************************************************
*                                                                              *
* Dock preferences application                                                 *
* ----------------------------                                                 *
*                                                                              *
* version: 1.0                                                                 *
*                                                                              *
*******************************************************************************/

document.title = 'The dock base app.';

// Loads the applications available to put into the dock
function LoadApplications( win, currentItemId )
{
	// Load resources
	var m = new Module( 'dock' );
	m.onExecuted = function( cod, dat )
	{
		var eles = JSON.parse( dat );
		var ele = '';
		if( !currentItemId )
		{
			currentItemId = eles[0].Id;
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].Current ) currentItemId = eles[a].Id;
			}
		}
		Application.currentItemId = currentItemId;
		
		for( var a = 0; a < eles.length; a++ )
		{
			var cl = '';
			if( a > 0 ) cl = ' MarginTop';
			var img = eles[a].Image ? eles[a].Image : ( '/webclient/apps/' + eles[a].Name + '/icon.png' );
			
			// Activate the current selected
			if( eles[a].Id == currentItemId ) cl += ' BackgroundNegative Negative';
			
			ele += '\
			<div class="Box' + cl + '" onclick="Application.sendMessage( { command: \'select\', id: \'' + eles[a].Id + '\' } )">\
				<div class="HRow">\
					<div class="FloatRight HContent50"><img style="float: right; width: 40px; height: auto" src="' + img + '"/></div>\
					<div class="FloatLeft HContent50">' + eles[a].Name + '</div>\
				</div>\
			</div>\
			';
		}
		
		if( Application.disabled )
			win.setAttributeById( 'Settings', 'disabled', '1' );
		else win.setAttributeById( 'Settings', 'disabled', '0' );
		
		console.log( 'Refreshing apps!' );
		Application.view.sendMessage( { command: 'refreshapps', data: ele } );
		Application.sendMessage( { type: 'system', command: 'refreshdocks' } );
	}
	m.execute( 'items', { itemId: !currentItemId ? 0 : currentItemId } );
}

// Extend the applicatino object with a run function
Application.run = function( packet ) 
{
	var w = new View( {
		title:  'Dock editor', 
		width:  520, 
		height: 480,
		id:     'dock_editor'
	} );
	
	this.view = w;
	
	w.getInstanceNum = function()
	{
		return this.instanceNum;
	}
	
	w.onClose = function()
	{
		Application.quit();
	}
	
	// Set up menus
	w.setMenuItems( [
		{
			name: i18n( 'i18n_file' ),
			items: [
				{
					name: i18n( 'i18n_quit' ),
					command: 'quit'
				}
			]
		} 
	] );

	var f = new File( 'Progdir:Templates/gui.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{ 
			LoadApplications( w );
		} );
	}
	f.load();
	
	// Disable gui
	this.disabled = true;
};

// Request a new Dock item
Application.newDockItem = function()
{
	var m = new Module( 'dock' );
	var w = this.view;
	m.onExecuted = function( r, dat )
	{
		LoadApplications( w );
	}
	m.execute( 'additem', {} );
}

// Activate a dock item
Application.activateDockItem = function( id )
{
	var w = this.view;
	LoadApplications( w, id );
	
	var m = new Module( 'dock' );
	m.onExecuted = function( r, d )
	{
		var item = JSON.parse( d );
		w.setAttributeById( 'Application',      'value', item.Application );
		w.setAttributeById( 'ShortDescription', 'value', item.ShortDescription );
		w.setAttributeById( 'SortOrder',        'value', item.SortOrder );
		w.setAttributeById( 'Settings',         'class',
			'HContentRight HContent70 VContent100 BackgroundDefault Padding' );
		Application.disabled = false;
	}
	m.execute( 'getitem', { itemId: id } );
}

// Activate a dock item
Application.deleteDockItem = function( id )
{
	var w = this.view;
	
	var m = new Module( 'dock' );
	m.onExecuted = function( r, d )
	{
		LoadApplications( w );
	}
	m.execute( 'deleteitem', { itemId: id } );
}

Application.blur = function()
{
	this.view.setAttributeById( 'Settings', 'class', 
		'HContentRight HContent70 VContent100 BackgroundDefault Padding Disabled' );
	this.disabled = true;
}

// Update an application in the database
Application.saveItem = function( id, application, shortdescription, icon )
{
	var w = this.view;

	var m = new Module( 'dock' );
	m.onExecuted = function( r, d )
	{
		LoadApplications( w, id );
	}
	m.execute( 'saveitem', { itemId: id, application: application, shortdescription: shortdescription } );
}

Application.sortOrder = function( direction )
{
	if( !this.currentItemId )
		return;
	var m = new Module( 'dock' );
	var w = this.view;
	var i = this.currentItemId;
	m.onExecuted = function( r, d )
	{
		LoadApplications( w, i );
	}
	m.execute( 'sortorder', { itemId: this.currentItemId, direction: direction } );
}

// Receive messages from child elements
Application.receiveMessage = function( msg )
{
	if ( msg.command )
	{
		switch( msg.command )
		{
			case 'newdockitem':	
				Application.newDockItem();
				break;
			case 'select':
				Application.activateDockItem( msg.id );
				break;
			case 'deleteitem':
				if( Application.currentItemId )
				{
					Application.deleteDockItem( Application.currentItemId );
				}
				break;
			// Move SortOrder -1
			case 'updockitem':
				Application.sortOrder( 'up' );
				break;
			case 'downdockitem':
				Application.sortOrder( 'down' );
				break;
			case 'saveitem':
				if( Application.currentItemId )
				{
					Application.saveItem( 
						Application.currentItemId,
						msg.application,
						msg.shortdescription
					);
				}
				break;
			case 'quit':
				Application.quit();
				break;
		}
	}
}


