/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Section for user role management
Sections.accounts_roles = function( cmd, extra )
{
	if( cmd )
	{
		
		switch( cmd )
		{
			
			case 'refresh':
				
				if( extra && extra.wid )
				{
					edit( extra.wid, extra.rid );
				}
				else
				{
					cancel();
				}
				
				break;
			
			case 'create':
				
				if( extra && extra.wid )
				{
					create( extra.wid, ( extra.callback ? extra.callback : null ) );
				}
				
				return;
		
			case 'update':
				
				if( extra && extra.wid && extra.rid )
				{
					update( extra.wid, extra.rid, ( extra.callback ? extra.callback : null ) );
				}
				
				return;
			
			case 'delete':
				
				if( extra && extra.wid && extra.rid )
				{
					remove( extra.wid, extra.rid, ( extra.callback ? extra.callback : null ) );
				}
				
				return;
			
			case 'edit':
				
				if( extra && extra.wid )
				{
					edit( extra.wid, extra.rid );
				}
				
				return;
		
		}
		
		
		
	}
	
	// Init --------------------------------------------------------------------
	
	function loading( wid, rid )
	{
		
		if( wid && rid )
		{
			if( ge( 'RoleInner' ) )
			{
				var ele = ge( 'RoleInner' ).getElementsByTagName( 'div' );
		
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
			
			if( ge( 'WorkgroupID_' + wid + '_RoleID_' + rid ) )
			{
				ge( 'WorkgroupID_' + wid + '_RoleID_' + rid ).classList.add( 'Selected' );
			}
		}

		var info = { ID: ( rid ? rid : 0 ), GroupID: ( wid ? wid : 0 ) };
		
		// Go through all data gathering until stop
		var loadingSlot = 0;

		var loadingList = [
	
			// Load roleinfo
			function()
			{
				var u = new Module( 'system' );
				u.onExecuted = function( e, d )
				{
					console.log( 'userroleget', { e:e, d:d } );
					info.role = null;
					if( e != 'ok' ) return;
			
					try
					{
						info.role = JSON.parse( d );
					}
					catch( e )
					{
						return;
					}
			
					loadingList[ ++loadingSlot ]( info );
				}
				u.execute( 'userroleget', { id: rid, authid: Application.authId } );
			},
	
			// Load system permissions
			function()
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					console.log( 'getsystempermissions', { e:e, d:d } );
					info.permission = null;
					if( e != 'ok' ) return;
			
					try
					{
						info.permission = JSON.parse( d );
					}
					catch( e ) 
					{
						return;
					}
					loadingList[ ++loadingSlot ]( info );
				}
				m.execute( 'getsystempermissions', { authid: Application.authId } );
			},
	
			// 1 | Load applications
	
			function(  )
			{
		
				applications( function ( res, dat )
				{
		
					if( ShowLog ) console.log( { e:res, d:dat } );
			
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
			
					info.applications = dat;
			
					// Go to next in line ...
					loadingList[ ++loadingSlot ]( info );
			
				} );
		
			},
	
			// Load workgroups
	
			function(  )
			{
		
				// Specific for Pawel's code ... He just wants to forward json ...
		
				var args = JSON.stringify( {
					'type'    : 'read', 
					'context' : 'application', 
					'authid'  : Application.authId, 
					'data'    : { 
						'permission' : 'WORKGROUP_READ'
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
		
					if( ShowLog || 1==1 ) console.log( 'workgroups ', { e:e , d:(wgroups?wgroups:d), args: args } );
		
					if( wgroups.groups )
					{
						workgroups = wgroups.groups;
					}
					else if( wgroups.data && wgroups.data.details && wgroups.data.details.groups )
					{
						workgroups = wgroups.data.details.groups;
					}
			
					info.workgroups = null;
			
					if( wgroups && workgroups )
					{
						var out = [];
			
						for( var a in workgroups )
						{
							if( workgroups[a] && workgroups[a].ID )
							{
								out.push( { 
									ID       : workgroups[a].ID, 
									UUID     : workgroups[a].uuid, 
									Name     : workgroups[a].name, 
									ParentID : workgroups[a].parentid, 
									Status   : workgroups[a].status 
								} );
							}
						}
				
						info.workgroups = out;
					}
			
					loadingList[ ++loadingSlot ]( info );
			
				}
		
				f.execute( 'group/list', { parentid: 0, authid: Application.authId, args: args } );
		
			},
	
			// Then, finally, show role details
			function( info )
			{
				if( typeof info.role == 'undefined' && typeof info.permission == 'undefined' && typeof info.workgroups == 'undefined' ) return;
		
				initRoleDetails( info );
			}
	
		];

		loadingList[ 0 ]();
	
	}
	
	// Read --------------------------------------------------------------------
	
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
	
	function workgroups( callback )
	{
		
		if( callback )
		{
			// Specific for Pawel's code ... He just wants to forward json ...
			
			var args = JSON.stringify( {
				'type'    : 'read', 
				'context' : 'application', 
				'authid'  : Application.authId, 
				'data'    : { 
					'permission' : 'WORKGROUP_READ'
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
				
				if( wgroups.groups )
				{
					workgroups = wgroups.groups;
				}
				else if( wgroups.data && wgroups.data.details && wgroups.data.details.groups )
				{
					workgroups = wgroups.data.details.groups;
				}
				
				if( wgroups && workgroups )
				{
					var out = {
						0 : { 
							ID       : '-1', 
							UUID     : '-1', 
							Name     : 'System', 
							ParentID : 0, 
							Status   : 0 
						}
					};
					
					for( var a in workgroups )
					{
						if( workgroups[a] && workgroups[a].ID )
						{
							out[ workgroups[a].ID ] = ( { 
								ID       : workgroups[a].ID, 
								UUID     : workgroups[a].uuid, 
								Name     : workgroups[a].name, 
								ParentID : workgroups[a].parentid, 
								Status   : workgroups[a].status 
							} );
						}
					}
					
					if( callback ) return callback( out );
				}
				
				if( callback ) return callback( {} );
				
				
			}
			
			f.execute( 'group/list', { parentid: 0, authid: Application.authId, args: args } );
			
			return true;
		}
		
		return false;
		
	}
	
	function roles( workgroups, callback )
	{
		
		if( callback )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				
				var roles = [];
				
				try
				{
					roles = JSON.parse( d );
				}
				catch( e ) {  }
				
				if( roles && workgroups )
				{
					for( var a in roles )
					{
						if( roles[a] )
						{
							if( roles[a].WorkgroupID > 0 && workgroups[ roles[a].WorkgroupID ] )
							{
								if( !workgroups[ roles[a].WorkgroupID ].roles )
								{
									workgroups[ roles[a].WorkgroupID ].roles = [];
								}
							
								workgroups[ roles[a].WorkgroupID ].roles.push( roles[a] );
							}
							else if( workgroups[ 0 ] )
							{
								if( !workgroups[ 0 ].roles )
								{
									workgroups[ 0 ].roles = [];
								}
								
								workgroups[ 0 ].roles.push( roles[a] );
							}
						}
					}
				}
				
				if( callback ) return callback( roles, workgroups );
				
			}
			m.execute( 'userroleget', { mode: 'all', authid: Application.authId } );
			
			return true;
			
		}
		
		return false;
		
	}
	
	function edit( wid, rid )
	{
		
		loading( wid, rid );
		
	}
	
	function cancel(  )
	{
		
		if( ge( 'RoleDetails' ) )
		{
			ge( 'RoleDetails' ).innerHTML = '';
		}
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create( wid, callback )
	{
		
		if( wid )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				var data = null;
				
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) 
				{
					
				}
				
				if( callback )
				{
					return callback( ( e && e == 'ok' ? true : false ), data );
				}
			
			}
			m.execute( 'userroleadd', { 
				name        : ( ge( 'RoleName' ) ? ge( 'RoleName' ).value : 'Unnamed role' ), 
				description : ( ge( 'RoleDescription' ).value ? ge( 'RoleDescription' ).value : '' ),
				authid      : Application.authId 
			} );
			
		}
		
	}
	
	function update( wid, rid, callback )
	{
		
		if( wid && rid )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				var data = null;
				
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) 
				{
					
				}
				
				if( callback )
				{
					return callback( ( e && e == 'ok' ? true : false ), data );
				}
				
			}
			m.execute( 'userroleupdate', { 
				id          : rid, 
				name        : ge( 'RoleName' ).value, 
				description : ge( 'RoleDescription' ).value, 
				authid      : Application.authId 
			} );
			
		}
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( wid, rid, callback )
	{
				
		if( wid && rid )
		{
			
			// TODO: Look at implications for role with same id on different workgroups and users ...
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				var data = null;
				
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) 
				{
					
				}
				
				if( callback )
				{
					return callback( ( e && e == 'ok' ? true : false ), data );
				}
				
			}
			m.execute( 'userroledelete', { 
				id     : rid,
				authid : Application.authId 
			} );
			
		}
		
	}
	
	// helper functions --------------------------------------------------------------------------------------------- //
	
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
			_this.classList.remove( 'Negative' );
			_this.classList.add( 'Button' );
			_this.classList.add( 'BackgroundRed' );
			_this.id = 'EditMode';
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
						
						if( ge( 'RoleDeleteBtn' ) && ge( 'RoleDeleteBtn' ).savedState )
						{
							
							if( typeof ge( 'RoleDeleteBtn' ).savedState.className != 'undefined' )
							{
								ge( 'RoleDeleteBtn' ).className = ge( 'RoleDeleteBtn' ).savedState.className;
							}
							if( typeof ge( 'RoleDeleteBtn' ).savedState.innerHTML != 'undefined' )
							{
								ge( 'RoleDeleteBtn' ).innerHTML = ge( 'RoleDeleteBtn' ).savedState.innerHTML;
							}
							if( typeof ge( 'RoleDeleteBtn' ).savedState.onclick != 'undefined' )
							{
								ge( 'RoleDeleteBtn' ).onclick = ge( 'RoleDeleteBtn' ).savedState.onclick;
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
				
				if( ge( 'RoleDeleteBtn' ) && ge( 'RoleDeleteBtn' ).savedState )
				{
				
					if( act.targ.id != 'RoleDeleteBtn' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
					{
						
						if( typeof ge( 'RoleDeleteBtn' ).savedState.className != 'undefined' )
						{
							ge( 'RoleDeleteBtn' ).className = ge( 'RoleDeleteBtn' ).savedState.className;
						}
						if( typeof ge( 'RoleDeleteBtn' ).savedState.innerHTML != 'undefined' )
						{
							ge( 'RoleDeleteBtn' ).innerHTML = ge( 'RoleDeleteBtn' ).savedState.innerHTML;
						}
						if( typeof ge( 'RoleDeleteBtn' ).savedState.onclick != 'undefined' )
						{
							ge( 'RoleDeleteBtn' ).onclick = ge( 'RoleDeleteBtn' ).savedState.onclick;
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
	
	// Get the user list -------------------------------------------------------
		
	if( Application.checkAppPermission( 'ROLE_READ' ) )
	{
		
		workgroups( function ( groups )
		{
			
			roles( groups, function ( roles, wgroups )
			{
				
				console.log( [ roles, wgroups ] );
				
				var o = ge( 'RoleList' ); if( o ) o.innerHTML = '';
				
				var divs = appendChild( [ 
					{
						'element' : function() 
						{
							var d = document.createElement( 'div' );
							d.className = 'OverflowHidden BorderRadius Elevated';
							d.id = 'AdminRoleContainer';
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
													b.id = 'RoleEditBack';
													b.className = 'IconButton IconMedium ButtonSmall Negative FloatLeft fa-arrow-circle-left Closed';
													return b;
												}()
											},
											{
												'element' : function(  ) 
												{
													var h = document.createElement( 'h3' );
													h.className = 'NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft';
													h.innerHTML = '<strong>' + i18n( 'i18n_roles' ) + ' </strong><span id="AdminRoleCount">(' + ( roles ? roles.length : '0' ) + ')</span>';
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
													b.id = 'RoleSearchCancelBtn';
													b.className = 'IconButton IconSmall ButtonSmall fa-times-circle Closed';
													b.style = 'position:absolute;right:0;margin-top:-2px;';
													b.onclick = function(  )
													{
														searchroles( false );
														var inp = ge( 'AdminRoleContainer' ).getElementsByTagName( 'input' )[0];
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
														searchroles( this.value );
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
										}()/*,
										'child' : 
										[ 
											{
												'element' : function(  ) 
												{
													if( Application.checkAppPermission( 'ROLE_CREATE' ) )
													{
														var b = document.createElement( 'button' );
														b.className = 'IconButton IconMedium ButtonSmall Negative FloatRight fa-plus-circle Open';
														b.onclick = function()
														{
															edit(  );
														};
														return b;
													}
												}()
											}
										]*/
									}
								]
							},
							{
								'element' : function(  ) 
								{
									var d = document.createElement( 'div' );
									d.className = 'List';
									d.id = 'RoleGui';
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
														sortroles( 'Name' );
													};
													return d;
												}(  ) 
											}, 
											{ 
												'element' : function(  ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong></strong>';
													return d;
												}()
											},
											{ 
												'element' : function(  ) 
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
											d.className = 'List HRow PaddingTop PaddingBottom';
											d.id = 'RoleInner';
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
						if( divs[i] )
						{
							o.appendChild( divs[i] );
						}
					}
				}
			
				var list = ge( 'RoleInner' ); if( list ) list.innerHTML = '';
			
				if( wgroups )
				{
				
					// TODO: List workgroups ParentID = 0 and then the roles below ...
				
					for( var k in wgroups )
					{
					
						if( wgroups[k] && wgroups[k].ID && wgroups[k].Name )
						{
							
							// Workgroup -------------------------------------------------------------------------------
							
							var divs = appendChild( [ 
								{
									'element' : function()
									{
										var d = document.createElement( 'div' );
										d.className = 'HRow';
										d.id = 'WorkgroupID_' + wgroups[k].ID;
										return d;
									}(),
									'child' : 
									[
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = '<span name="' + wgroups[k].Name + '" class="IconMedium fa-users"></span>';
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent80 InputHeight FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = wgroups[k].Name;
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent10 FloatLeft PaddingRight';
												return d;
											}(),
											'child' : 
											[ 
												{
													'element' : function(  ) 
													{
														if( Application.checkAppPermission( 'ROLE_CREATE' ) )
														{
															var b = document.createElement( 'button' );
															b.className = 'IconButton IconMedium ButtonSmall FloatRight fa-plus-circle Open';
															b.groupid = wgroups[k].ID;
															b.onclick = function()
															{
																edit( this.groupid );
															};
															return b;
														}
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
							
							// Roles -----------------------------------------------------------------------------------
							
							if( wgroups[k].roles )
							{
								
								var roles = wgroups[k].roles;
								
								for( var a in roles )
								{
									
									if( roles[a] && roles[a].ID && roles[a].Name )
									{
										
										var divs2 = appendChild( [ 
											{
												'element' : function()
												{
													var d = document.createElement( 'div' );
													d.className = 'HRow' + ( extra && extra.wid == wgroups[k].ID && extra.rid == roles[a].ID ? ' Selected' : '' );
													d.id = 'WorkgroupID_' + wgroups[k].ID + '_RoleID_' + roles[a].ID;
													d.roleid = roles[a].ID;
													d.groupid = wgroups[k].ID;
													
													if( Application.checkAppPermission( 'ROLE_READ' ) )
													{
														d.onclick = function()
														{
															edit( this.groupid, this.roleid );
														};
													}
									
													return d;
												}(),
												'child' : 
												[
													{
														'element' : function()
														{
															var d = document.createElement( 'div' );
															d.className = 'TextCenter HContent4 InputHeight FloatLeft PaddingSmall';
															d.style.minWidth = '36px';
															return d;
														}()
													},
													{
														'element' : function()
														{
															var d = document.createElement( 'div' );
															d.className = 'TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis';
															d.innerHTML = '<span name="' + roles[a].Name + '" class="IconMedium fa-user-circle-o"></span>';
															return d;
														}()
													},
													{
														'element' : function()
														{
															var d = document.createElement( 'div' );
															d.className = 'InputHeight FloatLeft PaddingSmall Ellipsis';
															d.innerHTML = roles[a].Name;
															return d;
														}()
													},
													{
														'element' : function()
														{
															var d = document.createElement( 'div' );
															d.className = 'HContent10 InputHeight FloatRight PaddingSmall';
															return d;
														}()
													}
												]
											}
								
										] );
										
										if( divs2 )
										{
											for( var i in divs2 )
											{
												if( divs2[i] )
												{
													list.appendChild( divs2[i] );
												}
											}
										}
									
									}
									
								}
								
							}
							
						}
					
					}
				
				}
			
				// Search ...............
			
				var searchroles = function ( filter, server )
				{
				
					if( ge( 'RoleInner' ) )
					{
						var list = ge( 'RoleInner' ).getElementsByTagName( 'div' );
					
						if( list.length > 0 )
						{
							for( var a = 0; a < list.length; a++ )
							{
								if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
							
								var span = list[a].getElementsByTagName( 'span' )[0];
							
								if( span )
								{
								
									if( !filter || filter == '' 
									|| span && span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
									)
									{
										list[a].style.display = '';
									
										if( list[a].parentNode && list[a].parentNode.parentNode && list[a].parentNode.parentNode.className.indexOf( 'HRow' ) >= 0 )
										{
											list[a].style.display = '';
											list[a].parentNode.style.display = '';
										}
									}
									else if( list[a] && list[a].className )
									{
										list[a].style.display = 'none';
									}
								}
							}

						}
					
						if( ge( 'RoleSearchCancelBtn' ) )
						{
							if( !filter && ( ge( 'RoleSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RoleSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'RoleSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'RoleSearchCancelBtn' ).classList.add( 'Closed' );
							
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
						
							else if( filter != '' && ( ge( 'RoleSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'RoleSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'RoleSearchCancelBtn' ).classList.remove( 'Closed' );
								ge( 'RoleSearchCancelBtn' ).classList.add( 'Open' );
							}
						}
					}
				
				};
			
				// Sort .............
			
				var sortroles = function ( sortby, orderby )
				{
				
					//
				
					var _this = ge( 'RoleInner' );
				
					if( _this )
					{
						orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
					
						var list = _this.getElementsByTagName( 'div' )[0].getElementsByTagName( 'div' );
					
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
									// TODO: Fix this ...
								
									//console.log( list[a] );
								
									if( !list[a].className )
									{
										var obj = { 
											sortby  : span.getAttribute( sortby.toLowerCase() ).toLowerCase(), 
											content : list[a]
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
			
				sortroles( 'Name', 'ASC' );
			
				Friend.responsive.pageActive = ge( 'RoleList' );
				Friend.responsive.reinit();
			
			} );
			
		} );
		
		
		
	}
	else
	{
		var o = ge( 'RoleList' );
		o.innerHTML = '';
		
		var h2 = document.createElement( 'h2' );
		h2.innerHTML = '{i18n_permission_denied}';
		o.appendChild( h2 );
	}
	
};



Sections.role_edit = function( id, _this )
{
	
	var pnt = _this.parentNode;
	
	var edit = pnt.innerHTML;
	
	var buttons = [ 
		{ 'name' : 'Save',   'icon' : '', 'func' : function()
			{ 
				Sections.userroleupdate( id, ge( 'RoleName' ).value ) 
			} 
		}, 
		{ 'name' : 'Delete', 'icon' : '', 'func' : function()
			{ 
				Sections.userroledelete( id ) 
			} 
		}, 
		{ 'name' : 'Cancel', 'icon' : '', 'func' : function()
			{ 
				pnt.innerHTML = edit 
			} 
		}
	];
	
	pnt.innerHTML = '';
	
	for( var i in buttons )
	{
		if( ( i == 0 && !Application.checkAppPermission( 'ROLE_UPDATE' ) ) || ( i == 1 && !Application.checkAppPermission( 'ROLE_DELETE' ) ) )
		{
			continue;
		}
		
		var b = document.createElement( 'button' );
		b.className = 'IconSmall FloatRight';
		b.innerHTML = buttons[i].name;
		b.onclick = buttons[i].func;
		
		pnt.appendChild( b );
	}
	
}



Sections.userroleadd = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			// refresh
			Sections.accounts_roles();
		}
		m.execute( 'userroleadd', { name: input, authid: Application.authId } );
	}
};

Sections.userroledelete = function( rid )
{
	if( rid )
	{
		Confirm( i18n( 'i18n_deleting_role' ), i18n( 'i18n_deleting_role_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				var m = new Module( 'system' );
				m.onExecuted = function( e, d )
				{
					console.log( { e:e, d:d, args: { id: rid, authid: Application.authId } } );
			
					ge( 'RoleDetails' ).innerHTML = '';
			
					// refresh
					Sections.accounts_roles();
				}
				m.execute( 'userroledelete', { id: rid, authid: Application.authId } );
			}
		} );
	}
};

Sections.userroleupdate = function( rid, input, perms, refresh )
{
	if( rid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
			
			if( refresh == null || typeof refresh == 'undefined' )
			{
				// refresh
				Sections.accounts_roles();
			}
			
			// refresh details also ...
			if( refresh )
			{
				Sections.accounts_roles( 'edit', rid );
			}
		}
		m.execute( 'userroleupdate', { id: rid, name: ( input ? input : null ), permissions: ( perms ? perms : null ), authid: Application.authId } );
	}
};

Sections.workgrouproleupdate = function( rid, wid, activate, callback )
{
	var data = ( activate ? 'Activated' : '' );
	
	if( rid && wid )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( ShowLog ) console.log( { e:e, d:d } );
			
			if( callback )
			{
				callback( e, d );
			}
		}
		m.execute( 'userroleupdate', { id: rid, groupid: wid, data: data, authid: Application.authId } );
	}
}

Sections.removepermission = function( rid, pem, key, data, _this )
{
	if( rid && pem && key && _this )
	{
		var perms = [ { command: 'delete', name: pem, key: key, data: data } ];
		
		Confirm( i18n( 'i18n_deleting_permission' ), i18n( 'i18n_deleting_permission_verify' ), function( result )
		{
			// Confirmed!
			if( result && result.data && result.data == true )
			{
				Sections.userroleupdate( rid, null, perms, true );
			}
			
		} );
	}
};

Sections.addpermission = function( rid, key, _this )
{
	var pem  = ge( 'RolePermissionList_' + key ).value;
	
	if( ge( 'RoleParameterInput_' + key ) && ge( 'RoleParameterInput_' + key ).style.display != 'none' )
	{
		var data = ge( 'RoleParameterInput_' + key ).value;
	}
	else
	{
		var data = ge( 'RoleWorkgroupList_' + key ).value;
	}
	
	if( rid && key && pem && _this )
	{
		var perms = [ { name: pem, key: key, data: data } ];
		
		Sections.userroleupdate( rid, null, perms, true );
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

// TODO: Add to workgroup if is defined ...

Sections.togglepermission = function( rid, pem, key, _this, command )
{
	//if( _this )
	//{
	//	Toggle( _this, function( on )
	//	{
	//		data = ( on ? 'Activated' : '' );
	//	} );
	//}
	//console.log( [ rid, pem, key, _this, _this.checked ] );
	if( rid && pem && key )
	{
		if( command == 'delete' || ( _this && !_this.checked ) )
		{
			var perms = [ { command: 'delete', name: pem, key: key } ];
		}
		else
		{
			var perms = [ { name: pem, key: key } ];
		}
		
		console.log( 'Sections.togglepermission', { rid: rid, perms: perms, _this: _this } );
		
		Sections.userroleupdate( rid, null, perms, false );
	}
};

Sections.checkpermission = function( input )
{
	if( input )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( { e:e, d:d } );
		}
		m.execute( 'checkpermission', { permission: input, authid: Application.authId } );
	}
};



