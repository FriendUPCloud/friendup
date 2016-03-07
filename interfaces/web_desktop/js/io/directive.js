/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

var _appNum = 1;

// Load a javascript application into a sandbox
function ExecuteApplication( app, args, callback )
{	
	// TODO: Make this safe!
	if( app.indexOf( ':' ) > 0 && app.indexOf( '.jsx' ) > 0 )
	{
		return ExecuteJSXByPath( app, args, callback );
	}
	else if( app.indexOf( ':' ) > 0 )
	{
		// TODO: Open a file window!
	}
	
	// 1. Ask about application.................................................
	var m = new Module( 'system' );
	m.onExecuted = function( r, d )
	{
		// Get data from Friend Core
		var conf = JSON.parse( d );
		
		if( r == 'activate' )
		{
			ActivateApplication( app, conf );
			if( callback ) callback( false );
			return false;
		}
		else if( r != 'ok' )
		{
			if( r == 'notinstalled' || ( conf && conf.response == 'not installed' ) )
			{
				var title = i18n( 'install_question_mintitle' ) + ': ' + app;
				var w = new View( {
					title:  title,
					width:  480,
					height: 140,
					id:     'system_install_' + app
				} );
				var f = new File( 'System:templates/install.html' );
				f.onLoad = function( data )
				{
					var repl = [ 'install_question_desc', 'install_question_title',
								 'install_button', 'install_cancel' ];
					for( var a in repl ) data = data.split( '{' + repl[a] + '}' ).join ( i18n( repl[a] ) );
					data = data.split( '{app}' ).join ( app );
					w.setContent( data );
				}
				f.load();
			}
			else
			{
				Ac2Alert( i18n( 'application_not_found' ) );
			}
			if( callback ) callback( false );
			return false;
		}
		
		// 2. If the application is activated, run it...........................	
		if( typeof( conf ) == 'object' )
		{
			if( typeof( conf.API ) == 'undefined' )
			{
				Ac2Alert( 'Can not run v0 applications.' );
				if( callback ) callback( false );
				return false;
			}
			
			// Load sandbox js
			function md5( str )
			{
				return str;
			}
			
			// Load application into a sandboxed iframe
			var ifr = document.createElement( 'iframe' );
			ifr.setAttribute( 'sandbox', 'allow-forms allow-scripts' );
			ifr.path = conf.Path;
			// Proper way
			if( conf.Init )
			{
				ifr.src = Doors.runLevels[1].domain + '/system.library/module?module=system&sessionid=' + Doors.sessionId + '&command=launch&app=' + app + '&friendup=' + Doors.runLevels[0].domain;
			}
			else
			{
				ifr.src = Doors.runLevels[1].domain + '/webclient/apps/' + app + '/index.html?friendup=' + Doors.runLevels[0].domain;
			}
			
			// Register name and ID
			ifr.applicationName = app;
			ifr.userId = Doors.userId;
			ifr.applicationId = md5( app + '-' + (new Date()).getTime() );
			ifr.authId = conf.AuthID;
			ifr.applicationNumber = _appNum++;
			ifr.permissions = conf.Permissions;
			
			// Quit the application
			ifr.quit = function( level )
			{
				if( this.windows )
				{
					for( var a in this.windows )
					{
						this.windows[a].close( level );
					}
				}
				if( this.screens )
				{
					for( var a in this.screens )
					{
						this.screens[a].close( level );
					}
				}
				
				// On level, destroy app immediately
				if( level )
				{
					var out = [];
					for( var a = 0; a < Doors.applications.length; a++ )
					{
						if( Doors.applications[a] != this )
							out.push( Doors.applications[a] );
					}
					
					// Remove dormant doors!
					DormantMaster.delAppDoorByAppId( this.applicationId );
				
					var d = this.div;
					if( d ) d.parentNode.removeChild( d );
					this.parentNode.removeChild( this );
					Doors.applications = out;
					Doors.updateTasks();	
				}
				// Tell the application to clean up first
				else
				{
					var o = {
						command: 'quit',
						applicationId: this.applicationId,
						userId: this.userId,
						authId: this.authId,
						filePath: Doors.runLevels[1].domain + '/webclient/apps/' + app + '/',
						domain:   Doors.runLevels[1].domain
					};
					this.contentWindow.postMessage( JSON.stringify( o ), '*' );
				}
			}
			
			// Close method
			ifr.close = function()
			{
				// Check if iframe has a close event
				if( ifr.onClose )
					ifr.onClose();
				
				// Just remove the application
				ifr.parentNode.removeChild( ifr );
			}
			
			// Register application
			ifr.onload = function()
			{
				var cid = addWrapperCallback( function()
				{
					if( callback )
					{
						callback( "\n", { response: 'Executable has run.' } );
					}
				} );
				
				var o = {
					command: 'register',
					applicationId: ifr.applicationId,
					userId: ifr.userId,
					authId: ifr.authId,
					args: args,
					theme: Doors.theme,
					filePath: Doors.runLevels[1].domain + '/webclient/apps/' + app + '/',
					domain:   Doors.runLevels[1].domain,
					registerCallback: cid
				};
				// Language support
				if( conf.language )
				{
					o.spokenLanguage = conf.language.spokenLanguage;
					o.alternateLanguage = conf.language.spokenAlternate;
				}
				this.contentWindow.postMessage( JSON.stringify( o ), '*' );
			}
			
			// Add application iframe to body
			AttachAppSandbox( ifr, Doors.runLevels[1].domain + '/webclient/apps/' + app );
			
			// Add application
			Doors.applications.push( ifr );
		}
		else 
		{
			callback( "\n", { response: 'Executable has run.' } );
		}
	}
	m.execute( 'friendapplication', { application: app } );
}

