/*©agpl*************************************************************************
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
*****************************************************************************©*/

var _appNum = 1;

// Load a javascript application into a sandbox
function ExecuteApplication( app, args, callback )
{
	// Check if the app called is found in the singleInstanceApps array
	if( friend.singleInstanceApps[ app ] )
	{
		var msg = {
			command: 'cliarguments',
			args: args
		};
		if( callback )
		{
			msg.cid = addWrapperCallback( callback );
			msg.type = 'callback';
		}
		// If it is found, send the message directly to the app instead of relaunching
		friend.singleInstanceApps[ app ].contentWindow.postMessage( JSON.stringify( msg ), '*' );
		return;
	}

	// Common ones
	switch( app.toLowerCase() )
	{
		case 'shell':
		case 'newshell':
		case 'new shell':
		case 'cli':
			app = 'FriendShell';
			break;
	}

	// Args should be arguments to application in string form! for example filename
	if( typeof( args ) != 'string' ) args = '';

	var workspace = 0; // Default workspace

	// Filter arguments
	var aout = [];
	args = args.split( ' ' );
	for( var a = 0; a < args.length; a++ )
	{
		var pair = args[a].split( '=' );
		if( pair.length > 1 )
		{
			switch( pair[0] )
			{
				case 'workspace':
					workspace = parseInt( pair[1] );
					if( !workspace ) workspace = 0;
					break;
				default:
					aout.push( args[a] );
					break;
			}
		}
		else aout.push( args[a] );
	}
	args = aout.join( ' ' );

	// TODO: Make this safe!
	if( app.indexOf( ':' ) > 0 && app.indexOf( '.jsx' ) > 0 )
	{
		return ExecuteJSXByPath( app, args, callback, undefined );
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
		var conf = false;
		try
		{
			conf = JSON.parse( d );
		}
		catch( e )
		{
			//
		}

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
				var hideView = false;
				if( d.toLowerCase().indexOf('"trusted":"yes"') > 0 )
				{
					hideView = true;
				}

				var title = i18n( 'install_question_mintitle' ) + ': ' + app;
				var w = new View( {
					title:  title,
					width:  480,
					height: 140,
					id:     'system_install_' + app,
					hidden: hideView
				} );

				var f = new File( 'System:templates/install.html' );
				f.onLoad = function( data )
				{
					var repl = [ 'install_question_desc', 'install_question_title',
								 'install_button', 'install_cancel' ];
					for( var a in repl ) data = data.split( '{' + repl[a] + '}' ).join ( i18n( repl[a] ) );
					data = data.split( '{app}' ).join ( app );
					w.setContent( data );
					if( hideView )
					{
						console.log('view is hidden == trusted app == click install');
						InstallApplication(app);

					}
				}
				f.load();
			}
			else if( r == 'fail' && conf && conf.response == 'application not signed' )
			{
				Ac2Alert( i18n( 'application_not_signed' ) );
			}
			else if( r == 'fail' && conf && conf.response == 'application not validated' )
			{
				Ac2Alert( i18n( 'application_not_validated' ) );
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

			// Correct filepath can be a resource file (i.e. in a repository) or a local file
			var filepath = '/system.library/module/?module=system&command=resource&authid=' + conf.AuthID + '&file=' + app + '/';
			// Here's the local file..
			if( conf && conf.ConfFilename && conf.ConfFilename.indexOf( 'resources/webclient/apps' ) >= 0 )
				filepath = '/webclient/apps/' + app + '/';

			// Security domain
			var applicationId = md5( app + '-' + (new Date()).getTime() );
			SubSubDomains.reserveSubSubDomain( applicationId );
			var sdomain = GetDomainFromConf( conf, applicationId );
			
			// Load application into a sandboxed iframe
			var ifr = document.createElement( 'iframe' );
			// Only sandbox when it's on another domain
			if( document.location.href.indexOf( sdomain ) != 0 )
				ifr.setAttribute( 'sandbox', 'allow-forms allow-scripts' );
			ifr.path = conf.Path;

			// Set the conf
			ifr.conf = conf && conf.ConfFilename ? conf.ConfFilename : false;
			ifr.config = conf ? conf : false; // Whole object

			// Proper way to run by conf.init
			if( conf.Init )
			{
				if( conf.Init.indexOf( ':' ) > 0 && conf.Init.indexOf( '.jsx' ) > 0 )
				{
					return ExecuteJSXByPath( conf.Init, args, callback, conf );
				}
				// TODO: Check privileges of one app to launch another!
				else
				{
					var sid = Workspace.sessionId && Workspace.sessionId != 'undefined' ?
						Workspace.sessionId : Workspace.conf.authId;
					var svalu = sid ? Workspace.sessionId : Workspace.conf.authId;
					var stype = sid ? 'sessionid' : 'authid';
					ifr.src = sdomain + '/system.library/module?module=system&' +
						stype + '=' + svalu + '&command=launch&app=' +
						app + '&friendup=' + Doors.runLevels[0].domain;
				}
			}
			else
			{
				ifr.src = sdomain + filepath + 'index.html?friendup=' + sdomain;
			}

			// Register name and ID
			ifr.applicationName = app.indexOf( ' ' ) > 0 ? app.split( ' ' )[0] : app;
			ifr.userId = Workspace.userId;
			ifr.username = Workspace.loginUsername;
			ifr.workspace = workspace;
			ifr.applicationId = applicationId;
			ifr.id = 'sandbox_' + ifr.applicationId;
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
				if( this.widgets )
				{
					for( var a in this.widgets )
					{
						this.widgets[a].close( level );
					}
				}

				FlushSingleApplicationLock( this.applicationName );

				// On level, destroy app immediately
				if( level )
				{
					var out = [];
					for( var a = 0; a < Workspace.applications.length; a++ )
					{
						if( Doors.applications[a] != this )
							out.push( Doors.applications[a] );
					}

					// Remove dormant doors!
					DormantMaster.delAppDoorByAppId( this.applicationId );

					var d = this.div;
					if( d ) d.parentNode.removeChild( d );
					this.parentNode.removeChild( this );
					Workspace.applications = out;
					Workspace.updateTasks();
				}
				// Tell the application to clean up first
				else
				{
					var o = {
						command: 'quit',
						applicationId: this.applicationId,
						userId: this.userId,
						authId: this.authId,
						filePath: sdomain + filepath,
						domain:   sdomain
					};
					this.contentWindow.postMessage( JSON.stringify( o ), '*' );
				}
				// Cleans subSubDomains allocation
				SubSubDomains.freeSubSubDomain( this.applicationId );
			}

			// Close method
			ifr.close = function()
			{
				// Check if iframe has a close event
				if( ifr.onClose ) ifr.onClose();

				// Just remove the application
				ifr.parentNode.removeChild( ifr );

				// Cleans subSubDomains allocation
				SubSubDomains.freeSubSubDomain( this.applicationId );
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

				// Args could be sent in JSON format, then try to give this on.
				var oargs = args;
				try
				{
					oargs = JSON.parse( decodeURIComponent( args ) );
				}
				catch( e )
				{
					oargs = args;
				}

				var o = {
					command: 'register',
					applicationId: ifr.applicationId,
					applicationName: ifr.applicationName,
					userId: ifr.userId,
					username: ifr.username,
					authId: ifr.authId,
					args: oargs,
					workspace: workspace,
					locale: Workspace.locale,
					theme: Workspace.theme,
					filePath: sdomain + filepath,
					domain:   sdomain,
					registerCallback: cid,
					clipboard: friend.clipboard
				};
				if( conf.State ) o.state = conf.State;

				// Get JSON data from url
				var vdata = GetUrlVar( 'data' ); if( vdata ) o.data = vdata;

				// Language support
				if( conf.language )
				{
					o.spokenLanguage = conf.language.spokenLanguage;
					o.alternateLanguage = conf.language.spokenAlternate;
				}
				this.contentWindow.postMessage( JSON.stringify( o ), '*' );
			}

			// Add application iframe to body
			AttachAppSandbox( ifr, sdomain + filepath );

			// Add application
			Workspace.applications.push( ifr );
		}
		else
		{
			if( callback ) callback( "\n", { response: 'Executable has run.' } );
		}
	}
	var eo = { application: app, args: args };
	if( Workspace.conf && Workspace.conf.authid )
		eo.authid = Workspace.conf.authid;
	m.execute( 'friendapplication', eo );
}

