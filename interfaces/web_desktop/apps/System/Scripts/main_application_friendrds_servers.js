/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for friendrds servers management

Sections.applications_friendrds_servers = function( cmd, extra )
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
	
	function applications( details, callback )
	{
		
		if( callback && details && details.obj )
		{
			
			var m = new Module( 'friendrds' );
			m.onExecuted = function( e, d )
			{
				var json = null;
				
				if( e == 'ok' && d )
				{
					try
					{
						json = JSON.parse( d );
					
						if( json )
						{
							//
							
							var out = [];
							
							for( var i in json )
							{
								
								if( json[i].Config )
								{
									json[i].Config = JSON.parse( json[i].Config );
									
									console.log( json[i].Config );
									
									out.push( {
										'ID'       : ( json[i].ID                                                           ),
										'Alias'    : ( json[i].Name                                                         ),
										'Name'     : ( json[i].Config.Name                                                  ),
										'Path'     : ( json[i].Config.Path                                                  ),
										'Preview'  : ( json[i].Preview ? json[i].Preview+'&authid='+Application.authId : '' ),
										'Category' : ( json[i].Config.Category                                              )
									} );
								}
								
							}
							
							return callback( true, out );
							
						}
					} 
					catch( e )
					{ 
						console.log( e );
					} 
				}
				
				console.log( 'liberator app list ', { e:e, d:(json?json:d), args: { 'installPath': ( details.obj.protocol+'://'+details.hostname+(details.port?':'+details.port:'')+'/'+details.obj.identifier+'/' ) } } );
				
				return callback( false, false );
				
			}
			m.execute( 'list', { installPath: ( details.obj.protocol+'://'+details.hostname+(details.port?':'+details.port:'')+'/'+details.obj.identifier+'/' ) } );
						
			return true;
		}
		
		return false;
		
		// Add a new Module called Liberator and add list to FApplication like for example:
				
		// 'SELECT * FROM FApplication WHERE UserID=\'' . USERID . '\' AND `InstallPath` LIKE "rdp://185.116.4.200:3389/%"'
		
	}
	
	function remoteapps( details, callback )
	{
		if( callback && details && details.obj )
		{
			
			var ssh = new Module( 'friendrds' );
			ssh.onExecuted = function( e, d )
			{
				
				if( e == 'ok' )
				{
					try
					{
						data = JSON.parse( d );
				
						if( data )
						{
							console.log( data );
							
							var out = [];
							
							for( var i in data )
							{
								if( data[i] && data[i][1] )
								{
									out.push( {
										'ID'       : '-1',
										'Alias'    : ( data[i][1]['col'] == 'Alias'       ? data[i][1]['val']                                : '' ),
										'Name'     : ( data[i][2]['col'] == 'DisplayName' ? data[i][2]['val']                                : '' ),
										'Path'     : ( data[i][3]['col'] == 'FilePath'    ? data[i][3]['val']                                : '' ),
										'Preview'  : ( data[i][1]['icon']                 ? data[i][1]['icon']+'&authid='+Application.authId : '' ),
										'Category' : 'Office'
									} );
								}
							}
						
							console.log( 'getremoteapps: ', { e:e, d:out } );
						
							return callback( true, out );
						
						}
					} 
					catch( e )
					{ 
						//console.log( 'ssh_test: ', { e:e, d:d } );
					}
				}
				
				console.log( 'getremoteapps: ', { e:e, d:d } );
				
				return callback( false, false );
				
			}
			ssh.execute( 'getremoteapps', 
			{ 
				protocol   : details.obj.protocol, 
				hostname   : details.hostname, 
				port       : details.port, 
				identifier : details.obj.identifier, 
				username   : details.username, 
				password   : details.password 
			} );
			//ssh.execute( 'ssh_test' );
			
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
		
		// _FriendRDS
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
								
								var names = [ '_FriendRDS', '_Servers', '_Users' ];
								
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
	
	function updateApplication( details, callback, id )
	{
		
		if( ge( 'LiberatorAppDetails' ) && details && details.obj )
		{
			var icon = false;
			
			var canvas = ge( 'LiberatorAppIcon' );
			if( canvas && canvas.updated )
			{
				var base64 = 0;
				
				try
				{
					base64 = canvas.toDataURL();
				}
				catch( e ) {  }
				
				if( base64 && base64.length > 3000 )
				{
					icon = base64;
				}
			}
			
			var args = {
				'type'                         : details.obj.protocol,
				'name'                         : ge( 'LiberatorAppName'      ).value,
				'full address'                 : details.hostname,
				'server port'                  : details.port,
				'remoteapplicationprogram'     : ge( 'LiberatorAppAlias'     ).value,
				'remote-app-dir'               : ( ge( 'LiberatorAppRemoteDir' ).value ? '/"' + JSON.stringify( ge( 'LiberatorAppRemoteDir' ).value ) + '/"' : '' ),
				'saml_accessgroups'            : '',
				'icon'                         : '',
				'executable_path'              : '',
				'category'                     : 'Office',
				
				'security'                     : details.security,
				
				//'printing_disabled'          : '',
				//'drive_disabled'             : '',
				'alternate shell'              : '',
				
				// Parameters
				
				'remoteapp_parameters'         : '',
				'remoteapp_working_dir'        : '',
				
				// Audio
				
				//'support_audio_console'      : '',
				//'disable_audio'              : '',
				//'enable_audio_input'         : '',
				
				// Performance settings
				
				//'performance_wallpaper'      : '',
				//'performance_theming'        : '',
				'performance_cleartype'        : '1',
				'performance_windowdrag'       : '1',
				//'performance_aero'           : '',
				//'performance_menuanimations' : ''
			};
			
			console.log( args );
			
			if( args['name'] && args['remoteapplicationprogram'] )
			{
				
				var data = {
					'Name'        : args['name'],
					'Category'    : args['category'],
					'Path'        : args['remote-app-dir'],
					'Description' : '...',
					'Permissions' : [
						'Door Local',
						'Module System'
					],
					'Parameters' : args
				};
				
				var mm = new Module( 'friendrds' );
				mm.onExecuted = function( e, d )
				{
					if( 1==1 || ShowLog ) console.log( 'liberator app save ', { e:e, d:d, args: 
					{ 
						id: ( id ? id : '0' ), 
						name: args['remoteapplicationprogram'], 
						installPath: ( args['type']+'://'+args['full address']+(args['server port']?':'+args['server port']:'')+'/'+details.obj.identifier+'/'+args['remoteapplicationprogram'] ), 
						data: JSON.stringify( data, null, 2 ), 
						icon: ( icon ? icon : '' )
					} } );
					
					if( e == 'ok' )
					{
						if( callback ) return callback( true, d );
					}
					else
					{
						if( callback ) return callback( false, d );
					}
				}
				mm.execute( id > 0 ? 'update' : ( id == '-1' ? 'updateicon' : 'create' ), 
				{ 
					id: ( id ? id : '0' ), 
					name: args['remoteapplicationprogram'], 
					installPath: ( args['type']+'://'+args['full address']+(args['server port']?':'+args['server port']:'')+'/'+details.obj.identifier+'/'+args['remoteapplicationprogram'] ), 
					data: JSON.stringify( data, null, 2 ), 
					icon: ( icon ? icon : '' )
				} );
				
			}
			else
			{
				if( callback ) return callback( false, false );
			}
			
		}
		else
		{
			if( callback ) return callback( false, false );
		}
		
		
		
		// Add a new Module called Liberator and add save to FApplication like for example:
		
		// $conf = {
		//   "Name": "Paint",
		//   "Category": "Office",
		//   "Path": "C:\Windows\system32\mspaint.exe",
		//   "Description": "...",
		//   "Permissions": [
		//	  "Door Local",
		//	  "Module System"
		//   ],
		//   "Parameters": args,
		//   "Trusted": "yes"
		// };
		
		// $a = new dbIO( 'FApplication' );
		// $a->UserID = USERID;
		// $a->Name = 'Mitra mspaint';
		// $a->InstallPath = 'rdp://185.116.4.200:3389/12/mspaint';
		// if( !$a->Load() )
		// {
		//    $a->DateInstalled = date( 'Y-m-d H:i:s' );
		//    $a->Config = $conf;
		//    $a->Permissions = 'UGO';
		//    $a->DateModified = $a->DateInstalled;
		//    $a->Save();
		// }
		
		// grep -rnw '/home/acezerox/Projects/friendup/build/' -e "'FApplication'"
		// grep -rnw '/home/acezerox/Projects/friendup/build/' -e "ExecuteApplication("
		
		// Don't show liberator application for everyone ... And can't be used on Launch ...
		
		
		
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
					
					// TODO: Remove protocol identity in name if we have icons to display the different protocols instead of [protocol] ...
					
					var form = {
						'parentIdentifier'       : groups['_Servers'].identifier,
						'name'                   : '[VNC] ' + ( ge( 'LiberatorName' ) ? ge( 'LiberatorName' ).value : '' ),
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
						'name'                           : '[RDP] ' + ( ge( 'LiberatorName' ) ? ge( 'LiberatorName' ).value : '' ),
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
				
				// Temporary
				
				if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value != 'RDP' ) return false;
				
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
					
					// TODO: Remove protocol identity in name if we have icons to display the different protocols instead of [protocol] ...
					
					var form = {
						'parentIdentifier'               : groups['_Servers'].identifier,
						'name'                           : '[RDP] ' + ( ge( 'LiberatorName' ) ? ge( 'LiberatorName' ).value : '' ),
						'identifier'                     : id,
						'protocol'                       : 'rdp',
						'parameters'                     : {
							'port'                       : ( ge( 'LiberatorPort'     ) ? ge( 'LiberatorPort'     ).value : '' ),
							'hostname'                   : ( ge( 'LiberatorAddress'  ) ? ge( 'LiberatorAddress'  ).value : '' ),
							'username'                   : ( ge( 'LiberatorUsername' ) ? ge( 'LiberatorUsername' ).value : '' ),
							'password'                   : ( ge( 'LiberatorPassword' ) ? ge( 'LiberatorPassword' ).value : '' ),
							'domain'                     : ( ge( 'LiberatorDomain'   ) ? ge( 'LiberatorDomain'   ).value : '' )
						},
						'attributes'                     : { 'max-connections' : null, 'max-connections-per-user' : null }
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
				
				// Temporary
				
				if( ge( 'LiberatorType' ) && ge( 'LiberatorType' ).value != 'RDP' ) return false;
				
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
					'name'                     : '_FriendRDS',
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
	
	function removeApplication( id, callback )
	{
		if( id )
		{
			Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove_app' ), function( r )
			{
				if( r && r.data == true )
				{
					// This is the hard delete method, used by admins ...
					
					var m = new Module(	'friendrds' );
					m.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							if( callback ) return callback( true, d );
						}
						else
						{
							if( callback ) return callback( false, d );
						}
					}
					m.execute( 'remove', { id: id } );
				}
				else
				{
					if( callback ) return callback( false, false );
				}
			} );
		}
		else
		{
			if( callback ) return callback( false, false );
		}
		
		// Add a new Module called Liberator and add delete from FApplication and FUserApplication like for example:
		
		// DELETE all connected to FApplicationID first on users ...
		
		// 'DELETE FROM FApplication WHERE ID=\'' . ID . '\' AND UserID=\'' . USERID . '\' AND `InstallPath` != ""'
		
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
		
		ge( 'LiberatorDetails' ).innerHTML = '';
		
		if( id )
		{
			if( !obj ) return false;
			
			var loadingSlot = 0;
			var loadingInfo = {};
			var loadingList = [
				
				// 0 | Load server details
				
				function(  )
				{
					
					list( function ( res, dat )
					{
				
						console.log( { e:res, d:dat } );
						
						//if( !res ) return;
						
						if( dat && obj )
						{
							if( obj && obj.name )
							{
								// TODO: Remove protocol identity in name if we have icons to display the different protocols instead of [protocol] ...
								
								obj.name = obj.name.split( '[RDP] ' ).join( '' );
								obj.name = obj.name.split( '[SSH] ' ).join( '' );
								obj.name = obj.name.split( '[VNC] ' ).join( '' );
							}
							
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
					
					applications( loadingInfo.details, function ( res, dat )
					{
					
						console.log( { e:res, d:dat } );
						
						if( !res ) return;
						
						if( dat && dat.length )
						{
							
							loadingInfo.applications = dat;
							
							// Go to next in line ...
							loadingList[ ++loadingSlot ](  );
							
						}
						else
						{
							
							remoteapps( loadingInfo.details, function( e, d )
							{
								
								loadingInfo.applications = d;
							
								// Go to next in line ...
								loadingList[ ++loadingSlot ](  );
								
							} );
							
						}
							
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
		
		var type = '';
		
		var protocol = [ 'RDP', 'SSH', 'VNC' ];
		
		for( var i in protocol )
		{
			if( protocol[i] )
			{
				var selected = '';
				
				if( details.obj && details.obj.protocol == protocol[i].toLowerCase() )
				{
					selected = ' selected="selected"';
				}
				
				type += '<option' + selected + '>' + protocol[i] + '</option>';
			}
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/application_friendrds_servers_details.html' );
		
		// Add all data for the template
		d.replacements = {
			liberator_title          : ( details.obj && details.obj.name ? details.obj.name : ''            ),
			liberator_type           : ( type                                                               ),
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
			
				var func = {
					
					appids : function ( soft )
					{
						var ids = {};
						
						if( soft )
						{
							if( ShowLog ) console.log( 'soft ', soft );
							
							var i = 0;
							
							for( var a in soft )
							{
								if( soft[a] && soft[a].ID )
								{
									ids[ i++ ] = soft[a].ID;
								}
							}
						}
						
						return ids;
						
					}( apps ),
					
					mode : { applications : 'list' },
					
					// Applications ------------------------------------------------------------------------------------
					
					applications : function ( func )
					{
						
						// Editing applications
						
						var init =
						{
							
							func : this,
							
							ids  : this.appids,
							
							head : function ( hide )
							{
								
								var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
								inp.value = '';
								
								if( ge( 'ApplicationSearchCancelBtn' ) && ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) )
								{
									ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
									ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
								}
								
								var o = ge( 'ApplicationGui' ); o.innerHTML = '<input type="hidden" id="TempApplications">';
								
								//this.func.updateids( 'applications' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
											return ( !hide ? d : '' );
										}(),
										'child' : 
										[ 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.onclick = function(  )
													{
														_this.sortapps( 'Name' );
													};
													return ( !hide ? d : '' );
												}( this ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent45 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													d.onclick = function(  )
													{
														_this.sortapps( 'Category' );
													};
													return ( !hide ? d : '' );
												}( this )
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent15 FloatLeft Relative';
													return ( !hide ? d : '' );
												}()
											}
										]
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow Box Padding';
											d.id = 'ApplicationInner';
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
								
								this.func.mode[ 'applications' ] = 'list';
								
								if( apps )
								{
									this.head();
									
									var o = ge( 'ApplicationInner' ); o.innerHTML = '';
									
									console.log( 'apps: ', { apps: apps, ids: this.ids } );
									
									if( this.ids )
									{
										for( var a in this.ids )
										{
											if( this.ids[a] && this.ids[a].ID )
											{
												var found = false;
												
												for( var k in apps )
												{
													if( this.ids[a] && this.ids[a].ID == apps[k].ID )
													{
														found = true;
														
														break;
													}
												}
												
												if( !found ) continue;
											
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
																			var d = document.createElement( 'span' );
																			d.setAttribute( 'Name', apps[k].Name ? apps[k].Name : 'n/a' );
																			d.setAttribute( 'Category', apps[k].Category ? apps[k].Category : 'n/a' );
																			d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																			d.style.backgroundSize = 'contain';
																			d.style.width = '24px';
																			d.style.height = '24px';
																			d.style.display = 'block';
																			return d;
																		}(), 
																		 'child' : 
																		[ 
																			{
																				'element' : function() 
																				{
																					var d = document.createElement( 'div' );
																					if( apps[k].Preview )
																					{
																						d.style.backgroundImage = 'url(\'' + apps[k].Preview + '\')';
																						//d.style.backgroundColor = 'white';
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
																	d.innerHTML = '<strong>' + ( apps[k].Name ? apps[k].Name : 'n/a' ) + '</strong>';
																	return d;
																}() 
															},
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																	d.innerHTML = '<span>' + ( apps[k].Category ? apps[k].Category : 'n/a' ) + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent15 FloatLeft';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																					
																					/*args.func.updateids( 'applications', args.name, false );
																					
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																						
																							if( vars.pnt )
																							{
																								vars.pnt.innerHTML = '';
																							}
																			
																							if( vars.func )
																							{
																								vars.func.dock( 'refresh' );
																								vars.func.startup( 'refresh' );
																							}
																						
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																						}
																					
																					}, { pnt: args.pnt, func: args.func } );*/
																				
																				} );
																			
																			};
																			return b;
																		}( this.ids, apps[k].Name, this.func ) 
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
										
										// Sort default by Name ASC
										this.sortapps( 'Name', 'ASC' );
										
									}
									
								}
									
							},
							
							update : function ( app )
							{
								
								console.log( 'app: ', app );
								
								this.func.mode[ 'applications' ] = 'update';
								
								this.head( true );
								
								var o = ge( 'ApplicationInner' ); o.innerHTML = '';
								
								
								
								var str = '';
								
								str +='<div id="LiberatorAppDetails">';
		
								str +='	<div class="IconRect MarginTop MarginBottom HRow HContent70">';
								str +='		<div class="FloatLeft Padding TextLeft Relative">';
								str +='			<div id="LiberatorAppIconArea" class="IconSmall fa-user-circle-o">';
								str +='				<canvas id="LiberatorAppIcon" width="256" height="256"></canvas>';
								str +='			</div>';
								str +='		</div>';
								str +='		<div class="FloatLeft Padding TextLeft Relative">';
								str +='			<button type="button" class="Button IconSmall" id="LiberatorAppIconEdit">';
								str +='				' + i18n( 'i18n_browse' );
								str +='			</button>';
								str +='		</div>';
								str +='	</div>';
								
								str +='	<div class="HRow MarginBottom">';
								str +='		<div class="HContent30 FloatLeft Ellipsis">';
								str +='			<strong>' + i18n( 'i18n_liberator_application_name' ) + ':</strong>';
								str +='		</div>';
								str +='		<div class="HContent70 FloatLeft Ellipsis">';
								str +='			<input type="text" class="FullWidth" id="LiberatorAppName" value="' + ( app && app.Name ? app.Name : '' ) + '"/>';
								str +='		</div>';
								str +='	</div>';
								str +='	<div class="HRow MarginBottom">';
								str +='		<div class="HContent30 FloatLeft Ellipsis">';
								str +='			<strong>' + i18n( 'i18n_liberator_application_alias' ) + ':</strong>';
								str +='		</div>';
								str +='		<div class="HContent70 FloatLeft Ellipsis">';
								str +='			<input type="text" class="FullWidth" id="LiberatorAppAlias" value="'  + ( app && app.Alias ? app.Alias : '' ) + '"/>';
								str +='		</div>';
								str +='	</div>';
								str +='	<div class="HRow MarginBottom">';
								str +='		<div class="HContent30 FloatLeft Ellipsis">';
								str +='			<strong>' + i18n( 'i18n_liberator_application_remote_dir' ) + ':</strong>';
								str +='		</div>';
								str +='		<div class="HContent70 FloatLeft Ellipsis">';
								str +='			<input type="text" class="FullWidth" id="LiberatorAppRemoteDir" value="' + ( app && app.Path ? app.Path : '' ) + '"/>';
								str +='		</div>';
								str +='	</div>';
								
								str +='	<div id="UserEditContainer">';
								str +='		<div class="HRow">';
								str +='			<div id="UserEditButtons">';
								str +='				<button class="Button IconSmall FloatRight MarginLeft" id="LiberatorAppSaveBtn">';
								str +='					' + i18n( 'i18n_save' );
								str +='				</button>';
								str +='				<button class="Button IconSmall FloatRight MarginLeft" id="LiberatorAppCancelBtn">';
								str +='					' + i18n( 'i18n_cancel' );
								str +='				</button>';
								
								if( app && app.ID > 0 )
								{
									
									str +='				<button class="Button IconSmall Danger FloatRight MarginLeft" id="LiberatorAppDeleteBtn">';
									str +='					' + i18n( 'i18n_remove_app' );
									str +='				</button>';
									
								}
								
								str +='			</div>';
								str +='		</div>';
								str +='	</div>';
								
								str +='</div>';
								
								o.innerHTML = str;
								
								if( app && app.Preview )
								{
									// Only update the avatar if it exists..
									var avSrc = new Image();
									avSrc.src = app.Preview;
									avSrc.onload = function()
									{
										if( ge( 'LiberatorAppIcon' ) )
										{
											var ctx = ge( 'LiberatorAppIcon' ).getContext( '2d' );
											ctx.drawImage( avSrc, 0, 0, 256, 256 );
											ge( 'LiberatorAppIcon' ).style.background = 'white';
										}
									}
								}
								
								var ae = ge( 'LiberatorAppIconEdit' );
								if( ae ) 
								{
									ae.onclick = function( e )
									{
										//changeAvatar();
										
										var self = this;
										var description =
										{
											triggerFunction: function( item )
											{
												if ( item )
												{
													// Load the image
													var image = new Image();
													image.onload = function()
													{
														//console.log( 'loaded image ... ', item );
														// Resizes the image
														var canvas = ge( 'LiberatorAppIcon' );
														var context = canvas.getContext( '2d' );
														context.clearRect( 0, 0, canvas.width, canvas.height );
														context.drawImage( image, 0, 0, 256, 256 );
														canvas.updated = true;
													}
													image.src = getImageUrl( item[ 0 ].Path );
												}
											},
											path: "Mountlist:",
											type: "load",
											title: i18n( 'i18n_fileselectoravatar' ),
											filename: ""
										}
										var d = new Filedialog( description );
									}
								}
								
								var _this = this;
								
								if( ge( 'LiberatorAppSaveBtn' ) )
								{
									ge( 'LiberatorAppSaveBtn' ).onclick = function()
									{
										
										updateApplication( details, function( ret )
										{
											
											if( ret )
											{
												
												applications( details, function ( res, dat )
												{
											
													console.log( { e:res, d:dat } );
						
													if( !res ) return;
						
													if( dat && dat.length )
													{
							
														_this.edit( dat );
												
														var btn = ge( 'ApplicationEditBack' );
														if( btn )
														{
											
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
									
															if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
															{
																ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
																ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
															}
											
														}
												
													}
													else
													{
							
														remoteapps( details, function( e, d )
														{
								
															_this.edit( d );
													
															var btn = ge( 'ApplicationEditBack' );
															if( btn )
															{
											
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
									
																if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
																{
																	ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
																	ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
																}
											
															}
													
														} );
							
													}
							
												} );
												
											}
											
										}, ( app && app.ID ? app.ID : null ) );
										
									};
								}
								
								if( ge( 'LiberatorAppCancelBtn' ) )
								{
									ge( 'LiberatorAppCancelBtn' ).onclick = function(  )
									{
										
										applications( details, function ( res, dat )
										{
											
											console.log( { e:res, d:dat } );
						
											if( !res ) return;
						
											if( dat && dat.length )
											{
							
												_this.edit( dat );
												
												var btn = ge( 'ApplicationEditBack' );
												if( btn )
												{
											
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
									
													if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
													{
														ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
														ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
													}
											
												}
												
											}
											else
											{
							
												remoteapps( details, function( e, d )
												{
								
													_this.edit( d );
													
													var btn = ge( 'ApplicationEditBack' );
													if( btn )
													{
											
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
									
														if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
														{
															ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
															ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
														}
											
													}
													
												} );
							
											}
							
										} );
										
									};
								}
								
								if( app && app.ID > 0 )
								{
									
									if( ge( 'LiberatorAppDeleteBtn' ) )
									{
										ge( 'LiberatorAppDeleteBtn' ).onclick = function()
										{
											
											removeApplication( app.ID, function( ret )
											{
											
												if( ret )
												{	
													
													applications( details, function ( res, dat )
													{
											
														console.log( { e:res, d:dat } );
						
														if( !res ) return;
						
														if( dat && dat.length )
														{
							
															_this.edit( dat );
												
															var btn = ge( 'ApplicationEditBack' );
															if( btn )
															{
											
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
									
																if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
																{
																	ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
																	ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
																}
											
															}
												
														}
														else
														{
							
															remoteapps( details, function( e, d )
															{
								
																_this.edit( d );
													
																var btn = ge( 'ApplicationEditBack' );
																if( btn )
																{
											
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
									
																	if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
																	{
																		ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
																		ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
																	}
											
																}
													
															} );
							
														}
							
													} );
										
												}
											
											} );
										
										};
									}
									
								}
								
							},
							
							edit : function ( rows )
							{
								
								this.func.mode[ 'applications' ] = 'edit';
								
								var _apps = ( rows ? rows : apps );
								
								if( _apps )
								{
									this.head();
									
									var o = ge( 'ApplicationInner' ); o.innerHTML = '';
									
									for( var k in _apps )
									{
										if( _apps[k]/* && _apps[k].ID*/ )
										{
											var found = false;
											
											if( 1!=1 && this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a].ID == _apps[k].ID )
													{
														found = true;
													}
												}
											}
											
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
																		var d = document.createElement( 'span' );
																		d.setAttribute( 'Name', _apps[k].Name ? _apps[k].Name : 'n/a' );
																		d.setAttribute( 'Category', _apps[k].Category ? _apps[k].Category : 'Office' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
																		d.style.display = 'block';
																		return d;
																	}(), 
																	 'child' : 
																	[ 
																		{
																			'element' : function() 
																			{
																				var d = document.createElement( 'div' );
																				if( _apps[k].Preview )
																				{
																					d.style.backgroundImage = 'url(\'' + _apps[k].Preview + '\')';
																					//d.style.backgroundColor = 'white';
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
																d.innerHTML = '<strong>' + ( _apps[k].Name ? _apps[k].Name : 'n/a' ) + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + ( _apps[k].Category ? _apps[k].Category : 'Office' ) + '</span>';
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
																	'element' : function( ids, app, _this ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			
																			if( !app.ID ) return;
																			
																			_this.update( app );
																			
																			
																			// Hide add / edit button ...
								
																			if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
																			{
																				etn.classList.remove( 'Open' );
																				etn.classList.add( 'Closed' );
																			}
								
																			// Show back button ...
								
																			if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
																			{
																				//btn.classList.remove( 'Closed' );
																				//btn.classList.add( 'Open' );
																			}
										
																			if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
																			{
																				ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Open' );
																				ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Closed' );
																			}
																			
																			
																			
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				/*func.updateids( 'applications', name, [ name, '0' ] );
																				
																				if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																				updateApplications( details.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						
																						vars._this.classList.remove( 'fa-toggle-off' );
																						vars._this.classList.add( 'fa-toggle-on' );
																						
																						if( vars.func )
																						{
																							vars.func.dock( 'refresh' );
																							vars.func.startup( 'refresh' );
																						}
																						
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { _this: this, func: func } );*/
																				
																			}
																			else
																			{
																				
																				/*func.updateids( 'applications', name, false );
																				
																				if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																				updateApplications( details.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						
																						vars._this.classList.remove( 'fa-toggle-on' );
																						vars._this.classList.add( 'fa-toggle-off' );
																						
																						if( vars.func )
																						{
																							vars.func.dock( 'refresh' );
																							vars.func.startup( 'refresh' );
																						}
																						
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { _this: this, func: func } );*/
																				
																			}
																			
																		};
																		return b;
																	}( this.ids, _apps[k], this ) 
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
									
									// Sort default by Name ASC
									this.sortapps( 'Name', 'ASC' );
									
								}
								
							},
							
							searchapps : function ( filter, server )
							{
								
								if( ge( 'ApplicationInner' ) )
								{
									var list = ge( 'ApplicationInner' ).getElementsByTagName( 'div' );

									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
											var span = list[a].getElementsByTagName( 'span' )[0];
		
											if( span )
											{
												var param = [
													( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
													( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
												];
												
												if( !filter || filter == ''  
												|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
				
													var div = list[a].getElementsByTagName( 'div' );
				
													if( div.length )
													{
														for( var i in div )
														{
															if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
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
									
									if( ge( 'ApplicationSearchCancelBtn' ) )
									{
										if( !filter && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
											ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
										}
										
										else if( filter != '' && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Closed' );
											ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Open' );
										}
									}
								}
								
							},
							
							sortapps : function ( sortby, orderby )
							{

								//

								var _this = ge( 'ApplicationInner' );

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

								//console.log( output );
							},
							
							refresh : function (  )
							{
								
								switch( this.func.mode[ 'applications' ] )
								{
									
									case 'list':
										
										this.list();
										
										break;
									
									case 'update':
										
										this.update();
										
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
							
							case 'update':
								
								init.update();
								
								break;
							
							case 'edit':
								
								init.edit();
								
								break;
								
							case 'refresh':
								
								init.refresh();
								
								break;
							
							default:
								
								var etn = ge( 'ApplicationEdit' );
								if( etn )
								{
									etn.onclick = function( e )
									{
								
										init.update();
								
										// Hide add / edit button ...
								
										if( etn.classList.contains( 'Open' ) || etn.classList.contains( 'Closed' ) )
										{
											etn.classList.remove( 'Open' );
											etn.classList.add( 'Closed' );
										}
								
										// Show back button ...
								
										if( btn.classList.contains( 'Open' ) || btn.classList.contains( 'Closed' ) )
										{
											//btn.classList.remove( 'Closed' );
											//btn.classList.add( 'Open' );
										}
										
										if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
										{
											ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Open' );
											ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Closed' );
										}
										
									};
								}
						
								var btn = ge( 'ApplicationEditBack' );
								if( btn )
								{
									btn.onclick = function( e )
									{
								
										//init.list();
										init.edit();
										
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
										
										if( ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0] )
										{
											ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.remove( 'Closed' );
											ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0].classList.add( 'Open' );
										}
										
									};
								}
								
								var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchapps( this.value );
								}
								ge( 'ApplicationSearchCancelBtn' ).onclick = function( e )
								{
									init.searchapps( false );
									inp.value = '';
								}
								
								// Show listed applications ... 
								
								//init.list();
								init.edit();
								
								break;
								
						}
						
						
						
					}
					
					// More functions ...
					
				};
				
				// Init
				
				func.applications();
				
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
												// TODO: Add proper protocol icon ...
												
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
												d.innerHTML = /*'['+servers[k].protocol+'] ' + */servers[k].name;
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

