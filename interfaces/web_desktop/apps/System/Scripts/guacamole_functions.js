
var Application = ( Application ? Application : {} );

Application.run = function()
{
	
	console.log( 'scripts init ...' );
	
};

Application.sendMessage = function( dataPacket, origin )
{
	
	origin = ( origin ? origin : '*' );
	
	parent.postMessage( JSON.stringify( dataPacket ), origin );
	
};

function login()
{
	return false;
}

function saveCreds()
{
	var inputs = document.getElementsByTagName( 'input' );
	
	if( inputs.length > 0 )
	{
		var creds = {};
		
		for( var i in inputs )
		{
			if( inputs[i].type && inputs[i].type != 'button' && inputs[i].type != 'submit' )
			{
				if( i == 0 || inputs[i].name == 'username' )
				{
					creds[ 'username' ] = inputs[i].value;
				}
				if( i == 1 || inputs[i].name == 'password' )
				{
					creds[ 'password' ] = inputs[i].value;
				}
				if( inputs[i].name == 'host' )
				{
					creds[ 'host' ] = inputs[i].value;
				}
			}
		}
		
		Application.sendMessage( {
			command: 'savecredentials',
			data : creds,
		} );
	}
}

