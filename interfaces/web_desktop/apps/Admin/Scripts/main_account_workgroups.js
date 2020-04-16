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
	
	function listStorage( callback, gid, sid )
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
					m.execute( 'filesystem', { id: sid, authid: Application.authId } );
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
				
				//console.log( { e:e, d:d } );
			
				if( callback ) callback( storage );
				
				return;
				
				
				// Not needed ????
				
				
				var scripts = [];
			
				if( e == 'ok' )
				{
					// collect scripts
				
					var scr;
					while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
					{
						d = d.split( scr[0] ).join( '' );
						scripts.push( scr[1] );
					}
				
					var mch;
					var i = 0;
					while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
					{
						d = d.split( mch[0] ).join( i18n( mch[1] ) );
					}
				
					// Fix to add more space
					d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
				}
				else
				{
					d = '';
				}
			
				d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
			
				if( ge( 'DosDriverGui' ) )
				{
					ge( 'DosDriverGui' ).innerHTML = d;
				
					if( ge( 'StorageGui' ) )
					{
						var data = ( storage.data ? storage.data : false );
					
						// We are in edit mode..
						if( data )
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
						
							//console.log( elems );
						
							var fields = [
								'Name', 'Server', 'ShortDescription', 'Port', 'Username', 
								'Password', 'Path', 'Type', 'Workgroup', 'PrivateKey'
							];
							if( elems )
							{
								for( var a = 0; a < fields.length; a++ )
								{
									if( elems[ fields[ a ] ] && typeof( data[ fields[ a ] ] ) != 'undefined' )
									{
										elems[ fields[ a ] ].value   = data[ fields[ a ] ];
										elems[ fields[ a ] ].current = data[ fields[ a ] ];
									}
								}
								// Do we have conf?
								if( data.Config )
								{
									for( var a in data.Config )
									{
										if( elems[ 'conf.' + a ] )
										{
											elems[ 'conf.' + a ].value = data.Config[ a ];
										}
									}
								}
							}
						}
					
					}
				}
			
				if( ge( 'DiskSizeContainer' ) )
				{
					ge( 'DiskSizeContainer' ).style.display = 'none';
				}
			
				// TODO: Don't know what Types and Cbutton relates to ... remove later if it doesn't serve a purpose ...
			
				if( ge( 'Types' ) )
				{
					ge( 'Types' ).classList.add( 'closed' );
				}
			
				if( ge( 'CButton' ) )
				{
					ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_back' );
					ge( 'CButton' ).disabled = '';
					ge( 'CButton' ).oldOnclick = ge( 'CButton' ).onclick;
				
					// Return!!
					ge( 'CButton' ).onclick = function()
					{
						if( ge( 'Types' ) )
						{
							ge( 'Types' ).classList.remove( 'closed' );
						}
						ge( 'Form' ).classList.remove( 'open' );
						ge( 'CButton' ).innerHTML = '&nbsp;' + i18n( 'i18n_cancel' );
						ge( 'CButton' ).onclick = ge( 'CButton' ).oldOnclick;
					}
				}
			
			
			
				// Run scripts at the end ...
				if( scripts )
				{
					for( var key in scripts )
					{
						if( scripts[key] )
						{
							eval( scripts[key] );
						}
					}
				}
			}
			m.execute( 'dosdrivergui', { type: storage.type, id: storage.id, authid: Application.authId } );
		}
		ft.execute( 'dosdrivergui', { component: 'locale', type: storage.type, language: Application.language, authid: Application.authId } );
	}
	
	function LoadDOSDriverGUI( _this )
	{
		var type = ( _this ? _this.value : false );
		
		// Double ????? ... use only one, what a mess ...
		
		if( type )
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
					var scripts = [];
			
					if( e == 'ok' )
					{
						// collect scripts
				
						var scr;
						while ( scr = d.match ( /\<script[^>]*?\>([\w\W]*?)\<\/script\>/i ) )
						{
							d = d.split( scr[0] ).join( '' );
							scripts.push( scr[1] );
						}
				
						var mch;
						var i = 0;
						while( ( mch = d.match( /\{([^}]*?)\}/ ) ) )
						{
							d = d.split( mch[0] ).join( i18n( mch[1] ) );
						}
				
						// Fix to add more space
						d = d.split( 'HRow' ).join( 'MarginBottom HRow' );
				
						d = i18nReplace( d, [ 'i18n_port', 'i18n_key' ] );
					
					
					
						i18nAddTranslations( d );
						var f = new File();
						f.i18n();
						for( var a in f.replacements )
						{
							d = d.split( '{' + a + '}' ).join( f.replacements[a] );
						}
						ge( 'DosDriverGui' ).innerHTML = d;
				
						// Run scripts at the end ...
						if( scripts )
						{
							for( var key in scripts )
							{
								if( scripts[key] )
								{
									eval( scripts[key] );
								}
							}
						}
					}
					else
					{
						ge( 'DosDriverGui' ).innerHTML = '';
					}
				}
				m.execute( 'dosdrivergui', { type: type, authid: Application.authId } );
		
			}
			ft.execute( 'dosdrivergui', { component: 'locale', type: type, language: Application.language, authid: Application.authId } );
		}
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
							
							list : function (  )
							{
								
								this.func.mode[ 'storage' ] = 'list';
								
								var o = ge( 'StorageGui' ); o.innerHTML = '';
								
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
										if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
										if( !used && !size ) used = 0, size = 0;
										if( !size ) size = 536870912;
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
											mont : sorted[b].Mounted
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
												}( storage.mont ),
								
												'child' : 
												[ 
													{ 
												
														'element' : function( init, storage, groupid ) 
														{
															var d = document.createElement( 'div' );
															d.className = 'PaddingSmall Ellipsis';
															d.onclick = function (  )
															{
																																
																init.edit( storage.id );
																
															};
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
							
									o.innerHTML = '<div class="HContent100">' + i18n( 'i18n_workgroup_mountlist_empty' ) + '</div>';
							
								}
						
							},
							
							edit : function ( sid )
							{
								
								this.func.mode[ 'storage' ] = 'edit';
								
								var args = {
									groupid   : ( sid ? workgroup.groupid : null ),
									storageid : ( sid ? sid               : null )
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
										
										var storage = { id : '', name : '', type : '', size : 512 };
										
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
												size : size, 
												used : used, 
												free : ( size - used ), 
												prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
												icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
												mont : js.Mounted
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
																+ '	<div class="HContent30 FloatLeft Ellipsis">';
																+ '		<strong>' + i18n( 'i18n_name' ) + ':</strong>';
																+ '	</div>';
																+ '	<div class="HContent70 FloatLeft Ellipsis">';
																+ '		<input type="text" class="FullWidth" id="Name" value="' + storage.name + '" placeholder="Mydisk"/>';
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
																				if( storage.id )
																				{
																					d.disabled = true;
																				}
																				d.onchange = function(  )
																				{
																					LoadDOSDriverGUI( this );
																				};
																				d.innerHTML = '';
																				if( da )
																				{
																					for( var i in da )
																					{
																						if( da[i].type )
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
															}(  )
															
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
															
															'element' : function( init, storage ) 
															{
																var d = document.createElement( 'button' );
																d.className = 'IconSmall FloatRight MarginLeft';
																d.innerHTML = 'Save';
																d.onclick = function ()
																{
																	
																	//Sections.group_disk_save( storage.id );
																	
																	console.log( 'TODO: Save disk' );
																	
																};
																return d;
															}( init, storage )
															
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
															
															'element' : function( init, storage ) 
															{
																if( storage.id )
																{
																	var d = document.createElement( 'button' );
																	d.className = 'IconSmall Danger FloatRight MarginLeft';
																	d.innerHTML = 'Remove disk';
																	d.onclick = function ()
																	{
																	
																		//Sections.group_disk_remove( storage.id );
																		
																		console.log( 'TODO: Remove disk' );
																	
																	};
																	return d;
																}
															}( init, storage )
															
														},
														
														{ 
															
															'element' : function( init, storage ) 
															{
																if( storage.id )
																{
																	var d = document.createElement( 'button' );
																	d.className = 'IconSmall FloatLeft MarginRight';
																	d.innerHTML = ( storage.mont > 0 ? 'Unmount disk' : 'Mount disk' );
																	d.onclick = function ()
																	{
																	
																		//Sections.group_disk_mount( storage.name, this );
																		
																		console.log( 'TODO: Mount/Unmount disk' );
																		
																	};
																	return d;
																}
															}( init, storage )
															
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
											
											
											
											
											
											
											
											return;
											
											
											
											var str = '';
				
											//str += '<div class="HRow">';
											
											
											
											str += '<div class="Col1 FloatLeft">';
			
											str += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
			
											str += '</div><div class="Col2 FloatLeft">';
			
											str += '<div class="HRow MarginBottom">';
											str += '	<div class="HContent30 FloatLeft Ellipsis">';
											str += '		<strong>' + i18n( 'i18n_name' ) + ':</strong>';
											str += '	</div>';
											str += '	<div class="HContent70 FloatLeft Ellipsis">';
											str += '		<input type="text" class="FullWidth" id="Name" value="' + storage.name + '" placeholder="Mydisk"/>';
											str += '	</div>';
											str += '</div>';
		
											str += '<div class="HRow MarginBottom">';
											str += '	<div class="HContent30 FloatLeft Ellipsis">';
											str += '		<strong>' + i18n( 'i18n_type' ) + ':</strong>';
											str += '	</div>';
											str += '	<div class="HContent70 FloatLeft Ellipsis">';
											
											str += '		<select class="FullWidth" id="Type" onchange="LoadDOSDriverGUI(this)"' + ( storage.id ? ' disabled="disabled"' : '' ) + '>';
											
											if( da )
											{
												var found = false;
						
												for( var i in da )
												{
													if( da[i].type )
													{
														str += '<option value="' + da[i].type + '"' + ( storage.type == da[i].type ? ' selected="selected"' : '' ) + '>' + i18n( 'i18n_' + da[i].type ) + '</option>';
								
														if( storage.type == da[i].type )
														{
															found = true;
														}
													}
												}
						
												if( storage.id && !found )
												{
													str  = '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_disks_access_denied' ) + '</div></div>';
													str += '<div class="HRow PaddingTop"><button class="IconSmall FloatRight MarginLeft" onclick="init.list()">Cancel</button></div>';
							
													return ge( 'StorageGui' ).innerHTML = str;
												}
											}
											
											str += '		</select>';
											str += '	</div>';
											str += '</div>';
											
											
											
											str += '<div class="HRow MarginBottom">';
											str += '	<div class="HContent30 FloatLeft Ellipsis">';
											str += '		<strong>' + i18n( 'i18n_size' ) + ':</strong>';
											str += '	</div>';
											str += '	<div class="HContent35 FloatLeft Ellipsis PaddingRight">';
											str += '		<input type="text" class="FullWidth" id="DiskSizeA" value="' + readableBytes( storage.size, 0, 0 ) + '" placeholder="512"/>';
											str += '	</div>';
											str += '	<div class="HContent35 FloatLeft Ellipsis PaddingLeft">';
											str += '		<select class="FullWidth" id="DiskSizeB">';
				
											if( units )
											{
												for( var a in units )
												{
													str += '	<option' + ( storage.size && readableBytes( storage.size, 0, 2 ) == units[a] ? ' selected="selected"' : '' ) + '>' + units[a] + '</option>';
												}
											}
			
											str += '		</select>';
											str += '	</div>';
											str += '</div>';
			
											// Insert Gui based on DosDriver
					
											str += '	<div id="DosDriverGui"></div>';
				
											str += '</div>';
					
											str += '<div class="HRow PaddingTop">';
											str += '	<button class="IconSmall FloatRight MarginLeft" onclick="Sections.group_disk_save(\'' + storage.id + '\')">Save</button>';
											str += '	<button class="IconSmall FloatRight MarginLeft" onclick="init.list()">Cancel</button>';
											
											if( storage.id )
											{
												str += '<button class="IconSmall Danger FloatRight MarginLeft" onclick="Sections.group_disk_remove(' + storage.id + ')">Remove disk</button>';
												str += '<button class="IconSmall FloatLeft MarginRight" onclick="Sections.group_disk_mount(\'' + storage.name + '\',this)">' + ( storage.mont > 0 ? 'Unmount disk' : 'Mount disk' ) + '</button>';
											}
					
											str += '</div>';
											
											
											
											
											//str += '</div>';
			
											ge( 'StorageGui' ).innerHTML = str;
				
											
				
										} );
										
									}, args.groupid, args.storageid );
									
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
									etn.onclick = function( e )
									{
								
										init.edit();
										
									};
								}
								
								// Show listed storage ... 
						
								init.list();
								
								break;
								
						}
						
					}
					
				};
			
				
				
				func.users();
				func.storage();
				
			
			
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


