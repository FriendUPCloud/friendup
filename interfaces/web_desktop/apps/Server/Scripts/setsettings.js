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
	this.propertycount = 0;
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'settings' )
	{
		this.settings = JSON.parse(  ('' + msg.settings).replace(/\r/g,'\\r').replace(/\n/g,'\\n')  );
		this.refreshSettings();
	}
}

Application.refreshSettings = function()
{
	var settings = this.settings;
	var ml = '';
	
	for(var key in settings)
	{
		ml += '<p class="Layout"><label for="#'+ key +'">Key: '+ key +'</label><br /><textarea id="'+ key +'" class="FullWidth serverinput">' + settings[key]  + '</textarea></p>';
		this.propertycount++;
	}
	ge( 'Settings' ).innerHTML = ml;
}

// Set permissions on the app
function setSettings( sid )
{
	var inps = ge( 'Settings' ).getElementsByClassName( 'serverinput' );

	var setts = {};
	for( var a = 0, b = 0; a < inps.length; a++ )
	{
		if( inps[a].getAttribute('id').indexOf( 'newpropkey' ) > -1 )
		{
			// try to find value
			var newkey = inps[a].value;
			var newval = false;
			var vi = ge( inps[a].getAttribute('id').replace('newpropkey','newpropvalue') );
			
			if( vi && vi.value )
			{
				newval = vi.value;
			}
			if( newval )
			{
				setts[ newkey ] = newval;
			}
		}
		else if( inps[a].getAttribute('id').indexOf( 'newpropvalue' ) > -1 )
		{
			// we do nothing here	
		}
		else if( Trim( inps[a].value ).length > 0 )
		{
			setts[ inps[a].getAttribute('id') ] = inps[a].value;
		}
		
		
	}

	//JSON.stringify sucks big time :( :/ :P
	var settkeys = Object.keys(setts);
	for( var i = 0; i < settkeys.length; i++)
	{
		setts[settkeys[i]] = setts[settkeys[i]].replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/"/g,'\\"');
	}

	Application.sendMessage( { 
		command:'saveserversetting', 
		settingsid:sid,
		settings:JSON.stringify(setts)
	});	
}

function addSetting()
{
	Application.propertycount++;
	
	document.getElementById( 'Settings' ).innerHTML += '<p class="Layout"><hr /><label for="#newpropkey'+ Application.propertycount +'">Key</label><br /><input  class="FullWidth serverinput" placeholder="Enter new key here" type="text" id="newpropkey'+ Application.propertycount +'"  /><br /><label for="#newpropvalue'+ Application.propertycount +'">Value</label><br /><textarea  class="FullWidth serverinput" placeholder="Enter new value here" id="newpropvalue'+ Application.propertycount +'"></textarea></p>';
}

function doCancel( sid )
{
	Application.sendMessage( {
		command: 'cancelsettingswindow',
		settingsid: sid
	} );
}

