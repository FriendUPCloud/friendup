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

Sections.applications_status = function( cmd, extra )
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
					var str = '<div class="List">';
					
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
							<div class="HRow sw' + sw + '">\
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
	}
};

// Alias
Applications.list = Applications.filter;

