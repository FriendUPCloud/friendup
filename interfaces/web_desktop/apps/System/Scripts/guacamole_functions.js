
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

Application.receiveMessage = function( msg )
{
	
	if( msg.loginresult && msg.loginresult == 'negative' )
	{
		//ge('wrongCreds').style.display = 'block';
		
		console.log( msg );
		
	}

};

function saveCreds()
{
	console.log( 'send login data to parent ... ' );
	
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
				console.log( inputs[i].value, inputs[i] );
			}
		}
		
		console.log( creds );
		
		Application.sendMessage( {
			command: 'savecredentials',
			data : creds,
		} );
	}
}

function saveCredentials()
{
	var e = ge( 'fEmail' ).value;
	var p = ge( 'fPassword' ).value;
	
	var u = ge( 'fUrl' ).value;
	var b = ge( 'fBackend' ).value;
	
	var s = ( ge( 'fEncrypted' ).checked ? '1' : '0' );
	
	if( e != '' && p != '' )
	{
		Application.sendMessage( {
			command: 'savecredentials',
			data : {
				username : e,
				password : p,
				url      : u,
				server   : b,
				encrypt  : s
			},
		} );		
	}
	else
	{
		ge('wrongCreds').style.display = 'block';
	}
	return;
}

