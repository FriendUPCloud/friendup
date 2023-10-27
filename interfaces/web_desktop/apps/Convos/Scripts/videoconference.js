/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class VideoConference
{
	constructor( userRecord = false )
	{
		let self = this;
		
		// Key chain of conferences
		this.conferences = {};
		
		// Some options
		this.options = {
			screenCapture: false,
			ctx: userRecord
		};
		
		// Set up message listener
		function lstner( msg )
		{
			//console.log( 'What: ', msg );
		}
		this.lstner = lstner;
		window.addEventListener( 'message', lstner );
	}
	
	setContext( ctx )
	{
		this.options.ctx = ctx;
	}
	
	// Create a new conference, and open the conference view
	create( name = 'unnamed' )
	{
		let self = this;
		
		let conf = {
			id: md5( UniqueHash() ),
			name: name,
			participants: {},
			peerId: null
		}
		
		self.conferences[ conf.id ] = conf;
		
    	conf.view = new View( {
			title: i18n( 'i18n_video_call' ) + ' - ' + name,
			width: 650,
			height: 512
		} );
		
		conf.view.record = self.options.ctx;
		conf.view.onClose = function()
		{
			conf.view = null;
			
			// Say hang up!
			Application.SendChannelMsg( {
				command: 'broadcast-stop',
				peerId: conf.peerId
			} );
			
			self.remove( conf.id );
		}
		let f = new File( 'Progdir:Markup/videocall.html' );
		f.replacements = { 
			'conferenceId': conf.id, 
			'currentPeerId': '', 
			'remotePeerId': '', 
			'conferenceName': name 
		};
		f.i18n();
		f.onLoad = function( data )
		{
			conf.view.setContent( data );
		}
		f.load();
	}
	
	// Remove a conference
	remove( confId )
	{
		// Strip structure from memory
		let o = {};
		for( let a in this.conferences )
		{
			if( a == confId ) continue;
			o[ a ] = this.conferences[ a ];
		}
		this.conferences = o;
	}
	
	// Answer an incoming call
	answerVideoCall( incomingPeerId, name, conferenceId, sender )
	{
		let contacts = FUI.getElementByUniqueId( 'contacts' );
		if( contacts.videoCall )
			contacts.videoCall.close();
		
		if( !this.conferences[ conferenceId ] )
		{
			this.conferences[ conferenceId ] = {
				peerId: incomingPeerId,
				id: conferenceId,
				name: name,
				participants: [ sender ]
			};
		}
		
		let conf = this.conferences[ conferenceId ];
		
		contacts.videoCall = new View( {
			title: i18n( 'i18n_video_call' ) + ' - ' + conf.name,
			width: 650,
			height: 512
		} );
		
		contacts.videoCall.record = contacts.record;
		contacts.videoCall.onClose = function()
		{
			contacts.videoCall = null;
			
			// Say hang up!
			if( contacts.record.Type == 'chatroom' )
			{
				Application.SendChannelMsg( {
					command: 'broadcast-stop',
					peerId: window.currentPeerId
				} );
			}
			else
			{
				Application.SendUserMsg( {
					recipientId: contacts.record.ID,
					message: {
						command: 'broadcast-stop',
						peerId: window.currentPeerId
					}
				} );
			}
			
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
	
	// Broadcast that you are starting a call on peerId to the current audience
	broadcastStart( peerId, name, confId )
	{
		let messages = FUI.getElementByUniqueId( 'messages' );
		let contacts = FUI.getElementByUniqueId( 'contacts' );
		if( messages && contacts )
		{
			if( !this.conferences[ confId ] ) return false;
			
			// Register peer id
			this.conferences[ confId ].peerId = peerId;
		
			// Reach out to everybody in the group
			if( contacts.record.Type == 'chatroom' )
			{
				// Send "video start" to recipient!
				Application.SendChannelMsg( {
					command: 'broadcast-start',
					peerId: peerId,
					conferenceId: confId,
					conferenceName: name,
					senderId: Application.uniqueId,
					senderName: Application.fullName
				} );
			}
			// Reach out one person in the group
			else
			{
				// Send "video start" to recipient!
				Application.SendUserMsg( {
					recipientId: contacts.record.ID,
					message: {
						command: 'broadcast-start',
						peerId: peerId,
						conferenceId: confId,
						conferenceName: name,
						senderId: Application.uniqueId,
						senderName: Application.fullName
					}
				} );
			}
		}
	}	
	
	// Accept incoming video on peerId and sender
	broadcastAccept( peerId, name, conferenceId, sender )
	{
		let self = this;
		
    	let contacts = FUI.getElementByUniqueId( 'contacts' );
    	if( contacts )
    	{
    		Sounds.incomingCall.loop = true;
	    	Sounds.incomingCall.play();
    		Confirm( i18n( 'i18n_receive_video_call' ), sender.name + ' ' + i18n( 'i18n_receiving_video_desc' ), function( d )
    		{
    			Sounds.incomingCall.loop = false;
    			if( d && d.data )
    			{
    				contacts.setChatView( contacts.getContact( sender.id ) );
    				self.answerVideoCall( peerId, name, conferenceId, sender );
	    		}
    			// Say hang up!
	    		else
	    		{
					Application.SendUserMsg( {
						recipientId: msg.senderId,
						message: {
							command: 'broadcast-stop',
							peerId: peerId
						}
					} );
	    		}
    		} );
		}
	}
}

