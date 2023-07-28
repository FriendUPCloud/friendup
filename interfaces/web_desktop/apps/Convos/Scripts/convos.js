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
	outgoing: [],
	sounds: {}
};

window.Sounds = {};
Sounds.newMessage = new Audio('/themes/friendup13/sound/new_message.ogg');
Sounds.sendMessage = new Audio( getImageUrl( 'Progdir:Assets/send.ogg' ) );

window.addEventListener( 'focus', function()
{
	Application.holdConnection( 'refresh' );
} );
window.addEventListener( 'visibilitychange', function()
{
	if( document.visibilityState == 'visible' )
	{
		Application.holdConnection( 'refresh' );
	}
} );

Application.run = function( msg )
{
	this.holdConnection( { method: 'messages', roomType: 'jeanie' } );
	// We loaded!
	this.sendMessage( { command: 'app-ready' } );
} 

function initVideoCall( peerId )
{
	let v = document.querySelector( '.Videocall' );
	if( v )
	{
		window.currentPeerId = peerId;
		v.onclick();
	}
}

Application.receiveMessage = function( msg )
{
    if( msg.sender )
    {
    	if( document.hidden || !document.body.classList.contains( 'activated' ) )
    	{
    		Sounds.newMessage.play();
    	}
        let overview = FUI.getElementByUniqueId( 'convos' );
        if( msg.type && msg.type == 'chatroom' && msg.uniqueId )
        {
        	overview.pollChatroom( msg.sender, msg.uniqueId );
        }
        else
        {
        	overview.activateDirectMessage( msg.sender, msg.message );
    	}
    }
    else if( msg.command == 'broadcast-call' )
    {
		let messages = FUI.getElementByUniqueId( 'messages' );
		if( messages )
		{
			messages.queueMessage( '<videocall type="video" callid="' + msg.peerId + '"/>' );
		}
    }
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
    else if( msg.command == 'broadcast-start' )
    {
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
    		console.log( '[Host] Received broadcast-start from client.' );
    		contacts.videoCall.sendMessage( { command: 'initcall', peerId: msg.peerId, remotePeerId: msg.remotePeerId } );
		}
    }
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
    	if( msg.type == 'invite' )
    	{
    		let overview = FUI.getElementByUniqueId( 'convos' );
    		Notify( {
    			title: i18n( 'i18n_you_got_an_invite' ),
    			text: i18n( 'i18n_please_check_your_messages' )
			}, false, function( e )
			{
				overview.initHome();
			} );
    	}
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
    }
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
						                'msg': '{"sender":"' + Application.fullName + '","message":"' + messages[ b ] + '","type":"chatroom","uniqueId":"' + musers[ b ] + '"}'
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
		                        'msg': '{"sender":"' + Application.fullName + '","message":"' + messages[ b ] + '"}'
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
				            mess.addMessages( js.messages );
				            if( mess.clearQueue ) mess.clearQueue();
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
