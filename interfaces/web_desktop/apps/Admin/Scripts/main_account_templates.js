/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for template management

Sections.accounts_templates = function( cmd, extra )
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
			
			//create();
			
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
				m.execute( 'usersetup', { authid: Application.authId } );
			}
			
			return true;
		}
		
		return false;
		
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
	
	function lookandfeel( callback, id )
	{
		
		if( callback && id )
		{
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				if( e == 'ok' )
				{
					return callback( true, '/system.library/module/?module=system&command=usersetupwallpaperget&setupId='+id+'&authid='+Application.authId+'&random='+(Math.random()*999999+Math.random()*909999) );
				}
				
				return callback( true, '/system.library/module/?module=system&command=thumbnail&width=568&height=320&mode=resize&authid='+Application.authId+'&path=Home:Wallpaper/Freedom.jpg' );
			}
			m.execute( 'usersetupwallpaperexists', { setupId: id, authid: Application.authId } );
			
			return true;
		}
		
		return false;
	}
	
	function edit( id )
	{
		
		loading( id );
		
	}
	
	function cancel()
	{
		
		console.log( 'cancel(  ) ' );

		if( ge( 'TemplateDetails' ) )
		{
			ge( 'TemplateDetails' ).innerHTML = '';
		}
		
	}
	
	function filter( filter, server )
	{
		
		console.log( { filter: filter, server: server } );
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		
		console.log( 'create()' );
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				//refresh();
			}
		}
		m.execute( 'usersetupadd', { Name: 'Default', authid: Application.authId } );
		
	}
	
	function update( id )
	{
		
		console.log( 'update( '+id+' )' );
		
		if ( id )
		{
			// Setup input values
			
			
			
			return;
			
			var args = {};
			
			var vals = [ 'Name', 'Preinstall', 'Applications', 'Disks', 'Startup', 'Languages', 'Themes' ];
			
			for( var a = 0; a < vals.length; a++ )
			{
				if( ge( 'pSetup' + vals[a] ) )
				{
					if( ge( 'pSetup' + vals[a] ).tagName == 'INPUT' )
					{
						args[vals[a]] = ( ge( 'pSetup' + vals[a] ).type == 'checkbox' ? ( ge( 'pSetup' + vals[a] ).checked ? '1' : '0' ) : ge( 'pSetup' + vals[a] ).value );
					}
					else if( ge( 'pSetup' + vals[a] ).tagName == 'SELECT' )
					{
						args[vals[a]] = ge( 'pSetup' + vals[a] ).value;
					}
					else if( ge( 'pSetup' + vals[a] ).tagName == 'DIV' )
					{
						var ele = ge( 'pSetup' + vals[a] ).getElementsByTagName( '*' );
					
						if( ele.length > 0 )
						{
							var value = false;
						
							for( var v = 0; v < ele.length; v++ )
							{
								if( ele[v].getAttribute( 'value' ) && ele[v].getAttribute( 'value' ) != '' )
								{
									var inp = ele[v].getElementsByTagName( 'input' );
								
									value = ( value ? ( value + ', ' + ele[v].getAttribute( 'value' ) + ( inp[0] && inp[0].type == 'checkbox' ? ( inp[0].checked ? '_1' : '_0' ) : '' ) ) : ( ele[v].getAttribute( 'value' ) + ( inp[0] && inp[0].type == 'checkbox' ? ( inp[0].checked ? '_1' : '_0' ) : '' ) ) );
								}
							}
						
							if( value )
							{
								args[vals[a]] = value;
							}
						}
					}
					else
					{
						//args[vals[a]] = ge( 'pSetup' + vals[a] ).value;
					}
				}
			
			}
		
			args.id = id.value;
			
			
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				if( e == 'ok' )
				{
					//EditSetup( id.value );
					//RefreshSetup();
				}
				
			}
			m.execute( 'usersetupsave', args );
		}
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		console.log( 'remove( '+id+' )' );
			
		Confirm( i18n( 'i18n_deleting_template' ), i18n( 'i18n_deleting_template_verify' ), function( result )
		{
			
			
			
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
	
	function sortApps( name )
	{
		
		//
		
		alert( 'TODO ... sortApps( '+name+' )' );
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
						
						//initDetails( loadingInfo, [  ], true );
						
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
						
						//if( !res ) return;
						
						if( dat )
						{
							for( var k in dat )
							{
								if( dat[k] && dat[k].Name )
								{
									dat[k].Preview = ( !dat[k].Preview ? '/webclient/apps/'+dat[k].Name+'/icon.png' : '/system.library/module/?module=system&command=getapplicationpreview&application='+dat[k].Name+'&authid='+Application.authId );
								}
							}
						}
						
						loadingInfo.applications = dat;
						
						//initDetails( loadingInfo, [ 'application', 'dock', 'startup' ], true );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					} );
					
				},
				
				// 1 | Load look and feel
				
				function(  )
				{
					
					lookandfeel( function ( res, dat )
					{
						
						loadingInfo.looknfeel = dat;
						
						initDetails( loadingInfo, [ 'application', 'dock', 'startup', 'looknfeel', true ] );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					}, id );
					
				},
				
				//  | init
				function(  )
				{
					console.log( '//  | init' );
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
		
		var details = ( info.details ? info.details : {} );
		var data = ( details.Data ? details.Data : {} );
		var soft = ( data.software ? data.software : {} );
		var star = ( data.startups ? data.startups : {} );
		var apps = ( info.applications ? info.applications : {} );
		var look = ( info.looknfeel ? info.looknfeel : {} );
		
		console.log( info );
		
		// Language
		var availLangs = {
			'en' : 'English',
			'fr' : 'French',
			'no' : 'Norwegian',
			'fi' : 'Finnish',
			'pl' : 'Polish'
		};
		
		var languages = '';
		
		for( var a in availLangs )
		{
			languages += '<option value="' + a + '"' + ( data.language && data.language == a ? ' selected="selected"' : '' ) + '>' + availLangs[ a ] + '</option>';
		}
		
		var theme = {
			
			dark : function ()
			{
				
				// TODO: look for a solution so there is no need for two different ways to handle one thing before and after template file load ...
				
				/*var b = document.createElement( 'button' );
				b.className = 'IconButton IconSmall IconToggle ButtonSmall fa-toggle-off';
				b.onclick = function(  )
				{
					
					if( this.classList.contains( 'fa-toggle-off' ) )
					{
						this.classList.remove( 'fa-toggle-off' );
						this.classList.add( 'fa-toggle-on' );
					}
					else
					{
						this.classList.remove( 'fa-toggle-on' );
						this.classList.add( 'fa-toggle-off' );
					}
					
				};
				return b;*/
				
				return '<button class="IconButton IconSmall IconToggle ButtonSmall fa-toggle-off" id="theme_dark_button"></button>';
				
			},
			
			controls : function ()
			{
				
				return '<select class="InputHeight FullWidth"><option value="mac">Mac style</option><option value="windows">Windows style</option></select>';
				
			},
			
			workspace_count : function ()
			{
				
				return '<input type="number" class="FullWidth" value="1">';
				
			},
			
			wallpaper_button : function ()
			{
				
				return '<button class="ButtonAlt IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>';
				
			},
			
			wallpaper_preview : function ()
			{
				
				// Set default wallpaper as fallback ...
				
				//return ( look ? '<div style="width:100%;height:100%;background: url(\''+look+'\') center center / cover no-repeat;"><button class="IconButton IconSmall ButtonSmall Negative FloatRight fa-remove"></button></div>' : '' );
				
			}
			
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_template_details.html' );
		
		// Add all data for the template
		d.replacements = {
			template_title: ( details.Name ? details.Name : i18n( 'i18n_new_template' ) ),
			template_name: ( details.Name ? details.Name : '' ),
			template_description: '',
			template_language: languages,
			
			theme_dark: theme.dark(),
			theme_controls: theme.controls(),
			workspace_count: theme.workspace_count(),
			wallpaper_button: theme.wallpaper_button()/*,
			wallpaper_preview: theme.wallpaper_preview()*/
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'TemplateDetails' ).innerHTML = data;
			
			if( !details.ID )
			{
				ge( 'AdminApplicationContainer' ).style.display = 'none';
				ge( 'AdminDockContainer'        ).style.display = 'none';
				ge( 'AdminStartupContainer'     ).style.display = 'none';
				ge( 'AdminLooknfeelContainer'   ).style.display = 'none';
			}
			
			var bg1  = ge( 'TempSaveBtn' );
			if( bg1 ) bg1.onclick = function( e )
			{
				// Save template ...
				
				console.log( '// save template' );
				
				update( details.ID ? details.ID : 0 );
			}
			var bg2  = ge( 'TempCancelBtn' );
			if( bg2 ) bg2.onclick = function( e )
			{
				cancel(  );
			}
			var bg3  = ge( 'TempBackBtn' );
			if( bg3 ) bg3.onclick = function( e )
			{
				cancel(  );
			}
			
			
			
			
			
			
			
			
			
			function onLoad ( data )
			{
						
				var func = {
					
					appids : function ( soft )
					{
						var ids = {};
						
						if( soft )
						{
							for( var a in soft )
							{
								if( soft[a] && soft[a][0] )
								{
									ids[ soft[a][0] ] = soft[a];
								}
							}
						}
						
						return ids;
						
					}( soft ),
					
					startids : function ( star )
					{
						var ids = {};
			
						if( star )
						{
							for( var a in star )
							{
								if( star[a] )
								{
									ids[ star[a].split( ' ' )[1] ] = star[a];
								}
							}
						}
						
						return ids;
			
					}( star ),
					
					mode : { applications : 'list', dock : 'list', startup : 'list' },
					
					// Applications ------------------------------------------------------------------------------------
					
					applications : function ( func )
					{
						
						// Editing applications
						
						var init =
						{
							
							func : this,
							
							ids  : this.appids,
							
							head : function (  )
							{
								
								var o = ge( 'ApplicationGui' ); o.innerHTML = '';
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.onclick = function(  )
													{
														sortApps( 'Name' );
													};
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent50 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													d.onclick = function(  )
													{
														sortApps( 'Category' );
													};
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent10 FloatLeft Relative';
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
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false;
											
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name )
													{
														found = true;
													}
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
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent50 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														}, 
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
																	'element' : function( ids, name, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																			
																			ids[ name ] = ( ids[ name ] ? [ 0, ids[ name ][ 1 ] ] : [ 0, 0 ] );
																			
																			var pnt = this.parentNode.parentNode;
																			
																			if( pnt )
																			{
																				pnt.innerHTML = '';
																			}
																			
																			if( func )
																			{
																				func.dock( 'refresh' );
																				func.startup( 'refresh' );
																			}
																			
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
									
								}
									
							},
							
							edit : function (  )
							{
								
								this.func.mode[ 'applications' ] = 'edit';
								
								if( apps )
								{
									this.head();
									
									var o = ge( 'ApplicationInner' ); o.innerHTML = '';
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false;
											
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name )
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
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent50 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														},
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
																	'element' : function( ids, name, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				ids[ name ] = ( ids[ name ] ? [ name, ids[ name ][ 1 ] ] : [ name, 0 ] );
																				
																				this.classList.remove( 'fa-toggle-off' );
																				this.classList.add( 'fa-toggle-on' );
																			}
																			else
																			{
																				ids[ name ] = ( ids[ name ] ? [ 0, ids[ name ][ 1 ] ] : [ 0, 0 ] );
																				
																				this.classList.remove( 'fa-toggle-on' );
																				this.classList.add( 'fa-toggle-off' );
																			}
																			
																			if( func )
																			{
																				func.dock( 'refresh' );
																				func.startup( 'refresh' );
																			}
																			
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
									
								}
								
							},
							
							refresh : function (  )
							{
								
								switch( this.func.mode[ 'applications' ] )
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
								
								var etn = ge( 'ApplicationEdit' );
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
						
								var btn = ge( 'ApplicationEditBack' );
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
						
								// Show listed applications ... 
						
								init.list();
								
								break;
								
						}
						
					},
					
					// Dock --------------------------------------------------------------------------------------------
					
					dock : function ( func )
					{
						
						// Editing Dock
						
						var init =
						{
							
							func : this,
							
							ids  : this.appids,
							
							head : function ( hidecol )
							{
								var o = ge( 'DockGui' ); o.innerHTML = '';
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent10 FloatLeft Relative';
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
											d.id = 'DockInner';
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
								
								this.func.mode[ 'dock' ] = 'list';
								
								if( apps )
								{
									this.head();
									
									var o = ge( 'DockInner' ); o.innerHTML = '';
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false;
											
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name && this.ids[a][1] )
													{
														found = true;
													}
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
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 TextCenter FloatLeft Ellipsis';
																return d;
															}(),
															'child' : 
															[ 
																{ 
																	'element' : function( order, _this ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
																		b.onclick = function(  )
																		{
																			
																			_this.sortdown( order );
																			
																		};
																		return b;
																	}( k, this ) 
																},
																{ 
																	'element' : function( order, _this ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																		b.onclick = function()
																		{
																			
																			_this.sortup( order );
																			
																		};
																		return b;
																	}( k, this ) 
																}
															] 
														}, 
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
																	'element' : function( ids, name ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																			
																			ids[ name ] = [ name, 0 ];
																			
																			var pnt = this.parentNode.parentNode;
																			
																			if( pnt )
																			{
																				pnt.innerHTML = '';
																			}
																			
																		};
																		return b;
																	}( this.ids, apps[k].Name ) 
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
								
								this.func.mode[ 'dock' ] = 'edit';
								
								if( apps )
								{
									this.head( true );
									
									var o = ge( 'DockInner' ); o.innerHTML = '';
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false; var toggle = false;
											
											if( this.ids )
											{
												for( var a in this.ids )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name )
													{
														found = true;
														
														if( this.ids[a][1] )
														{
															toggle = true;
														}
													}
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
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent50 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														},
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
																	'element' : function( ids, name ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				ids[ name ] = [ name, 1 ];
																				
																				this.classList.remove( 'fa-toggle-off' );
																				this.classList.add( 'fa-toggle-on' );
																			}
																			else
																			{
																				ids[ name ] = [ name, 0 ];
																				
																				this.classList.remove( 'fa-toggle-on' );
																				this.classList.add( 'fa-toggle-off' );
																			}
																		};
																		return b;
																	}( this.ids, apps[k].Name ) 
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
								
								switch( this.func.mode[ 'dock' ] )
								{
									
									case 'list':
										
										this.list();
										
										break;
										
									case 'edit':
										
										this.edit();
										
										break;
										
								}
								
							},
							
							sortup : function ( order )
							{
								
								console.log( 'TODO: sortup: ' + order );
								
								console.log( 'change between two ids in sorting ...' );
								
							},
							
							sortdown : function ( order )
							{
								
								console.log( 'TODO: sortdown: ' + order );
								
								console.log( 'change between two ids in sorting ...' );
								
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
								
								var etn = ge( 'DockEdit' );
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
						
								var btn = ge( 'DockEditBack' );
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
						
					},
					
					// Startup -----------------------------------------------------------------------------------------
					
					startup : function ( func )
					{
						
						// Editing Startup
						
						var init =
						{
							
							func : this,
							
							ids  : this.startids,
							
							head : function ( hidecol )
							{
								var o = ge( 'StartupGui' ); o.innerHTML = '';
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent10 FloatLeft Relative';
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
											d.id = 'StartupInner';
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
								console.log( this.ids );
								
								this.func.mode[ 'startup' ] = 'list';
								
								if( apps )
								{
									this.head();
									
									var o = ge( 'StartupInner' ); o.innerHTML = '';
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false;
											
											if( this.func.appids )
											{
												for( var a in this.func.appids )
												{
													if( this.func.appids[a] && this.func.appids[a][0] == apps[k].Name )
													{
														if( this.ids[ apps[k].Name ] )
														{
															found = true;
														}
													}
													else if( a == apps[k].Name && this.ids[ apps[k].Name ] )
													{
														this.ids[ apps[k].Name ] = false;
													}
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
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent25 TextCenter FloatLeft Ellipsis';
																return d;
															}(),
															'child' : 
															[ 
																{ 
																	'element' : function( order, _this ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
																		b.onclick = function(  )
																		{
																			
																			_this.sortdown( order );
																			
																		};
																		return b;
																	}( k, this ) 
																},
																{ 
																	'element' : function( order, _this ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																		b.onclick = function()
																		{
																			
																			_this.sortup( order );
																			
																		};
																		return b;
																	}( k, this ) 
																}
															] 
														}, 
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
																	'element' : function( ids, name ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																		b.onclick = function(  )
																		{
																			
																			ids[ name ] = false;
																			
																			var pnt = this.parentNode.parentNode;
																			
																			if( pnt )
																			{
																				pnt.innerHTML = '';
																			}
																			
																		};
																		return b;
																	}( this.ids, apps[k].Name ) 
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
								
								this.func.mode[ 'startup' ] = 'edit';
								
								if( apps )
								{
									this.head( true );
									
									var o = ge( 'StartupInner' ); o.innerHTML = '';
									
									for( var k in apps )
									{
										if( apps[k] && apps[k].Name )
										{
											var found = false; var toggle = false;
											
											if( this.func.appids )
											{
												for( var a in this.func.appids )
												{
													if( this.func.appids[a] && this.func.appids[a][0] == apps[k].Name )
													{
														found = true;
														
														if( this.ids[ apps[k].Name ] )
														{
															toggle = true;
														}
													}
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
																return d;;
															}(),
															 'child' : 
															[ 
																{ 
																	'element' : function() 
																	{
																		var d = document.createElement( 'div' );
																		d.style.backgroundImage = 'url(\'/iconthemes/friendup15/File_Binary.svg\')';
																		d.style.backgroundSize = 'contain';
																		d.style.width = '24px';
																		d.style.height = '24px';
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
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent50 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
																return d;
															}() 
														},
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
																	'element' : function( ids, name ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				ids[ name ] = ( 'launch ' + name );
																				
																				this.classList.remove( 'fa-toggle-off' );
																				this.classList.add( 'fa-toggle-on' );
																			}
																			else
																			{
																				ids[ name ] = false;
																				
																				this.classList.remove( 'fa-toggle-on' );
																				this.classList.add( 'fa-toggle-off' );
																			}
																		};
																		return b;
																	}( this.ids, apps[k].Name ) 
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
								
								switch( this.func.mode[ 'startup' ] )
								{
									
									case 'list':
										
										this.list();
										
										break;
										
									case 'edit':
										
										this.edit();
										
										break;
										
								}
								
							},
							
							sortup : function ( order )
							{
								
								console.log( 'TODO: sortup: ' + order );
								
								console.log( 'change between two ids in sorting ...' );
								
							},
							
							sortdown : function ( order )
							{
								
								console.log( 'TODO: sortdown: ' + order );
								
								console.log( 'change between two ids in sorting ...' );
								
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
								
								var etn = ge( 'StartupEdit' );
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
						
								var btn = ge( 'StartupEditBack' );
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
							
								// Show listed startup ... 
						
								init.list();
								
								break;
								
						}
						
					},
					
					// Theme -------------------------------------------------------------------------------------------
					
					theme : function (  )
					{
						
						if( ge( 'theme_dark_button' ) )
						{
							var b = ge( 'theme_dark_button' );
							b.onclick = function(  )
							{
								
								if( this.classList.contains( 'fa-toggle-off' ) )
								{
									this.classList.remove( 'fa-toggle-off' );
									this.classList.add( 'fa-toggle-on' );
								}
								else
								{
									this.classList.remove( 'fa-toggle-on' );
									this.classList.add( 'fa-toggle-off' );
								}
								
							};
						}
						
						if( ge( 'wallpaper_button_inner' ) )
						{
							var b = ge( 'wallpaper_button_inner' );
							b.onclick = function(  )
							{
								
								/*var d = new Filedialog( 
								{
									triggerFunction: function( item )
									{
										if ( item )
										{
											// Load the image
											var image = new Image();
											image.onload = function()
											{
												console.log( 'loaded image ... ', item );
												// Resizes the image
												var canvas = ge( 'AdminAvatar' );
												var context = canvas.getContext( '2d' );
												context.drawImage( image, 0, 0, 256, 256 );
												
											}
											image.src = getImageUrl( item[ 0 ].Path );
										}
									},
									path: "Mountlist:",
									type: "load",
									title: i18n( 'i18n_fileselectoravatar' ),
									filename: ""
								} );*/
								
								var flags = {
									type: 'load',
									path: 'Home:',
									suffix: [ 'jpg', 'jpeg', 'png', 'gif' ],
									triggerFunction: function( item )
									{
										if( item && item.length && item[ 0 ].Path )
										{
											//refreshSetupWallpaper();
											
											// Load the image
											var image = new Image();
											image.onload = function()
											{
												console.log( 'loaded image ... ', item );
												// Resizes the image
												var canvas = ge( 'AdminWallpaper' );
												var context = canvas.getContext( '2d' );
												context.drawImage( image, 0, 0, 256, 256 );
												
											}
											image.src = getImageUrl( item[ 0 ].Path );
											
										}
									}
								};
								// Execute
								( new Filedialog( flags ) );
								
							};
						}
						
						if( ge( 'AdminWallpaper' ) && ge( 'AdminWallpaperPreview' ) )
						{
							// Set the url to get this wallpaper instead and cache it in the browser ...
							
							if( look )
							{
								// Only update the wallaper if it exists..
								var avSrc = new Image();
								avSrc.src = look;
								avSrc.onload = function()
								{
									var ctx = ge( 'AdminWallpaper' ).getContext( '2d' );
									ctx.drawImage( avSrc, 0, 0, 256, 256 );
								}
							}
							
							function wallpaperdelete()
							{
								var del = document.createElement( 'button' );
								del.className = 'IconButton IconSmall ButtonSmall Negative FloatRight fa-remove';
								del.onclick = function( e )
								{
									Confirm( 'Are you sure?', 'This will delete the wallpaper from this template.', function( r )
									{
										if( r.data == true )
										{
											ge( 'AdminWallpaperPreview' ).innerHTML = '<canvas id="AdminWallpaper" width="256" height="256"></canvas>';
											
											wallpaperdelete();
										}
									} );
								}
								ge( 'AdminWallpaperPreview' ).appendChild( del );
							}
							
							wallpaperdelete();
							
						}
						
					},
					
					// Permissions -------------------------------------------------------------------------------------
					
					permissions : function ( show )
					{
						// Check Permissions
						
						if( !show || show.indexOf( 'application' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
							{
								if( ge( 'AdminApplicationContainer' ) ) ge( 'AdminApplicationContainer' ).className = 'Open';
							}
						}
						
						if( !show || show.indexOf( 'dock' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
							{
								if( ge( 'AdminDockContainer' ) ) ge( 'AdminDockContainer' ).className = 'Open';
							}
						}
						
						if( !show || show.indexOf( 'startup' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
							{
								if( ge( 'AdminStartupContainer' ) ) ge( 'AdminStartupContainer' ).className = 'Open';
							}
						}
						
						if( !show || show.indexOf( 'looknfeel' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_LOOKNFEEL_GLOBAL' ) || Application.checkAppPermission( 'PERM_LOOKNFEEL_WORKGROUP' ) )
							{
								if( ge( 'AdminLooknfeelContainer' ) ) ge( 'AdminLooknfeelContainer' ).className = 'Open';
							}
						}
					}
					
				};
				
				
				
				func.applications();
				func.dock();
				func.startup();
				func.theme();
				func.permissions( show );
				
				
			}
			
			
			// Run onload functions ....
			
			onLoad();
			
			
			
			
			
			
			
			// Responsive framework
			Friend.responsive.pageActive = ge( 'TemplateDetails' );
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
				
				var temp = null;
				
				try
				{
					temp = dat;
				}
				catch( e ) {  }
				
				
				
				var o = ge( 'TemplateList' ); o.innerHTML = '';
				
				
				
				
				// TODO: Find a way to make elements out of a string instead of object, making things more human readable ...
				
				
				var divs = appendChild( [ 
					{ 
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingRight';
							return d;
						}(),
						'child' : 
						[ 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent40 FloatLeft';
									d.innerHTML = '<h3><strong>' + i18n( 'i18n_templates' ) + '</strong></h3>';
									return d;
								}() 
							}, 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent60 FloatLeft Relative';
									return d;
								}(), 
								'child' : 
								[ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'input' );
											d.className = 'FullWidth';
											d.placeholder = 'Search templates...';
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
									d.className = 'HRow BackgroundNegativeAlt Negative PaddingTop PaddingLeft PaddingBottom';
									return d;
								}(),
								'child' : 
								[
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmallRight HContent90 FloatLeft Ellipsis';
											d.innerHTML = '<strong>Name</strong>';
											return d;
										}()
									},
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmall HContent10 TextCenter FloatLeft Ellipsis';
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
													b.onclick = function () { edit(); /*details()*/ };
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
				
				
				
				if( temp )
				{
					
					var list = document.createElement( 'div' );
					list.className = 'List';
					
					for( var k in temp )
					{
						
						if( temp[k] && temp[k].ID && temp[k].Name )
						{
							
							var divs = appendChild( [ 
								{
									'element' : function()
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow';
										d.onclick = function()
										{
											edit( temp[k].ID );
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
												d.innerHTML = '<span class="IconSmall fa-users"></span>';
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent80 FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = temp[k].Name;
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent10 FloatLeft PaddingSmall Ellipsis';
												return d;
											}(),
											'child' : 
											[
												{
													'element' : function()
													{
														var s = document.createElement( 'span' );
														s.className = 'IconSmall FloatRight PaddingSmall fa-minus-circle';
														s.onclick = function ( e ) 
														{ 
															remove( temp[k].ID );
															e.stopPropagation();
															e.preventDefault(); 
														};
														return s;
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
										list.appendChild( divs[i] );
									}
								}
							}
						}
						
					}
					
					o.appendChild( list );
					
				}
				
				
				Friend.responsive.pageActive = ge( 'TemplateList' );
				Friend.responsive.reinit();
				
				
			} );
			
		}
		else
		{
			var o = ge( 'TemplateList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
		}
		
	}
	
};




