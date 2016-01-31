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

Application.run = function( msg, iface )
{
	
}

Application.editEntry = function( fdata )
{
	if( !fdata ) return;
	
	// Loading main gui
	var f = new File( 'Progdir:Templates/entry.html' );
	f.onLoad = function( dataResponse )
	{
		console.log( fdata );
	
		ge( 'Settings' ).innerHTML = dataResponse;
		
		// load custom gui, now that our entry.html is loaded...
		var cl = new Library( 'system.library' );
		cl.onExecuted = function( data )
		{
			// Get custom GUI from service
			
			console.log( data );
			ge( 'CustomGUI' ).innerHTML = data;
			
			// Get connected hosts
			
			console.log('---' + fdata.hosts );
			var lhosts = fdata.hosts.split(",");
			var list = '';
			for( var a=0 ; a < lhosts.length ; a++ )
			{
				list += '\
					<div class="Box MarginBottom" style="cursor: hand; cursor: pointer" onmouseover="this.className = this.className.split( \' BackgroundDefault ColorDefault\' ).join( \'\' ) + \' BackgroundLists ColorLists\'\" onmouseout="this.className = this.className.split( \' BackgroundLists ColorLists\' ).join( \'\' ) + \' BackgroundDefault ColorDefault\'\">\
						<div class="HRow">\
							<div class="FloatRight">\
							<input type="checkbox"/>\
						</div>\
						<div class="FloatLeft IconSmall fa-gears">&nbsp;</div>\
						<div class="FloatLeft">&nbsp;' + lhosts[ a ] + '</div>\
					</div>\
				</div>\
				';
			}
			// Set the list and select the first entry
			ge( 'ServicesHost' ).innerHTML = list;		
		}
		cl.execute( 'services/getwebgui', { serviceName: fdata.service } );
		
		console.log( document.title );
	}
	f.load();
}

// Set the list of services...
Application.setServicesList = function( data )
{
	var r = data.split( '<!--separate-->' );
		
	// Create new HTML data
	var list = '';
	var obj = JSON.parse( r[0] );
	
	Application.dataEntries = obj;

	for( var a in obj.Services )
	{
		var cl = '';

		list += '\
<div class="Box MarginBottom' + cl + '" style="cursor: hand; cursor: pointer" onclick="Application.receiveMessage( { command: \'entry\', service: \'' + obj.Services[ a ].Service + '\', data: \''+ a +'\', hosts: \''+ obj.Services[ a ].Hosts +'\' } )" onmouseover="this.className = this.className.split( \' BackgroundDefault ColorDefault\' ).join( \'\' ) + \' BackgroundLists ColorLists\'\" onmouseout="this.className = this.className.split( \' BackgroundLists ColorLists\' ).join( \'\' ) + \' BackgroundDefault ColorDefault\'\">\
	<div class="HRow">\
		<div class="FloatRight">\
			<input type="checkbox" ' + ( obj.Services[ a ].Active ? ' checked="checked"' : '' ) + ' onclick="Application.sendMessage( { command: \'toggle\', id: \'' + obj.Services[ a ].Service + '\' } )"/>\
		</div>\
		<div class="FloatLeft IconSmall fa-gears">&nbsp;</div>\
		<div class="FloatLeft">&nbsp;' + obj.Services[ a ].Service + '</div>\
	</div>\
</div>\
		';
	}
	// Set the list and select the first entry
	ge( 'Services' ).innerHTML = list;
	
	// Activate first entry
	this.editEntry( { service: Application.dataEntries.Services[ 0 ].Service, data: 0, hosts: obj.Services[ a ].Hosts } );
}

// Get messages!
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'entry':
			console.log('-->' + msg.hosts );
			this.editEntry( { service: msg.service, data: msg.data, hosts: msg.hosts } );
			break;
		case 'setserviceslist':
			this.setServicesList( msg.data );
			break;
	}
}


