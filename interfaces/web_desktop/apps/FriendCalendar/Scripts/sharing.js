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
	}
	m.execute( 'calendarshareinfo' );
}
