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
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'addmembers':
			if( msg.members )
			{
				var exist = ge( 'pMembers' ).value.split( ',' );
				var newst = msg.members.split( ',' );
				for( var a = 0; a < newst.length; a++ )
				{
					// Do we already have them?
					var found = false;
					for( var b = 0; b < exist.length; b++ )
					{
						if( exist[b] == newst[a] )
						{
							found = true;
							break;
						}
					}
					if( !found ) exist.push( newst[a] );
				}
				ge( 'pMembers' ).value = exist.join( ',' );
			}
			saveWorkgroup( refreshMembers );
			break;
	}
}

function refreshMembers( id )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var re = JSON.parse( d );
			var exist = re.Members;
			ge( 'pMembersListed' ).innerHTML = '';
			var out  = [];
			for( var a = 0; a < exist.length; a++ )
			{
				var o = document.createElement( 'option' );
				o.value = exist[a].ID;
				o.innerHTML = exist[a].FullName;
				ge( 'pMembersListed' ).appendChild( o );
				out.push( exist[a].ID );
			}
			ge( 'pMembers' ).value = out.join( ',' );
		}
	}
	m.execute( 'workgroupget', { id: ge( 'pWorkgroupID' ).value } );
}

function addMembers()
{
	var v = new View( {
		title: i18n( 'i18n_add_workgroup_members' ),
		width: 300,
		height: 400
	} );
	
	// Load the members template and popuplate it
	var f = new File( 'Progdir:Templates/workgroup_members.html' );
	f.replacements = {
		parentViewId: ge( 'viewId' ).value
	};
	f.i18n();
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

// Save a workgroup
function saveWorkgroup( callback )
{
	var o = {
		ID: ge( 'pWorkgroupID' ).value > 0 ? ge( 'pWorkgroupID' ).value : '0',
		Name: ge( 'pWorkgroupName' ).value,
		Members: ge( 'pMembers' ).value
	};

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			ge( 'pWorkgroupID' ).value = d;
		}
		if( callback ) callback();
		Application.sendMessage( { command: 'refreshworkgroups', destinationViewId: ge( 'parentViewId' ).value } );
	}
	
	if( o.ID > 0 )
	{
		m.execute( 'workgroupupdate', o );
	}
	else 
	{
		m.execute( 'workgroupadd', o );
	}
}

function cancelWorkgroup()
{
	Application.sendMessage( {
		type: 'view', method: 'close'
	} );
}

// Remove users from workgroup
function removeFromGroup()
{
	var opts = ge( 'pMembersListed' ).getElementsByTagName( 'option' );
	var ids = [];
	var idstr = [];
	for( var a = 0; a < opts.length; a++ )
	{
		if( opts[a].selected )
		{
			ids.push( opts[a] );
		}
		else idstr.push( opts[a].value );
	}
	ge( 'pMembers' ).value = idstr.join( ',' );
	for( var a = 0; a < ids.length; a++ )
		ids[a].parentNode.removeChild( ids[a] );
	saveWorkgroup();
}

