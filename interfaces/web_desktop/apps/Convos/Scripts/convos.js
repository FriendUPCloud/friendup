/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

window.Convos = {
	outgoing: [], // Outgoing messages
	sounds: {}, // Cached sounds
	unseenMessages: {} // Count unseen messages
};

window.Sounds = {}; // Built-in sounds
Sounds.newMessage = new Audio('/themes/friendup13/sound/new_message.ogg');
Sounds.sendMessage = new Audio( getImageUrl( 'Progdir:Assets/send.ogg' ) );

// Some events, like refresh and visibility change, ought to refresh messages
window.addEventListener( 'focus', function()
{
	if( Convos.focusTimeo ) clearTimeout( Convos.focusTimeo );
	Convos.focusTimeo = setTimeout( function()
	{
		Application.holdConnection( 'refresh' );
		let cnts = FUI.getElementByUniqueId( 'contacts' );
		if( cnts ) cnts.refreshDom();
	}, 25 );
} );
window.addEventListener( 'visibilitychange', function()
{
	if( document.visibilityState == 'visible' )
	{
		if( Convos.focusTimeo ) clearTimeout( Convos.focusTimeo );
		Convos.focusTimeo = setTimeout( function()
		{
			Application.holdConnection( 'refresh' );
			let cnts = FUI.getElementByUniqueId( 'contacts' );
			if( cnts ) cnts.refreshDom();
		}, 25 );
	}
} );

Application.run = function( msg )
{
	this.holdConnection( { method: 'messages', roomType: 'jeanie' } );
	// We loaded!
	this.sendMessage( { command: 'app-ready' } );
} 

// Navigate through the application
Application.navigate = function( path, depth = 0 )
{
	switch( depth )
	{
		case 0:
			path = path.split( '/' );
			return this.navigate( path, depth + 1 );
		case 1:
		{
			switch( path[0] )
			{
				case 'rooms':
				{
					let overview = FUI.getElementByUniqueId( 'convos' );
					if( !overview ) return false;
					let channels = overview.domChannels.getElementsByClassName( 'Channel' );
					if( channels )
					{
						for( let a = 0; a < channels.length; a++ )
						{
							if( channels[ a ].id == path[1] )
							{
								channels[ a ].click();
								return true;
							}
						}
					}
					return false;
				}
				case 'message':
				{	
					break;
				}
			}
		}
		default:
			return false;
	}
}

// Log of unread messages
window.unreadMessages = {
	rooms: {
	},
	dms: {
	}
};

