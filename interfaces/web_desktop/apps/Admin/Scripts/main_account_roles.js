/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for user role management
Sections.accounts_roles = function( cmd, extra )
{
	
	
	// Get the user list
	var m = new Module( 'roles' );
	m.onExecuted = function( e, d )
	{
		console.log( { e:e, d:d } );
		
		if( e != 'ok' ) return;
		var userList = null;
		try
		{
			userList = JSON.parse( d );
		}
		catch( e )
		{
			return;
		}
		
		console.log( { e:e, d:userList } );
		
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		// Types of listed fields
		var types = {
			Edit: '10',
			Name: '30',
			Description: '60'
		};
		
		
		// List by level
		var levels = [ 'User' ];
		
		// List headers
		var header = document.createElement( 'div' );
		header.className = 'List';
		var headRow = document.createElement( 'div' );
		headRow.className = 'HRow sw1';
		for( var z in types )
		{
			var borders = '';
			var d = document.createElement( 'div' );
			if( z != 'Edit' )
				borders += ' BorderRight';
			if( a < userList.length - a )
				borders += ' BorderBottom';
			var d = document.createElement( 'div' );
			d.className = 'PaddingSmall HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
			d.innerHTML = '<strong>' + z + '</strong>';
			headRow.appendChild( d );
		}
		header.appendChild( headRow );
		o.appendChild( header );
		
		function setROnclick( r, uid )
		{
			r.onclick = function()
			{
				Sections.accounts_users( 'edit', uid );
			}
		}
		
		var list = document.createElement( 'div' );
		list.className = 'List';
		var sw = 2;
		for( var b = 0; b < levels.length; b++ )
		{
			for( var a = 0; a < userList.length; a++ )
			{
				// Skip irrelevant level
				//if( userList[ a ].Level != levels[ b ] ) continue;
				
				sw = sw == 2 ? 1 : 2;
				var r = document.createElement( 'div' );
				setROnclick( r, userList[ a ].ID );
				r.className = 'HRow sw' + sw;
			
				var icon = '<span class="IconSmall fa-user"></span>';
				userList[ a ][ 'Edit' ] = icon;
				
				for( var z in types )
				{
					var borders = '';
					var d = document.createElement( 'div' );
					if( z != 'Edit' )
					{
						d.className = '';
						borders += ' BorderRight';
					}
					else d.className = 'TextCenter';
					if( a < userList.length - a )
						borders += ' BorderBottom';
					d.className += ' HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft PaddingSmall Ellipsis' + borders;
					d.innerHTML = ( userList[a][ z ] ? userList[a][ z ] : '-' );
					r.appendChild( d );
				}
			
				// Add row
				list.appendChild( r );
			}
		}
		o.appendChild( list );
		
		Friend.responsive.pageActive = ge( 'RoleList' );
		Friend.responsive.reinit();
	}
	m.execute( 'userroleget' );
};



Sections.userroleadd = function( input )
{
	if( input )
	{
		var m = new Module( 'roles' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleadd', { name: input } );
	}
};

Sections.userroledelete = function( rid )
{
	if( rid )
	{
		var m = new Module( 'roles' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroledelete', { id: rid } );
	}
};

Sections.userroleupdate = function( rid, input, perms )
{
	if( rid )
	{
		var m = new Module( 'roles' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ) } );
	}
}

Sections.checkpermission = function( input )
{
	if( input )
	{
		var m = new Module( 'roles' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input } );
	}
}

console.log( 'Sections.userroleadd =', Sections.userroleadd );
console.log( 'Sections.userroledelete =', Sections.userroledelete );
console.log( 'Sections.userroleupdate =', Sections.userroleupdate );
console.log( 'Sections.accounts_roles =', Sections.accounts_roles );
console.log( 'Sections.checkpermission =', Sections.checkpermission );

