
//console.log( 'running this Treeroot Door drive' );

// TODO: Add function to get SessionID with crypto code private and public keys

Application.run = function( msg, interface )
{
	
	var v = new View( { title: 'Treeroot', width: 300, height: 140 } );
	
	var f = new File( 'Progdir:login.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
	
}