Sections.group_disk_cancel = function( groupid )
{
	//console.log( 'Sections.group_disk_cancel ' + userid );
	
	var u = new Module( 'system' );
	u.onExecuted = function( e, d )
	{
		var ul = null;
		try
		{
			ul = JSON.parse( d );
		}
		catch( e )
		{
			ul = null;
		}
		
		ge( 'StorageGui' ).innerHTML = Sections.group_disk_refresh( ul, groupid );
		
		//console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
		
		Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
	}
	u.execute( 'mountlist', { groupid: groupid, authid: Application.authId } );
	
};

Sections.group_disk_refresh = function( mountlist, groupid )
{
	// Mountlist
	var mlst = '';
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
		
		if( sorted )
		{
			mountlist = sorted;
		}
		
		console.log( 'mountlist ', { mountlist: mountlist, groupid: groupid } );
		
		mlst += '<div class="HRow">';
		for( var b in mountlist )
		{
			if( mountlist[b] && !mountlist[b].ID ) continue;
			
			try
			{
				mountlist[b].Config = JSON.parse( mountlist[b].Config );
			}
			catch( e )
			{
				mountlist[b].Config = {};
			}
			
			// Skip the IsDeleted disks for now ...
			//if( mountlist[b] && mountlist[b].Mounted < 0 ) continue;
			
			//console.log( mountlist[b] );
			
			// Calculate disk usage
			var size = ( mountlist[b].Config.DiskSize ? mountlist[b].Config.DiskSize : 0 );
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
			var used = parseInt( mountlist[b].StoredBytes );
			if( isNaN( size ) ) size = 512 * 1024; // < Normally the default size
			if( !used && !size ) used = 0, size = 0;
			if( !size ) size = 536870912;
			if( !used ) used = 0;
			if( used > size || ( used && !size ) ) size = used;
			
			var storage = {
				id   : mountlist[b].ID,
				user : mountlist[b].UserID,
				name : mountlist[b].Name,
				type : mountlist[b].Type,
				size : size, 
				used : used, 
				free : ( size - used ), 
				prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
				icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
				mont : mountlist[b].Mounted
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
			
			//console.log( storage );
			
			mlst += '<div class="HContent33 FloatLeft DiskContainer"' + ( mountlist[b].Mounted <= 0 ? ' style="opacity:0.6"' : '' ) + '>';
			
			// If "SQLWorkgroupDrive" handle the edit in Workgroups ...
			
			if( storage.type == 'SQLWorkgroupDrive' )
			{
				mlst += '<div class="PaddingSmall Ellipsis">';
			}
			else
			{
				mlst += '<div class="PaddingSmall Ellipsis" onclick="Sections.group_disk_update(' + storage.user + ',' + storage.id + ',\'' + storage.name + '\',' + groupid + ')">';
			}
			
			mlst += '<div class="Col1 FloatLeft" id="Storage_' + storage.id + '">';
			mlst += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
			mlst += '</div>';
			mlst += '<div class="Col2 FloatLeft HContent100 Name Ellipsis">';
			mlst += '<div class="name" title="' + storage.name + '">' + storage.name + ':</div>';
			mlst += '<div class="type" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>';
			mlst += '<div class="rectangle"><div title="' + FormatBytes( storage.used, 0 ) + ' used" style="width:' + storage.prog + '%"></div></div>';
			mlst += '<div class="bytes">' + FormatBytes( storage.free, 0 )  + ' free of ' + FormatBytes( storage.size, 0 ) + '</div>';
			mlst += '</div>';
			mlst += '</div>';
			mlst += '</div>';
		}
		mlst += '</div>';
	}
	else
	{
		mlst += '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_workgroup_mountlist_empty' ) + '</div></div>';
	}
	
	return mlst;
};


