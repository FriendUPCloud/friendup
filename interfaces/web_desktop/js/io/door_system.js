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

// Global event system
/* 
	Like this: {
		Artisan: [],
		System: [],
		..
	}
*/
SystemEvent = function( info )
{
	
}
var SystemEvents = {};

// Special one
// TODO: We should implement the whole of System: as a dormant door...
// TODO: On the other hand, but having it as a special case, it is more secure
var WorkspaceDormant = {
	title: 'SystemDormant',
	windows: [],
	refresh: function( winObj )
	{
		//winObj.innerHTML = ':)';
	},
	execute: function( func, args )
	{
		switch( func.toLowerCase() )
		{
			case 'fullscreen':
				Workspace.fullscreen();
				break;
			case 'graphicsadd':
				var d = document.createElement( 'div' );
				if( args )
				{
					// First argument is graphic id
					d.id = args[0];
				}
				d.className = 'FriendGraphic Default';
				if( currentMovable )
				{
					currentMovable.content.appendChild( d );
				}
				else if( currentScreen )
				{
					currentScreen.screenObject._screen.appendChild( d );
				}
				break;
			case 'graphicsremove':
				if( args )
				{
					var s = ge( args[0] );
					if( !s ) return false;
					s.parentNode.removeChild( s );
					return true;
				}
				break;
			case 'graphicsmode':
				if( args )
				{
					// First arg is graphic id
					var s = ge( args[0] );
					if( !s ) return false;
					
					switch( args[1].toLowerCase() )
					{
						case 'rectangle':
						case 'circle':
						case 'image':
						case 'default':
							s.className = 'FriendGraphic ' + args[1].substr( 0, 1 ).toUpperCase() + args[1].substr( 1, args[1].length - 1 ).toLowerCase();
							return true;
							break;
					}
					return false;
				}
				break;
			case 'graphicsset':
				if( args && args.length == 3 )
				{
					// First arg, gr id
					var s = ge( args[0] );
					if( !s ) return false;
					// Next, prop, then val
					switch( args[1].toLowerCase() )
					{
						case 'left':
							s.style.left = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'right':
							s.style.right = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'top':
							s.style.top = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'bottom':
							s.style.bottom = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'background':
							s.style.backgroundColor = args[2];
							return true;
							break;
						case 'image':
							s.style.backgroundImage = 'url(' + getImageUrl( args[2] ) + ')';
							return true;
							break;
						case 'width':
							s.style.width = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'height':
							s.style.height = parseInt( args[2] ) + 'px';
							return true;
							break;
						case 'depth':
							s.style.zIndex = parseInt( args[2] );
							return true;
							break;
					}
					return false;
				}
				break;
			case 'screenlist':
				var arOut = [];
				var screens = ge( 'Screens' ).childNodes;
				for( var a = 0; a < screens.length; a++ )
				{
					if( screens[a].id && screens[a].className && screens[a].className.indexOf( 'Screen' ) >= 0 )
					{
						arOut.push( { ID: screens[a].id, Title: screens[a].screenObject._flags['title'], Type: 'Screen' } );
					}
				}
				return arOut;
				break;
			case 'screenactivate':
				if( args )
				{
					var s = ge( args[0] );
					if( s )
					{
						_DeactivateWindows();
						window.currentScreen = s;
						s.screenObject.screenToFront();
						return true;
					}
				}
				return false;
			case 'screenopen':
				if( !args )
				{
					args = [ 'Unnamed screen', 'unnamed' ];
				}
				else if ( args.length < 2 )
				{
					args[1] = 'unnamed';
				}
				// TODO: support more flags!
				var f = new Screen( { title: args[0], id: args[1] } );
				return f.id;
			case 'screenclose':
				if( !args ) return false;
				var screens = ge( 'Screens' ).childNodes;
				for( var a = 0; a < screens.length; a++ )
				{
					if( screens[a].id && screens[a].id == args[0] )
					{
						screens[a].screen.close();
						return true;
					}
				}
				return false;
			// TODO: Case insensitive?
			default:
				// Hard code for now
				var docs = [ 'FriendDOS', 'Dormant', 'Workspace', 'Programming', 'VoiceCommand' ];
				for( var b in docs )
				{
					if( func == docs[b] )
					{
						SystemDocumentViewer( func );
						return true;
					}
				}
				// Try..
				SystemDocumentViewer( func, 'system' );
				return false;
		}
	}
}
DormantMaster.addAppDoor( WorkspaceDormant );

