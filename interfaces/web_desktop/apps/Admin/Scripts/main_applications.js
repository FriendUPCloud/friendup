/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
	...
*/

Sections.applications_applications = function( cmd, extra )
{
	if( !extra ) extra = false;
	if( typeof( Applications[ cmd ] ) != 'undefined' )
	{
		Applications[ cmd ]( extra );
	}
	else
	{
		Applications.default( extra );
	}
}

// Hashmap
Applications = {
	// Just list stuff
	default: function( extra )
	{
		var filter = extra ? ( extra.filter ? extra.filter : false ) : false;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				try
				{
					var js = JSON.parse( d );
					var str = '\
					<div class="HRow">\
						<div class="HContent50 FloatLeft">\
							<h2>' + i18n( 'i18n_applications' ) + '</h2>\
						</div>\
						<div class="HContent50 FloatLeft">\
							<input type="text" class="FullWidth" placeholder="' + i18n( 'i18n_find_applications' ) + '"/>\
						</div>\
					</div>\
					';
				
					str += '<div class="List">';
					
					// Generate columns
					str += '<div class="HRow">';
					var cols = [ 'name', 'visible', 'date' ];
					var size = [ 50, 15, 35 ]
					for( var a = 0; a < cols.length; a++ )
					{
						str += '<div class="PaddingSmall HContent' + size[ a ] + ' FloatLeft Ellipsis">' + i18n( 'i18n_col_' + cols[a] ) + '</div>';
					}
					str += '</div>';
					
					str += '</div>';
					str += '<div class="List">';
					
					var ino  = i18n( 'i18n_no' );
					var iyes = i18n( 'i18n_yes' );
					
					// Generate rows
					var sw = 2;
					for( var a = 0; a < js.length; a++ )
					{
						sw = sw == 1 ? 2 : 1;
						str += '\
							<div class="HRow sw' + sw + ' Application" appName="' + js[ a ].Name + '">\
								<div class="PaddingSmall HContent50 FloatLeft Ellipsis">\
									' + js[ a ].Name + '\
								</div>\
								<div class="PaddingSmall HContent15 FloatLeft Ellipsis">\
									' + ( js[ a ].Visible ? iyes : ino ) + '\
								</div>\
								<div class="PaddingSmall HContent35 FloatLeft Ellipsis">\
									' + js[ a ].DateModified + '\
								</div>\
							</div>\
						';
					}
					ge( 'ApplicationList' ).innerHTML = str + '</div>';
					
					var apps = ge( 'ApplicationList' ).getElementsByClassName( 'Application' );
					for( var a = 0; a < apps.length; a++ )
					{
						( function( app ) {
							var nam = app.getAttribute( 'appName' );
							app.onclick = function()
							{
								Applications.showApp( { name: nam } );
							}
						} )( apps[ a ] );
					}
				}
				catch( e )
				{
				}
			}
			else
			{
			}
		}
		m.execute( 'software', { mode: 'global_permissions' } );
	},
	showApp: function( extra )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var f = new File( 'Progdir:Templates/applications_details.html' );
			f.replacements = {
				application_name: extra.name
			};
			f.i18n();
			f.onLoad = function( data )
			{
				ge( 'ApplicationDetails' ).innerHTML = data;
			}
			f.load();
		}
		m.execute( 'applicationdetails', { mode: 'data', application: extra.name } );
	}
};

// Alias
Applications.list = Applications.filter;

