Application.run = function( msg, iface )
{
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'userinfo':
			this.id = msg.ID;
			ge( 'UserAccFullname' ).value        = msg.FullName;
			ge( 'UserAccUsername' ).value        = msg.Name;
			ge( 'UserAccPassword' ).value        = '********';
			ge( 'UserAccPasswordConfirm' ).value = '********';
			ge( 'UserAccPhone' ).value           = '';
			ge( 'UserAccEmail' ).value           = msg.Email;
			break;
	}
}

function cancelDia()
{
	Application.sendMessage( { command: 'quit' } );
}

function saveDia()
{
	// Get save object
	var obj = {
		FullName: ge( 'UserAccFullname' ).value,
		Name:     ge( 'UserAccUsername' ).value,
		Phone:    ge( 'UserAccPhone' ).value,
		Email:    ge( 'UserAccEmail' ).value,
		id:       Application.id     
	};
	
	if( ge( 'UserAccPassword' ).value == ge( 'UserAccPasswordConfirm' ).value &&
		ge( 'UserAccPassword' ).value != '********'
	)
	{
		obj.Password = ge( 'UserAccPassword' );
	}
	else if( ge( 'UserAccPassword' ).value != ge( 'UserAccPasswordConfirm' ).value )
	{
		ge( 'UserAccPassword' ).focus();
		return false;
	}
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		Application.sendMessage( { command: 'saveresult', result: e, data: obj } );
	}
	m.execute( 'userinfoset', obj );
}
