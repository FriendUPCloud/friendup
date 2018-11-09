/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Tree engine sound elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Sounds = Friend.Tree.Sounds || {};
Friend.Tree.Sounds.RenderItems = Friend.Tree.Sounds.RenderItems || {};


Friend.Tree.Sounds.Sound = function( tree, name, properties )
{
	this.destroyAtEnd = false;
	this.onEnd = false;
	this.onLoop = false;
	this.caller = false;
	this.volume = 1;
	this.loops = 1;
	this.soundName = '';
	Friend.Tree.Items.init( this, tree, name, 'Friend.Tree.Sounds.Sound', properties );
	this.setSound();
}

/**
 * play
 *
 * Plays a sound
 *
 * @param (string) name (optional) name of the sounbd to play. If not precised, will play the current sound
 * @param (number) loop (optional) number of times top play the sound, overwrites the default value (<=0: infinite, >0: number of times)
 * @param (number) volume (optional) volume of play, from 0 to 1, overwrites the default volume of the sound
 * @param (number) position (optional) where to play the sound from (default = 0)
 */

Friend.Tree.Sounds.Sound.setSound = function ()
{
 	this.sound = this.resources.getSound( this.soundName );
	if ( this.sound )
	{
		this.sound.volume = this.volume;
		this.sound.loop = this.loop;
		if ( this.destroyAtEnd || this.onEnd )
			this.sound.onEnd = onEnd;
		if ( this.onLoop )
			this.sound.onLoop = onLoop;
		var self = this;
		
		function onEnd()
		{
			if ( self.destroyAtEnd )
				self.destroy();
			if ( self.onEnd )
				self.caller[ self.onEnd ].apply( self.caller, [ self ] );
		}
		function onLoop()
		{
			if ( self.onLoop )
				self.caller[ self.onLoop ].apply( self.caller, [ self ] );
		}			
		return true;
	}
	Friend.Tree.log( this, { level: Friend.Tree.ERRORLEVEL_HIGH, error: 'Non existant sample: ' + this.soundName } );
	return false;
}

Friend.Tree.Sounds.Sound.play = function ()
{
	if ( this.sound )
		this.sound.play();
}

Friend.Tree.Sounds.Sound.messageUp = function ( message )
{
	return this.startProcess( message, [ 'soundName', 'volume', 'loop' ] );
};
Friend.Tree.Sounds.Sound.messageDown = function ( message )
{
	// Stop the sound if the item is destroyed
	if ( message.command == 'destroyed' )
	{
		if ( this.sound )
			this.sound.stop();
	}

	// Update changes from the processes
	this.endProcess( message, [ 'soundName', 'volume', 'loop' ] );
	if ( message.soundName == Friend.Tree.UPDATED )
		this.setSample();
	if ( message.sample == Friend.Tree.UPDATED )
		this.setVolume();
};

/**
 * stop
 *
 * Stops the current sound
 */
Friend.Tree.Sounds.Sound.stop = function ()
{
	if ( this.sound )
		this.sound.stop();
}

/**
 * isEnded
 *
 * Returns whether the sound is playing or stopped
 *
 * @return (boolean) true if the sound is playing, false if it is stopped
 */
Friend.Tree.Sounds.Sound.isEnded = function ()
{
	if ( this.sound )
		return this.sound.isEnded();
	return true;
}

/**
 * pause
 *
 * Pauses the current sound
 */
Friend.Tree.Sounds.Sound.pause = function ()
{
	if ( this.sound )
		this.sound.pause();
}

/**
 * mute
 *
 * Mutes the current sound
 */
Friend.Tree.Sounds.Sound.mute = function ()
{
	if ( this.sound )
		this.sound.mute();
}

/**
 * isMuted
 *
 * Checks if the sound is muted
 *
 * @return (boolean) true if muted, false if not
 */
Friend.Tree.Sounds.Sound.isMuted = function ()
{
	if ( this.sound )
		return this.sound.isMuted();
	return false;
}

/**
 * setVolume
 *
 * Sets the volume of the sound
 *
 * @param (number) volume volume level, from 0 to 1
 */
Friend.Tree.Sounds.Sound.setVolume = function ( volume )
{
	if ( typeof volume == 'undefined' )
		volume = this.volume;

	if ( this.sound )
		this.sound.setVolume( volume );
}

/**
 * getVolume
 *
 * Returns the current sound volume
 *
 * @return (number) the sound volume, from 0 to 1
 */
Friend.Tree.Sounds.Sound.getVolume = function ()
{
	if ( this.sound )
		return this.sound.getVolume();
	return 0;
}

/**
 * setPosition
 *
 * Sets the position of playback
 *
 * @param (number) position new position of playback, in seconds
 */
Friend.Tree.Sounds.Sound.setPosition = function ( position )
{
	if ( this.sound )
		this.sound.setPosition();
}

/**
 * getPosition
 *
 * Returns the current playback position
 *
 * @return (number) the current positionm in seconds
 */
Friend.Tree.Sounds.Sound.getPosition = function ()
{
	if ( this.sound )
		return this.sound.getPosition();
	return 0;
}

/**
 * getPlaybackRate
 *
 * Returns the current playback rate.
 *
 * @return (number) playback rate, 1 = normal speed, 0.5 = half speed, 2 = double speed etc.
 */
Friend.Tree.Sounds.Sound.getPlaybackRate = function ()
{
	if ( this.sound )
		return this.sound.getPlaybackRate();
	return 0;
}

/**
 * getPlaybackRate
 *
 * Returns the current playback rate. Please note that not all sound format allow rate change
 *
 * @param (number) playbackRate playback rate, 1 = normal speed, 0.5 = half speed, 2 = double speed etc.
 */
Friend.Tree.Sounds.Sound.setPlaybackRate = function ( playbackRate )
{
	if ( this.sound )
		this.sound.setPlaybackRate( playbackRate );
}
