Application.run = function( msg )
{
	var v = new View( {
		title: 'Friend Project',
		width: 900,
		height: 600
	} );
	
	var f = new File( 'Progdir:Templates/projectmain.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	v.setMenuItems( [
		{
			name: 'File',
			items: [
				{
					name: 'Refresh',
					command: 'refresh'
				},
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		}
	] );
	
	this.mainView = v;
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'refresh':
			this.mainView.sendMessage( {
				command: 'refreshprojects'
			} );
			break;
	}
}
