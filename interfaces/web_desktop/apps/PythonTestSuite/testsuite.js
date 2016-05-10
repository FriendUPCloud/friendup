Application.run = function( msg )
{
}

function pythontest()
{
	var m = new Module( 'pythontest' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			ge( 'Output' ).innerHTML = d;
		}
		else
		{
			ge( 'Output' ).innerHTML = 'Error';
		}
	}
	m.execute( 'test' );
}


function quit()
{
	Application.quit();
}
