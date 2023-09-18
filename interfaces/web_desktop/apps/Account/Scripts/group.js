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

let existing = [];       // Keeps the last generated list of pending invites
let currentSearch = '';  // Keeps last tracked search keywords

// List pending invites to users for this group
// Will also load users who are connected to this group (unless skipOthers)
function listConnectedUsers( limit, pos, keyw, skipOthers )
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
			
			for( let a = 0; a < list.length; a++ )
			{
				if( list[a].EventID )
				{
					str += '<div class="HRow sw' + sw + '">\
						<div class="HContent80 FloatLeft Ellipsis PaddingSmall">\
							' + ( list[a].Fullname ? list[a].Fullname : list[a].Email ) + '\
						</div>\
						<div class="HContent20 FloatLeft Ellipsis PaddingSmall TextRight">\
							<button class="Button IconSmall fa-remove NoText IconButton" onclick="removeInvite(\'' + list[a].EventID + '\',false, \'' + list[a].ID + '\')"></button>\
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
							<button class="Button IconSmall fa-remove NoText IconButton" onclick="removeInvite(null,\'' + list[a].InviteLinkID + '\',\'' + list[a].TargetUserID + '\')"></button>\
						</div>\
					</div>';
				}
				sw = sw == 1 ? 2 : 1;
			}
			str += '</div>';
		
			ge( 'Pending' ).innerHTML = str;
		}
		
		if( pos == 0 && !skipOthers )
			connectedOthers( limit, pos, keyw );
		
	}
	p.execute( 'getpendinginvites', { groupId: gid, listall: true } );
}

// List users who are connected to this group - by limit, position or keywords
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
		
		let listed = 0;
		for( let a = 0; a < 10 && a < mlist.length && ( ( keyw && keyw.length ) || a < limit ); a++ )
		{
			let skip = false;
			// Skip pending invites users
			for( let b = 0; b < list.length; b++ )
			{
				if( parseInt( list[b].UserID ) == parseInt( mlist[a].ID ) )
				{
					skip = true;
					continue;
				}
			}
			if( skip ) continue;
			str += '<div class="HRow sw' + sw + '" rowid="' + mlist[a].ID + '">\
				<div class="HContent60 FloatLeft Ellipsis PaddingSmall">\
					' + mlist[a].Fullname + '\
				</div>\
				<div class="HContent40 FloatLeft PaddingSmall TextRight">\
					<button type="button" class="Button IconSmall NoText fa-user-plus IconButton" onclick="inviteUser(' + mlist[a].ID + ')" title="' + i18n( 'i18n_invite_user_to_group' ) + '"></button>\
				</div>\
			</div>';
			sw = sw == 1 ? 2 : 1;
			listed++;
		}
		str += '</div>';
		
		if( listed > 0 && mlist.length >= limit && !keyw )
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


// Load more connected users - starting frmo position (with optional keys)
function loadMoreConnected( pos, keys )
{
	connectedOthers( 10, pos, keys );
}

// Remove invite from pending list
function removeInvite( eventId, inviteId, userid )
{
	if( inviteId )
	{
		let p = new Module( 'system' );
		p.onExecuted = function( e, d )
		{
			groupUsers( function(){ listConnectedUsers( false, false, false, true ); } );
			let eles = ge( 'Pending' ).getElementsByClassName( 'HRow' );
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].getAttribute( 'rowid' ) == userid )
				{	
					eles[a].style.display = 'none';
				}
			}
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

// Search for user who can be connected to group
function searchUser( keyw )
{
	listConnectedUsers( false, false, keyw );
}

