/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Start!
Application.run = function( msg ){ initGui(); }

// Just initialize the GUI!
function initGui()
{
	// Let's get some charts!
	Include( '/webclient/3rdparty/Chart.bundle.min.js', function()
	{
		// And then start!
		refreshSidebar();
		refreshStatistics();
		
		// Init responsive layout
		Friend.responsive.init();
	} );
}

// Side bar being refreshed
function refreshSidebar()
{
	var isAdmin = Application.getUserLevel() == 'admin' ? true : false;

	Application.mods = {
		'Server': {
			'Status': {
				icon: 'fa-info-circle',
				showing: isAdmin
			},
			'Configuration': {
				icon: 'fa-gear',
				showing: isAdmin
			},
			'Certificates': {
				icon: 'fa-certificate',
				showing: isAdmin
			},
			'Printers': {
				icon: 'fa-print',
				showing: isAdmin
			},
			'Backup': {
				icon: 'fa-cloud-download',
				showing: isAdmin
			},
			'Logs': {
				icon: 'fa-list-alt',
				showing: isAdmin
			}
		},
		'Services': {
			'Status': {
				icon: 'fa-info-circle',
				showing: isAdmin
			}
		},
		'Applications': {
			'Applications': {
				icon: 'fa-info-circle',
				showing: isAdmin
			}
		},
		'Accounts': {
			'Status': {
				icon: 'fa-info-circle',
				condition: isAdmin
			},
			'Users': {
				icon: 'fa-user',
				showing: isAdmin,
				permissions: [ 'PERM_USER_GLOBAL', 'PERM_USER_WORKGROUP' ]
			},
			'Workgroups': {
				icon: 'fa-users',
				showing: isAdmin
			},
			'Roles': {
				icon: 'fa-user-secret',
				showing: isAdmin
			}
		}
	};
	
	var container = ge( 'GuiSidebar' );
	var eles = container.getElementsByClassName( 'DashboardHeading' );
	var headings = {};
	var mods = Application.mods;
	
	// Go through all modules
	for( var a in mods )
	{
		var found = false;
		for( var b = 0; b < eles.length; b++ )
		{
			if( eles[b].id == 'Heading_' + a )
			{
				headings[ a ] = eles[b];
				found = true;
				break;
			}
		}
		
		// Create header
		if( !found )
		{
			headings[ a ] = document.createElement( 'div' );
			headings[ a ].innerHTML = '<h2>' + a + '</h2>';
			var elements = document.createElement( 'div' );
			elements.className = 'Elements';
			headings[ a ].elements = headings[ a ].appendChild( elements );
		}
		
		// Clear elements
		headings[ a ].elements.innerHTML = '';
		
		var heading_children = 0;
		
		// Populate children
		for( var b in mods[ a ] )
		{
			var ch = mods[ a ][ b ];
			var ptag = document.createElement( 'p' );
			var atag = document.createElement( 'a' );
			atag.innerHTML = b;
			ptag.appendChild( atag );
			
			// If we have no showing check permissions
			if( !ch.showing )
			{
				if( ch.permissions )
				{
					var access = false;
				
					for( var i in ch.permissions )
					{
						if( ch.permissions[i] && Application.checkAppPermission( ch.permissions[i] ) )
						{
							access = true;
						}
					}
				
					if( !access ) continue;
				}
				else continue;
			}
			if( ch.icon )
			{
				atag.classList.add( 'IconSmall', ch.icon );
				atag.innerHTML = '&nbsp;' + atag.innerHTML;
				( function( module, sect, ele )
				{
					ele.onclick = function()
					{
						// Update latest changes to permissions before showing page ...
						Application.checkAppPermission( false, function()
						{
							setGUISection( module, sect );
						} );
					}
				} )( a, b, atag );
			}
			headings[ a ].elements.appendChild( ptag );
			heading_children++;
		}
		
		// Add header with contents
		if( !found && heading_children > 0 )
		{
			container.appendChild( headings[ a ] );
		}
	}
}

// Refreshing general statistics
function refreshStatistics()
{
}

// Sets the gui for a section in the app
function setGUISection( module, section )
{
	var found = false;
	if( typeof( Application.mods[ module ] ) != 'undefined' )
	{
		for( var a in Application.mods[ module ] )
		{
			if( a == section )
			{
				found = true;
			}
		}
	}
	if( !found ) return;
	
	var sectPart = module.toLowerCase() + '_' + section.toLowerCase();
	var f = new File( 'Progdir:Templates/' + sectPart + '.html' );
	f.onLoad = function( data )
	{
		ge( 'GuiContent' ).innerHTML = data;
		Sections[ sectPart ]();
		
		// Reinitialize!
		Friend.responsive.pageActive = ge( 'GuiContent' ).getElementsByClassName( 'Responsive-Page' )[0];
		Friend.responsive.reinit();
	}
	f.load();
}

