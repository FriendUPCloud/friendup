Application.run = function( msg )
{
	var v = new View( {
		title: 'Python test suite',
		width: 500,
		height: 500
	} );
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:testsuite.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

