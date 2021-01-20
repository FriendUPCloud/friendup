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
	
	// TODO: get API Token
	// TODO: get server data, or setup server data from app, like epat ...
	
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
		xhttp.send( "username=" + encodeURIComponent( settings.admin_username ) + "&password=" + encodeURIComponent( settings.admin_password ) );
		
	}
	
	function initSettings( config )
	{
		
		// TODO: Set host url first ...
		
		var o = ge( 'GuacamoleMain' );
		
		if( !config || !config.host || !config.host.url )
		{
			o.innerHTML = 'Server settings: mitra/host: url is required ...';
			return false;
		}
		
		o.innerHTML = '<iframe style="width:100%;height:calc(100% - 5px);box-sizing:border-box;" frameBorder="0"></iframe>';
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/service_guacamole_settings.html' );
		
		// Add all data for the template
		d.replacements = {
			url : ( config && config.host && config.host.url ? config.host.url : '' )
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
		
	}
	
	function initMain( config, token )
	{
		
		var creds = ''; var src = '';
		
		console.log( { config: config, token: token } );
		
		src = ( config.host && config.host.url ? config.host.url : 'https://volatile.friendup.cloud/guacamole/' );
		
		console.log( 'initMain() ' + src );
		
		creds = ( token ? '?token=' + token : '' );
		
		var o = ge( 'GuacamoleMain' );
		o.innerHTML = '<iframe style="width:100%;height:calc(100% - 5px);box-sizing:border-box;" frameBorder="0" src="' + ( src + '#/' + creds ) + '"></iframe>';
		
		/*o.getElementsByTagName( 'iframe' )[0].onload = function()
		{ 
			this.src = ( src + '#/' ); 
		};*/
		
	}
	
};

