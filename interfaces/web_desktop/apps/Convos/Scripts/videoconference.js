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
	answerVideoCall( conference, sender )
	{
		let self = this;
		
		let incomingPeerId = conference.peerId;
		let name = conference.name;
		let conferenceId = conference.id;
		
		if( !this.conferences[ conferenceId ] )
		{
			this.conferences[ conferenceId ] = {
				peerId: incomingPeerId,
				id: conferenceId,
				name: name,
				ownerId: conference.ownerId,
				participants: [ sender ]
			};
		}
		else
		{
			console.log( 'MAJOR ERROR!' );
		}
		
		let contacts = FUI.getElementByUniqueId( 'contacts' );
		
		let conf = this.conferences[ conferenceId ];
		
		conf.view = new View( {
			title: i18n( 'i18n_video_call' ) + ' - ' + conf.name,
			width: 650,
			height: 512
		} );
		
		conf.view.record = contacts.record;
		conf.view.onClose = function()
		{	
			// Say hang up!
			if( contacts.record.Type == 'chatroom' )
			{
				Application.SendChannelMsg( {
					command: 'broadcast-stop',
					peerId: conf.peerId
				} );
			}
			else
			{
				Application.SendUserMsg( {
					recipientId: sender.id,
					message: {
						command: 'broadcast-stop',
						peerId: conf.peerId
					}
				} );
			}
			
			self.remove( conf.id );
		}
		let f = new File( 'Progdir:Markup/videocall.html' );
		f.replacements = { 
			'remotePeerId': incomingPeerId, 
			'currentPeerId': '', 
			'conferenceId': conf.id,
			'ownerId': conf.ownerId,
			'conferenceName': conf.name 
		};
		f.i18n();
		f.onLoad = function( data )
		{
			conf.view.setContent( data );
		}
		f.load();
	}
	
	// Broadcast that you are starting a call on peerId to the current audience
	broadcastStart( conference )
	{
		let peerId = conference.peerId;
		let name = conference.name;
		let confId = conference.id;
		
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
					conference: {
						id: confId,
						name: name,
						peerId: peerId,
						ownerid: Application.uniqueId
					},
					sender: {
						id: Application.uniqueId,
						name: Application.fullName
					}
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
						conference: {
							id: confId,
							name: name,
							peerId: peerId,
							ownerId: Application.uniqueId
						},
						sender: {
							id: Application.uniqueId,
							name: Application.fullName
						}
					}
				} );
			}
		}
	}	
	
	// Accept incoming video on peerId and sender
	broadcastAccept( conference, sender )
	{
		let self = this;
		
		let peerId = conference.peerId;
		let name = conference.name;
		let conferenceId = conference.id;
		
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
    				self.answerVideoCall( conference, sender );
	    		}
    			// Say hang up!
	    		else
	    		{
					Application.SendUserMsg( {
						recipientId: sender.id,
						message: {
							command: 'broadcast-stop',
							peerId: peerId
						}
					} );
	    		}
    		} );
		}
	}
	
	// Client adds a user's connection and info
	addConnection( conferenceId, ownerId, user )
	{
		if( !this.conferences[ conferenceId ] ) return false;
			
		let conf = this.conferences[ conferenceId ];
			
		// Register peer id
		// Adds a user or updates it
		let found = false;
		for( let a in conf.participants )
		{
			if( conf.participants[ a ].id == user.id )
			{
				conf.participants[ a ] = user;
				found = true;
			}
		}
		if( !found )
			conf.participants.push( user );
		
		// Tell user to connect
		console.log( 'Invitee sends connect to host user id: ' + user.id );
		console.log( 'Hmm: ', conf );
		Application.SendUserMsg( {
			recipientId: ownerId,
			message: {
				command: 'broadcast-connect',
				userPeerId: user.peerId, // For verification
				conferenceId: conf.id
			}
		} );
	}
	
	connectToInvitee( conferenceId, userPeerId )
	{
		let conf = this.conferences[ conferenceId ];
		if( !conf ) return;
		console.log( '@Initialize call on user\'s peer: ' + userPeerId + ' (' + conferenceId + ')' );
		conf.view.sendMessage( { command: 'initcall', hostPeerId: conf.peerId, userPeerId: userPeerId } );
	}
}

