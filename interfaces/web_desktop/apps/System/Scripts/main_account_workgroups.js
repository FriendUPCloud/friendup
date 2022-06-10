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
			if( extra )
			{
				if( extra.id && extra._this )
				{
					edit( extra.id, extra._this );
				}
				else
				{
					edit( extra );
				}
			}
			break;
		
		case 'edit_sub':
			if( extra )
			{
				//console.log( extra );
				
				if( extra.id && extra._this )
				{
					edit( extra.id, extra._this, null, true );
					
				}
				else if( extra.id, extra.psub )
				{
					edit( extra.id, null, null, extra.psub );
				}
				else
				{
					edit( extra, null, null, true );
				}
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
	
	function list( callback, id, parentid )
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
					if( ShowLog ) console.log( { e:e , d:d, args: args } );
					
					if( e == 'ok' && d )
					{
						try
						{
							var data = JSON.parse( d );
							
							// Workaround for now .... until rolepermissions is correctly implemented in C ...
							
							if( ShowLog ) console.log( '[2] ', data );
							
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
					
					var wgroups = null; var workgroups = null;
					
					try
					{
						wgroups = JSON.parse( d );
					}
					catch( e )
					{
						wgroups = null;
					}
					
					if( ShowLog ) console.log( 'workgroups ', { e:e , d:(wgroups?wgroups:d), args: args } );
					
					if( wgroups )
					{
						if( wgroups.groups )
						{
							workgroups = wgroups.groups;
						}
						else if( wgroups.data && wgroups.data.details && wgroups.data.details.groups )
						{
							workgroups = wgroups.data.details.groups;
						}
					}
					
					var out = {};
					
					if( wgroups && workgroups )
					{
						
						for( var a in workgroups )
						{
							if( workgroups[a] && workgroups[a].ID )
							{
								out[workgroups[a].ID] = ( { ID: workgroups[a].ID, UUID: workgroups[a].uuid, Name: workgroups[a].name, ParentID: workgroups[a].parentid, Status: workgroups[a].status } );
							}
						}
						
						//if( callback ) return callback( out );
						
					}
					
					listModuleWorkgroups( out, callback );
					
					//if( callback ) return callback( [] );
					
				}
				
				if( 1!=1 && parentid )
				{
					f.execute( 'group/list', { parentid: parentid, authid: Application.authId, args: args } );
				}
				else
				{
					f.execute( 'group/list', { authid: Application.authId, args: args } );
				}
			}
			
			return true;
		}
		
		return false;
		
	}
	
	// TODO: Temporary until owner and only admin flags are supported in system.library/group/list
	
	function listModuleWorkgroups( workgroups, callback )
	{
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var data = null;
			
			try
			{
				data = JSON.parse( d );
			}
			catch( e ) {  }
			
			if( data && workgroups )
			{
				for( var i in data )
				{
					// Set Owner ...
					
					if( data[i] && data[i].ID && data[i].Owner && workgroups[data[i].ID] )
					{
						workgroups[data[i].ID].Owner = data[i].Owner;
					}
					
					// Hide non Admin workgroups ...
					
					if( data[i] && data[i].ID && data[i].Level == 'User' && workgroups[data[i].ID] )
					{
						workgroups[data[i].ID].Hide = true;
					}
					
				}
			}
			
			console.log( '[1] listModuleWorkgroups', workgroups );
			
			console.log( '[2] listModuleWorkgroups', { e:e, d:(data?data:d) } );
			
			if( callback )
			{
				// Temporary until FriendCore supports all this ...
				if( data )
				{
					return callback( data );
				}
				//if( workgroups )
				//{
				//	return callback( workgroups );
				//}
				
				return callback( [] );
			}
			
		}
		m.execute( 'workgroups', { owner: true, level: true, authid: Application.authId } );
		
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
						
						if( ShowLog/* || 1==1*/ ) console.log( { e:e, d:d } );
						
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
						
						if( ShowLog/* || 1==1*/ ) console.log( { e:e, d:d } );
						
						return callback( true, rows );
						
					}
					m.execute( 'mountlist', { groupid: gid, authid: Application.authId } );
				}
				
				return true;
			}
			
			return callback( false, {} );
		}
	}
	
	function getStorageInfo( path, id, args, callback )
	{
		// TODO: Had to move this function out of this section to get access to it outside in another function, look at this mess some other time ...
	
		// TODO: So we need to get server token as admin for this user and then use that as a sessionid ???
	
		if( path && id && callback )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				var json = null;
			
				if( d )
				{
					try
					{
						var json = JSON.parse( d );
					} 
					catch( e ){ }
				}
			
				if( e == 'ok' && d )
				{
					if( json )
					{
						if( ShowLog ) console.log( '[ok] volumeinfo ', { e:e, d:json, args: { path: path, userid: id, authid: Application.authId } } );
					
						return callback( true, json, args );
					}
				}
			
				// Show error message if there is any ...
			
				if( d )
				{
					//console.log( '[fail] volumeinfo ', { e:e, d:(json?json:d), args: { path: path, userid: id, authid: Application.authId } } );
				
					args.Errors = { text: '[fail] volumeinfo ', content: { e:e, d:(json?json:d), args: { path: path, userid: id, authid: Application.authId } } };
				}
				else
				{
					//console.log( '[fail] volumeinfo not support in DOSDriver ... ', { path: path, userid: id, authid: Application.authId } );
				
					args.Errors = { text: '[fail] volumeinfo not support in DOSDriver ... ', content: { path: path, userid: id, authid: Application.authId } };
				}
			
				return callback( false, ( json ? json : false ), args );
			}
			m.execute( 'volumeinfo', { path: path, userid: id, authid: Application.authId } );
		
			return true;
		}
	
		return false;
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
				
				if( ShowLog ) console.log( { e:e, d:d } );
				
				if( callback ) callback( storage );
				
				return;
			}
			m.execute( 'dosdrivergui', { type: storage.type, id: storage.id, authid: Application.authId } );
		}
		ft.execute( 'dosdrivergui', { component: 'locale', type: storage.type, language: Application.language, authid: Application.authId } );
	}
	
	function listUsers( callback, obj, showall )
	{
		var args = {  
			count   : true, 
			authid  : Application.authId 
		};
		
		if( !showall )
		{
			args.query   = UsersSettings( 'searchquery' ); 
			args.sortby  = UsersSettings( 'sortby'      ); 
			args.orderby = UsersSettings( 'orderby'     ); 
			args.limit   = UsersSettings( 'limit'       );
		}
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			var users = null;
			
			if( e == 'ok' )
			{
				try
				{
					users = JSON.parse( d );
					
					if( users )
					{
						for( var k in users )
						{
							if( users[ k ].ID )
							{
								users[ k ].Avatar = '/system.library/module/?module=system&command=getavatar&userid=' + users[ k ].ID + ( users[ k ].Image ? '&image=' + users[ k ].Image : '' ) + '&width=30&height=30&authid=' + Application.authId;
							}
						}
					}
				}
				catch( e )
				{
					console.log( { e:e, d:d, args:args } );
				}
			}
			
			//console.log( 'listUsers( callback, obj ) ', { e:e, d:(users?users:d), args:args } );
			
			if( callback )
			{
				return callback( e, users, obj );
			}
			
			return users;
		}
		m.execute( 'listusers', args );
	}
	
	function refresh( id, _this, psub, sub )
	{
		
		initMain( function(  )
		{
				
			if( psub > 0 )
			{
				edit( psub, _this, null, null, sub );
			}
			
			if( id )
			{
				edit( id, _this, null, psub, sub );
			}
			
		} );
		
	}
	
	function edit( id, _this, pid, psub, sub )
	{
		
		cancel( true, psub );
		
		if( !psub && _this )
		{
			/*// TODO: remove all other Selected in the list first ...
			
			var pnt = _this.parentNode.parentNode.getElementsByTagName( 'div' );
			
			if( pnt )
			{
				for( var i in pnt )
				{
					if( pnt[i] && pnt[i].className )
					{
						pnt[i].classList.remove( 'Selected' );
					}
				}
			}*/
				
			_this.classList.add( 'Selected' );
		}
		else if( !psub && id && ge( 'WorkgroupID_' + id ) )
		{
			ge( 'WorkgroupID_' + id ).classList.add( 'Selected' );
			
			//console.log( '[1]', { text: ge( 'WorkgroupID_' + id ).innerText, id: id, _this: _this, psub: psub, sub: sub } );
		}
		else if( psub > 0 && ge( 'WorkgroupID_' + psub ) )
		{
			if( !ge( 'SubWorkgroupDetails' ).innerHTML )
			{
				ge( 'WorkgroupID_' + psub ).classList.add( 'Selected' );
			}
			
			//console.log( '[2]', { text: ge( 'WorkgroupID_' + psub ).innerText, id: id, _this: _this, psub: psub, sub: sub } );
		}
		
		loading( id, pid, psub, sub );
		
	}
	
	function cancel( skip, psub )
	{
		
		if( ShowLog ) console.log( 'cancel(  ) ' );

		if( !skip && ge( 'WorkgroupDetails' ) )
		{
			if( psub )
			{
				ge( 'SubWorkgroupDetails' ).innerHTML = '';
			}
			else
			{
				ge( 'WorkgroupDetails' ).innerHTML = '';
			}
		}
		
		if( !psub && ge( 'WorkgroupList' ) )
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
	
	function create( psub, callback )
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
			
			if( ShowLog || 1==1 ) console.log( 'create() ', { e:e, d:(data?data:d), args: {
				groupname   : ( ge( 'WorkgroupName'        ).value ), 
				parentid    : ( ge( 'WorkgroupParent'      ).value ), 
				description : ( ge( 'WorkgroupDescription' ).value ), 
				authid      : ( Application.authId                 ), 
				status      : ( 2                                  ),
				type        : ( 'Workgroup'                        ),
				args        : ( args                               ) 
			} } );
			
			if( e == 'ok' && d )
			{
				
				if( data && data.message )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
				}
				else if ( data && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				}
				
				updateStatus( data.id, 2, function (  )
				{
					
					if( callback )
					{
						callback( data.id );
					}
					
					refresh( data.id, null, psub );
					
				} );
				
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
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
				}
				else if( data && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				}
				else
				{
					Notify( { title: i18n( 'i18n_workgroup_create' ), text: d } );
				}
				
			}
			
		}
		f.execute( 'group/create', {
			groupname   : ( ge( 'WorkgroupName'        ) ? ge( 'WorkgroupName'        ).value : 'Unnamed workgroup' ), 
			description : ( ge( 'WorkgroupDescription' ) ? ge( 'WorkgroupDescription' ).value : ''                  ),
			parentid    : ( ge( 'WorkgroupParent'      ) ? ge( 'WorkgroupParent'      ).value : 0                   ),
			authid      : Application.authId,
			status      : 2,
			type        : 'Workgroup',
			args        : args
		} );
		
	}
	
	function update( id, psub, sub )
	{
		
		// TODO: Add more stuff to update for a workgroup ...
		
		if( id )
		{
			
			let uuid = '_'+id;
			
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
				
				if( ShowLog || 1==1 ) console.log( { e:e, d:(data?data:d), args: {
					id          : ( id                                      ), 
					groupname   : ( ge( 'WorkgroupName'+uuid        ).value ), 
					parentid    : ( ge( 'WorkgroupParent'+uuid      ).value ), 
					description : ( ge( 'WorkgroupDescription'+uuid ).value ), 
					authid      : ( Application.authId                      ), 
					args        : ( args                                    ) 
				} } );
				
				if( e == 'ok' && d )
				{
					
					if( data && data.message )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
					}
					else if ( data && data.response )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
					}
					
					refresh( data.id, null, psub, sub );
					
					editMode( true, data.id );
				}
				
				else if( data && data.code == '69' && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
					if( ge( 'WorkgroupName'+uuid ) )
					{
						ge( 'WorkgroupName'+uuid ).focus();
					}
				}
				
				// Missing ...
				
				else if( data && data.code == '14' && data.response )
				{
					Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
					if( ge( 'WorkgroupName'+uuid ) )
					{
						ge( 'WorkgroupName'+uuid ).focus();
					}
				}
			
				// Other ...
				
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
					}
					else if ( data && data.response )
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
					}
					else
					{
						Notify( { title: i18n( 'i18n_workgroup_update' ), text: d } );
					}
				
				}
				
				//Sections.accounts_workgroups( 'refresh' ); 
			}
			f.execute( 'group/update', {
				id          : ( id                                      ), 
				groupname   : ( ge( 'WorkgroupName'+uuid        ).value ), 
				description : ( ge( 'WorkgroupDescription'+uuid ).value ),
				parentid    : ( ge( 'WorkgroupParent'+uuid      ).value ),
				authid    : ( Application.authId                        ),
				args      : ( args                                      )
			} );
			
		}
	}
	
	function updateStatus( id, status, callback )
	{
		if( id > 0 )
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
			
			var f = new Library( 'system.library' );
			f.onExecuted = function( e, d )
			{
				
				if( ShowLog ) console.log( 'updateStatus( '+id+', '+status+' )', { e:e, d:d } );
				
				if( e == 'ok' )
				{
					if( callback ) return callback( d );
				}
				
				if( callback ) return callback( false );
				
			}
			f.execute( 'group/updatestatus', {
				id     : ( id                 ), 
				status : ( status             ), 
				authid : ( Application.authId ),
				args   : ( args               )
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
				if( ShowLog ) console.log( { e:e, d:d } );
			
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
				if( ShowLog ) console.log( { e:e, d:d } );
			
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
	
	function saveStorage( groupid, diskid, userid, callback )
	{
		// TODO: add workgroupid or diskid to id's ...
		
		let uuid = (groupid?'_'+groupid:'');
		
		if( !groupid ) groupid = 0;
		
		var elems = {};
		
		var inputs = ge( 'StorageGui'+uuid ).getElementsByTagName( 'input' );
	
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
	
		var texts = ge( 'StorageGui'+uuid ).getElementsByTagName( 'textarea' );
	
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
	
		var selects = ge( 'StorageGui'+uuid ).getElementsByTagName( 'select' );
	
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
		
		if( ShowLog ) console.log( { userid: ( userid ? userid : '0' ), diskid: diskid, elems: elems } );
		
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
			if( elems[ 'Path'          ] ) data.Path        = elems[ 'Path'      ].value;
			if( elems[ 'Type'          ] ) data.Type        = elems[ 'Type'      ].value;
			if( elems[ 'Workgroup'     ] ) data.WorkgroupID = elems[ 'Workgroup' ].value;
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
			
			var skip = false;
			
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
					Notify( { title: i18n( 'i18n_disk_success' ), text: ( dat ? dat : i18n( 'i18n_disk_edited' ) ) } );
				}
				
				if( !data.ID || ( elems[ 'Name' ].hasAttribute('data-mount-state') && elems[ 'Name' ].getAttribute('data-mount-state') == '1' ) )
				{
					remountDisk( ( elems[ 'Name' ] && elems[ 'Name' ].current ? elems[ 'Name' ].current : data.Name ), data.Name, data.userid, groupid, function()
					{
						// Refresh init.refresh();
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						
						if( callback )
						{
							callback();
						}
					}, skip );					
				}
				else if( callback )
				{
					callback();
				}
			}
			
			if( ShowLog ) console.log( data );
			
			// if the disk is mounted, we need to unmount it based on its old name first.
			if( elems[ 'Name' ].hasAttribute('data-stored-value') && elems[ 'Name' ].hasAttribute('data-mount-state') && elems[ 'Name' ].getAttribute('data-mount-state') == '1' )
			{
				unmountDisk( elems[ 'Name' ].getAttribute('data-stored-value'), userid, groupid, function( e, d )
				{
					skip = true;
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
	
	function mountStorage( devname, userid, groupid, _this, callback )
	{
		if( devname && _this )
		{
			if( _this.innerHTML.toLowerCase().indexOf( 'unmount' ) >= 0 )
			{
				unmountDisk( devname, userid, groupid, function( e, d )
				{
					if( ShowLog ) console.log( 'unmountDrive( '+devname+', '+( userid ? userid : '0' )+' ) ', { e:e, d:d } );
					
					if( e == 'ok' )
					{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						
						if( ShowLog ) console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
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
						Notify( { title: i18n( 'i18n_fail_unmount' ), text: ( d ? d : i18n( 'i18n_fail_unmount_more' ) ) } );
					}
				
				} );
			}
			else
			{
				mountDisk( devname, userid, groupid, function( e, d )
				{
					if( ShowLog ) console.log( 'mountDrive( '+devname+', '+( userid ? userid : '0' )+' ) ', { e:e, d:d } );
				
					if( e == 'ok' )
					{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
					
						if( ShowLog ) console.log( 'Application.sendMessage( { type: \'system\', command: \'refreshdoors\' } );' );
					
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
						Notify( { title: i18n( 'i18n_fail_mount' ), text: ( d ? d : i18n( 'i18n_fail_mount_more' ) ) } );
					}
				
				} );
			}
		}
	}
	
	function mountDisk( devname, userid, groupid, callback )
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
				
				if( groupid > 0 ) vars.groupid = groupid;
				
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
					'objectid' : ( userid ? userid : '0' ),
					'groupid'  : groupid ? groupid : 0
				} );
			}
		
			var f = new Library( 'system.library' );
		
			f.onExecuted = function( e, d )
			{
				if( ShowLog || e != 'ok' ) console.log( 'mountDisk ( device/mount ) ', { vars: vars, e:e, d:d } );
			
				if( callback ) callback( e, d );
			}
		
			f.execute( 'device/mount', vars );
		}
	}

	function unmountDisk( devname, userid, groupid, callback )
	{
		console.log( 'Are we unmounting? dev: ' + devname + ' userid: ' + userid + ' groupid: ' + groupid );
		if( !groupid ) groupid = 0;
		
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
				
				if( groupid > 0 )
					vars.groupid = groupid;
				
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
					'objectid' : ( userid ? userid : '0' ),
					'groupid'  : groupid ? groupid : 0
				} );
			}
			
			var f = new Library( 'system.library' );
		
			f.onExecuted = function( e, d )
			{
				if( ShowLog || e != 'ok' ) console.log( 'unmountDisk ( device/unmount ) ', { vars: vars, e:e, d:d } );
			
				if( callback ) callback( e, d );
			}
		
			f.execute( 'device/unmount', vars );
		}
	}
	
	function remountDisk( oldname, newname, userid, groupid, callback, skip )
	{
		if( oldname && newname )
		{
			if( skip )
			{
				mountDisk( newname, userid, groupid, function( e, d )
				{
				
					if( e != 'ok' )
					{
						Notify( { title: i18n( 'i18n_fail_mount' ), text: ( d ? d : i18n( 'i18n_fail_mount_more' ) ) } );
					}
				
					if( callback ) callback( e, d );
			
				} );
			}
			else
			{
				unmountDisk( oldname, userid, groupid, function( e, d )
				{
				
					if( e != 'ok' )
					{
						Notify( { title: i18n( 'i18n_fail_unmount' ), text: ( d ? d : i18n( 'i18n_fail_unmount_more' ) ) } );
					}
				
					mountDisk( newname, userid, groupid, function( e, d )
					{
					
						if( e != 'ok' )
						{
							Notify( { title: i18n( 'i18n_fail_mount' ), text: ( d ? d : i18n( 'i18n_fail_mount_more' ) ) } );
						}
					
						if( callback ) callback( e, d );
				
					} );
			
				} );
			}
		}
	}
	
	function updateRole( rid, groupid, _this )
	{
		
		var data = '';

		if( _this )
		{
			if( _this.checked )
			{
				data = 'Activated';
			}
			
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
				if( ShowLog ) console.log( { e:e, d:d } );
			}
			m.execute( 'userroleupdate', { id: rid, groupid: groupid, data: data, authid: Application.authId } );
		}
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id, pid, psub, sub )
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
						if( ShowLog || 1==1 ) console.log( { e:e, d:d, args: args, pid: pid, psub: psub, sub: sub } );
						
						//Sections.accounts_workgroups( 'refresh' ); 
					
						//refresh( null, null, psub ); cancel( null, psub );
						
						if( ge( 'SlideContainer' ) )
						{
							ge( 'SlideContainer' ).className = ge( 'SlideContainer' ).className.split( ' Slide' ).join( '' );
							
							ge( 'SubWorkgroupDetails' ).innerHTML = '';
						}
						
						if( pid > 0 && sub > 0 )
						{
							//console.log( 'scenario 2' );
							
							refresh( sub, null, psub ); cancel( null, psub );
						}
						
						else
						{
							//console.log( 'scenario 1' );
							
							refresh( null, null, psub ); cancel( null, psub );
						}
							
					}
					f.execute( 'group/delete', { id: id, authid: Application.authId, args: args } );
					
				}
				
			/*}
		} );*/
		
	}
	
	function removeStorage( diskid, userid, gid, devname, callback )
	{
		if( diskid && devname )
		{
			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove' ), function( r )
			{
				if( r && r.data == true )
				{
					// This is the hard delete method, used by admins ...
					
					// TODO: Add the userid of the user that created the disk in all ...
					
					if( ShowLog ) console.log( { diskid: diskid, userid: ( userid ? userid : '0' ), devname: devname } );
					
					//unmountDrive( devname, false, false, function()
					//{
						Application.sendMessage( { type: 'system', command: 'refreshdoors' } );
						
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							if( ShowLog ) console.log( 'deletedoor', { id:diskid, e:e, d:d } );
						
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
						
						m.execute( 'deletedoor', { id: diskid, groupid: gid ? gid : 0, userid: ( userid ? userid : '0' ), authid: Application.authId } );
					
					//} );
				
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
		
		// Using the same function that is used for fileInfo
		var humanFS = HumanFileSize( bytes );
	
		if( humanFS )
		{
			var size = humanFS.split( ' ' )[0];
			var unit = humanFS.split( ' ' ).pop();
		
			if( units === 2 ) return unit;
		
			// Decimals are set to fixed = 1 ...
		
			return ( !units ? size : ( size + unit ) );
		}
	
		return ( !units ? '' : '0B' );
	
		// Old method ...
		
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
				id        : _this.id,
				className : _this.className, 
				innerHTML : _this.innerHTML, 
				onclick   : ( _this.onclick ? _this.onclick : function () {} ) 
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
			_this.id = /*( _this.id ? _this.id : */'EditMode'/* )*/;
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
	
	function editMode( close, id )
	{
		if( ShowLog ) console.log( 'editMode() ', ge( 'GroupEditButtons'+(id?'_'+id:'') ) );
		
		if( ge( 'GroupEditButtons'+(id?'_'+id:'') ) )
		{
			ge( 'GroupEditButtons'+(id?'_'+id:'') ).className = ( close ? 'Closed' : 'Open' );
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
				if( typeof ge( 'EditMode' ).savedState.id != 'undefined' )
				{
					ge( 'EditMode' ).id = ge( 'EditMode' ).savedState.id;
				}
				else
				{
					ge( 'EditMode' ).removeAttribute( 'id' );
				}
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
				
				// TODO: Get these id's ...
				
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
	
	function loading( id, pid, psub, sub )
	{
		if( ShowLog/* || 1==1*/ ) console.log( 'loading( '+id+', '+pid+', '+psub+', '+sub+' )' );
		
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
								
					list( function( groups )
					{
						
						info.workgroups = ( groups ? groups : null );
						
						loadingList[ ++loadingSlot ]( info );
						
					}, false, id );
				
				},
				
				// Get all users
				
				function()
				{
					
					listUsers( function( e, d )
					{
						
						info.users = d;
						
						if( ShowLog ) console.log( 'info.users ', info.users );
						
						loadingList[ ++loadingSlot ]( info );
						
					}, false, true );
					
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
						if( ShowLog ) console.log( { e:e, d:d } );
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
					
					initDetails( info, psub, sub );
				}
			
			];
		
			loadingList[ 0 ]();
		
			return;
		}
		else
		{
			var info = {};
			
			if( pid != null )
			{
				info.workgroup = { parentid : pid };
			}
			
			list( function( groups )
			{
				
				info.workgroups = ( groups ? groups : null );
				
				initDetails( info, psub, ( sub == 'new_sub' ? sub : null ) );
				
			} );
			
		}
	}
	
	// Show the form
	function initDetails( info, psub, sub )
	{
		let uuid = (info.ID?'_'+info.ID:'');
		
		var sub = ( sub ? sub : null );
		
		var workgroup  = ( info.workgroup  ? info.workgroup  : {} );
		var workgroups = ( info.workgroups ? info.workgroups : [] );
		var mountlist  = ( info.mountlist  ? info.mountlist  : {} );
		var roles      = ( info.roles      ? info.roles      : [] );
		var users      = ( workgroup.users ? workgroup.users : [] );
		var list       = ( info.users      ? info.users      : [] );
		
		let groups = {};
		
		if( ShowLog/* || 1==1*/ ) console.log( 'initDetails() ', info );
		
		// Workgroups
		var pstr = '';
		
		if( workgroups && workgroups.length )
		{
			pstr += '<option value="0">none</option>';
			
			for( var w in workgroups )
			{
				if( workgroups[w] && workgroups[w].ID && workgroups[w].Name )
				{
					if( workgroup && ( workgroups[w].ID == workgroup.groupid || workgroups[w].ParentID == workgroup.groupid ) )
					{
						continue;
					}
					
					pstr += '<option value="' + workgroups[w].ID + '"' + ( workgroup && workgroup.parentid == workgroups[w].ID ? ' selected="selected"' : '' ) + '>' + workgroups[w].Name + '</option>';
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
				rstr += '	<div class="PaddingSmall HContent80 FloatLeft Ellipsis" title="' + roles[a].Name + '">'
				rstr += '		<span name="' + roles[a].Name + '" style="display: none;"></span>';
				rstr += '		<strong>' + roles[a].Name + '</strong>';
				rstr += '	</div>';
				rstr += '	<div class="PaddingSmall HContent20 FloatLeft Ellipsis">';
				
				if( Application.checkAppPermission( [ 
					'PERM_ROLE_CREATE_GLOBAL', 'PERM_ROLE_CREATE_IN_WORKGROUP', 
					'PERM_ROLE_UPDATE_GLOBAL', 'PERM_ROLE_UPDATE_IN_WORKGROUP', 
					'PERM_ROLE_GLOBAL',        'PERM_ROLE_WORKGROUP' 
				] ) )
				{
					//rstr += '<button onclick="Sections.accounts_workgroups(\'update_role\',{rid:'+roles[a].ID+',groupid:'+workgroup.groupid+',_this:this})" class="IconButton IconSmall ButtonSmall FloatRight' + ( roles[a].WorkgroupID ? ' fa-toggle-on' : ' fa-toggle-off' ) + '"></button>';
					
					rstr += CustomToggle( 'rid'+uuid+'_'+roles[a].ID, 'FloatRight', null, 'Sections.accounts_workgroups(\'update_role\',{rid:'+roles[a].ID+',groupid:'+workgroup.groupid+',_this:this})', ( roles[a].WorkgroupID ? true : false ) );
					
				}
				
				rstr += '	</div>';
				rstr += '</div>';
				
			}
		}
		
		let gbackbtn = '';
		
		if( !psub )
		{
			gbackbtn += '<button class="IconButton IconMedium ButtonSmall FloatLeft fa-arrow-circle-left" id="GroupBackBtn'+uuid+'"></button>';
			gbackbtn += '<h3 class="NoMargin FloatLeft">';
			gbackbtn += '	<strong>' + i18n( 'i18n_workgroup_list' ) + '</strong>';
			gbackbtn += '</h3>';
		}
		else
		{
			gbackbtn += '<button class="IconButton IconMedium ButtonSmall FloatLeft">&nbsp;</button>';
			gbackbtn += '<h3 class="NoMargin FloatLeft">';
			gbackbtn += '	<strong>&nbsp;</strong>';
			gbackbtn += '</h3>';
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_workgroup_details.html' );
		
		// Add all data for the template
		d.replacements = {
			id                    : ( info.ID               ? ( '_' + info.ID )     : ''                                                                                ),
			workgroup_back_btn    : gbackbtn,
			workgroup_edit        : ( psub ? i18n( 'i18n_subworkgroup_details' )    : i18n( 'i18n_workgroup_details' )                                                  ),
			workgroup_title       : ( workgroup.name        ? workgroup.name        : i18n( 'i18n_new_workgroup' )                                                      ),
			workgroup_name        : ( workgroup.name        ? workgroup.name        : ''                                                                                ),
			workgroup_parent      : pstr,
			workgroup_description : ( workgroup.description ? workgroup.description : ''                                                                                ),
			users_count           : ( list && list.Count ? '(' + list.Count + ')'   : '(0)'                                                                             ),
			storage               : '',
			roles                 : ''
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			if( psub )
			{
				ge( 'SubWorkgroupDetails' ).innerHTML = data;
				
				if( ge( 'SlideContainer' ) )
				{
					ge( 'SlideContainer' ).className = ge( 'SlideContainer' ).className.split( ' Slide' ).join( '' ) + ' Slide';
				}
			}
			else
			{
				ge( 'WorkgroupDetails'    ).innerHTML = data;
			}
			
			if( psub && ge( 'SlideContainer' ) && ge( 'SlideContainer' ).className.indexOf( 'Slide' ) >= 0 )
			{
				if( ge( 'WorkgroupNavContainer_'+psub ) )
				{
					ge( 'WorkgroupNavContainer_'+psub ).className = ge( 'WorkgroupNavContainer_'+psub ).className.split( ' Closed' ).join( '' );
				}
				if( ge( 'WorkgroupNavContainer'+uuid ) )
				{
					ge( 'WorkgroupNavContainer'+uuid ).className = ge( 'WorkgroupNavContainer'+uuid ).className.split( ' Closed' ).join( '' );
				}
			}
			else
			{
				if( ge( 'WorkgroupNavContainer'+uuid ) )
				{
					ge( 'WorkgroupNavContainer'+uuid ).className = ge( 'WorkgroupNavContainer'+uuid ).className.split( ' Closed' ).join( '' ) + ' Closed';
				}
			}
			
			//console.log( { id: info.ID, pid: workgroup.parentid, psub: psub, sub: sub } );
			
			if( !info.ID )
			{
				ge( 'GroupDeleteBtn'+uuid ).style.display = 'none';
				ge( 'GroupLockBtn'+uuid   ).style.display = 'none';
				
				ge( 'AdminSubWorkgroupContainer'+uuid ).style.display = 'none';
				ge( 'AdminUsersContainer'+uuid        ).style.display = 'none';
				ge( 'AdminStorageContainer'+uuid      ).style.display = 'none';
				ge( 'AdminRolesContainer'+uuid        ).style.display = 'none';
			}
			else
			{
				ge( 'GroupEditButtons'+uuid ).className = 'Closed';
				
				if( ge( 'WorkgroupBasicDetails'+uuid ) )
				{
					var inps = ge( 'WorkgroupBasicDetails'+uuid ).getElementsByTagName( '*' );
					if( inps.length > 0 )
					{
						for( var a = 0; a < inps.length; a++ )
						{
							if( inps[ a ].id && [ 
								'WorkgroupName'+uuid, 
								'WorkgroupParent'+uuid, 
								'WorkgroupDescription'+uuid 
							].indexOf( inps[ a ].id ) >= 0 )
							{
								( function( i ) {
									i.onclick = function( e )
									{
										editMode( null, info.ID );
									}
								} )( inps[ a ] );
							}
						}
					}
				}
				
				//ge( 'AdminUsersContainer'+uuid ).className = 'Open';
			}
			
			var bg1  = ge( 'GroupSaveBtn'+uuid );
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
							if( ShowLog ) console.log( '// save workgroup' );
					
							update( info.ID, psub, sub );
						}
						else
						{
							if( ShowLog ) console.log( '// create workgroup' );
							
							create( psub, function( ret )
							{
								
								sub = ret;
								
							} );
						}
					}
				}
				else
				{
					bg1.style.display = 'none';
				}
			}
			var bg2  = ge( 'GroupCancelBtn'+uuid );
			if( bg2 ) bg2.onclick = function( e )
			{
				if( info.ID )
				{
					edit( info.ID, null, null, psub, sub );
				}
				else
				{
					if( psub )
					{
						//console.log( { psub: psub, sub: sub } );
						
						if( sub == 'new_sub' )
						{
							edit( psub, null, null, psub, null );
						}
						else
						{
							cancel( null, psub );
							
							if( ge( 'SlideContainer' ) )
							{
								ge( 'SlideContainer' ).className = ge( 'SlideContainer' ).className.split( ' Slide' ).join( '' );
							}
							
							if( ge( 'WorkgroupNavContainer_'+psub ) )
							{
								ge( 'WorkgroupNavContainer_'+psub ).className = ge( 'WorkgroupNavContainer_'+psub ).className.split( ' Closed' ).join( '' ) + ' Closed';
							}
							
						}
					}
					else
					{
						cancel();
					}
				}
			}
			var bg3  = ge( 'GroupBackBtn'+uuid );
			if( bg3 ) bg3.onclick = function( e )
			{
				
				if( ge( 'SlideContainer' ) )
				{
					ge( 'SlideContainer' ).className = ge( 'SlideContainer' ).className.split( ' Slide' ).join( '' );
				}
				
				if( ge( 'WorkgroupNavContainer'+uuid ) )
				{
					ge( 'WorkgroupNavContainer'+uuid ).className = ge( 'WorkgroupNavContainer'+uuid ).className.split( ' Closed' ).join( '' ) + ' Closed';
				}
				
				if( ge( 'WorkgroupNavContainer_'+sub ) )
				{
					ge( 'WorkgroupNavContainer_'+sub ).className = ge( 'WorkgroupNavContainer_'+sub ).className.split( ' Closed' ).join( '' ) + ' Closed';
				}
				
			}
			
			var bg4  = ge( 'GroupDeleteBtn'+uuid );
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
							if( ShowLog ) console.log( '// delete workgroup' );
			
							removeBtn( this, { id: info.ID, pid: workgroup.parentid, psub: psub, sub: sub, button_text: 'i18n_delete_workgroup', }, function ( args )
							{
				
								remove( args.id, args.pid, args.psub, args.sub );
				
							} );
						}
					
					};
					
					if( workgroup && workgroup.status == 2 )
					{
						bg4.style.display = 'none';
					}
					
				}
				else
				{
					bg4.style.display = 'none';
				}
			}
			
			var bg5  = ge( 'GroupLockBtn'+uuid );
			if( bg5 )
			{
				if( Application.checkAppPermission( [ 
					'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP',
					'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
					'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
				] ) )
				{
					if( workgroup && workgroup.status == 2 )
					{
						//bg5.className = bg5.className.split( 'fa-unlock-alt' ).join( 'fa-lock' );
						bg5.className = bg5.className.split( 'fa-lock' ).join( 'fa-unlock-alt' );
					}
					
					bg5.onclick = function(  )
					{
						let self = this;
						
						//if( self.className.indexOf( 'fa-lock' ) >= 0 )
						if( self.className.indexOf( 'fa-unlock-alt' ) >= 0 )
						{
							
							if( groups && workgroup.groupid > 0 && groups[ workgroup.groupid ].groups.length > 0 )
							{
								Notify( { title: i18n( 'i18n_unlock_workgroup_failed' ), text: i18n( 'i18n_cannot_unlock_workgroup' ) } );
								return;
							}
							
							// Unlock workgroup ...
							
							if( info.ID )
							{
								updateStatus( info.ID, 0, function( res )
								{
									
									if( res )
									{
										//self.className = self.className.split( 'fa-lock' ).join( 'fa-unlock-alt' );
										self.className = self.className.split( 'fa-unlock-alt' ).join( 'fa-lock' );
										bg4.style.display = null;
									}
									
								} );
							}
						}
						else
						{
							// Lock workgroup ...
							
							if( info.ID )
							{
								updateStatus( info.ID, 2, function( res )
								{
									
									if( res )
									{
										//self.className = self.className.split( 'fa-unlock-alt' ).join( 'fa-lock' );
										self.className = self.className.split( 'fa-lock' ).join( 'fa-unlock-alt' );
										bg4.style.display = 'none';
									}
									
								} );
							}
						}
					}
				}
				else
				{
					bg5.style.display = 'none';
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
								
								if( ge( 'WorkgroupUsers'+uuid ) )
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
										
										ge( 'WorkgroupUsers'+uuid ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
									}
								}
								
								break;
								
						}
						
					},
					
					mode : { users : 'list', workgroups : 'list' },
					
					// Workgroups --------------------------------------------------------------------------------------
					
					workgroups : function ( func )
					{
						
						var init = 
						{
							
							func : this,
							
							hide : false,
							
							head : function (  )
							{
								
								// Heading ...
								
								let o = ge( 'SubWorkgroupGui'+uuid ); if( o ) o.innerHTML = '';
								
								let divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											let d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function( _this ) 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortgroups( 'Name' );
													};
													return d;
												}( this ) 
											}, 
											{ 
												'element' : function(  ) 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong></strong>';
													return d;
												}(  )
											},
											{ 
												'element' : function(  ) 
												{
													let d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
													return d;
												}(  )
											}
										]
									},
									{
										'element' : function() 
										{
											let d = document.createElement( 'div' );
											d.className = 'List HRow PaddingTop PaddingRight PaddingBottom';
											d.style.overflow = 'auto';
											d.style.maxHeight = '314px';
											d.id = 'SubWorkgroupInner'+uuid;
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
							
							list : function ( wgroups )
							{
								
								this.head();
								
								// Groups are set higher up to be used in other places in the scope.
								
								groups = ( groups ? groups : {} );
								
								workgroups = ( wgroups ? wgroups : workgroups );
								
								if( workgroups )
								{
									var unsorted = {};
									
									// Add all workgroups to unsorted and add subgroups array ...
									
									for( var i in workgroups )
									{
										if( workgroups[i] && workgroups[i].ID )
										{
											if( wgroups && !wgroups[workgroups[i].ID] )
											{
												continue;
											}
											
											unsorted[workgroups[i].ID] = {};
											
											for( var ii in workgroups[i] )
											{
												if( workgroups[i][ii] )
												{
													unsorted[workgroups[i].ID][ii] = workgroups[i][ii];
												}
											}
											
											unsorted[workgroups[i].ID].level = 1;
											unsorted[workgroups[i].ID].groups = [];
										}
									}
									
									// Arrange all subgroups to parentgroups ...
									
									let set = [];
					
									for( var k in unsorted )
									{
										if( unsorted[k].ParentID > 0 && unsorted[ unsorted[k].ParentID ] )
										{
											
											unsorted[ unsorted[k].ParentID ].groups.push( unsorted[k] );
											
											if( unsorted[ unsorted[k].ParentID ].groups )
											{
												for( var kk in unsorted[ unsorted[k].ParentID ].groups )
												{
													if( unsorted[ unsorted[k].ParentID ].groups[ kk ] )
													{
														unsorted[ unsorted[k].ParentID ].groups[ kk ].level = ( unsorted[ unsorted[k].ParentID ].level +1 );
													}
												}
											}
											
											set.push( unsorted[k].ID );
											
											
										}
										
										
									}
									
									groups = unsorted;
									
									if( /*1==1 || */ShowLog ) console.log( [ unsorted, set, groups ] );
								}
								
								
								var ii = 0;
								
								var str = ''; var rows = '';
								
								var s = ( workgroup.groupid ? workgroup.groupid : 0 );
								
								if( s > 0 && groups && groups[s] )
								{
									if( groups[s].level >= 3 )
									{
										this.hide = true;
									}
									
									//console.log( { psub: psub, sub: sub } );
									
									if( groups[s].groups.length > 0 )
									{
										for( var a in groups[s].groups )
										{
											rows = ( groups[s].groups[a] ? groups[s].groups[a] : null );
										
											if( rows )
											{
												ii++;
											
												str += '<div>';
												
												sub = rows.ID;
												
												str += '<div class="HRow'+(rows.Hide||!rows.Owner?' Hidden':'')+'" id="SubWorkgroupID_'+rows.ID+'" onclick="Sections.accounts_workgroups( \'edit_sub\',{id:'+rows.ID+',psub:'+info.ID+'});">';
						
												str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
												str += '		<span name="'+rows.Name+'" class="IconMedium fa-users"></span>';
												str += '	</div>';
												str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent90 InputHeight FloatLeft Ellipsis">'+rows.Name+(rows.Owner?' (by '+rows.Owner+')':'')+'</div>';
												str += '</div>';
												
												if( rows.groups.length > 0 )
												{
													str += '<div class="SubGroups">';
												
													for( var aa in groups[s].groups[a].groups )
													{
														rows = ( groups[s].groups[a].groups[aa] ? groups[s].groups[a].groups[aa] : null );
												
														if( rows )
														{
															ii++;
															
															str += '<div class="HRow'+(rows.Hide||!rows.Owner?' Hidden':'')+'" id="SubWorkgroupID_'+rows.ID+'" onclick="Sections.accounts_workgroups( \'edit_sub\',{id:'+rows.ID+',psub:'+info.ID+'})">';
															str += '	<div class="TextCenter HContent4 InputHeight FloatLeft PaddingSmall" style="min-width:36px"></div>';
															str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
															str += '		<span name="'+rows.Name+'" class="IconMedium fa-users"></span>';
															str += '	</div>';
															str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent80 InputHeight FloatLeft Ellipsis">'+rows.Name+(rows.Owner?' (by '+rows.Owner+')':'')+'</div>';
															str += '</div>';
														
															if( rows.groups.length > 0 )
															{
																str += '<div class="SubGroups">';
													
																for( var aaa in groups[s].groups[a].groups[aa].groups )
																{
																	rows = ( groups[s].groups[a].groups[aa].groups[aaa] ? groups[s].groups[a].groups[aa].groups[aaa] : null );
															
																	if( rows )
																	{
																		ii++;
																	
																		str += '<div class="HRow'+(rows.Hide||!rows.Owner?' Hidden':'')+'" id="SubWorkgroupID_'+rows.ID+'" onclick="Sections.accounts_workgroups( \'edit_sub\',{id:'+rows.ID+',psub:'+info.ID+'})">';
																		str += '	<div class="TextCenter HContent8 InputHeight FloatLeft PaddingSmall" style="min-width:73px"></div>';
																		str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
																		str += '		<span name="'+rows.Name+'" class="IconMedium fa-users"></span>';
																		str += '	</div>';
																		str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent70 InputHeight FloatLeft Ellipsis">'+rows.Name+(rows.Owner?' (by '+rows.Owner+')':'')+'</div>';
																		str += '</div>';
																	}
															
																}
													
																str += '</div>';
															}
														}
												
													}
											
													str += '</div>';
												}
										
												str += '</div>';
											}
										
										}
									}
								}
								
								
								
								if( ge( 'SubWorkgroupInner'+uuid ) )
								{
									ge( 'SubWorkgroupInner'+uuid ).innerHTML = str;
								}
								
								if( ge( 'AdminSubWorkgroupCount'+uuid ) )
								{
									ge( 'AdminSubWorkgroupCount'+uuid ).innerHTML = '(' + ii + ')';
								}
								
								this.sortgroups( 'Name', 'ASC' );
								
								var inp = ge( 'AdminSubWorkgroupContainer'+uuid ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchgroups( this.value );
								}
								ge( 'SubWorkgroupSearchCancelBtn'+uuid ).onclick = function( e )
								{
									init.searchgroups( false );
									inp.value = '';
								}
								
							},
							
							searchgroups : function ( filter, server )
							{
								
								if( ge( 'SubWorkgroupInner'+uuid ) )
								{
									var list = ge( 'SubWorkgroupInner'+uuid ).getElementsByTagName( 'div' );
									
									ge( 'SubWorkgroupInner'+uuid ).className = ge( 'SubWorkgroupInner'+uuid ).className.split( ' Visible' ).join( '' ) + ( filter ? ' Visible' : '' );
									
									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
								
											var strong = list[a].getElementsByTagName( 'strong' )[0];
											var span = list[a].getElementsByTagName( 'span' )[0];
								
											if( strong || span )
											{
									
												if( !filter || filter == '' 
												|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
										
													if( list[a].parentNode.parentNode && list[a].parentNode.parentNode.parentNode && list[a].parentNode.parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
													{
														//if( list[a].parentNode.classList.contains( 'Closed' ) )
														//{
														//	list[a].parentNode.classList.remove( 'Closed' );
														//	list[a].parentNode.classList.add( 'Open' );
														//}
											
														list[a].parentNode.style.display = '';
														list[a].parentNode.parentNode.style.display = '';
													}
												}
												else if( list[a].parentNode && list[a].parentNode.className )
												{
													list[a].style.display = 'none';
												}
											}
										}

									}
						
									if( ge( 'SubWorkgroupSearchCancelBtn'+uuid ) )
									{
										if( !filter && ( ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.remove( 'Open' );
											ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.add( 'Closed' );
								
											if( list.length > 0 )
											{
												for( var a = 0; a < list.length; a++ )
												{
													if( list[a].classList.contains( 'Open' ) )
													{
														list[a].classList.remove( 'Open' );
														list[a].classList.add( 'Closed' );
													}
												}
											}
										}
							
										else if( filter != '' && ( ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.remove( 'Closed' );
											ge( 'SubWorkgroupSearchCancelBtn'+uuid ).classList.add( 'Open' );
										}
									}
								}
					
							},
							
							sortgroups : function ( sortby, orderby )
							{
					
								//
								
								var _this = ge( 'SubWorkgroupInner'+uuid );
					
								if( _this )
								{
									orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
						
									var list = _this.getElementsByTagName( 'div' );
						
									if( list.length > 0 )
									{
										var output = [];
							
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
							
										for( var a = 0; a < list.length; a++ )
										{
											if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
								
											var span = list[a].getElementsByTagName( 'span' )[0];
								
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' && span.getAttribute( sortby.toLowerCase() ) )
											{
												if( !list[a].parentNode.className )
												{
													var obj = { 
														sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
														content : list[a].parentNode
													};
									
													output.push( obj );
												}
											}
										}
							
										if( output.length > 0 )
										{
											// Sort ASC default
								
											output.sort( callback );
								
											// Sort DESC
								
											if( orderby == 'DESC' ) 
											{ 
												output.reverse();  
											}
								
											_this.innerHTML = '';
								
											_this.setAttribute( 'orderby', orderby );
								
											for( var key in output )
											{
												if( output[key] && output[key].content )
												{
													// Add row
													_this.appendChild( output[key].content );
												}
											}
										}
									}
								}
					
							},
							
							refresh : function ( groups )
							{
								
								switch( this.func.mode[ 'workgroups' ] )
								{
									
									case 'list':
										
										this.list( groups );
										
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
								
							case 'refresh':
								
								init.refresh();
								
								break;
							
							default:
								
								// Show listed workgroups ... 
						
								init.list();
								
								var etn = ge( 'SubWorkgroupEdit'+uuid );
								if( etn )
								{
									if( !init.hide && Application.checkAppPermission( [ 
										
										'WORKGROUP_CREATE',
										
										'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
										'PERM_WORKGROUP_UPDATE_GLOBAL', 'PERM_WORKGROUP_UPDATE_IN_WORKGROUP', 
										'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP'
										 
									] ) )
									{
										//console.log( { psub: psub, sub: sub } );
										
										etn.onclick = function( e )
										{
											edit( false, false, workgroup.groupid, workgroup.groupid, ( psub ? 'new_sub' : sub ) );
										};
									}
									else
									{
										etn.style.display = 'none';
									}
								}
								
								break;
								
						}
						
					},
					
					// Users -------------------------------------------------------------------------------------------
					
					users : function ( func )
					{
						
						// Editing Users
						
						var init =
						{
							
							func : this,
							
							ids  : this.userids,
							
							head : function ( hidecol )
							{
								
								var inp = ge( 'AdminUsersContainer'+uuid ).getElementsByTagName( 'input' )[0];
								inp.value = '';
								
								if( ge( 'UsersSearchCancelBtn'+uuid ) && ge( 'UsersSearchCancelBtn'+uuid ).classList.contains( 'Open' ) )
								{
									ge( 'UsersSearchCancelBtn'+uuid ).classList.remove( 'Open' );
									ge( 'UsersSearchCancelBtn'+uuid ).classList.add( 'Closed' );
								}
								
								var o = ge( 'UsersGui'+uuid ); o.innerHTML = '<input type="hidden" id="WorkgroupUsers'+uuid+'">';
								
								this.func.updateids( 'users' );
								
								if( ShowLog ) console.log( 'userids: ', this.ids );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft'/*  + ( hidecol ? ' Closed' : '' )*/;
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortusers( 'FullName' );
													};
													return d;
												}( this ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 FloatLeft Relative'/*  + ( hidecol ? ' Closed' : '' )*/;
													d.innerHTML = '<strong>' + i18n( 'i18n_username' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortusers( 'Name' );
													};
													return d;
												}( this )
											},
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallRight HContent20 TextCenter FloatLeft Relative'/* + ( hidecol ? ' Closed' : '' )*/;
													d.innerHTML = '<strong>' + i18n( 'i18n_status' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortusers( 'Status' );
													};
													return d;
												}( this )
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
													return d;
												}()
											}
										]
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow List PaddingTop PaddingRight PaddingBottom';
											d.style.overflow = 'auto';
											d.style.maxHeight = '369px';
											d.id = 'UsersInner'+uuid;
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
							
							list : function ( users )
							{
								
								// TODO: Refresh and list only added users to workgroups because of server search ...
								
								if( users ) console.log( 'users list: ', users );
								
								var ii = 0;
								
								if( list )
								{
									this.head();
									
									var o = ge( 'UsersInner'+uuid ); o.innerHTML = '';
									
									this.func.mode[ 'users' ] = 'list';
									
									for( var k in list )
									{
										if( list[k] && list[k].ID )
										{
											var found = false;
											
											if( this.ids && this.ids[ list[k].ID ] )
											{
												found = true;
											}
											
											if( !found/* || list[k].Status == 1*/ ) continue;
											
											var status = [ 'Active', 'Disabled', 'Locked' ];
											
											var divs = appendChild( [
												{ 
													'element' : function() 
													{
														var d = document.createElement( 'div' );
														d.className = 'HRow ' + status[ ( list[k].Status ? list[k].Status : 0 ) ];
														d.id = ( 'UserListID'+uuid+'_' + list[k].ID );
														return d;
													}(),
													'child' : 
													[ 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'TextCenter PaddingSmall HContent10 InputHeight FloatLeft Ellipsis';
																return d;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'span' );
																		d.setAttribute( 'FullName', list[k].FullName );
																		d.setAttribute( 'Name', list[k].Name );
																		d.setAttribute( 'Status', status[ ( list[k].Status ? list[k].Status : 0 ) ] );
																		//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
																		d.className = 'IconMedium fa-user-circle-o avatar';
																		//d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		//d.style.backgroundSize = 'contain';
																		//d.style.width = '24px';
																		//d.style.height = '24px';
																		//d.style.display = 'block';
																		d.style.position = 'relative';
																		return d;
																	}(), 
																	 'child' : 
																	[ 
																		{
																			'element' : function() 
																			{
																				var d = document.createElement( 'div' );
																				if( 1!=1 && list[k].Avatar )
																				{
																					d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																					d.style.backgroundSize = 'contain';
																					d.style.backgroundPosition = 'center center';
																					d.style.backgroundRepeat = 'no-repeat';
																					d.style.position = 'absolute';
																					d.style.top = '-2px';
																					d.style.left = '0';
																					d.style.width = '100%'/*'24px'*/;
																					d.style.height = '100%'/*'24px'*/;
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
																d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<span class="PaddingSmallRight">' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</span>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<span class="PaddingLeft PaddingRight">' + ( list[k].Name ? list[k].Name : '' ) + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent20 InputHeight TextCenter FloatLeft Ellipsis';
																d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + ( status[ ( list[k].Status ? list[k].Status : 0 ) ] ) + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'HContent15 InputHeight FloatLeft Ellipsis';
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
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, id: id, func: func, pnt: pnt }, function ( args )
																				{
																				
																					if( ShowLog ) console.log( 'removeUser( '+args.id+', '+info.ID+', callback, vars )' );
																				
																					removeUser( args.id, info.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																							vars.func.updateids( 'users', vars.uid, false );
																						
																							if( vars.pnt )
																							{
																								vars.pnt.innerHTML = '';
																							}
																							
																							if( ge( 'AdminUsersCount'+uuid ) )
																							{
																								if( ge( 'AdminUsersCount'+uuid ).innerHTML )
																								{
																									var count = ge( 'AdminUsersCount'+uuid ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
																									
																									if( count && count > 0 )
																									{
																										var result = ( count - 1 );
							
																										if( result >= 0 )
																										{
																											ge( 'AdminUsersCount'+uuid ).innerHTML = '(' + result + ')';
																										}
																									}
																								}
																							}
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
											
											ii++;
										}
									
									}
									
								}
								
								if( ge( 'AdminUsersCount'+uuid ) )
								{
									ge( 'AdminUsersCount'+uuid ).innerHTML = '(' + ii + ')';
								}
								
								this.sortusers( 'Name', 'ASC' );
								
								var inp = ge( 'AdminUsersContainer'+uuid ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchusers( this.value );
								}
								ge( 'UsersSearchCancelBtn'+uuid ).onclick = function( e )
								{
									init.searchusers( false );
									inp.value = '';
								}
									
							},
							
							edit : function ( users )
							{
								
								// TODO: Make support for populating the users list based on new server data on the go, like on users main ...
								
								if( users ) console.log( 'users edit: ', users );
								
								list = ( users ? users : list );
								
								if( list )
								{
									
									// TODO: Find a way to only list head if not listed before, don't add multiple times, because of server search feature ...
									
									if( !users ) this.head( true );
									
									var o = ge( 'UsersInner'+uuid ); if( this.func.mode[ 'users' ] != 'edit' ) o.innerHTML = '';
									
									this.func.mode[ 'users' ] = 'edit';
									
									for( var k in list )
									{
										if( list[k] && list[k].ID )
										{
											if( !ge( 'UserListID'+uuid+'_' + list[k].ID ) )
											{
												
												var toggle = false;
											
												if( this.ids && this.ids[ list[k].ID ] )
												{
													toggle = true;
												}
											
												//if( list[k].Status == 1 ) continue;
											
												var status = [ 'Active', 'Disabled', 'Locked' ];
											
												var divs = appendChild( [
													{ 
														'element' : function() 
														{
															var d = document.createElement( 'div' );
															d.className = 'HRow ' + status[ ( list[k].Status ? list[k].Status : 0 ) ];
															d.id = ( 'UserListID'+uuid+'_' + list[k].ID );
															return d;
														}(),
														'child' : 
														[ 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'TextCenter PaddingSmall HContent10 InputHeight FloatLeft Ellipsis';
																	return d;;
																}(),
																 'child' : 
																[ 
																	{ 
																		'element' : function() 
																		{
																			var d = document.createElement( 'span' );
																			d.setAttribute( 'FullName', list[k].FullName );
																			d.setAttribute( 'Name', list[k].Name );
																			d.setAttribute( 'Status', status[ ( list[k].Status ? list[k].Status : 0 ) ] );
																			//d.className = 'IconSmall NegativeAlt fa-user-circle-o avatar';
																			d.className = 'IconMedium fa-user-circle-o avatar';
																			//d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																			//d.style.backgroundSize = 'contain';
																			//d.style.width = '24px';
																			//d.style.height = '24px';
																			//d.style.display = 'block';
																			d.style.position = 'relative';
																			return d;
																		}(), 
																		 'child' : 
																		[ 
																			{
																				'element' : function() 
																				{
																					var d = document.createElement( 'div' );
																					if( 1!=1 && list[k].Avatar )
																					{
																						d.style.backgroundImage = 'url(\'' + list[k].Avatar + '\')';
																						d.style.backgroundSize = 'contain';
																						d.style.backgroundPosition = 'center center';
																						d.style.backgroundRepeat = 'no-repeat';
																						d.style.position = 'absolute';
																						d.style.top = '0';
																						d.style.left = '0';
																						d.style.width = '100%'/*'24px'*/;
																						d.style.height = '100%'/*'24px'*/;
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallRight">' + ( list[k].FullName ? list[k].FullName : 'n/a' ) + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingLeft PaddingRight">' + ( list[k].Name ? list[k].Name : '' ) + '</span>';
																	return d;
																}() 
															},
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent20 InputHeight TextCenter FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + ( status[ ( list[k].Status ? list[k].Status : 0 ) ] ) + '</span>';
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
																			
																			var b = CustomToggle( 'uid'+uuid+'_'+id, 'FloatRight', null, function (  ) 
																			{
																				
																				if( this.checked )
																				{
																				
																					if( ShowLog ) console.log( 'addUser( '+id+', '+info.ID+', callback, vars )' );
																				
																					addUser( id, info.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																							vars.func.updateids( 'users', vars.uid, true );
																							
																							vars._this.checked = true;
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = false;
																						}
																					
																					}, { uid: id, func: func, _this: this } );
																				
																				}
																				else
																				{
																				
																					if( ShowLog ) console.log( 'removeUser( '+id+', '+info.ID+', callback, vars )' );
																				
																					removeUser( id, info.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																							vars.func.updateids( 'users', vars.uid, false );
																						
																							vars._this.checked = false;
																							
																							if( ge( 'AdminUsersCount'+uuid ) )
																							{
																								if( ge( 'AdminUsersCount'+uuid ).innerHTML )
																								{
																									var count = ge( 'AdminUsersCount'+uuid ).innerHTML.split( '(' ).join( '' ).split( ')' ).join( '' );
																									
																									if( count && count > 0 )
																									{
																										var result = ( count - 1 );
							
																										if( result >= 0 )
																										{
																											ge( 'AdminUsersCount'+uuid ).innerHTML = '(' + result + ')';
																										}
																									}
																								}
																							}
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = true;
																						}
																					
																					}, { uid: id, func: func, _this: this } );
																				
																				}
																				
																			}, ( toggle ? true : false ), 1 );
																			
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
											else
											{
												// Add to the field that is allready there ... But we also gotto consider sorting the list by default or defined sorting ...
												
												
											}
											
										}
									
									}
									
								}
								
								if( ge( 'AdminUsersCount'+uuid ) )
								{
									ge( 'AdminUsersCount'+uuid ).innerHTML = ( list && list.Count ? '(' + list.Count + ')' : '(0)' );
								}
								
								this.sortusers( 'Name', 'ASC' );
								
								// TODO: No need to keep adding every time ...
								
								var inp = ge( 'AdminUsersContainer'+uuid ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchusers( this.value, true );
								}
								ge( 'UsersSearchCancelBtn'+uuid ).onclick = function( e )
								{
									init.searchusers( false );
									inp.value = '';
								}
								
							},
							
							searchusers : function ( filter, server )
							{
								
								if( !filter )
								{
									UsersSettings( 'searchquery', filter );
								}
								
								if( ge( 'UsersInner'+uuid ) )
								{
									var list = ge( 'UsersInner'+uuid ).getElementsByTagName( 'div' );

									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
											var span = list[a].getElementsByTagName( 'span' )[0];
		
											if( span )
											{
												var param = [
													( " " + span.getAttribute( 'fullname' ).toLowerCase() + " " ), 
													( " " + span.getAttribute( 'name' ).toLowerCase() + " " )
												];
												
												if( !filter || filter == ''  
												|| span.getAttribute( 'fullname' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
				
													var div = list[a].getElementsByTagName( 'div' );
				
													if( div.length )
													{
														for( var i in div )
														{
															if( div[i] && div[i].className && ( div[i].className.indexOf( 'fullname' ) >= 0 || div[i].className.indexOf( 'name' ) >= 0 ) )
															{
																// TODO: Make text searched for ...
															}
														}
													}
												}
												else
												{
													list[a].style.display = 'none';
												}
											}
										}
	
									}
									
									if( ge( 'UsersSearchCancelBtn'+uuid ) )
									{
										if( !filter && ( ge( 'UsersSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'UsersSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'UsersSearchCancelBtn'+uuid ).classList.remove( 'Open' );
											ge( 'UsersSearchCancelBtn'+uuid ).classList.add( 'Closed' );
										}
										
										else if( filter != '' && ( ge( 'UsersSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'UsersSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'UsersSearchCancelBtn'+uuid ).classList.remove( 'Closed' );
											ge( 'UsersSearchCancelBtn'+uuid ).classList.add( 'Open' );
										}
									}
								}
								
								if( filter.length < 3 || filter.length < UsersSettings( 'searchquery' ).length || filter == UsersSettings( 'searchquery' ) || !server ) return;
								
								UsersSettings( 'reset', true );
								
								UsersSettings( 'searchquery', filter );
								
								console.log( 'try getting server data ... ', { filter:filter, searchquery:UsersSettings( 'searchquery' ) } );
								
								
								
								//console.log( filter + ' < ' + UsersSettings( 'searchquery' ) );
		
								if( filter.length < UsersSettings( 'searchquery' ).length )
								{
									return;
								}
								
								listUsers( function( res, users )
								{
									
									console.log( 'search users ', users );
									
									// TODO: Finish before implementing
									
									//init.refresh( users );
									
								} );
								
							},
							
							sortusers : function ( sortby, orderby )
							{

								//

								var _this = ge( 'UsersInner'+uuid );

								if( _this )
								{
									var orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
	
									var list = _this.getElementsByTagName( 'div' );
	
									if( list.length > 0 )
									{
										var output = [];
										
										var custom = { 
											'Status' : { 
												'ASC'  : { 'locked' : 0, 'active' : 1, 'disabled' : 2 }, 
												'DESC' : { 'locked' : 0, 'disabled' : 1, 'active' : 2 } 
											},
											'LoginTime' : 'timestamp' 
										};
										
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
										
										var override = false;
										
										if( custom[ sortby ] && sortby == 'LoginTime' )
										{
											sortby = custom[ sortby ];
											orderby = ( orderby == 'ASC' ? 'DESC' : 'ASC' ); 
			
											// TODO: Find out how to specifically sort by the custom sortorder of Status ...
										}
										else if( custom[ sortby ] && custom[ sortby ][ orderby ] && sortby == 'Status' )
										{
											callback = ( function ( a, b ) { return ( custom[ sortby ][ orderby ][ a.sortby ] - custom[ sortby ][ orderby ][ b.sortby ] ); } );
			
											//console.log( custom[ sortby ][ orderby ] );
			
											override = true;
										}
										
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
			
											var span = list[a].getElementsByTagName( 'span' )[0];
			
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
											{
												var obj = { 
													sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
													content : list[a]
												};
			
												output.push( obj );
											}
										}
		
										if( output.length > 0 )
										{
											// Sort ASC default
			
											output.sort( callback );
			
											// Sort DESC
											
											if( !override && orderby == 'DESC' ) 
											{ 
												output.reverse();  
											}
			
											_this.innerHTML = '';
			
											_this.setAttribute( 'orderby', orderby );
			
											for( var key in output )
											{
												if( output[key] && output[key].content )
												{
													// Add row
													_this.appendChild( output[key].content );
												}
											}
										}
									}
								}

								//console.log( output );
							},
							
							refresh : function ( users )
							{
								
								switch( this.func.mode[ 'users' ] )
								{
									
									case 'list':
										
										this.list( users );
										
										break;
										
									case 'edit':
										
										this.edit( users );
										
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
								
								var etn = ge( 'UsersEdit'+uuid );
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
						
								var btn = ge( 'UsersEditBack'+uuid );
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
								
								var o = ge( 'StorageGui'+uuid ); o.innerHTML = '';
								
								mountlist = ( rows ? rows : mountlist );
								
								if( /*1==1 || */ShowLog ) console.log( 'init.list ', mountlist );
								
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
											if( typeof sorted[b].Config != "object" )
											{
												var conf = JSON.parse( sorted[b].Config );
											
												if( conf )
												{
													sorted[b].Config = conf;
												}
											}
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
											size = size * 1000;
										}
										else if( type == 'mb' )
										{
											size = size * 1000 * 1000;
										}
										else if( type == 'gb' )
										{
											size = size * 1000 * 1000 * 1000;
										}
										else if( type == 'tb' )
										{
											size = size * 1000 * 1000 * 1000 * 1000;
										}
										var used = parseInt( sorted[b].StoredBytes );
										if( isNaN( size ) || size == 0 ) size = 500 * 1000; // < Normally the default size
										if( !used && !size ) used = 0, size = 0;
										if( !used ) used = 0;
										if( used > size || ( used && !size ) ) size = used;
			
										var storage = {
											id   : sorted[b].ID,
											user : sorted[b].UserID,
											grup : sorted[b].GroupID,
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
													d.style.cursor = 'pointer';
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
																																
																	init.edit( storage.id, storage.user, storage.grup );
																
																};
															}
															
															d.innerHTML = ''
															+ '	<div class="Col1 FloatLeft" id="Storage_' + storage.id + '">'
															+ '		<div class="disk">'
															+ '			<div class="label" style="background-image: url(\'' + storage.icon + '\')"></div>'
															+ '		</div>'
															+ '	</div>'
															+ '	<div class="Col2 FloatLeft HContent100 Name Ellipsis" id="StorageInfo_' + storage.id + '">'
															+ '		<div class="name Ellipsis" title="' + storage.name + '">' + storage.name + ':</div>'
															+ '		<div class="type Ellipsis" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>'
															+ '		<div class="rectangle" title="' + storage.used + ' used">'
															+ '			<div style="width:' + storage.prog + '%"></div>'
															+ '		</div>'
															+ '		<div class="bytes Ellipsis" title="' + storage.free  + ' free of ' + storage.size + '">' + storage.free  + ' free of ' + storage.size + '</div>'
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
										
										
										
										getStorageInfo( sorted[b].Name + ':', sorted[b].UserID, sorted[b], function( res, dat, args )
										{
					
											//
					
											// Update even if there is an error so we can see what is missing ServerToken etc other stuff in console ...
					
											if( ge( 'StorageInfo_' + args.ID ) && ge( 'StorageInfo_' + args.ID ).className.indexOf( 'Updated' ) < 0 )
											{
						
												var size = 0;
												var used = 0;
						
												try
												{
													if( dat )
													{
														size = ( dat.Filesize ? dat.Filesize : 0 );
														used = ( dat.Used ? dat.Used : 0 );
													}
												}
												catch( e ){  }
						
						
						
												var storage = {
													id    : args.ID,
													user  : args.UserID,
													name  : args.Name,
													type  : args.Type,
													size  : size, 
													used  : used, 
													free  : ( size - used ), 
													prog  : ( ( used / size * 100 ) > 100 ? 100 : ( !used && !size ? 0 : ( used / size * 100 ) ) )
												};
						
												if( ShowLog ) console.log( storage );
						
												var mlst = '';
						
												mlst += '<div class="name Ellipsis" title="' + storage.name + '">' + storage.name + ':</div>';
												mlst += '<div class="type Ellipsis" title="' + i18n( 'i18n_' + storage.type ) + '">' + i18n( 'i18n_' + storage.type ) + '</div>';
												mlst += '<div class="rectangle" title="' + readableBytes( storage.used, 0 ) + ' used"><div style="width:' + storage.prog + '%"></div></div>';
												mlst += '<div class="bytes Ellipsis" title="'+ readableBytes( storage.free, 0 )  + ' free of ' + readableBytes( storage.size, 0 ) + '">' + readableBytes( storage.free, 0 )  + ' free of ' + readableBytes( storage.size, 0 ) + '</div>';
						
												//console.log( mlst );
						
												ge( 'StorageInfo_' + args.ID ).classList.add( 'Updated' );
						
												ge( 'StorageInfo_' + args.ID ).innerHTML = mlst;
						
												// Show errors if there is any ...
						
												if( args.Errors ) console.log( args.Errors.text, args.Errors.content );
						
											}
					
										} );
										
										
										
									}
							
								}
								else
								{
							
									o.innerHTML = ''/*'<div class="HContent100">' + i18n( 'i18n_workgroup_mountlist_empty' ) + '</div>'*/;
							
								}
						
							},
							
							edit : function ( sid, uid, gid )
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
									if( ShowLog ) console.log( { e:ee, d:dat } );
									
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
										
										var storage = { id : '', user: '', name : '', type : 'SQLWorkgroupDrive', note: '', csize : 500, cunit : 'MB' };
										
										var units = [ 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
										
										if( ShowLog ) console.log( { res:res, js:js } );
										
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
											
											var csize = size;
											var cunit = ( mode[0] ? mode[0] : 'MB' );
											
											var type = mode[0].toLowerCase();
											if( type == 'kb' )
											{
												size = size * 1000;
											}
											else if( type == 'mb' )
											{
												size = size * 1000 * 1000;
											}
											else if( type == 'gb' )
											{
												size = size * 1000 * 1000 * 1000;
											}
											else if( type == 'tb' )
											{
												size = size * 1000 * 1000 * 1000 * 1000;
											}
											var used = parseInt( js.StoredBytes );
											if( isNaN( size ) ) size = 500 * 1000; // < Normally the default size
											if( !used && !size ) used = 0, size = 0;
											if( !size ) size = 500000000;
											if( !used ) used = 0;
											if( used > size || ( used && !size ) ) size = used;
											
											csize = ( !csize ? 500 : csize );
											
											storage = {
												id    : js.ID,
												user  : js.UserID,
												name  : js.Name,
												type  : js.Type,
												grup  : js.GroupID,
												csize : csize,
												cunit : cunit,
												note  : js.ShortDescription,
												size  : size, 
												used  : used, 
												free  : ( size - used ), 
												prog  : ( ( used / size * 100 ) > 100 ? 100 : ( used / size * 100 ) ), 
												icon  : '/iconthemes/friendup15/DriveLabels/FriendDisk.svg',
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
										
										if( ShowLog ) console.log( storage );
										
										dosdrivergui( storage, function( storage )
										{
											
											var o = ge( 'StorageGui'+uuid ); o.innerHTML = '';
											
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
																		d.innerHTML = '<input type="text" class="FullWidth" id="DiskSizeA" value="' + storage.csize + '" placeholder="500"/>';
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
																						+ '<option' + ( storage.csize && storage.cunit == units[a] ? ' selected="selected"' : '' ) + '>' 
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
																d.id = 'DosDriverGui'+uuid;
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
																			
																			'element' : function( groupid, groupname ) 
																			{
																				var d = document.createElement( 'div' );
																				d.className = 'HContent70 FloatLeft';
																				d.innerHTML = ''
																				+ '	<p class="Layout InputHeight" id="WorkgroupContainer">'
																				+ '		<select id="Workgroup" class="FullWidth" disabled="true">'
																				+ '			' + ( groupname ? '<option value="' + groupid + '">' + groupname + '</option>' : '' ) 
																				+ '		</select>'
																				+ '	</p>';
																				return d;
																			}( workgroup.groupid, workgroup.name )
																			
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
																	
																		saveStorage( groupid, storage.id, storage.user, function()
																		{
																		
																			listStorage( function( res, js )
																			{
																			
																				if( ShowLog ) console.log( 'init.list(  ); ', { res: res, js:js } );
																			
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
															
															'element' : function( groupid, init ) 
															{
																var d = document.createElement( 'button' );
																d.className = 'IconSmall FloatRight MarginLeft';
																d.innerHTML = 'Cancel';
																d.onclick = function ()
																{
																	
																	listStorage( function( res, js )
																	{
																		
																		if( ShowLog ) console.log( 'init.list(  ); ', { res: res, js:js } );
																		
																		if( res )
																		{
																			init.list( js );
																		}
																		
																	}, groupid );
																	
																};
																return d;
															}( workgroup.groupid, init )
															
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
																	
																		removeStorage( storage.id, storage.user, storage.grup, storage.name, function()
																		{
																		
																			listStorage( function( res, js )
																			{
																			
																				if( ShowLog ) console.log( 'init.list(  ); ', { res: res, js:js } );
																			
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
																		mountStorage( storage.name, storage.user, groupid, this, function()
																		{
																			listStorage( function( res, js )
																			{
																			
																				if( ShowLog ) console.log( 'init.list(  ); ', { res: res, js:js } );
																				
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
								
								var etn = ge( 'StorageEdit'+uuid );
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
					
					// Roles -------------------------------------------------------------------------------------------
					
					roles : function (  )
					{
						
						if( ge( 'RolesGui'+uuid ) && rstr )
						{
							
							var o = ge( 'RolesGui'+uuid ); if( o ) o.innerHTML = '';
							
							var divs = appendChild( [ 
								{ 
									'element' : function() 
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
										return d;
									}(),
									'child' : 
									[ 
										{ 
											'element' : function(  ) 
											{
												var d = document.createElement( 'div' );
												d.className = 'PaddingSmall HContent40 FloatLeft';
												d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
												d.style.cursor = 'pointer';
												d.onclick = function(  )
												{
													sortroles( 'Name' );
												};
												return d;
											}(  ) 
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
										d.style.overflow = 'auto';
										d.style.maxHeight = '369px';
										d.id = 'RolesInner'+uuid;
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
							
							
							
							ge( 'RolesInner'+uuid ).innerHTML = rstr;
							
							var inp = ge( 'AdminRolesContainer'+uuid ).getElementsByTagName( 'input' )[0];
							inp.value = '';
							
							if( ge( 'RolesSearchCancelBtn'+uuid ) && ge( 'RolesSearchCancelBtn'+uuid ).classList.contains( 'Open' ) )
							{
								ge( 'RolesSearchCancelBtn'+uuid ).classList.remove( 'Open' );
								ge( 'RolesSearchCancelBtn'+uuid ).classList.add( 'Closed' );
							}
							
							// Search ...............
							
							var searchroles = function ( filter, server )
							{
							
								if( ge( 'RolesInner'+uuid ) )
								{
									var list = ge( 'RolesInner'+uuid ).getElementsByTagName( 'div' );
								
									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
										
											var strong = list[a].getElementsByTagName( 'strong' )[0];
											var span = list[a].getElementsByTagName( 'span' )[0];
										
											if( strong || span )
											{
												if( !filter || filter == '' 
												|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
												}
												else
												{
													list[a].style.display = 'none';
												}
											}
										}

									}
									
									if( ge( 'RolesSearchCancelBtn'+uuid ) )
									{
										if( !filter && ( ge( 'RolesSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'RolesSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'RolesSearchCancelBtn'+uuid ).classList.remove( 'Open' );
											ge( 'RolesSearchCancelBtn'+uuid ).classList.add( 'Closed' );
										}
									
										else if( filter != '' && ( ge( 'RolesSearchCancelBtn'+uuid ).classList.contains( 'Open' ) 
										|| ge( 'RolesSearchCancelBtn'+uuid ).classList.contains( 'Closed' ) ) )
										{
											ge( 'RolesSearchCancelBtn'+uuid ).classList.remove( 'Closed' );
											ge( 'RolesSearchCancelBtn'+uuid ).classList.add( 'Open' );
										}
									}
								}
							
							};
						
							// Sort .............
						
							var sortroles = function ( sortby )
							{
							
								//
							
								var _this = ge( 'RolesInner' );
							
								if( _this )
								{
									var orderby = ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' );
								
									var list = _this.getElementsByTagName( 'div' );
								
									if( list.length > 0 )
									{
										var output = [];
									
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
									
										for( var a = 0; a < list.length; a++ )
										{
											if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
										
											var span = list[a].getElementsByTagName( 'span' )[0];
											
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
											{
												var obj = { 
													sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
													content : list[a]
												};
												
												output.push( obj );
											}
										}
									
										if( output.length > 0 )
										{
											// Sort ASC default
										
											output.sort( callback );
										
											// Sort DESC
										
											if( orderby == 'DESC' ) 
											{ 
												output.reverse();  
											}
										
											_this.innerHTML = '';
										
											_this.setAttribute( 'orderby', orderby );
										
											for( var key in output )
											{
												if( output[key] && output[key].content )
												{
													// Add row
													_this.appendChild( output[key].content );
												}
											}
										}
									}
								}
							
							};
							
							// .................
							
							var inp = ge( 'AdminRolesContainer'+uuid ).getElementsByTagName( 'input' )[0];
							inp.onkeyup = function( e )
							{
								searchroles( this.value );
							}
							ge( 'RolesSearchCancelBtn'+uuid ).onclick = function( e )
							{
								searchroles( false );
								inp.value = '';
							}
							
						}
						
					},
					
					// Permissions -------------------------------------------------------------------------------------
					
					permissions : function ( show )
					{
						// Check Permissions
						
						if( ShowLog ) console.log( '// Check Permissions ', ( show ? show : [] ) );
						
						if( !show || show.indexOf( 'user' ) >= 0 )
						{
							if( Application.checkAppPermission( [ 
								'PERM_USER_READ_GLOBAL', 'PERM_USER_READ_IN_WORKGROUP', 
								'PERM_USER_GLOBAL',      'PERM_USER_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminUsersContainer'+uuid ) )
								{
									ge( 'AdminUsersContainer'+uuid ).className = ge( 'AdminUsersContainer'+uuid ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
						if( !show || show.indexOf( 'storage' ) >= 0 )
						{
							if( Application.checkAppPermission( [ 
								'PERM_STORAGE_READ_GLOBAL', 'PERM_STORAGE_READ_IN_WORKGROUP', 
								'PERM_STORAGE_GLOBAL',      'PERM_STORAGE_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminStorageContainer'+uuid ) )
								{
									 ge( 'AdminStorageContainer'+uuid ).className = ge( 'AdminStorageContainer'+uuid ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
						if( !show || show.indexOf( 'role' ) >= 0 )
						{
							if( 1!=1 && Application.checkAppPermission( [ 
								'PERM_ROLE_READ_GLOBAL', 'PERM_ROLE_READ_IN_WORKGROUP', 
								'PERM_ROLE_GLOBAL',      'PERM_ROLE_WORKGROUP' 
							] ) )
							{
								if( ge( 'AdminRolesContainer'+uuid ) )
								{
									ge( 'AdminRolesContainer'+uuid ).className = ge( 'AdminRolesContainer'+uuid ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
					}
					
				};
			
				
				func.workgroups();
				func.users();
				func.storage();
				func.roles();
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
	
	
	
	
	function initMain( callback )
	{
		var checkedGlobal = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_GLOBAL', 'PERM_WORKGROUP_GLOBAL' ] );
		var checkedWorkgr = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_IN_WORKGROUP', 'PERM_WORKGROUP_WORKGROUP' ] );
		
		if( checkedGlobal || checkedWorkgr )
		{
			
			// Get the user list
			list( function( workgroups )
			{
				if( ShowLog ) console.log( 'initMain() ', workgroups );
				
				groups = {};
				
				if( workgroups )
				{
					
					var adminlevel = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_GLOBAL', 'PERM_USER_READ_GLOBAL', 'PERM_WORKGROUP_GLOBAL', 'PERM_USER_GLOBAL' ] );
					var userlevel  = Application.checkAppPermission( [ 'PERM_WORKGROUP_READ_IN_WORKGROUP', 'PERM_USER_READ_IN_WORKGROUP', 'PERM_WORKGROUP_WORKGROUP', 'PERM_USER_WORKGROUP' ] );
					
					var wgroups = false;
					
					if( ShowLog ) console.log( 'userlevel ', { adminlevel: adminlevel, userlevel: userlevel } );
					
					if( !adminlevel && userlevel )
					{
						var wgroups = {};
						
						//console.log( 'userlevel ', userlevel );
						
						for( var a in userlevel )
						{
							if( userlevel[a] && userlevel[a].GroupID )
							{
								wgroups[ userlevel[a].GroupID ] = userlevel[a];
							}
						}
						
					}
					
					var unsorted = {};
					
					// Add all workgroups to unsorted and add subgroups array ...
					
					for( var i in workgroups )
					{
						if( workgroups[i] && workgroups[i].ID )
						{
							if( wgroups && !wgroups[workgroups[i].ID] )
							{
								continue;
							}
							
							unsorted[workgroups[i].ID] = {};
							
							for( var ii in workgroups[i] )
							{
								if( workgroups[i][ii] )
								{
									unsorted[workgroups[i].ID][ii] = workgroups[i][ii];
								}
							}
							
							unsorted[workgroups[i].ID].level = 1;
							unsorted[workgroups[i].ID].groups = [];
						}
					}
					
					// Arrange all subgroups to parentgroups ...
					
					let set = [];
					
					for( var k in unsorted )
					{
						if( unsorted[k].ParentID > 0 && unsorted[ unsorted[k].ParentID ] )
						{
							unsorted[ unsorted[k].ParentID ].groups.push( unsorted[k] );
							
							if( unsorted[ unsorted[k].ParentID ].groups )
							{
								for( var kk in unsorted[ unsorted[k].ParentID ].groups )
								{
									if( unsorted[ unsorted[k].ParentID ].groups[ kk ] )
									{
										unsorted[ unsorted[k].ParentID ].groups[ kk ].level = ( unsorted[ unsorted[k].ParentID ].level +1 );
									}
								}
							}
							
							set.push( unsorted[k].ID );
						}
					}
					
					// Filter all subgroups allready set, away from root level ...
					
					for( var k in unsorted )
					{
						if( set.indexOf( unsorted[k].ID ) < 0 )
						{
							groups[ unsorted[k].ID ] = unsorted[k];
						}
					}
					
					if( ShowLog/* || 1==1*/ ) console.log( [ unsorted, set, groups ] );
				}
				
				var ii = 0;
				
				var str = '';
				
				if( groups )
				{
					
					for( var a in groups )
					{
						var found = false;
						
						ii++;
						
						str += '<div>';
						
						str += '<div class="HRow Ellipsis' +(groups[a].Hide||!groups[a].Owner?' Hidden':'')+'" id="WorkgroupID_' + groups[a].ID + '" onclick="Sections.accounts_workgroups( \'edit\', {id:'+groups[a].ID+',_this:this} )">';
						//str += '<div class="HRow" id="WorkgroupID_' + groups[a].ID + '" onclick="edit( '+groups[a].ID+', this )">';
						//str += '	<div class="PaddingSmall HContent100 FloatLeft Ellipsis">';
						//str += '		<span name="' + groups[a].Name + '" class="IconSmall NegativeAlt ' + ( groups[a].groups.length > 0 ? 'fa-caret-right">' : '">&nbsp;&nbsp;' ) + '&nbsp;&nbsp;&nbsp;' + groups[a].Name + '</span>';
						
						str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
						str += '		<span name="' + groups[a].Name + '" class="IconMedium fa-users"></span>';
						str += '	</div>';
						str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent90 InputHeight FloatLeft Ellipsis">' + groups[a].Name + (groups[a].Owner?' (by '+groups[a].Owner+')':'') + '</div>';
						
						//str += '	<div class="PaddingSmall HContent40 FloatLeft Ellipsis">';
						//str += '		<button wid="' + groups[a].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>';
						//str += '	</div>';
						str += '</div>';
						
						if( groups[a].groups.length > 0 )
						{
							//str += '<div class="Closed">';
							str += '<div class="SubGroups">';
							
							for( var aa in groups[a].groups )
							{
								var found = false;
								
								ii++;
								
								str += '<div class="HRow Ellipsis' +(groups[a].groups[aa].Hide||!groups[a].groups[aa].Owner?' Hidden':'')+'" id="WorkgroupID_' + groups[a].groups[aa].ID + '" onclick="Sections.accounts_workgroups( \'edit\', {id:'+groups[a].groups[aa].ID+',_this:this} )">';
								//str += '<div class="HRow" id="WorkgroupID_' + groups[a].groups[aa].ID + '" onclick="edit( '+groups[a].groups[aa].ID+', this )">';
								//str += '	<div class="PaddingSmall HContent100 FloatLeft Ellipsis">';
								//str += '		<span name="' + groups[a].groups[aa].Name + '" class="IconSmall NegativeAlt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + groups[a].groups[aa].Name + '</span>';
								//str += '	</div>';
								
								str += '	<div class="TextCenter HContent4 InputHeight FloatLeft PaddingSmall" style="min-width:36px"></div>';
								str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
								str += '		<span name="' + groups[a].groups[aa].Name + '" class="IconMedium fa-users"></span>';
								str += '	</div>';
								str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent80 InputHeight FloatLeft Ellipsis">' + groups[a].groups[aa].Name + (groups[a].groups[aa].Owner?' (by '+groups[a].groups[aa].Owner+')':'') + '</div>';
								
								//str += '	<div class="PaddingSmall HContent40 FloatLeft Ellipsis">';
								//str += '		<button wid="' + groups[a].groups[aa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>';
								//str += '	</div>';
								str += '</div>';
								
								if( groups[a].groups[aa].groups.length > 0 )
								{
									//str += '<div class="Closed">';
									str += '<div class="SubGroups">';
									
									for( var aaa in groups[a].groups[aa].groups )
									{
										var found = false;
										
										ii++;
										
										str += '<div class="HRow Ellipsis' +(groups[a].groups[aa].groups[aaa].Hide||!groups[a].groups[aa].groups[aaa].Owner?' Hidden':'')+'" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" id="WorkgroupID_' + groups[a].groups[aa].groups[aaa].ID + '" onclick="Sections.accounts_workgroups( \'edit\', {id:'+groups[a].groups[aa].groups[aaa].ID+',_this:this} )">';
										//str += '<div class="HRow" id="WorkgroupID_' + groups[a].groups[aa].groups[aaa].ID + '" onclick="edit( '+groups[a].groups[aa].groups[aaa].ID+', this )">';
										//str += '	<div class="PaddingSmall HContent100 FloatLeft Ellipsis">';
										//str += '		<span name="' + groups[a].groups[aa].groups[aaa].Name + '" class="IconSmall NegativeAlt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + groups[a].groups[aa].groups[aaa].Name + '</span>';
										//str += '	</div>';
										
										str += '	<div class="TextCenter HContent8 InputHeight FloatLeft PaddingSmall" style="min-width:73px"></div>';
										str += '	<div class="TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis edit">';
										str += '		<span name="' + groups[a].groups[aa].groups[aaa].Name + '" class="IconMedium fa-users"></span>';
										str += '	</div>';
										str += '	<div class="PaddingSmallTop PaddingSmallRight PaddingSmallBottom HContent70 InputHeight FloatLeft Ellipsis" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">' + groups[a].groups[aa].groups[aaa].Name + (groups[a].groups[aa].groups[aaa].Owner?' (by '+groups[a].groups[aa].groups[aaa].Owner+')':'') + '</div>';
										
										//str += '	<div class="PaddingSmall HContent40 FloatLeft Ellipsis">';
										//str += '		<button wid="' + groups[a].groups[aa].groups[aaa].ID + '" class="IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' ) + '"> </button>';
										//str += '	</div>';
										str += '</div>';
										
									}
								
									str += '</div>';
								}
								
							}
						
							str += '</div>';
						}
					
						str += '</div>';
					
					}
					
				}
				
				var o = ge( 'WorkgroupList' ); if( o ) o.innerHTML = '';
				
				var divs = appendChild( [ 
					{
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'OverflowHidden BorderRadius Elevated';
							d.id = 'AdminWorkgroupContainer';
							return d;
						}(),
						'child' : 
						[ 
							{ 
								'element' : function(  ) 
								{
									var d = document.createElement( 'div' );
									d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingRight';
									return d;
								}(), 
								'child' : 
								[ 
									{
										'element' : function(  ) 
										{
											var d = document.createElement( 'div' );
											d.className = 'HContent30 InputHeight FloatLeft';
											return d;
										}(),
										'child' : 
										[ 
											{
												'element' : function(  ) 
												{
													var b = document.createElement( 'button' );
													b.id = 'WorkgroupEditBack';
													b.className = 'IconButton IconMedium ButtonSmall Negative FloatLeft fa-arrow-circle-left Closed';
													return b;
												}()
											},
											{
												'element' : function(  ) 
												{
													var h = document.createElement( 'h3' );
													h.className = 'NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft';
													h.innerHTML = '<strong>' + i18n( 'i18n_workgroups' ) + ' </strong><span id="AdminWorkgroupCount">(' + ii + ')</span>';
													return h;
												}()
											}
										]
									},
									{
										'element' : function(  ) 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmall HContent60 FloatLeft Relative';
											return d;
										}(),
										'child' : 
										[ 
											{
												'element' : function(  ) 
												{
													var b = document.createElement( 'button' );
													b.id = 'WorkgroupSearchCancelBtn';
													b.className = 'IconButton IconSmall ButtonSmall fa-times-circle Closed';
													b.style = 'position:absolute;right:0;margin-top:-2px;';
													b.onclick = function(  )
													{
														searchgroups( false );
														var inp = ge( 'AdminWorkgroupContainer' ).getElementsByTagName( 'input' )[0];
														inp.value = '';
													}
													return b;
												}()
											},
											{
												'element' : function(  ) 
												{
													var i = document.createElement( 'input' );
													i.type = 'text';
													i.className = 'FullWidth';
													i.placeholder = i18n( 'i18n_search' );
													i.style = 'padding-right:21px';
													i.onkeyup = function(  )
													{
														searchgroups( this.value );
													}
													return i;
												}()
											}
										]
									},
									{
										'element' : function(  ) 
										{
											var d = document.createElement( 'div' );
											d.className = 'HContent10 FloatLeft Relative';
											return d;
										}(),
										'child' : 
										[ 
											{
												'element' : function(  ) 
												{
													if( Application.checkAppPermission( [ 
														'PERM_WORKGROUP_CREATE_GLOBAL', 'PERM_WORKGROUP_CREATE_IN_WORKGROUP', 
														'PERM_WORKGROUP_GLOBAL',        'PERM_WORKGROUP_WORKGROUP' 
													] ) )
													{
														var b = document.createElement( 'button' );
														b.id = 'WorkgroupEdit';
														b.className = 'IconButton IconMedium ButtonSmall Negative FloatRight fa-plus-circle Open';
														b.onclick = function()
														{
															edit(  );
														};
														return b;
													}
												}()
											}
										]
									}
								]
							},
							{
								'element' : function(  ) 
								{
									var d = document.createElement( 'div' );
									d.className = 'List';
									d.id = 'WorkgroupGui';
									return d;
								}(),
								'child' : 
								[
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function(  ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.onclick = function(  )
													{
														sortgroups( 'Name' );
													};
													return d;
												}(  ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong></strong>';
													return d;
												}( this )
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent15 FloatLeft Relative';
													return d;
												}()
											}
										]
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'List HRow PaddingTop PaddingBottom'/* Box Padding'*/;
											d.id = 'WorkgroupInner';
											return d;
										}()
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
				
				ge( 'WorkgroupInner' ).innerHTML = str;
				
				// Toggle arrow function, put into function that can be reused some time ...
				
				var workArr = ge( 'WorkgroupInner' ).getElementsByTagName( 'span' );
				
				if( workArr )
				{
					for( var a = 0; a < workArr.length; a++ )
					{
						
						if( workArr[ a ].classList.contains( 'fa-caret-right' ) || workArr[ a ].classList.contains( 'fa-caret-down' ) )
						{
							
							( function( b ) {
								b.onclick = function( e )
								{
									var pnt = this.parentNode.parentNode.parentNode;
									
									if( this.classList.contains( 'fa-caret-right' ) )
									{
										// Toggle open ...
										
										//console.log( '// Toggle open ...' );
										
										this.classList.remove( 'fa-caret-right' );
										this.classList.add( 'fa-caret-down' );
										
										var divs = pnt.getElementsByTagName( 'div' );
										
										if( divs )
										{
											for( var c = 0; c < divs.length; c++ )
											{
												if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
												{
													divs[c].classList.remove( 'Closed' );
													divs[c].classList.add( 'Open' );
													
													break;
												}
											}
										}
									}
									else
									{
										// Toggle close ...
										
										//console.log( '// Toggle close ...' );
										
										this.classList.remove( 'fa-caret-down' );
										this.classList.add( 'fa-caret-right' );
										
										var divs = pnt.getElementsByTagName( 'div' );
										
										if( divs )
										{
											for( var c = 0; c < divs.length; c++ )
											{
												if( divs[c].classList.contains( 'Closed' ) || divs[c].classList.contains( 'Open' ) )
												{
													divs[c].classList.remove( 'Open' );
													divs[c].classList.add( 'Closed' );
													
													break;
												}
											}
										}
									}
									
								}
							} )( workArr[ a ] );
							
						}
						
					}
				}
				
				var workBtns = ge( 'WorkgroupInner' ).getElementsByTagName( 'button' );
				
				if( workBtns )
				{
					for( var a = 0; a < workBtns.length; a++ )
					{
						// Toggle user relation to workgroup
						( function( b ) {
							b.onclick = function( e )
							{
								if( this.getAttribute( 'wid' ) )
								{
									edit( this.getAttribute( 'wid' ), this.parentNode.parentNode );
								}
							}
						} )( workBtns[ a ] );
					}
				}
				
				// Search ...............
				
				var searchgroups = function ( filter, server )
				{
					
					if( ge( 'WorkgroupInner' ) )
					{
						var list = ge( 'WorkgroupInner' ).getElementsByTagName( 'div' );
						
						if( list.length > 0 )
						{
							ge( 'WorkgroupInner' ).className = ge( 'WorkgroupInner' ).className.split( ' Visible' ).join( '' ) + ( filter ? ' Visible' : '' );
							
							for( var a = 0; a < list.length; a++ )
							{
								if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
								
								var strong = list[a].getElementsByTagName( 'strong' )[0];
								var span = list[a].getElementsByTagName( 'span' )[0];
								
								if( strong || span )
								{
									
									if( !filter || filter == '' 
									|| strong && strong.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									|| span && span.innerHTML.toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									)
									{
										list[a].style.display = '';
										
										if( list[a].parentNode.parentNode && list[a].parentNode.parentNode.parentNode && list[a].parentNode.parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
										{
											//if( list[a].parentNode.classList.contains( 'Closed' ) )
											//{
											//	list[a].parentNode.classList.remove( 'Closed' );
											//	list[a].parentNode.classList.add( 'Open' );
											//}
											
											list[a].parentNode.style.display = '';
											list[a].parentNode.parentNode.style.display = '';
										}
									}
									else if( list[a].parentNode && list[a].parentNode.className )
									{
										list[a].style.display = 'none';
									}
								}
							}

						}
						
						if( ge( 'WorkgroupSearchCancelBtn' ) )
						{
							if( !filter && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Closed' );
								
								if( list.length > 0 )
								{
									for( var a = 0; a < list.length; a++ )
									{
										if( list[a].classList.contains( 'Open' ) )
										{
											list[a].classList.remove( 'Open' );
											list[a].classList.add( 'Closed' );
										}
									}
								}
							}
							
							else if( filter != '' && ( ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'WorkgroupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'WorkgroupSearchCancelBtn' ).classList.remove( 'Closed' );
								ge( 'WorkgroupSearchCancelBtn' ).classList.add( 'Open' );
							}
						}
					}
					
				};
				

				
				// Sort .............
				
				var sortgroups = function ( sortby, orderby )
				{
					
					//
					
					var _this = ge( 'WorkgroupInner' );
					
					if( _this )
					{
						orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
						
						var list = _this.getElementsByTagName( 'div' );
						
						if( list.length > 0 )
						{
							var output = [];
							
							var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
							
							for( var a = 0; a < list.length; a++ )
							{
								if( !list[a].className || ( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) ) continue;
								
								var span = list[a].getElementsByTagName( 'span' )[0];
								
								if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' && span.getAttribute( sortby.toLowerCase() ) )
								{
									if( !list[a].parentNode.className )
									{
										var obj = { 
											sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
											content : list[a].parentNode
										};
									
										output.push( obj );
									}
								}
							}
							
							if( output.length > 0 )
							{
								// Sort ASC default
								
								output.sort( callback );
								
								// Sort DESC
								
								if( orderby == 'DESC' ) 
								{ 
									output.reverse();  
								}
								
								_this.innerHTML = '';
								
								_this.setAttribute( 'orderby', orderby );
								
								for( var key in output )
								{
									if( output[key] && output[key].content )
									{
										// Add row
										_this.appendChild( output[key].content );
									}
								}
							}
						}
					}
					
				};
				
				sortgroups( 'Name', 'ASC' );
				
				// .................
				
				Friend.responsive.pageActive = ge( 'WorkgroupList' );
				Friend.responsive.reinit();
				
				if( callback ) callback( true );
				
				return;
				
				// Old code below, if nothing important is missed remove it ...
				
				/*//if( e != 'ok' ) return;
				//var userList = null;
				//try
				//{
				//	userList = d;
				//}
				//catch( e )
				//{
					//return;
				//}
				
				//var o = ge( 'WorkgroupList' );
				//o.innerHTML = '';
				
				// Types of listed fields
				var types = {
					edit: '10',
					Name: '90'
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
				//for( var b = 0; b < levels.length; b++ )
				//{
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
							r.id = 'WorkgroupID_' + userList[ a ].ID;
			
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
				//}
			
				o.appendChild( list );
			
				Friend.responsive.pageActive = ge( 'WorkgroupList' );
				Friend.responsive.reinit();
				
				if( callback ) callback( true );*/
				
			} );
			
		}
		else
		{
			var o = ge( 'WorkgroupList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
			
			if( callback ) callback( true );
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

