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
				if( ShowLog ) console.log( { e:e, d:d } );
				
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
		
		initMain( function(  )
		{
			
			if( id )
			{
				edit( id, _this );
			}
			
		} );
		
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
		else if( id && ge( 'TemplateID_' + id ) )
		{
			ge( 'TemplateID_' + id ).classList.add( 'Selected' );
		}
		
		loading( id );
		
	}
	
	function cancel()
	{
		
		if( ShowLog ) console.log( 'cancel(  ) ' );

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
		
		if( ShowLog ) console.log( { filter: filter, server: server } );
		
	}
	
	// write -------------------------------------------------------------------------------------------------------- //
	
	function create()
	{
		
		if( ShowLog ) console.log( 'create()' );
		
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			
			var data = {};
			
			try
			{
				data = JSON.parse( d );
			}
			catch( e ) {  }
			
			if( ShowLog ) console.log( { e:e, d:(data?data:d) } );
			
			if( e == 'ok' && d )
			{
				
				if( data && data.message )
				{
					Notify( { title: i18n( 'i18n_template_create' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
				}
				
				refresh( d );
				
			}
			else if( data && data.response )
			{
				Notify( { title: i18n( 'i18n_template_create' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
				
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
		
		if( ShowLog ) console.log( 'update( '+id+' )' );
		
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
			
			if( ShowLog ) console.log( args );
			
			
			
			var m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				
				var data = {};
											
				try
				{
					data = JSON.parse( d );
				}
				catch( e ) {  }
				
				if( ShowLog ) console.log( { e:e, d:(data?data:d) } );
				
				if( e == 'ok' )
				{
					
					if( data && data.message )
					{
						Notify( { title: i18n( 'i18n_template_update' ), text: i18n( 'i18n_' + data.message ).replace( 'i18n_', '' ) } );
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
					
					refresh( id );
					
					editMode( true );
					
				}
				else if( data && data.response )
				{
					Notify( { title: i18n( 'i18n_template_update' ), text: i18n( 'i18n_' + data.response ).replace( 'i18n_', '' ) } );
					
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
				if( ShowLog ) console.log( { e:e, d:d } );
				
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
				if( ShowLog ) console.log( { e:e, d:d } );
				
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
				if( ShowLog ) console.log( { e:ee, d:dd } );
				
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
				
				if( ShowLog ) console.log( { e:e, d:d } );
				
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
		if( ShowLog ) console.log( 'editMode() ', ge( 'TempEditButtons' ) );
		
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
		
		if( ShowLog ) console.log( output );
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
		if( ShowLog ) console.log( 'got to edit ...' );
		
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
				
						if( ShowLog ) console.log( { e:res, d:dat } );
						
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
					if( ShowLog ) console.log( '//  | init' );
					
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
		
		if( ShowLog ) console.log( info );
		
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
				
				//return '<button class="IconButton IconSmall IconToggle ButtonSmall fa-toggle-' + ( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? 'on' : 'off' ) + '" id="theme_dark_button" value="' + ( themeData.colorSchemeText ? themeData.colorSchemeText : 'light' ) + '"></button>';
				
				return CustomToggle( 
					'theme_dark_button', null, null, null, 
					( themeData.colorSchemeText == 'charcoal' || themeData.colorSchemeText == 'dark' ? true : false ), 0, 
					( themeData.colorSchemeText ? themeData.colorSchemeText : 'light' ) 
				);
				
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
				
				return '<input type="number" class="FullWidth InputHeight" id="workspace_count_input" value="' + ( workspacecount > 0 ? workspacecount : '1' ) + '">';
				
			},
			
			wallpaper_button : function ()
			{
				// TODO: Fix first login first so we can set wallpapers on users not logged in yet.
				//return '<button class="ButtonAlt IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>';
				return '<p>\
				    <button class="Button IconSmall" id="wallpaper_button_inner">Choose wallpaper</button>\
				</p>\
				<p>\
				    <button class="Button IconSmall fa-remove" id="wallpaper_none">Use no wallpaper</button>\
				</p>';
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
					if( ShowLog ) console.log( '// save template' );
					
					update( details.ID );
				}
				else
				{
					if( ShowLog ) console.log( '// create template' );
					
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
					if( ShowLog ) console.log( '// delete template' );
					
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
							if( ShowLog ) console.log( 'soft ', soft );
							
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
							if( ShowLog ) console.log( 'star ', star );
							
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
									
									if( ShowLog ) console.log( 'applications ', this.appids );
									
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
									
									if( ShowLog ) console.log( 'dock ', this.appids );
									
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
										
										if( ShowLog ) console.log( 'startup ', this.startids );
										
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
								
								var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
								inp.value = '';
								
								if( ge( 'ApplicationSearchCancelBtn' ) && ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) )
								{
									ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
									ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
								}
								
								var o = ge( 'ApplicationGui' ); o.innerHTML = '<input type="hidden" id="TempApplications">';
								
								this.func.updateids( 'applications' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.style.cursor = 'pointer';
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
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													d.style.cursor = 'pointer';
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
											d.className = 'HRow Box Padding';
											d.style.overflow = 'auto';
											d.style.maxHeight = '366px';
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																	return d;
																}() 
															},
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'HContent15 FloatLeft';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = ( ids[ name ] ? [ 0, ids[ name ][ 1 ] ] : [ 0, 0 ] );
																				
																					args.func.updateids( 'applications', args.name, false );
																					
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
										this.sortapps( 'Name', 'ASC' );
										
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
																d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																return d;
															}() 
														}, 
														{ 
															'element' : function() 
															{
																var d = document.createElement( 'div' );
																d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
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
																		
																		var b = CustomToggle( 'aid_'+name, 'FloatRight', null, function (  )
																		{
																			
																			if( this.checked )
																			{
																				
																				func.updateids( 'applications', name, [ name, '0' ] );
																				
																				if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																				updateApplications( details.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						
																						vars._this.checked = true;
																						
																						if( vars.func )
																						{
																							vars.func.dock( 'refresh' );
																							vars.func.startup( 'refresh' );
																						}
																						
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																						
																						vars._this.checked = false;
																						
																					}
																					
																				}, { _this: this, func: func } );
																				
																			}
																			else
																			{
																				
																				func.updateids( 'applications', name, false );
																				
																				if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																				updateApplications( details.ID, function( e, d, vars )
																				{
																					
																					if( e && vars )
																					{
																						
																						vars._this.checked = false;
																						
																						if( vars.func )
																						{
																							vars.func.dock( 'refresh' );
																							vars.func.startup( 'refresh' );
																						}
																						
																					}
																					else
																					{
																						if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																						
																						vars._this.checked = true;
																						
																					}
																					
																				}, { _this: this, func: func } );
																				
																			}
																			
																		}, ( found ? true : false ), 1 );
																		
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
									this.sortapps( 'Name', 'ASC' );
									
								}
								
							},
							
							searchapps : function ( filter, server )
							{
								
								if( ge( 'ApplicationInner' ) )
								{
									var list = ge( 'ApplicationInner' ).getElementsByTagName( 'div' );

									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
											var span = list[a].getElementsByTagName( 'span' )[0];
		
											if( span )
											{
												var param = [
													( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
													( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
												];
												
												if( !filter || filter == ''  
												|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
				
													var div = list[a].getElementsByTagName( 'div' );
				
													if( div.length )
													{
														for( var i in div )
														{
															if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
															{
																// TODO: Make text searched for ...
															}
														}
													}
												}
												else
												{
													list[a].style.display = 'none';
												}
											}
										}
	
									}
									
									if( ge( 'ApplicationSearchCancelBtn' ) )
									{
										if( !filter && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Open' );
											ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Closed' );
										}
										
										else if( filter != '' && ( ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'ApplicationSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'ApplicationSearchCancelBtn' ).classList.remove( 'Closed' );
											ge( 'ApplicationSearchCancelBtn' ).classList.add( 'Open' );
										}
									}
								}
								
							},
							
							sortapps : function ( sortby, orderby )
							{

								//

								var _this = ge( 'ApplicationInner' );

								if( _this )
								{
									orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
	
									var list = _this.getElementsByTagName( 'div' );
	
									if( list.length > 0 )
									{
										var output = [];
		
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
		
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
			
											var span = list[a].getElementsByTagName( 'span' )[0];
			
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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

								//console.log( output );
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
								
								var inp = ge( 'AdminApplicationContainer' ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchapps( this.value );
								}
								ge( 'ApplicationSearchCancelBtn' ).onclick = function( e )
								{
									init.searchapps( false );
									inp.value = '';
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
								
								var inp = ge( 'AdminDockContainer' ).getElementsByTagName( 'input' )[0];
								inp.value = '';
								
								if( ge( 'DockSearchCancelBtn' ) && ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) )
								{
									ge( 'DockSearchCancelBtn' ).classList.remove( 'Open' );
									ge( 'DockSearchCancelBtn' ).classList.add( 'Closed' );
								}
								
								var o = ge( 'DockGui' ); o.innerHTML = '';
								
								this.func.updateids( 'dock' );
								
								var divs = appendChild( [ 
									{ 
										'element' : function() 
										{
											var d = document.createElement( 'div' );
											//d.className = 'HRow BackgroundNegativeAlt Negative PaddingLeft PaddingBottom PaddingRight';
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortdock( 'Name' );
													};
													return d;
												}( this ) 
											}, 
											{ 
												'element' : function( _this )  
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortdock( 'Category' );
													};
													return d;
												}( this )
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent10 FloatLeft Relative';
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
											d.style.overflow = 'auto';
											d.style.maxHeight = '366px';
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																	return d;
																}() 
															},
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'HContent25 InputHeight TextCenter FloatLeft Ellipsis';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( order, _this ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
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
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
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
																	d.className = 'HContent10 FloatLeft';
																	return d;
																
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = [ name, 0 ];
																				
																					args.func.updateids( 'dock', args.name, [ args.name, '0' ] );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
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
																			
																			var b = CustomToggle( 'did_'+name, 'FloatRight', null, function (  )
																			{
																			
																				if( this.checked )
																				{
																					
																					func.updateids( 'dock', name, [ name, '1' ] );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																							
																							vars._this.checked = true;
																						
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = false;
																							
																						}
																				
																					}, { _this: this } );
																					
																				}
																				else
																				{
																					
																					func.updateids( 'dock', name, [ name, '0' ] );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																						
																							vars._this.checked = false;
																						
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = true;
																							
																						}
																					
																					}, { _this: this } );
																					
																				}
																			
																			}, ( toggle ? true : false ), 1 );
																			
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
										this.sortdock( 'Name', 'ASC' );
										
									}
									
								}
								
							},
							
							searchdock : function ( filter, server )
							{
								
								if( ge( 'DockInner' ) )
								{
									var list = ge( 'DockInner' ).getElementsByTagName( 'div' );

									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
											var span = list[a].getElementsByTagName( 'span' )[0];
		
											if( span )
											{
												var param = [
													( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
													( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
												];
												
												if( !filter || filter == ''  
												|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
				
													var div = list[a].getElementsByTagName( 'div' );
				
													if( div.length )
													{
														for( var i in div )
														{
															if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
															{
																// TODO: Make text searched for ...
															}
														}
													}
												}
												else
												{
													list[a].style.display = 'none';
												}
											}
										}
	
									}
									
									if( ge( 'DockSearchCancelBtn' ) )
									{
										if( !filter && ( ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'DockSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'DockSearchCancelBtn' ).classList.remove( 'Open' );
											ge( 'DockSearchCancelBtn' ).classList.add( 'Closed' );
										}
										
										else if( filter != '' && ( ge( 'DockSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'DockSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'DockSearchCancelBtn' ).classList.remove( 'Closed' );
											ge( 'DockSearchCancelBtn' ).classList.add( 'Open' );
										}
									}
								}
								
							},
							
							sortdock : function ( sortby, orderby )
							{

								//

								var _this = ge( 'DockInner' );

								if( _this )
								{
									orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
									
									var list = _this.getElementsByTagName( 'div' );
	
									if( list.length > 0 )
									{
										var output = [];
		
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
		
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
			
											var span = list[a].getElementsByTagName( 'span' )[0];
			
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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

								//console.log( output );
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
								
								if( ShowLog ) console.log( 'TODO: sortup: ' + order + ' ', this.ids );
								
								if( ShowLog ) console.log( 'soft: ', soft );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a][0] && this.ids[a][1] == 1 )
										{
											
											// 
											
											if( ShowLog ) console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									if( ShowLog ) console.log( { array: array, found: found, past: array[ found-1 ] } );
									
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
									
									if( ShowLog ) console.log( this.ids );
									
									this.refresh();
									//this.func.applications( 'refresh' );
									
									if( callback ) return callback( true );
								}
								
							},
							
							sortdown : function ( order, callback )
							{
								
								if( ShowLog ) console.log( 'TODO: sortdown: ' + order + ' ', this.ids );
								
								if( ShowLog ) console.log( 'soft: ', soft );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a][0] && this.ids[a][1] == 1 )
										{
											
											// 
											
											if( ShowLog ) console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									if( ShowLog ) console.log( { array: array, found: found, past: array[ found+1 ] } );
									
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
									
									if( ShowLog ) console.log( this.ids );
									
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
								
								var inp = ge( 'AdminDockContainer' ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchdock( this.value );
								}
								ge( 'DockSearchCancelBtn' ).onclick = function( e )
								{
									init.searchdock( false );
									inp.value = '';
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
											d.className = 'HRow BackgroundNegative Negative Padding';
											return d;
										}(),
										'child' : 
										[ 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent40 FloatLeft';
													d.innerHTML = '<strong>' + i18n( 'i18n_name' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortstartup( 'Name' );
													};
													return d;
												}( this ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 FloatLeft Relative';
													d.innerHTML = '<strong>' + i18n( 'i18n_category' ) + '</strong>';
													d.style.cursor = 'pointer';
													d.ele = this;
													d.onclick = function(  )
													{
														_this.sortstartup( 'Category' );
													};
													return d;
												}( this )
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent25 TextCenter FloatLeft Relative' + ( hidecol ? ' Closed' : '' );
													d.innerHTML = '<strong>' + i18n( 'i18n_order' ) + '</strong>';
													return d;
												}()
											},
											{ 
												'element' : function() 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent10 FloatLeft Relative';
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
											d.style.overflow = 'auto';
											d.style.maxHeight = '366px';
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																	return d;
																}() 
															},
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent25 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'HContent25 InputHeight TextCenter FloatLeft Ellipsis';
																	return d;
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( order, _this ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-down';
																			b.onclick = function(  )
																			{
																			
																				_this.sortdown( order, function()
																				{
																					
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+' )' );
																					
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
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall MarginLeft MarginRight ColorStGrayLight fa-arrow-up';
																			b.onclick = function()
																			{
																			
																				_this.sortup( order, function()
																				{
																					
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+' )' );
																					
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
																	d.className = 'HContent10 FloatLeft';
																	return d;
																
																}(),
																'child' : 
																[ 
																	{ 
																		'element' : function( ids, name, func ) 
																		{
																			var b = document.createElement( 'button' );
																			b.className = 'IconButton IconMedium IconToggle ButtonSmall FloatRight ColorStGrayLight fa-minus-circle';
																			b.onclick = function(  )
																			{
																			
																				var pnt = this.parentNode.parentNode;
																			
																				removeBtn( this, { ids: ids, name: name, func: func, pnt: pnt }, function ( args )
																				{
																				
																					//ids[ name ] = false;
																				
																					args.func.updateids( 'startup', args.name, false );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
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
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
																	d.className = 'PaddingSmall HContent30 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<strong class="PaddingSmallRight">' + apps[k].Name + '</strong>';
																	return d;
																}() 
															}, 
															{ 
																'element' : function() 
																{
																	var d = document.createElement( 'div' );
																	d.className = 'PaddingSmall HContent45 InputHeight FloatLeft Ellipsis';
																	d.innerHTML = '<span class="PaddingSmallLeft PaddingSmallRight">' + apps[k].Category + '</span>';
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
																			
																			var b = CustomToggle( 'sid_'+name, 'FloatRight', null, function (  )
																			{
																			
																				if( this.checked )
																				{
																					
																					func.updateids( 'startup', name, ( 'launch ' + name ) );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																				
																						if( e && vars )
																						{
																							
																							vars._this.checked = true;
																					
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = false;
																							
																						}
																				
																					}, { _this: this } );
																					
																				}
																				else
																				{
																					
																					func.updateids( 'startup', name, false );
																				
																					if( ShowLog ) console.log( 'updateApplications( '+details.ID+', callback, vars )' );
																				
																					updateApplications( details.ID, function( e, d, vars )
																					{
																					
																						if( e && vars )
																						{
																						
																							vars._this.checked = false;
																						
																						}
																						else
																						{
																							if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
																							
																							vars._this.checked = true;
																							
																						}
																					
																					}, { _this: this } );
																					
																				}
																			
																			}, ( toggle ? true : false ), 1 );
																			
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
								
								// Sort default by Name ASC
								this.sortstartup( 'Name', 'ASC' );
								
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
							
							searchstartup : function ( filter, server )
							{
								
								//
								
								if( ge( 'StartupInner' ) )
								{
									var list = ge( 'StartupInner' ).getElementsByTagName( 'div' );

									if( list.length > 0 )
									{
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
		
											var span = list[a].getElementsByTagName( 'span' )[0];
		
											if( span )
											{
												var param = [
													( " " + span.getAttribute( 'name' ).toLowerCase() + " " ), 
													( " " + span.getAttribute( 'category' ).toLowerCase() + " " )
												];
												
												if( !filter || filter == ''  
												|| span.getAttribute( 'name' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												|| span.getAttribute( 'category' ).toLowerCase().indexOf( filter.toLowerCase() ) >= 0 
												)
												{
													list[a].style.display = '';
				
													var div = list[a].getElementsByTagName( 'div' );
				
													if( div.length )
													{
														for( var i in div )
														{
															if( div[i] && div[i].className && ( div[i].className.indexOf( 'name' ) >= 0 || div[i].className.indexOf( 'category' ) >= 0 ) )
															{
																// TODO: Make text searched for ...
															}
														}
													}
												}
												else
												{
													list[a].style.display = 'none';
												}
											}
										}
	
									}
									
									if( ge( 'StartupSearchCancelBtn' ) )
									{
										if( !filter && ( ge( 'StartupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'StartupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'StartupSearchCancelBtn' ).classList.remove( 'Open' );
											ge( 'StartupSearchCancelBtn' ).classList.add( 'Closed' );
										}
										
										else if( filter != '' && ( ge( 'StartupSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'StartupSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
										{
											ge( 'StartupSearchCancelBtn' ).classList.remove( 'Closed' );
											ge( 'StartupSearchCancelBtn' ).classList.add( 'Open' );
										}
									}
								}
								
							},
							
							sortstartup : function ( sortby, orderby )
							{

								//

								var _this = ge( 'StartupInner' );

								if( _this )
								{
									orderby = ( orderby ? orderby : ( _this.getAttribute( 'orderby' ) && _this.getAttribute( 'orderby' ) == 'ASC' ? 'DESC' : 'ASC' ) );
									
									var list = _this.getElementsByTagName( 'div' );
	
									if( list.length > 0 )
									{
										var output = [];
		
										var callback = ( function ( a, b ) { return ( a.sortby > b.sortby ) ? 1 : -1; } );
		
										for( var a = 0; a < list.length; a++ )
										{
											if( list[a].className && list[a].className.indexOf( 'HRow' ) < 0 ) continue;
			
											var span = list[a].getElementsByTagName( 'span' )[0];
			
											if( span && typeof span.getAttribute( sortby.toLowerCase() ) != 'undefined' )
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

								//console.log( output );
							},
							
							// TODO: Check this function, top doesn't sort properly after one click ...
							
							sortup : function ( order, callback )
							{
								
								if( ShowLog ) console.log( 'TODO: sortup: ' + order + ' ', this.ids );
								
								if( ShowLog ) console.log( 'star: ', star );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
										{
											
											// 
											
											if( ShowLog ) console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									if( ShowLog ) console.log( { array: array, found: found, past: array[ found-1 ] } );
									
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
									
									if( ShowLog ) console.log( this.ids );
									
									this.refresh();
									
									if( callback ) return callback( true );
								}
								
							},
							
							sortdown : function ( order, callback )
							{
								
								if( ShowLog ) console.log( 'TODO: sortdown: ' + order + ' ', this.ids );
								
								if( ShowLog ) console.log( 'star: ', star );
								
								var num = 0; var array = []; var found = null;
								
								if( this.ids && typeof order !== "undefined" )
								{
									for( var a in this.ids )
									{
										if( this.ids[a] && this.ids[a].split( 'launch ' )[1] )
										{
											
											// 
											
											if( ShowLog ) console.log( { a:a, num:num } );
											
											if( order == a && typeof this.ids[ order ] !== "undefined" )
											{
												found = num;
											}
											
											array.push( a );
											
											num++;
										}
									}
									
									if( ShowLog ) console.log( { array: array, found: found, past: array[ found+1 ] } );
									
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
									
									if( ShowLog ) console.log( this.ids );
									
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
								
								var inp = ge( 'AdminStartupContainer' ).getElementsByTagName( 'input' )[0];
								inp.onkeyup = function( e )
								{
									init.searchstartup( this.value );
								}
								ge( 'StartupSearchCancelBtn' ).onclick = function( e )
								{
									init.searchstartup( false );
									inp.value = '';
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
								
								if( this.checked/*this.classList.contains( 'fa-toggle-off' )*/ )
								{
									
									this.setAttribute( 'value', 'charcoal' );
									
									if( ShowLog ) console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.checked = true;
											
										}
										else
										{
											if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
											
											vars._this.checked = false;
											
										}
										
									}, { _this: this } );
									
								}
								else
								{
									
									this.setAttribute( 'value', 'light' );
									
									if( ShowLog ) console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.checked = false;
											
										}
										else
										{
											if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
											
											vars._this.checked = true;
											
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
								
								if( ShowLog ) console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
								
								updateLookAndFeel( details.ID, function( e, d, vars )
								{
									
									if( e && vars )
									{
										
									}
									else
									{
										if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
									
									if( ShowLog ) console.log( 'updateLookAndFeel( '+details.ID+', callback, vars )' );
									
									updateLookAndFeel( details.ID, function( e, d, vars )
									{
										
										if( e && vars )
										{
											
											vars._this.current = vars._this.value;
											
										}
										else
										{
											vars._this.value = vars._this.current;
											
											if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
											
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
							// Support no wallpaper
							let rm = ge( 'wallpaper_none' );
							rm.onclick = function()
							{
							    ge( 'wallpaper_button_inner' ).setAttribute( 'value', 'color' );
							    let ctx = ge( 'AdminWallpaper' ).getContext( '2d' );
							    ctx.fillStyle = '#223344';
							    ctx.fillRect( 0, 0, 256, 256 );
							    updateWallpaper( details.ID, function( e, d, vars )
								{
									
									if( e && vars )
									{
										
									}
									else
									{
										if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
									}
							
								} );
							}
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
												if( ShowLog ) console.log( 'loaded image ... ', item );
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
											
											if( ShowLog ) console.log( 'updateWallpaper( '+details.ID+', callback )' );
											
											updateWallpaper( details.ID, function( e, d, vars )
											{
												
												if( e && vars )
												{
													
												}
												else
												{
													if( ShowLog ) console.log( { e:e, d:d, vars: vars } );
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
							    if( look == 'color' )
							    {
						            let ctx = ge( 'AdminWallpaper' ).getContext( '2d' );
						            ctx.fillStyle = '#223344';
						            ctx.fillRect( 0, 0, 256, 256 );
							    }
							    else
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
								if( ge( 'AdminApplicationContainer' ) )
								{
									ge( 'AdminApplicationContainer' ).className = ge( 'AdminApplicationContainer' ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
						if( !show || show.indexOf( 'dock' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
							{
								if( ge( 'AdminDockContainer' ) )
								{
									ge( 'AdminDockContainer' ).className = ge( 'AdminDockContainer' ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
						if( !show || show.indexOf( 'startup' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_APPLICATION_GLOBAL' ) || Application.checkAppPermission( 'PERM_APPLICATION_WORKGROUP' ) )
							{
								if( ge( 'AdminStartupContainer' ) )
								{
									ge( 'AdminStartupContainer' ).className = ge( 'AdminStartupContainer' ).className.split( 'Closed' ).join( 'Open' );
								}
							}
						}
						
						if( !show || show.indexOf( 'looknfeel' ) >= 0 )
						{
							if( Application.checkAppPermission( 'PERM_LOOKNFEEL_GLOBAL' ) || Application.checkAppPermission( 'PERM_LOOKNFEEL_WORKGROUP' ) )
							{
								if( ge( 'AdminLooknfeelContainer' ) )
								{
									ge( 'AdminLooknfeelContainer' ).className = ge( 'AdminLooknfeelContainer' ).className.split( 'Closed' ).join( 'Open' );
								}
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
	
	function initMain( callback )
	{
		if( ShowLog ) console.log( 'initMain()' );
		
		var checkedGlobal = Application.checkAppPermission( 'PERM_TEMPLATE_GLOBAL' );
		var checkedWorkgr = Application.checkAppPermission( 'PERM_TEMPLATE_WORKGROUP' );
		
		if( checkedGlobal || checkedWorkgr )
		{
			
			// Get the user list
			list( function( res, dat )
			{
				if( ShowLog ) console.log( { e:res, d:dat } );
				
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
							d.className = 'OverflowHidden BorderRadius Elevated';
							d.id = 'AdminTemplateContainer';
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
													b.id = 'TemplateEditBack';
													b.className = 'IconButton IconMedium ButtonSmall Negative FloatLeft fa-arrow-circle-left Closed';
													return b;
												}()
											},
											{
												'element' : function(  ) 
												{
													var h = document.createElement( 'h3' );
													h.className = 'NoMargin PaddingSmallLeft PaddingSmallRight FloatLeft';
													h.innerHTML = '<strong>' + i18n( 'i18n_templates' ) + ' </strong><span id="AdminTemplateCount">(' + ( temp ? temp.length : '0' ) + ')</span>';
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
													b.id = 'TemplateSearchCancelBtn';
													b.className = 'IconButton IconSmall ButtonSmall fa-times-circle Closed';
													b.style = 'position:absolute;right:0;margin-top:-2px;';
													b.onclick = function(  )
													{
														searchtemplates( false );
														var inp = ge( 'AdminTemplateContainer' ).getElementsByTagName( 'input' )[0];
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
														searchtemplates( this.value );
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
										}(),
										'child' : 
										[ 
											{
												'element' : function(  ) 
												{
													if( Application.checkAppPermission( [ 
														'PERM_TEMPLATE_CREATE_GLOBAL', 'PERM_TEMPLATE_CREATE_IN_WORKGROUP', 
														'PERM_TEMPLATE_GLOBAL',        'PERM_TEMPLATE_WORKGROUP' 
													] ) )
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
										]
									}
								]
							},
							{
								'element' : function(  ) 
								{
									var d = document.createElement( 'div' );
									d.className = 'List';
									d.id = 'TemplateGui';
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
														sorttemplates( 'Name' );
													};
													return d;
												}(  ) 
											}, 
											{ 
												'element' : function( _this ) 
												{
													var d = document.createElement( 'div' );
													d.className = 'PaddingSmallLeft PaddingSmallRight HContent45 FloatLeft Relative';
													d.innerHTML = '<strong></strong>';
													return d;
												}( this )
											},
											{ 
												'element' : function() 
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
											d.id = 'TemplateInner';
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
				
				o = ge( 'TemplateInner' );
				
				if( temp )
				{
					
					var list = document.createElement( 'div' );
					
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
										d.id = 'TemplateID_' + temp[k].ID;
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
												d.className = 'TextCenter HContent10 InputHeight FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = '<span name="' + temp[k].Name + '" class="IconMedium fa-file-text"></span>';
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent80 InputHeight FloatLeft PaddingSmall Ellipsis';
												d.innerHTML = temp[k].Name;
												return d;
											}()
										},
										{
											'element' : function()
											{
												var d = document.createElement( 'div' );
												d.className = 'HContent10 InputHeight FloatLeft PaddingSmall';
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
				
				// Search ...............
				
				var searchtemplates = function ( filter, server )
				{
					
					if( ge( 'TemplateInner' ) )
					{
						var list = ge( 'TemplateInner' ).getElementsByTagName( 'div' );
						
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
						
						if( ge( 'TemplateSearchCancelBtn' ) )
						{
							if( !filter && ( ge( 'TemplateSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'TemplateSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'TemplateSearchCancelBtn' ).classList.remove( 'Open' );
								ge( 'TemplateSearchCancelBtn' ).classList.add( 'Closed' );
								
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
							
							else if( filter != '' && ( ge( 'TemplateSearchCancelBtn' ).classList.contains( 'Open' ) || ge( 'TemplateSearchCancelBtn' ).classList.contains( 'Closed' ) ) )
							{
								ge( 'TemplateSearchCancelBtn' ).classList.remove( 'Closed' );
								ge( 'TemplateSearchCancelBtn' ).classList.add( 'Open' );
							}
						}
					}
					
				};
				
				// Sort .............
				
				var sorttemplates = function ( sortby, orderby )
				{
					
					//
					
					var _this = ge( 'TemplateInner' );
					
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
				
				sorttemplates( 'Name', 'ASC' );
				
				Friend.responsive.pageActive = ge( 'TemplateList' );
				Friend.responsive.reinit();
				
				if( callback ) callback( true );
				
			} );
			
		}
		else
		{
			var o = ge( 'TemplateList' );
			o.innerHTML = '';
			
			var h2 = document.createElement( 'h2' );
			h2.innerHTML = '{i18n_permission_denied}';
			o.appendChild( h2 );
			
			if( callback ) callback( true );
			
		}
		
	}
	
};




