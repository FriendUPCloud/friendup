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

Application.run = function( msg )
{
	GetScreenList();
	setInterval( function(){ GetScreenList(); }, 1000 );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( msg.command == 'addscreen' )
	{
		if( this.asd ) this.asd.close();
		var s = new Shell();
		s.onReady = function()
		{
			s.execute( 'enter System', function()
			{
				var sname = ( msg.name ? msg.name : 'unnamed' ).split( ' ' ).join( '_' );
				s.execute( 'ScreenOpen "Unnamed screen" ' + sname, function()
				{
					s.execute( 'ScreenActivate DoorsScreen', function()
					{
						s.close();
						GetScreenList();
						console.log( 'Done and now getting screen list.' );
					} );
				} );
			} );
		}
	}
}

var updating = false;

function GetScreenList()
{
	if( updating ) return;
	updating = true;
	
	var s = new Shell();
	s.onReady = function()
	{
		s.execute( 'enter System', function( data )
		{
			s.execute( 'ScreenList', function( data2 )
			{
				var sl = ge( 'ScreenList' );
								
				var eles = data2.data;
				var sw = 2;
				if( !sl.elements ) sl.elements = [];
				for( var a in eles )
				{
					// Don't add already existing
					var found = false;
					for( var b = 0; b < sl.elements.length; b++ )
					{
						if( sl.elements[b].sid == eles[a].ID )
						{
							found = true;
							break;
						}
					}
					if( found ) continue;
					
					var d = document.createElement( 'div' );
					sl.elements.push( d );
					d.className = 'Padding MousePointer List sw' + sw;
					d.innerHTML = eles[a].ID;
					d.sid = eles[a].ID;
					sl.appendChild( d );
					d.onclick = function(){ selectScreen( this ); };
				}
				// Switch classes in right order
				var sw = 2;
				for( var a = 0; a < sl.elements.length; a++ )
				{
					sw = sw == 1 ? 2 : 1;
					sl.elements[a].className = 'Padding MousePointer List sw' + sw;
				}
				s.close();
				updating = false;
			} );
		} );
	}
}


function addScreen()
{
	if( Application.asd ) return false;
	Application.asd = new View( {
		title: i18n( 'i18n_add_screen' ),
		width: 300,
		height: 80
	} );
	
	Application.asd.onClose = function(){ Application.asd = false; }
	
	var f = new File( 'Progdir:Templates/addscreen.html' );
	f.onLoad = function( data )
	{
		Application.asd.setContent( data );
	}
	f.load();
}

function closeScreen()
{
	if( Application.currentScreen )
	{
		if( Application.currentScreen == 'DoorsScreen' || Application.currentScreen == 'WorkspaceScreen' )
		{
			Alert( 'Protected screen', 'A protected screen can not be closed.' );
			return false;
		}
		var s = new Shell();
		s.onReady = function()
		{
			s.execute( 'enter System', function( )
			{
				s.execute( 'ScreenClose ' + Application.currentScreen, function()
				{
					s.close();
					var sl = ge( 'ScreenList' );
					var out = [];
					for( var a = 0; a < sl.elements.length; a++ )
					{
						if( sl.elements[a].sid == Application.currentScreen )
						{
							sl.removeChild( sl.elements[a] );
						}
						else out.push( sl.elements[a] );
					}
					Application.currentScreen = false;
					sl.elements = out;
					GetScreenList();
				} );
			} );
		}
	}
}

function selectScreen( scr )
{
	Application.currentScreen = scr.innerText;
	var sl = ge( 'ScreenList' );
	var dv = sl.elements;
	for( var a = 0; a < dv.length; a++ )
	{
		if( dv[a].sid == scr.innerText )
		{
			dv[a].classList.add( 'active' );
			setScreenGui( dv[a] );
		}
		else dv[a].classList.remove( 'active' );
	}
}

function setScreenGui( ele )
{
	ge( 'screen_id' ).value = ele.sid;
}


