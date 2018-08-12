Application.run = function( msg )
{
	// Initial
	var dt = [ 'ID', 'Name', 'Description', 'DateCreated' ];
	for( var a = 0; a < dt.length; a++ )
	{
		if( ge( dt[ a ] ) )
		{
			ge( dt[ a ] ).value = '';
		}
	}
	var date = new Date();
	date = 
		date.getFullYear() + '-' + 
		StrPad( ( date.getMonth() + 1 ), 2, '0' ) + '-' +
		StrPad( date.getDate(), 2, '0' ) + ' ' +
		StrPad( date.getHours(), 2, '0' ) + ':' +
		StrPad( date.getMinutes(), 2, '0' ) + ':' +
		StrPad( date.getSeconds(), 2, '0' );
	ge( 'DateCreated' ).value = date;
	genStatus();
}

function genStatus( st )
{
	var avail_status = { 
		'New': 'New', 
		'Running': 'Running', 
		'Abandoned': 'Abandoned', 
		'Paused': 'Paused', 
		'Completed': 'Completed'
	};
	var str = '';
	var status = '';
	for( var a in avail_status )
	{
		var sl = st && st == a ? ' selected="selected"' : '';
		str += '<option value="' + a + '"' + sl + '>' + avail_status[ a ] + '</option>';
	}
	ge( 'Status' ).innerHTML = str;
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'load' )
	{
		var j = new Module( 'friendproject' );
		j.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var dd = JSON.parse( d );
				for( var a in dd )
				{
					if( ge( a ) )
					{
						ge( a ).value = dd[ a ];
					}
				}
				genStatus( dd.Status );
			}
		}
		j.execute( 'project', { id: msg.id } );
	}
	if( msg.command == 'viewid' )
	{
		Application.viewId = msg.viewid;
	}
}


function saveProject()
{
	var j = new Module( 'friendproject' );
	
	var ids = [ 'ID', 'Name', 'Status', 'Description', 'DateCreated' ];
	
	var args = {};
	for( var a = 0; a < ids.length; a++ )
	{
		args[ ids[ a ] ] = ge( ids[ a ] ).value;
	}
	
	j.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			Application.sendMessage( { command: 'refresh' } );
			CloseView();
		}
	}
	j.execute( 'saveproject', args );
}

function closeView()
{
	CloseView();
}