DoorSystem = function( path )
{
	this.path = path;
	this.icons = [];
	var door = this;
	this.handler = 'system';
	this.dosdriver = 'System';
	this.ready = false;
	this.Volume = 'System:';
	
	// Run superfunction init
	this.init();
	this.ready = true;
}

DoorSystem.prototype = new Door();

DoorSystem.prototype.get = function( path )
{
	var vol = path.split( ':' )[0] + ':';
	for( var a = 0; a < Doors.icons.length; a++ )
	{
		if( Doors.icons[a].Volume.toLowerCase() == vol.toLowerCase() )
		{
			if( Doors.icons[a].Door.dosdriver != 'System' )
				return Doors.icons[a].Door.get( path );
		}
	}
	return new DoorSystem( path );
}

// Return an array of icons!
DoorSystem.prototype.getIcons = function( fileInfo, callback )
{
	if( !fileInfo )
	{
		fileInfo = {
			Path: this.path,
			Type: 'unknown'
		};
	}
	
	var dirPrefs         = 'System:' + i18n('i18n_directory_Prefs') + '/';
	var dirTools         = 'System:' + i18n('i18n_directory_Tools') + '/';
	var dirModules       = 'System:' + i18n('i18n_directory_Modules') + '/';
	var dirLibraries     = 'System:' + i18n( 'i18n_directory_Libraries' ) + '/';
	var dirSoftware      = 'System:' + i18n('i18n_directory_Software') + '/';
	var dirDevices       = 'System:' + i18n('i18n_directory_Devices') + '/';
	var dirFunctions     = 'System:' + i18n('i18n_directory_Functions') + '/';
	var dirDocumentation = 'System:' + i18n('i18n_directory_Documentation' ) + '/';
	var dirDocApps       = 'System:' + i18n('i18n_directory_DocApps' ) + '/';
	
	if( !this.path && fileInfo.Path ) this.path = fileInfo.Path;
	var path = fileInfo.Path ? fileInfo.Path : this.path;

	switch( path )
	{
		case 'System:':
			return callback( [
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Prefs' ),
					Path     : 'System:' + i18n( 'i18n_directory_Prefs' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/categories/preferences-system.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Prefs' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Tools' ),
					Path     : 'System:' + i18n( 'i18n_directory_Tools' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/categories/applications-utilities.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Tools' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Command  : 'Modules',
					Title    : i18n( 'i18n_directory_Modules' ),
					Path     : 'System:' + i18n( 'i18n_directory_Modules' ) + '/',
					Type     : 'Directory',
					Module   : 'files',
					IconFile : 'gfx/icons/128x128/places/folder-activities.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Modules' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Command  : 'Devices',
					Title    : i18n( 'i18n_directory_Devices' ),
					Path     : 'System:' + i18n( 'i18n_directory_Devices' ) + '/',
					Type     : 'Directory',
					Module   : 'files',
					IconFile : 'gfx/icons/128x128/places/folder-print.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Devices' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Libraries' ),
					Path     : 'System:' + i18n( 'i18n_directory_Libraries' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/places/folder-favorites.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Libraries' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Software' ),
					Path     : 'System:' + i18n( 'i18n_directory_Software' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/places/folder-green.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Software' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Documentation' ),
					Path     : 'System:' + i18n( 'i18n_directory_Documentation' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/categories/system-help.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Documentation' ) + '/' )
				},
				{
					MetaType : 'Directory',
					Title    : i18n( 'i18n_directory_Functions' ),
					Path     : 'System:' + i18n( 'i18n_directory_Functions' ) + '/',
					Type     : 'Directory',
					IconFile : 'gfx/icons/128x128/places/folder-development.png',
					Door     : new DoorSystem( 'System:' + i18n( 'i18n_directory_Functions' ) + '/' )
				}
			], 'System:' );
			break;
		case dirDocumentation:
			var files = [ 'Workspace', 'FriendDOS', 'Dormant', 'Programming', 'VoiceCommand' ];
			var dirs = [ 'Applications', 'Modules', 'Libraries', 'Tools', 'Devices' ];
			var eles = [];
			for( var a = 0; a < files.length; a++ )
			{
				eles.push( {
					MetaType: 'Meta',
					Filename: files[a],
					Title: files[a],
					IconFile: 'gfx/icons/128x128/mimetypes/text-enriched.png',
					Path: path,
					Position: 'left',
					Module: 'files',
					Command: 'dormant',
					Filesize: 16,
					Type: 'DormantFunction',
					Dormant: WorkspaceDormant
				} );
			}
			for( var a = 0; a < dirs.length; a++ )
			{
				eles.push( {
					MetaType: 'Directory',
					Title: dirs[a],
					IconFile: 'gfx/icons/128x128/places/folder-grey.png',
					Position: 'left',
					Type: 'Directory',
					Path: path + dirs[a] + '/',
					Dormant: WorkspaceDormant
				} );
			}
			return callback( eles, dirDocumentation );
		case dirDocApps:
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					var files = JSON.parse( data );
					for( var a = 0; a < files.length; a++ )
						files[a].Dormant = WorkspaceDormant;
					callback( files );
				}
			}
			m.execute( 'listapplicationdocs' );
			break;
		case dirFunctions:
			var funcs = [ 
				'ViewOpen', 'ViewClose', 'FullScreen', 'ScreenOpen', 'ScreenActivate', 'ScreenClose', 'ScreenList', 'SetMenu', 
				'GraphicsAdd', 'GraphicsRemove', 'GraphicsSet', 'GraphicsMode'
			];
			var eles = [];
			for( var a = 0; a < funcs.length; a++ )
			{
				eles.push( {
					MetaType: 'Meta',
					Filename: funcs[a],
					Title: funcs[a],
					IconFile: 'gfx/icons/128x128/mimetypes/application-octet-stream.png',
					Path: path,
					Position: 'left',
					Module: 'files',
					Command: 'dormant',
					Filesize: 16,
					Type: 'DormantFunction',
					Dormant: WorkspaceDormant
				} );
			}
			return callback( eles, dirFunctions );
			break;
		case dirTools:
			// Available tools applications
			var tools = {
				/*'Processmgr'     : i18n( 'i18n_processmgr' ),*/
				'Applicationmgr' : i18n( 'i18n_applicationmgr' ),
				'SysDiag'        : i18n( 'i18n_sysdiag' )
			};
			var icons = {
				/*'Processmgr'     : 'apps/utilities-system-monitor.png',*/
				'Applicationmgr' : 'apps/utilities-log-viewer.png',
				'SysDiag'        : 'apps/Charm.png'
			};
			var output = [];
			
			// Loop through and make icons
			for( var tool in tools )
			{
				var icon = icons[tool];
				output.push( {
					MetaType: 'File',
					Title: tools[tool],
					Filename: tool,
					Path: 'System:Tools/',
					IconFile: 'gfx/icons/128x128/' + icon,
					Position: 'left',
					Type: 'Executable'
				} );
			}
			if( callback )
				return callback( output, dirTools );
			return output;
		case dirDevices:
			var devs = {
				dosdrivers     : i18n( 'i18n_dosdrivers' )/*,
				printers       : i18n( 'i18n_printers' )*/
			};
			var icons = {
				dosdrivers     : 'places/folder-grey.png'/*,
				printers       : 'places/folder-print.png'*/
			};
			
			// Output array
			var output = [];

			// Loop through and make icons
			for( var dev in devs )
			{
				var icon = icons[dev];
				output.push( {
					MetaType: 'Directory',
					Title: devs[dev],
					Path: 'System:Devices/' + devs[dev] + '/',
					IconFile: 'gfx/icons/128x128/' + icon,
					Position: 'left',
					Type: 'Directory'
				} );
			}
			if( callback )
				return callback( output, dirDevices );
			return output;
			
		case dirPrefs:
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) return;
				var prefs = {}, icons = {};
				if( d == 'User' )
				{
					// Get available preferences applications
					prefs = {
						'Looknfeel'    : i18n( 'i18n_looknfeel' ),
						'Screens'      : i18n( 'i18n_screens' ),
						'Wallpaper'    : i18n( 'i18n_wallpaper' ),
						//'Language'     : i18n( 'i18n_language' ),
						//'Desklets'     : i18n( 'i18n_desklets' ),
						//'Sound'        : i18n( 'i18n_sound' ),
						//'Keyboard'     : i18n( 'i18n_keyboard' ),
						//'Input'        : i18n( 'i18n_input' ),
						//'Datetime'     : i18n( 'i18n_datetime' ),
						'Mimetypes'    : i18n( 'i18n_mimetypes' ),
						'Dock'         : i18n( 'i18n_docksettings' ),
						'Account'      : i18n( 'i18n_account' )
					};
					// Setup icons for all these preferences
					icons = {
						'Looknfeel'    : 'apps/preferences-desktop-theme.png',
						'Screens'      : 'devices/video-display.png',
						'Wallpaper'    : 'apps/preferences-desktop-wallpaper.png',
						//'Language'     : 'apps/lokalize.png',
						//'Desklets'     : 'apps/telepathy-kde.png',
						//'Sound'        : 'devices/audio-headphones.png',
						//'Keyboard'     : 'devices/input-keyboard.png',
						//'Input'        : 'devices/input-mouse.png',
						//'Datetime'     : 'apps/clock.png',
						'Mimetypes'    : 'apps/preferences-desktop-default-applications.png',
						'Dock'         : 'apps/picmi.png',
						'Account'      : 'apps/preferences-desktop-user.png'
					};
				}
				else if( d == 'Admin' )
				{
					// Get available preferences applications
					prefs = {
						'Looknfeel'    : i18n( 'i18n_looknfeel' ),
						'Screens'      : i18n( 'i18n_screens' ),
						'Wallpaper'    : i18n( 'i18n_wallpaper' ),
						//'Printers'     : i18n( 'i18n_printers' ),
						//'Network'      : i18n( 'i18n_network' ),
						//'Language'     : i18n( 'i18n_language' ),
						'Mountlist'    : i18n( 'i18n_mountlist' ),
						//'Desklets'     : i18n( 'i18n_desklets' ),
						//'Sound'        : i18n( 'i18n_sound' ),
						//'Keyboard'     : i18n( 'i18n_keyboard' ),
						//'Input'        : i18n( 'i18n_input' ),
						//'Hardware'     : i18n( 'i18n_hardware' ),
						'Users'        : i18n( 'i18n_useraccounts' ),
						//'Datetime'     : i18n( 'i18n_datetime' ),
						'Dock'         : i18n( 'i18n_docksettings' ),
						'Mimetypes'    : i18n( 'i18n_mimetypes' ),
						'Security'     : i18n( 'i18n_security' ),
						'Account'      : i18n( 'i18n_account' )
					};
					// Setup icons for all these preferences
					icons = {
						'Looknfeel'    : 'apps/preferences-desktop-theme.png',
						'Screens'      : 'devices/video-display.png',
						'Wallpaper'    : 'apps/preferences-desktop-wallpaper.png',
						//'Printers'     : 'devices/printer-laser.png',
						//'Network'      : 'places/network-workgroup.png',
						//'Language'     : 'apps/lokalize.png',
						'Mountlist'    : 'mimetypes/x-office-address-book.png',
						//'Desklets'     : 'apps/telepathy-kde.png',
						//'Sound'        : 'devices/audio-headphones.png',
						//'Keyboard'     : 'devices/input-keyboard.png',
						//'Input'        : 'devices/input-mouse.png',
						//'Hardware'     : 'devices/audio-card.png',
						'Users'        : 'apps/system-users.png',
						//'Datetime'     : 'apps/clock.png',
						'Dock'         : 'apps/picmi.png',
						'Mimetypes'    : 'apps/preferences-desktop-default-applications.png',
						'Security'     : 'devices/secure-card.png',
						'Account'      : 'apps/preferences-desktop-user.png'
					};
				}

				// Output array
				var output = [];

				// Loop through and make icons
				for( var pref in prefs )
				{
					var icon = icons[pref];
					output.push( {
						MetaType: 'File',
						Title: prefs[pref],
						Filename: pref,
						IconFile: 'gfx/icons/128x128/' + icon,
						Position: 'left',
						Type: 'Executable'
					} );
				}
				if( callback ) callback( output, dirPrefs );
			}
			m.execute( 'userlevel' );
			break;
		case dirSoftware:
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				callback( JSON.parse( data, dirSoftware ) );
			}
			m.execute( 'listappcategories' );
			return;
		// Get all modules listed out
		case dirModules:
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				callback( JSON.parse( data, dirModules ) );
			}
			m.execute( 'listmodules' );
			return;
		case dirLibraries:
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				callback( JSON.parse( data, dirLibraries ) );
			}
			m.execute( 'listlibraries' );
			break;
		// TODO: Replace most of the others (if possible) with this one!!
		// Try system path
		default:
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				if( r == 'ok' ) 
				{
					var list = JSON.parse( data );
					console.log( list );
					if( list.length )
					{
						var pth = list[0].Path.substr( 0, path.length );
						return callback( JSON.parse( data ), pth );
					}
					else callback( false, { response: 'Empty directory.' } );
				}
				else callback( false );
			}
			m.execute( 'systempath', { path: path } );
			return;
	}
	if( callback && this.icons && this.icons.length && this.icons[0].Path ) 
	{
		var pth = this.icons[0].Path.substr( 0, path.length );
		callback( this.icons, pth );
	}
	return icons; 
}

