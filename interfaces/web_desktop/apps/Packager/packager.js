Application.run = function( msg, iface )
{
	var v = new View( {
		title: 'Packager',
		width: 500,
		height: 500
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
}


