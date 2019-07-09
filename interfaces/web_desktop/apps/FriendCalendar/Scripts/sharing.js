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
	// Get share info
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			ge( 'SharingTitle' ).innerHTML = i18n( 'i18n_sharing_nothing' );
			ge( 'SharingMessage' ).innerHTML = '<p>' + i18n( 'i18n_sharing_nothing_desc' ) + '</p>';
			
			var b = document.createElement( 'button' );
			b.className = 'MarginTop IconSmall fa-remove';
			b.onclick = function()
			{
				Application.sendMessage( { command: 'closesharing' } );
			}
			b.innerHTML = ' ' + i18n( 'i18n_close' );
			
			ge( 'SharingMessage' ).appendChild( b );
			
			return;
		}
		var info = null;
		try
		{
			info = JSON.parse( d );
		}
		catch( e )
		{
			Alert( i18n( 'i18n_error_occured' ), i18n( 'i18n_unknown_error_occured' ) );
			Application.sendMessage( { command: 'closesharing' } );
		}
		
		var str = '<hr class="Divider"/>';
		
		for( var a in info )
		{
			var fin = info[ a ];
			str += '<p class="Layout"><strong>' + i18n( 'i18n_calendar' ) + ': ' + a + '</strong></p>';
			if( fin.workgroups )
			{
				str += '<p class="Layout"><strong>' + i18n( 'i18n_workgroups' ) + ':</strong></p>';
				str += '<div class="List MarginBottom">';
				var sw = 0;
				for( var b in fin.workgroups )
				{
					sw = sw == 1 ? 2 : 1;
					str += '<div class="HRow sw' + sw + ' PaddingSmall">' + fin.workgroups[b].Name + '</div>';
				}
				str += '</div>';
			}
			if( fin.users )
			{
				str += '<p class="Layout"><strong>' + i18n( 'i18n_users' ) + ':</strong></p>';
				str += '<div class="List">';
				var sw = 0;
				for( var b in fin.workgroups )
				{
					sw = sw == 1 ? 2 : 1;
					str += '<div class="HRow sw' + sw + ' PaddingSmall">' + fin.users[b].Fullname + '</div>';
				}
				str += '</div>';
			}
		}
		
		ge( 'SharingTitle' ).innerHTML = i18n( 'i18n_overview_over_sharing' );
		ge( 'SharingMessage' ).innerHTML = str;
	}
	m.execute( 'calendarshareinfo' );
}
