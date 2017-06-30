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

Application.run = function( msg, iface )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		var software = JSON.parse( d );
		
		//console.log( software );
		
		var apps = false;
		
		var str = '';
		
		if ( software )
		{
			var sw = 1;
			
			str += '<table class="List">';
			
			for( key in software )
			{
				str += '<tr class="sw' + ( sw = sw == 1 ? 2 : 1 ) + '">';
				str += '<td>' + software[key].Name + ' (' + software[key].Category + ')</td><td style="width: 25px"><input type="checkbox" name="' + software[key].Name + '"/></td>';
				str += '</tr>';
			}
			
			ge( 'Apps' ).innerHTML = str;
		}
	}
	m.execute( 'software' );
}

// Add selected
function addSelected()
{
	var app = [];
	var eles = ge( 'Apps' ).getElementsByTagName( 'input' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].getAttribute( 'name' ) && eles[a].checked )
		{
			app.push( eles[a].getAttribute( 'name' ) );
		}
	}
	var op = {
		command: 'savesoftware',
		destinationViewId: ge( 'parentViewId' ).value,
		apps: app.join( ',' )
	};
	
	Application.sendMessage( op );
	
	cancelApps();
}

function cancelApps()
{
	Application.sendMessage( {
		type: 'view', method: 'close'
	} );
}

