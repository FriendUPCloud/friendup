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
				s.execute( 'ScreenOpen "Unnamed screen" ' + ( msg.name ? msg.name : 'unnamed' ), function()
				{
					s.execute( 'ScreenActivate DoorsScreen', function()
					{
						s.close();
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
				
				// First run!
				if( !sl.inited )
				{
					sl.innerHTML = '';
					var eles = data2.data;
					var sw = 2;
					var elements = [];
					for( var a = 0; a < eles.length; a++ )
					{
						var d = document.createElement( 'div' );
						d.className = 'Padding List sw' + sw;
						d.innerHTML = eles[a].ID;
						d.sid = eles[a].ID;
						sl.appendChild( d );
						d.onclick = function(){ selectScreen( this ); };
						elements.push( d );
						sw = sw == 1 ? 2 : 1;
					}
					sl.inited = true;
					sl.elements = elements;
				}
				// Update list
				else
				{
					// Reset touch
					for( var b = 0; b < sl.elements.length; b++ )
					{
						sl.elements[b].touched = false;
					}
					
					// check if there is one to add
					for( var a = 0; a < data2.data.length; a++ )
					{
						data2.data[a].found = false;
						var sw = 2;
						for( var b = 0; b < sl.elements.length; b++ )
						{
							if( sl.elements[b].sid == data2.data[a].ID )
							{
								data2.data[a].found = true;
								sl.elements[b].touched = true;
								break;
							}
							sw = sw == 1 ? 2 : 1;
						}
						// Add new elements!
						if( !data2.data[a].found )
						{
							var d = document.createElement( 'div' );
							d.className = 'Padding List sw' + sw;
							d.innerHTML = data2.data[a].ID;
							d.touched = true;
							d.onclick = function(){ selectScreen( this ); };
							sl.appendChild( d );
							sl.elements.push( d );
						}
					}
					
					// Remove obsolete and make correct sw class
					var out = [];
					sw = 2;
					for( var b = 0; b < sl.elements.length; b++ )
					{
						if( !sl.elements[b].touched )
						{
							sl.removeChild( sl.elements[b] );
						}
						else 
						{
							out.push( sl.elements[b] );
							if( sl.elements[b].className.indexOf( ' active' ) > 0 )
								sl.elements[b].className = 'Padding List sw' + sw + ' active';
							else sl.elements[b].className = 'Padding List sw' + sw;
							sw = sw == 1 ? 2 : 1;
						}
					}
					sl.elements = out;
				}
				// We're done updating
				updating = false;
				s.close();
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
			console.log( 'This screen is protected from closing.' );
			return false;
		}
		var s = new Shell();
		s.onReady = function()
		{
			s.execute( 'enter System', function( )
			{
				s.execute( 'ScreenClose ' + Application.currentScreen, function()
				{
					Application.currentScreen = false;
					GetScreenList();
					s.close();
				} );
			} );
		}
	}
}

function selectScreen( scr )
{
	Application.currentScreen = scr.innerText;
	var sl = ge( 'ScreenList' );
	var dv = sl.getElementsByTagName( 'div' );
	for( var a = 0; a < dv.length; a++ )
	{
		if( dv[a] == scr )
			dv[a].className = dv[a].className.split( ' active' ).join ( '' ) + ' active';
		else dv[a].className = dv[a].className.split( ' active' ).join ( '' );
	}
}