// Kill an app by name or PID
KillApplication = function ( n, level )
{
	var killed = 0;	
	if( !level ) level = 1;
	if( typeof( n ) == 'number' )
	{
		if( Doors.applications[n] )
		{
			Doors.applications[n].quit( level );
			ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks (' + ge( 'Tasks' ).childNodes.length + ')' ) + '</h2>';
			return true;
		}
	}
	else if ( typeof( n ) == 'object' )
	{
		for( var a = 0; a < Doors.applications.length; a++ )
		{
			var d = Doors.applications[a];
			if( d == n )
			{
				console.log( "Killed one application by name ("+d.applicationName+")." );
				d.quit( level );
				break;
			}
		}
	}
	else
	{
		var found = 1;
		while( found )
		{
			var sk = 0;
			for( var a = 0; a < Doors.applications.length; a++ )
			{
				var d = Doors.applications[a];
				if( d.applicationName == n )
				{
					console.log( "Killed one application ("+d.applicationName+")." );
					d.quit( level );
					killed++;
					sk = 1;
					break;
				}
			}
			if( sk == 0 ) found = false;
		}
	}
	ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks (' + ge( 'Tasks' ).childNodes.length + ')' ) + '</h2>';
	return killed;
}

function KillApplicationById( appid, level )
{
	for( var a = 0; a < Doors.applications.length; a++ )
	{
		var d = Doors.applications[a];
		if( d.applicationId == appid )
		{
			console.log( "Killed one application by id ("+d.applicationName+")." );
			d.quit( level );
			killed++;
		}
	}
}

// Activate the application for the user
function ActivateApplication( app, conf )
{
	var w = new View( {
		title: i18n( 'activate_application' ),
		width: 400,
		height: 500,
		id: 'activate_' + app
	} );
	
	var f = new File( 'System:templates/activate.html' );
	f.replacements = {
		'app_activation_head'   : i18n( 'app_activation_head' ),
		'app_activation_desc'   : i18n( 'app_activation_desc' ),
		'app_activation_button' : i18n( 'app_activation_button' ),
		'app_activation_abort'  : i18n( 'app_activation_abort' ),
		'application'           : app
	};
	
	f.onLoad = function( d )
	{
		var perms = '';
		var filesystemoptions = '';
		if( conf.Permissions )
		{
			for( var a = 0; a < conf.Permissions.length; a++ )
			{
				var row = Trim( conf.Permissions[a] ).split( ' ' );
				switch( row[0].toLowerCase() )
				{
					case 'door':
						perms += '<p>';
						perms += '<input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_door_access' ) + '</label> ';
						perms += '<select><option value="all">' + 
							i18n( 'all_filesystems' ) + '</option>' + filesystemoptions + '</select>';
						perms += '.</p>';
						break;
					case 'module':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					case 'service':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					default:
						continue;
				}
			}
		}
		w.setContent( d.split( '{permissions}' ).join ( perms ) );
		var eles = w.getWindowElement().getElementsByTagName( 'button' );
		var abtn = false, cbtn = false;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className == 'activation' )
			{
				abtn = eles[a];
			}
			else if( eles[a].className == 'cancel' )
			{
				cbtn = eles[a];
			}
		}
		if( abtn && cbtn )
		{
			abtn.onclick = function()
			{
				ExecuteApplicationActivation( app, w, conf.Permissions );
			}
			cbtn.onclick = function()
			{
				w.close();
			}
		}
	}
	f.load();
}

