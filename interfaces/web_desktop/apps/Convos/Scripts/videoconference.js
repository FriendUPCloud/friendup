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
	
	// Create a new conference
	create()
	{
		let self = this;
		
		let conf = {
			id: md5( UniqueHash() ),
			name: 'unnamed',
			participants: {},
			peerId: null
		}
		
		self.conferences[ conf.id ] = conf;
		
    	conf.view = new View( {
			title: i18n( 'i18n_video_call' ) + ' - ' + self.options.ctx.Fullname,
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
		f.replacements = { 'conferenceId': conf.id, 'currentPeerId': '', 'remotePeerId': '' };
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
	
	
	answerVideoCall( incomingPeerId )
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
	
}

