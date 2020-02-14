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
	
	function refresh( id, _this )
	{
		
		initMain();
		
		if( id )
		{
			edit( id, _this );
		}
		
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
	
	function cancel()
	{
		
		console.log( 'cancel(  ) ' );

		if( ge( 'TemplateDetails' ) )
		{
			ge( 'TemplateDetails' ).innerHTML = '';
		}
		
		if( ge( 'TemplateList' ) )
		{
			var ele = ge( 'TemplateList' ).getElementsByTagName( 'div' );
			
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
			
			var data = {};
			
			try
			{
				data = JSON.parse( d );
			}
			catch( e ) {  }
			
			console.log( { e:e, d:(data?data:d) } );
			
			if( e == 'ok' && d )
			{
				
				if( data && data.message )
				{
					Notify( { title: 'success', text: data.message } );
				}
				
				refresh( d );
				
			}
			else if( data && data.response )
			{
				Notify( { title: i18n( 'i18n_template_create' ), text: i18n( 'i18n_' + data.response ) } );
				
				if( ge( 'TempName' ) )
				{
					ge( 'TempName' ).focus();
				}
			}
			else
			{
				
				if( data && data.message )
				{
					Notify( { title: 'failed', text: data.message } );
				}
				
			}
		}
		m.execute( 'usersetupadd', { 
			Name        : ( ge( 'TempName'        ) ? ge( 'TempName'        ).value : 'Default' ), 
			Description : ( ge( 'TempDescription' ) ? ge( 'TempDescription' ).value : ''        ),
			Languages   : ( ge( 'TempLanguages'   ) ? ge( 'TempLanguages'   ).value : 'en'      ),
			authid      : Application.authId 
		} );
		
	}
	
	function update( id )
	{
		
		console.log( 'update( '+id+' )' );
		
		if ( id )
		{
			// Setup input values
						
			var args = { id: id, Preinstall: true, Themes: 'Friendup12', authid: Application.authId };
			
			var vals = [ 'Name', 'Description', 'Languages'/*, 'Applications', 'Startup'*/ ];
			
			for( var i in vals )
			{
				if( vals[i] && ge( 'Temp' + vals[i] ) )
				{
					args[ vals[i] ] = ge( 'Temp' + vals[i] ).value;
				}
			}
			
			/*// Look And Feel settings ...
			
			args[ 'ThemeConfig' ] = { colorSchemeText: ge( 'theme_dark_button' ).value, buttonSchemeText: ge( 'theme_style_select' ).value };
			
			args[ 'WorkspaceCount' ] = ge( 'workspace_count_input' ).value;*/
			
			console.log( args );
			
			
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				
				var data = {};
											
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) {  }
				
				console.log( { e:e, d:(data?data:d) } );
				
				if( e == 'ok' )
				{
					
					if( data && data.message )
					{
						Notify( { title: 'success', text: data.message } );
					}
					
					/*// Wallpaper settings if we have a new wallpaper ...
					
					if( ge( 'wallpaper_button_inner' ) && ge( 'wallpaper_button_inner' ).value )
					{
							
						var m = new Module( 'system' );
						m.onExecuted = function( ee, dd )
						{
							console.log( { e:ee, d:dd } );
							
							var dat = false;
														
							try
							{
								dat = JSON.parse( dd );
							}
							catch( e ) {  }
							
							if( ee == 'ok' )
							{
							
								if( dat && dat.message )
								{
									Notify( { title: 'success', text: dat.message } );
								}
							
							}
							else
							{
								
								if( dat && dat.message )
								{
									Notify( { title: 'failed', text: dat.message } );
								}
								
							}
						}
						m.execute( 'usersetupwallpaperset', { 
							setupId : id, 
							path    : ge( 'wallpaper_button_inner' ).value, 
							authid  : Application.authId 
						} );
						
					}*/
					
					editMode( true );
					
				}
				else if( data && data.response )
				{
					Notify( { title: i18n( 'i18n_template_update' ), text: i18n( 'i18n_' + data.response ) } );
					
					if( ge( 'TempName' ) )
					{
						ge( 'TempName' ).focus();
					}
				}
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: 'failed', text: data.message } );
					}
					
				}
				
			}
			m.execute( 'usersetupsave', args );
		}
		
	}
		
	function updateApplications( tid, callback, vars )
	{
		
		if( tid && ge( 'TempApplications' ) && ge( 'TempStartup' ) )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				var data = false;
													
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) {  }
				
				if( e == 'ok' )
				{
					
					if( data && data.message )
					{
						//Notify( { title: 'success', text: data.message } );
					}
					
					if( callback ) callback( true, data, vars );
					
				}
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: 'failed', text: data.message } );
					}
					
					if( callback ) callback( false, data, vars );
					
				}
				
			}
			m.execute( 'usersetupsave', { 
				id           : tid, 
				Preinstall   : true, 
				Themes       : 'Friendup12', 
				Applications : ge( 'TempApplications' ).value, 
				Startup      : ge( 'TempStartup' ).value, 
				authid       : Application.authId 
			} );
			
		}
		else
		{
			
			if( callback ) callback( false, false, vars );
			
		}
		
	}
	
	function updateLookAndFeel( tid, callback, vars )
	{
		
		if( tid && ge( 'theme_dark_button' ) && ge( 'theme_style_select' ) && ge( 'workspace_count_input' ) )
		{
			// Look And Feel settings ...
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				console.log( { e:e, d:d } );
				
				var data = false;
													
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) {  }
				
				if( e == 'ok' )
				{
					
					if( data && data.message )
					{
						//Notify( { title: 'success', text: data.message } );
					}
					
					if( callback ) callback( true, data, vars );
					
				}
				else
				{
					
					if( data && data.message )
					{
						Notify( { title: 'failed', text: data.message } );
					}
					
					if( callback ) callback( false, data, vars );
					
				}
				
			}
			m.execute( 'usersetupsave', { 
				id             : tid, 
				Preinstall     : true, 
				Themes         : 'Friendup12', 
				ThemeConfig    : { colorSchemeText: ge( 'theme_dark_button' ).value, buttonSchemeText: ge( 'theme_style_select' ).value }, 
				WorkspaceCount : ge( 'workspace_count_input' ).value, 
				authid         : Application.authId 
			} );
			
		}
		else
		{
			
			if( callback ) callback( false, false, vars );
			
		}
		
	}
	
	function updateWallpaper( tid, callback, vars )
	{
		
		// Wallpaper settings if we have a new wallpaper ...
		
		if( tid && ge( 'wallpaper_button_inner' ) && ge( 'wallpaper_button_inner' ).value )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( ee, dd )
			{
				console.log( { e:ee, d:dd } );
				
				var dat = false;
									
				try
				{
					dat = JSON.parse( dd );
				}
				catch( e ) {  }
				
				if( ee == 'ok' )
				{
				
					if( dat && dat.message )
					{
						Notify( { title: 'success', text: dat.message } );
					}
					
					if( callback ) callback( true, dat, vars );
					
				}
				else
				{
					
					if( dat && dat.message )
					{
						Notify( { title: 'failed', text: dat.message } );
					}
					
					if( callback ) callback( false, dat, vars );
					
				}
			}
			m.execute( 'usersetupwallpaperset', { 
				setupId : tid, 
				path    : ge( 'wallpaper_button_inner' ).value, 
				authid  : Application.authId 
			} );
			
		}
		else
		{
			
			if( callback ) callback( false, false, vars );
			
		}
		
	}
	
	// delete ------------------------------------------------------------------------------------------------------- //
	
	function remove( id )
	{
		if( id )
		{
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				
				console.log( { e:e, d:d } );
				
				var mm = new Module( 'system' );
				mm.onExecuted = function( ee, dd )
				{
					
					var data = false;
													
					try
					{
						data = JSON.parse( dd );
					}
					catch( e ) {  }
					
					if( ee == 'ok' )
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
					
				}
				mm.execute( 'usersetupdelete', { id: id, authid: Application.authId } );
				
			}
			m.execute( 'usersetupwallpaperdelete', { setupId: id, authid: Application.authId } );
			
		}
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
		
		//Confirm( i18n( 'i18n_deleting_template' ), i18n( 'i18n_deleting_template_verify' ), function( result )
		//{
			
			
			
		//} );
	}
	
	function editMode( close )
	{
		console.log( 'editMode() ', ge( 'TempEditButtons' ) );
		
		if( ge( 'TempEditButtons' ) )
		{
			ge( 'TempEditButtons' ).className = ( close ? 'Closed' : 'Open' );
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
	
	function sortApps( sortby )
	{
		
		//
		
		var _this = ge( 'ApplicationInner' );
		
		if( _this )
		{
			var orderby = ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' );
			
			var list = _this.getElementsByTagName( 'div' );
			
			if( list.length > 0 )
			{
				var output = [];
				
				var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
				
				for( var a = 0; a < list.length; a++ )
				{
					if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
					
					var span = list[a].getElementsByTagName( 'span' )[0];
					
					if( span && span.getAttribute( sortby.toLowerCase() ) )
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
		
		console.log( output );
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
					
						if( ge( 'TempDeleteBtn' ) && ge( 'TempDeleteBtn' ).savedState )
						{
							
							if( typeof ge( 'TempDeleteBtn' ).savedState.className != 'undefined' )
							{
								ge( 'TempDeleteBtn' ).className = ge( 'TempDeleteBtn' ).savedState.className;
							}
							if( typeof ge( 'TempDeleteBtn' ).savedState.innerHTML != 'undefined' )
							{
								ge( 'TempDeleteBtn' ).innerHTML = ge( 'TempDeleteBtn' ).savedState.innerHTML;
							}
							if( typeof ge( 'TempDeleteBtn' ).savedState.onclick != 'undefined' )
							{
								ge( 'TempDeleteBtn' ).onclick = ge( 'TempDeleteBtn' ).savedState.onclick;
							}
							
						}
						
						closeEdit();
						
						break;
					default: break;
				}
				
			}
			
			if( act.targ )
			{
			
				if( ge( 'TempDeleteBtn' ) && ge( 'TempDeleteBtn' ).savedState )
				{
				
					if( act.targ.id != 'TempDeleteBtn' && act.targ.tagName != 'HTML' && act.targ.tagName != 'BODY' )
					{
						
						if( typeof ge( 'TempDeleteBtn' ).savedState.className != 'undefined' )
						{
							ge( 'TempDeleteBtn' ).className = ge( 'TempDeleteBtn' ).savedState.className;
						}
						if( typeof ge( 'TempDeleteBtn' ).savedState.innerHTML != 'undefined' )
						{
							ge( 'TempDeleteBtn' ).innerHTML = ge( 'TempDeleteBtn' ).savedState.innerHTML;
						}
						if( typeof ge( 'TempDeleteBtn' ).savedState.onclick != 'undefined' )
						{
							ge( 'TempDeleteBtn' ).onclick = ge( 'TempDeleteBtn' ).savedState.onclick;
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
						
						// Go to next in line ...
						loadingList[ ++loadingSlot ](  );
						
					}, id );
					
				},
				
				//  | init
				function(  )
				{
					console.log( '//  | init' );
					
					initDetails( loadingInfo, [ 'application', 'dock', 'startup', 'looknfeel', true ] );
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
		
		var data = ( details.Data  ? details.Data  : {} );
		var soft = ( data.software ? data.software : {} );
		var star = ( data.startups ? data.startups : {} );
		
		var themeData      = ( data.themeconfig    ? data.themeconfig    : {} );
		var workspacecount = ( data.workspacecount ? data.workspacecount : {} );
		
		var apps = ( info.applications ? info.applications : {} );
		var look = ( info.looknfeel    ? info.looknfeel    : {} );
		
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
				
				return '<button class="IconButton IconSmall IconToggle ButtonSmall fa-toggle-' + ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? 'on' : 'off' ) + '" id="theme_dark_button" value="' + ( themeData.colorSchemeText ? themeData.colorSchemeText : 'light' ) + '"></button>';
				
			},
			
			controls : function ()
			{
				
				var opt = { 'mac' : 'Mac style', 'windows' : 'Windows style' };
					
				var str = '<select class="InputHeight FullWidth" id="theme_style_select">';
				
				for( var k in opt )
				{
					str += '<option value="' + k + '"' + ( themeData.buttonSchemeText == k ? ' selected="selected"' : '' ) + '>' + opt[k] + '</option>';
				}
				
				str += '</select>';
				
				return str;
				
			},
			
			workspace_count : function ()
			{
				
				return '<input type="number" class="FullWidth" id="workspace_count_input" value="' + ( workspacecount > 0 ? workspacecount : '1' ) + '">';
				
			},
			
			wallpaper_button : function ()
			{
				// TODO: Fix first login first so we can set wallpapers on users not logged in yet.
				//return '<button class="ButtonAlt IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>';
				return '<button class="Button IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>';
				
			},
			
			wallpaper_preview : function ()
			{
				
			}
			
		}
		
		// Get the user details template
		var d = new File( 'Progdir:Templates/account_template_details.html' );
		
		// Add all data for the template
		d.replacements = {
			template_title: ( details.Name ? details.Name : i18n( 'i18n_new_template' ) ),
			template_name: ( details.Name ? details.Name : '' ),
			template_description: ( details.Description ? details.Description : '' ),
			template_language: languages,
			
			theme_dark: theme.dark(),
			theme_controls: theme.controls(),
			workspace_count: theme.workspace_count(),
			wallpaper_button: theme.wallpaper_button()
		};
		
		// Add translations
		d.i18n();
		d.onLoad = function( data )
		{
			ge( 'TemplateDetails' ).innerHTML = data;
			
			if( !details.ID )
			{
				ge( 'TempDeleteBtn' ).style.display = 'none';
				
				ge( 'AdminApplicationContainer' ).style.display = 'none';
				ge( 'AdminDockContainer'        ).style.display = 'none';
				ge( 'AdminStartupContainer'     ).style.display = 'none';
				ge( 'AdminLooknfeelContainer'   ).style.display = 'none';
			}
			else
			{
				ge( 'TempEditButtons' ).className = 'Closed';
				
				if( ge( 'TempBasicDetails' ) )
				{
					var inps = ge( 'TempBasicDetails' ).getElementsByTagName( '*' );
					if( inps.length > 0 )
					{
						for( var a = 0; a < inps.length; a++ )
						{
							if( inps[ a ].id && [ 'TempName', 'TempDescription', 'TempLanguages' ].indexOf( inps[ a ].id ) >= 0 )
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
			
			var bg1  = ge( 'TempSaveBtn' );
			if( bg1 ) bg1.onclick = function( e )
			{
				// Save template ...
				
				if( details.ID )
				{
					console.log( '// save template' );
					
					update( details.ID );
				}
				else
				{
					console.log( '// create template' );
					
					create();
				}
			}
			var bg2  = ge( 'TempCancelBtn' );
			if( bg2 ) bg2.onclick = function( e )
			{
				if( details.ID )
				{
					edit( details.ID );
				}
				else
				{
					cancel(  );
				}
			}
			var bg3  = ge( 'TempBackBtn' );
			if( bg3 ) bg3.onclick = function( e )
			{
				cancel(  );
			}
			
			var bg4  = ge( 'TempDeleteBtn' );
			if( bg4 ) bg4.onclick = function( e )
			{
				
				// Delete template ...
				
				if( details.ID )
				{
					console.log( '// delete template' );
					
					removeBtn( this, { id: details.ID, button_text: 'i18n_delete_template', }, function ( args )
					{
						
						remove( args.id );
						
					} );
					
					//Confirm( i18n( 'i18n_deleting_template' ), i18n( 'i18n_deleting_template_verify' ), function( result )
					//{
					
						
					
					//} );
					
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
							console.log( 'soft ', soft );
							
							var i = 0;
							
							for( var a in soft )
							{
								if( soft[a] && soft[a][0] )
								{
									ids[ i++ ] = soft[a];
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
							console.log( 'star ', star );
							
							var i = 0;
							
							for( var a in star )
							{
								if( star[a] && star[a].split( 'launch ' )[1] )
								{
									ids[ i++ ] = star[a];
								}
							}
						}
						
						return ids;
			
					}( star ),
					
					updateids : function ( mode, key, value )
					{
						
						switch( mode )
						{
							
							case 'applications':
								
								if( this.appids )
								{
									var arr = []; /*var ids = {};*/ var i = 0; var found = false;
									
									for( var a in this.appids )
									{
										if( this.appids[a] && this.appids[a][0] )
										{
											if( key && this.appids[a][0].toLowerCase() == key.toLowerCase() )
											{
												this.appids[a] = ( value ? value : false ); found = true;
											}
											
											if( this.appids[a] && this.appids[a][0] )
											{
												arr.push( this.appids[a][0] + '_' + this.appids[a][1] );
												
												//ids[ i++ ] = this.appids[a];
											}
										}
										
										i++;
									}
									
									if( key && value && !found )
									{
										if( value[0] )
										{
											arr.push( value[0] + '_' + value[1] );
											
											/*ids[ i++ ] = value;*/
											
											this.appids[ i++ ] = value; 
										}
									}
									
									console.log( 'applications ', this.appids );
									
									if( ge( 'TempApplications' ) )
									{
										ge( 'TempApplications' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
									}
								}
								else if( key && value )
								{
									this.appids[0] = value;
									
									if( ge( 'TempApplications' ) && value[0] )
									{
										ge( 'TempApplications' ).setAttribute( 'value', value[0] + '_' + value[1] );
									}
								}
								
								break;
							
							case 'dock':
								
								if( this.appids )
								{
									var arr = []; /*var ids = {};*/ var i = 0; var found = false;
									
									for( var a in this.appids )
									{
										if( this.appids[a] && this.appids[a][0] )
										{
											if( key && this.appids[a][0].toLowerCase() == key.toLowerCase() )
											{
												this.appids[a] = ( value ? value : false ); found = true;
											}
											
											if( this.appids[a] && this.appids[a][0] )
											{
												arr.push( this.appids[a][0] + '_' + this.appids[a][1] );
												
												//ids[ i++ ] = this.appids[a];
											}
										}
										
										i++;
									}
									
									if( key && value && !found )
									{
										if( value[0] )
										{
											arr.push( value[0] + '_' + value[1] );
											
											/*ids[ i++ ] = value;*/
											
											this.appids[ i++ ] = value; 
										}
									}
									
									console.log( 'dock ', this.appids );
									
									if( ge( 'TempApplications' ) )
									{
										ge( 'TempApplications' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
									}
								}
								else if( key && value )
								{
									this.appids[0] = value;
									
									if( ge( 'TempApplications' ) && value[0] )
									{
										ge( 'TempApplications' ).setAttribute( 'value', value[0] + '_' + value[1] );
									}
								}
								
								break;
								
							case 'startup':
								
								//if( key )
								//{
								//	this.startids[ key ] = value;
								//}
								
								if( ge( 'TempStartup' ) )
								{
									if( this.startids )
									{
										var arr = []; var i = 0;
										
										for( var a in this.startids )
										{
											if( this.startids[a] && this.startids[a].split( 'launch ' )[1] )
											{
												if( key && this.startids[a].split( 'launch ' )[1].toLowerCase() == key.toLowerCase() )
												{
													this.startids[a] = ( value ? value : false ); found = true;
												}
												
												arr.push( this.startids[a] );
											}
											
											i++;
										}
										
										if( key && value && !found )
										{
											if( value.split( 'launch ' )[1] )
											{
												arr.push( value );
												
												this.startids[ i++ ] = value; 
											}
										}
										
										console.log( 'startup ', this.startids );
										
										if( ge( 'TempStartup' ) )
										{
											ge( 'TempStartup' ).setAttribute( 'value', ( arr ? arr.join( ',' ) : '' ) );
										}
									}
									else if( key && value )
									{
										this.startids[0] = value;
									}
								}
								
								break;
								
						}
						
					},
					
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
								
								var o = ge( 'ApplicationGui' ); o.innerHTML = '<input type="hidden" id="TempApplications">';
								
								this.func.updateids( 'applications' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
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
													d.className = 'PaddingSmall HContent45 FloatLeft Relative';
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
													d.className = 'PaddingSmall HContent15 FloatLeft Relative';
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
									
									if( this.ids )
									{
										for( var a in this.ids )
										{
											if( this.ids[a] && this.ids[a][0] )
											{
												var found = false;
												
												for( var k in apps )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name )
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
																			d.setAttribute( 'Name', apps[k].Name );
																			d.setAttribute( 'Category', apps[k].Category );
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
																	d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																	d.innerHTML = '<span>' + apps[k].Category + '</span>';
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
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = ( ids[ name ] ? [ 0, ids[ name ][ 1 ] ] : [ 0, 0 ] );
																				
																					args.func.updateids( 'applications', args.name, false );
																					
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																							console.log( { e:e, d:d, vars: vars } );
																						}
																					
																					}, { pnt: args.pnt, func: args.func } );
																				
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
										sortApps( 'Name' );
										
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
																d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																d.innerHTML = '<span>' + apps[k].Category + '</span>';
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
																	'element' : function( ids, name, func ) 
																	{
																		var b = document.createElement( 'button' );
																		b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( found ? 'on' : 'off' );
																		b.onclick = function(  )
																		{
																			if( this.classList.contains( 'fa-toggle-off' ) )
																			{
																				//ids[ name ] = ( ids[ name ] ? [ name, ids[ name ][ 1 ] ] : [ name, 0 ] );
																				
																				func.updateids( 'applications', name, [ name, '0' ] );
																				
																				console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																						console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { _this: this, func: func } );
																				
																			}
																			else
																			{
																				//ids[ name ] = ( ids[ name ] ? [ 0, ids[ name ][ 1 ] ] : [ 0, 0 ] );
																				
																				func.updateids( 'applications', name, false );
																				
																				console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																						console.log( { e:e, d:d, vars: vars } );
																					}
																					
																				}, { _this: this, func: func } );
																				
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
								
								this.func.updateids( 'dock' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
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
													d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent15 FloatLeft Relative';
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
									
									if( this.ids )
									{
										for( var a in this.ids )
										{
											if( this.ids[a] && this.ids[a][0] )
											{
												var found = false;
											
												for( var k in apps )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name && this.ids[a][1] == 1 )
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
																	d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Ellipsis';
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
																			
																				_this.sortdown( order, function()
																				{
																					
																					updateApplications( details.ID );
																					
																				} );
																			
																			};
																			return b;
																		}( a, this ) 
																	},
																	{ 
																		'element' : function( order, _this ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																			b.onclick = function()
																			{
																			
																				_this.sortup( order, function()
																				{
																					
																					updateApplications( details.ID );
																					
																				} );
																			
																			};
																			return b;
																		}( a, this ) 
																	}
																] 
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
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = [ name, 0 ];
																				
																					args.func.updateids( 'dock', args.name, [ args.name, '0' ] );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																					
																							if( vars.pnt )
																							{
																								vars.pnt.innerHTML = '';
																							}
																					
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																				
																					}, { pnt: args.pnt } );
																				
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
									
									if( this.ids )
									{
										for( var a in this.ids )
										{
											if( this.ids[a] && this.ids[a][0] )
											{
												var found = false; var toggle = false;
												
												for( var k in apps )
												{
													if( this.ids[a] && this.ids[a][0] == apps[k].Name )
													{
														found = true;
													
														if( this.ids[a][1] == 1 )
														{
															toggle = true;
														}
													
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
																	d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																	d.innerHTML = '<span>' + apps[k].Category + '</span>';
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
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																			b.onclick = function(  )
																			{
																				if( this.classList.contains( 'fa-toggle-off' ) )
																				{
																					//ids[ name ] = [ name, 1 ];
																				
																					func.updateids( 'dock', name, [ name, '1' ] );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																						
																							vars._this.classList.remove( 'fa-toggle-off' );
																							vars._this.classList.add( 'fa-toggle-on' );
																						
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																				
																					}, { _this: this } );
																				
																				}
																				else
																				{
																					//ids[ name ] = [ name, 0 ];
																				
																					func.updateids( 'dock', name, [ name, '0' ] );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																						
																							vars._this.classList.remove( 'fa-toggle-on' );
																							vars._this.classList.add( 'fa-toggle-off' );
																						
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																					
																					}, { _this: this } );
																				
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
							
							// TODO: Check this function, top doesn't sort properly after one click ...
							
							sortup : function ( order, callback )
							{
								
								console.log( 'TODO: sortup: ' + order + ' ', this.ids );
								
								console.log( 'soft: ', soft );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a][0] && this.ids[a][1] == 1 )
										{
											
											// 
											
											console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									console.log( { array: array, found: found, past: array[ found-1 ] } );
									
									if( array && typeof found !== "undefined" )
									{
										
										// 
										
										if( typeof array[ found ] !== "undefined" && typeof array[ found-1 ] !== "undefined" )
										{
											
											if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found-1 ] ] !== "undefined" )
											{
												var current = this.ids[ array[ found   ] ];
												var past    = this.ids[ array[ found-1 ] ];
												
												if( current && past )
												{
													
													// 
													
													this.ids[ array[ found   ] ] = past;
													this.ids[ array[ found-1 ] ] = current;
													
												}
											}
										}
									}
									
									console.log( this.ids );
									
									this.refresh();
									//this.func.applications( 'refresh' );
									
									if( callback ) return callback( true );
								}
								
							},
							
							sortdown : function ( order, callback )
							{
								
								console.log( 'TODO: sortdown: ' + order + ' ', this.ids );
								
								console.log( 'soft: ', soft );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a][0] && this.ids[a][1] == 1 )
										{
											
											// 
											
											console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									console.log( { array: array, found: found, past: array[ found+1 ] } );
									
									if( array && typeof found !== "undefined" )
									{
										
										// 
										
										if( typeof array[ found ] !== "undefined" && typeof array[ found+1 ] !== "undefined" )
										{
											
											if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found+1 ] ] !== "undefined" )
											{
												var current = this.ids[ array[ found   ] ];
												var past    = this.ids[ array[ found+1 ] ];
												
												if( current && past )
												{
													
													// 
													
													this.ids[ array[ found   ] ] = past;
													this.ids[ array[ found+1 ] ] = current;
													
												}
											}
										}
									}
									
									console.log( this.ids );
									
									this.refresh();
									//this.func.applications( 'refresh' );
									
									if( callback ) return callback( true );
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
								var o = ge( 'StartupGui' ); o.innerHTML = '<input type="hidden" id="TempStartup">';
								
								this.func.updateids( 'startup' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative PaddingLeft PaddingBottom PaddingRight';
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
													d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmall HContent15 FloatLeft Relative';
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
								this.func.mode[ 'startup' ] = 'list';
								
								if( apps )
								{
									this.head();
									
									var o = ge( 'StartupInner' ); o.innerHTML = '';
									
									if( this.ids )
									{
										for( var a in this.ids )
										{
											if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
											{
												var found = false;
												
												for( var k in apps )
												{
													if( this.ids[a] && this.ids[a].split( 'launch ' )[1] == apps[k].Name )
													{
														//found = true;
														
														break;
													}
												}
											
												if( this.func.appids )
												{
													for( var i in this.func.appids )
													{
														if( this.func.appids[i] && this.func.appids[i][0] && this.ids[a].split( 'launch ' )[1] == this.func.appids[i][0] )
														{
															found = true;
														}
													}
												}
												
												if( !found ) 
												{
													this.func.updateids( 'startup', this.ids[a].split( 'launch ' )[1], false );
													
													continue;
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
																	d.className = 'PaddingSmall HContent25 FloatLeft Ellipsis';
																	d.innerHTML = '<span>' + apps[k].Category + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent20 TextCenter FloatLeft Ellipsis';
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
																			
																				_this.sortdown( order, function()
																				{
																					
																					console.log( 'updateApplications( '+details.ID+' )' );
																					
																					updateApplications( details.ID );
																					
																				} );
																			
																			};
																			return b;
																		}( a, this ) 
																	},
																	{ 
																		'element' : function( order, _this ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																			b.onclick = function()
																			{
																			
																				_this.sortup( order, function()
																				{
																					
																					console.log( 'updateApplications( '+details.ID+' )' );
																					
																					updateApplications( details.ID );
																					
																				} );
																			
																			};
																			return b;
																		}( a, this ) 
																	}
																] 
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
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = false;
																				
																					args.func.updateids( 'startup', args.name, false );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																					
																							if( vars.pnt )
																							{
																								vars.pnt.innerHTML = '';
																							}
																					
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																				
																					}, { pnt: args.pnt } );
																				
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
									
									if( this.func.appids )
									{
										for( var a in this.func.appids )
										{
											if( this.func.appids[a] && this.func.appids[a][0] )
											{
												var found = false; var toggle = false;
												
												for( var k in apps )
												{
													if( apps[k] && apps[k].Name == this.func.appids[a][0] )
													{
														found = true;
														
														if( this.ids )
														{
															for( var i in this.ids )
															{
																if( this.ids[i] && this.ids[i].split( 'launch ' )[1] == apps[k].Name )
																{
																	toggle = true;
																	
																	break;
																}
															}
														}
														
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
																	d.className = 'PaddingSmall HContent45 FloatLeft Ellipsis';
																	d.innerHTML = '<span>' + apps[k].Category + '</span>';
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
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconSmall IconToggle ButtonSmall FloatRight fa-toggle-' + ( toggle ? 'on' : 'off' );
																			b.onclick = function(  )
																			{
																				if( this.classList.contains( 'fa-toggle-off' ) )
																				{
																					//ids[ name ] = ( 'launch ' + name );
																				
																					func.updateids( 'startup', name, ( 'launch ' + name ) );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																					
																							vars._this.classList.remove( 'fa-toggle-off' );
																							vars._this.classList.add( 'fa-toggle-on' );
																					
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																				
																					}, { _this: this } );
																				
																				}
																				else
																				{
																					//ids[ name ] = false;
																				
																					func.updateids( 'startup', name, false );
																				
																					console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																						
																							vars._this.classList.remove( 'fa-toggle-on' );
																							vars._this.classList.add( 'fa-toggle-off' );
																						
																						}
																						else
																						{
																							console.log( { e:e, d:d, vars: vars } );
																						}
																					
																					}, { _this: this } );
																				
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
							
							// TODO: Check this function, top doesn't sort properly after one click ...
							
							sortup : function ( order, callback )
							{
								
								console.log( 'TODO: sortup: ' + order + ' ', this.ids );
								
								console.log( 'star: ', star );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
										{
											
											// 
											
											console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									console.log( { array: array, found: found, past: array[ found-1 ] } );
									
									if( array && typeof found !== "undefined" )
									{
										
										// 
										
										if( typeof array[ found ] !== "undefined" && typeof array[ found-1 ] !== "undefined" )
										{
											
											if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found-1 ] ] !== "undefined" )
											{
												var current = this.ids[ array[ found   ] ];
												var past    = this.ids[ array[ found-1 ] ];
												
												if( current && past )
												{
													
													// 
													
													this.ids[ array[ found   ] ] = past;
													this.ids[ array[ found-1 ] ] = current;
													
												}
											}
										}
									}
									
									console.log( this.ids );
									
									this.refresh();
									
									if( callback ) return callback( true );
								}
								
							},
							
							sortdown : function ( order, callback )
							{
								
								console.log( 'TODO: sortdown: ' + order + ' ', this.ids );
								
								console.log( 'star: ', star );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
										{
											
											// 
											
											console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									console.log( { array: array, found: found, past: array[ found+1 ] } );
									
									if( array && typeof found !== "undefined" )
									{
										
										// 
										
										if( typeof array[ found ] !== "undefined" && typeof array[ found+1 ] !== "undefined" )
										{
											
											if( typeof this.ids[ array[ found ] ] !== "undefined" && typeof this.ids[ array[ found+1 ] ] !== "undefined" )
											{
												var current = this.ids[ array[ found   ] ];
												var past    = this.ids[ array[ found+1 ] ];
												
												if( current && past )
												{
													
													// 
													
													this.ids[ array[ found   ] ] = past;
													this.ids[ array[ found+1 ] ] = current;
													
												}
											}
										}
									}
									
									console.log( this.ids );
									
									this.refresh();
									
									if( callback ) return callback( true );
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
									
									this.setAttribute( 'value', 'charcoal' );
									
									console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.classList.remove( 'fa-toggle-off' );
											vars._this.classList.add( 'fa-toggle-on' );
											
										}
										else
										{
											console.log( { e:e, d:d, vars: vars } );
										}
										
									}, { _this: this } );
									
								}
								else
								{
									
									this.setAttribute( 'value', 'light' );
									
									console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.classList.remove( 'fa-toggle-on' );
											vars._this.classList.add( 'fa-toggle-off' );
											
										}
										else
										{
											console.log( { e:e, d:d, vars: vars } );
										}
										
									}, { _this: this } );
								}
								
							};
						}
						
						if( ge( 'theme_style_select' ) )
						{
							var s = ge( 'theme_style_select' );
							s.onchange = function(  )
							{
								
								console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
								
								updateLookAndFeel( details.ID, function( e, d, vars )
								{
									
									if( e && vars )
									{
										
									}
									else
									{
										console.log( { e:e, d:d, vars: vars } );
									}
									
								} );
								
							};	
							
						}
						
						if( ge( 'workspace_count_input' ) )
						{
							var i = ge( 'workspace_count_input' );
							i.current = i.value;
							i.onchange = function(  )
							{
								if( this.value >= 1 )
								{
									
									console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.current = vars._this.value;
											
										}
										else
										{
											vars._this.value = vars._this.current;
											
											console.log( { e:e, d:d, vars: vars } );
											
										}
										
									}, { _this: this } );
									
								}
								else
								{
									this.value = this.current;
								}
								
							};
						}
						
						if( ge( 'wallpaper_button_inner' ) )
						{
							var b = ge( 'wallpaper_button_inner' );
							b.onclick = function(  )
							{
								
								//alert( '"First Login" plan needs to be ready before this feature is used ...' );
								
								//return;
														
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
											
											if( ge( 'wallpaper_button_inner' ) )
											{
												ge( 'wallpaper_button_inner' ).setAttribute( 'value', item[ 0 ].Path );
											}
											
											console.log( 'updateWallpaper( '+details.ID+', callback )' );
											
											updateWallpaper( details.ID, function( e, d, vars )
											{
												
												if( e && vars )
												{
													
												}
												else
												{
													console.log( { e:e, d:d, vars: vars } );
												}
										
											} );
											
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
							
							//wallpaperdelete();
							
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
									d.innerHTML = '<h3 class="NoMargin FloatLeft"><strong>' + i18n( 'i18n_templates' ) + '</strong></h3>';
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
											d.placeholder = 'Search templates...';
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
				
				
				
				if( temp )
				{
					
					var list = document.createElement( 'div' );
					list.className = 'List PaddingSmallTop PaddingSmallBottom';
					
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
										d.tempid = temp[k].ID;
										d.onclick = function()
										{
											edit( this.tempid, this );
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
											}()/*,
											'child' : 
											[
												{
													'element' : function()
													{
														var s = document.createElement( 'span' );
														s.className = 'IconSmall FloatRight PaddingSmall fa-minus-circle';
														s.tempid = temp[k].ID;
														s.onclick = function ( e ) 
														{ 
															removeBtn(  );
															e.stopPropagation();
															e.preventDefault(); 
														};
														return s;
													}()
												}
											]*/
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




