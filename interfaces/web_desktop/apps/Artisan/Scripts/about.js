/*******************************************************************************
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
*******************************************************************************/

var particles = [];
for ( var a = 0; a < 20; a++ )
{
	var j = document.createElement ( 'div' );
	j.x = Math.random () * 320;
	j.y = Math.random () * 174;
	j.s = ( Math.random () * 3 + 1 ) / 4;
	j.time = ( new Date () ).getTime ();
	j.style.position = 'absolute';
	j.style.top = Math.floor ( j.y ) + 'px';
	j.style.left = Math.floor ( j.x ) + 'px';
	j.style.width = '2px';
	j.style.height = '2px';
	j.style.background = '#D8D8D8';
	j.style.boxShadow = '0px 0px 10px 3px #D8D8D8';
	
	// Add to window
	document.body.appendChild ( j );
	particles.push ( j );
}

// Animation
think = function ()
{
	for ( var a = 0; a < 20; a++ )
	{
		var t = this.particles[a];
		var p = ( new Date () ).getTime ();
		// frameskip (25 fps)
		if ( p - t.time < 40 ) return;
		t.x += t.s; if ( t.x > 340 ) t.x = -30;
		t.y += t.s; if ( t.y > 184 ) t.y = -30;
		t.style.top = Math.floor ( t.y ) + 'px';
		t.style.left = Math.floor ( t.x ) + 'px';
	}
};

var intr = setInterval ( function () { think (); }, 50 );


