Application.run = function( msg )
{
	var v = new View( {
		title: 'Friend Host',
		width: 360,
		height: 135
	} );
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
	v.onClose = function()
	{
		Application.quit();
	}
}



