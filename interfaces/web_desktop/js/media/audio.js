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
AudioObject = function()
{
	this.audio = document.createElement ( 'audio' );
	
	// Load an audio file
	// TODO: Recognize friend doors!
	this.load = function( filename )
	{
		this.audio.src = filename;
		this.audio.load ();
	};
	// Let's add an event
	this.addEventListener = function( type, func )
	{
		this.audio.addEventListener( type, func );
	};
	this.play = function()
	{
		this.audio.play();
	};
	this.stop = function()
	{
		this.audio.stop();
	};
	this.pause = function()
	{
		this.audio.pause();
	};
	this.paused = function()
	{
		return this.audio.paused;
	}
};

