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
				m.execute( 'usersetupget', { id: id, authid: Application.authId } );
			}
			else
			{
				var m = new Module( 'mitra' );
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
				m.execute( 'loadapplicationlist', { admin: true, authid: Application.authId } );
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
						
						if( !res ) return;
						
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
									d.innerHTML = '<h3 class="NoMargin FloatLeft"><strong>' + i18n( 'i18n_servers' ) + '</strong></h3>';
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
						
						if( servers[k] && servers[k].ID && servers[k].Data )
						{
							
							var divs = appendChild( [ 
								{
									'element' : function()
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow';
										d.id = servers[k].ID;
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
												d.innerHTML = servers[k].Data.name + ' (Host: '+servers[k].Data['full address']+')';
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

