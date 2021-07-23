Application.run = function()
{
	groupUsers( function(){ listConnectedUsers(); } );
}

let groupUsersList = [];

function listConnectedUsers( limit, pos, keyw )
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
					<button type="button" class="Button IconSmall NoText fa-arrow-up" onclick="inviteUser(' + list[a].ID + ')" title="' + i18n( 'i18n_invite_user_to_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		ge( 'Usersearch' ).innerHTML = str;
	}
	let o = { limit: 11 };
	if( groupUsersList.length > 0 )
		o.except = groupUsersList;
	if( keyw )
		o.keywords = keyw;
	m.execute( 'listconnectedusers', o );
	
	let p = new Module( 'system' );
	p.onExecuted = function( e, d )
	{
		if( e != 'ok' ) { ge( 'Pending' ).innerHTML = ''; return; };
		
		let list = JSON.parse( d );
		
		if( !list.length ) { ge( 'Pending' ).innerHTML = ''; return; };
		
		let str = '<p><strong>' + i18n( 'i18n_pending_invites' ) + '</strong></p>';
		str += '<div class="List">';
		let sw = 1;
		for( let a = 0; a < 10 && a < list.length; a++ )
		{
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent100 FloatLeft Ellipsis PaddingSmall">\
					' + list[a].FullName + '\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div><hr class="Divider"/>';
		
		ge( 'Pending' ).innerHTML = str;
	}
	p.execute( 'getinvites', { groupId: gid } );
}

function searchUser( keyw )
{
	listConnectedUsers( null, null, keyw );
}

function groupUsers( callback )
{
	let gid = ge( 'groupId' ).value ? ge( 'groupId' ).value : '0';
	
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			if( callback ) callback();
			return ge( 'Userlist' ).innerHTML = '<p>' + i18n( 'i18n_no_users_connected_to_group' ) + '</p>';
		}
		let list = JSON.parse( d );
		let str = '<div class="List">';
		let sw = 1;
		for( let a = 0; a < 10 && a < list.length; a++ )
		{
			// Add to a global list
			let found = false;
			for( let b = 0; b < groupUsersList.length; b++ )
			{
				if( groupUsersList[b] == list[a].ID )
				{
					found = true;
					break;
				}
			}
			if( !found )
				groupUsersList.push( list[a].ID );
			
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + list[a].Fullname + '\
				</div>\
				<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall NoText fa-remove" onclick="removeUser(' + list[a].ID + ')" title="' + i18n( 'i18n_remove_from_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		ge( 'Userlist' ).innerHTML = str;
		
		if( callback ) callback();
	}
	m.execute( 'listconnectedusers', { groupId: gid, limit: 11 } );
}

// Invite a user to participate in group
function inviteUser( uid )
{
	if( ge( 'groupId' ).value )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				return 
			}
			groupUsers( function(){ listConnectedUsers(); } );
		}
		m.execute( 'sendinvite', {
			userid: uid,
			authid: Application.authId,
			workgroups: ge( 'groupId' ).value
		} );
	}
	else
	{
		Alert( i18n( 'i18n_can_not_invite' ), i18n( 'i18n_can_not_invite_desc' ) );
	}
}

// Remove user from group
function removeUser( uid )
{
	if( ge( 'groupId' ).value )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_sure_remove_user_from' ), function( data )
		{
			if( data.data == true )
			{
				let m = new Library( 'system.library' );
				m.onExecuted = function( e, d )
				{
					if( e != 'ok' )
					{
						return 
					}
					groupUsers( function(){ listConnectedUsers(); } );
				}
				m.execute( 'group/removeusers', {
					users: uid,
					id: ge( 'groupId' ).value
				} );
			}
		} );
	}
}

// Save the group
function saveGroup()
{
	let t = new Library( 'system.library' );
	t.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			Alert( i18n( 'i18n_could_not_save_group' ), i18n( 'i18n_an_error_occured_group_save' ) );
			return;
		}
		Application.sendMessage( { command: 'refreshgroups' } );
		CloseView();
	}
	
	// Create
	if( ge( 'groupId' ).value <= 0 )
	{
		t.execute( 'group/create', {
			type: 'Workgroup',
			description: ge( 'groupDescription' ).value,
			groupname: ge( 'groupName' ).value
		} );
	}
	// Update
	else
	{
		t.execute( 'group/update', {
			groupname: ge( 'groupName' ).value,
			description: ge( 'groupDescription' ).value,
			id: ge( 'groupId' ).value
		} );
	}	
}

