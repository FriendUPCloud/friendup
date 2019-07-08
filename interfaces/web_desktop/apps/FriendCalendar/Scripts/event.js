Application.run = function( msg )
{
	var self = this;
	
	ge( 'SaveBtn' ).onclick = function( e )
	{
		var result = {
			id: ge( 'pID' ).value,
			timeFrom: ge( 'pTimeFrom' ).value.substr( 0, 5 ),
			timeTo: ge( 'pTimeTo' ).value.substr( 0, 5 ),
			date: ge( 'pDate' ).value,
			allDay: ge( 'pAllDay' ).checked ? true : false,
			title: ge( 'pName' ).value,
			leadin: ge( 'pDescription' ).value
		};
		self.sendMessage( {
			command: 'saveevent',
			eventData: result,
			targetViewId: ge( 'parentView' ).value
		} );
	}
	
	ge( 'pName' ).focus();
}