Application.receiveMessage = function( msg )
{
	// Receiving message on sender
    if( msg.senderId )
    {
    	if( document.hidden || !document.body.classList.contains( 'activated' ) )
    	{
    		Sounds.newMessage.play();
    	}
        let overview = FUI.getElementByUniqueId( 'convos' );
        if( msg.type && msg.type == 'chatroom' && msg.uniqueId )
        {
        	// Log
        	if( !unreadMessages.rooms[ msg.uniqueId ] )
        		unreadMessages.rooms[ msg.uniqueId ] = [];
        	unreadMessages.rooms[ msg.uniqueId ].push( { sender: msg.senderId, message: msg.message } );
        	overview.updateActivityBubble();
        	overview.pollChatroom( msg.senderId, msg.uniqueId );
        }
        else
        {
        	// Log
        	if( !unreadMessages.dms[ msg.senderId ] )
        		unreadMessages.dms[ msg.senderId ] = [];
        	unreadMessages.dms[ msg.senderId ].push( { message: msg.message } );
        	
        	let contacts = FUI.getElementByUniqueId( 'contacts' );
    		if( contacts )		
	        	contacts.updateActivityBubble();
        	Application.holdConnection( 'refresh' );
        	//overview.activateDirectMessage( msg.senderId, msg.message );
    	}
    }
    else if( msg.command == 'signal' )
    {
    	if( msg.signal && msg.signal == 'writing' )
    	{
    		let contacts = FUI.getElementByUniqueId( 'contacts' );
    		if( !contacts ) return;
    		for( let a in contacts.userList )
    		{
    			let slot = contacts.userList[ a ];
    			let users = slot.getElementsByClassName( 'User' );
    			for( let b = 0; b < users.length; b++ )
    			{
    				if( users[ b ].record.ID == msg.senderId )
    				{
    					users[ b ].classList.add( 'Writing' );
    				}
    			}
    		}
    	}
    	else if( msg.signal && msg.signal == 'not-writing' )
    	{
    		let contacts = FUI.getElementByUniqueId( 'contacts' );
    		if( !contacts ) return;
    		for( let a in contacts.userList )
    		{
    			let slot = contacts.userList[ a ];
    			let users = slot.getElementsByClassName( 'User' );
    			for( let b = 0; b < users.length; b++ )
    			{
    				if( users[ b ].record.ID == msg.senderId )
    				{
    					users[ b ].classList.remove( 'Writing' );
    				}
    			}
    		}
    	}
    }
    // User is broadcasting a call
    else if( msg.command == 'broadcast-call' )
    {
		let messages = FUI.getElementByUniqueId( 'messages' );
		if( messages )
		{
			messages.queueMessage( '<videocall type="video" callid="' + msg.peerId + '"/>' );
		}
    }
    // User receives a call broadcast
    else if( msg.command == 'broadcast-received' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
			Application.SendUserMsg( {
				recipientId: contacts.record.ID,
				message: {
					command: 'broadcast-start',
					peerId: msg.peerId,
					remotePeerId: msg.remotePeerId
				}
			} );
		}
    }
    // User starts broadcast participation
    else if( msg.command == 'broadcast-start' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
    		console.log( '[Host] Received broadcast-start from client.' );
    		contacts.videoCall.sendMessage( { command: 'initcall', peerId: msg.peerId, remotePeerId: msg.remotePeerId } );
		}
    }
    // Polls broadcast
    else if( msg.command == 'broadcast-poll' )
    {
		let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
			Application.SendUserMsg( {
				recipientId: contacts.record.ID,
				message: {
					command: 'broadcast-poll-remote',
					peerId: msg.peerId
				}
			} );
    		console.log( '[host] Broadcast poll to other user' );
		}
    }
    // Comes from host
    else if( msg.command == 'broadcase-poll-remote' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
    		console.log( '[Client] Receiving broadcast poll function in convos.js' );
    		contacts.videoCall.sendMessage( { command: 'poll', peerId: msg.peerId } );
		}
    }
    else if( msg.type )
    {
    	// Receiving an invite
    	if( msg.type == 'invite' )
    	{
    		let overview = FUI.getElementByUniqueId( 'convos' );
    		overview.getEvents();
    		Notify( {
    			title: i18n( 'i18n_you_got_an_invite' ),
    			text: i18n( 'i18n_please_check_your_messages' )
			}, false, null );
    	}
    	// Accepting an invite
    	else if( msg.type == 'accept-invite' )
    	{
    		Notify( {
    			title: i18n( 'i18n_invite_accepted' ),
    			text: msg.fullname + ' ' + i18n( msg.message )
			}, false, function( e )
			{
				overview.pollChatroom( false, msg.groupId );
			} );
    	}
    	// Accepting an invite
    	else if( msg.type == 'update-seen' )
    	{
    		let msgs = FUI.getElementByUniqueId( 'messages' );
    		if( msgs )
    			msgs.checkSeen( msg.messages );
    	}
    }
    // Dropping an icon object
    if( msg.command == 'drop' )
    {
    	// Check what we dropped
    	// TODO: Fix support for multiple files...
    	if( !msg.data ) return;
		let m = FUI.getElementByUniqueId( 'messages' );
		if( !m ) return;
    	for( let a = 0; a < msg.data.length; a++ )
    	{
    		try
    		{
				switch( msg.data[a].Filename.split( '.' ).pop().toLowerCase() )
				{
					case 'jpg':
					case 'jpeg':
					case 'gif':
					case 'png':
						// Check if we can handle this file
						Confirm( i18n( 'i18n_share_image_with_group' ), i18n( 'i18n_share_image_desc' ), function( d )
						{
							if( d.data == true )
							{
								m = FUI.getElementByUniqueId( 'messages' );
								if( m )
								{
									m.shareImageAndPost( msg.data[ a ].Path );
								}
								else
								{
								}
							}
						} );
						return;
				}
			}
			catch( e ){};
		}
    }
}

Application.SendChannelMsg = function( msg )
{
	if( !msg ) return;
	
	// Check which channel we are in
	let messages = FUI.getElementByUniqueId( 'messages' );
	if( messages.options.type == 'jeanie' ) return;
	else if( messages.options.type == 'dm-user' )
	{
		Application.SendUserMsg( {
			recipientId: messages.options.cid,
			senderId: Application.uniqueId,
			sender: Application.Fullname,
			message: msg
		} );
	}
	else if( messages.options.type == 'chatroom' )
	{
		let contacts = FUI.getElementByUniqueId( 'contacts' );
		if( !contacts ) return;
		for( let a in contacts.userList )
		{
			let slot = contacts.userList[ a ];
			let users = slot.childNodes;
			for( let b = 0; b < users.length; b++ )
			{
				if( !users[ b ].classList || !users[ b ].classList.contains( 'User' ) )
					continue;
				Application.SendUserMsg( {
					recipientId: users[ b ].record.ID,
					senderId: Application.uniqueId,
					sender: Application.Fullname,
					message: msg
				} );
			}
		}
	}
}

// Send a message to a Friend OS user on the same server
Application.SendUserMsg = function( opts )
{
	if( !opts.recipientId ) return;
	
	let amsg = {
        'appname': 'Convos',
        'dstuniqueid': opts.recipientId
    };
    if( opts.message )
    {
    	amsg.msg = JSON.stringify( opts.message );
    }
    if( opts.callback )
    {
    	amsg.callback = 'yes';
	}
    let m = new Library( 'system.library' );
    m.execute( 'user/session/sendmsg', amsg );
}

