/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function()
{
	groupUsers( function(){ listConnectedUsers(); } );
}

let groupUsersList = [];

let existing = [];
let currentSearch = '';

function listConnectedUsers( limit, pos, keyw )
{
	if( !limit ) limit = 10;
	if( !pos ) pos = 0;
	
	if( !keyw && ge( 'findUsers' ).value.length > 0 )
		keyw = ge( 'findUsers' ).value;
	
	let gid = ge( 'groupId' ).value;
	
	let p = new Module( 'system' );
	p.onExecuted = function( e, d )
	{
		let skip = false;
		if( e != 'ok' ) { ge( 'Pending' ).innerHTML = ''; skip = true; };
		
		let list = JSON.parse( d );
		
		if( !list.length ) { ge( 'Pending' ).innerHTML = ''; skip = true; };
		
		if( !skip )
		{
			let str = '<hr class="Divider"/><p><strong>' + i18n( 'i18n_pending_invites' ) + '</strong></p>';
			str += '<div class="List">';
			let sw = 1;
			existing = list;
			currentSearch = keyw;
			
			for( let a = 0; a < list.length && a < limit; a++ )
			{
				if( list[a].EventID )
				{
					str += '<div class="HRow sw' + sw + '">\
						<div class="HContent80 FloatLeft Ellipsis PaddingSmall">\
							' + ( list[a].Fullname ? list[a].Fullname : list[a].Email ) + '\
						</div>\
						<div class="HContent20 FloatLeft Ellipsis PaddingSmall TextRight">\
							<button class="Button IconSmall fa-remove NoText IconButton" onclick="removeInvite(\'' + list[a].EventID + '\')"></button>\
						</div>\
					</div>';
				}
				else if( list[a].InviteLinkID )
				{
					str += '<div class="HRow sw' + sw + '">\
						<div class="HContent80 FloatLeft Ellipsis PaddingSmall">\
							' + ( list[a].Fullname ? list[a].Fullname : list[a].Email ) + '\
						</div>\
						<div class="HContent20 FloatLeft Ellipsis PaddingSmall TextRight">\
							<button class="Button IconSmall fa-remove NoText IconButton" onclick="removeInvite(null,\'' + list[a].InviteLinkID + '\')"></button>\
						</div>\
					</div>';
				}
				sw = sw == 1 ? 2 : 1;
			}
			str += '</div>';
		
			ge( 'Pending' ).innerHTML = str;
		}
		
		if( pos == 0 )
			connectedOthers( limit, pos, keyw );
		
	}
	p.execute( 'getpendinginvites', { groupId: gid, listall: true } );
}

function connectedOthers( limit, pos, keyw)
{
	let list = existing;
	if( !keyw && currentSearch )
		keyw = currentSearch;
	
	// List others
	let m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			return ge( 'Usersearch' ).innerHTML = '<p>' + i18n( 'i18n_no_users_connected_to_you' ) + '</p>';
		}
		let mlist = JSON.parse( d );
		let str = '<div class="List">';
		sw = 1;
		
		// Pick from the last
		let hr = ge( 'Usersearch' ).getElementsByClassName( 'HRow' );
		if( hr.length )
			sw = hr[ hr.length - 1 ].classList.contains( 'sw1' ) ? 2 : 1;
		
		for( let a = 0; a < 10 && a < mlist.length && a < limit; a++ )
		{
			let skip = false;
			// Skip pending invites users
			for( let b = 0; b < list.length && b < limit; b++ )
			{
				if( list[b].UserID == mlist[a].ID )
				{
					skip = true;
					continue;
				}
			}
			if( skip ) continue;
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + mlist[a].Fullname + '\
				</div>\
				<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall NoText fa-user-plus IconButton" onclick="inviteUser(' + mlist[a].ID + ')" title="' + i18n( 'i18n_invite_user_to_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		if( mlist.length >= limit )
		{
			str += '<p><em><span class="MousePointer" onclick="loadMoreConnected(' + ( pos + limit ) + ')">' + i18n( 'i18n_more' ) + '</span></em></p>';
		}
		
		// Remove previous
		let more = ge( 'Usersearch' ).getElementsByTagName( 'p' );
		if( more.length )
		{
			for( let a = 0; a < more.length; a++ )
				ge( 'Usersearch' ).removeChild( more[a] );
		}
		
		if( pos > 0 )
		{
			ge( 'Usersearch' ).innerHTML += str;
		}
		else
		{
			ge( 'Usersearch' ).innerHTML = str;
		}
	}
	let o = { limit: limit, pos: pos };
	if( groupUsersList.length > 0 )
		o.except = groupUsersList;
	if( keyw )
		o.keywords = keyw;
	m.execute( 'listconnectedusers', o );
}


// Load more connected users
function loadMoreConnected( pos, keys )
{
	connectedOthers( 10, pos, keys );
}

function removeInvite( eventId, inviteId )
{
	if( inviteId )
	{
		let p = new Module( 'system' );
		p.onExecuted = function( e, d )
		{
			groupUsers( function(){ listConnectedUsers(); } );
		}
		p.execute( 'removeinvite', { ids: inviteId } );
	}
	else
	{
		let b = new Module( 'system' );
		b.onExecuted = function( e, d )
		{
			groupUsers( function(){ listConnectedUsers(); } );
		}
		b.execute( 'removependinginvite', { eventId: eventId } );
	}
}

function searchUser( keyw )
{
	listConnectedUsers( null, null, keyw );
}