function FlushSingleApplicationLock( app )
{
	// Flush single instance app!
	var out = [];
	for( var a in friend.singleInstanceApps )
		if( a != app )
			out[a] = friend.singleInstanceApps[a];
	friend.singleInstanceApps = out;
}

// Kill an app by name or PID
KillApplication = function ( n, level )
{
	var killed = 0;
	if( !level ) level = 1;
	if( typeof( n ) == 'number' )
	{
		if( Workspace.applications[n] )
		{
			FlushSingleApplicationLock( Workspace.applications[n].applicationName );
			Workspace.applications[n].quit( level );
			if( !ge( 'TasksHeader' ) ) return false;
			ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks (' + ge( 'Tasks' ).childNodes.length + ')' ) + '</h2>';
			return true;
		}
	}
	else if ( typeof( n ) == 'object' )
	{
		for( var a = 0; a < Workspace.applications.length; a++ )
		{
			var d = Workspace.applications[a];
			if( d == n )
			{
				FlushSingleApplicationLock( d.applicationName );
				//console.log( "Killed one application by name ("+d.applicationName+")." );
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
			for( var a = 0; a < Workspace.applications.length; a++ )
			{
				var d = Workspace.applications[a];
				if( d.applicationName == n )
				{
					FlushSingleApplicationLock( n );
					//console.log( "Killed one application ("+d.applicationName+")." );
					d.quit( level );
					killed++;
					sk = 1;
					break;
				}
			}
			if( sk == 0 ) found = false;
		}
	}
	if( ge( 'TasksHeader' ) )
		ge( 'TasksHeader' ).innerHTML = '<h2>' + i18n( 'Running tasks (' + ge( 'Tasks' ).childNodes.length + ')' ) + '</h2>';
	return killed;
}

function KillApplicationById( appid, level )
{
	var killed = 0;
	for( var a = 0; a < Workspace.applications.length; a++ )
	{
		var d = Workspace.applications[a];
		if( d.applicationId == appid )
		{
			FlushSingleApplicationLock( d.applicationName );
			//console.log( "Killed one application by id ("+d.applicationName+")." );
			d.quit( level );
			killed++;
		}
	}
}

// Activate the application for the user
function ActivateApplication( app, conf )
{
	var type = 'app';

	if( conf && conf.type == 'disk' )
	{
		type = 'disk';
		// Defaults
		conf.Permissions = [
			'Module System',
			'Module Files',
			'Door All'
		];
	}

	var hideView = false;
	if( conf && conf.Trusted && conf.Trusted.toLowerCase() == 'yes' )
	{
		hideView = true;
	}

	var w = new View( {
		title: i18n( type == 'app' ? 'activate_application' : 'activate_disk' ),
		width: 400,
		height: 500,
		id: 'activate_' + app,
		hidden: hideView
	} );

	var f = new File( 'System:templates/activate.html' );
	f.replacements = {
		'app_activation_button' : i18n( 'app_activation_button' ),
		'app_activation_abort'  : i18n( 'app_activation_abort' ),
	};
	f.i18n();
	f.replacements.app_activation_head = i18n( type == 'app' ? 'app_activation_head' : 'disk_activation_head' );
	f.replacements.app_activation_desc = i18n( type == 'app' ? 'app_activation_desc' : 'disk_activation_desc' );
	f.replacements.application         = type == 'app' ? app : ( app.split( ':' )[0] );
	f.onLoad = function( d )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, da )
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

			// Check the security domains
			var domains = [];
			if( e == 'ok' )
			{
				try{
					var data = JSON.parse( da );
					domains = data.domains;
				} catch( e ) { console.log('Security Domains could not be set!'); }
			}
			if( ge( 'SecurityDomains' ) )
			{
				ge( 'SecurityDomains' ).innerHTML = '';
				for( var a = 0; a < domains.length; a++ )
				{
					var o = document.createElement( 'option' );
					o.innerHTML = Trim( domains[a] );
					o.value = Trim( domains[a] );
					ge( 'SecurityDomains' ).appendChild( o );
				}
			}

			var wel = w.getWindowElement();
			if( wel )
			{
				var eles = wel.getElementsByTagName( 'button' );
				var abtn = false;
				for( var a = 0; a < eles.length; a++ )
				{
					if( eles[a].classList.contains( 'activation' ) )
					{
						abtn = eles[a];
					}
				}
				if( abtn )
				{
					abtn.onclick = function()
					{
						ExecuteApplicationActivation( app, w, conf.Permissions );
					}
				}
			}
			if( hideView )
			{
				//console.log('view is hidden... == trusted app == auto activate')
				ExecuteApplicationActivation( app, w, conf.Permissions );
			}
		}
		m.execute( 'securitydomains' );
	}
	f.load();
}

