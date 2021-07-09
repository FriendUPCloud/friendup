/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for guacamole service management

Sections.services_guacamole = function( cmd, extra )
{
	
	switch( cmd )
	{
		
		case 'auth':
			
			if( extra && extra.data )
			{
				var config = {
					host  : { url: extra.data.host },
					admin : { 
						admin_username : extra.data.username,
						admin_password : extra.data.password
					}
				};
				
				//console.log( 'auth ', config );
				
				if( config.host && config.admin.admin_username && config.admin.admin_password )
				{
					guacAdminAuth( config, function( token )
					{
						
						if( token )
						{
							
							saveUserSettings( config, function( res )
							{
								
								if( !res )
								{
									console.log( 'saveUserSettings fail ??? ' );
								}
								
								initMain( config, token );
								
							} );
							
						}
						else
						{
							console.log( 'fail auth ... ' );
							
							initSettings( config, true );
						}
				
					} );
				}
				else
				{
					console.log( 'missing args ... ' );
					
					initSettings( config, true );
				}
			}
			
			break;
		
		default:
			
			getSystemSettings( function( config )
			{
				
				if( !config || !config.host || !config.host.url || !config.admin.admin_username || !config.admin.admin_password )
				{
					
					initSettings( config );
					
				}
				else
				{
					
					guacAdminAuth( config, function( token )
					{
						
						if( token )
						{
							initMain( config, token );
						}
						else
						{
							initSettings( config );
						}
						
					} );
					
				}
				
			} );
			
			break;
		
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
	
	// TODO: get API Token
	// TODO: get server data, or setup server data from app, like epat ...
	
	function getSystemSettings( callback )
	{
		
		// TODO: Move these settings to either the Admin/System app part of Server settings storage or it's own but differently defined.
		
		// TODO: Only list admin data to admins that have rolepermissions for it, never list for users ...
		
		//user settings
		Application.keyData.get( function( e, d )
		{
			//console.log( { e: e, d: d } );
			
			var out = {};
			
			if( e == 'ok' && d && d[0].Data )
			{
				out = d[0].Data;
				
				if( out.host && out.host.url && out.admin.admin_username && out.admin.admin_password )
				{
					if( callback )
					{
						return callback( out );
					}
				}
				
			}
			
			// default to server settings ...
			
			var m = new Module( 'system' );
			m.onExecuted = function( stat1, resp1 )
			{
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
			
		} );
		
	}
	
	function saveUserSettings( data, callback )
	{
		
		// user settings
		Application.keyData.save( 'guacamole', data, true, function( e, d )
		{
			
			if( e == 'ok' )
			{
				if( callback ) callback( true );
				
				return true;
			}
			else
			{
				console.log('could not save user credentials',{ e:e, d:d });
				
				if( callback ) callback( false );
				
				return false;
			}
			
		} );
		
	}
	
	function guacAdminAuth( config, callback, token )
	{
		
		if( token && callback )
		{
			return callback( token );
		}
		
		var settings = {
			server_url      : ( config && config.host.url ? config.host.url : '' ),
			server_api_path : 'api/',
			admin_username  : ( config && config.admin.admin_username ? config.admin.admin_username : '' ),
			admin_password  : ( config && config.admin.admin_password ? config.admin.admin_password : '' )
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
						console.log( '[' + this.status + '] Permission Granted. '/*, data*/ );
						
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
		xhttp.send( "username=" + encodeURIComponent( settings.admin_username ) + "&password=" + encodeURIComponent( settings.admin_password ) );
		
	}
	
	function checkHostUrl( host, callback )
	{
		if( host )
		{
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() 
			{
				
				if( this.readyState == 4 )
				{
					if( this.status === 200 && this.getResponseHeader( 'Content-Type' ) == 'text/css' )
					{
						if( callback )
						{
							callback( true );
						}
					}
					else
					{
						if( callback )
						{
							callback( false );
						}
					}
				}
				
			};
			
			xhttp.open( "GET", ( host + 'app.css?v=1.2.0' ), true );
    		xhttp.send(  );
			
		}
	}
	
	function initSettings( config, error )
	{
		
		var o = ge( 'GuacamoleMain' );
		
		if( !config || !config.host || !config.host.url )
		{
			config = { host: { url: ( window.location.protocol + '//' + window.location.hostname + '/guacamole/' ) } };
		}
		
		checkHostUrl( config.host.url, function( res )
		{
			
			if( res )
			{
				o.innerHTML = '<iframe style="width:100%;height:calc(100% - 5px);box-sizing:border-box;" frameBorder="0"></iframe>';
			
				// Get the user details template
				var d = new File( 'Progdir:Templates/service_guacamole_settings.html' );
		
				// Add all data for the template
				d.replacements = {
					url   : ( config && config.host && config.host.url ? config.host.url : '' ),
					error : ( error ? 'error' : '' )
				};
				
				// Add translations
				d.i18n();
				d.onLoad = function( data )
				{
			
					data = GetScripts( data );
			
					var doc = o.getElementsByTagName( 'iframe' )[0].contentWindow.document;
					doc.open();
					doc.write( data );
					doc.close();
			
				}
				d.load();
				
				return true;
			}
			else
			{
				
				o.innerHTML = '';
				
				var divs = appendChild( [ 
					{
						'element' : function()
						{
							var d = document.createElement( 'div' );
							d.className = 'HRow Padding';
							return d;
						}(),
						'child' : 
						[
							{
								'element' : function()
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent40 FloatLeft';
									d.innerHTML = '<input type="text" class="FullWidth" placeholder="guacamole server url..." value="' + config.host.url + '">';
									return d;
								}()
							},
							{
								'element' : function()
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent10 FloatLeft PaddingLeft';
									return d;
								}(),
								'child' : 
								[
									{
										'element' : function()
										{
											var b = document.createElement( 'button' );
											b.className = 'Button';
											b.innerHTML = 'Retry';
											b.onclick = function()
											{
												if( this.parentNode.parentNode.getElementsByTagName( 'input' )[0].value )
												{
													initSettings( { host: { url: this.parentNode.parentNode.getElementsByTagName( 'input' )[0].value } } );
												}
											};
											return b;
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
						if( divs[i] )
						{
							o.appendChild( divs[i] );
						}
					}
				}
				
				
				return false;
			}
			
		} );
		
	}
	
	function initMain( config, token )
	{
		
		var creds = ''; var src = '';
		
		src = ( config.host && config.host.url ? config.host.url : '' );
		
		creds = ( token ? '?token=' + token : '' );
		
		var o = ge( 'GuacamoleMain' );
		o.innerHTML = '<iframe style="width:100%;height:calc(100% - 5px);box-sizing:border-box;" frameBorder="0" src="' + ( src + '#/' + creds ) + '"></iframe>';
		
	}
	
};

Application.receiveMessage = function( msg )
{
	
	if( !msg.command && !msg.derp ) return;
	
	if( msg.command == 'savecredentials' )
	{
		//console.log( 'Application.receiveMessage = function( msg ) ', msg );
		
		Sections.services_guacamole( 'auth', msg );
	}
	
};