function groupUsers( callback, pos, limit )
{
	let gid = ge( 'groupId' ).value ? ge( 'groupId' ).value : '0';
	if( !limit ) limit = 10;
	if( !pos ) pos = 0;
	
	if( parseInt( gid ) > 0 )
	{
		ge( 'InviteColumn' ).style.display = '';
		ge( 'NameColumn' ).classList.remove( 'HContent70' );
		ge( 'NameColumn' ).classList.add( 'HContent45' );
	}
	else
	{
		ge( 'InviteColumn' ).style.display = 'none';
		ge( 'NameColumn' ).classList.add( 'HContent70' );
		ge( 'NameColumn' ).classList.remove( 'HContent45' );
	}
	
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
		
		// Pick from the last
		let hr = ge( 'Userlist' ).getElementsByClassName( 'HRow' );
		if( hr.length )
			sw = hr[ hr.length - 1 ].classList.contains( 'sw1' ) ? 2 : 1;
		
		for( let a = 0; a < 10 && a < list.length && a < limit; a++ )
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
			
			let me = list[a].ID == Application.userId ? ' (you)' : '';
			
			str += '<div class="HRow sw' + sw + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + list[a].Fullname + me + '\
				</div>\
				' + ( me == '' ? ( '<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall NoText fa-remove IconButton" onclick="removeUser(' + list[a].ID + ')" title="' + i18n( 'i18n_remove_from_group' ) + '"></button>\
				</div>' ) : '' ) + '\
			</div>';
			sw = sw == 1 ? 2 : 1;
		}
		str += '</div>';
		
		if( list.length >= limit )
		{
			str += '<p><em><span class="MousePointer" onclick="groupUsers(null,' + ( pos + limit ) + ')">' + i18n( 'i18n_more' ) + '</span></em></p>';
		}
		
		// Remove previous
		let more = ge( 'Userlist' ).getElementsByTagName( 'p' );
		if( more.length )
		{
			for( let a = 0; a < more.length; a++ )
				ge( 'Userlist' ).removeChild( more[a] );
		}
		
		if( pos > 0 )
		{
			ge( 'Userlist' ).innerHTML += str;
		}
		else
		{
			ge( 'Userlist' ).innerHTML = str;
		}
		
		if( callback ) callback();
	}
	m.execute( 'listconnectedusers', { groupId: gid, limit: limit, pos: pos } );
}

function doInvite()
{
	if( !ge( 'groupId' ).value ) return;
	
	let v = new View( {
		title: i18n( 'i18n_invite_user' ),
		width: 500,
		height: 140
	} );
	
	let t = new File( 'Progdir:Templates/invite_user.html' );
	t.replacements = {
		gid : ge( 'groupId' ).value
	}
	t.i18n();
	t.onLoad = function( data )
	{
		v.setContent( data );
	}
	t.load();
}

// Invite a user to participate in group
function inviteUser( uid )
{
	if( ge( 'groupId' ).value )
	{
		let m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
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

function reveilUIComponents()
{
	ge( 'dGroup' ).classList.remove( 'Hidden' );
	ge( 'Relations' ).classList.remove( 'Hidden' );
}

function deleteGroup()
{
	let groupId = ge( 'groupId' ).value;
	if( parseInt( groupId ) > 0 )
	{
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_deleting_desc' ), function( data )
		{
			if( data.data == true )
			{
				let d = new Module( 'system' );
				d.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						let t = new Library( 'system.library' );
						t.onExecuted = function( e, d )
						{
							if( e == 'ok' )
							{
								Application.sendMessage( { command: 'refreshgroups' } );
								CloseView();
							}
							else
							{
								Alert( i18n( 'i18n_gr_failed_to_delete' ), i18n( 'i18n_gr_failed_to_delete_desc' ) );
							}
						}
						t.execute( 'group/delete', { id: groupId } );
					}
				}
				d.execute( 'flushworkgroup', { groupId: groupId } );
			}
		} );
	}
}

// Save the group
function saveGroup()
{
	function joinGroup( gid, cb )
	{
		m = new Module( 'system' );
		m.onExecuted = function( e, d ){ if( cb ) cb(); }
		m.execute( 'joingroup', { groupId: gid } );
	}
	
	let t = new Library( 'system.library' );
	t.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			Alert( i18n( 'i18n_could_not_save_group' ), i18n( 'i18n_an_error_occured_group_save' ) );
			return;
		}
		
		Application.sendMessage( { command: 'refreshgroups' } );
		if( ge( 'groupId' ).value > 0 )
		{
			joinGroup( ge( 'groupId' ).value );
			CloseView();
		}
		else
		{
			try
			{
			
				let t = JSON.parse( d );
				
				Application.sendMessage( { command: 'resizeGroupWindow', viewId: Application.viewId } );
				
				ge( 'groupId' ).value = t.id;
				joinGroup( t.id, function()
				{
					reveilUIComponents();
					groupUsers( function(){ listConnectedUsers(); } );
				} );
			}
			catch( e )
			{
				CloseView();
			}
		}
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
		joinGroup( ge( 'groupId' ).value, function()
		{
			t.execute( 'group/update', {
				groupname: ge( 'groupName' ).value,
				description: ge( 'groupDescription' ).value,
				id: ge( 'groupId' ).value
			} );
		} );
	}	
}

Application.receiveMessage = function( msg )
{
	
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'refreshInvites':
			
			groupUsers( function(){ listConnectedUsers(); } );
			
			break;
	}
	
}