function InstallApplication( app )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		console.log( e + ' -> ' + d );
		if( e == 'ok' )
		{
			var w = FindWindowById( 'system_install_' + app );
			if( w ) 
			{
				ExecuteApplication( app );
				w.close();
			}
		}
		else
		{
			Ac2Alert( 'Failed to install application...' );
		}
	}
	m.execute( 'installapplication', { application: app } );
}


// Activate application through form
function ExecuteApplicationActivation( app, win, permissions, reactivation )
{
	var pelement = win.getWindowElement();
	var eles = pelement.getElementsByTagName( 'input' );
	var out = [];
	var hasOptions = 0;
	if( eles && eles.length )
	{
		for( var a = 0, i = 0; a < eles.length, i < permissions.length; a++ )
		{
			if( eles[a].getAttribute( 'type' ) != 'checkbox' )
				continue;
			// Ah, we've got a permission setting
			if( eles[a].className.substr( 0, 10 ) == 'permission' )
			{
				if( eles[a].checked )
				{
					var permission = permissions[i];
				
					// Get value inputs
					var p = eles[a].parentNode;
					var elez = p.getElementsByTagName( '*' );
					var val = '';
					for( var c = 0; c < elez.length; c++ )
					{
						if( elez[c].tagName == 'INPUT' && elez[c].type.toLowerCase() != 'checkbox' )
						{
							val = elez[c].value;
							hasOptions++;
						}
						else if( elez[c].tagName == 'SELECT' )
						{
							val = elez[c].value;
							hasOptions++
						}
					} 

					// Push the permission description plus the value
					out.push( [ i, permissions[i], val ] );
				}
				i++;
			}
		}
	}
	
	// Only do this if we have entries
	if( out.length || hasOptions == 0 )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( r, d )
		{
			if( r == 'ok' )
			{
				win.close();
				ExecuteApplication( app );
			}
			else
			{
				Ac2Alert( i18n( 'failed_application_activation' ) );
				win.close();
			}
		}
		var argz = { application: app, permissions: out };
		if( reactivation ) argz.reactivation = '1';
		m.execute( 'activateapplication', argz );
	}
	else
	{
		Ac2Alert( i18n( 'no_activation_fields_checked' ) );
	}
}

// Do it by path!
function ExecuteJSXByPath( path, args, callback )
{
	var f = new File( path );
	f.onLoad = function( data )
	{
		if( data )
		{
			var app = path.split( ':' )[1];
			if( app.indexOf( '/' ) > 0 )
			{
				app = app.split( '/' );
				app = app[app.length-1]; 
			}
			return ExecuteJSX( data, app, args, path, callback );
		}
		callback( false );
	}
	f.load();
}

