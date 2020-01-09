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
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		
		
		
	}
	
	function update( id )
	{
		
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		
		Confirm( i18n( 'i18n_deleting_template' ), i18n( 'i18n_deleting_template_verify' ), function( result )
		{
			
			
		} );
		
	}
	
	
	
	// init --------------------------------------------------------------------------------------------------------- //
	
	function loading()
	{
		
		
		return;
	}
	
	// Show the form
	function initDetails( info )
	{
		
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
											d.onclick = function () {  };
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
											d.innerHTML = '<strong>(+)</strong>';
											d.onclick = function () {  };
											return d;
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
												d.innerHTML = '<span class="IconSmall fa-user"></span>';
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
												d.innerHTML = '';
												return d;
											}()
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




