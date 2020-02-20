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
				// Specific for Pawel's code ... He just wants to forward json ...
				
				var args = JSON.stringify( {
					'type'    : 'read', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_WORKGROUP_GLOBAL', 
							'PERM_WORKGROUP_WORKGROUP' 
						]
					}, 
					'object'      : 'workgroup', 
					'objectid'    : id,
					'listdetails' : 'workgroup' 
				} );
				
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( { e:e , d:d, args: args } );
					
					if( e == 'ok' && d )
					{
						try
						{
							var data = JSON.parse( d );
							
							// Workaround for now .... until rolepermissions is correctly implemented in C ...
							
							console.log( '[2] ', data );
							
							if( data && data.data && data.data.details && data.data.details.group )
							{
								data = data.data.details.group;
							}
							
							if( data )
							{
								return callback( true, data );
							}
						} 
						catch( e ){ } 
					}
				
					return callback( false, false );
				}
				f.execute( 'group/listdetails', { id: id, authid: Application.authId, args: args } );
			}
			else
			{
				// Specific for Pawel's code ... He just wants to forward json ...
				
				var args = JSON.stringify( {
					'type'    : 'read', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_WORKGROUP_GLOBAL', 
							'PERM_WORKGROUP_WORKGROUP' 
						]
					}, 
					'listdetails' : 'workgroup' 
				} );
				
				var f = new Library( 'system.library' );
				f.onExecuted = function( e, d )
				{
					console.log( { e:e , d:d, args: args } );
				
					if( e == 'ok' && d )
					{
						try
						{
							var data = JSON.parse( d );
							
							// Workaround for now .... until rolepermissions is correctly implemented in C ...
							
							console.log( '[1] ', data );
							
							if( data && data.data && data.data.details && data.data.details.groups )
							{
								data = data.data.details;
							}
														
							if( data.groups )
							{
								return callback( true, data.groups );
							}
						} 
						catch( e ){ } 
					}
				
					return callback( false, false );
				}
				f.execute( 'group/list', { authid: Application.authId, args: args } );
			}
			
			return true;
		}
		
		return false;
		
	}
	
	function refresh( id, _this )
	{
		
		initMain();
		
		if( id )
		{
			edit( id, _this );
		}
		
	}
	
	function edit( id, _this )
	{
		
		if( _this )
		{
			// TODO: remove all other Selected in the list first ...
			
			var pnt = _this.parentNode.getElementsByTagName( 'div' );
			
			if( pnt )
			{
				for( var i in pnt )
				{
					if( pnt[i] && pnt[i].className )
					{
						pnt[i].classList.remove( 'Selected' );
					}
				}
			}
			
			_this.classList.add( 'Selected' );
		}
		
		loading( id );
		
	}
	
	function cancel()
	{
		
		console.log( 'cancel(  ) ' );

		if( ge( 'WorkgroupDetails' ) )
		{
			ge( 'WorkgroupDetails' ).innerHTML = '';
		}
		
		if( ge( 'WorkgroupList' ) )
		{
			var ele = ge( 'WorkgroupList' ).getElementsByTagName( 'div' );
			
			if( ele )
			{
				for( var i in ele )
				{
					if( ele[i] && ele[i].className )
					{
						ele[i].classList.remove( 'Selected' );
					}
				}
			}
		}
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		// Specific for Pawel's code ... He just wants to forward json ...
		
		var args = JSON.stringify( {
			'type'    : 'write', 
			'context' : 'application', 
			'authid'  : Application.authId, 
			'data'    : { 
				'permission' : [ 
					'PERM_WORKGROUP_GLOBAL', 
					'PERM_WORKGROUP_WORKGROUP' 
				]
			}
		} );
		
		var f = new Library( 'system.library' );
		f.onExecuted = function( e, d )
		{
			var data = {};
			
			try
			{
				data = JSON.parse( d );
			}
			catch( e ) {  }
			
			console.log( 'create() ', { e:e, d:(data?data:d), args: args } );
			
			if( e == 'ok' && d )
			{
				
				if( data && data.message )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: data.message } );
				}
				else if ( data && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: data.response } );
				}
				
				refresh( data.id );
				
			}
			
			// Allready exists ...
			
			else if( data && data.code == '69' && data.response )
			{
				Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
				if( ge( 'WorkgroupName' ) )
				{
					ge( 'WorkgroupName' ).focus();
				}
			}
			
			// Missing ...
			
			else if( data && data.code == '14' && data.response )
			{
				Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
				if( ge( 'WorkgroupName' ) )
				{
					ge( 'WorkgroupName' ).focus();
				}
			}
			
			// Other ...
			
			else
			{
				
				if( data && data.message )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: data.message } );
				}
				else if( data && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: data.response } );
				}
				else
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: d } );
				}
				
			}
			
		}
		f.execute( 'group/create', {
			groupname   : ( ge( 'WorkgroupName'        ) ? ge( 'WorkgroupName'   ).value : 'Unnamed workgroup' ), 
			description : ( ge( 'WorkgroupDescription' ) ? ge( 'WorkgroupDescription' ).value : ''             ),
			parentid    : ( ge( 'WorkgroupParent'      ) ? ge( 'WorkgroupParent' ).value : 0                   ),
			authid      : Application.authId,
			args        : args
		} );
		
	}
	
	function update( id )
	{
		
		// TODO: Add more stuff to update for a workgroup ...
		
		if( id )
		{
			
			// Specific for Pawel's code ... He just wants to forward json ...
			
			var args = JSON.stringify( {
				'type'    : 'write', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : [ 
						'PERM_WORKGROUP_GLOBAL', 
						'PERM_WORKGROUP_WORKGROUP' 
					]
				}, 
				'object'   : 'workgroup', 
				'objectid' : id
			} );
			
			// TODO: WHEN USERS START USING THIS REMEMBER TO UPDATE CODE TO SUPPORT ADDING AND REMOVING MEMBERS OF A WORKGROUP INSTEAD OF SENDING A LIST OF MEMBER ID'S BECAUSE A USER WITH ROLE PERMISSION MIGHT NOT HAVE ACCESS TO LIST ALL MEMBERS IN A WORKGROUP AND THE LIST WILL THEN BE WRONGLY OVERWRITTEN IN THE DATABASE !!!!
			
			var f = new Library( 'system.library' );
			f.onExecuted = function( e, d )
			{
				var data = {};
				
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) {  }
				
				console.log( { e:e, d:(data?data:d), args: {
					id          : ( id                                                                     ), 
					groupname   : ( ge( 'WorkgroupName'   ).value                                          ), 
					parentid    : ( ge( 'WorkgroupParent' ).value                                          ), 
					description : ( ge( 'WorkgroupDescription' ).value                                     ), 
					/*users     : ( ge( 'WorkgroupUsers'  ).value ? ge( 'WorkgroupUsers' ).value : 'false' ),*/
					authid      : ( Application.authId                                                     ), 
					args        : ( args                                                                   ) 
				} } );
				
				if( e == 'ok' && d )
				{
					
					if( data && data.message )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: data.message } );
					}
					else if ( data && data.response )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: data.response } );
					}
					
					//refresh( data.id );
					
					editMode( true );
				}
				
				else if( data && data.code == '69' && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
					if( ge( 'WorkgroupName' ) )
					{
						ge( 'WorkgroupName' ).focus();
					}
				}
				
				// Missing ...
				
				else if( data && data.code == '14' && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
					if( ge( 'WorkgroupName' ) )
					{
						ge( 'WorkgroupName' ).focus();
					}
				}
			
				// Other ...
				
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: data.message } );
					}
					else if ( data && data.response )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: data.response } );
					}
					else
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: d } );
					}
				
				}
				
				//Sections.accounts_workgroups( 'refresh' ); 
			}
			f.execute( 'group/update', {
				id          : ( id                                                                     ), 
				groupname   : ( ge( 'WorkgroupName'   ).value                                          ), 
				description : ( ge( 'WorkgroupDescription' ).value                                     ),
				parentid    : ( ge( 'WorkgroupParent' ).value                                          ),
				/*users     : ( ge( 'WorkgroupUsers'  ).value ? ge( 'WorkgroupUsers' ).value : 'false' ),*/
				authid    : ( Application.authId                                                       ),
				args      : ( args                                                                     )
			} );
			
		}
	}
	
	function addUser( uid, wid, callback, vars )
	{
		if( uid && wid )
		{
			var args = { 
				id     : wid, 
				users  : uid, 
				authid : Application.authId,
				args   : JSON.stringify( {
				'type'    : 'write', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : [ 
						'PERM_WORKGROUP_GLOBAL', 
						'PERM_WORKGROUP_WORKGROUP' 
					]
				}, 
				'object'   : 'workgroup', 
				'objectid' : wid 
				} )
			};
		
			var f = new Library( 'system.library' );
			f.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
			
				if( e == 'ok' )
				{
					if( callback ) callback( true, d, vars );
				}
				else
				{
					if( callback ) callback( false, d, vars );
				}
			}
			f.execute( 'group/addusers', args );
		}
	}
	
	function removeUser( uid, wid, callback, vars )
	{
		if( uid && wid )
		{
			var args = { 
				id     : wid, 
				users  : uid, 
				authid : Application.authId,
				args   : JSON.stringify( {
				'type'    : 'write', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : [ 
						'PERM_WORKGROUP_GLOBAL', 
						'PERM_WORKGROUP_WORKGROUP' 
					]
				}, 
				'object'   : 'workgroup', 
				'objectid' : wid 
				} )
			};
			
			var f = new Library( 'system.library' );
			f.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
			
				if( e == 'ok' )
				{
					if( callback ) callback( true, d, vars );
				}
				else
				{
					if( callback ) callback( false, d, vars );
				}
			}
			f.execute( 'group/removeusers', args );
		}
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
		
		/*Confirm( i18n( 'i18n_deleting_workgroup' ), i18n( 'i18n_deleting_workgroup_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{*/
				
				if( id )
				{
					
					// Specific for Pawel's code ... He just wants to forward json ...
					
					var args = JSON.stringify( {
						'type'    : 'delete', 
						'context' : 'application', 
						'authid'  : Application.authId, 
						'data'    : { 
							'permission' : [ 
								'PERM_WORKGROUP_GLOBAL', 
								'PERM_WORKGROUP_WORKGROUP' 
							]
						}, 
						'object'   : 'workgroup', 
						'objectid' : id
					} );
					
					var f = new Library( 'system.library' );
					f.onExecuted = function( e, d )
					{
						console.log( { e:e, d:d, args: args } );
					
						//Sections.accounts_workgroups( 'refresh' ); 
					
						refresh(); cancel();
					}
					f.execute( 'group/delete', { id: id, authid: Application.authId, args: args } );
					
				}
				
			/*}
		} );*/
		
	}
	
	// helper functions --------------------------------------------------------------------------------------------- //
	
	function appendChild( child )
	{
		if( child )
		{
			var out = [];
			
			for( var k in child )
			{
				if( child[k] )
				{
					if( child[k]['element'] )
					{
						var div = child[k]['element'];
						
						if( child[k]['child'] )
						{
							var elem = appendChild( child[k]['child'] );
							
							if( elem )
							{
								for( var i in elem )
								{
									if( elem[i] )
									{
										div.appendChild( elem[i] );
									}
								}
							}
						}
						
						out.push( div );
					}
				}
			}
			
			if( out )
			{
				return out;
			}
		}
		
		return false;
	}
	
	function removeBtn( _this, args, callback )
	{
		
		if( _this )
		{
			closeEdit();
			
			_this.savedState = { 
				className: _this.className, 
				innerHTML: _this.innerHTML, 
				onclick: ( _this.onclick ? _this.onclick : function () {} ) 
			}
			_this.classList.remove( 'IconButton' );
			_this.classList.remove( 'IconToggle' );
			_this.classList.remove( 'ButtonSmall' );
			_this.classList.remove( 'ColorStGrayLight' );
			_this.classList.remove( 'fa-minus-circle' );
			_this.classList.remove( 'fa-trash' );
			//_this.classList.remove( 'NegativeAlt' );
			_this.classList.remove( 'Negative' );
			//_this.classList.add( 'ButtonAlt' );
			_this.classList.add( 'Button' );
			_this.classList.add( 'BackgroundRed' );
			_this.id = ( _this.id ? _this.id : 'EditMode' );
			_this.innerHTML = ( args.button_text ? i18n( args.button_text ) : i18n( 'i18n_delete' ) );
			_this.args = args;
			_this.callback = callback;
			_this.onclick = function(  )
			{
				
				if( this.callback )
				{
					callback( this.args ? this.args : false );
				}
				
			};
		}
		
	}
	
	function editMode( close )
	{
		console.log( 'editMode() ', ge( 'GroupEditButtons' ) );
		
		if( ge( 'GroupEditButtons' ) )
		{
			ge( 'GroupEditButtons' ).className = ( close ? 'Closed' : 'Open' );
		}
	}
	
	function closeEdit()
	{
		if( ge( 'EditMode' ) )
		{
			if( ge( 'EditMode' ) && ge( 'EditMode' ).savedState )
			{
				if( typeof ge( 'EditMode' ).savedState.className != 'undefined' )
				{
					ge( 'EditMode' ).className = ge( 'EditMode' ).savedState.className;
				}
				if( typeof ge( 'EditMode' ).savedState.innerHTML != 'undefined' )
				{
					ge( 'EditMode' ).innerHTML = ge( 'EditMode' ).savedState.innerHTML;
				}
				if( typeof ge( 'EditMode' ).savedState.onclick != 'undefined' )
				{
					ge( 'EditMode' ).onclick = ge( 'EditMode' ).savedState.onclick;
				}
				ge( 'EditMode' ).removeAttribute( 'id' );
			}
		}
	}
	
	Application.closeAllEditModes = function( act )
	{
		
		if( act )
		{
			if( act.keycode )
			{
				
				switch ( act.keycode )
				{
					// Esc
					case 27:
					
						if( ge( 'GroupDeleteBtn' ) && ge( 'GroupDeleteBtn' ).savedState )
						{
							
							if( typeof ge( 'GroupDeleteBtn' ).savedState.className != 'undefined' )
							{
								ge( 'GroupDeleteBtn' ).className = ge( 'GroupDeleteBtn' ).savedState.className;
							}
							if( typeof ge( 'GroupDeleteBtn' ).savedState.innerHTML != 'undefined' )
							{
								ge( 'GroupDeleteBtn' ).innerHTML = ge( 'GroupDeleteBtn' ).savedState.innerHTML;
							}
							if( typeof ge( 'GroupDeleteBtn' ).savedState.onclick != 'undefined' )
							{
								ge( 'GroupDeleteBtn' ).onclick = ge( 'GroupDeleteBtn' ).savedState.onclick;
							}
							
						}
						
						closeEdit();
						
						break;
					default: break;
				}
				
			}
			
			if( act.targ )
			{
			
				if( ge( 'GroupDeleteBtn' ) && ge( 'GroupDeleteBtn' ).savedState )
				{
				
					if( act.targ.id != 'GroupDeleteBtn' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
					{
						
						if( typeof ge( 'GroupDeleteBtn' ).savedState.className != 'undefined' )
						{
							ge( 'GroupDeleteBtn' ).className = ge( 'GroupDeleteBtn' ).savedState.className;
						}
						if( typeof ge( 'GroupDeleteBtn' ).savedState.innerHTML != 'undefined' )
						{
							ge( 'GroupDeleteBtn' ).innerHTML = ge( 'GroupDeleteBtn' ).savedState.innerHTML;
						}
						if( typeof ge( 'GroupDeleteBtn' ).savedState.onclick != 'undefined' )
						{
							ge( 'GroupDeleteBtn' ).onclick = ge( 'GroupDeleteBtn' ).savedState.onclick;
						}
						
					}
					
				}
				
				if( ge( 'EditMode' ) && ge( 'EditMode' ).savedState )
				{
					
					if( act.targ.id != 'EditMode' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
					{
						closeEdit();
					}
					
				}
				
			}
		}
		
	}
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading( id )
	{
		console.log( 'loading( '+id+' )' );
		
		if( id )
		{
			var info = { ID: ( id ? id : 0 ) };
			
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
					
					}, id );
				
				},
				
				// Get all workgroups
				
				function()
				{
								
					list( function( e, d )
					{
					
						info.workgroups = null;
					
						if( e && d )
						{
							info.workgroups = d;
							
							loadingList[ ++loadingSlot ]( info );
						}
						else return;
					
					} );
				
				},
				
				// Get all users
				
				function()
				{
					
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						info.users = null;
						console.log( { e:e, d:d } );
						if( e == 'ok' )
						{
							try
							{
								info.users = JSON.parse( d );
							}
							catch( e ){ }
							
							console.log( 'info.users ', info.users );
						}
						loadingList[ ++loadingSlot ]( info );
					}
					m.execute( 'listusers', { authid: Application.authId } );
					
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
					if( typeof info.workgroup == 'undefined' ) return;
					
					initDetails( info );
				}
			
			];
		
			loadingList[ 0 ]();
		
			return;
		}
		else
		{
			var info = {};
			
			list( function( e, d )
			{
			
				info.workgroups = null;
			
				if( e && d )
				{
					info.workgroups = d;
					
					initDetails( info );
				}
				else return;
			
			} );
			
		}
	}
	
	// Show the form
	function initDetails( info )
	{
		var workgroup  = ( info.workgroup  ? info.workgroup  : {} );
		var workgroups = ( info.workgroups ? info.workgroups : [] );
		var roles      = ( info.roles      ? info.roles      : [] );
		var users      = ( workgroup.users ? workgroup.users : [] );
		var list       = ( info.users      ? info.users      : [] );
		
		console.log( 'initDetails() ', info );
		
		// Workgroups
		var pstr = '';
		
		if( workgroups && workgroups.length )
		{
			pstr += '<option value="0">none</option>';
			
			for( var w in workgroups )
			{
				if( workgroups[w] && workgroups[w].ID && workgroups[w].name )
				{
					if( workgroup && ( workgroups[w].ID == workgroup.groupid || workgroups[w].parentid == workgroup.groupid ) )
					{
						continue;
					}
					
					pstr += '<option value="' + workgroups[w].ID + '"' + ( workgroup && workgroup.parentid == workgroups[w].ID ? ' selected="selected"' : '' ) + '>' + workgroups[w].name + '</option>';
				}
			}
			
		}
		
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
			id                    : ( workgroup.groupid     ? workgroup.groupid     : ''                           ),
			workgroup_title       : ( workgroup.name        ? workgroup.name        : i18n( 'i18n_new_workgroup' ) ),
			workgroup_name        : ( workgroup.name        ? workgroup.name        : ''                           ),
			workgroup_parent      : pstr,
			workgroup_description : ( workgroup.description ? workgroup.description : ''                           ),
			roles                 : rstr
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'WorkgroupDetails' ).innerHTML = data;
			
			if( !info.ID )
			{
				ge( 'GroupDeleteBtn' ).style.display = 'none';
				
				
			}
			else
			{
				ge( 'GroupEditButtons' ).className = 'Closed';
				
				if( ge( 'WorkgroupBasicDetails' ) )
				{
					var inps = ge( 'WorkgroupBasicDetails' ).getElementsByTagName( '*' );
					if( inps.length > 0 )
					{
						for( var a = 0; a < inps.length; a++ )
						{
							if( inps[ a ].id && [ 'WorkgroupName', 'WorkgroupParent', 'WorkgroupDescription' ].indexOf( inps[ a ].id ) >= 0 )
							{
								( function( i ) {
									i.onclick = function( e )
									{
										editMode();
									}
								} )( inps[ a ] );
							}
						}
					}
				}
				
				ge( 'AdminUsersContainer' ).className = 'Open';
			}
			
			var bg1  = ge( 'GroupSaveBtn' );
			if( bg1 ) bg1.onclick = function( e )
			{
				// Save workgroup ...
				
				if( info.ID )
				{
					console.log( '// save workgroup' );
					
					update( info.ID );
				}
				else
				{
					console.log( '// create workgroup' );
					
					create();
				}
			}
			var bg2  = ge( 'GroupCancelBtn' );
			if( bg2 ) bg2.onclick = function( e )
			{
				if( info.ID )
				{
					edit( info.ID );
				}
				else
				{
					cancel(  );
				}
			}
			var bg3  = ge( 'GroupBackBtn' );
			if( bg3 ) bg3.onclick = function( e )
			{
				cancel(  );
			}
			
			var bg4  = ge( 'GroupDeleteBtn' );
			if( bg4 ) bg4.onclick = function( e )
			{
				
				// Delete workgroup ...
				
				if( info.ID )
				{
					console.log( '// delete workgroup' );
					
					removeBtn( this, { id: info.ID, button_text: 'i18n_delete_workgroup', }, function ( args )
					{
						
						remove( args.id );
						
					} );
					
				}
				
			}
			
			
			
			
			
			function onLoad ( data )
			{
					
				var func = {
					
					userids : function ( users )
					{
						var ids = {};
						
						if( users )
						{
							for( var a in users )
							{
								if( users[a] && users[a].id )
								{
									ids[ users[a].id ] = true;
								}
							}
						}
						
						return ids;
						
					}( users ),
					
					updateids : function ( mode, key, value )
					{
						
						switch( mode )
						{
							
							case 'users':
								
								if( key )
								{
									this.userids[ key ] = value;
								}
								
								if( ge( 'WorkgroupUsers' ) )
								{
									if( this.userids )
									{
										var arr = [];
										
										for( var a in this.userids )
										{
											if( this.userids[a] )
											{
												arr.push( a );
											}
										}
										
										ge( 'WorkgroupUsers' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
									}
								}
								
								break;
								
						}
						
					},
					
					mode : { users : 'list' },
					
					// Users --------------------------------------------------------------------------------------------
					
					users : function ( func )
					{
						
						// Editing Users
						
						var init =
						{
							
							func : this,
							
							ids  : this.userids,
							
							head : function ( hidecol )
							{
								var o = ge( 'UsersGui' ); o.innerHTML = '<input type="hidden" id="WorkgroupUsers">';
								
								this.func.updateids( 'users' );
								
								console.log( 'userids: ', this.ids );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft'  + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 FloatLeft Relative'  + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_username' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_status' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent15 FloatLeft Relative';
													return d;
												}()
											}
										]
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow Box Padding';
											d.id = 'UsersInner';
											return d;
										}()
									}
								] );
						
								if( divs )
								{
									for( var i in divs )
									{
										if( divs[i] && o )
										{
											o.appendChild( divs[i] );
										}
									}
								}
								
							},
							
							list : function (  )
							{
								
								this.func.mode[ 'users' ] = 'list';
								
								if( list )
								{
									this.head();
									
									var o = ge( 'UsersInner' ); o.innerHTML = '';
									
									for( var k in list )
									{
										if( list[k] && list[k].ID )
										{
											var found = false;
											
											if( this.ids && this.ids[ list[k].ID ] )
											{
												found = true;
											}
											
											if( !found || list[k].Status == 1 ) continue;
											
											var divs = appendChild( [
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'HRow';
														return d;
													}(),
													'child' : 
													[ 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																return d;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
																		d.className = 'IconSmall fa-user-circle-o avatar';
																		//d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		//d.style.backgroundSize = 'contain';
																		//d.style.width = '24px';
																		//d.style.height = '24px';
																		return d;
																	}(), 
																	 'child' : 
																	[ 
																		{
																			'element' : function() 
																			{
																				var d = document.createElement( 'div' );
																				if( list[k].Avatar )
																				{
																					d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																				}
																				return d;
																			}()
																		}
																	]
																}
															] 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent30 FloatLeft Ellipsis';
																d.innerHTML = '<strong>' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + ( list[k].Name ? list[k].Name : '' ) + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Ellipsis';
																//d.innerHTML = '<span>' + ( list[k].Status ? list[k].Status : '' ) + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent15 FloatLeft Ellipsis';
																return d;
																
															}(),
															'child' : 
															[ 
																{ 
																	'element' : function( ids, id, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																			
																			var pnt = this.parentNode.parentNode;
																			
																			removeBtn( this, { ids: ids, id: id, func: func, pnt: pnt }, function ( args )
																			{
																				
																				console.log( 'removeUser( '+args.id+', '+info.ID+', callback, vars )' );
																				
																				removeUser( args.id, info.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, false );
																						
																						if( vars.pnt )
																						{
																							vars.pnt.innerHTML = '';
																						}
																					}
																					else
																					{
																						console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { uid: args.id, func: func, pnt: pnt } );
																				
																			} );
																			
																		};
																		return b;
																	}( this.ids, list[k].ID, this.func ) 
																}
															]
														}
													]
												}
											] );
											
											if( divs )
											{
												for( var i in divs )
												{
													if( divs[i] && o )
													{
														o.appendChild( divs[i] );
													}
												}
											}
										}
									
									}
									
								}
									
							},
							
							edit : function (  )
							{
								
								this.func.mode[ 'users' ] = 'edit';
								
								if( list )
								{
									this.head( true );
									
									var o = ge( 'UsersInner' ); o.innerHTML = '';
									
									for( var k in list )
									{
										if( list[k] && list[k].ID )
										{
											var toggle = false;
											
											if( this.ids && this.ids[ list[k].ID ] )
											{
												toggle = true;
											}
											
											if( list[k].Status == 1 ) continue;
											
											var divs = appendChild( [
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'HRow';
														return d;
													}(),
													'child' : 
													[ 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent10 FloatLeft Ellipsis';
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
																		d.className = 'IconSmall fa-user-circle-o avatar';
																		//d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		//d.style.backgroundSize = 'contain';
																		//d.style.width = '24px';
																		//d.style.height = '24px';
																		return d;
																	}(), 
																	 'child' : 
																	[ 
																		{
																			'element' : function() 
																			{
																				var d = document.createElement( 'div' );
																				if( list[k].Avatar )
																				{
																					d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																					d.style.backgroundSize = 'contain';
																					d.style.width = '24px';
																					d.style.height = '24px';
																				}
																				return d;
																			}()
																		}
																	]
																}
															] 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent30 FloatLeft Ellipsis';
																d.innerHTML = '<strong>' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																//d.innerHTML = '<span>' + list[k].Name + '</span>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent15 FloatLeft Ellipsis';
																return d;
															}(),
															'child' : 
															[ 
																{ 
																	'element' : function( ids, id, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				
																				console.log( 'addUser( '+id+', '+info.ID+', callback, vars )' );
																				
																				addUser( id, info.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, true );
																						
																						vars._this.classList.remove( 'fa-toggle-off' );
																						vars._this.classList.add( 'fa-toggle-on' );
																					}
																					else
																					{
																						console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { uid: id, func: func, _this: this } );
																				
																			}
																			else
																			{
																				
																				console.log( 'removeUser( '+id+', '+info.ID+', callback, vars )' );
																				
																				removeUser( id, info.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						vars.func.updateids( 'users', vars.uid, false );
																						
																						vars._this.classList.remove( 'fa-toggle-on' );
																						vars._this.classList.add( 'fa-toggle-off' );
																					}
																					else
																					{
																						console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { uid: id, func: func, _this: this } );
																				
																			}
																		};
																		return b;
																	}( this.ids, list[k].ID, this.func ) 
																}
															]
														}
													]
												}
											] );
											
											if( divs )
											{
												for( var i in divs )
												{
													if( divs[i] && o )
													{
														o.appendChild( divs[i] );
													}
												}
											}
										}
									
									}
									
								}
								
							},
							
							refresh : function (  )
							{
								
								switch( this.func.mode[ 'users' ] )
								{
									
									case 'list':
										
										this.list();
										
										break;
										
									case 'edit':
										
										this.edit();
										
										break;
										
								}
								
							}
							
						};
						
						switch( func )
						{
							
							case 'head':
								
								init.head();
								
								break;
								
							case 'list':
								
								init.list();
								
								break;
								
							case 'edit':
								
								init.edit();
								
								break;
								
							case 'refresh':
								
								init.refresh();
								
								break;
							
							default:
								
								var etn = ge( 'UsersEdit' );
								if( etn )
								{
									etn.onclick = function( e )
									{
								
										init.edit();
								
										// Hide add / edit button ...
								
										if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
										{
											etn.classList.remove( 'Open' );
											etn.classList.add( 'Closed' );
										}
								
										// Show back button ...
								
										if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
										{
											btn.classList.remove( 'Closed' );
											btn.classList.add( 'Open' );
										}
										
									};
								}
						
								var btn = ge( 'UsersEditBack' );
								if( btn )
								{
									btn.onclick = function( e )
									{
								
										init.list();
								
										// Hide back button ...
										
										if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
										{
											btn.classList.remove( 'Open' );
											btn.classList.add( 'Closed' );
										}
						
										// Show add / edit button ...
								
										if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
										{
											etn.classList.remove( 'Closed' );
											etn.classList.add( 'Open' );
										}
										
									};
								}
							
								// Show listed dock ... 
						
								init.list();
								
								break;
								
						}
						
					}
					
					//
					
				};
			
			
				
				func.users();
				
				
			
			
			}
			
			
			// Run onload functions ....
			
			onLoad();
			
			
			
			
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
				console.log( 'initMain() ', { e:e, d:d } );
				
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
					name: '90'
				};
			
			
				// List by level
				var levels = [ 'User' ];
			
			
				//var h2 = document.createElement( 'h3' );
				//h2.innerHTML = i18n( 'i18n_workgroups' );
				//o.appendChild( h2 );
				
				var h3 = document.createElement( 'div' );
				h3.className  = 'HRow PaddingBottom';
				h3.innerHTML  = '<div class="HContent50 FloatLeft"><h3 class="NoMargin FloatLeft"><strong>' + i18n( 'i18n_workgroups' ) + '</strong></h3></div>';
				h3.innerHTML += '<div class="HContent50 FloatLeft Relative"><input type="text" class="FullWidth" placeholder="Search workgroups" onclick="alert(\'TODO ...\');"></div>';
				o.appendChild( h3 );
				
				
				
				
				// List headers
				var header = document.createElement( 'div' );
				header.className = 'List';
				var headRow = document.createElement( 'div' );
				//headRow.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingBottom PaddingRight';
				headRow.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingBottom PaddingRight';
				for( var z in types )
				{
					var borders = '';
					var d = document.createElement( 'div' );
					if( z != 'edit' )
						//borders += ' BorderRight';
					if( a < userList.length - a )
						borders += ' BorderBottom';
					var d = document.createElement( 'div' );
					d.className = 'PaddingSmall HContent' + ( types[ z ] ? types[ z ] : '-' ) + ' FloatLeft Ellipsis' + borders;
					if( z == 'edit' )
					{
						continue;
						z = '&nbsp;';
					}
					d.innerHTML = '<strong' + ( z != '&nbsp;' ? '' : '' ) + '>' + ( z != '&nbsp;' ? i18n( 'i18n_header_' + z ) : '&nbsp;' ) + '</strong>';
					headRow.appendChild( d );
				}
			
				var d = document.createElement( 'div' );
				d.className = 'HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
				d.innerHTML = '<button class="IconButton IconSmall ButtonSmall Negative FloatRight fa-plus-circle"></button>';
				d.onclick = function()
				{
					//Sections.accounts_workgroups( 'create' );
					edit(  );
				};
				headRow.appendChild( d );
			
				header.appendChild( headRow );
				o.appendChild( header );
			
				function setROnclick( r, uid )
				{
					r.onclick = function()
					{
						//Sections.accounts_workgroups( 'details', uid );
						edit( uid, this );
					}
				}
			
				var list = document.createElement( 'div' );
				list.className = 'List PaddingSmallTop PaddingSmallBottom';
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
									//continue;
								}
							}
							
							sw = sw == 2 ? 1 : 2;
							var r = document.createElement( 'div' );
							setROnclick( r, userList[ a ].ID );
							r.className = 'HRow ';
			
							//var icon = '<span class="IconSmall NegativeAlt fa-users"></span>';
							var icon = '<span class="IconSmall fa-users"></span>';
							userList[ a ][ 'edit' ] = icon;
				
							for( var z in types )
							{
								var borders = '';
								var d = document.createElement( 'div' );
								if( z != 'edit' )
								{
									d.className = '';
									//borders += ' BorderRight';
								}
								else d.className = 'TextCenter';
								//if( a < userList.length - a )
								//	borders += ' BorderBottom';
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

