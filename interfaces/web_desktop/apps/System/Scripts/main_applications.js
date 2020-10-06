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
		var h = new Module( 'system' );
		h.onExecuted = function( ec, dt )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					try
					{
						var mt = false;
						if( ec == 'ok' )
							mt = JSON.parse( dt );
						var js = JSON.parse( d );
					}
					catch( e )
					{
					}
					
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
					var cols = [ 'name', 'featured', 'visible', 'date' ];
					var size = [ 35, 15, 15, 35 ]
					for( var a = 0; a < cols.length; a++ )
					{
						str += '<div class="PaddingSmall HContent' + size[ a ] + ' FloatLeft Ellipsis">' + i18n( 'i18n_col_' + cols[ a ] ) + '</div>';
					}
					str += '</div>';
				
					str += '</div>';
					str += '<div class="List">';
				
					var ino  = i18n( 'i18n_no' );
					var iyes = i18n( 'i18n_yes' );
				
					// Organize by name
					var final = {};
					for( var b = 0; b < js.length; b++ )
					{
						final[ js[ b ].Name ] = js[ b ];
					}
					for( var b = 0; b < mt.length; b++ )
					{
						var n = mt[ b ].Key.split( '_' )[1];
						if( !final[ n ].MetaData )
							final[ n ].MetaData = {};
						final[ n ].MetaData[ mt[ b ].ValueString ] = mt[ b ].ValueNumber;
					}
					delete js; delete mt;
				
					// Generate rows
					var sw = 2;					
					
					for( var a in final )
					{	
						sw = sw == 1 ? 2 : 1;
						str += '\
							<div class="HRow sw' + sw + ' Application" appName="' + final[ a ].Name + '">\
								<div class="PaddingSmall HContent35 FloatLeft Ellipsis">\
									' + final[ a ].Name + '\
								</div>\
								<div class="PaddingSmall HContent15 FloatLeft Ellipsis">\
									' + ( ( final[ a ].MetaData && final[ a ].MetaData.Featured ) ? iyes : ino ) + '\
								</div>\
								<div class="PaddingSmall HContent15 FloatLeft Ellipsis">\
									' + ( ( final[ a ].MetaData && final[ a ].MetaData.Visible ) ? iyes : ino ) + '\
								</div>\
								<div class="PaddingSmall HContent35 FloatLeft Ellipsis">\
									' + final[ a ].DateModified + '\
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
				else
				{
				}
			}
			m.execute( 'software', { mode: 'global_permissions', authid: Application.authId } );
		}
		h.execute( 'getmetadata', { search: 'application_', valueStrings: [ 'Visible', 'Featured' ], authid: Application.authId } );
	},
	showApp: function( extra )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var h = new Module( 'system' );
			h.onExecuted = function( cod, dat )
			{
				var js = false;
				var ds = false;
				
				try
				{
					js = JSON.parse( d );
					ds = JSON.parse( dat );
				}
				catch( e )
				{
					return;
				}
				
				var extraData = null;
				
				var visible = false;
				var featured = false;
				
				// Go through metadata
				for( var z = 0; z < ds.length; z++ )
				{
					if( ds[ z ].Key.split( '_' )[1] == extra.name )
					{
						if( ds[ z ].ValueString == 'Visible' )
						{
							visible = parseInt( ds[ z ].ValueNumber ) == 1 ? true : false;
						}
						if( ds[ z ].ValueString == 'Featured' )
						{
							featured = parseInt( ds[ z ].ValueNumber ) == 1 ? true : false;
						}
					}
				}
			
				var check = '<div class="AppToggleBtn IconSmall FloatRight fa-toggle-!" type="---">&nbsp;</div>';
			
				var vis = visible  ? 'on' : 'off'; vis = check.replace( '!', vis ).replace( '---', 'BVisible' );
				var fea = featured ? 'on' : 'off'; fea = check.replace( '!', fea ).replace( '---', 'BFeature' );;
			
				var f = new File( 'Progdir:Templates/applications_details.html' );
				f.replacements = {
					application_name: extra.name,
					application_visible: vis,
					application_featured: fea
				};
				f.i18n();
				f.onLoad = function( data )
				{
					ge( 'ApplicationDetails' ).innerHTML = data;
					
					var btns = ge( 'ApplicationDetails' ).getElementsByClassName( 'AppToggleBtn' );
					var visb = feab = null;
					for( var a = 0; a < btns.length; a++ )
					{
						if( btns[ a ].getAttribute( 'type' ) == 'BVisible' )
							visb = btns[ a ];
						else if( btns[ a ].getAttribute( 'type' ) == 'BFeature' )
							feab = btns[ a ];
					}
					function toggleB( el, strval )
					{
						el.onclick = function( e )
						{
							var on = false;
							if( this.classList.contains( 'fa-toggle-on' ) )
							{
								this.classList.remove( 'fa-toggle-on' );
								this.classList.add( 'fa-toggle-off' );
							}
							else
							{
								on = true;
								this.classList.remove( 'fa-toggle-off' );
								this.classList.add( 'fa-toggle-on' );
							}
							
							var n = new Module( 'system' );
							n.onExecuted = function( e, d )
							{
							}
							n.execute( 'setmetadata', {
								key: 'application_' + extra.name,
								valueString: strval, 
								valueNumber: on ? '1' : '2', 
								authid: Application.authId
							} );
						}
					}
					toggleB( visb, 'Visible' );
					toggleB( feab, 'Featured' );
				}
				f.load();
			}
			h.execute( 'getmetadata', { search: 'application_', valueStrings: [ 'Visible', 'Featured' ], authid: Application.authId } );
		}
		m.execute( 'applicationdetails', { mode: 'data', application: extra.name, authid: Application.authId } );
	}
};

// Alias
Applications.list = Applications.filter;

