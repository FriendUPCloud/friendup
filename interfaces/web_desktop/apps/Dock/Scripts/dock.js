/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
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
Application.items = false;

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
		var eles = false;
		
		try
		{
			eles = JSON.parse( dat );
		}
		catch(e)
		{
			console.log( 'Error during dock load...', cod, dat );
			return;
			
		}
		var ele = '';
		Application.items = eles;
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
		
		var sw = 2;
		
		for( var a = 0; a < eles.length; a++ )
		{
			var cl = '';
			
			var img = '';
			if( eles[a].Name != 'Unnamed' )
			{
				img = eles[a].Image ? ( '/webclient/' + eles[a].Image ) : ( '/webclient/apps/' + eles[a].Name + '/icon.png' );
			}
			
			if( eles[a].Image.substr( 0, 1 ) == '/' )
			{
				img = eles[a].Image;
			}
			else if( eles[a].Icon.substr( 0, 1 ) == '/' )
			{
				img = eles[a].Icon;
			}
			else if( eles[a].Icon )
			{
				if( eles[a].Icon.indexOf( ':' ) > 0 )
					img = getImageUrl( eles[a].Icon );
				else if( eles[a].Icon.indexOf( '/system.library' ) == 0 )
				{
					img = eles[a].Icon.split( /sessionid\=[^&]+/ ).join( 'authid=' + Application.authId );
				}
				else if( eles[a].Icon.indexOf( '/webclient' ) != 0 )
				{
					img = '/webclient/' + eles[a].Icon;
				}
			}
			
			// Activate the current selected
			if( eles[a].Id == currentItemId ) cl += ' Selected';
			
			// Double check image.
			var im = '<div class="Empty"></div>';
			if( img && img.length )
			{
				im = '<img style="float: right; width: 40px; height: auto" src="' + img + '" onerror="this.src = \'/iconthemes/friendup15/File_Function.svg\'"/>';
			}
			
			sw = sw == 1 ? 2 : 1;
			cl += ' sw' + sw;
			
			let nam = eles[a].DisplayName ? eles[a].DisplayName : eles[a].Name;
			if( nam.indexOf( ':' ) > 0 )
				nam = nam.split( ':' )[1];
			if( nam.indexOf( '/' ) > 0 )
				nam = nam.split( '/' )[1];
			if( nam.indexOf( ' ' ) > 0 )
				nam = nam.split( ' ' )[0] + ' ...';
			
			ele += '\
			<div class="Padding' + cl + '" id="dockEdit'+ eles[a].Id +'" onclick="Application.sendMessage( { command: \'select\', id: \'' + eles[a].Id + '\' } )">\
				<div class="HRow">\
					<div class="FloatRight" style="width: 60px">' + im + '</div>\
					<div class="FloatLeft PaddingLeft" style="width: calc(100%-60px)">' + nam + '</div>\
				</div>\
			</div>\
			';
		}
		
		if( Application.disabled )
			win.setAttributeById( 'Settings', 'disabled', '1' );
		else win.setAttributeById( 'Settings', 'disabled', '0' );
		
		Application.appCache = eles;
		
		Application.view.sendMessage( { command: 'refreshapps', data: ele, current: currentItemId } );
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
		width:  720, 
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

	// Set app in single mode
	this.setSingleInstance( true );
	
	// Disable gui
	this.disabled = true;
};

// Request a new Dock item
Application.newDockItem = function()
{
	let m = new Module( 'dock' );
	let w = this.view;
	m.onExecuted = function( r, dat )
	{
		if( r == 'ok' )
		{
			Application.selectAfterLoad = dat;
		}
		LoadApplications( w );
	}
	m.execute( 'additem', {} );
}

// Activate a dock item
Application.activateDockItem = function( id, scroll )
{
	var w = this.view;
	if( !id ) return;
	
	LoadApplications( w, id, function()
	{
		var m = new Module( 'dock' );
		m.onExecuted = function( r, d )
		{
			if( d == 'fail' ) return;
			
			try{
				d = JSON.parse( d );
			}
			catch( e )
			{
				console.log('invalid dock activate',d,e);
				return;
			}
			
			w.sendMessage( {
				command: 'updateitem',
				item: d,
				scroll: scroll ? scroll : 'no'
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
				//console.log(isMobile,'item has been deleted!',Application.items);
				//if( !isMobile )
				//{
					LoadApplications( w, false, function( items )
					{
						Application.activateDockItem( items[0].Id );
					} );
				//}
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
Application.saveItem = function( id, application, displayname, shortdescription, icon, workspace, opensilent, type )
{
	let w = this.view;

	let m = new Module( 'dock' );
	m.onExecuted = function( r, d )
	{
		LoadApplications( w, id );
   		Notify({title:i18n('i18n_item_saved'),text:i18n('i18n_item_saved_text')});
	}
	let ms = { 
		itemId: id, 
		application: application,
		displayname: displayname,
		shortdescription: shortdescription, 
		icon: icon, 
		workspace: workspace,
		opensilent: opensilent === '1' ? '1' : '0',
		type: type ? type : 'executable'
	};
	Application.selectAfterLoad = id;
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
	Application.selectAfterLoad = i;
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
					console.log( 'Save now!', msg );
					Application.saveItem( 
						Application.currentItemId,
						msg.application,
						msg.displayname,
						msg.shortdescription,
						msg.icon,
						msg.workspace,
						msg.opensilent === 'true' ? '1': '0',
						msg.docktype
					);
				}
				else
				{
					console.log( 'Nothing to save...' );
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