var Sections = {
	// Let's do the server configuration, eh?
	server_configuration()
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				ge( 'ServerConfiguration' ).innerHTML = '<h2>Failed to load config</h2>';
				return;
			}
			var cfg = null;
			try
			{
				cfg = JSON.parse( d );
			}
			catch( e )
			{
				ge( 'ServerConfiguration' ).innerHTML = '<h2>Failed to parse config</h2>';
				return;
			}
			var str = '';
			
			for( var a in cfg )
			{
				str += FieldToInput( a, cfg[a] );
			}
			
			ge( 'ServerConfiguration' ).innerHTML = str;
		}
		m.execute( 'getconfiginijson' );
	},
	system_permissions()
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				try
				{
					d = JSON.parse( d );
				}
				catch( e ) 
				{
					
				}
			}
			
			console.log( 'system_permissions() ', { e:e, d:d } );
		}
		m.execute( 'getsystempermissions' );
	},
	user_edit( id )
	{
	}
}



function Toggle( _this, callback, on )
{
	if( _this.className.indexOf( 'fa-toggle-off' ) >= 0 )
	{
		_this.className = _this.className.split( ' fa-toggle-off' ).join( '' ) + ' fa-toggle-on';
		
		if( callback ) callback( true );
	}
	else if( _this.className.indexOf( 'fa-toggle-on' ) >= 0 )
	{
		_this.className = _this.className.split( ' fa-toggle-on' ).join( '' ) + ' fa-toggle-off';
		
		if( callback ) callback( false );
	}
	
	// If nothing is set, set default based on ( on | off ) preset
	
	if( _this.className.indexOf( 'fa-toggle-on' ) < 0 && _this.className.indexOf( 'fa-toggle-off' ) < 0 )
	{
		_this.className = _this.className.split( ' fa-toggle-on' ).join( '' ).split( ' fa-toggle-off' ).join( '' ) + ( on ? ' fa-toggle-on' : ' fa-toggle-off' );
	}
}

function Expand( _this, level, on )
{
	var pnt = _this.parentNode;
	
	if( level && level > 1 )
	{
		pnt = _this;
		
		for( var i = 0; i < level; i++ )
		{
			if( pnt.parentNode )
			{
				pnt = pnt.parentNode;
			}
		}
	}
	
	if( _this.className.indexOf( 'fa-chevron-right' ) >= 0 )
	{
		_this.className = _this.className.split( ' fa-chevron-right' ).join( '' ) + ' fa-chevron-down';
		
		pnt.className = pnt.className.split( ' collapse' ).join( '' );
	}
	else if( _this.className.indexOf( 'fa-chevron-down' ) >= 0 )
	{
		_this.className = _this.className.split( ' fa-chevron-down' ).join( '' ) + ' fa-chevron-right';
		
		pnt.className = pnt.className.split( ' collapse' ).join( '' ) + ' collapse';
	}
	
	// If nothing is set, set default based on ( on | off ) preset
	
	if( _this.className.indexOf( 'fa-chevron-right' ) < 0 && _this.className.indexOf( 'fa-chevron-down' ) < 0 )
	{
		_this.className = _this.className.split( ' fa-chevron-right' ).join( '' ).split( ' fa-chevron-down' ).join( '' ) + ( on ? ' fa-chevron-down' : ' fa-chevron-right' );
		
		pnt.className = pnt.className.split( ' collapse' ).join( '' ) + ( on ? '' : ' collapse' );
	}
}



function FieldToInput( key, data )
{
	var lkey = '';
	var lupper = true;
	for( var a = 0; a < key.length; a++ )
	{
		if( key[a] == '_' || key[a] == '-' )
		{
			lkey += ' ';
			lupper = true;
			continue;
		}
		if( lupper )
		{
			lkey += key[a].toUpperCase();
			lupper = false;
		}
		else
		{
			lkey += key[a];
		}
	}

	var str = '<div class="HRow">';
	str += '<div class="HContent20 FloatLeft Ellipsis Padding">' + lkey + ':</div>';
	str += '<div class="HContent80 FloatLeft Ellipsis Padding">';
	if( parseFloat( data ) )
	{
		str += '<input type="number" class="FullWidth" value="' + data + '"/>';
	}
	else if( data.substr )
	{
		if( data.length > 64 )
		{
			str += '<textarea class="FullWidth">' + data + '</textarea>';
		}
		else
		{
			str += '<input class="FullWidth" type="text" value="' + data + '"/>';
		}
	}
	str += '</div>';
	str += '</div>';
	return str;
}

function FormatBytes( bytes, decimals = 2, units = 1 ) 
{
    if ( bytes === 0 ) return 0 + ( units ? 'B' : '' );
	
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
	
    const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	
    return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ( units ? ( sizes[i] ) : '' );
}