function InstallApplication( app )
{
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		//console.log( e + ' -> ' + d );
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

	var securityDomain = '';
	if( ge( 'SecurityDomains' ) )
	{
		securityDomain = ge( 'SecurityDomains' ).value;
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

				// Disk activation
				if( app.indexOf( ':' ) > 0 )
				{
					var s = new Library( 'system.library' );
					s.onExecuted = function()
					{
						// Refresh mountlist (async)
						ExecuteApplication( app );
					}
					s.execute( 'device/refresh', { devname: app.split( ':' )[0] + ':' } );
				}
				// Normal activation
				else
				{
					ExecuteApplication( app );
				}
			}
			else
			{
				Ac2Alert( i18n( 'failed_application_activation' ) );
				win.close();
			}
		}
		var argz = { application: app, permissions: out, domain: securityDomain };
		if( reactivation ) argz.reactivation = '1';
		m.execute( 'activateapplication', argz );
	}
	else
	{
		Ac2Alert( i18n( 'no_activation_fields_checked' ) );
	}
}

// Do it by path!
function ExecuteJSXByPath( path, args, callback, conf )
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
			var r = ExecuteJSX( data, app, args, path, callback, conf ? conf.ConfFilename : false );
			if( callback ) callback( true );
			return r;

		}
		if( callback ) callback( false );
	}
	f.load();
}

