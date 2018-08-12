var hosting = false;
var hostingname = false;

Application.run = function( msg )
{
}

function toggleHosting()
{
	if( !hosting )
	{
		if( !ge( 'Hostname' ).value )
		{
			Ge( 'Hostname' ).focus();
			return Alert( i18n( 'i18n_no_hosting' ), i18n( 'i18n_set_host_please' ) );
		}	
		
		Ge( 'ToggleButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_stop_hosting' );
		hosting = true;
		hostingname = Ge( 'Hostname' ).value;
		
		// Start hosting, with handlerfunction
		FriendNetwork.host( hostingname, function( msg )
		{
			console.log( 'Got this from remote:', msg );
			
			if( msg.hostid )
			{
				FriendNetwork.send( msg.hostid, { data: '<html><body><h1>Welcome!</h1></body></html>' } );
			}
			else
			{
				console.log( 'Could not handle response.' );
			}
		} );
		
	}
	else
	{
		Ge( 'ToggleButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_start_hosting' );
		hosting = false;
		FriendNetwork.dispose( hostingname );
	}
}

function connect()
{
	FriendNetwork.list( hostsBack );
	function hostsBack( data ) {
		console.log( 'FriendHost - hostsBack', data );
	}
}
