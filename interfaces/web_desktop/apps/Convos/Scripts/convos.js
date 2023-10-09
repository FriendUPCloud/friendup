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
	incoming_calls: {}, // Incoming
	unseenMessages: {} // Count unseen messages
};

window.Sounds = {}; // Built-in sounds
Sounds.newMessage = new Audio('/themes/friendup13/sound/new_message.ogg');
Sounds.sendMessage = new Audio( getImageUrl( 'Progdir:Assets/send.ogg' ) );
Sounds.incomingCall = new Audio( getImageUrl( 'Progdir:Assets/call.ogg' ) );

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
document.body.addEventListener( 'drop', function( e )
{
	console.log( e );
	cancelBubble( e );
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
	let ctest = FUI.getElementByUniqueId( 'contacts' );
	if( !ctest )
	{
		// We may not be ready!
		return setTimeout( function()
		{
			Application.receiveMessage( msg );
		}, 25 );
	}
	
	// Receiving message on sender
    if( msg.senderId && !msg.command )
    {
    	if( document.hidden || !document.body.classList.contains( 'activated' ) )
    		Sounds.newMessage.play();
    	
        let overview = FUI.getElementByUniqueId( 'convos' );
        
        if( msg.type && msg.type == 'chatroom' && msg.uniqueId )
        {	
        	let intr = null;
        	let retries = 4;
        	function intoroom()
        	{
		    	// Log
		    	if( retries-- == 0 || overview.groupsLoaded )
		    	{
					clearInterval( intr );
					if( !unreadMessages.rooms[ msg.uniqueId ] )
						unreadMessages.rooms[ msg.uniqueId ] = [];
					unreadMessages.rooms[ msg.uniqueId ].push( { sender: msg.senderId, message: msg.message, time: ( new Date() ).getTime() } );
					overview.updateActivityBubble();
					overview.pollChatroom( msg.senderId, msg.uniqueId, msg.source && msg.source == 'notification' ? true : false );
				}
	    	}
	    	if( overview.groupsLoaded ) intoroom();
	    	else
	    	{
	    		intr = setInterval( intoroom, 125 );
	    	}
	    	
        }
        else
        {
        	// Log
        	if( !unreadMessages.dms[ msg.senderId ] )
        		unreadMessages.dms[ msg.senderId ] = [];
        	unreadMessages.dms[ msg.senderId ].push( { message: msg.message, time: ( new Date() ).getTime() } );
        	
        	let contacts = FUI.getElementByUniqueId( 'contacts' );
        	if( contacts )		
	        	contacts.updateActivityBubble();
        	// We clicked, so force activate
        	if( msg.source && msg.source == 'notification' )
    		{    	
        		if( contacts )
        		{
        			// We may have to wait for the network..
        			let retries = 5;
        			let activR = 0;
        			function activ()
        			{
        				if( retries-- == 0 )
        				{
        					return clearInterval( activR );
        				}
        				if( contacts.getContact( msg.senderId ) )
        				{
        					clearInterval( activR );
			    			contacts.setChatView( contacts.getContact( msg.senderId ) );
		    			}
        			}
        			activR = setInterval( function(){ activ(); }, 125 );
        			activ();
        		}
        	}
        	
        	let messages = FUI.getElementByUniqueId( 'messages' );
        	if( messages )
        	{
        		if( messages.options.type == 'dm-user' && messages.options.cid == msg.senderId )
        		{
        			Application.holdConnection( 'refresh' );
        		}
        	}
    	}
    }
    // Got cli arguments
    else if( msg.command == 'cliarguments' )
    {
    	if( !msg.data )
    	{
    		// Just check events
    		let overview = FUI.getElementByUniqueId( 'convos' );
    		overview.getEvents();
		}
    }
    else if( msg.command == 'message-update' )
    {
    	let mess = FUI.getElementByUniqueId( 'messages' );
    	mess.updateMessage( msg.mid, msg.content );
    }
    else if( msg.command == 'message-remove' )
    {
    	let mess = FUI.getElementByUniqueId( 'messages' );
    	mess.removeMessage( msg.mid );
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
    else if( msg.command == 'kick' )
    {
    	let ov = FUI.getElementByUniqueId( 'convos' );
        ov.activatePMTab();
        ov.redrawChannels();
    	Notify( {
    		title: i18n( 'i18n_removed_from_group' ),
    		text: i18n( 'i18n_removed_from_the_group' ) + ' ' + msg.groupName + '.'
    	} );
    }
    // User is broadcasting a call
    else if( msg.command == 'broadcast-call' )
    {
		let messages = FUI.getElementByUniqueId( 'messages' );
		let contacts = FUI.getElementByUniqueId( 'contacts' );
		if( messages && contacts )
		{
			// Send "video start" to recipient!
			Application.SendUserMsg( {
				recipientId: contacts.record.ID,
				message: {
					command: 'broadcast-start',
					peerId: msg.peerId,
					senderId: Application.uniqueId,
					senderName: Application.fullName
				}
			} );
			window.currentPeerId = msg.peerId;
		}
    }
    // Callee receives a call broadcast, ready to connect
    else if( msg.command == 'broadcast-received' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
			Application.SendUserMsg( {
				recipientId: contacts.record.ID,
				message: {
					command: 'broadcast-connect',
					peerId: msg.peerId,
					remotePeerId: msg.remotePeerId
				}
			} );
		}
    }
    // This is when the remote is connecting in!
    else if( msg.command == 'broadcast-connect' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts && contacts.videoCall )
    	{
    		// Switch peerId (current) and remotePeerId ( remote) as it comes
    		// from the remote callee - and their remote is this peer..
			contacts.videoCall.sendMessage( { command: 'initcall', peerId: msg.remotePeerId, remotePeerId: msg.peerId } );
		}
    }
    // Callee starts broadcast participation (received signal)
    else if( msg.command == 'broadcast-start' )
    {
    	Sounds.incomingCall.loop = true;
    	Sounds.incomingCall.play();
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
    		Confirm( i18n( 'i18n_receive_video_call' ), msg.senderName + ' ' + i18n( 'i18n_receiving_video_desc' ), function( d )
    		{
    			Sounds.incomingCall.loop = false;
    			if( d && d.data )
    			{
    				contacts.setChatView( contacts.getContact( msg.senderId ) );
    				takeVideoCall( msg.peerId );
	    		}
    			// Say hang up!
	    		else
	    		{
					Application.SendUserMsg( {
						recipientId: msg.senderId,
						message: {
							command: 'broadcast-stop',
							peerId: msg.peerId
						}
					} );
	    		}
    		} );
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
    // Close video (both sides will do it)
    else if( msg.command == 'broadcast-stop' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts && contacts.videoCall )
    	{
    		// Only on match
    		if( window.currentPeerId == msg.peerId )
    		{
    			contacts.videoCall.close();
			}
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
    else if( msg.command == 'group-update' )
    {
    	let overview = FUI.getElementByUniqueId( 'convos' );
    	overview.redrawChannels();
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
			let overview = FUI.getElementByUniqueId( 'convos' );
			if( msg.groupId )
				overview.activateGroupTab( msg.groupId );
			overview.redrawChannels();
			let contacts = FUI.getElementByUniqueId( 'contacts' );
			contacts.refreshDom();
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
							}
						} );
						return;
					default:
						// Check if we can handle this file
						Confirm( i18n( 'i18n_share_image_with_group' ), i18n( 'i18n_share_image_desc' ), function( d )
						{
							if( d.data == true )
							{
								m = FUI.getElementByUniqueId( 'messages' );
								if( m )
								{
									m.shareFileAndPost( msg.data[ a ].Path );
								}
							}
						} );
						break;
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

function takeVideoCall( incomingPeerId )
{
	let contacts = FUI.getElementByUniqueId( 'contacts' );
	if( contacts.videoCall )
		contacts.videoCall.close();
	
	window.currentPeerId = incomingPeerId;
	
	contacts.videoCall = new View( {
		title: i18n( 'i18n_video_call' ) + ' - ' + contacts.record.Fullname,
		width: 650,
		height: 512
	} );
	contacts.videoCall.record = contacts.record;
	contacts.videoCall.onClose = function()
	{
		contacts.videoCall = null;
		
		// Say hang up!
		Application.SendUserMsg( {
			recipientId: contacts.record.ID,
			message: {
				command: 'broadcast-stop',
				peerId: window.currentPeerId
			}
		} );
		
		window.currentPeerId = null;
	}
	let f = new File( 'Progdir:Markup/videocall.html' );
	f.replacements = { 'remotePeerId': incomingPeerId, 'currentPeerId': '' };
	f.i18n();
	f.onLoad = function( data )
	{
		contacts.videoCall.setContent( data );
	}
	f.load();
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
let prevConnection = null;
Application.holdConnection = function( flags )
{
	if( prevConnection )
	{
		prevConnection.abort();
		prevConnection.onload = null;
		prevConnection = null;
	}
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
	prevConnection = m;
	
	let uqkey = flags.roomType + ':' + flags.cid;
	let post = JSON.stringify( {
		args: args
	} );
	m.open( 'POST', '/system.library/module/?module=system&command=convos&authid=' + Application.authId, true );
	m.onload = function( data )
	{
		// Remove ref if self
		if( prevConnection == m )
			prevConnection = null;
			
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
                console.log( 'Uncaught error.', e, this.response );
            }
		}
	}
	m.send( post );
}

// Things to do on interval
let overviewIntr = 0;
setInterval( function()
{
	let conts = FUI.getElementByUniqueId( 'contacts' );
	if( conts )
		conts.checkOnlineState();
}, 15000 );