// Show users who are connected to this group
function groupUsers( callback, pos, limit )
{
	let gid = ge( 'groupId' ).value ? ge( 'groupId' ).value : '0';
	if( !limit ) limit = 10;
	if( !pos ) pos = 0;
	
	if( parseInt( gid ) > 0 )
	{
		ge( 'InviteColumn' ).style.display = '';
		ge( 'NameColumn' ).classList.remove( 'HContent70' );
		ge( 'NameColumn' ).classList.add( 'HContent40' );
	}
	else
	{
		ge( 'InviteColumn' ).style.display = 'none';
		ge( 'NameColumn' ).classList.add( 'HContent70' );
		ge( 'NameColumn' ).classList.remove( 'HContent40' );
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
		
		let listed = 0;
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
			listed++;
		}
		str += '</div>';
		
		if( list.length >= limit && listed > 0 )
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

// Invite GUI for new users (via e-mail)
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
			// Do not update search, but everything else
			groupUsers( function(){ listConnectedUsers( false, false, false, true  ); } );
			
			// Hide row
			let eles = ge( 'Usersearch' ).getElementsByClassName( 'HRow' );
			for( let a = 0; a < eles.length; a++ )
			{
				if( eles[a].getAttribute( 'rowid' ) == uid )
				{	
					eles[a].style.display = 'none';
				}
			}
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

// Show GUI components other than description and name of group
function revealUIComponents()
{
	ge( 'dGroup' ).classList.remove( 'Hidden' );
	ge( 'Relations' ).classList.remove( 'Hidden' );
}

// Delete this group!
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
						
						//try
						//{
							
							var data = JSON.parse( d );
							
							//console.log( { e:e, d:(data?data:d) } );
							
							if( data.roomId )
							{
								var json = {
									roomId : data.roomId
								};
								
								//console.log( '[1]', { type: 0, path: '/room/remove', params: json, servername: null } );
								
								var dp = new Library( 'system.library' );
								dp.onExecuted = function( ee, dd )
								{
									
									//console.log( '[2]', { type: 0, path: '/room/remove', params: json, servername: null, ee: ee, dd:dd } );
									
									if( ee == 'fail' )
									{
										console.log( dd );
									}
						
								}
								dp.execute( 'service/request', {
						                type: 0,
						                path: '/room/remove',
						                params: json,
						                servername: null
						        } );
								
							}
							else
							{
								console.log( { e:e, d:d } );
							}
							
						//}
						//catch( e )
						//{
						//	console.log( e );
						//}
						
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
		let l = new XMLHttpRequest();
		l.open( 'POST', '/system.library/group/addusers/?authid=' + Application.authId + '&id=' + gid + '&users=' + Application.userId, true );
		l.onload = function()
		{
			// Do nothing
			//console.log( 'Result of add users: ', this.responseText );
		}
		l.send();
	}
	
	function connectFriendChatRoom( gid, roomid = false, cb = false )
	{
		// Convos way
		if( 1 )
		{
			let chat = new Module( 'system' );
			chat.onExecuted = function( me, md )
			{
				Application.sendMessage( { command: 'refreshgroups' } );
				if( cb ) cb( me, md );
			}
			chat.execute( 'convos', { method: 'addroom', parent: gid } );
		}
		// Old Friend Chat way
		else
		{
			// TODO: Deprecate
			let wmd = new Module( 'system' );
			wmd.onExecuted = function( e, d ){ if( cb ) cb( e, d ); }
			wmd.execute( 'workgroupaddmetadata', { groupId: gid, roomId: roomid } );
		}
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
					revealUIComponents();
					groupUsers( function(){ listConnectedUsers(); } );
				} );
				
				if( t.id && t.uuid && ge( 'ChatRoomCreate' ) && ge( 'ChatRoomCreate' ).checked )
				{
					
					let json = {
		                name : ge( 'groupName' ).value + ' (' + Application.fullName + ')',
		                workgroups : [ t.uuid ]
                    };

                    let cp = new Library( 'system.library' );
                    cp.onExecuted = function( server )
                    {
                    	console.log( 'What is: ', server )
                        if( server && server.roomId )
                        {
                            connectFriendChatRoom( t.id, server.roomId, function( ee, dd )
                            {
									
                                    if( ee == 'fail' )
                                    {
                                    	console.log( dd );
                                    }

                            } );
                        }
                        else if( server || ge( 'ChatRoomCreate' ).checked )
                        {
                        	connectFriendChatRoom( t.id, false, function( ee, dd )
                        	{
                        		console.log( 'Done' );
                        	} );
                        	console.log( 'Want server: ', server );
                        }
                    }
                    cp.execute( 'service/request', {
                            type: 0,
                            path: '/room/create',
                            params: json,
                            servername: null
                    } );
					
				}
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

// Receives messages
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

