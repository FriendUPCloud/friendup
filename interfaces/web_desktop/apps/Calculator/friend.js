Application.run = function()
{
	var v = new View( {
		title: 'Calculator',
		width: 198,
		height: 229
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:calculator.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}
