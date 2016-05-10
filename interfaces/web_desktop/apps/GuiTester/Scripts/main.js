Application.run = function( msg, iface )
{
	this.mode = 'windowed';
	
	this.v = new View( {
		title: 'GUI Tester Suite',
		width: 600,
		height: 480
	} );
	
	this.v.setMenuItems ( [
		{
			name: 'Actions',
			items: [
				{
					name: 'Set mode screen',
					command: 'setmodescreen'
				},
				{
					name: 'Set mode view',
					command: 'setmodeview'
				}
			]
		}
	] );
	
	this.v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/gui.html' );
	f.onLoad = function( data )
	{
		Application.v.setContent( data );
	}
	f.load();
	
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	if( msg.command == 'setmodescreen' )
	{
		this.v.sendMessage( { command: 'setmodescreen' } );
	}
	if( msg.command == 'setmodeview' )
	{
		this.v.sendMessage( { command: 'setmodeview' } );
	}
}


