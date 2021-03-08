/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	this.propertycount = 0;
}

Application.receiveMessage = function( msg )
{
	if( msg.command == 'settings' )
	{
		if( msg.settings && msg.settings.length )
		{
			this.settings = JSON.parse(  ('' + msg.settings).replace(/\r/g,'\\r').replace(/\n/g,'\\n')  );
		}
		else this.settings = null;
		this.refreshSettings();
	}
}

Application.refreshSettings = function()
{
	var settings = this.settings;
	var ml = '';
	
	if( settings )
	{
		for( var key in settings )
		{
			let settingData = '';
			if( typeof( settings[ key ] ) == 'string' )
				settingData = settings[key].replace(/\\\\/g,'\\');
			else settingData = settings[key] + '';
			ml += '<p class="Layout"><label class="MarginBottom" for="#'+ key +'">Key: '+ key +'</label><br /><textarea id="'+ key +'" class="FullWidth serverinput">' + settings[key] + '</textarea></p>';
			this.propertycount++;
		}
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
		setts[settkeys[i]] = setts[settkeys[i]].replace(/\\/g,'\\\\').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/"/g,'\\"');
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

