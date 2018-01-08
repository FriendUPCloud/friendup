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
/** @file
 *
 * Tree engine sounds items and processes
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/09/2017
 */
Friend = window.Friend || {};
Friend.Sounds = Friend.Sounds || {};
Friend.Flags = Friend.Flags || {};

/**
 * Item: Sound
 *
 * Plays a list of sound
 * To come: cool options like automatic 3D position of sound
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * name: (string) the name of one sound to play
 * names: (array of strings) list of sounds to play
 * currentSound: (optional) in case of multiple sounds, number of the current sound to play
 * destroyAtEnd: (boolean) true and the sound item will be destroyed at the end of the sound
 * onLoop: (optional) function to call when the sound loops
 * onEnd: (optional) function to call at the end of the sounds
 * caller: (optional) object to call at the end of the sounds
 */
Friend.Sounds.Sound = function( tree, name, flags )
{
	var self = this;
	this.sounds = [ ];
	this.currentSound = 0;
	this.destroyAtEnd = false;
	this.onEnd = false;
	this.onLoop = false;
	this.caller = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Sounds.Sound', flags );
	Object.assign( this, Friend.Sounds.Sound );

	if ( ! flags.names )
	{
		var sound = this.resources.getSound( name );
		if ( flags.volume )
			sound.volume = flags.volume;
		if ( flags.loop )
			sound.loop = flags.loop;
		if ( this.destroyAtEnd || this.onEnd )
			sound.onEnd = onEnd;
		if ( this.onLoop )
			sound.onLoop = onLoop;
		this.sounds.push( sound );
	}
	else
	{
		for ( var s = 0; s < flags.sounds.length; s ++ )
		{
			var sound = this.resources.getSound( flags.names[ s ] );
			if ( flags.sounds[ s ].volume )
				sound.volume = flags.sounds[ s ].volume;
			if ( flags.sounds[ s ].loop )
				sound.loop = flags.sounds[ s ].loop;
			if ( this.destroyAtEnd || this.onEnd )
				sound.onEnd = onEnd;
			if ( this.onLoop )
				sound.onLoop = onLoop;
			this.sounds.push( sound );
		}
	}

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
Friend.Sounds.Sound.play = function ( name, loop, volume, position )
{
	if ( name )
	{
		for ( var s = 0; s < this.sounds.length; s ++ )
		{
			if ( this.sounds[ s ].name == name )
			{
				this.currentSound = s;
				break;
			}
		}
	}
	if ( loop )
		this.sounds[ this.currentSound ].setLoop( loop );
	if ( volume )
		this.sounds[ this.currentSound ].setVolume( volume );
	if ( position )
		this.sounds[ this.currentSound ].setPosition( position );
	else
		this.sounds[ this.currentSound ].setPosition( 0 );
	this.sounds[ this.currentSound ].play();

	return this;
}
Friend.Sounds.Sound.processUp = function ( flags )
{
	// Stops sounds if objects is destroyed or at end
	if ( flags.command )
	{
		if ( flags.itemEvent == this && ( flags.command == 'quit' || flags.command == 'destroy' ) )
		{
			for ( var s = 0; s < this.sounds.length; s++ )
				this.sounds[ s ].stop();
		}
	}
	return this.startProcess( flags, [ 'sounds' ] );
};
Friend.Sounds.Sound.processDown = function ( flags )
{
	return this.endProcess( flags, [ 'sounds' ] );
};

/**
 * stop
 *
 * Stops the current sound
 */
Friend.Sounds.Sound.stop = function ()
{
	this.sounds[ this.currentSound ].stop();
}

/**
 * isEnded
 *
 * Returns whether the sound is playing or stopped
 *
 * @return (boolean) true if the sound is playing, false if it is stopped
 */
Friend.Sounds.Sound.isEnded = function ()
{
	return this.sounds[ this.currentSound ].isEnded();
}

/**
 * pauyse
 *
 * Pauses the current sound
 */
Friend.Sounds.Sound.pause = function ()
{
	this.sounds[ this.currentSound ].pause();
}

/**
 * mute
 *
 * Mutes the current sound
 */
Friend.Sounds.Sound.mute = function ()
{
	this.sounds[ this.currentSound ].mute();
}

/**
 * isMuted
 *
 * Checks if the sound is muted
 *
 * @return (boolean) true if muted, false if not
 */
Friend.Sounds.Sound.isMuted = function ()
{
	return this.sounds[ this.currentSound ].isMuted();
}

/**
 * setVolume
 *
 * Sets the volume of the sound
 *
 * @param (number) volume volume level, from 0 to 1
 */
Friend.Sounds.Sound.setVolume = function ( volume )
{
	this.sounds[ this.currentSound ].setVolume( volume );
}

/**
 * getVolume
 *
 * Returns the current sound volume
 *
 * @return (number) the sound volume, from 0 to 1
 */
Friend.Sounds.Sound.getVolume = function ()
{
	return this.sounds[ this.currentSound ].getVolume();
}

/**
 * setPosition
 *
 * Sets the position of playback
 *
 * @param (number) position new position of playback, in seconds
 */
Friend.Sounds.Sound.setPosition = function ( position )
{
	this.sounds[ this.currentSound ].setPosition();
}

/**
 * getPosition
 *
 * Returns the current playback position
 *
 * @return (number) the current positionm in seconds
 */
Friend.Sounds.Sound.getPosition = function ()
{
	return this.sounds[ this.currentSound ].getPosition();
}

/**
 * getPlaybackRate
 *
 * Returns the current playback rate.
 *
 * @return (number) playback rate, 1 = normal speed, 0.5 = half speed, 2 = double speed etc.
 */
Friend.Sounds.Sound.getPlaybackRate = function ()
{
	return this.sounds[ this.currentSound ].getPlaybackRate();
}

/**
 * getPlaybackRate
 *
 * Returns the current playback rate. Please note that not all sound format allow rate change
 *
 * @param (number) playbackRate playback rate, 1 = normal speed, 0.5 = half speed, 2 = double speed etc.
 */
Friend.Sounds.Sound.setPlaybackRate = function ( playbackRate )
{
	this.sounds[ this.currentSound ].setPlaybackRate( playbackRate );
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Process: plays a sound when a key is down
 *
 * Add this process to a sound item to have automatic playing when a key is pressed
 *
 * @param { object } tree The tree object
 * @param { object } object The object to modifiy
 * @param { object } flags Creation flags
 *
 * Flags
 *
 * key: (number) Controller identifier of the key to poll
 * keys: (array of numbers) List of Controller keys to poll
 * keepAtEnd: (boolean) true and the sound will be left playin when the key is released, false and the sound will be stopped
 */
Friend.Sounds.SoundPlayWhenKeydown = function( tree, object, flags )
{
	this.key = false;
	this.keys = false;
	this.keepAtEnd = false;
	Friend.Tree.Processes.init( this, tree, object, 'Friend.Sounds.SoundPlayWhenKeydown', flags );
	Object.assign( this, Friend.Sounds.SoundPlayWhenKeydown );

	this.down = false;
	this.sound = this.resources.getSound( this.sound );
	if ( this.key )
		this.keys.push( this.key );
}
Friend.Sounds.SoundPlayWhenKeydown.processUp = function ( flags )
{
	if ( ! flags.command )
 	{
		var down = false;
		for ( var key = 0; key < this.keys.length; key ++ )
		{
			if ( this.controller.isDown( this.keys[ key ] ) )
			{
				down = true;
				break;
			}
		}
		if ( down )
		{
			if ( ! this.down )
			{
				this.down = true;
				this.object.play();
			}
		}
		else
		{
			if ( this.down && ! this.keepAtEnd )
				this.object.stop();
			this.down = false;
		}
	}
	return flags;
};
Friend.Sounds.SoundPlayWhenKeydown.processDown = function ( flags )
{
	return flags;
}
