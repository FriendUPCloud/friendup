Application.run = function()
{
	listConnectedUsers();
	groupUsers();
}

function listConnectedUsers( limit, pos )
{
	if( !limit ) limit = 11;
	if( !pos ) pos = 0;
	
	let gid = ge( 'groupId' ).value;
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return ge( 'Usersearch' ).innerHTML = '<p>' + i18n( 'i18n_no_users_connected_to_you' ) + '</p>';
		}
		let list = JSON.parse( d );
		let str = '<div class="List">';
		let sw = 1;
		for( let a = 0; a < 10 && a < list.length; a++ )
		{
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + list[a].Fullname + '\
				</div>\
				<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall fa-arrow-up" onclick="inviteUser(' + list[a].ID + ')" title="' + i18n( 'i18n_invite_user_to_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		ge( 'Usersearch' ).innerHTML = str;
	}
	m.execute( 'listconnectedusers', { limit: 11 } );
}

function groupUsers()
{
	let gid = ge( 'groupId' ).value;
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return ge( 'Userlist' ).innerHTML = '<p>' + i18n( 'i18n_no_users_connected_to_group' ) + '</p>';
		}
		let list = JSON.parse( d );
		let str = '<div class="List">';
		let sw = 1;
		for( let a = 0; a < 10 && a < list.length; a++ )
		{
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + list[a].Fullname + '\
				</div>\
				<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall fa-remove" onclick="removeUser(' + list[a].ID + ')" title="' + i18n( 'i18n_remove_from_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		ge( 'Userlist' ).innerHTML = str;
	}
	m.execute( 'listconnectedusers', { groupId: gid, limit: 11 } );
}

// Invite a user to participate in group
function inviteUser( uid )
{

}

// Remove user from group
function removeUser( uid )
{

}


