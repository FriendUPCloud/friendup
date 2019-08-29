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
	m.execute( 'software', {'mode':'showall'} );
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

