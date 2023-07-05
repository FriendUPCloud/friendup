window.Convos = {
	outgoing: []
};

Application.run = function( msg )
{
	this.holdConnection( { method: 'messages', roomType: 'jeanie' } );
}

// Start polling
Application.holdConnection = function( flags )
{
	let args = {};
	
	// Apply flags
	if( flags )
	{
	    for( let a in flags )
	        args[ a ] = flags[ a ];
	}
	
	// Push outgoing messages to args
	if( Convos.outgoing.length )
	{
		args.outgoing = Convos.outgoing;
		
		let system = FUI.getElementByUniqueId( 'messages' );
		if( system && system.clearQueue )
		{
		    system.clearQueue();
		}
		
		Convos.outgoing = [];
	}
	
	console.log( 'Sending to convos: ', args );
	
	let m = new XMLHttpRequest();
	m.open( 'POST', '/system.library/module/?module=system&command=convos&authid=' + Application.authId + '&args=' + JSON.stringify( args ), true );
	m.onload = function( data )
	{		
		console.log( 'Data: ', data, this.response );
		if( this.response )
		{
		    let js = JSON.parse( this.response.split( '<!--separate-->' )[1] );
		    if( js && js.response == 1 )
		    {
		        if( js.messages )
		        {
		            let mess = FUI.getElementByUniqueId( 'messages' );
		            mess.addMessages( js.messages );
		        }
		    }
		}
		// Restart polling
		Application.holdConnection();
	}
	m.send();
}
