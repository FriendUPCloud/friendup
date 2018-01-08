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

/*******************************************************************************
*                                                                              *
* Dock preferences application                                                 *
* ----------------------------                                                 *
*                                                                              *
* version: 1.0                                                                 *
*                                                                              *
*******************************************************************************/

document.title = 'The dock base app.';

Application.selectAfterLoad = false;

function LoadDocks()
{
	var m = new Module( 'dock' );
	m.onExecuted = function( cod, dat )
	{
		if( cod == 'fail' || dat == 'fail' )
		{
			Application.view.sendMessage( { command: 'setdocks', docks: false } );
		}
		else
		{
			
		}
	}
	m.execute( 'docks' );
}

// Loads the applications available to put into the dock
function LoadApplications( win, currentItemId, callback )
{
	// Load resources
	var m = new Module( 'dock' );
	m.onExecuted = function( cod, dat )
	{
		var eles = JSON.parse( dat );
		var ele = '';
		if( !currentItemId )
		{
			for( var a = 0; a < eles.length; a++ )
			{
				if( eles[a].Current )
				{
					currentItemId = eles[a].Id;
				}
			}
		}
		Application.currentItemId = currentItemId;
		
		for( var a = 0; a < eles.length; a++ )
		{
			var cl = '';
			if( a > 0 ) cl = ' MarginTop';
			//console.log( eles[a] );
			var img = eles[a].Image ? ( '/webclient/' + eles[a].Image ) : ( '/webclient/apps/' + eles[a].Name + '/icon.png' );
			if( eles[a].Icon )
			{
				if( eles[a].Icon.indexOf( ':' ) > 0 )
					img = getImageUrl( eles[a].Icon );
				else img = '/webclient/' + eles[a].Icon;
			}
			
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
		
		Application.appCache = eles;
		
		Application.view.sendMessage( { command: 'refreshapps', data: ele } );
		Application.sendMessage( { type: 'system', command: 'refreshdocks' } );
		if( Application.selectAfterLoad )
		{
			var nid = Application.selectAfterLoad;
			Application.selectAfterLoad = false;
			Application.activateDockItem( nid );
		}
		if( callback ) callback( eles );
	}
	m.execute( 'items', { itemId: !currentItemId ? 0 : currentItemId } );
}

// Extend the applicatino object with a run function
Application.run = function( packet ) 
{
	this.setSingleInstance( true );

	var w = new View( {
		title:  i18n('i18n_dock_editor'),
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
	f.i18n();
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{ 
			LoadApplications( w );
			LoadDocks();
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
		console.log('new dock item... ',r,dat);
		if(r == 'ok')
		{
			Application.selectAfterLoad = dat;
			console.log('new dockitem id is',dat);
		}
		
		LoadApplications( w );
	}
	m.execute( 'additem', {} );
}

// Activate a dock item
Application.activateDockItem = function( id )
{
	var w = this.view;
	LoadApplications( w, id, function()
	{
		var m = new Module( 'dock' );
		m.onExecuted = function( r, d )
		{
			w.sendMessage( {
				command: 'updateitem',
				item: JSON.parse( d )
			} );
			Application.disabled = false;
		}
		m.execute( 'getitem', { itemId: id } );
	} );
}

// Activate a dock item
Application.deleteDockItem = function( id )
{
	var w = this.view;
	Confirm( i18n( 'i18n_you_sure' ), i18n( 'i18n_you_sure_text' ), function( truefalse )
	{
		if( truefalse.data == true )
		{
			var m = new Module( 'dock' );
			m.onExecuted = function( r, d )
			{
				if( !isMobile )
				{
					LoadApplications( w, false, function( items )
					{
						Application.activateDockItem( items[0].Id );
					} );
				}
			}
			m.execute( 'deleteitem', { itemId: id } );
		}
	} );
}

Application.blur = function()
{
	this.view.setAttributeById( 'Settings', 'class', 
		'HContentRight HContent70 VContent100 BackgroundDefault Padding Disabled' );
	this.disabled = true;
}

// Update an application in the database
Application.saveItem = function( id, application, displayname, shortdescription, icon, workspace )
{
	var w = this.view;

	/*
	TODO: Reenable when sensitive for arguments
	for( var a = 0; a < Application.appCache.length; a++ )
	{
		if( Application.appCache[a].Name == application )
		{
			Alert( i18n( 'i18n_item_exists' ), i18n( 'i18n_item_exists_desc' ) );
			return;
		}
	}
	*/
	var m = new Module( 'dock' );
	m.onExecuted = function( r, d )
	{
		LoadApplications( w, id );
   		Notify({title:i18n('i18n_item_saved'),text:i18n('i18n_item_saved_text')});
	}
	var ms = { 
		itemId: id, 
		application: application,
		displayname: displayname,
		shortdescription: shortdescription, 
		icon: icon, 
		workspace: workspace 
	};
	console.log( 'Saving item: ', ms );
	m.execute( 'saveitem', ms );
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
			case 'cliarguments':
				console.log( 'Cli arguments incoming:' );
				console.log( msg );
				break;
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
						msg.displayname,
						msg.shortdescription,
						msg.icon,
						msg.workspace
					);
				}
				break;
			case 'savecurrentdock':
				var m = new Module( 'dock' );
				m.onExecuted = function( e, d )
				{
					Application.sendMessage( {
						type: 'system',
						command: 'refreshdocks'
					} );
				}
				m.execute( 'savedock', { options: msg.options, dockid: msg.dockid } );
				break;
			case 'quit':
				Application.quit();
				break;
		}
	}
}

