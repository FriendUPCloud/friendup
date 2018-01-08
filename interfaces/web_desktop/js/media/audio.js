/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// Simple audio object with global sound and balance control
SoundObject = function( filename, callback )
{
	var self = this;
	this.audio = document.createElement ( 'audio' );
	this.callback = callback;

	// Load an audio file
	this.audio.src = filename;
	this.audio.onloadeddata = loaded;
	this.audio.load ();
	this.audio.onended = onEnded;
	this.audio.onplaying = onPlaying;
	this.audio.onpause = onPause;
	this.loops = 0;
	this.volume = 1;
	this.playing = false;
	this.paused = true;

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

