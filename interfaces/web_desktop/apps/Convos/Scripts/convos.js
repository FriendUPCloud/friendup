window.Convos = {
	outgoing: []
};

Application.run = function( msg )
{
	this.holdConnection();
}

// Start polling
Application.holdConnection = function()
{
	let args = {};
	
	// Push outgoing messages to args
	if( Convos.outgoing.length )
	{
		args.outgoing = Convos.outgoing;
		Convos.outgoing = [];
	}
	
	let m = new XMLHttpRequest();
	m.open( 'POST', '/system.library/module/?module=system&command=convos&authid=' + Application.authId + '&args=' + JSON.stringify( args ), true );
	m.onload = function( data )
	{		
		console.log( 'Data: ', data, this.response );
		if( this.response )
		{
			
		}
		// Restart polling
		Application.holdConnection();
	}
	m.send();
}
