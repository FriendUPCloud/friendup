/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Simple audio object with global sound and balance control
SoundObject = function( filename, callback )
{
	var self = this;
	this.callback = callback;

	var file = new File( filename );
	file.onLoad = function( data )
	{
		// Check for error
		if ( typeof data == 'string' )
		{
			if( str.substr( 0, 19 ) == 'fail<!--separate-->' )
			{
				return;
			}
		}

		// Get the mimetype
		var ext, mime = 'audio/x-wav';
		var pos = filename.lastIndexOf( '.' );
		if ( pos )
		{
			ext = filename.substring( pos + 1 );
			switch ( ext.toLowerCase() )
			{
				case 'mp3':
					mime = 'audio/mpeg';
					break;
				case 'weba':
					mime = 'audio/webm';
					break;
				case 'ogg':
				case 'oga':
					mime = 'audio/ogg';
					break;
				case 'aac':
					mime = 'audio/aac';
					break;
				case 'wav':
					mime = 'audio/x-wav';
					break;			
			}
		}
		
		// Create the blob, load the image
		var arrayBufferView = new Uint8Array( data );
		var blob = new Blob( [ arrayBufferView ], { type: mime } );
		var urlCreator = window.URL || window.webkitURL;
		var url = urlCreator.createObjectURL( blob );

		self.audio = document.createElement ( 'audio' );
		self.audio.onloadeddata = function()
		{
			self.audio.onended = onEnded;
			self.audio.onplaying = onPlaying;
			self.audio.onpause = onPause;
			self.loops = 0;
			self.volume = 1;
			self.playing = false;
			self.paused = true;
			self.callback( true );
		}
		self.audio.src = url;
	};
	file.load( 'rb' );

	// On file loaded
	function loaded()
	{
		self.callback();
	}

	// On playing toggle values
	function onPlaying() 
	{
    	self.playing = true;
    	self.paused = false;
	}

	// On pause toggle values
	function onPause() 
	{
    	self.playing = false;
    	self.paused = true;
	}

	// When the sound ends
	function onEnded()
	{
		if ( self.loops > 0)
			self.loops--;
		if ( self.loops )
		{
			self.audio.currentTime = 0;
			self.audio.volume = self.volume;
			self.audio.play();
			if ( self.onLoop )
				self.onLoop( this );
		}
		else
		{
			if ( self.onEnd )
				self.onEnd( this );
		}
	};
	// Mute
	this.mute = function()
	{
		this.audio.muted = true;
	}
	this.isMuted = function()
	{
		return this.audio.muted;
	}
	// Playback rate of the sound
	this.setPlaybackRate = function( rate )
	{
		this.audio.playbackRate = rate;
	}
	this.getPlaybackRate = function( rate )
	{
		return this.audio.playbackRate;
	}
	// Position of the sound
	this.setPosition = function( position )
	{
		this.audio.currentTime = position;
	}
	this.getPosition = function( position )
	{
		return this.audio.currentTime;
	}
	// Volume of the sound
	this.setVolume = function( volume )
	{
		this.audio.volume = volume;
	}
	this.getVolume = function( volume )
	{
		return this.audio.volume;
	}
	// Add an event
	this.addEventListener = function( type, func )
	{
		this.audio.addEventListener( type, func );
	};
	// Control
	this.play = function()
	{
		if ( !this.playing )
		{
			this.audio.volume = this.volume;
			this.audio.play();
		}
	};
	this.stop = function()
	{
		if ( !this.paused )
		{
			this.audio.currentTime = 0;
			this.audio.pause();
		}
	};
	this.pause = function()
	{
		if ( !this.paused )
			this.audio.pause();
	};
	this.isPaused = function()
	{
		return this.paused;
	}
	this.isEnded = function()
	{
		return this.audio.ended;
	}
};

