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
	var self = this;
	
	ge( 'SaveBtn' ).onclick = function( e )
	{
		let result = {
			id: ge( 'pID' ).value,
			timeFrom: ge( 'pTimeFrom' ).value.substr( 0, 5 ),
			timeTo: ge( 'pTimeTo' ).value.substr( 0, 5 ),
			date: ge( 'pDate' ).value,
			allDay: ge( 'pAllDay' ).checked ? true : false,
			allWeek: ge( 'pAllWeek' ).checked ? true : false,
			time: ge( 'pTime' ).checked ? true : false,
			title: ge( 'pName' ).value,
			leadin: ge( 'pDescription' ).value,
			dateTo: ( new Date( ge( 'pDateTo' ).value ) ).getTime() > ( new Date( ge( 'pDate' ).value ) ).getTime() ? ge( 'pDateTo' ).value : ''
		};
		
		self.sendMessage( {
			command: 'saveevent',
			eventData: result,
			targetViewId: ge( 'parentView' ).value
		} );
	}
	
	// Editing
	if( parseInt( ge( 'pID' ).value ) > 0 )
	{
		var pview = ge( 'parentView' ).value;
		var b = document.createElement( 'button' );
		b.className = 'Button IconSmall fa-trash';
		b.innerHTML = ' ' + i18n( 'i18n_delete_event' );
		b.onclick = function()
		{
			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_delete_confirm_desc' ), function( result )
			{
				if( result.data )
				{
					var m = new Module( 'system' );
					m.onExecuted = function()
					{
						self.sendMessage( {
							command: 'refresh',
							targetViewId: pview
						} );
					}
					m.execute( 'deletecalendarevent', { id: ge( 'pID' ).value } );
				}
			} );
		}
		ge( 'bottom' ).appendChild( b );
	}
	
	ge( 'pName' ).focus();
}
