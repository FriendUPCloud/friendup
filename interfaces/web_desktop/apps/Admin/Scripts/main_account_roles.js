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
	if( cmd )
	{
		if( cmd == 'edit' )
		{
			var info = {};
			
			// Go through all data gathering until stop
			var loadingSlot = 0;
			
			var loadingList = [
				
				// Load roleinfo
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						info.role = null;
						if( e != 'ok' ) return;
						
						try
						{
							info.role = JSON.parse( d );
						}
						catch( e )
						{
							return;
						}
						
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'userroleget', { id: extra, authid: Application.authId } );
				},
				
				// Load system permissions
				function()
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						info.permission = null;
						if( e != 'ok' ) return;
						
						try
						{
							info.permission = JSON.parse( d );
						}
						catch( e ) 
						{
							return;
						}
						loadingList[ ++loadingSlot ]( info );
					}
					m.execute( 'getsystempermissions', { authid: Application.authId } );
				},
				
				// Load workgroups
				function()
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						info.workgroups = null;
						//if( e != 'ok' ) return;
						
						try
						{
							info.workgroups = JSON.parse( d );
						}
						catch( e )
						{
							return;
						}
						loadingList[ ++loadingSlot ]( info );
					}
					u.execute( 'workgroups', { authid: Application.authId } );
				},
				
				// Then, finally, show role details
				function( info )
				{
					if( typeof info.role == 'undefined' && typeof info.permission == 'undefined' && typeof info.workgroups == 'undefined' ) return;
					
					initRoleDetails( info );
				}
				
			];
			
			loadingList[ 0 ]();
			
			
			return;
		}
	}
	
	
	
	// Get the user list -------------------------------------------------------
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		//console.log( { e:e, d:d } );
		
		//if( e != 'ok' ) return;
		var roleList = null;
		try
		{
			roleList = JSON.parse( d );
		}
		catch( e )
		{
			//return;
		}
		
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		// Types of listed fields
		var types = {
			Edit: '10',
			Name: '80'
		};
		
		
		// List by level
		var levels = [ 'User' ];
		
		
		var h2 = document.createElement( 'h2' );
		h2.innerHTML = i18n( 'i18n_roles' );
		o.appendChild( h2 );
		
		// List headers
		var header = document.createElement( 'div' );
		header.className = 'List';
		var headRow = document.createElement( 'div' );
		headRow.className = 'HRow BackgroundNegativeAlt Negative PaddingTop PaddingBottom';
		for( var z in types )
		{
			var borders = '';
			var d = document.createElement( 'div' );
			if( z != 'Edit' )
				//borders += ' BorderRight';
			if( a < roleList.length - a )
				borders += ' BorderBottom';
			var d = document.createElement( 'div' );
			d.className = 'PaddingSmallLeft PaddingSmallRight HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
			if( z == 'Edit' ) z = '&nbsp;';
			d.innerHTML = '<strong' + ( z != '&nbsp;' ? '' : '' ) + '>' + ( z != '&nbsp;' ? i18n( 'i18n_header_' + z ) : '&nbsp;' ) + '</strong>';
			headRow.appendChild( d );
		}
		
		var d = document.createElement( 'div' );
		d.className = 'PaddingSmall HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
		
		d.innerHTML = '<button type="button" class="FullWidth IconSmall fa-plus NoBorders NoPadding IconButton Negative"> </button>';
		
		//d.innerHTML = '<button class="IconButton IconSmall ButtonSmall fa-plus-circle"></button>';
		
		d.onclick = function(){ Sections.userroleadd( 'Unnamed role' ) };
		headRow.appendChild( d );
		
		header.appendChild( headRow );
		o.appendChild( header );
		
		function setROnclick( r, uid )
		{
			r.onclick = function()
			{
				Sections.accounts_roles( 'edit', uid );
			}
		}
		
		// List out roles
		
		var list = document.createElement( 'div' );
		list.className = 'List';
		var sw = 2;
		for( var b = 0; b < levels.length; b++ )
		{
			if( roleList )
			{
				for( var a = 0; a < roleList.length; a++ )
				{
					sw = sw == 2 ? 1 : 2;
					var r = document.createElement( 'div' );
					setROnclick( r, roleList[ a ].ID );
					r.className = 'HRow ';
			
					var icon = '<span class="IconSmall fa-user"></span>';
					roleList[ a ][ 'Edit' ] = icon;
				
					for( var z in types )
					{
						var borders = '';
						var d = document.createElement( 'div' );
						if( z != 'Edit' )
						{
							d.className = '';
							//borders += ' BorderRight';
						}
						else d.className = 'TextCenter';
						//if( a < roleList.length - a )
						//	borders += ' BorderBottom';
						d.className += ' HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft PaddingSmall Ellipsis' + borders;
						d.innerHTML = ( roleList[a][ z ] ? roleList[a][ z ] : '-' );
						r.appendChild( d );
					}
			
					// Add row
					list.appendChild( r );
				}
			}
		}
		
		o.appendChild( list );
		
		Friend.responsive.pageActive = ge( 'RoleList' );
		Friend.responsive.reinit();
	}
	m.execute( 'userroleget', { authid: Application.authId } );
};



