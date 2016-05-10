Application.run = function( msg, iface )
{
	// Screen
	this.screen = false;
	this.menuItems = [
		{
			name: 'File',
			items: [
				{
					name: 'Close',
					command: 'close'
				}
			]
		},
		{
			name: 'Help',
			items: [
				{
					name: 'Documentation',
					command: 'documentation'
				}
			]
		}
	];
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'setmodescreen':
			// Already has screen mode
			if( this.screen ) return;
			if( this.view )
			{
				this.view.close();
				this.view = false;
			}
			this.screen = new Screen( {
				title: 'My screen'
			} );
			this.screen.setMenuItems( this.menuItems );
			break;
		case 'setmodeview':
			// Already has view mode
			if( this.view ) return;
			if( this.screen )
			{
				this.screen.close();
				this.screen = false;
			}
			this.view = new View( {
				title: 'My screen',
				width: 500,
				height: 450
			} );
			this.view.setMenuItems( this.menuItems );
	}
}