function ExecuteJSX( data, app, args, path, callback, conf )
{
	if( data.indexOf( '{' ) < 0 ) return;

	// Only run jsx after refreshing desktop to get mounted drives
	Workspace.refreshDesktop( function()
	{
		var drive = path.split( ':' )[0] + ':';
		var d = ( new Door( drive ) ).get( drive );

		// Running system with a drive config..
		if( d )
		{
			// Check if d.Config is empty or not set
			if( !d.Config || ( d.Config && d.Config == '{}' ) || JSON.stringify( d.Config ) == '{}' )
			{
				return ActivateApplication( path, { type: 'disk' } );
			}
			else
			{
				conf = d.Config;
			}
		}

		// Load application into a sandboxed iframe
		var ifr = document.createElement( 'iframe' );
		ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts' );
		ifr.path = '/webclient/jsx/';

		args = typeof( args ) != 'string' ? '' : args;

		completeLaunch( data, app, args, path, callback, conf );

		function completeLaunch( data, app, args, path, callback, conf, html )
		{
			// Special case, we have a conf
			var sid = false;
			var confObject = false;
			var applicationId = app + '-' + (new Date()).getTime();
			if( conf )
			{
				var dom = GetDomainFromConf( conf, applicationId );

				if( args ) conf.args = args;

				if( typeof( conf ) == 'object' )
				{
					confObject = conf;
					conf = JSON.stringify( conf );
				}
				else if( conf.indexOf && conf.indexOf( '{' ) >= 0 )
				{
					confObject = JSON.parse( conf );
				}
				sid = confObject && confObject.authid ? true : false;
				var svalu = sid ? confObject.authid : Workspace.sessionId;
				var stype = sid ? 'authid' : 'sessionid';
				if( stype == 'sessionid' ) ifr.sessionId = svalu;

				// Use path to figure out config
				if( conf.indexOf( '{' ) >= 0 )
					conf = encodeURIComponent( path.split( ':' )[0] + ':' );

				ifr.src = dom + '/system.library/module/?module=system&command=sandbox' +
					'&' + stype + '=' + svalu +
					'&conf=' + conf + '&' + ( args ? ( 'args=' + args ) : '' );
				ifr.conf = confObject;
			}
			// Just give a dumb sandbox
			else ifr.src = '/webclient/sandboxed.html?' + ( args ? ( 'args=' + args ) : '' );

			// Register name and ID
			ifr.applicationName = app;
			ifr.applicationNumber = _appNum++;
			ifr.applicationId = app + '-' + (new Date()).getTime();
			ifr.userId = Workspace.userId;
			ifr.username = Workspace.loginUsername;
			ifr.applicationType = 'jsx';
			if( sid ) ifr.sessionId = Workspace.sessionId; // JSX has sessionid
			else ifr.authId = conf.authid;

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
				if( this.widgets )
				{
					for( var a in this.widgets )
					{
						this.widgets[a].close( level );
					}
				}

				// If this is a forced kill, just fck the thing
				if( level )
				{
					var out = [];
					for( var a = 0; a < Workspace.applications.length; a++ )
					{
						if( Workspace.applications[a] != this )
							out.push( Workspace.applications[a] );
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
					Workspace.applications = out;
					Workspace.updateTasks();
				}
				else
				{
					// Tell the jsx application to clean up first
					var o = {
						command: 'quit',
						filePath: '/webclient/jsx/',
						domain:   sdomain
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
				try
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
					}

					/*
					var content =
					'// This is the main run function for jsx files and FriendUP js apps' +
					' Application.run = function( msg )' +
					'{' +
						'// Make a new window with some flags' +
						'this.mainView = new View(' +
						'{' +
						'	title: i18n("Ceci est un titre"),' +
						'	width: 384,' +
						'	height: 600' +
						'} );' +
						'// Load a file from the same dir as the jsx file is located' +
						'var content = '
						'var self = this;' +
						'var f = new File( "Progdir:Templates/index.html" );' +
						'f.onLoad = function( data )' +
						'{' +
						'	// Set it as window content' +
						'	self.mainView.setContent( data );' +
						'}' +
						'f.load();' +
						'// On closing the window, quit.' +
						'this.mainView.onClose = function()' +
						'{' +
						'	Application.quit();' +
						'}' +
					'};';
					*/

					jsx.innerHTML = data;

					ifr.contentWindow.document.getElementsByTagName( 'head' )[0].appendChild( jsx );


					var cid = addWrapperCallback( function()
					{
						if( callback )
						{
							callback( "\n", { response: 'Executable has run.' } );
						}
					} );

					var msg = {
						command:          'initappframe',
						base:             '/',
						applicationId:    ifr.applicationId,
						userId:           ifr.userId,
						username:         ifr.username,
						theme:            Workspace.theme,
						locale:           Workspace.locale,
						filePath:         '/webclient/jsx/',
						appPath:          dpath ? dpath : '',
						authId:           ifr.authId, // JSX may have authid
						sessionId:        ifr.sessionId, // or JSX has sessionid
						origin:           document.location.href,
						viewId:         false,
						registerCallback: cid,
						clipboard:        friend.clipboard,
						args:			  args
					};

					if( !msg.authId && ifr.conf.authid ) msg.authId = ifr.conf.authid;
					if( !msg.sessionId && ifr.conf.sessionid ) msg.sessionId = ifr.conf.sessionid;

					msg = JSON.stringify( msg );

					// Get JSON data from url
					var vdata = GetUrlVar( 'data' ); if( vdata ) msg.data = vdata;

					ifr.contentWindow.postMessage( msg, Workspace.protocol + '://' + ifr.src.split( '//' )[1].split( '/' )[0] );
				}
				catch( e )
				{
					Notify({'title':i18n('i18n_error'),'description':i18n('i18n_could_not_run_jsx')});
				}
			}

			// Fix to prevent Tree application from launching in a loop
			if ( !Workspace.treeRunningApplications )
				Workspace.treeRunningApplications = [];
			Workspace.treeRunningApplications.push( path );

			// Add application iframe to body
			AttachAppSandbox( ifr );

			// Add application
			Workspace.applications.push( ifr );
		}
	}, true );
}

