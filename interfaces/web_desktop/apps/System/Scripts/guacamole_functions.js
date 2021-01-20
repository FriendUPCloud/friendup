
console.log( 'scripts init ...' );

function login(  )
{
	
	alert( 'send login data to parent ...' );
	
}

function saveCreds()
{
	console.log( 'send login data to parent ... ' );
	
	var inputs = document.getElementsByTagName( 'input' );
	
	if( inputs.length > 0 )
	{
		for( var i in inputs )
		{
			if( inputs[i].type && inputs[i].type != 'button' && inputs[i].type != 'submit' )
			{
				console.log( inputs[i].value, inputs[i] );
			}
		}
	}
}
