Application.run = function( msg )
{
	//maybe do other stuff here.... and then:
	Application.showWelcome();
	console.log( msg );
};

Application.showWelcome = function()
{
	v = new View( {
		'title': i18n('i18n_welcome_title'),
		'width': 1025,
		'height':  767,
		'mobileMaximised': true
	} );
	
	v.setMenuItems( [
		{
			name: 'Navigation',
			items: [
				{
					name: 'Welcome',
					command: 'set_welcome'
				},
				{
					name: 'Business',
					command: 'set_business'
				},
				{
					name: 'Entertainment',
					command: 'set_entertainment'
				},
				{
					name: '10 things to do',
					command: 'set_ten'
				}
			]
		}
	] );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = v;	
	
	var s = new Module( 'system' );
	s.onExecuted = function( e, d )
	{
		var never = ' style="display: none"';
		
		if( e == 'ok' )
		{
			try
			{
				var list = JSON.parse( d );
				for( var a = 0; a < list.startupsequence.length; a++ )
				{
					if( list.startupsequence[a] == 'launch Welcome' )
						never = '';
				}
			}
			catch( e )
			{
			}
		}
		
		var f = new File( 'Progdir:Templates/welcome.html' );
		f.replacements = {
			'username': 'USERNAME',
			'nevershowed': never,
			'nevershowagain' : i18n( 'i18n_nevershowagain' ),
			'authid' : Application.authId
		};
		f.i18n();
	
		f.onLoad = function( data )
		{
			// Setting new content..
			v.setContent( data, function() {
				v.setContent( data );
			} );
		}
		// Get going...
		f.load();
	}
	s.execute( 'getsetting', { setting: 'startupsequence' } );	
}

Application.receiveMessage = function( msg )
{
	if( msg.command && msg.command.substr( 0, 4 ) == 'set_' )
	{
		this.mainView.sendMessage( msg );
	}
}


