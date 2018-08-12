Application.run = function( msg )
{

	this.setApplicationName( i18n( 'i18n_settings' ) );
	var v = new View( {
		title: i18n( 'i18n_settings' ),
		width: 900,
		height: 800
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

