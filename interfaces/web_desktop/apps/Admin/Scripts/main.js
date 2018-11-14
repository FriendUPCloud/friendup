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
	refreshSidebar();
	refreshStatistics();
}

// Side bar being refreshed
function refreshSidebar()
{
	Application.mods = {
		'Server': {
			'Status': {
				icon: 'fa-info-circle'
			},
			'Configuration': {
				icon: 'fa-gear'
			},
			'Certificates': {
				icon: 'fa-certificate'
			},
			'Backup': {
				icon: 'fa-cloud-download'
			},
			'Logs': {
				icon: 'fa-list-alt'
			}
		},
		'Services': {
			'Status': {
				icon: 'fa-info-circle'
			}
		},
		'Applications': {
			'Status': {
				icon: 'fa-info-circle'
			}
		},
		'Accounts': {
			'Status': {
				icon: 'fa-info-circle'
			},
			'Users': {
				icon: 'fa-user'
			},
			'Workgroups': {
				icon: 'fa-users'
			},
			'Roles': {
				icon: 'fa-user-secret'
			}
		}
	};
	
	var container = ge( 'GuiSidebar' );
	var eles = container.getElementsByClassName( 'DashboardHeading' );
	var headings = {};
	var mods = Application.mods;
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
		if( !found )
		{
			headings[ a ] = document.createElement( 'div' );
			container.appendChild( headings[ a ] );
			headings[ a ].innerHTML = '<h2>' + a + '</h2>';
			var elements = document.createElement( 'div' );
			elements.className = 'Elements';
			headings[ a ].elements = headings[ a ].appendChild( elements );
		}
		
		// Clear elements
		// TODO: Gracefully!
		headings[ a ].elements.innerHTML = '';
		
		// Populate children
		for( var b in mods[ a ] )
		{
			var ch = mods[ a ][ b ];
			var ptag = document.createElement( 'p' );
			var atag = document.createElement( 'a' );
			atag.innerHTML = b;
			ptag.appendChild( atag );
			if( ch.icon )
			{
				atag.classList.add( 'IconSmall', ch.icon );
				atag.innerHTML = '&nbsp;' + atag.innerHTML;
				( function( module, sect, ele )
				{
					ele.onclick = function()
					{
						setGUISection( module, sect );
					}
				} )( a, b, atag );
			}
			headings[ a ].elements.appendChild( ptag );
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
	
	var f = new File( 'Progdir:Templates/' + module.toLowerCase() + '_' + section.toLowerCase() + '.html' );
	f.onLoad = function( data )
	{
		ge( 'GuiContent' ).innerHTML = data;
	}
	f.load();
}