Sections.role_edit = function( id, _this )
{
	
	var pnt = _this.parentNode;
	
	var edit = pnt.innerHTML;
	
	var buttons = [ 
		{ 'name' : 'Save',   'icon' : '', 'func' : function()
			{ 
				Sections.userroleupdate( id, ge( 'RoleName' ).value ) 
			} 
		}, 
		{ 'name' : 'Delete', 'icon' : '', 'func' : function()
			{ 
				Sections.userroledelete( id ) 
			} 
		}, 
		{ 'name' : 'Cancel', 'icon' : '', 'func' : function()
			{ 
				pnt.innerHTML = edit 
			} 
		}
	];
	
	pnt.innerHTML = '';
	
	for( var i in buttons )
	{
		var b = document.createElement( 'button' );
		b.className = 'IconSmall FloatRight';
		b.innerHTML = buttons[i].name;
		b.onclick = buttons[i].func;
		
		pnt.appendChild( b );
	}
	
}



Sections.userroleadd = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleadd', { name: input, authid: Application.authId } );
	}
};

Sections.userroledelete = function( rid )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroledelete', { id: rid, authid: Application.authId } );
	}
};

Sections.userroleupdate = function( rid, input, perms, refresh )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
			
			// refresh details also ...
			if( refresh )
			{
				Sections.accounts_roles( 'edit', rid );
			}
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ), authid: Application.authId } );
	}
};

Sections.removepermission = function( rid, pem, key, data, _this )
{
	if( rid && pem && key && _this )
	{
		var perms = [ { command: 'delete', name: pem, key: key, data: data } ];
		
		Confirm( i18n( 'i18n_deleting_permission' ), i18n( 'i18n_deleting_permission_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				Sections.userroleupdate( rid, null, perms, true );
			}
			
		} );
	}
};

Sections.addpermission = function( rid, key, _this )
{
	var pem  = ge( 'RolePermissionList_' + key ).value;
	
	if( ge( 'RoleParameterInput_' + key ) && ge( 'RoleParameterInput_' + key ).style.display != 'none' )
	{
		var data = ge( 'RoleParameterInput_' + key ).value;
	}
	else
	{
		var data = ge( 'RoleWorkgroupList_' + key ).value;
	}
	
	if( rid && key && pem && _this )
	{
		var perms = [ { name: pem, key: key, data: data } ];
		
		Sections.userroleupdate( rid, null, perms, true );
	}
};

Sections.updatepermission = function( rid, pem, key, data, _this )
{
	if( _this )
	{
		Toggle( _this, function( on )
		{
			data = ( on ? 'Activated' : '' );
		} );
	}
	
	if( rid && pem && key )
	{
		var perms = [ { name : pem, key : key, data : data } ];
		
		Sections.userroleupdate( rid, null, perms );
	}
};

Sections.checkpermission = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input, authid: Application.authId } );
	}
};