// Dos arguments
DoorSystem.prototype.dosAction = function( cmd, args, callback ) 
{
	switch( cmd )
	{
		case 'copy':
			break;
	}
};

// Instantiate a new one!
DoorSystem.prototype.instantiate = function()
{
	return new DoorSystem();
};

/* system document viewer - TODO: move -------------------------------------- */

var sysDocStack = [];
function SystemDocumentViewer( doc, modulecall )
{
	if( sysDocStack[doc] ) return;
	var w = new View( {
		title: i18n( 'documentation_on' ) + ' ' + doc,
		width: 700,
		height: 500,
		id: 'sysdoc_doc'
	} );
	// Clean house
	w.onClose = function()
	{
		var d = [];
		for( var a in sysDocStack )
			if( a != doc )
				d.push( sysDocStack[a] );
		sysDocStack = d;
	}
	
	// TODO: Move these
	if( !modulecall )
	{	
		var f = new cAjax();
		f.open( 'get', '/webclient/templates/sysdoc_' + doc + '.html', true, true );
		f.onload = function( r, data )
		{
			w.setContent( this.responseText() );
		}
		f.send();
	}
	else
	{
		var m = new Module( modulecall );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				w.setContent( d );
			}
		}
		m.execute( 'finddocumentation', { doc: doc } );
	}
	
	sysDocStack[doc] = w;
}