function ReplaceString( template, search, replace )
{
	var pos = template.indexOf( search );
	while( pos >= 0 )
	{
		template = template.substring( 0, pos ) + replace + template.substring( pos + search.length );
		pos = template.indexOf( search );
	}
	return template;
};

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
	var icon = path.indexOf( '?' ) < 0 ? ( path + '/icon.png' ) : '/webclient/gfx/icons/64x64/mimetypes/application-x-javascript.png';
	ifr.icon = icon;
	x.style.backgroundImage = 'url(' + ifr.icon + ')';
	x.className = 'Close';
	var img = document.createElement( 'img' );
	img.src = ifr.icon;
	img.onload = function()
	{
		// TODO: Do something on load?
	}
	x.appendChild( img );
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
		var abtn = false;
		for( var a = 0; a < eles.length; a++ )
		{
			if( eles[a].classList.contains( 'activation' ) )
			{
				abtn = eles[a];
			}
		}
		if( abtn )
		{
			abtn.onclick = function()
			{
				ExecuteApplicationActivation( app, w, conf.Permissions, 'reactivate' );
			}
		}
	}
	f.load();
}

// Extract the security domain from conf object
function GetDomainFromConf( conf, applicationId )
{
	if( !conf ) return Workspace.runLevels[1].domain;
	var port = document.location.href.match( /h[^:]*?\:\/\/[^:]+([^/]+)/i );
	if( port.length < 2 ) port = ''; else port = port[1];
	var sdomain = conf.State && conf.State.domain ? ( _protocol + '://' + conf.State.domain + port ) : Workspace.runLevels[1].domain;

	if ( applicationId )
		sdomain = SubSubDomains.getSubSubDomainUrl( applicationId, sdomain );

	return sdomain;
}

