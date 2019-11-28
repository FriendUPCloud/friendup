Application.run = function( msg )
{
	
}

function inviteUsers()
{
	var userList = [];
	var eles = ge( 'userList' ).getElementsByTagName( 'option' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].selected )
			userList.push( eles[a].value );
	}
	// We got users!
	if( userList.length )
	{
		Application.sendMessage( {
			command: 'invite_users',
			users: userList
		} );
		CloseView();
	}
	// Canceled...
	else
	{
		CloseView();
	}
}

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		if( msg.command == 'userlist' )
		{
			if( msg.users.length )
			{
				var str = '';
				for( var a = 0; a < msg.users.length; a++ )
				{
					// Skip yourself
					if( msg.users[a] == Application.username ) continue;
					str += '<option value="' + msg.users[a] + '">' + msg.users[a] + '</option>';
				}
				ge( 'userList' ).innerHTML = str;
			}
			else
			{
				ge( 'userList' ).innerHTML = '<option value="0">No users available</option>';
			}
		}
	}
}
