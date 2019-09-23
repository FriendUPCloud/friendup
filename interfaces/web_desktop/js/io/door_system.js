/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Global event system
/* 
	Like this: {
		Artisan: [],
		System: [],
		..
	}
*/

Friend = window.Friend || {};

SystemEvent = function( info )
{
	
}
var SystemEvents = {};

DoorSystem = function( path )
{
	this.icons = [];
	var door = this;
	this.handler = 'system';
	this.dosdriver = 'System';
	this.ready = false;
	this.Volume = 'System:';
	this.Title = 'System';
	this.Path = 'System:';
	
	// Run superfunction init
	this.init();
	this.setPath( path );
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
			Path: this.getPath(),
			Type: 'unknown'
		};
	}
	else if( typeof( fileInfo ) == 'string' )
	{
		fileInfo = {
			Path: fileInfo,
			Type: 'unknown'
		};
	}
	
	// Fix path
	if( fileInfo.Path.indexOf( ':' ) < 0 )
	{
		fileInfo.Path = this.deviceName + ':' + fileInfo.Path;
	}
	
	// Translations
	var translations = {
		dirPrefs: 'System:' + i18n( 'i18n_directory_Prefs' ) + '/',
		dirModules: 'System:' + i18n( 'i18n_directory_Modules' ) + '/',
		dirDocApps: 'System:' + i18n( 'i18n_directory_DocApps' ) + '/',
		dirLibraries: 'System:' + i18n( 'i18n_directory_Libraries' ) + '/',
		dirDevices: 'System:' + i18n( 'i18n_directory_Devices' ) + '/',
		/*dirDocumentation: 'System:' + i18n( 'i18n_directory_Documentation' ) + '/',*/
		dirRepositories: 'System:' + i18n( 'i18n_directory_Repositories' ) + '/',
		dirFunctions: 'System:' + i18n( 'i18n_directory_Functions' ) + '/'
	};
	
	var dirList = {
		'System:Preferences/': function()
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' ) return;
				var prefs = {}, icons = {}, locales = {};
				if( d == 'User' )
				{
					// Get available preferences applications
					prefs = {
						'Looknfeel'    : i18n( 'i18n_looknfeel' ),
						//'Screens'      : i18n( 'i18n_screens' ),
						/*'Software'     : i18n( 'i18n_software' ),*/
						'Wallpaper'    : i18n( 'i18n_wallpaper' ),
						//'Language'     : i18n( 'i18n_language' ),
						//'Desklets'     : i18n( 'i18n_desklets' ),
						//'Sound'        : i18n( 'i18n_sound' ),
						//'Keyboard'     : i18n( 'i18n_keyboard' ),
						//'Input'        : i18n( 'i18n_input' ),
						//'Datetime'     : i18n( 'i18n_datetime' ),
						'Startup'      : i18n( 'i18n_startup_sequence' ),
						'Mimetypes'    : i18n( 'i18n_mimetypes' ),
						'Dock'         : i18n( 'i18n_docksettings' ),
						'Account'      : i18n( 'i18n_account' )
					};
					locales = {
						'Looknfeel'    : i18n( 'i18n_looknfeel' ),
						'Software'     : i18n( 'i18n_software' ),
						'Wallpaper'    : i18n( 'i18n_wallpaper' ),
						'Startup'      : i18n( 'i18n_startup_sequence' ),
						'Mimetypes'    : i18n( 'i18n_mimetypes' ),
						'Dock'         : i18n( 'i18n_docksettings' ),
						'Account'      : i18n( 'i18n_account' )
					};
					// Setup icons for all these preferences
					icons = {
						'Looknfeel'    : 'apps/preferences-desktop-theme.png',
						//'Screens'      : 'devices/video-display.png',
						'Software'     : 'categories/applications-accessories.png',
						'Wallpaper'    : 'apps/preferences-desktop-wallpaper.png',
						//'Language'     : 'apps/lokalize.png',
						//'Desklets'     : 'apps/telepathy-kde.png',
						//'Sound'        : 'devices/audio-headphones.png',
						//'Keyboard'     : 'devices/input-keyboard.png',
						//'Input'        : 'devices/input-mouse.png',
						//'Datetime'     : 'apps/clock.png',
						'Startup'      : '',
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
						//'Screens'      : i18n( 'i18n_screens' ),
						/*'Software'     : i18n( 'i18n_software' ),*/
						'Wallpaper'    : i18n( 'i18n_wallpaper' ),
						/*'Printers'     : i18n( 'i18n_printers' ),*/
						//'Network'      : i18n( 'i18n_network' ),
						//'Language'     : i18n( 'i18n_language' ),
						'DiskCatalog'    : i18n( 'i18n_disk_catalog' ),
						//'Desklets'     : i18n( 'i18n_desklets' ),
						//'Sound'        : i18n( 'i18n_sound' ),
						//'Keyboard'     : i18n( 'i18n_keyboard' ),
						//'Input'        : i18n( 'i18n_input' ),
						//'Hardware'     : i18n( 'i18n_hardware' ),
						'Users'        : i18n( 'i18n_useraccounts' ),
						//'Datetime'     : i18n( 'i18n_datetime' ),
						'Dock'         : i18n( 'i18n_docksettings' ),
						'Startup'      : i18n( 'i18n_startup_sequence' ),
						'Mimetypes'    : i18n( 'i18n_mimetypes' ),
						'Security'     : i18n( 'i18n_security' ),
						'Account'      : i18n( 'i18n_account' )
					};
					locales = {
						'Looknfeel'    : 'i18n_looknfeel',
						/*'Software'     : 'i18n_software',*/
						'Wallpaper'    : 'i18n_wallpaper',
						'DiskCatalog'  : 'i18n_disk_catalog',
						'Users'        : 'i18n_useraccounts',
						'Dock'         : 'i18n_docksettings',
						'Startup'      : 'i18n_startup_sequence',
						'Mimetypes'    : 'i18n_mimetypes',
						'Security'     : 'i18n_security',
						'Account'      : 'i18n_account'
					};
					// Setup icons for all these preferences
					icons = {
						'Looknfeel'    : 'apps/preferences-desktop-theme.png',
						//'Screens'      : 'devices/video-display.png',
						/*'Software'     : 'categories/applications-accessories.png',*/
						'Wallpaper'    : 'apps/preferences-desktop-wallpaper.png',
						/*'Printers'     : 'devices/printer-laser.png',*/
						//'Network'      : 'places/network-workgroup.png',
						//'Language'     : 'apps/lokalize.png',
						'DiskCatalog'    : 'mimetypes/x-office-address-book.png',
						//'Desklets'     : 'apps/telepathy-kde.png',
						//'Sound'        : 'devices/audio-headphones.png',
						//'Keyboard'     : 'devices/input-keyboard.png',
						//'Input'        : 'devices/input-mouse.png',
						//'Hardware'     : 'devices/audio-card.png',
						'Users'        : 'apps/system-users.png',
						//'Datetime'     : 'apps/clock.png',
						'Dock'         : 'apps/picmi.png',
						'Startup'      : '',
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
						Path: 'System:Settings/' + pref,
						PathLocalized: 'System:Settings/' + i18n( 'i18n_directory_Prefs' ),
						DateModified: dateh,
						Filename: pref,
						Permissions: '-r-e-,-r-e-,-r-e-',
						Filesize: 16,
						IconClass: 'Prefs_' + pref,
						IconFile: '/iconthemes/friendup15/App_' + pref + '.png',
						Position: 'left',
						Type: 'Executable'
					} );
				}
				if( callback ) callback( output, translations.dirPrefs );
			}
			m.execute( 'userlevel' );
			return;
		},
		'System:Modules/': function()
		{
			// Get all modules listed out
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				callback( JSON.parse( data ), translations.dirModules );
			}
			m.execute( 'listmodules' );
			return;
		},
		'System:Libraries/': function()
		{
			var m = new Module( 'system' );
			m.onExecuted = function( r, data )
			{
				callback( JSON.parse( data ), translations.dirLibraries );
			}
			m.execute( 'listlibraries' );
			return;
		},
		'System:Devices/': function()
		{
			var devs = {
				dosdrivers     : i18n( 'i18n_dosdrivers' ),
				cores        : i18n( 'i18n_cores' ),
				sessions       : i18n( 'i18n_sessions' ),
				printers       : i18n( 'i18n_printers' )
			};
			var icons = {
				dosdrivers     : 'places/folder-grey.png',
				cores        : 'places/folder-grey.png',
				sessions       : 'places/folder-grey.png',
				printers       : 'places/folder-print.png'
			};
			var types = [
				'DOSDrivers',
				'Cores',
				'Sessions',
				'Printers'
			];
			
			// Output array
			var output = [];
			var u = 0;

			// Loop through and make icons
			for( var dev in devs )
			{
				var icon = icons[dev];
				output.push( {
					MetaType: 'Directory',
					Title: devs[dev],
					Permissions: '-r-e-,-r-e-,-r-e-',
					DateModified: dateh,
					Filesize: 16,
					Path: 'System:Devices/' + types[u] + '/',
					IconClass: 'Devs_Drawer_' + types[u++],
					Position: 'left',
					Type: 'Directory'
				} );
			}
			if( callback )
				return callback( output, translations.dirDevices );
			return output;
		},
		/*'System:Documentation/': function()
		{
			var files = [ 'Documentation.pdf', 'Programmer\'s Manual.pdf', 'Friend DOS and CLI Manual.pdf', 'FriendUP API Manual.pdf' ]; // not complete yet, 'User\'s guide.pdf' ]; 
//			var files = [ 'Developer\'s manual.pdf', 'DOS manual.pdf' ]; // not complete yet, 'User\'s guide.pdf' ]; 
				//'Workspace', 'FriendScript', 'FriendDOS', 'Dormant', 'Programming', 'VoiceCommand' ];
			var dirs = []; //'Applications', 'Modules', 'Libraries', 'Repositories', 'Devices' ];
			var eles = [];
			for( var a = 0; a < files.length; a++ )
			{
				eles.push( {
					MetaType: 'Meta',
					Filename: files[a],
					Title: files[a],
					Permissions: '-r---,-r---,-r---',
					DateModified: dateh,
					Path: path,
					Position: 'left',
					Module: 'files',
					Command: 'dormant',
					Filesize: 16,
					Type: 'DormantFunction',
					//IconClass: 'System_File_Meta',
					IconClass: 'TypePDF',
					Dormant: WorkspaceDormant
				} );
			}
			for( var a = 0; a < dirs.length; a++ )
			{
				eles.push( {
					MetaType: 'Directory',
					Title: dirs[a],
					Permissions: '-r-e-,-r-e-,-r-e-',
					DateModified: dateh,
					Filesize: 16,
					Position: 'left',
					Type: 'Directory',
					Path: path + dirs[a] + '/',
					Dormant: WorkspaceDormant
				} );
			}
			return callback( eles, translations.dirDocumentation );
		},*/
		'System:Repositories/': function()
		{
			var output = [
				{
					MetaType: 'Directory',
					Title: 'FriendUP',
					Permissions: '-r-e-,-r-e-,-r-e-',
					DateModified: '2017-12-22 12:00:00',
					Filesize: 16,
					Position: 'left',
					Type: 'Directory',
					Path: path + 'FriendUP/',
					Dormant: WorkspaceDormant
				}
			];
			if( callback )
				return callback( output, translations.dirRepositories );
			return output;
		},
		'System:Functions/': function()
		{
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
					Permissions: '-r-e-,-r-e-,-r-e-',
					DateModified: dateh,
					Path: path,
					Position: 'left',
					Module: 'files',
					Command: 'dormant',
					Filesize: 16,
					Type: 'DormantFunction',
					IconClass: 'System_Dormant_Function',
					Dormant: WorkspaceDormant
				} );
			}
			return callback( eles, translations.dirFunctions );
		},
		'System:DocApps/': function()
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, data )
			{
				if( e == 'ok' )
				{
					var files = JSON.parse( data );
					for( var a = 0; a < files.length; a++ )
					{
						files[a].Dormant = WorkspaceDormant;
						files[a].Permissions = '-r-e-,-r-e-,-r-e-';
					}
					callback( files, translations.dirDocApps );
				}
			}
			m.execute( 'listapplicationdocs' );
			return;
		}
	};
	
	// Aliases
	dirList[ 'System:' + i18n( 'i18n_directory_Functions' ) + '/' ]     = dirList[ 'System:Functions/' ];
	dirList[ 'System:' + i18n( 'i18n_directory_DocApps' ) + '/' ]       = dirList[ 'System:DocApps/' ];
	/*dirList[ 'System:' + i18n( 'i18n_directory_Documentation' ) + '/' ] = dirList[ 'System:Documentation/' ];*/
	dirList[ 'System:' + i18n( 'i18n_directory_Prefs' ) + '/' ]         = dirList[ 'System:Preferences/' ];
	dirList[ 'System:' + i18n( 'i18n_directory_Repositories' ) + '/' ]  = dirList[ 'System:Repositories/' ];
	dirList[ 'System:' + i18n( 'i18n_directory_Modules' ) + '/' ]       = dirList[ 'System:Modules/' ];
	dirList[ 'System:' + i18n( 'i18n_directory_Libraries' ) + '/' ]     = dirList[ 'System:Libraries/' ];
	dirList[ 'System:' + i18n( 'i18n_directory_Devices' ) + '/' ]       = dirList[ 'System:Devices/' ];
	
	
	if( !this.getPath() && fileInfo.Path ) this.path = fileInfo.Path;
	var path = fileInfo.Path ? fileInfo.Path : this.getPath();
	
	// Strip a filename after path
	var lastChar = path.substr( path.length - 1, 1 );
	var orphanFilename = null;
	if( lastChar != ':' && lastChar != '/' )
	{
		path += '/';
	}
	
	var dateh = new Date();
	dateh = dateh.getFullYear() + '-' + StrPad( dateh.getMonth()+1, 2, '0' ) + '-' + 
		StrPad( dateh.getDate(), 2, '0' ) + ' ' + StrPad( dateh.getHours(), 2, '0' ) + ':' + StrPad( dateh.getMinutes(), 2, '0' ) + 
		':' + StrPad( dateh.getSeconds(), 2, '0' );
	
	// Case sensitive, then case insensitive
	var found = false;
	var spath = path;
	// Match sensitive
	if( typeof( dirList[ spath ] ) != 'undefined' )
		found = true;
	else
	{
		for( var a in dirList )
		{
			// Match insensitive
			if( spath.toLowerCase() == a.toLowerCase() )
			{
				spath = a;
				break;
			}
		}
		if( typeof( dirList[ spath ] ) != 'undefined' )
		{
			found = true;
		}
	}
	
	// Check if we have a dirlist function
	if( found )
	{
		dirList[ spath ]();
	}
	// Root path
	else if( path.toLowerCase() == 'system:' )
	{
		return callback( [
			{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Prefs' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Preferences/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Prefs' ),
				Type     : 'Directory',
				IconClass: 'System_Settings',
				Door     : new DoorSystem( 'System:Preferences/' )
			},
			{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Repositories' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Repositories/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Repositories' ),
				Type     : 'Directory',
				IconClass: 'System_Repositories',
				Door     : new DoorSystem( 'System:Repositories/' )
			},
			{
				MetaType : 'Directory',
				Command  : 'Modules',
				Title    : i18n( 'i18n_directory_Modules' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Modules/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Modules' ),
				Type     : 'Directory',
				Module   : 'files',
				IconClass: 'System_Modules',
				Door     : new DoorSystem( 'System:Modules/' )
			},
			{
				MetaType : 'Directory',
				Command  : 'Devices',
				Title    : i18n( 'i18n_directory_Devices' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Devices/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Devices' ),
				Type     : 'Directory',
				Module   : 'files',
				IconClass: 'System_Devices',
				Door     : new DoorSystem( 'System:Devices/' )
			},
			{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Libraries' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Libraries/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Libraries' ),
				Type     : 'Directory',
				IconClass: 'System_Libraries',
				Door     : new DoorSystem( 'System:Libraries/' )
			},
			{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Software' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Software/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Software' ),
				Type     : 'Directory',
				IconClass: 'System_Software',
				Door     : new DoorSystem( 'System:Software/' )
			},
			/*{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Documentation' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Documentation/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Documentation' ),
				Type     : 'Directory',
				IconClass: 'System_Documentation',
				Door     : new DoorSystem( 'System:Documentation/' )
			},*/
			{
				MetaType : 'Directory',
				Title    : i18n( 'i18n_directory_Functions' ),
				Permissions: '-r-e-,-r-e-,-r-e-',
				DateModified: dateh,
				Filesize: 16,
				Path     : 'System:Functions/',
				PathLocalized: 'System:' + i18n( 'i18n_directory_Functions' ),
				Type     : 'Directory',
				IconClass: 'System_Functions',
				Door     : new DoorSystem( 'System:Functions/' )
			}
		], 'System:' );
		return;
	}
	// Undefined system path
	else if( path && path.toLowerCase().indexOf( 'system:' ) == 0 )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( r, data )
		{
			if( r == 'ok' ) 
			{
				var list = JSON.parse( data );
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
	return typeof( icons ) != 'undefined' ? icons : this.icons; 
}

DoorSystem.prototype.getDirectory = DoorSystem.prototype.getIcons;

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

// Get an instance on Friend global
Friend.DoorSystem = new DoorSystem( 'System:' );


// Special one
// TODO: We should implement the whole of System: as a dormant door...
// TODO: On the other hand, but having it as a special case, it is more secure
var WorkspaceDormant = {
	title: 'SystemDormant',
	windows: [],
	refresh( winObj )
	{
		//winObj.innerHTML = ':)';
	},
	execute( func, args )
	{
		if( typeof( func ) == 'object' )
		{
			func = func.Filename;
		}
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
				
				if( func.indexOf( '.pdf' ) > 0 )
				{
					var v = new View( {
						title: func.split( '.pdf' )[0],
						width: 600,
						height: 800
					} );
					v.setRichContentUrl( '/webclient/templates/userdocs/' + func );
				}
				else
				{
				
					// Hard code for now
					/*var docs = [ 'FriendDOS', 'FriendScript', 'Dormant', 'Workspace', 'Programming', 'VoiceCommand' ];
					for( var b in docs )
					{
						if( func == docs[b] )
						{
							SystemDocumentViewer( func );
							return true;
						}
					}*/
					// Try..
					SystemDocumentViewer( func, 'system' );
				}
				return false;
		}
	},
	getDoor()
	{
		return {
			MetaType : 'Meta',
			Title    : 'System:', /* remove this from all references*/
			Filename : 'System:',
			IconFile : 'door.png',
			Position : 'left',
			Module   : 'files',
			Command  : 'dormant',
			Filesize : 4096,
			Flags    : '',
			Type     : 'Dormant',
			Path	 : 'System:',
			Dormant  : Friend.DoorSystem
		};
	},
	getDirectory( path, callback )
	{
		return Friend.DoorSystem.getIcons( path, callback );
	},
	getIcons( path, callback )
	{
		return this.getDirectory( path, callback );
	}
}

DormantMaster.addAppDoor( WorkspaceDormant );

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

