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
	
	console.log( { cmd : cmd, extra : extra } );
	
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
						
						return callback( false, false );
						
					} );
					
					// testing ....
					
					guacAdminListServerTest( config );
					
				} );
				
				
			}
			
			return true;
		}
		
		return false;
		
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
	
	function guacAdminAuth( config, callback )
	{
		
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
		
		xhttp.open( "POST", ( settings.server_url + settings.server_api_path + 'tokens' ), true );	
		//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
		xhttp.send( "username=" + encodeURIComponent( settings.admin_username ) + "&password=" + encodeURIComponent( settings.admin_password ) );
		
	}
	
	function guacAdminListConnectionGroups( config )
	{
		
		
		
	}
	
	function guacAdminGetServer( config, id, callback )
	{
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminListServers( '+token+' )' );
			
			if( token )
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
			

			
				xhttp.open( "GET", ( settings.server_url + settings.server_api_path + 'connections/'+id+'/parameters?token=' + settings.server_api_token ), true );	
				//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
				xhttp.send(  );
			
			}
		
		} );
		
	}
	
	function guacAdminListServers( config, callback )
	{
		
		// Guacamole Rest API Documentation : https://github.com/ridvanaltun/guacamole-rest-api-documentation
		
		guacAdminAuth( config, function( token )
		{
			
			console.log( 'guacAdminListServers( '+token+' )' );
			
			if( token )
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
			
				// TODO: Get connectionGroup Name Servers id: 2 dynamic ...
			
				xhttp.open( "GET", ( settings.server_url + settings.server_api_path + 'connectionGroups/2/tree?token=' + settings.server_api_token ), true );	
				//xhttp.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );
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
	
	
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	
	
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
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading( id )
	{
		console.log( 'got to edit ...' );
		
		if( id )
		{
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
			liberator_title          : ( details && details.name     ? details.name     : '' ),
			liberator_address        : ( details && details.hostname ? details.hostname : '' ),
			liberator_port           : ( details && details.port     ? details.port     : '' ),
			liberator_admin_username : ( details && details.username ? details.username : '' ),
			liberator_admin_password : ( details && details.password ? details.password : '' ),
			liberator_domain         : ( details && details.domain   ? details.domain   : '' )
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'LiberatorDetails' ).innerHTML = data;
						
				
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
										d.onclick = function()
										{
											edit( this.id, this );
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

