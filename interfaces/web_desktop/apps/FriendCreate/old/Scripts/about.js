/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var particles = [];
for ( var a = 0; a < 20; a++ )
{
	var j = document.createElement ( 'div' );
	j.x = Math.random () * 320;
	j.y = Math.random () * 174;
	j.s = ( Math.random () * 3 + 1 ) / 2;
	j.time = ( new Date () ).getTime ();
	j.style.position = 'absolute';
	j.style.top = Math.floor ( j.y ) + 'px';
	j.style.left = Math.floor ( j.x ) + 'px';
	j.style.width = '2px';
	j.style.height = '2px';
	j.style.background = '#ffff99';
	j.style.boxShadow = '0px 0px 10px 3px #ff8800';
	
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


