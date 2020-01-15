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
						
						initDetails( loadingInfo, [  ], true );
						
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
									dat[k].Preview = ( !dat[k].Preview ? '/iconthemes/friendup15/File_Binary.svg' : '/system.library/module/?module=system&command=getapplicationpreview&application=' + dat[k].Name + '&authid=' + Application.authId );
								}
							}
						}
						
						loadingInfo.applications = dat;
						
						initDetails( loadingInfo, [ 'application' ] );
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					} );
					
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
		var apps = ( info.applications ? info.applications : {} );
		
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
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_template_details.html' );
		
		// Add all data for the template
		d.replacements = {
			template_title: ( details.Name ? details.Name : i18n( 'i18n_new_template' ) ),
			template_name: ( details.Name ? details.Name : '' ),
			template_description: '',
			template_language: languages
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'TemplateDetails' ).innerHTML = data;
			
			if( !details.ID )
			{
				ge( 'AdminApplicationContainer' ).style.display = 'none';
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
					
					applications : function (  )
					{
						
						// Editing applications
						
						var init =
						{
							
							ids  : {},
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
													d.className = 'PaddingSmall HContent50 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													return d;
												}() 
											}, 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent40 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
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
													if( this.ids[a] && a == apps[k].Name )
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
																if( apps[k].Preview )
																{
																	d.innerHTML = '<div style="background-image:url(\'' + apps[k].Preview + '\');background-size:contain;width:24px;height:24px;"></div>';
																}
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent40 FloatLeft Ellipsis';
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent40 FloatLeft Ellipsis';
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
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-minus-circle';
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
													if( this.ids[a] && a == apps[k].Name )
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
																if( apps[k].Preview )
																{
																	d.innerHTML = '<div style="background-image:url(\'' + apps[k].Preview + '\');background-size:contain;width:24px;height:24px;"></div>';
																}
																return d;
															}() 
														},
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent40 FloatLeft Ellipsis';
																d.innerHTML = '<strong>' + apps[k].Name + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent40 FloatLeft Ellipsis';
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
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				ids[ name ] = true;
																				
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
								
							}
							
						};
						
						
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
						
						if( soft )
						{
							for( var a in soft )
							{
								if( soft[a] && soft[a][0] )
								{
									init.ids[ soft[a][0] ] = true;
								}
							}
						}
						
						// Show listed applications ... maybe list default ???
						init.list();
						
						
						
						
						return;
						
						
						
						
						
						
							
						
				
					},
					
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
				
				
				
				//o.innerHTML += '<div class="HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingRight">';
				//o.innerHTML += '	<div class="HContent20 FloatLeft">';
				//o.innerHTML += '		<h3><strong>' + i18n( 'i18n_templates' ) + '</strong></h3>';
				//o.innerHTML += '	</div>';
				//o.innerHTML += '	<div class="HContent80 FloatLeft Relative">';
				//o.innerHTML += '		<input type="text" class="FullWidth" placeholder="Search templates...">';
				//o.innerHTML += '	</div>';
				//o.innerHTML += '</div>';
				
				
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