// Start polling
Application.holdConnection = function( flags )
{
	let self = this;
	
	if( flags && flags != 'refresh')
		this.prevHoldFlags = flags;
	if( flags === 'refresh' && this.prevHoldFlags )
	{
		flags = this.prevHoldFlags;
	}
	if( !flags )
		this.prevHoldFlags = null;
	
	let args = {};
	
	// Apply flags
	if( flags )
	{
	    for( let a in flags )
	        args[ a ] = flags[ a ];
	}
	
	let pid = Math.floor( Math.random() * 1000 );
	
	// Push outgoing messages to args
	if( Convos.outgoing.length )
	{
		args.outgoing = Convos.outgoing;
		Convos.outgoing = [];
		//console.log( 'REGISTERING OUTGOING MESSAGES (' + pid + ').' );
	}
	
	if( args.outgoing || args.method )
    {
        //console.log( '[skip long poll] We are going for it!' );
    }
    else
    {
        //console.log( '[long poll mode] We are in long poll mode!' );
    }
	
	// In this case, we are blocking new calls (longpolling)
	if( !( args.outgoing || args.method ) )
	{
	    if( this.blocking )
	    {
            //console.log( '[blocking] We are blocking this call. (' + pid + ')' );
	        return;
        }
    	this.blocking = true;
	}
	
	let now = Math.floor( new Date().getTime() / 1000 );
	
	let m = new XMLHttpRequest();
	
	let uqkey = flags.roomType + ':' + flags.cid;
	
	m.open( 'POST', '/system.library/module/?module=system&command=convos&authid=' + Application.authId + '&args=' + JSON.stringify( args ), true );
	m.onload = function( data )
	{
	    if( args.outgoing && args.outgoing.length )
	    {
	        // Alert the other user
            let musers = [];
            let messages = [];
            let types = [];
            for( let b = 0; b < args.outgoing.length; b++ )
            {
                let found = false;
                for( let c = 0; c < musers.length; c++ )
                {
                    if( args.outgoing[ b ].targetId == musers[ c ] )
                    {
                        found = musers[ c ];
                        break;
                    }
                }
                if( !found )
                {
                    musers.push( args.outgoing[ b ].targetId );
                    messages.push( args.outgoing[ b ].message );
                    types.push( args.outgoing[ b ].type );
                }
            }
            
            if( musers.length > 0 )
            {
                for( let b = 0; b < musers.length; b++ )
                {
                    if( typeof( musers[ b ] ) != 'undefined' )
                    {
                    	if( types[ b ] == 'chatroom' )
                    	{
                    		let cn = FUI.getElementByUniqueId( 'contacts' );
                    		if( cn )
                    		{
                    			let contacts = cn.getContacts();
                    			for( let c = 0; c < contacts.length; c++ )
                    			{
                    				let amsg = {
						                'appname': 'Convos',
						                'dstuniqueid': contacts[ c ].uniqueId,
						                'msg': '{"sender":"' + Application.fullName + '","senderId":"' + Application.uniqueId + '","message":"' + messages[ b ] + '","type":"chatroom","uniqueId":"' + musers[ b ] + '"}'
						            };
						            if( c == 0 )
						            {
						            	amsg.callback = 'yes';
					            	}
						            let m = new Library( 'system.library' );
						            m.execute( 'user/session/sendmsg', amsg );
                    			}
                			}
                    	}
                    	else
                    	{
		                    let amsg = {
		                        'appname': 'Convos',
		                        'dstuniqueid': musers[ b ],
		                        'callback': 'yes',
		                        'msg': '{"sender":"' + Application.fullName + '","senderId":"' + Application.uniqueId + '","message":"' + messages[ b ] + '"}'
		                    };
		                    let m = new Library( 'system.library' );
		                    m.execute( 'user/session/sendmsg', amsg );
	                    }
                    }
                }
            }
	    }
	
	    if( self.blocking && !( args.outgoing || args.method ) )
    	    self.blocking = false;
	    
	    if( this.response )
		{
		    try
		    {
		        let js = JSON.parse( this.response.split( '<!--separate-->' )[1] );
		        if( js && js.response == 1 )
		        {
		            if( js.messages && js.messages.length > 0 )
		            {
		                let mess = FUI.getElementByUniqueId( 'messages' );
		                if( mess )
		                {
		                	// Wrong room!
				            if( mess.options.type + ':' + mess.options.cid != uqkey )
				            	return;
				            mess.addMessages( js.messages );
				            if( mess.clearQueue ) mess.clearQueue();
				            if( flags.force )
				            {
						        mess.toBottom();
				            }
			            }
		            }
		        }
		        // Response from longpolling
		        else if( js && js.response == 200 )
		        {
		            // Good.
		        }
            }
            catch( e )
            {
                console.log( 'Uncaught error.' );
            }
		}
	}
	m.send();
}

// Things to do on interval
let overviewIntr = 0;
setInterval( function()
{
	let conts = FUI.getElementByUniqueId( 'contacts' );
	if( conts )
		conts.checkOnlineState();
}, 15000 );

