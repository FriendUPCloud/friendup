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
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'addmembers':
			if( msg.members )
			{
				var exist = ge( 'pMembers' ).value ? ge( 'pMembers' ).value.split( ',' ) : [];
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

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			var re = JSON.parse( d );
			var exist = re.users;
			ge( 'pMembersListed' ).innerHTML = '';
			var out  = [];
			for( var a = 0; a < exist.length; a++ )
			{
				var o = document.createElement( 'option' );
				o.value = exist[a].id;
				o.innerHTML = exist[a].fullname;
				ge( 'pMembersListed' ).appendChild( o );
				out.push( exist[a].id );
			}
			ge( 'pMembers' ).value = out.join( ',' );
		}
	}
	f.execute( 'group', {'command':'listdetails','id':ge( 'pWorkgroupID' ).value} );
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

/* used only when adding a new workgroup here... */
function saveWorkgroup()
{
	var args = {
		id: ge( 'pWorkgroupID' ).value > 0 ? ge( 'pWorkgroupID' ).value : '0',
		parentid: ( ge( 'pWorkgroupParent' ) ? ge( 'pWorkgroupParent' ).value : '0' ),
		groupname: ge( 'pWorkgroupName' ).value,
		users: ge( 'pMembers' ).value
	};

	var f = new Library( 'system.library' );
	f.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			//ge( 'pWorkgroupID' ).value = d;
			Notify({'title':'Users','text':'Workgroup changes saved.'});

		}
		else
		{
			console.log('Error during workgroup update',e,d);
		}
	
		if( callback ) callback();
		
		if( args.id > 0 && tmp )
		{
			ApplyGroupSetup( args.id );
		}
		else
		{
			RefreshWorkgroups();
		}
		
	}
	

	console.log('sending this for saving',args);
	if( args.id > 0  )
		args.command ='update';
	else
		args.command ='create';
		
	f.execute( 'group', args );
}

function cancelWorkgroup()
{
	Application.sendMessage( {
		type: 'view', method: 'close'
	} );
}