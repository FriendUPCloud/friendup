/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for liberator management

Sections.applications_liberator = function( cmd, extra )
{
	
	switch( cmd )
	{
		
		case 'details':
			
			//loading( extra );
			
			break;
		
		case 'edit':
			
			if( extra )
			{
				edit( extra );
			}
			
			break;
		
		case 'create':
			
			create();
			
			break;
		
		case 'update':
			
			if( extra )
			{
				update( extra );
			}
			
			break;
		
		case 'remove':
			
			if( extra )
			{
				remove( extra );
			}
			
			break;
		
		case 'cancel':
			
			cancel();
			
			break;
		
		case 'refresh':
			
			refresh( extra );
			
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
				/*var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' && d )
					{
						try
						{
							var json = JSON.parse( d );
							
							if( json )
							{
								if( json.Data )
								{
									try
									{
										json.Data = JSON.parse( json.Data );
									} 
									catch( e ) {  }
								}
								
								return callback( true, json );
							}
						} 
						catch( e ){ } 
					}
					
					return callback( false, false );
				}
				m.execute( 'usersetupget', { id: id, authid: Application.authId } );*/
				
				
				
				getSystemSettings( function( config )
				{
					
					guacAdminGetServer( config, id, function( e, d )
					{
						
						console.log( 'guacAdminGetServer ', { e:e, d:d } );
						
						if( e == 'ok' && d )
						{
							return callback( true, d );
						}
						
						return callback( false, false );
					
					} );
					
				} );
				
			}
			else
			{
				/*var m = new Module( 'mitra' );
				m.onExecuted = function( e, d )
				{
					console.log( 'loadapplicationlist ', { e:e, d:d } );
					
					if( e == 'ok' && d )
					{
						try
						{
							var json = JSON.parse( d );
							
							if( json )
							{
								for( var i in json )
								{
									if( json[i] && json[i].Data )
									{
										json[i].Data = JSON.parse( json[i].Data );
									}
								}
								
								return callback( true, json );
							}
						} 
						catch( e ){ } 
					}
					
					return callback( false, false );
				}
				m.execute( 'loadapplicationlist', { admin: true, authid: Application.authId } );*/
				
				
				
				getSystemSettings( function( config )
				{
					
					// Create groups ...
					
					//guacAdminCreateConnectionGroups( config );
					
					
					
					guacAdminListServers( config, function( e, d )
					{
						
						console.log( 'guacAdminListServers ', { e:e, d:d } );
						
						if( e == 'ok' && d )
						{
							if( d.childConnections )
							{
								return callback( true, d.childConnections );
							}
							else
							{
								return callback( true, [] );
							}
						}
						
						return callback( true, [] );
						
					} );
					
					// testing ....
					
					//guacAdminListServerTest( config );
					
				} );
				
				
			}
			
			return true;
		}
		
		return false;
		
	}
	
	function refresh( id, obj, _this )
	{
		
		initMain();
		
		if( id )
		{
			edit( id, obj, _this );
		}
		
	}
	
	function edit( id, obj, _this )
	{
		
		console.log( 'edit ', { id: id, obj: obj, _this: _this } );
		
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
		
		loading( id, obj );
		
	}
	
	function cancel()
	{
		
		if( ge( 'LiberatorDetails' ) )
		{
			ge( 'LiberatorDetails' ).innerHTML = '';
		}
		
		if( ge( 'LiberatorList' ) )
		{
			var ele = ge( 'LiberatorList' ).getElementsByTagName( 'div' );
			
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
	
	function applications( callback )
	{
		
		if( callback )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' && d )
				{
					try
					{
						var json = JSON.parse( d );
					
						if( json )
						{
							return callback( true, json );
						}
					} 
					catch( e ){ } 
				}
				
				return callback( false, false );
			}
			m.execute( 'software', { mode: 'showall', authid: Application.authId } );
			
			return true;
		}
		
		return false;
		
	}
	
	function getSystemSettings( callback )
	{
		
		// TODO: Move these settings to either the Admin/System app part of Server settings storage or it's own but differently defined.
		
		// TODO: Only list admin data to admins that have rolepermissions for it, never list for users ...
		
		var m = new Module( 'system' );
		m.onExecuted = function( stat1, resp1 )
		{
			var out = {};
			
			//console.log( { stat1: stat1, resp1: resp1 } );
			
			if( stat1 == 'ok' )
			{
				try
				{
					 resp1 = JSON.parse( resp1 );	
					 resp1 = JSON.parse( resp1[0].Data );
					 
					 if( resp1 )
					 {
					 	out.host = resp1;
					 }
				}
				catch( e ){  }
			}
			
			var mm = new Module( 'system' );
			mm.onExecuted = function( stat2, resp2 )
			{
				//console.log( { stat2: stat2, resp2: resp2 } );
				
				if( stat2 == 'ok' )
				{
					try
					{
						 resp2 = JSON.parse( resp2 );	
						 resp2 = JSON.parse( resp2[0].Data );
						 
						 if( resp2 )
						 {
						 	out.admin = resp2;
						 }
					}
					catch( e ){  }
				}
				
				if( callback )
				{
					return callback( out );
				}
			}
			mm.execute( 'getsystemsetting', { 'type' : 'mitra', 'key' : 'admin' } );
			
		}
		m.execute( 'getsystemsetting', { 'type' : 'mitra', 'key' : 'host' } );
	}
	
	// TODO: MOVE ALL GUACAMOLE CALLS TO SERVER USING CURL TO NOT EXPOSE ADMIN AUTHTOKEN TO CLIENTS ...
	
	function guacAdminAuth( config, callback, token )
	{
		
		if( token && callback )
		{
			return callback( token );
		}
		
		console.log( 'guacAdminAuth(  ) ', config );
		
		var settings = {
			server_url      : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
			server_api_path : 'api/',
			admin_username  : ( config && config.admin.admin_username ? config.admin.admin_username : 'guacadmin' ),
			admin_password  : ( config && config.admin.admin_password ? config.admin.admin_password : 'guacadmin' )
		};
		
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() 
		{
			if( this.readyState == 4 ) 
			{
				
				data = false;
				
				try
				{
					data = JSON.parse( this.responseText );
				}
				catch( err )
				{
					//
				}
				
				if( this.status == 200 )
				{
					if( data )
					{
						console.log( '[' + this.status + '] Permission Granted. ', data );
						
						if( data.authToken )
						{
							if( callback )
							{
								return callback( data.authToken );
							}
						}
					}
				}
				else
				{
					if( data )
					{
						console.log( '[' + this.status + '] Permission Denied. ', data );
					}
					
					if( callback )
					{
						return callback( false );
					}
				}
			}
		};
		
		xhttp.open( "POST", ( settings.server_url+settings.server_api_path+'tokens' ), true );	
		//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
		xhttp.send( "username=" + encodeURIComponent( settings.admin_username ) + "&password=" + encodeURIComponent( settings.admin_password ) );
		
	}
	
	function guacAdminListConnectionGroups( config, callback, groups )
	{
		
		// _Liberator
		// _Servers
		// _Users
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminListConnectionGroups( '+token+' ) ', groups );
			
			if( token )
			{
				
				if( groups && callback )
				{
					return callback( token, groups );
				}
				
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				// --- ConnectionGroups (Servers) --------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
						
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
								
								var count = 0;
								
								var names = [ '_Liberator', '_Servers', '_Users' ];
								
								groups = {};
								
								for( var i in data )
								{
									if( data[i] && data[i].identifier && data[i].name )
									{
										for( var a in names )
										{
											if( groups[ names[a] ] )
											{
												continue;
											}
											
											if( names[a] == data[i].name )
											{
												groups[ data[i].name ] = data[i];
												
												count++;
											}
										}
									}
								}
								
								if( groups && count == 3 )
								{
									if( callback )
									{
										return callback( token, groups );
									}
								}
								else
								{
									// If any of the groups not found create new ...
									
									console.log( 'creating new groups in guacamole ...' );
									
									guacAdminCreateConnectionGroups( config, function( e, d )
									{
										
										console.log( { e:e, d:d } );
										
										if( e == 'ok' )
										{
											if( callback )
											{
												return callback( token, d );
											}
										}
										else
										{
											if( callback )
											{
												return callback( false, false );
											}
										}
										
									}, token );
								}
							}
							else
							{
								if( callback )
								{
									return callback( false, false );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( false, false );
							}
						}
					}
				};
				
				xhttp.open( "GET", ( settings.server_url+settings.server_api_path+'connectionGroups?token='+settings.server_api_token ), true );	
				xhttp.send(  );
				
			}
			
		} );
		
	}
	
	function guacAdminGetServer( config, id, callback )
	{
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminGetServer( '+token+' ) ', id );
			
			if( token && id )
			{
			
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				// --- Connections (Servers) ---------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
					
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
							else
							{
								if( callback )
								{
									return callback( 'fail', data );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( 'fail', data );
							}
						}
					}
				};
				
				xhttp.open( "GET", ( settings.server_url+settings.server_api_path+'connections/'+id+'/parameters?token='+settings.server_api_token ), true );	
				xhttp.send(  );
			
			}
		
		} );
		
	}
	
	function guacAdminListServers( config, callback )
	{
		
		// Guacamole Rest API Documentation : https://github.com/ridvanaltun/guacamole-rest-api-documentation
		
		guacAdminListConnectionGroups( config, function( token, groups )
		{
			
			console.log( 'guacAdminListServers( '+token+' ) ', groups );
			
			if( token && groups && groups['_Servers'] && groups['_Servers'].identifier )
			{
			
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				// --- Connections (Servers) -------------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
					
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
							else
							{
								if( callback )
								{
									return callback( 'fail', data );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( 'fail', data );
							}
						}
					}
				};
				
				xhttp.open( "GET", ( settings.server_url+settings.server_api_path+'connectionGroups/'+groups['_Servers'].identifier+'/tree?token='+settings.server_api_token ), true );	
				xhttp.send(  );
			
			}
		
		} );
		
	}
	
	function guacAdminListServerTest( config )
	{
		
		// Guacamole Rest API Documentation : https://github.com/ridvanaltun/guacamole-rest-api-documentation
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminListServerTest( '+token+' )' );
		
			if( token )
			{
			
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
			
				// --- Users -----------------------------------------------------------------------------------------------
			
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
				
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
					}
				};
			
				xhttp.open( "GET", ( settings.server_url + settings.server_api_path + 'users?token=' + settings.server_api_token ), true );	
				//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send(  );
			
				// --- ConnectionGroups (Servers) --------------------------------------------------------------------------
			
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
				
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
					}
				};
			
				// TODO: List connectionGroups look for Name Servers ...
			
				xhttp.open( "GET", ( settings.server_url + settings.server_api_path + 'connectionGroups?token=' + settings.server_api_token ), true );	
				//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send(  );
			
				// --- Connections (Servers) -------------------------------------------------------------------------------
			
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
				
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
						}
					}
				};
			
				// TODO: Get connectionGroup Name Servers id: 2 dynamic ...
			
				xhttp.open( "GET", ( settings.server_url + settings.server_api_path + 'connectionGroups/2/tree?token=' + settings.server_api_token ), true );	
				//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send(  );
			
				// --- other -----------------------------------------------------------------------------------------------
			

			
			}
		
		} );
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create( _this )
	{
		
		getSystemSettings( function( config )
		{
			
			guacAdminCreateServer( config, function( e, d )
			{
						
				console.log( { e:e, d:d } );
				
				// TODO: Find out what error messages look like ...
				
				if( e == 'ok' && d )
				{
				
					if( data && data.message )
					{
						Notify( { title: 'success', text: data.message } );
					}
					
					if( d.identifier && d.name )
					{
						refresh( d.identifier, d, _this );
					}
					
				}
				else if( data && data.response )
				{
					Notify( { title: i18n( 'i18n_liberator_server_create' ), text: i18n( 'i18n_' + data.response ) } );
					
					if( ge( 'LiberatorName' ) )
					{
						ge( 'LiberatorName' ).focus();
					}
				}
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: 'failed', text: data.message } );
					}
					
				}
				
			} );
			
		} );

		
	}
	
	function update( id, _this )
	{
		
		if( id )
		{
			
			getSystemSettings( function( config )
			{
			
				guacAdminUpdateServer( config, id, function( e, data )
				{
						
					console.log( { e:e, d:data } );
				
					// TODO: Find out what error messages look like ...
					
					if( e == 'ok' )
					{
						if( data )
						{
							if( data && data.message )
							{
								Notify( { title: 'success', text: data.message } );
							}
					
							if( data.identifier && data.name )
							{
								refresh( data.identifier, data, _this );
							}
						}
						else
						{
							refresh( id, false, _this );
						}
						
						editMode( true );
					}
					else if( data && data.response )
					{
						Notify( { title: i18n( 'i18n_liberator_server_update' ), text: i18n( 'i18n_' + data.response ) } );
					
						if( ge( 'LiberatorName' ) )
						{
							ge( 'LiberatorName' ).focus();
						}
					}
					else
					{
					
						if( data && data.message )
						{
							Notify( { title: 'failed', text: data.message } );
						}
					
					}
				
				} );
			
			} );
			
		}
		
	}
	
	function guacAdminCreateServer( config, callback )
	{
		
		guacAdminListConnectionGroups( config, function( token, groups )
		{
			
			console.log( 'guacAdminCreateServer( '+token+' ) ', groups );
			
			if( token && groups && groups['_Servers'] && groups['_Servers'].identifier )
			{
				
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				
				
				if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'VNC' )
				{
					
					var form = {
						'parentIdentifier'       : groups['_Servers'].identifier,
						'name'                   : ( ge( 'LiberatorName'     ) ? ge( 'LiberatorName'     ).value : '' ),
						'protocol'               : 'vnc',
						'attributes'             : { 'max-connections' : null, 'max-connections-per-user' : null },
						'activeConnections'      : 0,
						'parameters'             : {
							'port'               : ( ge( 'LiberatorPort'     ) ? ge( 'LiberatorPort'     ).value : '' ),
							'hostname'           : ( ge( 'LiberatorAddress'  ) ? ge( 'LiberatorAddress'  ).value : '' ),
							'password'           : ( ge( 'LiberatorPassword' ) ? ge( 'LiberatorPassword' ).value : '' ),
							'cursor'             : '',
							'color-depth'        : '',
							'clipboard-encoding' : ''
						}
					};
					
				}
				else if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'SSH' )
				{
					
					/*{
					  "parentIdentifier": "ROOT",
					  "name": "test",
					  "protocol": "ssh",
					  "parameters": {
						"port": "",
						"read-only": "",
						"swap-red-blue": "",
						"cursor": "",
						"color-depth": "",
						"clipboard-encoding": "",
						"disable-copy": "",
						"disable-paste": "",
						"dest-port": "",
						"recording-exclude-output": "",
						"recording-exclude-mouse": "",
						"recording-include-keys": "",
						"create-recording-path": "",
						"enable-sftp": "",
						"sftp-port": "",
						"sftp-server-alive-interval": "",
						"enable-audio": "",
						"color-scheme": "",
						"font-size": "",
						"scrollback": "",
						"timezone": null,
						"server-alive-interval": "",
						"backspace": "",
						"terminal-type": "",
						"create-typescript-path": "",
						"hostname": "",
						"host-key": "",
						"private-key": "",
						"username": "",
						"password": "",
						"passphrase": "",
						"font-name": "",
						"command": "",
						"locale": "",
						"typescript-path": "",
						"typescript-name": "",
						"recording-path": "",
						"recording-name": "",
						"sftp-root-directory": ""
					  },
					  "attributes": {
						"max-connections": "",
						"max-connections-per-user": "",
						"weight": "",
						"failover-only": "",
						"guacd-port": "",
						"guacd-encryption": "",
						"guacd-hostname": ""
					  }
					}*/	
					
				}
				else if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'RDP' )
				{
										
					var form = {
						'parentIdentifier'               : groups['_Servers'].identifier,
						'name'                           : ( ge( 'LiberatorName' ) ? ge( 'LiberatorName' ).value : '' ),
						'protocol'                       : 'rdp',
						'parameters'                     : {
							'port'                       : ( ge( 'LiberatorPort' ) ? ge( 'LiberatorPort' ).value : '' ),
							'read-only'                  : '',
							'swap-red-blue'              : '',
							'cursor'                     : '',
							'color-depth'                : '',
							'clipboard-encoding'         : '',
							'disable-copy'               : '',
							'disable-paste'              : '',
							'dest-port'                  : '',
							'recording-exclude-output'   : '',
							'recording-exclude-mouse'    : '',
							'recording-include-keys'     : '',
							'create-recording-path'      : '',
							'enable-sftp'                : '',
							'sftp-port'                  : '',
							'sftp-server-alive-interval' : '',
							'enable-audio'               : '',
							'security'                   : ( /*rdpd['security'] ? rdpd['security'] : */'any' ),
							
							'enable-drive'               : ( /*rdpd['drive_disabled'] == 1 || drivePath == '' ? */''/* : 'true'*/ ),
							'drive-name'                 : 'Friend',
							'drive-path'                 : ( config && config.admin.storage_root ? config.admin.storage_root : '' ),
							
							'disable-auth'               : '',
							'ignore-cert'                : 'true',
							'server-layout'              : '',
							'timezone'                   : '',
							'console'                    : '',
							'width'                      : '',
							'height'                     : '',
							'dpi'                        : '',
							'console-audio'              : ( /*rdpd['support_audio_console'] == '1' ? 'true' : */'' ),
							'disable-audio'              : ( /*rdpd['disable_audio'] == '1' ? 'true' : */'' ),
							'enable-audio-input'         : ( /*rdpd['enable_audio_input'] == '1' ? 'true' : */'' ),

							'enable-printing'            : ( /*rdpd['printing_disabled'] == '1' ? */'false'/* : 'true'*/ ),
							'printer-name'               : 'Friend Printer',
							'create-drive-path'          : '',

							'enable-wallpaper'           : ( /*rdpd['performance_wallpaper'] == 1 ? 'true' : */'' ),
							'enable-theming'             : ( /*rdpd['performance_theming'] == 1 ? 'true' : */'' ),
							'enable-font-smoothing'      : ( /*rdpd['performance_cleartype'] == 1 ? 'true' : */'' ),
							'enable-full-window-drag'    : ( /*rdpd['performance_windowdrag'] == 1 ? 'true' : */'' ),
							'enable-desktop-composition' : ( /*rdpd['performance_aero'] == 1 ? 'true' : */'' ),
							'enable-menu-animations'     : ( /*rdpd['performance_menuanimations'] == 1 ? 'true' : */'' ),

							'disable-bitmap-caching'     : '',
							'disable-offscreen-caching'  : '',
							'disable-glyph-caching'      : '',

							'preconnection-id'           : '',
							'hostname'                   : ( ge( 'LiberatorAddress'  ) ? ge( 'LiberatorAddress'  ).value : '' ),
							'username'                   : ( ge( 'LiberatorUsername' ) ? ge( 'LiberatorUsername' ).value : '' ),
							'password'                   : ( ge( 'LiberatorPassword' ) ? ge( 'LiberatorPassword' ).value : '' ),
							'domain'                     : ( ge( 'LiberatorDomain'   ) ? ge( 'LiberatorDomain'   ).value : '' ),
							
							'gateway-hostname'           : '',
							'gateway-username'           : '',
							'gateway-password'           : '',
							'gateway-domain'             : '',
							'initial-program'            : '',
							'client-name'                : '',
							
							'static-channels'            : '',
							'remote-app'                 : '',
							'remote-app-dir'             : '',
							'remote-app-args'            : '',
							'preconnection-blob'         : '',
							'load-balance-info'          : '',
							'recording-path'             : '',
							'recording-name'             : '',
							'sftp-hostname'              : '',
							'sftp-host-key'              : '',
							'sftp-username'              : '',
							'sftp-password'              : '',
							'sftp-private-key'           : '',
							'sftp-passphrase'            : '',
							'sftp-root-directory'        : '',
							'sftp-directory'             : ''
						},
						'attributes'                     : {
							'max-connections'            : '',
							'max-connections-per-user'   : '',
							'weight'                     : '',
							'failover-only'              : '',
							'guacd-port'                 : '',
							'guacd-encryption'           : '',
							'guacd-hostname'             : ''
						}
					};
					

					
				}
				else
				{
					if( callback )
					{
						return callback( 'fail', false );
					}
					
					return false;
				}
				
				// --- Connections (Servers) ---------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
					
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
							else
							{
								if( callback )
								{
									return callback( 'fail', data );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( 'fail', data );
							}
						}
					}
				};
				
				xhttp.open( "POST", ( settings.server_url+settings.server_api_path+'connections?token='+settings.server_api_token ), true );	
				xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send( JSON.stringify( form ) );
			
			}
		
		} );
		
	}
	
	function guacAdminUpdateServer( config, id, callback )
	{
		
		guacAdminListConnectionGroups( config, function( token, groups )
		{
			
			console.log( 'guacAdminUpdateServer( '+token+' ) ', { id:id, groups:groups } );
			
			if( token && id && groups && groups['_Servers'] && groups['_Servers'].identifier )
			{
				
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				
				
				if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'VNC' )
				{
					
					// TODO: Add support for updating protocol VNC
					
					var form = {};
					
				}
				else if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'SSH' )
				{
					
					// TODO: Add support for updating protocol SSH
					
					var form = {};
					
				}
				else if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value == 'RDP' )
				{
					
					var form = {
						'parentIdentifier'               : groups['_Servers'].identifier,
						'name'                           : ( ge( 'LiberatorName'     ) ? ge( 'LiberatorName'     ).value : '' ),
						'identifier'                     : id,
						'protocol'                       : 'rdp',
						'parameters'                     : {
							'port'                       : ( ge( 'LiberatorPort'     ) ? ge( 'LiberatorPort'     ).value : '' ),
							'hostname'                   : ( ge( 'LiberatorAddress'  ) ? ge( 'LiberatorAddress'  ).value : '' ),
							'username'                   : ( ge( 'LiberatorUsername' ) ? ge( 'LiberatorUsername' ).value : '' ),
							'password'                   : ( ge( 'LiberatorPassword' ) ? ge( 'LiberatorPassword' ).value : '' ),
							'domain'                     : ( ge( 'LiberatorDomain'   ) ? ge( 'LiberatorDomain'   ).value : '' )
						},
						'attributes'                     : {}
					};
					
				}
				else
				{
					if( callback )
					{
						return callback( 'fail', false );
					}
					
					return false;
				}
				
				// --- Connections (Servers) ---------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
					
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
					
						if( this.status == 200 || this.status == 204 )
						{
							console.log( '[' + this.status + '] ', data );
							
							if( data )
							{
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
							else
							{
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( 'fail', data );
							}
						}
					}
				};
				
				xhttp.open( "PUT", ( settings.server_url+settings.server_api_path+'connections/'+id+'?token='+settings.server_api_token ), true );	
				xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send( JSON.stringify( form ) );
			
			}
		
		} );
		
	}
	
	function guacAdminCreateConnectionGroups( config, callback, token )
	{
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminCreateConnectionGroups( '+token+' )' );
			
			if( token )
			{
				
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				var groups = {};
				
				// --- ConnectionGroups (Servers) --------------------------------------------------------------------------
				
				var xhr1 = new XMLHttpRequest();
				xhr1.onreadystatechange = function() 
				{
					if( xhr1.readyState == 4 ) 
					{
				
						dat1 = false;
					
						try
						{
							dat1 = JSON.parse( xhr1.responseText );
						}
						catch( err )
						{
							//
						}
						
						if( xhr1.status == 200 )
						{
							if( dat1 && dat1.identifier )
							{
								console.log( '[' + xhr1.status + '] ', dat1 );
								
								var xhr2 = new XMLHttpRequest();
								xhr2.onreadystatechange = function() 
								{
									if( xhr2.readyState == 4 ) 
									{
				
										dat2 = false;
					
										try
										{
											dat2 = JSON.parse( xhr2.responseText );
										}
										catch( err )
										{
											//
										}
										
										if( xhr2.status == 200 )
										{
											if( dat2 && dat2.identifier )
											{
												console.log( '[' + xhr2.status + '] ', dat2 );
												
												var xhr3 = new XMLHttpRequest();
												xhr3.onreadystatechange = function() 
												{
													if( xhr3.readyState == 4 ) 
													{
				
														dat3 = false;
					
														try
														{
															dat3 = JSON.parse( xhr3.responseText );
														}
														catch( err )
														{
															//
														}
														
														if( xhr3.status == 200 )
														{
															if( dat3 && dat3.identifier )
															{
																var groups = {};
																
																groups[ dat1.name ] = dat1;
																groups[ dat2.name ] = dat2;
																groups[ dat3.name ] = dat3;
																
																console.log( '[' + xhr3.status + '] ', groups );
																
																if( callback )
																{
																	return callback( 'ok', groups );
																}
															}
															else
															{
																if( callback )
																{
																	return callback( 'fail', dat3 );
																}
															}
														}
														else if( xhr3.status == 400 )
														{
															if( dat3 )
															{
																console.log( '[' + xhr3.status + '] ', dat3 );
															}
														
															if( callback )
															{
																return callback( 'fail', dat3 );
															}
														}
														else
														{
															if( dat3 )
															{
																console.log( '[' + xhr3.status + '] ', dat3 );
															}
														
															if( callback )
															{
																return callback( 'fail', dat3 );
															}
														}
								
													}
									
												};
											
												xhr3.open( "POST", ( settings.server_url+settings.server_api_path+'connectionGroups?token='+settings.server_api_token ), true );	
												xhr3.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
												xhr3.send( JSON.stringify( {
													'parentIdentifier'         : dat1.identifier,
													'name'                     : '_Users',
													'type'                     : 'ORGANIZATIONAL',
													'attributes'               : {
													'max-connections'          : '',
													'max-connections-per-user' : '',
													'enable-session-affinity'  : ''
													}
												} ) );
												
											}
											else
											{
												if( callback )
												{
													return callback( 'fail', dat2 );
												}
											}
										}
										else if( xhr2.status == 400 )
										{
											if( dat2 )
											{
												console.log( '[' + xhr2.status + '] ', dat2 );
											}
							
											if( callback )
											{
												return callback( 'fail', dat2 );
											}
										}
										else
										{
											if( dat2 )
											{
												console.log( '[' + xhr2.status + '] ', dat2 );
											}
											
											if( callback )
											{
												return callback( 'fail', dat2 );
											}
										}
								
									}
									
								};
								
								xhr2.open( "POST", ( settings.server_url+settings.server_api_path+'connectionGroups?token='+settings.server_api_token ), true );	
								xhr2.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
								xhr2.send( JSON.stringify( {
									'parentIdentifier'         : dat1.identifier,
									'name'                     : '_Servers',
									'type'                     : 'ORGANIZATIONAL',
									'attributes'               : {
									'max-connections'          : '',
									'max-connections-per-user' : '',
									'enable-session-affinity'  : ''
									}
								} ) );
								
							}
							else
							{
								if( callback )
								{
									return callback( 'fail', dat1 );
								}
							}
						}
						else if( xhr1.status == 400 )
						{
							if( dat1 )
							{
								console.log( '[' + xhr1.status + '] ', dat1 );
							}
							
							if( callback )
							{
								return callback( 'fail', dat1 );
							}
						}
						else
						{
							if( dat1 )
							{
								console.log( '[' + xhr1.status + '] ', dat1 );
							}
							
							if( callback )
							{
								return callback( 'fail', dat1 );
							}
						}
					}
				};
				
				xhr1.open( "POST", ( settings.server_url+settings.server_api_path+'connectionGroups?token='+settings.server_api_token ), true );	
				xhr1.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhr1.send( JSON.stringify( {
					'parentIdentifier'         : 'ROOT',
					'name'                     : '_Liberator',
					'type'                     : 'ORGANIZATIONAL',
					'attributes'               : {
					'max-connections'          : '',
					'max-connections-per-user' : '',
					'enable-session-affinity'  : ''
					}
				} ) );
				
			}
			
		}, token );
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		
		if( id )
		{
			
			getSystemSettings( function( config )
			{
			
				guacAdminRemoveServer( config, id, function( e, data )
				{
					
					console.log( { e:e, d:data } );
					
					// TODO: look at what a error looks like ...
					
					if( e == 'ok' )
					{
					
						if( data && data.response )
						{
							Notify( { title: 'success', text: data.response } );
						}
					}
					else
					{
						if( data && data.response )
						{
							Notify( { title: 'failed', text: data.response } );
						}
					}
					
					refresh(); cancel();
					
				} );
				
			} );
			
		}
		
	}
	
	function guacAdminRemoveServer( config, id, callback )
	{
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminDeleteServer( '+token+' ) ', id );
			
			if( token && id )
			{
				
				var settings = {
					server_url       : ( config && config.host.url ? config.host.url : 'https://localhost/guacamole/' ),
					server_api_path  : 'api/session/data/mysql/',
					server_api_token : token
				};
				
				// --- Connections (Servers) ---------------------------------------------------------------------------
				
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function() 
				{
					if( this.readyState == 4 ) 
					{
				
						data = false;
						
						console.log( this.responseText );
						
						try
						{
							data = JSON.parse( this.responseText );
						}
						catch( err )
						{
							//
						}
					
						if( this.status == 200 )
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							
								if( callback )
								{
									return callback( 'ok', data );
								}
							}
							else
							{
								if( callback )
								{
									return callback( 'fail', data );
								}
							}
						}
						else
						{
							if( data )
							{
								console.log( '[' + this.status + '] ', data );
							}
							
							if( callback )
							{
								return callback( 'fail', data );
							}
						}
					}
				};
				
				xhttp.open( "DELETE", ( settings.server_url+settings.server_api_path+'connections/'+id+'?token='+settings.server_api_token ), true );	
				xhttp.send(  );
			
			}
		
		} );
		
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
		if( ge( 'LiberatorEditButtons' ) )
		{
			ge( 'LiberatorEditButtons' ).className = ( close ? 'Closed' : 'Open' );
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
					
						if( ge( 'LiberatorDeleteBtn' ) && ge( 'LiberatorDeleteBtn' ).savedState )
						{
							
							if( typeof ge( 'LiberatorDeleteBtn' ).savedState.className != 'undefined' )
							{
								ge( 'LiberatorDeleteBtn' ).className = ge( 'LiberatorDeleteBtn' ).savedState.className;
							}
							if( typeof ge( 'LiberatorDeleteBtn' ).savedState.innerHTML != 'undefined' )
							{
								ge( 'LiberatorDeleteBtn' ).innerHTML = ge( 'LiberatorDeleteBtn' ).savedState.innerHTML;
							}
							if( typeof ge( 'LiberatorDeleteBtn' ).savedState.onclick != 'undefined' )
							{
								ge( 'LiberatorDeleteBtn' ).onclick = ge( 'LiberatorDeleteBtn' ).savedState.onclick;
							}
							
						}
						
						closeEdit();
						
						break;
					default: break;
				}
				
			}
			
			if( act.targ )
			{
			
				if( ge( 'LiberatorDeleteBtn' ) && ge( 'LiberatorDeleteBtn' ).savedState )
				{
				
					if( act.targ.id != 'LiberatorDeleteBtn' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
					{
						
						if( typeof ge( 'LiberatorDeleteBtn' ).savedState.className != 'undefined' )
						{
							ge( 'LiberatorDeleteBtn' ).className = ge( 'LiberatorDeleteBtn' ).savedState.className;
						}
						if( typeof ge( 'LiberatorDeleteBtn' ).savedState.innerHTML != 'undefined' )
						{
							ge( 'LiberatorDeleteBtn' ).innerHTML = ge( 'LiberatorDeleteBtn' ).savedState.innerHTML;
						}
						if( typeof ge( 'LiberatorDeleteBtn' ).savedState.onclick != 'undefined' )
						{
							ge( 'LiberatorDeleteBtn' ).onclick = ge( 'LiberatorDeleteBtn' ).savedState.onclick;
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
	
	function loading( id, obj )
	{
		console.log( 'got to edit ...' );
		
		if( id )
		{
			if( !obj ) return false;
			
			var loadingSlot = 0;
			var loadingInfo = {};
			var loadingList = [
				
				// 0 | Load template details
				
				function(  )
				{
					
					list( function ( res, dat )
					{
				
						console.log( { e:res, d:dat } );
						
						//if( !res ) return;
						
						if( dat && obj )
						{
							dat.obj = obj;
						}
						
						loadingInfo.details = dat;
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					}, id );
					
				},
				
				// 1 | Load applications
				
				function(  )
				{
					
					applications( function ( res, dat )
					{
					
						console.log( { e:res, d:dat } );
						
						if( !res ) return;
						
						loadingInfo.applications = dat;
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					} );
					
				},
				
				//  | init
				function(  )
				{
					console.log( '//  | init' );
					
					initDetails( loadingInfo, [ 'application', true ] );
				}
				
			];
			// Runs 0 the first in the array ...
			loadingList[ 0 ]();
		}
		else
		{
			initDetails( false );
		}
		
	}
	
	
	
	// Show the form
	function initDetails( info, show, first )
	{
		
		var details = ( info.details      ? info.details      : {} );
		var apps    = ( info.applications ? info.applications : {} );
		
		console.log( { details: details, apps: apps } );
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/application_liberator_details.html' );
		
		// Add all data for the template
		d.replacements = {
			liberator_title          : ( details.obj && details.obj.name ? details.obj.name : ''            ),
			liberator_name           : ( details.obj && details.obj.name ? details.obj.name : ''            ),
			liberator_address        : ( details     && details.hostname ? details.hostname : ''            ),
			liberator_port           : ( details     && details.port     ? details.port     : ''            ),
			liberator_admin_username : ( details     && details.username ? details.username : ''            ),
			liberator_admin_password : ( details     && details.password ? details.password : ''            ),
			liberator_domain         : ( details     && details.domain   ? details.domain   : 'FRIENDUP-AD' )
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'LiberatorDetails' ).innerHTML = data;
			
			if( !details.obj || !details.obj.identifier )
			{
				ge( 'LiberatorDeleteBtn' ).style.display = 'none';
				ge( 'AdminApplicationContainer' ).style.display = 'none';
			}
			else
			{
				ge( 'LiberatorEditButtons' ).className = 'Closed';
				
				if( ge( 'LiberatorBasicDetails' ) )
				{
					var inps = ge( 'LiberatorBasicDetails' ).getElementsByTagName( '*' );
					if( inps.length > 0 )
					{
						for( var a = 0; a < inps.length; a++ )
						{
							if( inps[ a ].id && [ 'LiberatorName', 'LiberatorAddress', 'LiberatorPort', 'LiberatorUsername', 'LiberatorPassword', 'LiberatorDomain' ].indexOf( inps[ a ].id ) >= 0 )
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
			}
			
			var bg1  = ge( 'LiberatorSaveBtn' );
			if( bg1 ) bg1.onclick = function( e )
			{
				// Save server ...
				
				if( details.obj && details.obj.identifier )
				{					
					console.log( 'update( '+details.obj.identifier+' )' );
					
					update( details.obj.identifier );
				}
				else
				{
					console.log( 'create()' );
							
					create(  );
				}
			}
			
			var bg2  = ge( 'LiberatorCancelBtn' );
			if( bg2 ) bg2.onclick = function( e )
			{
				if( details.obj && details.obj.identifier )
				{
					edit( details.obj.identifier, details.obj );
				}
				else
				{
					cancel(  );
				}
			}
			
			var bg4  = ge( 'LiberatorDeleteBtn' );
			if( bg4 ) bg4.onclick = function( e )
			{
				
				// Delete server ...
				
				if( details.obj && details.obj.identifier )
				{
					console.log( 'delete server' );
					
					removeBtn( this, { id: details.obj.identifier, button_text: 'i18n_delete_liberator_server', }, function ( args )
					{
						
						remove( args.id );
						
					} );
					
				}
				
			}
			
			
				
			function onLoad ( data )
			{
			
			
			
			}
			
			// Run onload functions ....
			
			onLoad();
			
			// Responsive framework
			Friend.responsive.pageActive = ge( 'LiberatorDetails' );
			Friend.responsive.reinit();
		}
		d.load();
		
	}
	
	
	
	function initMain()
	{
		console.log( 'initMain()' );
		
		var checkedGlobal = Application.checkAppPermission( 'PERM_TEMPLATE_GLOBAL' );
		var checkedWorkgr = Application.checkAppPermission( 'PERM_TEMPLATE_WORKGROUP' );
		
		if( checkedGlobal || checkedWorkgr )
		{
			
			// Get the user list
			list( function( res, dat )
			{
				console.log( { e:res, d:dat } );
				
				var servers = null;
				
				try
				{
					servers = dat;
				}
				catch( e ) {  }
				
				
				
				var o = ge( 'LiberatorList' ); o.innerHTML = '';
				
				
				// TODO: Find a way to make elements out of a string instead of object, making things more human readable ...
				
				
				
				var divs = appendChild( [ 
					{ 
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'HRow PaddingBottom';
							return d;
						}(),
						'child' : 
						[ 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent50 FloatLeft';
									d.innerHTML = '<h3 class="NoMargin FloatLeft"><strong>' + i18n( 'i18n_liberator_servers' ) + '</strong></h3>';
									return d;
								}() 
							}, 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent50 FloatLeft Relative';
									return d;
								}(), 
								'child' : 
								[ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'input' );
											d.type = 'text';
											d.className = 'FullWidth';
											d.placeholder = 'Search servers...';
											d.onclick = function (  ){ alert( 'TODO ...' ); };
											d.onkeyup = function ( e ) { filter( this.value, true ); console.log( 'do search ...' ); };
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
							d.className = 'List';
							return d;
						}(),
						'child' : 
						[  
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingBottom PaddingRight';
									d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingTop PaddingBottom PaddingRight';
									return d;
								}(),
								'child' : 
								[
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmall HContent90 FloatLeft Ellipsis';
											d.innerHTML = '<strong>Name</strong>';
											return d;
										}()
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HContent10 TextCenter FloatLeft Ellipsis';
											d.onclick = function () {  };
											return d;
											
										}(),
										'child' : 
										[
											{
												'element' : function() 
												{
													var b = document.createElement( 'button' );
													b.className = 'IconButton IconSmall ButtonSmall Negative FloatRight fa-plus-circle';
													b.onclick = function () { edit(); };
													return b;
												}()
											}
										]
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
						if( divs[i] )
						{
							o.appendChild( divs[i] );
						}
					}
				}
				
				
				
				if( servers )
				{
					
					var list = document.createElement( 'div' );
					list.className = 'List PaddingSmallTop PaddingSmallBottom';
					
					for( var k in servers )
					{
						
						if( servers[k] && servers[k].identifier && servers[k].name )
						{
							
							var divs = appendChild( [ 
								{
									'element' : function()
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow';
										d.id = servers[k].identifier;
										d.obj = servers[k];
										d.onclick = function()
										{
											edit( this.id, this.obj, this );
										};
										return d;
									}(),
									'child' : 
									[
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'TextCenter HContent10 FloatLeft PaddingSmall Ellipsis';
												//d.innerHTML = '<span class="IconSmall NegativeAlt fa-file-text-o"></span>';
												d.innerHTML = '<span class="IconSmall fa-file-text-o"></span>';
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent80 FloatLeft PaddingSmall Ellipsis';
												//d.innerHTML = servers[k].Data.name + ' (Host: '+servers[k].Data['full address']+')';
												d.innerHTML = '['+servers[k].protocol+'] ' + servers[k].name;
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent10 FloatLeft PaddingSmall Ellipsis';
												return d;
											}()
										}
									]
								}
							] );
							
							if( divs )
							{
								for( var i in divs )
								{
									if( divs[i] )
									{
										list.appendChild( divs[i] );
									}
								}
							}
						}
						
					}
					
					o.appendChild( list );
					
				}
				
				
				
				Friend.responsive.pageActive = ge( 'LiberatorList' );
				Friend.responsive.reinit();
				
			} );
			
		}
		else
		{
			var o = ge( 'LiberatorList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
		}
		
	}
	
	
	
};

