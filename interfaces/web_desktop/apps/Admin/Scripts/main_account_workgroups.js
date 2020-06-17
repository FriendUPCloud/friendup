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
							'PERM_WORKGROUP_READ_GLOBAL', 
							'PERM_WORKGROUP_READ_IN_WORKGROUP', 
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
							'PERM_WORKGROUP_READ_GLOBAL', 
							'PERM_WORKGROUP_READ_IN_WORKGROUP', 
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
	
	function listStorage( callback, gid, sid, userid )
	{
		if( callback )
		{
			if( gid )
			{
				if( sid )
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
						
						var js = null;
						
						try
						{
							js = JSON.parse( d );
						}
						catch( e )
						{
							js = {};
						}
						
						if( e == 'ok' )
						{
							return callback( true, js );
						}
						else
						{
							return callback( false, js );
						}
						
					}
					m.execute( 'filesystem', { id: sid, userid: ( userid ? userid : '0' ), authid: Application.authId } );
				}
				else
				{
					var m = new Module( 'system' );
					m.onExecuted = function( e, d )
					{
					
						var rows = null;
					
						try
						{
							rows = JSON.parse( d );
						}
						catch( e )
						{
							rows = [];
						}
					
						return callback( true, rows );
						
					}
					m.execute( 'mountlist', { groupid: gid, authid: Application.authId } );
				}
				
				return true;
			}
			
			return callback( false, {} );
		}
	}
	
	function dosdrivergui( storage, callback )
	{
		var ft = new Module( 'system' );
		ft.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				i18nAddTranslations( d )
			}
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				// return info that this is loaded.
				
				console.log( { e:e, d:d } );
				
				if( callback ) callback( storage );
				
				return;
			}
			m.execute( 'dosdrivergui', { type: storage.type, id: storage.id, authid: Application.authId } );
		}
		ft.execute( 'dosdrivergui', { component: 'locale', type: storage.type, language: Application.language, authid: Application.authId } );
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
					'PERM_WORKGROUP_CREATE_GLOBAL', 
					'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
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
			type        : 'Workgroup',
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
						'PERM_WORKGROUP_CREATE_GLOBAL', 
						'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
						'PERM_WORKGROUP_UPDATE_GLOBAL', 
						'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
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
						'PERM_WORKGROUP_CREATE_GLOBAL', 
						'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
						'PERM_WORKGROUP_UPDATE_GLOBAL', 
						'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
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
						'PERM_WORKGROUP_DELETE_GLOBAL', 
						'PERM_WORKGROUP_DELETE_IN_WORKGROUP', 
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
	
	function saveStorage( diskid, userid, callback )
	{
		var elems = {};
		
		var inputs = ge( 'StorageGui' ).getElementsByTagName( 'input' );
	
		if( inputs.length > 0 )
		{
			for( var i in inputs )
			{
				if( inputs[i] && inputs[i].id )
				{
					elems[inputs[i].id] = inputs[i];
				}
			}
		}
	
		var texts = ge( 'StorageGui' ).getElementsByTagName( 'textarea' );
	
		if( texts.length > 0 )
		{
			for( var t in texts )
			{
				if( texts[t] && texts[t].id )
				{
					elems[texts[t].id] = texts[t];
				}
			}
		}
	
		var selects = ge( 'StorageGui' ).getElementsByTagName( 'select' );
	
		if( selects.length > 0 )
		{
			for( var s in selects )
			{
				if( selects[s] && selects[s].id )
				{
					elems[selects[s].id] = selects[s];
				}
			}
		}
		
		console.log( { userid: ( userid ? userid : '0' ), diskid: diskid, elems: elems } );
		
		if( elems && elems[ 'Workgroup' ] && elems[ 'Workgroup' ].value )
		{
		
			// New way of setting DiskSize so overwrite old method ...
		
			if( elems[ 'DiskSizeA' ] && elems[ 'DiskSizeA' ].value && elems[ 'DiskSizeB' ] && elems[ 'DiskSizeB' ].value )
			{
				elems[ 'conf.DiskSize' ] = { id: 'conf.DiskSize', value: ( elems[ 'DiskSizeA' ].value + elems[ 'DiskSizeB' ].value ) };
			}
		
			var req = { 'Name' : i18n( 'i18n_disk_name_missing' ), 'Type' : i18n( 'i18n_disk_type_missing' ) };
		
			for( var r in req )
			{
				if( elems[r] && !elems[r].value )
				{
					elems[r].focus();
				
					Notify( { title: i18n( 'i18n_disk_error' ), text: req[r] } );
				
					return;
				}
			}
		
			
		
			var data = { Name: elems[ 'Name' ].value };
		
			if( elems[ 'Server'           ] ) data.Server           = elems[ 'Server'           ].value;
			if( elems[ 'ShortDescription' ] ) data.ShortDescription = elems[ 'ShortDescription' ].value;
			if( elems[ 'Port'             ] ) data.Port             = elems[ 'Port'             ].value;
			if( elems[ 'Username'         ] ) data.Username         = elems[ 'Username'         ].value;
			// Have password and password is not dummy
			if( elems[ 'Password' ] && elems[ 'Password' ].value != '********' )
			{
				data.Password = elems[ 'Password' ].value;
			}
			// Have hashed password and password is not dummy
			else if( elems[ 'HashedPassword' ] && elems[ 'HashedPassword' ].value != '********' )
			{
				data.Password = 'HASHED' + Sha256.hash( elems[ 'HashedPassword' ].value );
			}
			if( elems[ 'Path'          ] ) data.Path      = elems[ 'Path'      ].value;
			if( elems[ 'Type'          ] ) data.Type      = elems[ 'Type'      ].value;
			if( elems[ 'Workgroup'     ] ) data.Workgroup = elems[ 'Workgroup' ].value;
			if( elems[ 'conf.Pollable' ] )
			{
				data.Pollable = elems[ 'conf.Pollable' ].checked ? 'yes' : 'no';
				elems[ 'conf.Pollable' ].value = elems[ 'conf.Pollable' ].checked ? 'yes' : 'no';
			}
			if( elems[ 'conf.Invisible' ] )
			{
				data.Invisible = elems[ 'conf.Invisible' ].checked ? 'yes' : 'no';
				elems[ 'conf.Invisible' ].value = elems[ 'conf.Invisible' ].checked ? 'yes' : 'no';
			}
			if( elems[ 'conf.Executable' ] )
				data.Invisible = elems[ 'conf.Executable' ].value;
	
			if( elems[ 'PrivateKey'      ] )
			{
				data.PrivateKey = elems[ 'PrivateKey' ].value;
			}
			if( elems[ 'EncryptedKey'    ] )
			{
				data.EncryptedKey = elems[ 'EncryptedKey' ].value;
			}
			
			// Custom fields
			for( var a in elems )
			{
				if( elems[a] && elems[a].id.substr( 0, 5 ) == 'conf.' )
				{
					data[elems[a].id] = elems[a].value;
				}
			}
			
			// TODO: Change this to allow userid = 0 when pawel has support for mounting a workgroup disk with userid = 0 ...
			
			if( userid && userid > 0 )
			{
				data.userid = ( userid ? userid : '0' );
			}
			
			data.authid = Application.authId;
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, dat )
			{
				//console.log( 'Sections.user_disk_save ', { e:e, d:dat, args:data } );
				
				if( e != 'ok' ) 
				{
					Notify( { title: i18n( 'i18n_disk_error' ), text: i18n( 'i18n_failed_to_edit' ) } );
					return;
				}
				else
				{
					Notify( { title: i18n( 'i18n_disk_success' ), text: i18n( 'i18n_disk_edited' ) } );
				}
				
				if( !data.ID || ( elems[ 'Name' ].hasAttribute('data-mount-state') && elems[ 'Name' ].getAttribute('data-mount-state') == '1' ) )
				{
					remountDisk( ( elems[ 'Name' ] && elems[ 'Name' ].current ? elems[ 'Name' ].current : data.Name ), data.Name, data.userid, function()
					{
						// Refresh init.refresh();
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						if( callback )
						{
							callback();
						}
					} );					
				}
				else if( callback )
				{
					callback();
				}
			}
			
			console.log( data );
			
			// if the disk is mounted, we need to unmount it based on its old name first.
			if( elems[ 'Name' ].hasAttribute('data-stored-value') &&  elems[ 'Name' ].hasAttribute('data-mount-state') && elems[ 'Name' ].getAttribute('data-mount-state') == '1' )
			{
				unmountDisk( elems[ 'Name' ].getAttribute('data-stored-value'), userid, function( e, d )
				{
					data.ID = diskid;
					m.execute( 'editfilesystem', data );
				});
			}
			else if( diskid > 0 )
			{
				data.ID = diskid;
				m.execute( 'editfilesystem', data );
			}
			else
			{
				m.execute( 'addfilesystem', data );
			}
		
		}
	}
	
	function mountStorage( devname, userid, _this, callback )
	{
		if( devname && _this )
		{
			if( _this.innerHTML.toLowerCase().indexOf( 'unmount' ) >= 0 )
			{
				unmountDisk( devname, userid, function( e, d )
				{
					console.log( 'unmountDrive( '+devname+', '+( userid ? userid : '0' )+' ) ', { e:e, d:d } );
				
					if( e == 'ok' )
					{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						
						console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
						Notify( { title: i18n( 'i18n_unmounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_unmounted' ) } );
						
						// init.refresh() ...
						
						if(	callback )
						{
							callback();
						}
						
						return;
					}
					else
					{
						Notify( { title: i18n( 'i18n_fail_unmount' ), text: i18n( 'i18n_fail_unmount_more' ) } );
					}
				
				} );
			}
			else
			{
				mountDisk( devname, userid, function( e, d )
				{
					console.log( 'mountDrive( '+devname+', '+( userid ? userid : '0' )+' ) ', { e:e, d:d } );
				
					if( e == 'ok' )
					{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
						console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
						Notify( { title: i18n( 'i18n_mounting' ) + ' ' + devname + ':', text: i18n( 'i18n_successfully_mounted' ) } );
						
						// init.refresh() ...
						
						if(	callback )
						{
							callback();
						}
				
						return;
					}
					else
					{
						Notify( { title: i18n( 'i18n_fail_mount' ), text: i18n( 'i18n_fail_mount_more' ) } );
					}
				
				} );
			}
		}
	}
	
	function mountDisk( devname, userid, callback )
	{
		if( devname )
		{
			var vars = { devname: devname };
		
			// Specific for Pawel's code ... He just wants to forward json ...
			
			// TODO: Needs to support mounting / unmounting of workgroup disk with userid = 0 or undefined.
			
			if( 1==1 || userid )
			{
				if( userid > 0 )
				{
					vars.userid = ( userid ? userid : '0' );
				}
				
				vars.authid = Application.authId;
			
				vars.args = JSON.stringify( {
					'type'    : 'write', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_STORAGE_CREATE_GLOBAL', 
							'PERM_STORAGE_CREATE_IN_WORKGROUP', 
							'PERM_STORAGE_UPDATE_GLOBAL', 
							'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
							'PERM_STORAGE_GLOBAL', 
							'PERM_STORAGE_WORKGROUP' 
						]
					}, 
					'object'   : 'user', 
					'objectid' : ( userid ? userid : '0' ) 
				} );
			}
		
			var f = new Library( 'system.library' );
		
			f.onExecuted = function( e, d )
			{
				console.log( 'mountDisk ( device/mount ) ', { vars: vars, e:e, d:d } );
			
				if( callback ) callback( e, d );
			}
		
			f.execute( 'device/mount', vars );
		}
	}

	function unmountDisk( devname, userid, callback )
	{
		if( devname )
		{
			var vars = { devname: devname };
		
			// Specific for Pawel's code ... He just wants to forward json ...
			
			// TODO: Needs to support mounting / unmounting of workgroup disk with userid = 0 or undefined.
			
			if( 1==1 || userid )
			{
				if( userid > 0 )
				{
					vars.userid = ( userid ? userid : '0' );
				}
				
				vars.authid = Application.authId;
				
				vars.args = JSON.stringify( {
					'type'    : 'write', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : [ 
							'PERM_STORAGE_CREATE_GLOBAL', 
							'PERM_STORAGE_CREATE_IN_WORKGROUP', 
							'PERM_STORAGE_UPDATE_GLOBAL', 
							'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
							'PERM_STORAGE_GLOBAL', 
							'PERM_STORAGE_WORKGROUP' 
						]
					}, 
					'object'   : 'user', 
					'objectid' : ( userid ? userid : '0' ) 
				} );
			}
			
			var f = new Library( 'system.library' );
		
			f.onExecuted = function( e, d )
			{
				console.log( 'unmountDisk ( device/unmount ) ', { vars: vars, e:e, d:d } );
			
				if( callback ) callback( e, d );
			}
		
			f.execute( 'device/unmount', vars );
		}
	}
	
	function remountDisk( oldname, newname, userid, callback )
	{
		if( oldname && newname )
		{
			unmountDisk( oldname, userid, function( e, d )
			{
			
				mountDisk( newname, userid, function( e, d )
				{
				
					if( callback ) callback( e, d );
				
				} );
			
			} );
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
								'PERM_WORKGROUP_DELETE_GLOBAL', 
								'PERM_WORKGROUP_DELETE_IN_WORKGROUP', 
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
	
	function removeStorage( diskid, userid, devname, callback )
	{
		if( diskid && devname )
		{
			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove' ), function( r )
			{
				if( r && r.data == true )
				{
					// This is the hard delete method, used by admins ...
					
					// TODO: Add the userid of the user that created the disk in all ...
					
					console.log( { diskid: diskid, userid: ( userid ? userid : '0' ), devname: devname } );
					
					unmountDrive( devname, false, function()
					{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							console.log( 'deletedoor', { id:diskid, e:e, d:d } );
						
							if( e == 'ok' )
							{
									
								// refresh list ....
								
								if( callback )
								{
									callback();
								}
							}
							try
							{
								var r = JSON.parse( d );						
								Notify( { title: 'An error occured', text: r.message } );
							}
							catch( e )
							{
								Notify( { title: 'An error occured', text: 'Could not delete this disk.' } );
							}
							return;
					
						}
						
						m.execute( 'deletedoor', { id: diskid, userid: ( userid ? userid : '0' ), authid: Application.authId } );
					
					} );
				
				}
			} );
		}
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
	
	function readableBytes( bytes, decimals = 2, units = 1 ) 
	{
		if ( bytes == 0 ) return ( '' + ( units ? '0B' : '' ) );
	
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
	
		const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	
		if( units === 2 ) return sizes[i];
	
		return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ( units ? ( sizes[i] ) : '' );
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
				
				// Get storage
				function(  )
				{
					
					listStorage( function( e, d )
					{
						
						info.mountlist = d;
						
						loadingList[ ++loadingSlot ]( info );
						
					}, id );
					
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
		var mountlist  = ( info.mountlist  ? info.mountlist  : {} );
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
		
		// Storage / disks
		//var mlst = Sections.group_disk_refresh( mountlist, workgroup.groupid );
		
		// Roles
		var rstr = '';
		
		if( roles && roles.length )
		{
			for( var a in roles )
			{
				
				if( !roles[a].WorkgroupID && !Application.checkAppPermission( [ 
					'PERM_ROLE_CREATE_GLOBAL', 'PERM_ROLE_CREATE_IN_WORKGROUP', 
					'PERM_ROLE_READ_GLOBAL',   'PERM_ROLE_READ_IN_WORKGROUP', 
					'PERM_ROLE_UPDATE_GLOBAL', 'PERM_ROLE_UPDATE_IN_WORKGROUP', 
					'PERM_ROLE_GLOBAL',        'PERM_ROLE_WORKGROUP' 
				] ) )
				{
					continue;
				}
				
				rstr += '<div class="HRow">';
				rstr += '<div class="PaddingSmall HContent80 FloatLeft Ellipsis">' + roles[a].Name + '</div>';
				rstr += '<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
				
				if( Application.checkAppPermission( [ 
					'PERM_ROLE_CREATE_GLOBAL', 'PERM_ROLE_CREATE_IN_WORKGROUP', 
					'PERM_ROLE_UPDATE_GLOBAL', 'PERM_ROLE_UPDATE_IN_WORKGROUP', 
					'PERM_ROLE_GLOBAL',        'PERM_ROLE_WORKGROUP' 
				] ) )
				{
					rstr += '<button onclick="Sections.accounts_workgroups(\'update_role\',{rid:'+roles[a].ID+',groupid:'+workgroup.groupid+',_this:this})" class="IconButton IconSmall ButtonSmall FloatRight' + ( roles[a].WorkgroupID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
				}
				
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
			storage               : ''/*mlst*/,
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
				
				//ge( 'AdminUsersContainer' ).className = 'Open';
			}
			
			var bg1  = ge( 'GroupSaveBtn' );
			if( bg1 ) 
			{
				if( 
				( info.ID && Application.checkAppPermission( [ 
					'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
					'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
				] ) ) || 
				( !info.ID && Application.checkAppPermission( [ 
					'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
				] ) ) 
				)
				{
					bg1.onclick = function( e )
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
				}
				else
				{
					bg1.style.display = 'none';
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
			if( bg4 )
			{
				if( Application.checkAppPermission( [ 
					'PERM_WORKGROUP_DELETE_GLOBAL', 'PERM_WORKGROUP_DELETE_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
				] ) )
				{
					bg4.onclick = function( e )
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
				}
				else
				{
					bg4.style.display = 'none';
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
																		if( Application.checkAppPermission( [ 
																			'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
																			'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
																			'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
																		] ) )
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
																		}
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
									if( Application.checkAppPermission( [ 
										'PERM_USER_CREATE_GLOBAL', 'PERM_USER_CREATE_IN_WORKGROUP', 
										'PERM_USER_UPDATE_GLOBAL', 'PERM_USER_UPDATE_IN_WORKGROUP', 
										'PERM_USER_GLOBAL',        'PERM_USER_WORKGROUP' 
									] ) )
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
									else
									{
										etn.style.display = 'none';
									}
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
							
								// Show listed users ... 
						
								init.list();
								
								break;
								
						}
						
					},
					
					// Storage -----------------------------------------------------------------------------------------
					
					storage : function ( func )
					{
						
						// Editing Storage
						
						var init =
						{
							
							func : this,
							
							list : function ( rows )
							{
								
								this.func.mode[ 'storage' ] = 'list';
								
								var o = ge( 'StorageGui' ); o.innerHTML = '';
								
								mountlist = ( rows ? rows : mountlist );
								
								console.log( 'init.list ', mountlist );
								
								if( mountlist && mountlist.length )
								{
									var sorted = {};
		
									for( var a = 0; a < mountlist.length; a++ )
									{
										if( mountlist[a].Mounted <= 0 )
										{
											sorted['1000'+a] = mountlist[a];
										}
										else
										{
											sorted[a] = mountlist[a];
										}
									}
									
									for( var b in sorted )
									{
										if( sorted[b] && !sorted[b].ID ) continue;
			
										try
										{
											sorted[b].Config = JSON.parse( sorted[b].Config );
										}
										catch( e )
										{
											sorted[b].Config = {};
										}
								
										// Calculate disk usage
										var size = ( sorted[b].Config.DiskSize ? sorted[b].Config.DiskSize : 0 );
										var mode = ( size && size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ] );
										size = parseInt( size );
										var type = mode[0].toLowerCase();
										if( type == 'kb' )
										{
											size = size * 1024;
										}
										else if( type == 'mb' )
										{
											size = size * 1024 * 1024;
										}
										else if( type == 'gb' )
										{
											size = size * 1024 * 1024 * 1024;
										}
										else if( type == 'tb' )
										{
											size = size * 1024 * 1024 * 1024 * 1024;
										}
										var used = parseInt( sorted[b].StoredBytes );
										if( isNaN( size ) || size == 0 ) size = 512 * 1024; // < Normally the default size
										if( !used && !size ) used = 0, size = 0;
										if( !used ) used = 0;
										if( used > size || ( used && !size ) ) size = used;
			
										var storage = {
											id   : sorted[b].ID,
											user : sorted[b].UserID,
											name : sorted[b].Name,
											type : sorted[b].Type,
											size : readableBytes( size, 0 ), 
											used : readableBytes( used, 0 ), 
											free : readableBytes( ( size - used ), 0 ), 
											prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
											icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
											mount : sorted[b].Mounted
										};
			
										if( Friend.dosDrivers[ storage.type ] && Friend.dosDrivers[ storage.type ].iconLabel )
										{
											storage.icon = 'data:image/svg+xml;base64,' + Friend.dosDrivers[ storage.type ].iconLabel;
										}
										if( storage.name == 'Home' )
										{
											storage.icon = '/iconthemes/friendup15/DriveLabels/Home.svg';
										}
										else if( storage.name == 'System' )
										{
											storage.icon = '/iconthemes/friendup15/DriveLabels/SystemDrive.svg';
										}
								
										
								
										var divs = appendChild( [
											{
								
												'element' : function( mounted ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'HContent33 FloatLeft DiskContainer';
													if( mounted <= 0 )
													{
														d.style.opacity = '0.6';
													}
													return d;
												}( storage.mount ),
								
												'child' : 
												[ 
													{ 
												
														'element' : function( init, storage, groupid ) 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmall Ellipsis';
															
															if( Application.checkAppPermission( [ 
																'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
																'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
																'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
															] ) )
															{
																d.onclick = function (  )
																{
																																
																	init.edit( storage.id, storage.user );
																
																};
															}
															
															d.innerHTML = ''
															+ '	<div class="Col1 FloatLeft" id="Storage_' + storage.id + '">'
															+ '		<div class="disk">'
															+ '			<div class="label" style="background-image: url(\'' + storage.icon + '\')"></div>'
															+ '		</div>'
															+ '	</div>'
															+ '	<div class="Col2 FloatLeft HContent100 Name Ellipsis">'
															+ '		<div class="name" title="' + storage.name + '">' + storage.name + ':</div>'
															+ '		<div class="type" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>'
															+ '		<div class="rectangle">'
															+ '			<div title="' + storage.used + ' used" style="width:' + storage.prog + '%"></div>'
															+ '		</div>'
															+ '		<div class="bytes">' + storage.free  + ' free of ' + storage.size + '</div>'
															+ '	<div>';
															return d;
														}( this, storage, workgroup.groupid )
												
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
								else
								{
							
									o.innerHTML = ''/*'<div class="HContent100">' + i18n( 'i18n_workgroup_mountlist_empty' ) + '</div>'*/;
							
								}
						
							},
							
							edit : function ( sid, uid )
							{
								
								this.func.mode[ 'storage' ] = 'edit';
								
								var args = {
									groupid   : ( sid ? workgroup.groupid : null ),
									storageid : ( sid ? sid               : null ),
									userid    : ( sid ? uid               : '0' )
								};
								
								var n = new Module( 'system' );
								n.onExecuted = function( ee, dat )
								{
									console.log( { e:ee, d:dat } );
									
									try
									{
										var da = JSON.parse( dat );
									}
									catch( e )
									{
										var da = {};
									}
			
									if( !da.length ) return;
									
									
									
									listStorage( function( res, js )
									{
										
										var storage = { id : '', user: '', name : '', type : 'SQLWorkgroupDrive', note: '', size : 512 };
										
										var units = [ 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
										
										console.log( { res:res, js:js } );
										
										if( res && js )
										{
											
											try
											{
												js.Config = JSON.parse( js.Config );
											}
											catch( e )
											{
												js.Config = {};
											}
											
											// Calculate disk usage
											var size = ( js.Config.DiskSize ? js.Config.DiskSize : 0 );
											var mode = ( size && size.length && size != 'undefined' ? size.match( /[a-z]+/i ) : [ '' ] );
											size = parseInt( size );
											var type = mode[0].toLowerCase();
											if( type == 'kb' )
											{
												size = size * 1024;
											}
											else if( type == 'mb' )
											{
												size = size * 1024 * 1024;
											}
											else if( type == 'gb' )
											{
												size = size * 1024 * 1024 * 1024;
											}
											else if( type == 'tb' )
											{
												size = size * 1024 * 1024 * 1024 * 1024;
											}
											var used = parseInt( js.StoredBytes );
											if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
											if( !used && !size ) used = 0, size = 0;
											if( !size ) size = 536870912;
											if( !used ) used = 0;
											if( used > size || ( used && !size ) ) size = used;
			
											storage = {
												id   : js.ID,
												user : js.UserID,
												name : js.Name,
												type : js.Type,
												note : js.ShortDescription,
												size : size, 
												used : used, 
												free : ( size - used ), 
												prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
												icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
												mount : js.Mounted
											};
											
										}
										
										if( Friend.dosDrivers[ storage.type ] && Friend.dosDrivers[ storage.type ].iconLabel )
										{
											storage.icon = 'data:image/svg+xml;base64,' + Friend.dosDrivers[ storage.type ].iconLabel;
										}
										if( storage.name == 'Home' )
										{
											storage.icon = '/iconthemes/friendup15/DriveLabels/Home.svg';
										}
										else if( storage.name == 'System' )
										{
											storage.icon = '/iconthemes/friendup15/DriveLabels/SystemDrive.svg';
										}
										
										console.log( storage );
										
										dosdrivergui( storage, function( storage )
										{
											
											var o = ge( 'StorageGui' ); o.innerHTML = '';
											
											var divs = appendChild( [
												{
								
													'element' : function( storage ) 
													{
														var d = document.createElement( 'div' );
														d.className = 'Col1 FloatLeft';
														d.innerHTML = ''
														+ '	<div class="disk">'
														+ '		<div class="label" style="background-image: url(\'' + storage.icon + '\')"></div>'
														+ '	</div>';
														return d;
													}( storage )
													
												},
												
												{
													
													'element' : function(  ) 
													{
														var d = document.createElement( 'div' );
														d.className = 'Col2 FloatLeft';
														return d;
													}(  ), 
													
													'child' : 
													[ 
														
														{ 
															
															'element' : function( storage ) 
															{
																var d = document.createElement( 'div' );
																d.className = 'HRow MarginBottom';
																d.innerHTML = ''
																+ '	<div class="HContent30 FloatLeft Ellipsis">'
																+ '		<strong>' + i18n( 'i18n_name' ) + ':</strong>'
																+ '	</div>'
																+ '	<div class="HContent70 FloatLeft Ellipsis">'
																+ '		<input type="text" class="FullWidth" id="Name" value="' + storage.name + '" data-stored-value="' + storage.name + '" data-mount-state="'+ storage.mount +'" placeholder="Mydisk"/>'
																+ '	</div>';
																return d;
															}( storage )
															
														},
														
														{
															
															'element' : function(  ) 
															{
																var d = document.createElement( 'div' );
																d.className = 'HRow MarginBottom';
																return d;
															}(  ),
															
															'child' : 
															[ 
																
																{ 
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'HContent30 FloatLeft Ellipsis';
																		d.innerHTML = '<strong>' + i18n( 'i18n_type' ) + ':</strong>';
																		return d;
																	}(  )
																	
																},
																
																{
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'HContent70 FloatLeft Ellipsis';
																		return d;
																	}(  ),
																	
																	'child' : 
																	[ 
																
																		{ 
																			
																			'element' : function( storage, da ) 
																			{
																				var d = document.createElement( 'select' );
																				d.className = 'FullWidth';
																				d.id = 'Type';
																				d.disabled = true;
																				d.innerHTML = '';
																				if( da )
																				{
																					for( var i in da )
																					{
																						if( da[i].type && storage.type == da[i].type )
																						{
																							d.innerHTML += ''
																							+ '<option value="' + da[i].type + '"' + ( storage.type == da[i].type ? ' selected="selected"' : '' ) + '>' 
																							+ 	i18n( 'i18n_' + da[i].type ) 
																							+ '</option>';
																						}
																					}
																				}
																				return d;
																			}( storage, da )
																			
																		}
																	]
																	
																}
																
															]
															
														},
														
														{
															
															'element' : function(  ) 
															{
																var d = document.createElement( 'div' );
																d.className = 'HRow MarginBottom';
																return d;
															}(  ),
															
															'child' : 
															[ 
																
																{ 
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'HContent30 FloatLeft Ellipsis';
																		d.innerHTML = '<strong>' + i18n( 'i18n_size' ) + ':</strong>';
																		return d;
																	}(  )
																	
																},
																
																{
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'HContent35 FloatLeft Ellipsis PaddingRight';
																		d.innerHTML = '<input type="text" class="FullWidth" id="DiskSizeA" value="' + readableBytes( storage.size, 0, 0 ) + '" placeholder="512"/>';
																		return d;
																	}(  )
																	
																},
																
																{
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'HContent35 FloatLeft Ellipsis PaddingLeft';
																		return d;																		
																	}(  ),
																	
																	'child' : 
																	[ 
																
																		{ 
																			
																			'element' : function( storage, units ) 
																			{
																				var d = document.createElement( 'select' );
																				d.className = 'FullWidth';
																				d.id = 'DiskSizeB';
																				d.innerHTML = '';
																				if( units )
																				{
																					for( var a in units )
																					{
																						d.innerHTML += ''
																						+ '<option' + ( storage.size && readableBytes( storage.size, 0, 2 ) == units[a] ? ' selected="selected"' : '' ) + '>' 
																						+ 	units[a] 
																						+ '</option>';
																					}
																				}
																				return d;
																			}( storage, units )
																			
																		}
																	]
																
																}
																
															]
															
														},
														
														{
															
															'element' : function(  ) 
															{
																var d = document.createElement( 'div' );
																d.id = 'DosDriverGui';
																return d;
															}(  ),
															
															// TODO: Check translations from DOS driver gui ...
															
															'child' : 
															[ 
												
																{ 
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'MarginBottom HRow';
																		return d;
																	}(  ),
																	
																	'child' : 
																	[ 
												
																		{
																			
																			'element' : function(  ) 
																			{
																				var d = document.createElement( 'div' );
																				d.className = 'HContent30 FloatLeft';
																				d.innerHTML = '<p class="Layout InputHeight"><strong>Workgroup:</strong></p>';
																				return d;
																			}(  )
																			
																		},
																		
																		{
																			
																			'element' : function( groupname ) 
																			{
																				var d = document.createElement( 'div' );
																				d.className = 'HContent70 FloatLeft';
																				d.innerHTML = ''
																				+ '	<p class="Layout InputHeight" id="WorkgroupContainer">'
																				+ '		<select id="Workgroup" class="FullWidth" disabled="true">'
																				+ '			' + ( groupname ? '<option value="' + groupname + '">' + groupname + '</option>' : '' ) 
																				+ '		</select>'
																				+ '	</p>';
																				return d;
																			}( workgroup.name )
																			
																		}
																		
																	]
																	
																},
																
																{ 
																	
																	'element' : function(  ) 
																	{
																		var d = document.createElement( 'div' );
																		d.className = 'MarginBottom HRow';
																		return d;
																	}(  ),
																	
																	'child' : 
																	[ 
												
																		{
																			
																			'element' : function(  ) 
																			{
																				var d = document.createElement( 'div' );
																				d.className = 'HContent30 FloatLeft';
																				d.innerHTML = '<p class="Layout InputHeight"><strong>Notes:</strong></p>';
																				return d;
																			}(  )
																			
																		},
																		
																		{
																			
																			'element' : function( storage ) 
																			{
																				var d = document.createElement( 'div' );
																				d.className = 'HContent70 FloatLeft';
																				d.innerHTML = ''
																				+ '	<p class="Layout InputHeight">'
																				+ '		<input type="text" id="ShortDescription" class="FullWidth" value="' + storage.note + '" placeholder="Your notes...">'
																				+ '	</p>';
																				return d;
																			}( storage )
																			
																		}
																		
																	]
																	
																}
																
															]
															
														}
														
													]
													
												},
												
												{
													
													'element' : function(  ) 
													{
														var d = document.createElement( 'div' );
														d.className = 'HRow PaddingTop';
														return d;
													}(  ),
													
													'child' : 
													[ 
												
														{ 
															
															'element' : function( groupid, storage, init ) 
															{
																if( Application.checkAppPermission( [ 
																	'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
																	'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
																	'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
																] ) )
																{
																	var d = document.createElement( 'button' );
																	d.className = 'IconSmall FloatRight MarginLeft';
																	d.innerHTML = 'Save';
																	d.onclick = function ()
																	{
																	
																		saveStorage( storage.id, storage.user, function()
																		{
																		
																			listStorage( function( res, js )
																			{
																			
																				console.log( 'init.list(  ); ', { res: res, js:js } );
																			
																				if( res )
																				{
																					init.list( js );
																				}
																			
																			}, groupid );
																		
																		} );
																	
																	};
																	return d;
																}
															}( workgroup.groupid, storage, init )
															
														},
														
														{ 
															
															'element' : function( init ) 
															{
																var d = document.createElement( 'button' );
																d.className = 'IconSmall FloatRight MarginLeft';
																d.innerHTML = 'Cancel';
																d.onclick = function ()
																{
																	
																	init.list();
																	
																};
																return d;
															}( init )
															
														},
														
														{ 
															
															'element' : function( groupid, storage, init ) 
															{
																if( storage.id && Application.checkAppPermission( [ 
																	'PERM_STORAGE_DELETE_GLOBAL', 'PERM_STORAGE_DELETE_IN_WORKGROUP', 
																	'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
																] ) )
																{
																	var d = document.createElement( 'button' );
																	d.className = 'IconSmall Danger FloatRight MarginLeft';
																	d.innerHTML = 'Remove disk';
																	d.onclick = function ()
																	{
																	
																		removeStorage( storage.id, storage.user, storage.name, function()
																		{
																		
																			listStorage( function( res, js )
																			{
																			
																				console.log( 'init.list(  ); ', { res: res, js:js } );
																			
																				if( res )
																				{
																					init.list( js );
																				}
																			
																			}, groupid );
																		
																		} );
																	
																	};
																	return d;
																}
															}( workgroup.groupid, storage, init )
															
														},
														
														{ 
															
															'element' : function( groupid, storage, init ) 
															{
																if( storage.id && Application.checkAppPermission( [ 
																	'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
																	'PERM_STORAGE_UPDATE_GLOBAL', 'PERM_STORAGE_UPDATE_IN_WORKGROUP', 
																	'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
																] ) )
																{
																	var d = document.createElement( 'button' );
																	d.className = 'IconSmall FloatLeft MarginRight';
																	d.innerHTML = ( storage.mount > 0 ? i18n('i18n_unmount_disk') : i18n('i18n_mount_disk') );
																	d.onclick = function ()
																	{
																	
																		mountStorage( storage.name, storage.user, this, function()
																		{
																		
																			listStorage( function( res, js )
																			{
																			
																				console.log( 'init.list(  ); ', { res: res, js:js } );
																				
																				if( res )
																				{
																					init.list( js );
																				}
																			
																			}, groupid );
																		
																		} );
																		
																	};
																	return d;
																}
															}( workgroup.groupid, storage, init )
															
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
											
											if( ge( 'Name' ) && storage.name )
											{
												
												ge( 'Name' ).current = storage.name;
												
											}
											
										} );
										
									}, args.groupid, args.storageid, args.userid );
									
								}
								n.execute( 'types', { mode: 'all', authid: Application.authId } );
								
							},
							
							refresh : function (  )
							{
								
								switch( this.func.mode[ 'storage' ] )
								{
									
									case 'list':
										
										this.list();
										
										break;
										
									case 'edit':
										
										this.edit();
										
										break;
										
								}
								
							}
							
						}
						
						switch( func )
						{
							
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
								
								var etn = ge( 'StorageEdit' );
								if( etn )
								{
									if( Application.checkAppPermission( [ 
										'PERM_STORAGE_CREATE_GLOBAL', 'PERM_STORAGE_CREATE_IN_WORKGROUP', 
										'PERM_STORAGE_GLOBAL',        'PERM_STORAGE_WORKGROUP' 
									] ) )
									{
										etn.onclick = function( e )
										{
								
											init.edit();
										
										};
									}
									else
									{
										etn.style.display = 'none';
									}
								}
								
								// Show listed storage ... 
						
								init.list();
								
								break;
								
						}
						
					},
					
					// Permissions -------------------------------------------------------------------------------------
					
					permissions : function ( show )
					{
						// Check Permissions
						
						console.log( '// Check Permissions ', ( show ? show : [] ) );
						
						if( !show || show.indexOf( 'user' ) >= 0 )
						{
							if( Application.checkAppPermission( [ 
								'PERM_USER_READ_GLOBAL', 'PERM_USER_READ_IN_WORKGROUP', 
								'PERM_USER_GLOBAL',      'PERM_USER_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminUsersContainer' ) ) ge( 'AdminUsersContainer' ).className = 'Open';
							}
						}
						
						if( !show || show.indexOf( 'storage' ) >= 0 )
						{
							if( Application.checkAppPermission( [ 
								'PERM_STORAGE_READ_GLOBAL', 'PERM_STORAGE_READ_IN_WORKGROUP', 
								'PERM_STORAGE_GLOBAL',      'PERM_STORAGE_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminStorageContainer' ) ) ge( 'AdminStorageContainer' ).className = 'Open';
							}
						}
						
						if( !show || show.indexOf( 'role' ) >= 0 )
						{
							if( Application.checkAppPermission( [ 
								'PERM_ROLE_READ_GLOBAL', 'PERM_ROLE_READ_IN_WORKGROUP', 
								'PERM_ROLE_GLOBAL',      'PERM_ROLE_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminRolesContainer' ) ) ge( 'AdminRolesContainer' ).className = 'Open';
							}
						}
						
					}
					
				};
			
				
				
				func.users();
				func.storage();
				func.permissions();
				
			
			
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
		var checkedGlobal = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_GLOBAL', 'PERM_WORKGROUP_GLOBAL' ] );
		var checkedWorkgr = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_IN_WORKGROUP', 'PERM_WORKGROUP_WORKGROUP' ] );
		
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
				
				if( Application.checkAppPermission( [ 
					'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
				] ) )
				{
					var d = document.createElement( 'div' );
					d.className = 'HContent' + '10' + ' TextCenter FloatLeft Ellipsis';
					d.innerHTML = '<button class="IconButton IconSmall ButtonSmall Negative FloatRight fa-plus-circle"></button>';
					d.onclick = function()
					{
						//Sections.accounts_workgroups( 'create' );
						edit(  );
					};
					headRow.appendChild( d );
				}
				
			
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

