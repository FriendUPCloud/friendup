Application.run = function( msg )
{
	var v = new View( {
		title: 'Friend Developers',
		width: 1000,
		height: 700
	} );
	
	var f = new File( 'Progdir:Templates/developers.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	this.mainView = v;
}