function ExecuteJSX( data, app, args, path, callback )
{
	//console.log( 'Here is the path: ' + path );
	// Load application into a sandboxed iframe
	var ifr = document.createElement( 'iframe' );
	ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts' );
	ifr.path = '/webclient/jsx/';
	ifr.src = 'sandboxed.html?' + ( args ? ( 'args=' + args ) : '' );
	
	// Register name and ID
	ifr.applicationName = app;
	ifr.applicationNumber = _appNum++;
	ifr.applicationId = app + '-' + (new Date()).getTime();
	ifr.userId = Doors.userId;
	ifr.applicationType = 'jsx';
	ifr.sessionId = Workspace.sessionId; // JSX has sessionid
	
	// Quit the application
	ifr.quit = function( level )
	{
		if( this.windows )
		{
			for( var a in this.windows )
			{
				this.windows[a].close( level );
			}
		}
		if( this.screens )
		{
			for( var a in this.screens )
			{
				this.screens[a].close( level );
			}
		}
		
		// If this is a forced kill, just fck the thing
		if( level )
		{
			var out = [];
			for( var a = 0; a < Doors.applications.length; a++ )
			{
				if( Doors.applications[a] != this )
					out.push( Doors.applications[a] );
			}
			
			// Remove dormant doors!
			if( this.applicationId )
				DormantMaster.delAppDoorByAppId( this.applicationId );
			
			if( this.div && this.div.parentNode )
			{
				this.div.parentNode.removeChild( this.div );
			}
			if( this.parentNode )
			{
				this.parentNode.removeChild( this );
			}
			Doors.applications = out;
			Doors.updateTasks();
		}
		else
		{
			// Tell the jsx application to clean up first
			var o = {
				command: 'quit',
				filePath: '/webclient/jsx/',
				domain:   Doors.runLevels[1].domain
			};
			this.contentWindow.postMessage( JSON.stringify( o ), '*' );
		}
	}
	
	// Close method
	ifr.close = function()
	{
		// Check if iframe has a close event
		if( ifr.onClose )
			ifr.onClose();
		
		// Just remove the application
		ifr.parentNode.removeChild( ifr );
	}
	
	// Register application
	ifr.onload = function()
	{
		// Get document
		var doc = ifr.contentWindow.document;
		
		var jsx = doc.createElement( 'script' );
		
		// Path replacements
		var dpath = '';
		if( path )
		{
			dpath = path.split( /[^\/\:]+\.jsx/i ).join ( '' );
			data = data.split( /progdir\:/i ).join ( dpath );
			data = data.split( /libs\:/i ).join ( document.location.href.split( /[^\/].*\.html/i ).join ( '' ) + '/webclient/' );
			data = data.split( /system\:/i ).join ( document.location.href.split( /[^\/].*\.html/i ).join ( '' ) + '/webclient/' );
			// TODO: Also trap System: and Libs:
		}
		
		jsx.innerHTML = data;
		ifr.contentWindow.document.getElementsByTagName( 'head' )[0].appendChild( jsx );
		
		
		var cid = addWrapperCallback( function()
		{
			if( callback )
			{
				callback( "\n", { response: 'Executable has run.' } );
			}
		} );
		
		var msg = JSON.stringify( { 
			command:          'initappframe', 
			base:             '/',
			applicationId:    ifr.applicationId,
			userId:           ifr.userId,
			theme:            Doors.theme,
			filePath:         '/webclient/jsx/',
			appPath:          dpath ? dpath : '',
			origin:           document.location.href,
			windowId:         false,
			registerCallback: cid
		} );
		ifr.contentWindow.postMessage( msg, Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
	}
	
	// Add application iframe to body
	AttachAppSandbox( ifr );
	
	// Add application
	Doors.applications.push( ifr );
}

// Attach a sandbox
function AttachAppSandbox( ifr, path )
{
	var d = document.createElement( 'div' );
	d.className = 'AppSandbox';
	d.appendChild( ifr );
	ifr.div = d;
	d.ifr = ifr;
	
	var n = document.createElement( 'div' );
	n.className = 'Taskname';
	n.innerHTML = ifr.applicationName;
	d.appendChild( n );
	
	// Make sure we have a path
	if( !path ) path = ifr.src.split( /\/[^/.]*\.html/ )[0];
	
	var x = document.createElement( 'div' );
	var icon = path + '/icon.png';
	ifr.icon = icon;
	x.style.backgroundImage = 'url(' + ifr.icon + ')';
	x.className = 'Close';
	d.appendChild( x );
	
	// On click, quit with force!
	x.onclick = function()
	{ ifr.quit( 1 ); }
	
	ge( 'Tasks' ).appendChild( d );
	
	Doors.updateTasks();
}

// Authorize a permission modification
function AuthorizePermission( app, permissions )
{
	var w = new View( {
		title: i18n( 'application_permissions_change' ),
		width: 400,
		height: 500,
		id: 'activate_permissions_' + app
	} );
	
	var f = new File( 'System:templates/activate.html' );
	f.replacements = {
		'app_activation_head'   : i18n( 'app_activation_head_permissions' ),
		'app_activation_desc'   : i18n( 'app_activation_desc' ),
		'app_activation_button' : i18n( 'app_authorization_button' ),
		'app_activation_abort'  : i18n( 'app_activation_abort' ),
		'application'           : app
	};
	
	f.onLoad = function( d )
	{
		var perms = '';
		var filesystemoptions = '';
		if( permissions )
		{
			for( var a = 0; a < permissions.length; a++ )
			{
				var row = Trim( permissions[a] ).split( ' ' );
				switch( row[0].toLowerCase() )
				{
					case 'door':
						perms += '<p>';
						perms += '<input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_door_access' ) + '</label> ';
						perms += '<select><option value="all">' + 
							i18n( 'all_filesystems' ) + '</option>' + filesystemoptions + '</select>';
						perms += '.</p>';
						break;
					case 'module':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					case 'service':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						break;
					default:
						continue;
				}
			}
		}
		w.setContent( d.split( '{permissions}' ).join ( perms ) );
		var eles = w.getWindowElement().getElementsByTagName( 'button' );
		var abtn = false, cbtn = false;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].className == 'activation' )
			{
				abtn = eles[a];
			}
			else if( eles[a].className == 'cancel' )
			{
				cbtn = eles[a];
			}
		}
		if( abtn && cbtn )
		{
			abtn.onclick = function()
			{
				ExecuteApplicationActivation( app, w, conf.Permissions, 'reactivate' );
			}
			cbtn.onclick = function()
			{
				w.close();
			}
		}
	}
	f.load();
}
