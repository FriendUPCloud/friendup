/*©agpl*************************************************************************
*                                                                              *
* Friend Unifying Platform                                                     *
* ------------------------                                                     *
*                                                                              *
* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
* Tel.: (+47) 40 72 96 56                                                      *
* Mail: info@friendos.com                                                      *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg )
{
	// Get connected users
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var usl = null;
			try
			{
				usl = JSON.parse( d );
			}
			catch( e ){};
			if( usl.length )
			{
				ge( 'Users' ).innerHTML = '';
				for( var a = 0; a < usl.length; a++ )
				{
					var r = document.createElement( 'div' );
					r.className = 'HRow';
					r.innerHTML = '<div class="HContent40 FloatLeft Ellipsis BorderRight BorderBottom">' + usl[ a ].Fullname + '</div><div class="HContent60 FloatLeft Ellipsis BorderBottom">' + usl[ a ].Name + ( usl[ a ].Email ? ( ', ' + usl[ a ].Email ) : '' ) + '</div>';
					ge( 'Users' ).appendChild( r );
				}
				return;
			}
		}
		// No connected users
		ge( 'Users' ).innerHTML = '<p class="Layout">' + i18n( 'i18n_no_users_connected' ) + '</p>';
	}
	m.execute( 'listconnectedusers' );
	
	// Get connected workgroups
	var g = new Module( 'system' );
	g.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var wl = null;
			try
			{
				wl = JSON.parse( d );
			}
			catch( e ){};
			if( wl.length )
			{
				ge( 'Workgroups' ).innerHTML = '';
				for( var a = 0; a < wl.length; a++ )
				{
					var r = document.createElement( 'div' );
					r.className = 'HRow';
					r.innerHTML = '<div class="HContent100 FloatLeft Ellipsis BorderBottom">' + wl[ a ].Name + '</div>';
					ge( 'Workgroups' ).appendChild( r );
				}
				return;
			}
		}
		// No connected workgroups
		ge( 'Workgroups' ).innerHTML = '<p class="Layout">' + i18n( 'i18n_no_workgroups' ) + '</p>';
	}
	g.execute( 'workgroups' );
}

