/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

var _appNum = 1;

var _executionQueue = {};

function RemoveFromExecutionQueue( app )
{
	try
	{
		var out = {};
		for( var a in _executionQueue )
			if( a != app )
				out[ a ] = true;
		_executionQueue = out;
	}
	// Something went wrong, flush
	catch( e )
	{
		console.log( 'Problem!' );
		mobileDebug( 'Something failed with execution queue.', true );
		_executionQueue = {};
	}
}

// Load a javascript application into a sandbox
function ExecuteApplication( app, args, callback )
{
	var appName = app;
	if( app.indexOf( ':' ) > 0 )
	{
		if( app.indexOf( '/' ) > 0 )
			appName = app.split( '/' ).pop();
		else appName = app.split( ':' ).pop();
	}
	
	// You need to wait with opening apps until they are loaded by app name
	if( _executionQueue[ appName ] )
	{
		if( callback )
			callback( false, { response: false, message: 'Already run.', data: 'executed' } );
		return;
	}

	// Register that we are executing
	_executionQueue[ appName ] = true;

	if( isMobile )
	{
		Workspace.goToMobileDesktop();
		if( Workspace.widget )
			Workspace.widget.slideUp();
		if( Workspace.mainDock )
			Workspace.mainDock.closeDesklet();
	}
	
	if( args )
	{ 
		Workspace.lastLaunchedAppArgs = args; 
	}

	// Hide current app
	if( window.FriendVR )
	{
		window.FriendVR.hideCurrentApplication();
	}

	mousePointer.clear();

	// Check if the app called is found in the singleInstanceApps array
	if( Friend.singleInstanceApps[ appName ] )
	{
		// Clean blocker
		RemoveFromExecutionQueue( appName );
		
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
		Friend.singleInstanceApps[ appName ].contentWindow.postMessage( JSON.stringify( msg ), '*' );
		for( var a in Friend.singleInstanceApps[ appName ].windows )
		{
			_ActivateWindow( Friend.singleInstanceApps[ appName ].windows[ a ]._window.parentNode );
			_WindowToFront( Friend.singleInstanceApps[ appName ].windows[ a ]._window.parentNode );
			if( callback )
				callback( false, { response: false, message: 'Already run.', data: 'executed' } );
			return;
		}
		f( callback )
			callback( false, { response: false, message: 'Already run.', data: 'executed' } );
		return;
	}
	// Only allow one app instance in mobile!
	else if( isMobile )
	{
		for( var a in Workspace.applications )
		{
			if( Workspace.applications[ a ].applicationName == appName )
			{
				var app = Workspace.applications[ a ];
				for( var z in app.windows )
				{
					_ActivateWindow( app.windows[ z ]._window.parentNode );
					_WindowToFront( app.windows[ z ]._window.parentNode );
					
					// Clean blocker
					RemoveFromExecutionQueue( appName );
					
					// Tell that we didn't launch
					if( callback )
						callback( false, { response: false, message: 'Already run.', data: 'executed' } );
					return;
				}
			}
		}
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
		// Remove from execution queue
		RemoveFromExecutionQueue( appName );
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

		// Remove blocker
		RemoveFromExecutionQueue( appName );
		// console.log( 'Test3: Executed. Removing appqueue: ' + appName );
		
		if( r == 'activate' )
		{
			ActivateApplication( app, conf );
			if( callback ) callback( false );
			
			return false;
		}
		else if( r != 'ok' )
		{
			// console.log( 'Test2: Executing app Was not ok.' );
			
			if( r == 'notinstalled' || ( conf && conf.response == 'not installed' ) )
			{
				var hideView = false;
				if( d.toLowerCase().indexOf('"trusted":"yes"') > 0 )
				{
					hideView = true;
				}

				
				// Just use callback
				if( callback )
				{
					if( !callback( { error: 2, errorMessage: i18n( 'install_question_title' ) } ) )
					{
						return;
					}
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
						InstallApplication( app );

					}
				}
				f.load();
			}
			else if( r == 'fail' && conf && conf.response == 'application not signed' )
			{
				// Just use callback
				if( callback )
				{
					return callback( { error: 1, errorMessage: i18n( 'application_not_signed' ) } );
				}
				Ac2Alert( i18n( 'application_not_signed' ) );
			}
			else if( r == 'fail' && conf && conf.response == 'application not validated' )
			{
				if( callback )
				{
					return callback( { error: 1, errorMessage: i18n( 'application_not_validated' ) } );
				}
				Ac2Alert( i18n( 'application_not_validated' ) );
			}
			else
			{
				if( callback )
				{
					return callback( { error: 1, errorMessage: i18n( 'application_not_found' ) } );
				}
				Ac2Alert( i18n( 'application_not_found' ) );
			}
			if( callback ) callback( false );
			// console.log( 'Test2: Dead.' );
			
			// Clean up single instance
			var o = {};
			for( var a in Friend.singleInstanceApps )
				if( a != appName )
					o[ a ] = Friend.singleInstanceApps[ a ];
			Friend.singleInstanceApps = o;
			// Kill app if it is there
			KillApplication( appName );
			
			return false;
		}

		// 2. If the application is activated, run it...........................
		if( typeof( conf ) == 'object' )
		{
			if( typeof( conf.API ) == 'undefined' )
			{
				if( callback )
				{
					return callback( { error: 1, errorMessage: 'Can not run v0 applications.' } );
				}
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
			var applicationId = md5( app + '-' + ( new Date() ).getTime() );
			SubSubDomains.reserveSubSubDomain( applicationId );
			var sdomain = GetDomainFromConf( conf, applicationId );
			
			// Open the Dormant drive of the application
			var drive = null;
			if( conf.DormantDisc )
			{
				var options =
				{
					name: conf.DormantDisc.name ? conf.DormantDisc.name : app,
					type: 'applicationDisc',
					capacity: conf.DormantDisc.size ? conf.DormantDisc.size : 1024 * 1024,
					persistent: conf.DormantDisc.persistent,
					automount: 'yes' // conf.DormantDisc.automount ? conf.DormantDisc.automount : false
				}				
				drive = Friend.Doors.Dormant.createDrive( options, function( response, data, extra )
				{
					// Do something?
				} );
			}
			
			// Load application into a sandboxed iframe
			var ifr = document.createElement( 'iframe' );
			// Only sandbox when it's on another domain
			if( document.location.href.indexOf( sdomain ) != 0 )
				ifr.setAttribute( 'sandbox', DEFAULT_SANDBOX_ATTRIBUTES );
			ifr.path = conf.Path;

			// Set the conf
			ifr.conf = conf && conf.ConfFilename ? conf.ConfFilename : false;
			ifr.config = conf ? conf : false; // Whole object
			ifr.drive = drive;
			
			// Set startupsequence flag on apps that are launched this way
			// Except the first app which will operate like normal
			if( window.ScreenOverlay && ScreenOverlay.visibility && ( ScreenOverlay.launchIndex > 0 || Workspace.applications.length > 0 ) )
			{
				ifr.startupsequence = true;
			}

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
						Workspace.sessionId : ( Workspace.conf && Workspace.conf.authid ? Workspace.conf.authId : '');
					var svalu = sid ? Workspace.sessionId :( Workspace.conf && Workspace.conf.authid ? Workspace.conf.authId : '');
					var stype = sid ? 'sessionid' : 'authid';
					
					// Quicker ajax implementation
					var j = new cAjax();
					j.open( 'POST', '/system.library/module?module=system&' +
						stype + '=' + svalu + '&command=launch&app=' +
						app + '&friendup=' + escape( Doors.runLevels[0].domain ), true );
					j.onload = function()
					{	
						ws = this.rawData.split( 'src="/webclient/js/apps/api.js"' ).join( 'src="' + _applicationBasics.apiV1 + '"' );
						ifr.src = URL.createObjectURL(new Blob([ws],{type:'text/html'}));
					}
					j.send();
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
			ifr.userLevel = Workspace.userLevel;
			ifr.workspace = workspace;
			ifr.applicationId = applicationId;
			ifr.workspaceMode = Workspace.workspacemode;
			ifr.id = 'sandbox_' + ifr.applicationId;
			ifr.authId = conf.AuthID;
			ifr.applicationNumber = _appNum++;
			ifr.permissions = conf.Permissions;

			// Quit the application
			ifr.quit = function( level )
			{
				// Clean blocker
				RemoveFromExecutionQueue( appName );
				
				// Check vr
				if( window.FriendVR )
				{
					window.FriendVR.killApplication( this.applicationId );
				}
				
				if( this.windows )
				{
					for( var a in this.windows )
					{
						this.windows[a].quitting = true;
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
				
				// Flush notifications
				if( Workspace.appFilesystemEvents )
				{
					// Check if we need to handle events for apps
					if( Workspace.appFilesystemEvents[ 'filesystem-change' ] )
					{
						var evList = Workspace.appFilesystemEvents[ 'filesystem-change' ];
						var outEvents = [];
						for( var a = 0; a < evList.length; a++ )
						{
							if( evList[a].applicationId != this.applicationId )
							{
								outEvents.push( evList[a] );
							}
						}
						// Update events
						Workspace.appFilesystemEvents[ 'filesystem-change' ] = outEvents;
					}
				}

				FlushSingleApplicationLock( this.applicationName );

				// Tell the Dormant disc to finish tasks and destroy itself
				if ( this.drive )
				{
					Friend.Doors.Dormant.destroyDrive( this.drive, { completeAndDie: true, timeout: 1000 * 60 * 60 }, function( response, data, extra ) 
					{
						if ( data == 'killed' )
						{
							console.log( 'Dormant disc destroyed before end of tasks: ' + extra );
						};
					}, this.applicationName )
				}

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
				
				// Silently close message port
				ApplicationMessagingNexus.close( this.applicationId );
			}
			
			ifr.sendMessage = function( msg )
			{
				if( this.contentWindow )
				{
					msg.applicationId = this.applicationId;
					msg.applicationName = this.applicationName;
					amsg = JSON.stringify( msg );
					this.contentWindow.postMessage( amsg, '*' );
				}
			}

			// FIXME: Francois here we close the iframe!
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
				// Clean blocker
				RemoveFromExecutionQueue( appName );
				
				// Make sure pickup items are cleared
				mousePointer.clear();
				
				var cid = addWrapperCallback( function( data )
				{
					if( callback )
					{
						callback( "\n", { response: 'Executable has run.', result: data == 'registered' } );
						callback = null;
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
					workspaceMode: Workspace.workspacemode,
					userId: ifr.userId,
					userLevel: ifr.userLevel,
					username: ifr.username,
					authId: ifr.authId,
					args: oargs,
					workspace: workspace,
					dosDrivers: Friend.dosDrivers,
					locale: Workspace.locale,
					theme: Workspace.theme,
					themeData: Workspace.themeData,
					workspaceMode: Workspace.workspacemode,
					filePath: sdomain + filepath,
					domain:   sdomain,
					registerCallback: cid,
					clipboard: Friend.clipboard,
					cachedAppData: _applicationBasics
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
			
			// Five second timeout to receive a response
			setTimeout( function()
			{
				if( callback )
				{
					callback( false );
				}
			}, 5000 );
			
			// Register this app as the last executed
			// Register this app as the last executed
			if( Workspace.currentExecutedApplication )
			{
				Workspace.prevExecutedApplication = Workspace.currentExecutedApplication;
			}
			Workspace.currentExecutedApplication = ifr.applicationId;
		}
		else
		{
			if( callback ) callback( "\n", { response: 'Executable has run.' } );
			
			// Clean blocker
			RemoveFromExecutionQueue( appName );
		}
	}
	var eo = { application: app, args: args };
	if( Workspace.conf && Workspace.conf.authid )
		eo.authid = Workspace.conf.authid;
	m.onQueue = function()
	{
		// Clean blocker
		RemoveFromExecutionQueue( appName );
	}
	m.execute( 'friendapplication', eo );
	// console.log( 'Test3: Executing application: ' + app );
}

function FlushSingleApplicationLock( app )
{
	// Flush single instance app!
	var out = [];
	for( var a in Friend.singleInstanceApps )
		if( a != app )
			out[a] = Friend.singleInstanceApps[a];
	Friend.singleInstanceApps = out;
}

// Kill an app by name or PID
KillApplication = function ( n, level )
{
	if( isMobile )
	{
		Workspace.goToMobileDesktop();
	}
	
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
	if( isMobile )
	{
		Workspace.goToMobileDesktop();
	}
	
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
			var permissions = [];
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
							permissions.push( conf.Permissions[a] );
							break;
						case 'module':
							perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
							perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
							perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
							perms += '</p>';
							permissions.push( conf.Permissions[a] );
							break;
						case 'service':
							perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
							perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
							perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
							perms += '</p>';
							permissions.push( conf.Permissions[a] );
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
						ExecuteApplicationActivation( app, w, ( permissions ? permissions : conf.Permissions ) );
					}
				}
			}
			if( hideView )
			{
				//console.log('view is hidden... == trusted app == auto activate')
				ExecuteApplicationActivation( app, w, ( permissions ? permissions : conf.Permissions ) );
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
				if( Workspace.lastLaunchedAppArgs )
				{
					argstosend = Workspace.lastLaunchedAppArgs;
					Workspace.lastLaunchedAppArgs = false;
					ExecuteApplication( app, argstosend + '' );
				}
				else
				{
					ExecuteApplication( app );	
				}
				
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
	if( !pelement ) 
	{
		//console.log( 'No parent element: ', win, win.windowObject );
		return;
	}
	var eles = pelement.getElementsByTagName( 'input' );
	var out = [];
	var hasOptions = 0;
	if( eles && eles.length )
	{
		for( var a = 0, i = 0; a < eles.length, i < permissions.length; a++ )
		{
			if( !eles[a] || !eles[a].getAttribute( 'type' ) || eles[a].getAttribute( 'type' ) != 'checkbox' )
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
						if( Workspace.lastLaunchedAppArgs )
						{
							argstosend = Workspace.lastLaunchedAppArgs;
							Workspace.lastLaunchedAppArgs = false;
							ExecuteApplication( app, argstosend + '' );
						}
						else
						{
							ExecuteApplication( app );	
						}
					}
					s.execute( 'device/refresh', { devname: app.split( ':' )[0] + ':' } );
				}
				// Normal activation
				else
				{
					if( Workspace.lastLaunchedAppArgs )
					{
						argstosend = Workspace.lastLaunchedAppArgs;
						Workspace.lastLaunchedAppArgs = false;
						ExecuteApplication( app, argstosend + '' );
					}
					else
					{
						ExecuteApplication( app );	
					}
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
	if( !path ) return;
	var app = path.split( ':' )[1];
	if( app.indexOf( '/' ) > 0 )
	{
		app = app.split( '/' );
		app = app[app.length-1];
	}
	var f = new File( path );
	f.onLoad = function( data )
	{
		if( data )
		{
			// An error?
			if ( data.indexOf( '404 - File not found!' ) < 0 )
			{
				var r = ExecuteJSX( data, app, args, path, function()
				{
					if( callback )
						callback();
					// Clean blocker
					RemoveFromExecutionQueue( app );
				}, conf ? conf.ConfFilename : false );
				// Uncommented running callback, it is already running in executeJSX!
				// Perhaps 'r' should tell us if it was run, and then run it if not?
				//if( callback ) callback( true );
				return r;
			}
		}
		else
		{
			console.log( 'Failed to load data: ', data, path );
		}
		if( callback ) callback( false );
		// Clean blocker
		RemoveFromExecutionQueue( app );
	};
	f.load();
}

function ExecuteJSX( data, app, args, path, callback, conf )
{
	if( data.indexOf( '{' ) < 0 ) return;

	// Remove from execution queue
	RemoveFromExecutionQueue( app );
	
	// Only run jsx after refreshing desktop to get mounted drives
	Workspace.refreshDesktop( function()
	{
		var drive = path.split( ':' )[0] + ':';
		var d = ( new Door( drive ) ).get( drive );

		// Running system with a drive config..
		if( d )
		{
			// Check if d.Config is empty or not set
			if( d.dormantDoor && !d.Config && d.dormantGetConfig )
			{
				conf = d.dormantGetConfig();
				conf = JSON.stringify( conf );
			}
			else if( !d.Config || ( d.Config && d.Config == '{}' ) || JSON.stringify( d.Config ) == '{}' )
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
		ifr.setAttribute( 'sandbox', DEFAULT_SANDBOX_ATTRIBUTES );
		ifr.path = '/webclient/jsx/';

		args = typeof( args ) != 'string' ? '' : args;

		completeLaunch( data, app, args, path, callback, conf );

		function completeLaunch( data, app, args, path, callback, conf, html )
		{
			// Special case, we have a conf
			var sid = false;
			var confObject = false;
			var applicationId = app + '-' + ( new Date() ).getTime();
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
				if( !d.dormantDoor && conf.indexOf( '{' ) >= 0 )
					conf = encodeURIComponent( path.split( ':' )[0] + ':' );

				var extra = '';
				if( stype == 'authid')
					extra = '&theme=borderless';

				// Quicker ajax implementation
				var j = new cAjax();
				j.open( 'POST', '/system.library/module/?module=system&command=sandbox' +
					'&' + stype + '=' + svalu +
					'&conf=' + conf + '&' + ( args ? ( 'args=' + args ) : '' ) + extra, true );
				j.onload = function()
				{
					ws = this.rawData.split( 'src="/webclient/js/apps/api.js"' ).join( 'src="' + _applicationBasics.apiV1 + '"' );
					ifr.onload = ifronload;
					ifr.src = URL.createObjectURL( new Blob([ ws ],{ type: 'text/html' } ) );
				}
				j.send();

				ifr.conf = confObject;
			}
			// Just give a dumb sandbox
			else 
			{
				ifr.src = '/webclient/sandboxed.html?' + ( args ? ( 'args=' + args ) : '' );
				ifr.onload = ifronload;
			}

			// Register name and ID
			ifr.applicationName = app;
			ifr.applicationNumber = _appNum++;
			ifr.applicationId = app + '-' + (new Date()).getTime();
			ifr.workspaceMode = Workspace.workspacemode;
			ifr.userId = Workspace.userId;
			ifr.userLevel = Workspace.userLevel;
			ifr.username = Workspace.loginUsername;
			ifr.applicationType = 'jsx';
			if( sid ) 
				ifr.sessionId = Workspace.sessionId; // JSX has sessionid
			else 
			{
				if ( conf.authid )
					ifr.authId = conf.authid;
				else
					ifr.sessionId = Workspace.sessionId;
			}

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
						domain:   typeof( sdomain ) != 'undefined' ? sdomain : ''
					};
					this.contentWindow.postMessage( JSON.stringify( o ), '*' );
				}
				
				// Close file dialog memory
				// TODO: Reenable if needed
				/*var out = [];
				for( var a in _dialogStorage )
				{
					if( a != ifr.applicationName )
						out[ a ] = _dialogStorage[ a ];
				}
				_dialogStorage = out; */
				
				// Silently close message port
				ApplicationMessagingNexus.close( this.applicationId );
			}
			
			ifr.sendMessage = function( msg )
			{
				if( this.contentWindow )
				{
					msg.applicationId = this.applicationId;
					msg.applicationName = this.applicationName;
					amsg = JSON.stringify( msg );
					this.contentWindow.postMessage( amsg, '*' );
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
			var ifronload = function()
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

					jsx.innerHTML = data;

					ifr.contentWindow.document.getElementsByTagName( 'head' )[0].appendChild( jsx );
					ifr.appPath = dpath;

					var cid = addWrapperCallback( function()
					{
						if( callback )
						{
							callback( "\n", { response: 'Executable has run.' }, ifr );
						}
					} );

					// Send initiator to app
					var msg = {
						command:          'initappframe',
						base:             '/',
						applicationId:    ifr.applicationId,
						userId:           ifr.userId,
						userLevel:        ifr.userLevel,
						username:         ifr.username,
						theme:            Workspace.theme,
						themeData:        Workspace.themeData,
						workspaceMode:    Workspace.workspacemode,
						locale:           Workspace.locale,
						filePath:         '/webclient/jsx/',
						appPath:          dpath ? dpath : '',
						authId:           ifr.authId, // JSX may have authid
						sessionId:        ifr.sessionId, // or JSX has sessionid
						origin:           '*',//document.location.href,
						viewId:           false,
						registerCallback: cid,
						clipboard:        Friend.clipboard,
						cachedAppData:    _applicationBasics,
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
					Notify( { 'title': i18n( 'i18n_error' ), 'description': i18n( 'i18n_could_not_run_jsx' ) } );
				}
			}

			// Add application iframe to body
			var iconPath = path;
			if( iconPath.substr( -4, 4 ).toLowerCase() == '.jsx' )
			{
				iconPath = iconPath.split( '/' );
				iconPath.pop();
				iconPath = iconPath.join( '/' );
			}
			AttachAppSandbox( ifr, iconPath, 'friendpath' );

			// Add application
			Workspace.applications.push( ifr );
			
			// Register this app as the last executed
			if( Workspace.currentExecutedApplication )
			{
				Workspace.prevExecutedApplication = Workspace.currentExecutedApplication;
			}
			Workspace.currentExecutedApplication = ifr.applicationId;
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
function AttachAppSandbox( ifr, path, pathType )
{
	if( !pathType ) pathType = 'default';
	
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
	var icon = oicon = '/webclient/gfx/icons/64x64/mimetypes/application-x-javascript.png';
	if( path.indexOf( '?' ) < 0 || path.indexOf( 'command=resource' ) > 0 )
		icon = ( pathType == 'friendpath' ? oicon : ( path + '/icon.png' ) );
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

	var b = document.createElement( 'div' );
	b.className = 'CloseButton';
	b.onmousedown = function()
	{
		ifr.quit( 1 );
	}
	d.appendChild( b );

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
		var pems = [];
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
						pems.push( permissions[a] );
						break;
					case 'module':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_module_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						pems.push( permissions[a] );
						break;
					case 'service':
						perms += '<p><input type="checkbox" class="permission_' + (a+1) + '" checked="checked"/> ';
						perms += '<label>' + i18n('grant_service_access' ) + '</label> ';
						perms += '<strong>' + row[1].toLowerCase() + '</strong>.';
						perms += '</p>';
						pems.push( permissions[a] );
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
				ExecuteApplicationActivation( app, w, ( pems ? pems : conf.Permissions ), 'reactivate' );
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
		if( this.initialized )
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

