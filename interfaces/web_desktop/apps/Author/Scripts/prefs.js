
Application.run = function( msg, iface )
{
}


function doCancel()
{
	Application.sendMessage( {
		command: 'closeprefs'
	} );
}

