/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for user workgroup management
Sections.accounts_workgroups = function( cmd, extra )
{
	
	switch( cmd )
	{
		
		case 'details':
			
			loading();
			
			break;
		
		case 'edit':
			
			if( extra && extra.id && extra._this )
			{
				edit( extra.id, extra._this );
			}
			
			break;
		
		case 'create':
			
			create();
			
			break;
		
		case 'update':
			
			if( extra && extra.id && extra.value )
			{
				update( extra.id, extra.value );
			}
			
			break;
		
		case 'update_role':
			
			if( extra && extra.rid && extra.groupid && extra._this )
			{
				updateRole( extra.rid, extra.groupid, extra._this );
			}
			
			break;
		
		case 'remove':
			
			if( extra )
			{
				remove( extra );
			}
			
			break;
		
		case 'refresh':
			
			initMain();
			
			break;
		
		default:
			
			initMain();
			
			break;
		
	}
	
	
	
	// read --------------------------------------------------------------------------------------------------------- //
	
	function list( callback, id )
	{
		
		if( callback )
		{
			if( id )
			{
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( { e:e , d:d } );
				
					if( e == 'ok' && d )
					{
						try
						{
							var data = JSON.parse( d );
						
							if( data )
							{
								return callback( true, data );
							}
						} 
						catch( e ){ } 
					}
				
					return callback( false, false );
				}
				f.execute( 'group', { command: 'listdetails', id: id } );
			}
			else
			{
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( { e:e , d:d } );
				
					if( e == 'ok' && d )
					{
						try
						{
							var data = JSON.parse( d );
						
							if( data.groups )
							{
								return callback( true, data.groups );
							}
						} 
						catch( e ){ } 
					}
				
					return callback( false, false );
				}
				f.execute( 'group', { command: 'list' } );
			}
			
			return true;
		}
		
		return false;
		
	}
	
	function edit( id, _this )
	{
		
		var pnt = _this.parentNode;
		
		var edit = pnt.innerHTML;
		
		var buttons = [ 
			{ 'name' : 'Save',   'icon' : '', 'func' : function()
				{ 
					Sections.accounts_workgroups( 'update', { id: id, value: ge( 'WorkgroupName' ).value } ) 
				} 
			}, 
			{ 'name' : 'Delete', 'icon' : '', 'func' : function()
				{ 
					Sections.accounts_workgroups( 'remove', id ) 
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
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		
		var f = new Library( 'system.library' );
		f.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			Sections.accounts_workgroups( 'refresh' ); 
		}
		f.execute( 'group', {
			command: 'create', 
			groupname: 'Unnamed workgroup' 
		} );
		
	}
	
	function update( id, input )
	{
		
		var f = new Library( 'system.library' );
		f.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			Sections.accounts_workgroups( 'refresh' ); 
		}
		f.execute( 'group', {
			command: 'update', 
			id: id, 
			groupname: input 
		} );
		
	}
	
	function updateRole( rid, groupid, _this )
	{
		
		var data = '';

		if( _this )
		{
			Toggle( _this, function( on )
			{
				data = ( on ? 'Activated' : '' );
			} );
		}
		
		if( rid && groupid )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
			}
			m.execute( 'userroleupdate', { id: rid, groupid: groupid, data: data, authid: Application.authId } );
		}
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		
		Confirm( i18n( 'i18n_deleting_workgroup' ), i18n( 'i18n_deleting_workgroup_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( { e:e, d:d } );
					
					Sections.accounts_workgroups( 'refresh' ); 
				}
				f.execute( 'group', { command: 'delete', id: id } );		
			}
		} );
		
	}
	
	
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading()
	{
		var info = {};
		
		// Go through all data gathering until stop
		var loadingSlot = 0;
		
		var loadingList = [
			
			// Load workgroupinfo
			
			function()
			{
								
				list( function( e, d )
				{
					
					info.workgroup = null;
					
					if( e && d )
					{
						info.workgroup = d;
					
						loadingList[ ++loadingSlot ]( info );
					}
					else return;
					
				}, extra );
				
			},
			
			// Get workgroup's roles
			
			function( info )
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					info.roles = null;
					console.log( { e:e, d:d } );
					if( e == 'ok' )
					{
						try
						{
							info.roles = JSON.parse( d );
						}
						catch( e ){ }
					}
					loadingList[ ++loadingSlot ]( info );
				}
				u.execute( 'userroleget', { groupid: info.workgroup.groupid, authid: Application.authId } );
			},
			
			function( info )
			{
				if( typeof info.workgroup == 'undefined' && typeof info.roles == 'undefined' ) return;
				
				initDetails( info );
			}
			
		];
		
		loadingList[ 0 ]();
		
		return;
	}
	
	// Show the form
	function initDetails( info )
	{
		var workgroup = info.workgroup;
		var roles = info.roles;
		
			
		// Roles
		var rstr = '';
		
		if( roles && roles.length )
		{
			for( var a in roles )
			{
				rstr += '<div class="HRow">';
				rstr += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + roles[a].Name + '</div>';
				rstr += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
				rstr += '<button onclick="Sections.accounts_workgroups(\'update_role\',{rid:'+roles[a].ID+',groupid:'+workgroup.groupid+',_this:this})" class="IconButton IconSmall ButtonSmall FloatRight' + ( roles[a].WorkgroupID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
				rstr += '</div>';
				rstr += '</div>';
			}
		}
		
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_workgroup_details.html' );
		
		// Add all data for the template
		d.replacements = {
			id: workgroup.groupid,
			workgroup_name: workgroup.name,
			workgroup_description: ( workgroup.description ? workgroup.description : '' ),
			roles: rstr
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'WorkgroupDetails' ).innerHTML = data;
			
			// Responsive framework
			Friend.responsive.pageActive = ge( 'WorkgroupDetails' );
			Friend.responsive.reinit();
		}
		d.load();
	}
	
	
	
	
	function initMain()
	{
		var checkedGlobal = Application.checkAppPermission( 'PERM_WORKGROUP_GLOBAL' );
		var checkedWorkgr = Application.checkAppPermission( 'PERM_WORKGROUP_WORKGROUP' );
		
		if( checkedGlobal || checkedWorkgr )
		{
			
			// Get the user list
			list( function( e, d )
			{
				console.log( { e:e, d:d } );
			
				//if( e != 'ok' ) return;
				var userList = null;
				try
				{
					userList = d;
				}
				catch( e )
				{
					//return;
				}
				
				var o = ge( 'WorkgroupList' );
				o.innerHTML = '';
			
				// Types of listed fields
				var types = {
					edit: '10',
					name: '80'
				};
			
			
				// List by level
				var levels = [ 'User' ];
			
			
				var h2 = document.createElement( 'h2' );
				h2.innerHTML = i18n( 'i18n_workgroups' );
				o.appendChild( h2 );
			
				// List headers
				var header = document.createElement( 'div' );
				header.className = 'List';
				var headRow = document.createElement( 'div' );
				headRow.className = 'HRow sw1';
				for( var z in types )
				{
					var borders = '';
					var d = document.createElement( 'div' );
					if( z != 'edit' )
						borders += ' BorderRight';
					if( a < userList.length - a )
						borders += ' BorderBottom';
					var d = document.createElement( 'div' );
					d.className = 'PaddingSmall HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
					d.innerHTML = '<strong>' + ( z != 'Edit' ? z : '' ) + '</strong>';
					headRow.appendChild( d );
				}
			
				var d = document.createElement( 'div' );
				d.className = 'PaddingSmall HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
				d.innerHTML = '<strong>(+)</strong>';
				d.onclick = function()
				{
					Sections.accounts_workgroups( 'create' );
				};
				headRow.appendChild( d );
			
				header.appendChild( headRow );
				o.appendChild( header );
			
				function setROnclick( r, uid )
				{
					r.onclick = function()
					{
						Sections.accounts_workgroups( 'details', uid );
					}
				}
			
				var list = document.createElement( 'div' );
				list.className = 'List';
				var sw = 2;
				for( var b = 0; b < levels.length; b++ )
				{
					if( userList )
					{
						for( var a = 0; a < userList.length; a++ )
						{
							// Skip irrelevant level
							//if( userList[ a ].Level != levels[ b ] ) continue;
							
							// Use this way to sort the list until role permission has been implemented in FriendCore calls ...
							if( !checkedGlobal && checkedWorkgr )
							{
								var found = false;
								
								for( var i in checkedWorkgr )
								{
									if( checkedWorkgr[ i ] && checkedWorkgr[ i ].Data && checkedWorkgr[i].Data == userList[ a ].parentid )
									{
										found = true;
									}
								}
								
								if( !found )
								{
									continue;
								}
							}
							
							sw = sw == 2 ? 1 : 2;
							var r = document.createElement( 'div' );
							setROnclick( r, userList[ a ].ID );
							r.className = 'HRow sw' + sw;
			
							var icon = '<span class="IconSmall fa-user"></span>';
							userList[ a ][ 'edit' ] = icon;
				
							for( var z in types )
							{
								var borders = '';
								var d = document.createElement( 'div' );
								if( z != 'edit' )
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
				}
			
				o.appendChild( list );
			
				Friend.responsive.pageActive = ge( 'WorkgroupList' );
				Friend.responsive.reinit();
			} );
			
		}
		else
		{
			var o = ge( 'WorkgroupList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
		}
		
	}
	
};







/*

Sections.userroleupdate = function( rid, input, perms )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ) } );
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
			console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input } );
	}
};*/

//console.log( 'Sections.userroleadd =', Sections.userroleadd );
//console.log( 'Sections.userroledelete =', Sections.userroledelete );
//console.log( 'Sections.userroleupdate =', Sections.userroleupdate );
//console.log( 'Sections.accounts_roles =', Sections.accounts_roles );
//console.log( 'Sections.checkpermission =', Sections.checkpermission );