Sections.group_disk_update = function( user, did = 0, name = '', userid )
{
	//console.log( { name: name, did: did } );
	
	return;
	
	userid = ( userid ? userid : ( user ? user : false ) );
	
	if( user && userid )
	{
		var n = new Module( 'system' );
		n.onExecuted = function( ee, dat )
		{
			//console.log( { e:ee, d:dat } );
			
			try
			{
				var da = JSON.parse( dat );
			}
			catch( e )
			{
				var da = {};
			}
			
			if( !da.length ) return;
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				//console.log( 'user_disk_update ', { e:e, d:d } );
				
				var storage = { id : '', name : '', type : '', size : 512, user : user };
			
				var units = [ 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
		
				if( e == 'ok' )
				{
					try
					{
						var js = JSON.parse( d );
					}
					catch( e )
					{
						js = {};
					}
			
					if( js )
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
							size : size, 
							used : used, 
							free : ( size - used ), 
							prog : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
							icon : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
							mont : js.Mounted,
							data : js
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
					}
				}
			
				StorageForm( storage, function( storage )
				{
				
					var str = '';
				
					str += '<div class="HRow">';
					str += '<div class="Col1 FloatLeft">';
			
					str += '<div class="disk"><div class="label" style="background-image: url(\'' + storage.icon + '\')"></div></div>';
			
					str += '</div><div class="Col2 FloatLeft">';
			
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_name' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent70 FloatLeft Ellipsis">';
					str += '<input type="text" class="FullWidth" id="Name" value="' + storage.name + '" placeholder="Mydisk"/>';
					str += '</div>';
					str += '</div>';
		
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_type' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent70 FloatLeft Ellipsis">';
					str += '<select class="FullWidth" id="Type" onchange="LoadDOSDriverGUI(this)"' + ( storage.id ? ' disabled="disabled"' : '' ) + '>';
					
					//console.log( 'StorageForm ', storage );
					
					if( da )
					{
						var found = false;
						
						for( var i in da )
						{
							if( da[i].type )
							{
								str += '<option value="' + da[i].type + '"' + ( storage.type == da[i].type ? ' selected="selected"' : '' ) + '>' + i18n( 'i18n_' + da[i].type ) + '</option>';
								
								if( storage.type == da[i].type )
								{
									found = true;
								}
							}
						}
						
						if( storage.id && !found )
						{
							str  = '<div class="HRow"><div class="HContent100">' + i18n( 'i18n_user_disks_access_denied' ) + '</div></div>';
							str += '<div class="HRow PaddingTop"><button class="IconSmall FloatRight MarginLeft" onclick="Sections.group_disk_cancel(' + userid + ')">Cancel</button></div>';
							
							return ge( 'StorageGui' ).innerHTML = str;
						}
					}
			
					str += '</select>';
					str += '</div>';
					str += '</div>';
		
					str += '<div class="HRow MarginBottom">';
					str += '<div class="HContent30 FloatLeft Ellipsis">';
					str += '<strong>' + i18n( 'i18n_size' ) + ':</strong>';
					str += '</div>';
					str += '<div class="HContent35 FloatLeft Ellipsis PaddingRight">';
					str += '<input type="text" class="FullWidth" id="DiskSizeA" value="' + FormatBytes( storage.size, 0, 0 ) + '" placeholder="512"/>';
					str += '</div>';
					str += '<div class="HContent35 FloatLeft Ellipsis PaddingLeft">';
					str += '<select class="FullWidth" id="DiskSizeB">';
				
					if( units )
					{
						for( var a in units )
						{
							str += '<option' + ( storage.size && FormatBytes( storage.size, 0, 2 ) == units[a] ? ' selected="selected"' : '' ) + '>' + units[a] + '</option>';
						}
					}
			
					str += '</select>';
					str += '</div>';
					str += '</div>';
			
					// Insert Gui based on DosDriver
					
					str += '<div id="DosDriverGui"></div>';
				
					str += '</div>';
					
					str += '<div class="HRow PaddingTop">';
					str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.group_disk_save(' + userid + ',\'' + storage.id + '\')">Save</button>';
					str += '<button class="IconSmall FloatRight MarginLeft" onclick="Sections.group_disk_cancel(' + userid + ')">Cancel</button>';
					
					if( storage.id )
					{
						str += '<button class="IconSmall Danger FloatRight MarginLeft" onclick="Sections.group_disk_remove(\'' + storage.name + '\',' + storage.id + ',' + userid + ')">Remove disk</button>';
						str += '<button class="IconSmall FloatLeft MarginRight" onclick="Sections.group_disk_mount(\'' + storage.name + '\',' + userid + ',this)">' + ( storage.mont > 0 ? 'Unmount disk' : 'Mount disk' ) + '</button>';
					}
					
					str += '</div>';
				
					str += '</div>';
			
					ge( 'StorageGui' ).innerHTML = str;
				
					//console.log( { e:e, d:(js?js:d) } );
				
				} );
			}
			
			// TODO: Update userid to be selected user ...
			
			m.execute( 'filesystem', {
				userid: user,
				devname: name, 
				authid: Application.authId
			} );
			
		}
		n.execute( 'types', { mode: 'all', authid: Application.authId } );
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

