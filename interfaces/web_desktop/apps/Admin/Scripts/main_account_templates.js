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
	
	function edit( id, _this )
	{
		
		
		
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
		
	}
	
	function update( id )
	{
		
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		console.log( 'remove( '+id+' )' );
			
		Confirm( i18n( 'i18n_deleting_template' ), i18n( 'i18n_deleting_template_verify' ), function( result )
		{
			
			
			
		} );
		
	}
	
	
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading()
	{
		console.log( 'got to edit ...' );
		
		initDetails( false );
		
		return;
		
		var loadingSlot = 0;
		var loadingInfo = {};
		var loadingList = [
			
			// 0 | Load userinfo
			function(  )
			{
				if( ge( 'UserDetails' ) )
				{
					ge( 'UserDetails' ).innerHTML = '';
				}
				
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					
					if( e != 'ok' ) return;
					var userInfo = null;
					try
					{
						userInfo = JSON.parse( d );
					}
					catch( e )
					{
						return;
					}
					console.log( 'userinfoget ', { e:e, d:userInfo } );
					if( e != 'ok' ) userInfo = '404';
					
					// TODO: Run avatar cached here ...
					
					userInfo.avatar = '/system.library/module/?module=system&command=getavatar&userid=' + userInfo.ID + ( userInfo.Image ? '&image=' + userInfo.Image : '' ) + '&width=256&height=256&authid=' + Application.authId;
					
					loadingInfo.userInfo = userInfo;
					
					console.log( '// 0 | Load userinfo' );
					
					initUsersDetails( loadingInfo, [  ], true );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				}
				u.execute( 'userinfoget', { id: extra, mode: 'all', authid: Application.authId } );
			},
			
			// 3 | Get user's workgroups
			function(  )
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					//if( e != 'ok' ) return;
					var wgroups = null;
					try
					{
						wgroups = JSON.parse( d );
					}
					catch( e )
					{
						wgroups = null;
					}
					console.log( 'workgroups ', { e:e, d:d } );
					if( e != 'ok' ) wgroups = '404';
					loadingInfo.workgroups = wgroups;
					
					console.log( '// 3 | Get user\'s workgroups' );
					
					initUsersDetails( loadingInfo, [ 'workgroup' ] );
				}
				u.execute( 'workgroups', { userid: extra, authid: Application.authId } );
				
				// Go to next in line ...
				loadingList[ ++loadingSlot ](  );
			},
			
			// 4 | Get user's roles
			function(  )
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					var uroles = null;
					console.log( { e:e, d:d } );
					if( e == 'ok' )
					{
						try
						{
							uroles = JSON.parse( d );
						}
						catch( e )
						{
							uroles = null;
						}
						loadingInfo.roles = uroles;
					}
					console.log( 'userroleget ', { e:e, d:uroles } );
					if( e != 'ok' ) loadingInfo.roles = '404';
					
					console.log( '// 4 | Get user\'s roles' );
					
					initUsersDetails( loadingInfo, [ 'role' ] );
				}
				u.execute( 'userroleget', { userid: extra, authid: Application.authId } );
				
				// Go to next in line ...
				loadingList[ ++loadingSlot ](  );
			},
			
			// 5 | Get storage
			function(  )
			{

					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
						var rows = null;
						try
						{
							rows = JSON.parse( d );
						}
						catch( e )
						{
							rows = [];
						}

						
						
						
						console.log( '[2] mountlist ', { e:e, d:(rows?rows:d) } );
						if( e != 'ok' ) rows = '404';
						loadingInfo.mountlist = rows;
						
						console.log( '// 5 | Get storage' );
						
						initUsersDetails( loadingInfo, [ 'storage' ] );

						
						
					}
					u.execute( 'mountlist', { userid: extra, authid: Application.authId } );

				
				
				
				// Go to next in line ...
				loadingList[ ++loadingSlot ](  );
			},
			
			// 6 | Get user applications
			function(  )
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					var apps = null;
				
					try
					{
						apps = JSON.parse( d );
					}
					catch( e )
					{
						apps = null;
					}
					console.log( 'listuserapplications ', { e:e, d:apps } );
					if( e != 'ok' ) apps = '404';
					loadingInfo.applications = apps;
					
					console.log( '// 6 | Get user applications' );
					
					initUsersDetails( loadingInfo, [ 'application', 'looknfeel' ] );
				}
				u.execute( 'listuserapplications', { userid: extra, authid: Application.authId } );
				
				// Go to next in line ...
				loadingList[ ++loadingSlot ](  );
			},
			
			// 1 | Load user settings
			function(  )
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					//if( e != 'ok' ) return;
					var settings = null;
					try
					{
						settings = JSON.parse( d );
					}
					catch( e )
					{
						settings = null;
					}
					console.log( 'usersettings ', { e:e, d:settings } );
					if( e != 'ok' ) settings = '404';
					loadingInfo.settings = settings;
					
					console.log( '// 1 | Load user settings' );
					
					initUsersDetails( loadingInfo, [  ] );
					
					// Go to next in line ...
					loadingList[ ++loadingSlot ](  );
				}
				u.execute( 'usersettings', { userid: extra, authid: Application.authId } );
			},
			
			// 2 | Get more user settings
			function(  )
			{
				if( loadingInfo.settings && loadingInfo.settings.Theme )
				{
					var u = new Module( 'system' );
					u.onExecuted = function( e, d )
					{
						//if( e != 'ok' ) return;
						var workspacesettings = null;
					
						try
						{
							workspacesettings = JSON.parse( d );
						}
						catch( e )
						{
							workspacesettings = null;
						}
					
						console.log( 'getsetting ', { e:e, d:workspacesettings } );
					
						if( e != 'ok' ) workspacesettings = '404';
						loadingInfo.workspaceSettings = workspacesettings;
						
						console.log( '// 2 | Get more user setting' );
						
						initUsersDetails( loadingInfo, [  ]/*, true*/ );
					}
					u.execute( 'getsetting', { settings: [ 
						/*'avatar', */'workspacemode', 'wallpaperdoors', 'wallpaperwindows', 'language', 
						'locale', 'menumode', 'startupsequence', 'navigationmode', 'windowlist', 
						'focusmode', 'hiddensystem', 'workspacecount', 
						'scrolldesktopicons', 'wizardrun', 'themedata_' + loadingInfo.settings.Theme,
						'workspacemode'
					], userid: extra, authid: Application.authId } );
				}
				
				// Go to next in line ..., might not need to load the next ...
				loadingList[ ++loadingSlot ](  );
			},
			
			// 7 | init
			function(  )
			{
				console.log( '// 7 | init' );
				
				//initUsersDetails( loadingInfo );
			}
			
		];
		// Runs 0 the first in the array ...
		loadingList[ 0 ]();
		
		return;
	}
	
	// Show the form
	function initDetails( info )
	{
		
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
			languages += '<option value="' + a + '">' + availLangs[ a ] + '</option>';
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_template_details.html' );
		
		// Add all data for the template
		d.replacements = {
			template_title: i18n( 'i18n_new_template' ),
			template_name: '',
			template_description: '',
			template_language: languages
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'TemplateDetails' ).innerHTML = data;
			
			ge( 'AdminApplicationContainer' ).style.display = 'none';
			ge( 'AdminLooknfeelContainer'   ).style.display = 'none';
			
			var bg1  = ge( 'TempSaveBtn' );
			if( bg1 ) bg1.onclick = function( e )
			{
				// Save template ...
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
				
				
				// Move function to helper functions ...
				
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
				
				// TODO: Find a way to make elements out of a string instead of object, making things more human readable ...
				
				
				var divs = appendChild( {
					'1' : 
					{ 
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingTop PaddingRight';
							return d;
						}(),
						'child' : 
						{ 
							'1' : 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent40 FloatLeft';
									d.innerHTML = '<h3><strong>' + i18n( 'i18n_templates' ) + '</strong></h3>';
									return d;
								}() 
							},
							'2' : 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HContent60 FloatLeft Relative';
									return d;
								}(), 
								'child' : 
								{ 
									'1' : 
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
								}
							}
						}
					},
					'2' : 
					{
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'List';
							return d;
						}(),
						'child' : 
						{ 
							'1' : 
							{ 
								'element' : function() 
								{
									var d = document.createElement( 'div' );
									d.className = 'HRow BackgroundNegativeAlt Negative PaddingTop PaddingBottom';
									return d;
								}(),
								'child' : 
								{
									'1' : 
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmallLeft PaddingSmallRight HContent90 FloatLeft Ellipsis';
											d.innerHTML = '<strong>Name</strong>';
											return d;
										}()
									},
									'2' : 
									{
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											d.className = 'PaddingSmall HContent10 TextCenter FloatLeft Ellipsis';
											d.onclick = function () {  };
											return d;
											
										}(),
										'child' : 
										{
											'1' : 
											{
												'element' : function() 
												{
													var b = document.createElement( 'button' );
													b.className = 'IconButton IconSmall ButtonSmall Negative FloatRight fa-plus-circle';
													b.onclick = function () { create(); };
													return b;
												}()
											}
										}
									}
								} 
							}
						}
					}
				} );
				
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
						
						if( temp[k] && temp[k].Name )
						{
							
							var divs = appendChild( {
								'1' : 
								{
									'element' : function()
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow';
										d.onclick = function()
										{
											Sections.accounts_templates( 'details', temp[k].ID );
										};
										return d;
									}(),
									'child' : 
									{
										'1' : 
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'TextCenter HContent10 FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = '<span class="IconSmall fa-users"></span>';
												return d;
											}()
										},
										'2' : 
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent80 FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = temp[k].Name;
												return d;
											}()
										},
										'3' : 
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent10 FloatLeft PaddingSmall Ellipsis';
												return d;
											}(),
											'child' : 
											{
												'1' : 
												{
													'element' : function()
													{
														var s = document.createElement( 'span' );
														s.className = 'IconSmall FloatRight PaddingSmall fa-minus-circle';
														s.onclick = function () { remove( temp[k].ID ); };
														return s;
													}()
												}
											}
										}
									}
								}
							} );
							
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




