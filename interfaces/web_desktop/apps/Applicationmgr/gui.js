/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return false;
	
	switch( msg.command )
	{
		case 'apps':
			this.refreshApps( msg.data );
			break;
	}
}

Application.refreshApps = function( data )
{
	var tasks = ge( 'tasks' );
	
	// Populate with new tasks!
	var eles = tasks.getElementsByTagName( 'div' );
	for( var a = 0; a < data.length; a++ )
	{
		var found = false;
		for( var b = 0; b < eles.length; b++ )
		{
			if( eles[b].getAttribute( 'name' ) == data[a].id )
			{
				found = true;
				break;
			}
		}
		if( found ) continue;
		var d = document.createElement( 'div' );
		d.className = '';
		d.setAttribute( 'name', data[a].id );
		d.innerHTML = '<button onclick="Application.sendMessage( { type: \'system\', command: \'kill\', appId: \'' + data[a].id + '\' } )" class="FloatRight IconSmall fa-close"></button><h4 class="Padding">' + data[a].name + '</h4><div style="clear: both"></div>';
		
		tasks.appendChild( d );
	}
	
	// Remove obsolete tasks!
	eles = tasks.getElementsByTagName( 'div' );
	var remove = [];
	for( var a = 0; a < eles.length; a++ )
	{
		var found = false;
		for( var b = 0; b < data.length; b++ )
		{
			if( data[b].id == eles[a].getAttribute( 'name' ) )
			{
				found = true;
				break;
			}
		}
		if( !found ) remove.push( eles[a] );
	}
	for( var a = 0; a < remove.length; a++ )
		remove[a].parentNode.removeChild( remove[a] );
}