/**
 * Security subSubDomains handling
 */
SubSubDomains =
{
	initialized: false,
	subSubDomains: {},
	subSubDomainsCount: 0,
	subSubDomainsMax: 0,
	subSubDomainsRoot: null,
	whiteList:
	[
		'FriendChat',
		'FriendShell',
		'Panzers'
	],

	initSubSubDomains: function()
	{
		if ( this.initialized )
			return;

		var self = this;
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if ( e === 'ok' && d !== '' )
			{
				if ( d.indexOf( 'fail<!--separate-->' ) < 0 )
				{
					var data = JSON.parse( d );
					if ( data.subdomainsroot && typeof data.subdomainsnumber != 'undefined' )
					{
						self.subSubDomainsRoot = data.subdomainsroot;
						self.subSubDomainsMax = data.subdomainsnumber;
					}
					if ( self.subSubDomainsMax > 0 )
					{
						console.log( 'Security subdomains activated, number of domains: ' + self.subSubDomainsMax + ', root name: ' + self.subSubDomainsRoot );
						self.initialized = 1;
						return;
					}
					console.log( 'Security subdomains not activated');
					self.initialized = -1;
					return;
				}
			}
			console.log( 'Security subdomains not activated (security section not found in cfg.ini)' );
			self.initialized = -1;
		}
		m.execute( 'getsecuritysettings' );
	},
	reserveSubSubDomain: function( applicationId )
	{
		if ( this.initialized != 1 )
			return;

		var id = applicationId.substring( 0, applicationId.indexOf( '-' ) );
		if ( this.isWhiteListedApplication( id ) )
		{
			console.log( 'Security subdomains, application ' + id + ' is on white list, no subdomain allocated for it.' )
			return;
		}

		if ( this.subSubDomainsCount < this.subSubDomainsMax )
		{
			var name;
			if ( !this.subSubDomains[ id ] )
			{
				// One more subSubDomain
				this.subSubDomainsCount++;

				// Find  a free slot
				var map = [];
				for ( var m = 0; m < this.subSubDomainsMax; m++ )
					map[ m ] = true;
				for ( var m in this.subSubDomains )
					map[ this.subSubDomains[ m ].number ] = false;
				for ( m = 0; m < this.subSubDomainsMax; m++ )
				{
					if ( map[ m ] )
						break;
				}

				// Protection in case sonething went wrong and no slot is available
				if ( m < this.subSubDomainsMax )
				{
					// Creates the entry
					var num = '' + ( m + 1);
					if ( num.charAt( 0 ) == '0' )
						num = num.substring( 1 );
					name = this.subSubDomainsRoot + num;
					this.subSubDomains[ id ] =
					{
						name: name,
						useCount: 1,
						number: m
					}
				}
			}
			else
			{
				this.subSubDomains[ id ].useCount++;
			}
			console.log( 'Security subdomain ' + name + ' enabled for application ' + id  + ', remaining pool ' + ( this.subSubDomainsMax - this.subSubDomainsCount ) + ' out of ' + this.subSubDomainsMax );
			return true;
		}
		if ( this.subSubDomainsMax > 0 )
			console.log( 'Security subdomains, out of stock! ( maximum ' + this.subSubDomainsMax + ' reached )' );
		return false;
	},
	freeSubSubDomain: function( applicationId )
	{
		if ( this.initialized != 1 )
			return;

		var id = applicationId.substring( 0, applicationId.indexOf( '-' ) );
		if ( this.isWhiteListedApplication( id ) )
			return;

		if ( this.subSubDomains[ id ] )
		{
			this.subSubDomains[ id ].useCount--;
			if ( this.subSubDomains[ id ].useCount == 0 )
			{
				this.subSubDomainsCount--;
				var temp = {};
				for ( i in this.subSubDomains )
				{
					if ( i != id )
						temp[ i ] = this.subSubDomains[ i ];
				}
				this.subSubDomains = temp;
				console.log( 'Security subdomain removed for application ' + id );
			}
		}
	},
	getSubSubDomainUrl: function( applicationId, url )
	{
		if ( this.initialized == 1 )
		{
			var id = applicationId.substring( 0, applicationId.indexOf( '-' ) );
			if ( !this.isWhiteListedApplication( id ) )
			{
				if ( this.subSubDomains[ id ] )
				{
					var pos = url.indexOf( '//' );
					if ( pos > 0 )
						url = url.substring( 0, pos + 2 ) + this.subSubDomains[ id ].name + '.' + url.substring( pos + 2 );
				}
			}
		}
		return url;
	},
	isWhiteListedApplication: function( id )
	{
		for ( var a = 0; a < this.whiteList.length; a++ )
		{
			if ( id === this.whiteList[ a ] )
				return true;
		}
		return false;
 	}
}
