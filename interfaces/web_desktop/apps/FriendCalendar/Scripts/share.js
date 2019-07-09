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
				var sw = 0;
				for( var a = 0; a < usl.length; a++ )
				{
					sw = sw == 1 ? 2 : 1;
					var r = document.createElement( 'div' );
					r.className = 'HRow rowUser PaddingSmall sw' + sw;
					r.setAttribute( 'id', usl[ a ].ID );
					r.setAttribute( 'name', usl[ a ].Fullname );
					r.innerHTML = '<div class="HContent40 FloatLeft Ellipsis">' + usl[ a ].Fullname + '</div><div class="HContent60 FloatLeft Ellipsis">' + usl[ a ].Name + ( usl[ a ].Email ? ( ', ' + usl[ a ].Email ) : '' ) + '</div>';
					r.onclick = function()
					{
						if( this.classList.contains( 'Selected' ) )
						{
							this.classList.remove( 'Selected' );
						}
						else
						{
							this.classList.add( 'Selected' );
						}
					}
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
				var sw = 0;
				for( var a = 0; a < wl.length; a++ )
				{
					sw = sw == 1 ? 2 : 1;
					var r = document.createElement( 'div' );
					r.className = 'HRow rowWorkgroup PaddingSmall sw' + sw;
					r.setAttribute( 'id', wl[ a ].ID );
					r.setAttribute( 'name', wl[ a ].Name );
					r.innerHTML = '<div class="HContent100 FloatLeft Ellipsis">' + wl[ a ].Name + '</div>';
					r.onclick = function()
					{
						if( this.classList.contains( 'Selected' ) )
						{
							this.classList.remove( 'Selected' );
						}
						else
						{
							this.classList.add( 'Selected' );
						}
					}
					ge( 'Workgroups' ).appendChild( r );
				}
				return;
			}
		}
		// No connected workgroups
		ge( 'Workgroups' ).innerHTML = '<p class="Layout">' + i18n( 'i18n_no_workgroups' ) + '</p>';
	}
	g.execute( 'workgroups', { connected: true } );
	
	ge( 'CancelButton' ).onclick = function()
	{
		ge( 'top' ).classList.remove( 'Hide' );
		ge( 'ShareDone' ).classList.remove( 'Show' );
	}
}

// Verify that user wants to share calendar with these users
function confirmShare()
{
	// Check that we actually selected somethign
	var eles = ge( 'top' ).getElementsByClassName( 'Selected' );
	if( eles.length )
	{
		ge( 'top' ).classList.add( 'Hide' );
		
		ge( 'ShareHeading' ).innerHTML = i18n( 'i18n_confirm_sharing' );
		
		var sw = 0;
		
		var out = '<div class="List">';
		for( var a = 0; a < eles.length; a++ )
		{
			sw = sw == 1 ? 2 : 1;
			var name = eles[a].classList.contains( 'rowUser' ) ? i18n( 'i18n_user' ) : i18n( 'i18n_workgroup' );
			out += '<div class="HRow sw' + sw + ' PaddingSmall">' + name + ': ' + eles[a].getAttribute( 'name' ) + '</div>';
		}
		out += '</div>';
		
		ge( 'ShareMessage' ).innerHTML = out;
		
		
		ge( 'ShareDone' ).classList.add( 'Show' );
	}
	else
	{
		Alert( i18n( 'i18n_please_select' ), i18n( 'i18n_please_select_desc' ) );
	}
}

// Ok, now we are ready to go
function FinalShare()
{
	var eles = ge( 'top' ).getElementsByClassName( 'Selected' );
	if( eles.length )
	{
		var wids = [];
		var uids = [];
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList.contains( 'rowWorkgroup' ) )
				wids.push( eles[a].getAttribute( 'id' ) );
			else if( eles[a].classList.contains( 'rowUser' ) )
				uids.push( eles[a].getAttribute( 'id' ) );
		}
		if( wids.length > 0 || uids.length > 0 )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e != 'ok' )
				{
					Alert( i18n( 'i18n_error_occured' ), i18n( 'i18n_could_not_share' ) );
					return false;
				}
				Alert( i18n( 'i18n_calendar_shared' ), i18n( 'i18n_calendar_shared_desc' ) );
				Application.sendMessage( {
					command: 'closesharing',
					destinationViewId: ge( 'parentId' ).value
				} );
			}
			m.execute( 'calendarshare', { uids: uids, wids: wids } );
		}
		else
		{
			confirmShare();
		}
	}
}

