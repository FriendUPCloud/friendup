/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* Wraps API calls through messages and carries them out                        *
*                                                                              *
* This file calls methods on real objects - not the proxy objects in api.js    *
*                                                                              *
*******************************************************************************/

// Assumptions
window.isTablet = window.isMobile = false;

// Main namespace
Friend = window.Friend || {}
Friend.iconsSelectedCount = 0;
Friend.currentMenuItems = false;
Friend.singleInstanceApps = [];
Friend.windowBaseString = 'Friend Workspace';

// Some global variables
var globalConfig = {};
globalConfig.language = 'en-US'; // Defaults to US english

// Handle callbacks
var apiWrapperCallbacks = [];
function addWrapperCallback( f )
{
	var uniqueId = ( new Date() ).getTime() + '_' + ( Math.random() * 1000 ) + ( Math.random() * 1000 );
	while( typeof( apiWrapperCallbacks[uniqueId] ) != 'undefined' )
		uniqueId += '_';
	apiWrapperCallbacks[uniqueId] = f;
	return uniqueId;
}

// Get the wrapper callback
function getWrapperCallback( uniqueId )
{
	if( typeof( apiWrapperCallbacks[uniqueId] ) != 'undefined' )
	{
		var func = apiWrapperCallbacks[uniqueId];
		var o = [];
		for( var a in apiWrapperCallbacks )
		{
			if( a != uniqueId )
				o[a] = apiWrapperCallbacks[a];
		}
		apiWrapperCallbacks = o;
		return func;
	}
	return false;
}

// Run a callback and remove from list
function runWrapperCallback( uniqueId, data )
{
	if( typeof( apiWrapperCallbacks[uniqueId] ) == 'function' )
	{
		apiWrapperCallbacks[uniqueId]( data );
		var o = [];
		for( var a in apiWrapperCallbacks )
		{
			if( a != uniqueId )
				o[a] = apiWrapperCallbacks[a];
		}
		apiWrapperCallbacks = o;
	}
}

// Make a callback function for an app based on a previous callback
function makeAppCallbackFunction( app, data, source )
{
	if( !app || !data ) return false;
	
	var nmsg = {};
	for( var a in data ) nmsg[ a ] = data[ a ];
	nmsg.type = 'callback';
	
	// Our destination
	if( source )
	{
		// Just send to app
		return function(){
			source.postMessage( JSON.stringify( nmsg ), '*' ); 
		}
	}
	// Just send to app
	return function(){
		app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' ); 
	}
}

// Native windows
var nativeWindows = [];

// Api wrapper main handler
function apiWrapper( event, force )
{
	// TODO: Origin
	if( !event && !event.data ) return false;

	var edi = -1, d = event.data;
	try
	{
		if( d.match( /^[a-z]*?\</i ) && ( edi = event.data.indexOf( '<!--separate-->' ) ) >= 0 )
			d = event.data.substr( 0, edi - 1 );
		if( !d.indexOf( '{' ) && !d.indexOf( '[' ) )
			return false;
	}
	catch( e )
	{
		if( typeof( d ) != 'object' )
		{
			return false;
		}
	}

	var msg = false;
	try
	{
		msg = typeof( d ) == 'object' ? d : JSON.parse( d );
	} 
	catch( e )
	{ 
		console.log( 'Unexpected answer: ' + d, event.data ); 
	}
	
	// Check attributes for special types
	for( var prop in msg )
	{
		if( prop.indexOf( '_format' ) < 0 ) continue;
		var propName = prop.substring( 0, prop.length - 7 );
		if( typeof( msg[ propName ] ) != 'undefined' )
		{
			switch( msg[ prop ] )
			{
				case 'binaryString':
				case 'base64':
					msg[ propName ] = ConvertStringToArrayBuffer( msg[ propName ], msg[ prop ] );			
					//var data = msg[ propName ].split( ',' );
					//msg[ propName ] = ( new Uint8Array( data ) ).buffer;
					break;
			}
		}
	}

	// Send message back to origin view/application or function
	function sendItBack( message )
	{
		if ( typeof messageInfo.callback == 'function' )
		{
			messageInfo.callback( message );
			return;
		}
		if ( messageInfo.view )
		{
			if ( typeof messageInfo.callback == 'string' )
			{
				message.type = 'callback';
				message.callback = messageInfo.callback;
			}
			message.applicationId = messageInfo.applicationId;
			message.viewId = messageInfo.viewId;
			messageInfo.view.postMessage( JSON.stringify( message ), '*' );
		}
	}
	
	if( msg.type )
	{
		// Find application iframe
		var app = findApplication( msg.applicationId );
		if( force ) app = force; // <- Run with privileges
		if( !app )
		{
			// Special case, enter the switch with these conditions
			if( msg.type != 'friendNetworkRun' )
			{
				//console.log( 'apiwrapper - found no app for ', msg );
				return false;
			}
		}

		// For Francois :)
		if( msg.type.substring( 0, 13 ) == 'friendNetwork' )
		{
			var messageInfo = {};
			if ( msg.applicationId )
			{
				messageInfo.view = GetContentWindowByAppMessage( findApplication( msg.applicationId ), msg );
				messageInfo.applicationId = msg.applicationId;
				if ( msg.applicationName )
					messageInfo.applicationName = msg.applicationName;
				messageInfo.viewId = msg.viewId;
				messageInfo.callback = msg.callback;
			}
		}
		
		switch( msg.type ) 
		{
			// Application messaging -------------------------------------------
			case 'applicationmessaging':
				switch( msg.method )
				{
					case 'open':
						ApplicationMessagingNexus.open( msg.applicationId, function( response )
						{
							event.source.postMessage( {
								type: 'callback',
								callback: msg.callback,
								data: response
							}, '*' );
						} );
						break;
					case 'close':
						ApplicationMessagingNexus.close( msg.applicationId, function( response )
						{
							event.source.postMessage( {
								type: 'callback',
								callback: msg.callback,
								data: response
							}, '*' );
						} );
						break;
					case 'getapplications':
						if( msg.callback )
						{
							var out = [];
							for( var a = 0; a < Workspace.applications.length; a++ )
							{
								var app = Workspace.applications[a];
								if( app.applicationId == msg.applicationId ) continue;
								if( msg.application == '*' || app.applicationName.indexOf( msg.application ) == 0 )
								{
									if( ApplicationMessagingNexus.ports[ app.applicationId ] )
									{
										out.push( {
											hash: ApplicationMessagingNexus.ports[ app.applicationId ].hash,
											name: app.applicationName
										} );
									}
								}
							}
							// Respond
							event.source.postMessage( {
								type: 'callback',
								callback: msg.callback,
								data: out
							}, '*' );
						}
						break;
					case 'sendtoapp':
						var out = [];
						var responders = [];
						
						var sourceHash = '';
						if( ApplicationMessagingNexus.ports[ msg.applicationId ] )
						{
							sourceHash = ApplicationMessagingNexus.ports[ msg.applicationId ].hash;
						}
						
						for( var a = 0; a < Workspace.applications.length; a++ )
						{
							var app = Workspace.applications[a];
							if( app.applicationId == msg.applicationId ) continue;
							if( msg.application == '*' || app.applicationName.indexOf( msg.filter ) == 0 )
							{
								if( ApplicationMessagingNexus.ports[ app.applicationId ] )
								{
									out.push( ApplicationMessagingNexus.ports[ app.applicationId ] );
									responders.push( {
										hash: ApplicationMessagingNexus.ports[ app.applicationId ].hash,
										name: app.applicationName
									} );
								}
							}
						}
						// Check on hash
						if( !out.length )
						{
							for( var a in ApplicationMessagingNexus.ports )
							{
								if( ApplicationMessagingNexus.ports[ a ].app.applicationId == msg.applicationId ) continue;
								if( ApplicationMessagingNexus.ports[ a ].hash == msg.filter )
								{
									out.push( ApplicationMessagingNexus.ports[a ] );
									responders.push( {
										hash: ApplicationMessagingNexus.ports[ a ].hash,
										name: app.applicationName
									} );
								}
							}
						}
						
						if( out.length )
						{
							for( var a = 0; a < out.length; a++ )
							{
								// Don't send to self
								if( out[ a ].app.applicationId == msg.applicationId )
									continue;
								( function( o )
								{
									o.app.sendMessage( {
										type: 'applicationmessage',
										message: msg.message,
										source: sourceHash,
										callback: addWrapperCallback( function( data )
										{
											event.source.postMessage( {
												type: 'applicationmessage',
												message: data
											}, '*' );
										} )
									} );
								} )( out[ a ] );
							}	
							// Respond with responders
							event.source.postMessage( {
								type: 'callback',
								callback: msg.callback,
								data: responders
							}, '*' );
						}
						break;
				}
				break;
			// DOS -------------------------------------------------------------
			case 'dos':
				var win = ( app && app.windows ) ? app.windows[ msg.viewId ] : false;
				var tar = win ? app.windows[ msg.targetViewId ] : false; // Target for postmessage
				var cbk = msg.callback;
				switch ( msg.method )
				{
					case 'getDisks':
						Friend.DOS.getDisks( msg.flags, function( response, list, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								list: list
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						} );
						break;
					case 'getDirectory':
						Friend.DOS.getDirectory( msg.path, msg.flags, function( response, list, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								list: list,
								path: msg.path,
								extra: extra
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else if( app.contentWindow ) 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}, msg.extra );
						break;
					case 'executeJSX':
						Friend.DOS.executeJSX( msg.path, msg.args, function( response, message, iframe, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								extra: extra
							};
							if( tar )
							{	
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
							// If we are injecting into an iframe returned from executeJSX!
							else if( iframe )
							{
								iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}, msg.extra );
						break;
					case 'loadHTML':
						Friend.DOS.loadHTML( msg.applicationId, msg.path, function( response, html, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								html: html,
								extra: extra
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}, msg.extra );
						break;
					case 'getDriveInfo':
						Friend.DOS.getDriveInfo( msg.path, false, function( response, icon, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: icon ? true : false,
								info: icon,
								path: msg.path,
								extra: msg.extra
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );							
						}, msg.extra );
						break;
					case 'getFileInfo':
						Friend.DOS.getFileInfo( msg.path, function( response, icon, extra )
						{
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								info: icon,
								path: msg.path,
								extra: extra
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );							
						}, msg.extra );
						break;
					case 'fileAccess':
						Friend.DOS.getFileAccess( msg.path, function( response, permissions, extra )
						{
							// Setup the callback message
							var nmsg = 
							{
								viewId: msg.viewId,
								applicationId: msg.applicationId,
								callback: cbk,
								response: response,
								permissions: permissions,
								path: msg.path, 
								extra: extra
							};
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else 
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}, msg.extra );
						break;
					case 'openWindowByFilename':
						if( msg.args )
						{
							Friend.DOS.openWindowByFilename( msg.args.fileInfo, msg.args.ext );
						}
						break;
				}
				msg.callback = null;
				break;
			// Virtual Reality -------------------------------------------------
			case 'friendvr':
				if( Friend.VRWrapper )
				{
					var data = Friend.VRWrapper( msg );
					
					// Handle callbacks
					if( msg.callback && app )
					{
						if( msg.viewId && app.windows && app.windows[ msg.viewId ] )
						{
							var nmsg = {
								applicationId: msg.applicationId,
								viewId: msg.viewId,
								type: 'callback',
								callback: msg.callback,
								data: data
							};
							app.windows[ msg.viewId ].sendMessage( nmsg );
						}
						else
						{
							var nmsg = {
								applicationId: msg.applicationId,
								type: 'callback',
								callback: msg.callback,
								data: data
							};
							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
				}
				else
				{
					// First time, give an alert
					if( !Friend.VRError )
					{
						Alert( 'VR mode not available', 'Please run Friend in VR mode to run this application.' );
						Friend.VRError = 1;
					}
				}
				break;
			// Friend Network --------------------------------------------------
			case 'friendnet':
				switch( msg.method )
				{
					case 'isReady':
						FriendNetwork.isReady( 
						{
							message: msg,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'list':
						FriendNetwork.listHosts( 
						{
							message: msg,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'listToConsole':
						FriendNetwork.listHostsToConsole( 
						{
							message: msg,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'subscribeToHostListUpdates':
						FriendNetwork.subscribeToHostListUpdates( 
						{
							message: msg,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'unsubscribeFromHostListUpdates':
						FriendNetwork.unsubscribeFromHostListUpdates( 
						{
							message: msg,
							extra: msg.extra,
							identifier: msg.identifier,
							callback: msg.callback
						} );
						break;
					case 'subscribeToHostUpdates':
						FriendNetwork.subscribeToHostUpdates( 
						{
							message: msg,
							extra: msg.extra,
							key: msg.key,
							callback: msg.callback
						} );
						break;
					case 'unsubscribeFromHostUpdates':
						FriendNetwork.unsubscribeFromHostUpdates( 
						{
							message: msg,
							extra: msg.extra,
							key: msg.key,
							callback: msg.callback
						} );
						break;
					case 'connect':
						FriendNetwork.connectToHost( 
						{
							message: msg,
							extra: msg.extra,
							url: msg.url,
							hostType: msg.hostType,
							flags: msg.flags,
							callback: msg.callback
						} );
						break;
					case 'sendFile':
						FriendNetwork.sendFile( 
						{
							message: msg,
							extra: msg.extra,
							key: msg.key,
							file: msg.file,
							name: msg.name,
							infos: msg.infos,
							callback: msg.callback
						} );
						break;
					case 'disconnect':
						FriendNetwork.disconnectFromHost( {
							message: msg,
							key: msg.key,
							callback: msg.callback,
							extra: msg.extra
						} );
						break;
					case 'disconnectByName':
						FriendNetwork.disconnectFromHostByName( {
							message: msg,
							hostName: msg.hostName,
							callback: msg.callback,
							extra: msg.extra
						} );
						break;
					case 'dispose':
						FriendNetwork.disposeHosting( {
							message: msg,
							key: msg.key,
							callback: msg.callback,
							extra: msg.extra
						} );
						break;
					case 'send':
						FriendNetwork.send( {
							message: msg,
							data: msg.data,
							key: msg.key,
							callback: msg.callback,
							extra: msg.extra
						} );
						break;
					case 'sendCredentials':
						FriendNetwork.sendCredentials( {
							message: msg,
							password: msg.password,
							key: msg.key,
							encrypted: msg.encrypted,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'setHostPassword':
						FriendNetwork.setHostPassword( {
							message: msg,
							password: msg.password,
							key: msg.key,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'host':
						var newmsg =
						{
							message: msg,
							name: msg.name,
							connectionType: msg.connectionType,
							applicationName: msg.applicationName,
							description: msg.description,
							password: msg.password,
							data: msg.data,
							extra: msg.extra,
							callback: msg.callback
						};
						FriendNetwork.startHosting( newmsg );
						break;
					case 'updateHostPassword':
						FriendNetwork.updateHostPassword( 
						{
							message: msg,
							key: msg.key,
							password: msg.password,
							extra: msg.extra,
							callback: msg.callback
						} );
						break;
					case 'closeSession':
						FriendNetwork.closeSession({
							message: msg,
							key: msg.key,
							extra: msg.extra,
							callback: msg.callback
						});
						break;
					case 'closeApplication':
						FriendNetwork.closeApplication( msg );
						break;
					case 'status':
						FriendNetwork.getStatus(
                        {
							message: msg,
							extra: msg.extra						
						} ) ;
						break;
					case 'getUserInformation':
						FriendNetwork.getUserInformation(
                        {
							message: msg,
							extra: msg.extra,
							callback: msg.callback
						} ) ;
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Friend Network Share ---------------------------------------------
			case 'friendNetworkRun':
				switch ( msg.method )
				{
					case 'start':
						FriendNetworkDoor.runRemoteApplication( msg, function( response, data, extra )
						{
							var nmsg = 
							{
								command: 'runRemoteApplicationResponse',
								response: response,
								data: data,
								extra: extra,
								isFriendAPI: true
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
				}
				break;

			// Friend Network Share ---------------------------------------------
			case 'friendNetworkShare':
				switch( msg.method )
				{
					case 'activate':
						FriendNetworkShare.activate( msg.activate );
						break;
					case 'changeFriendNetworkSettings':
						FriendNetworkShare.changeFriendNetworkSettings( msg.settings );
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Friend Network Drive ---------------------------------------------
			case 'friendNetworkDrive':
				switch( msg.method )
				{
					case 'activate':
						FriendNetworkDrivecloseFriend.activate( msg.activate );
						break;
					case 'changeFriendNetworkSettings':
						FriendNetworkDrive.changeFriendNetworkSettings( msg.settings );
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Friend Network Door ---------------------------------------------
			case 'friendNetworkDoor':
				switch( msg.method )
				{
					case 'activate':
						FriendNetworkDoor.activate( msg.activate );
						break;
					case 'changeFriendNetworkSettings':
						FriendNetworkDoor.changeFriendNetworkSettings( msg.settings );
						break;
					case 'relocateHTML':
						FriendNetworkDoor.relocateHTML( msg.html, msg.sourceDrive, msg.linkReplacement, msg.linkFunction, function( response, html )
						{
							var nmsg = 
							{
								command: 'relocateHTMLReponse',
								response: response,
								html: html,
								extra: msg.extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					case 'connectToDoor':
						FriendNetworkDoor.connectToDoor( msg.hostName, msg.appName, 'folder', function( response, connection ) 
						{
							// Remove elements that make JSON.stringify crash
							//connection.door = false;
							var nmsg = 
							{
								command: 'connectToDoorReponse',
								response: response,
								connection: connection,
								extra: msg.extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					case 'disconnectFromDoor':
						var response = FriendNetworkDoor.disconnectFromDoor( msg.door, msg.parameters );
						var nmsg = 
						{
							command: 'disconnectFromDoorReponse',
							response: response,
							extra: msg.extra
						};
						sendItBack( nmsg );
						break;
					case 'shareDoor':
						FriendNetworkDoor.shareDoor( msg.hostName, msg.appName, function( response, share ) 
						{
							var nmsg = 
							{
								command: 'disconnectFromDoorReponse',
								response: response,
								share: share,
								extra: msg.extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					case 'closeSharedDoor':
						var response = FriendNetworkDoor.closeSharedDoor( msg.name );
						var nmsg = 
						{
							command: 'disconnectFromDoorReponse',
							response: response,
							extra: msg.extra
						};
						sendItBack( nmsg );
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Automatic API System...
			case 'Friend':
				Friend.callAPIFunction( msg );
				msg.callback = false;
				break;

			// Friend Network Friends ---------------------------------------------
			case 'friendNetworkFriends':
				switch( msg.method )
				{
					case 'changeFriendNetworkSettings':
						FriendNetworkFriends.changeFriendNetworkSettings( msg.settings );
						break;
					case 'listCommunities':
						FriendNetworkFriends.listCommunities( msg.url, function( response, communities, users, extra ) 
						{
							var nmsg = 
							{
								command: 'listCommunitiesResponse',
								response: response,
								communities: communities,
								users: users,
								extra: extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					case 'getUniqueDeviceIdentifier':
						FriendNetworkFriends.getUniqueDeviceIdentifier( function( identifier, extra ) 
						{
							var nmsg = 
							{
								command: 'getUniqueDeviceIdentifierResponse',
								identifier: identifier,
								extra: extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					case 'getDeviceInformation':
						FriendNetworkFriends.getDeviceInformation( msg.flags, function( information, extra ) 
						{
							var nmsg = 
							{
								command: 'getDeviceInformationResponse',
								information: information,
								extra: extra
							};
							sendItBack( nmsg );
						}, msg.extra );
						break;
					default:
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Friend Network Apps ---------------------------------------------
			case 'friendNetworkApps':
				switch( msg.method )
				{
					case 'changeFriendNetworkSettings':
						FriendNetworkApps.changeFriendNetworkSettings( msg.settings );
						break;
					case 'registerApplication':
						FriendNetworkApps.registerApplication( msg.appInformation, msg.userInformation, msg.password, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'closeApplication':
						FriendNetworkApps.closeApplication( msg.appIdentifier, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'closeConnections':
						FriendNetworkApps.closeConnections( msg.appIdentifier, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'closeRunningConnections':
						FriendNetworkApps.closeRunningConnections( msg.appIdentifier, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'openHost':
						FriendNetworkApps.openHost( msg.appIdentifier, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'closeHost':
						FriendNetworkApps.closeHost( msg.appIdentifier, function( response, data, extra )
						{
							sendItBack( response, data, extra );
						}, msg.extra )
						break;
					case 'connectToUser':
						FriendNetworkApps.connectToUser( msg.appIdentifier, msg.nameHost, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'disconnectFromApp':
						FriendNetworkApps.closeUser( msg.appIdentifier, msg.userIdentifier, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'establishConnections':
						FriendNetworkApps.establishConnections( msg.appIdentifier, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'sendMessageToAll':
						FriendNetworkApps.sendMessageToAll( msg.appIdentifier, msg.message, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'startApplication':
						FriendNetworkApps.startApplication( msg.appIdentifier, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
					case 'getHosts':
						FriendNetworkApps.getHosts( msg.appIdentifier, msg.filters, msg.registerToUpdates, function( response, data, extra ) 
						{
							sendItBack( response, data, extra );
						}, msg.extra );
						break;
				}
				msg.callback = false; // terminate callback
				break;

			// Dormant ---------------------------------------------------------
			// TODO : permissions - does the app have persmission to:
			// 1: expose its own data
			// 2: pull from other exposed apps
			// - is it possible for applicationId to leak to other applications?
			case 'dormantmaster':
				switch( msg.method )
				{
					case 'execute':

						//find our door
						var door = false;
						for (var a = 0; a < DormantMaster.appDoors.length; a++)
						{
							var doorTest = DormantMaster.appDoors[ a ].getDoor();
							if( doorTest )
							{
								if( doorTest.Title.split( ':' )[0].toLowerCase() == msg.executable.split( ':' )[ 0 ].toLowerCase() )
								{
									door = DormantMaster.appDoors[ a ];
								}
							}
						}
						if( door )
						{
							var path = '';
							if( msg.executable.indexOf( '/' ) )
							{
								path = msg.executable.split( '/' );
								path.pop();
								path = path.join( '/' ) + '/';
							}
							else
							{
								path = msg.executable.split( ':' )[ 0 ] + ':';
							}
							door.getDirectory( path, function( data )
							{
								// Callback
								for (var b = 0; b < data.length; b++)
								{
									if ((data[b].Path + data[b].Title).toLowerCase() == msg.executable.toLowerCase())
									{
										data[b].Dormant.execute(data[b], msg.dormantArgs);
									}
								}
								var ret = {
									applicationId: msg.applicationId,
									callbackId:    msg.callbackId,
									command:       'dormantmaster',
									method:        'callback',
									data:          data
								};

								if( msg.callback )
									runWrapperCallback(msg.callback, data);
							} );
						}
						else
						{
							if( msg.callback )
								runWrapperCallback(msg.callback, false);
						}
						break;
					case 'callback':
						if ( !msg.callbackId )
							return;
						
						if( msg.data )
						{
							//find our door
							var door = false;
							for (var a = 0; a < DormantMaster.appDoors.length; a++)
							{
								if (DormantMaster.appDoors[a].doorId == msg.doorId)
								{
									door = DormantMaster.appDoors[a];
								}
							}
							// If we have a viable door, use it
							if( door )
							{
								for (var a = 0; a < msg.data.length; a++)
								{
									msg.data[a].Dormant = door;
								}
								runWrapperCallback( msg.callbackId, msg.data );
							}
						}
						else
						{
							runWrapperCallback( msg.callbackId, null );
						}
						break;
					case 'addevent':
						DormantMaster.addEvent(msg);
						break;
					case 'pollevent':
						DormantMaster.pollEvent(msg);
						break;
					case 'delappevents':
						DormantMaster.delApplicationEvents(msg.applicationName);
						break;
						// Make proxy object
					case 'addAppDoor':

						// Make sure we have a unique name!
						var num = 0;
						var nam = msg.title;
						var namnum = nam;
						var found;
						do
						{
							found = false;
							for (var a = 0; a < DormantMaster.appDoors.length; a++)
							{
								if (DormantMaster.appDoors[a].title.toLowerCase() == namnum.toLowerCase())
								{
									namnum = nam + '.' + (++num);
									found = true;
									break;
								}
							}
						}
						while (found);

						var doorObject = {
							title         : namnum,
							doorId        : msg.doorId,
							applicationId : msg.applicationId,
							getDoor: function ()
							{
								var icon = 'apps/' + msg.title + '/icon.png';
								if (app && app.config.IconDoor)
									icon = app.config.IconDoor;
								return {
									MetaType : 'Meta',
									Title    : namnum + ':', /* remove this from all references*/
									Filename : namnum + ':',
									IconFile : icon,
									Position : 'left',
									Module   : 'files',
									Command  : 'dormant',
									Filesize : 4096,
									Flags    : '',
									Type     : 'Dormant',
									Path	 : namnum + ':',
									Dormant  : this
								};
							},
							addWindow: function( win )
							{
								this.windows.push( win );
							},
							getDirectory: function( t, callback )
							{
								var id = addWrapperCallback(callback);
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'getdirectory',
									path          : t
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							getFileInformation: function( t, callback )
							{
								var id = addWrapperCallback(callback);
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'getFileInformation',
									path          : t
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							setFileInformation: function( perm, callback )
							{
								var id = addWrapperCallback(callback);
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'setFileInformation',
									perm          : perm
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							// Execute a dormant command!
							execute: function( fnObj, args )
							{
								var path = fnObj.Path;
								var command = fnObj.Title || fnObj.Filename;
								var id = addWrapperCallback(function (data)
								{
									//
								});
								// Callback
								var ret = {
									applicationId  : msg.applicationId,
									doorId         : msg.doorId,
									callbackId     : id,
									command        : 'dormantmaster',
									method         : 'execute',
									dormantPath    : path,
									dormantCommand : command,
									dormantArgs    : args
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							read: function( path, mode, callback )
							{
								var id = addWrapperCallback( callback );
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'read',
									path          : path,
									mode		  : mode
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							write: function( path, data, callback )
							{
								var id = addWrapperCallback( callback );
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'write',
									path          : path,
									data		  : data
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(ret), '*'
								);
							},
							dosAction: function( func, args, callback )
							{
								var id = addWrapperCallback( callback );
								// Callback
								var ret = {
									applicationId : msg.applicationId,
									doorId        : msg.doorId,
									callbackId    : id,
									command       : 'dormantmaster',
									method        : 'dosAction',
									func          : func,
									args		  : args
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
									JSON.stringify(ret), '*'
								);
							},
							windows: []

						};
						if (msg.viewId) doorObject.viewId = msg.viewId;

						// Add the appdoor
						DormantMaster.addAppDoor(doorObject);

						// Callback
						var ret = {
							applicationId: msg.applicationId,
							doorId:        msg.doorId,
							data:          'success',
							command:       'dormantmaster',
							method:        'updatetitle',
							title:         msg.title,
							realtitle:     namnum
						};
						if( msg.viewId ) 
							ret.viewId = msg.viewId;
						app.contentWindow.postMessage(
							JSON.stringify(ret), '*'
						);
						break;
						// Silent deletion
					case 'deleteAppDoor':
						DormantMaster.delAppDoor(msg.title);
						break;
						// Get a list of doors
					case 'getDoors':
						var doors = DormantMaster.getDoors();
						// Callback
						var ret = {
							applicationId: msg.applicationId,
							callbackId:    msg.callbackId,
							command:       'dormantmaster',
							method:        'callback',
							data:          doors
						};
						if (msg.viewId) ret.viewId = msg.viewId;
						app.contentWindow.postMessage(
								JSON.stringify(jsonSafeObject(ret)), '*'
						);
						break;
					case 'getDirectory':
						//find our door
						var door = false;
						for (var a = 0; a < DormantMaster.appDoors.length; a++)
						{
							if (DormantMaster.appDoors[a].title == msg.path.split(':')[0])
							{
								door = DormantMaster.appDoors[a];
							}
						}
						if (door)
						{
							door.getDirectory(msg.path, function (data)
							{
								// Make sure the "files" have doorid
								// TODO: Is this safe? Other way of doing it?
								for (var a in data)
									data[a].doorId = door.doorId;
								// Callback
								var ret = {
									applicationId: msg.applicationId,
									callbackId:    msg.callbackId,
									command:       'dormantmaster',
									method:        'callback',
									data:          data
								};
								if (msg.viewId) ret.viewId = msg.viewId;
								app.contentWindow.postMessage(
										JSON.stringify(jsonSafeObject(ret)), '*'
								);
							});
						}
						break;
					case 'createDrive':
						var id = Friend.Doors.Dormant.createDrive( msg.options, function( response, data, extra )
						{
							// Callback
							var ret = 
							{
								applicationId: msg.applicationId,
								callbackId: msg.callbackId,
								command: 'dormantmaster',
								method: 'callback',
								response: response,
								data: data,
								extra: extra
							};
							if ( msg.viewId ) 
								ret.viewId = msg.viewId;
							app.contentWindow.postMessage( JSON.stringify( jsonSafeObject( ret ) ), '*' );
						}, msg.extra );
						break;
					case 'destroyDrive':
						Friend.Doors.Dormant.destroyDrive( msg.driveId, msg.options, function( response, data, extra )
						{
							// Callback
							var ret = 
							{
								applicationId: msg.applicationId,
								callbackId: msg.callbackId,
								command: 'dormantmaster',
								method: 'callback',
								response: response,
								data: response,
								extra: extra
							};
							if ( msg.viewId ) 
								ret.viewId = msg.viewId;
							app.contentWindow.postMessage( JSON.stringify( jsonSafeObject( ret ) ), '*' );
						}, msg.extra );
						break;
				}
				break;

			// Notify ----------------------------------------------------------
			// Ok, the iframe was loaded!? Check data
			case 'notify':
				if ( app.windows && app.windows[msg.viewId] )
				{
					app.windows[msg.viewId].sendMessage( {
						command: 'notify'
					} );
					// Execute the loaded function to carry out queued events..
					if( app.windows[msg.viewId].iframe )
						app.windows[msg.viewId].iframe.loaded = true;
					app.windows[msg.viewId].executeSendQueue();
					
					// Try to execute register callback function
					if( msg.registerCallback )
						runWrapperCallback( msg.registerCallback, msg.data );
				}
				// We got notify without a window (shell application or main app win no window)
				else
				{
					// Try to execute register callback function
					if( msg.registerCallback )
						runWrapperCallback(msg.registerCallback, msg.data );
				}
				break;
				// Screens ---------------------------------------------------------
			case 'screen':
				var screenId = msg.screenId;
				// Existing screen
				if( msg.method && app.screens && app.screens[ msg.screenId ] )
				{
					var scr = app.screens[msg.screenId];
					switch (msg.method)
					{
							// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if (scr)
							{
								scr.sendMessage(msg.data);
							}
							break;
						case 'screentofront':
							if (scr)
							{
								scr.screenToFront();
							}
							break;
						case 'setContent':
							if( scr )
							{
								// Create a new callback dispatch here..
								var cb = false;
								if( msg.callback )
								{
									cb = makeAppCallbackFunction( app, msg, event.source );
								}
								
								// Do the setting!
								var domain = GetDomainFromConf(app.config, msg.applicationId);
								scr.setContentIframed(msg.data, domain, msg, cb);

								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setRichContentUrl':
							if( scr ) scr.setRichContentUrl(msg.url, msg.base, msg.applicationId, msg.filePath);
							break;
						case 'setMenuItems':
							if (scr)
							{
								scr.setMenuItems(msg.data, msg.applicationId, msg.screenId);
							}
							CheckScreenTitle();
							break;
							// Receive a close request from below
						case 'close':
							if (scr)
							{
								scr.close(1);
								var out = [];
								for (var c in app.screens)
									if (c != msg.screenId)
										out[c] = app.screens[c];
								app.screen = out;
							}
							break;
						case 'activate':
							WorkspaceMenu.close();
							break;
					}
				}
				// don't trigger on method
				else if (!msg.method)
				{
					// Try to open a window
					msg.data.screenId = msg.screenId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					msg.data.applicationDisplayName = app.applicationDisplayName;
					var v = new Screen(msg.data);
					if (v.ready)
					{
						if (!app.screens)
							app.screens = [];
						app.screens[screenId] = v;

						// Assign conf if it exists on app object
						if (app.conf) v.conf = app.conf;

						// This is the external id
						v.externScreenId = screenId;

						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'ok'
						};
						app.contentWindow.postMessage(
							JSON.stringify(nmsg), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:      msg.id ? msg.id : false,
							type:          'callback',
							command:       'screenresponse',
							data:          'fail'
						};
						app.contentWindow.postMessage(
							JSON.stringify(nmsg), '*'
						);
					}

					// Setup window keyboard handler
					v.handleKeys = function (k)
					{
						// If it was only done!
					}
				}
				break;
				// View ------------------------------------------------------------
			case 'view':
				var viewId = msg.viewId;
				if( msg.method && app.windows && app.windows[ msg.viewId ] )
				{
					var win = app.windows[ msg.viewId ];
					var twin = app.windows[ msg.targetViewId ? msg.targetViewId : msg.viewId ];
					switch( msg.method )
					{
						case 'opencamera':
							if( win )
							{
								var cbk = null;
								if( msg.callback )
								{
									var cid = msg.callback;
									cbk = function( data )
									{
										var nmsg = {
											command: 'callback',
											callback: cid,
											data: data
										};
										
										if( msg.screenId )
											nmsg.screenId = msg.screenId;
										
										event.source.postMessage( nmsg, '*' );
									}
									msg.callback = null;
								}
								win.openCamera( msg.flags, cbk );
							}
							break;
							
						case 'showbackbutton':
							if( win )
							{
								var cbk = null;
								if( msg.callback )
								{
									var cid = msg.callback;
									cbk = function( e )
									{
										if( win.viewId == msg.targetViewId )
										{
											win.sendMessage( {
												command: 'callback',
												callback: cid,
												viewId: msg.targetViewId
											} );
										}
										else
										{
											app.sendMessage( {
												command: 'callback',
												callback: cid
											} );
										}
									}
									msg.callback = null;
								}
								win.showBackButton( msg.visible, cbk );
							}
							break;
							
						// Set a window state!
						case 'windowstate':
							if( win && typeof( win.states[ msg.state ] ) != 'undefined' )
							{
								win.states[ msg.state ] = msg.value;
							}
							break;
						case 'doneloadingbody':
							if( win && win.iframe )
							{
								win.iframe.classList.remove( 'Loading' );
							}
							break;
						// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if( win )
							{
								win.sendMessage( msg.data );
							}
							break;

							// Receive a close request from below
						case 'close':
							if( win )
							{
								var out = [];
								for( var c in app.windows )
								{
									if( c != msg.viewId )
									{
										if( app.windows[ c ].parentViewId == msg.viewId )
										{
											app.windows[ c ].close( 1 );
											continue;
										}
										out[ c ] = app.windows[ c ];
									}
								}
								app.windows = out;
								win.close(1);
							}
							else
							{
								console.log( 'can not find window!' );
							}
							break;
						case 'getWindowElement':
							if( win )
							{
								var cb = false;
								msg.data = false;
								msg.resp = 'fail';
								
								var elev = msg.destination ? app.windows[ msg.destination ] : app;
								if( elev && elev.iframe ) elev = elev.iframe;
								if( elev )
								{
									// TODO: Support this in security domains
									if( win.applicationId == msg.applicationId )
									{
										var i = win.iframe;
										if( !i ) i = win.content ? win.content.getElementsByTagName( 'iframe' )[0] : false;
										if( i )
										{
											if( i.contentWindow )
											{
												try
												{
													var identifier = 'view_' + win._window.parentNode.id;
													if( !elev.contentWindow.Application.windowElements )
													{
														elev.contentWindow.Application.windowElements = {};
													}
													elev.contentWindow.Application.windowElements[ identifier ] =
														i.contentWindow.document;
													msg.data = identifier;
													msg.resp = 'ok';
													msg.targetViewId = msg.destination;
													msg.viewId = msg.destination;
												}
												catch( e )
												{
													// probably sandboxed
												}
											}
										}
									}
								}
								if( msg.callback )
								{
									cb = makeAppCallbackFunction( app, msg, event.source );
								}
							}
							break;
						case 'setFlag':
							if( win ) win.setFlag( msg.data.flag, msg.data.value );
							break;
						case 'setFlags':
							if( win )
							{
								console.log( '[apiwrapper] Got asked to set flags on view:', msg.data );
								win.setFlags( msg.data );
							}
							break;
						case 'setContent':
							if( win )
							{
								// Create a new callback dispatch here..
								var cb = false;
								if( msg.callback )
									cb = makeAppCallbackFunction( app, msg, event.source );

								// Do the setting!
								var domain = GetDomainFromConf( app.config, msg.applicationId );
								win.setContentIframed( msg.data, domain, msg, cb );
								
								// Remove callback here - it will be handled by setcontentiframed
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'setContentById':
							if( win )
							{
								// Remember callback
								var cb = false;
								if( msg.callback )
									cb = makeAppCallbackFunction( app, msg, event.source );

								win.setContentById( msg.data, msg, cb );

								msg.callback = false;
							}
							break;
						case 'setAttributeById':
							if( win ) win.setAttributeById( msg );
							break;
						case 'getAttributeById':
							if( win )
							{
								// Do it, and call back
								win.getAttributeById( msg, function (c)
								{
									// TODO: Implement it (callback to send attribute value back)
								} );
							}
							break;
						case 'setSandboxedUrl':
							if( win ) win.setSandboxedUrl( msg );
							break;
						case 'setRichContent':
							if( win )
								win.setRichContent( msg.data );
							break;
						case 'setRichContentUrl':
							if( win )
							{
								win.setRichContentUrl( msg.url, msg.base, msg.applicationId, msg.filePath );
							}
							break;
						case 'getContentById':
							if( win )
							{
								var c = win.getContentById( msg.identifier, msg.flag );
								if( c )
								{
									app.contentWindow.postMessage( JSON.stringify( {
										command: 'view',
										method:  'getSubContent',
										data:    c.innerHTML
									} ), '*');
								}
							}
							break;
							// Adds an event by class and runs callback function
						case 'addEventByClass':
							if( win )
							{
								win.addEventByClass( msg.className, msg.event, function(e)
									{
										app.contentWindow.postMessage( JSON.stringify( {
											command:  'callback',
											callback: msg.callback,
											data:     false
										} ), '*' );
									}
								);
							}
							break;
						case 'focusOnElement':
							if( win )
							{
								win.focusOnElement( msg.identifier, msg.flag );
							}
							break;
						case 'setMenuItems':
							if( win )
								win.setMenuItems( msg.data, msg.applicationId, msg.viewId );

							CheckScreenTitle();
							break;
						case 'toFront':
							if( win )
							{
								_WindowToFront( win._window.parentNode );
							}
							break;
						case 'focus':
							if( win )
							{
								win.focus();
							}
							break;
						case 'activate':
							// Don't touch moving windows!
							if( window.isMobile )
							{
								if( win )
								{
									if( !app.startupsequence )
									{
										win.activate();
									}
								}
								WorkspaceMenu.close();
							}
							else if( !( window.currentMovable && currentMovable.getAttribute( 'moving' ) == 'moving' ) )
							{
								if( !app.startupsequence )
								{
									win.activate();	
								}
							}
							break;
					}
				}
				// don't trigger on method
				else if( !msg.method )
				{
					// Try to open a window
					msg.data.viewId = msg.viewId;
					msg.data.applicationId = msg.applicationId;
					msg.data.authId = msg.authId;
					msg.data.applicationName = app.applicationName;
					msg.data.applicationDisplayName = app.applicationDisplayName;
					
					// Add preferred workspace
					if( app.workspace ) msg.data.workspace = app.workspace;

					// Redirect to the real screen
					if( msg.data.screen && app && app.screens[ msg.data.screen ] )
					{
						msg.data.screen = app.screens[ msg.data.screen ];
					}
					else
					{
						msg.data.screen = null;
					}

					var postTarget = app;
					
					// Startup sequence apps need to be deactivated
					if( app.startupsequence )
					{						
						msg.data.minimized = true;
						// Fake hide when we have a window
						if( Workspace.applications.length && Workspace.applications[0].windows && window.ScreenOverlay )
						{
							ScreenOverlay.invisible();
						}
					}
					
					var v = new View( msg.data );
					var win = msg.parentViewId && app.windows ? app.windows[ msg.parentViewId ] : false;
					if( win )
					{
						v.parentViewId = msg.parentViewId;
						postTarget = win.content.getElementsByTagName( 'iframe' )[0];
					}
					
					if( v.ready )
					{	
						if( !app.windows )
							app.windows = [];
						app.windows[ viewId ] = v;

						// Assign conf if it exists on app object
						if( app.conf ) v.conf = app.conf;

						// This is the external id
						v.externViewId = viewId;
						
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:        msg.id ? msg.id : viewId,
							type:          'callback',
							command:       'viewresponse',
							data:          'ok'
						};
						
						postTarget.contentWindow.postMessage(
							JSON.stringify( nmsg ), '*'
						);
					}
					// Call back to say the window was not correctly opened
					else
					{
						var nmsg = {
							applicationId: msg.applicationId,
							viewId:        msg.id ? msg.id : viewId,
							type:          'callback',
							command:       'viewresponse',
							data:          'fail'
						};
						postTarget.contentWindow.postMessage(
							JSON.stringify( nmsg ), '*'
						);
					}

					// Setup window keyboard handler
					v.handleKeys = function (k)
					{
						//
					}
				}
				break;
			// Widget ---------------------------------------------------------
			case 'widget':
				var widgetId = msg.widgetId;
				if ( msg.method && app.widgets && app.widgets[ msg.widgetId ] )
				{
					var wid = app.widgets[ msg.widgetId ];
					switch ( msg.method )
					{
						// Pass a message to actual window
						case 'sendMessage':
						case 'sendmessage': // inconsistent camel case
							if ( wid )
							{
								wid.sendMessage( msg.data );
							}
							break;
						case 'setFlag':
							if( wid ) wid.setFlag( msg.data.flag, msg.data.value );
							break;
						case 'setContent':
							if ( wid )
							{
								// Create a new callback dispatch here..
								var cb = false;
								if ( msg.callback )
									cb = makeAppCallbackFunction( app, msg, event.source );

								// Do the setting!
								var domain = GetDomainFromConf( app.config, msg.applicationId );
								wid.setContentIframed( msg.data, domain, msg, cb );

								// Remove callback here - it will be handled by setcontent
								// as it is asyncronous
								msg.callback = false;
							}
							break;
						case 'raise':
							if ( wid )
								wid.raise();
							break;
						case 'lower':
							if ( wid )
								wid.lower();
							break;
						case 'show':
							if ( wid )
								wid.show();
							break;
						case 'hide':
							if ( wid )
								wid.hide();
							break;
						case 'autosize':
							if ( wid )
								wid.autosize();
							break;
						case 'close':
							if( wid )
							{
								wid.close();
								
								// Remove widget from list
								var w = [];
								for( var a in app.widgets )
									if( app.widgets[ a ] != wid )
										w.push( app.widgets[a] );
								app.widgets = w;
							}
							else
							{
							}
							break;
					}
				}
				// don't trigger on method
				else if ( !msg.method )
				{
					var v = new Widget( msg.data );

					// We might need these
					v.applicationId = msg.applicationId;
					v.authId = msg.authId;
					v.applicationDisplayName = msg.applicationDisplayName;
					v.applicationName = msg.applicationName;

					if (!app.widgets) app.widgets = [];
					app.widgets[widgetId] = v;

					var nmsg = {
						applicationId: msg.applicationId,
						widgetId:      msg.id ? msg.id : false,
						type:          'callback',
						command:       'widgetresponse',
						data:          'ok'
					};
					app.contentWindow.postMessage(
						JSON.stringify(nmsg), '*'
					);
				}
				// Call back to say the window was not correctly opened
				else
				{
					var nmsg = {
						applicationId: msg.applicationId,
						widgetId:      msg.id ? msg.id : false,
						type:          'callback',
						command:       'widgetresponse',
						data:          'fail'
					};
					app.contentWindow.postMessage(
							JSON.stringify(nmsg), '*'
					);
				}
				break;
			// File ------------------------------------------------------------
			// TODO : Permissions - only check local filesystems?
			// Are there admin only filesystems?
			case 'file':

				// Faster way to get javascripts.
				if( msg.command && msg.command == 'getapidefaultscripts' )
				{
					// Load from cache
					if( Workspace.apidefaultscripts )
					{
						event.source.postMessage( {
							type: 'callback',
							callback: msg.callback,
							data: Workspace.apidefaultscripts
						}, '*' );
					}
					// Build
					else
					{
						var n = new XMLHttpRequest();
						n.open( 'POST', msg.data );
						n.onreadystatechange = function()
						{
							if( this.readyState == 4 && this.status == 200  )
							{
								Workspace.apidefaultscripts = this.responseText;
								event.source.postMessage( {
									type: 'callback',
									callback: msg.callback,
									data: Workspace.apidefaultscripts
								}, '*' );
							}
						}
						n.send();
					}
					return true;
				}
				
				// Some paths come as filenames obviously..
				if( !msg.data.path && msg.data.filename && msg.data.filename.indexOf( ':' ) > 0 )
					msg.data.path = msg.data.filename;

				// Perhaps do error?
				if( msg.data.path && msg.data.path.toLowerCase && msg.data.path.toLowerCase().substr( 0, 8 ) != 'progdir:' && msg.data.path.indexOf( ':' ) > 0 )
				{
					if( !checkAppPermission( app.authId, 'Door Local' ) )
					{
						console.log( 'Permission denied to local filesystems!' );
						return false;
					}
				}

				if( typeof( msg.data.path ) == 'undefined' )
				{
					console.log( 'Empty path..' );
					return false;
				}

				var fileId = msg.fileId;

				// Make real file object
				var f = new File( msg.data.path );
				f.application = app;
				// TODO: This should be in the application from the start
				if( !f.application.filePath )
					f.application.filePath = msg.filePath;

				// Add variables
				if( msg.vars )
				{
					for( var a in msg.vars )
					{
						f.addVar( a, msg.vars[a] );
					}
				}

				// Respond with file contents (uses raw data..)
				if( msg.method == 'load' )
				{
					f.onLoad = function( data )
					{
						// Fallback
						if( !data && this.rawData )
							data = this.rawData;

						// File loads should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );

						if( app && cw )
						{
							var nmsg = { command: 'fileload', fileId: fileId };
							
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							if( Workspace.authId )
								nmsg.authId = Workspace.authId;
								
							// Binary data is sent as string..
							if( typeof( data ) == 'object' )
							{
								//var v = new Uint8Array( data );
								//nmsg.data = Array.prototype.join.call( v, ',' );
								nmsg.dataFormat = 'string';
								nmsg.data = ConvertArrayBufferToString( data, 'base64' );
							}
							else
							{
								nmsg.data = data;
							}
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					f.load();
				}
				else if( msg.method == 'call' )
				{
					f.onCall = function( data )
					{
						// Fallback
						if( !data && this.rawdata )
							data = this.rawdata;

						// File loads should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );

						if( app && cw )
						{
							var nmsg = { command: 'fileload', fileId: fileId, data: data };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							if( Workspace.authId )
								nmsg.authId = Workspace.authId;
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					f.call( msg.vars.query, msg.vars );
				}
				else if( msg.method == 'post' )
				{
					f.onPost = function( result )
					{
						// File posts should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );

						if( app && cw )
						{
							var nmsg = { command: 'filepost', fileId: fileId, result: result };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					// Assume base64 encoded data string
					try
					{
						f.post( Base64.decode( msg.data.data ), msg.data.filename );
					}
					// No? Try without..
					catch( e )
					{
						f.post( msg.data.data, msg.data.filename );
					}
				}
				else if( msg.method == 'save' )
				{
					// Respond with save data notification
					f.onSave = function()
					{
						// File saves should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );
						if( app && cw )
						{
							var nmsg = { command: 'filesave', fileId: fileId };
							// Pass window id down
							if( msg.viewId )
							{
								nmsg.viewId = msg.viewId;
								nmsg.type     = 'callback';
							}
							if( msg.screenId )
							{
								nmsg.screenId = msg.screenId;
								nmsg.type = 'callback';
							}
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
					}
					// We have a binary in string format!
					// Convert it back into binary!
					var mode = '';
					if( msg.dataFormat == 'string' )
					{
						var data = ConvertStringToArrayBuffer( msg.data.data, 'base64' );
						mode = 'wb';
						msg.data.data = data;
					}
					f.save( msg.data.data, msg.data.path, mode );
				}

				break;
			// Shell API -------------------------------------------------------
			case 'shell':
				if( msg.command )
				{
					var shell = false;
					if( msg.shellSession )
					{
						shell = FriendDOS.getSession( msg.shellSession );
					}
					if( !shell )
					{
						return false;
					}
					switch( msg.command )
					{
						case 'execute':
							shell.execute( msg.commandLine, function( rmsg, returnMessage )
							{
								// TODO: Finish the test if rmsg has become safe!
								if( app && app.contentWindow )
								{
									var nmsg = {
										command: 'shell',
										shellId: msg.shellId,
										shellSession: shell.uniqueId,
										shellNumber: shell.number,
										applicationId: msg.applicationId,
										authId: msg.authId,
										pipe: shell.applicationPipe,
										callbackId: msg.callbackId,
										data: jsonSafeObject( rmsg ) // Make it safe!
									};
									if( returnMessage ) nmsg.returnMessage = returnMessage;
									// Pass window id down
									if( msg.viewId )
									{
										nmsg.viewId = msg.viewId;
										nmsg.type = 'callback';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
								else
								{
									console.log( 'Nothing to do callback on!' );
								}
							} );
							break;
						case 'evaluate':
							shell.evaluate( msg.input, function( rmsg, returnMessage )
							{
								// TODO: Finish the test if rmsg has become safe!
								if( app && app.contentWindow )
								{
									var nmsg = {
										command: 'shell',
										shellId: msg.shellId,
										shellSession: shell.uniqueId,
										shellNumber: shell.number,
										applicationId: msg.applicationId,
										authId: msg.authId,
										pipe: shell.applicationPipe,
										callbackId: msg.callbackId,
										data: jsonSafeObject( rmsg ) // Make it safe!
									};
									if( returnMessage ) nmsg.returnMessage = returnMessage;
									// Pass window id down
									if( msg.viewId )
									{
										nmsg.viewId = msg.viewId;
										nmsg.type = 'callback';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
								else
								{
									console.log( 'Nothing to do callback on!' );
								}
							}, msg.clientKey, msg.restrictedPath );
							break;
						case 'close':
							FriendDOS.delSession( msg.shellSession );
							break;
					}
				}
				// Handle methods and callbacks
				else if( msg.method && msg.shellId )
				{
					var shell = FriendDOS.getSession( msg.shellId );
					if( shell )
					{
						switch( msg.method )
						{
							case 'callback':
								var cfunc = runWrapperCallback( msg.callbackId, msg.data );
								break;
						}
						return;
					}
				}
				else
				{
					var shell = FriendDOS.addSession( app, false );
					var sh = FriendDOS.getSession( shell );
					sh.applicationPipe = msg.pipe; // Pipe to application
					if( app && app.contentWindow )
					{
						var nmsg = {
							command: 'shell',
							shellId: msg.shellId,
							shellNumber: sh.number,
							shellSession: shell,
							applicationId: msg.applicationId,
							authId: msg.authId
						};
						// Pass window id down
						if( msg.viewId )
						{
							nmsg.viewId = msg.viewId;
							nmsg.type = 'callback';
						}
						app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
					}
				}
				break;
			// Module ----------------------------------------------------------
			case 'module':
				var fileId = msg.fileId;

				// Perhaps do error?
				if( msg.module.toLowerCase() != 'system' && msg.module.toLowerCase() != 'files' )
				{
					// TODO: Reenable once we have proper working functionality!!
					/*if( !checkAppPermission( app.authId, 'Module ' + msg.module.charAt( 0 ).toUpperCase()+msg.module.substr( 1 ).toLowerCase() ) )
					{
						console.log( 'Permission denied!' );
						return false;
					}*/
				}

				// Make real module object
				var f = new Module( msg.module );
				f.application = app;

				if( msg.forceHTTP )
				{
					f.forceHTTP = msg.forceHTTP;
				}

				// Add variables
				if( msg.vars )
				{
					for( var a in msg.vars )
						f.addVar( a, msg.vars[a] );
				}

				// Respond with file contents (uses raw data..)
				f.onExecuted = function( cod, dat )
				{
					if( app )
					{
						var nmsg = { command: 'fileload', fileId: fileId, data: dat, returnCode: cod };

						// Module calls should remain in their view context
						var cw = GetContentWindowByAppMessage( app, msg );

						// Pass window id down
						if( msg.viewId )
						{
							nmsg.viewId = msg.viewId;
							nmsg.type = 'callback';
						}
						else if( msg.screenId )
						{
							nmsg.screenId = msg.screenId;
							nmsg.type = 'callback';
						}
						else if( msg.widgetId )
						{
							nmsg.widgetId = msg.widgetId;
							nmsg.type = 'callback';
						}
						if( cw )
							cw.postMessage( JSON.stringify( nmsg ), '*' );
					}
				}
				f.execute( msg.method, msg.args );
				break;
			// Doors -----------------------------------------------------------
			case 'door':
				switch( msg.method )
				{
					case 'init':
						var d = new Door( msg.path );
						// Trigger callback
						var info = d.get( msg.path );
						msg.handler = info.handler;
						app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
						// Abort further
						return;
					// Get icons from a real Door object
					case 'geticons':
						var info = ( new Door() ).get( msg.path );
						if( info )
						{
							// Is this info qualified?
							if( info.path || info.deviceName )
							{
								info.setPath( msg.path );
								info.getIcons( false, function( icons )
								{
									if( icons )
										msg.data = JSON.stringify( jsonSafeObject( icons ) );
									else msg.data = false;
									if( app && app.contentWindow )
										app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
								} );
								return;
							}
						}
						// Give negative response - works as it should...
						msg.data = false;
						if( app && app.contentWindow )
							app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
						return;
				}
				break;
			// PouchDB ---------------------------------------------------------
			case 'pouchdb' :
				console.log( 'pouchdb', msg );
				var pdbEvent = msg.data;
				if ( !Workspace.pouchManager )
				{
					var err = {
						callback  : pdbEvent.data.cid,
						data : {
							success      : false,
							errorMessage : 'No pouch manager',
						},
					};
					if ( app.contentWindow && app.contentWindow.postMessage )
						app.contentWindow.postMessage( err, '*' );
				} else
					Workspace.pouchManager.handle( pdbEvent, app );

				break;
			// ApplicationStorage ----------------------------------------------
			// TODO : permissions - should apps be able to store data? how much?
			// TODO : api for checking how much is stored, total and per app
			case 'applicationstorage':
				ApplicationStorage.receiveMsg( msg, app );
				break;
			case 'encryption':

				switch( msg.command )
				{
					case 'generatekeys':
						
						if( msg.algo )
						{
							switch( msg.algo )
							{
								case 'rsa1024':
									
									if( typeof msg.args.encoded != 'undefined' )
									{
										Workspace.encryption.encoded = msg.args.encoded;
									}
									
									var passphrase = ( typeof msg.args != 'object' ? msg.args : msg.args.password );
									
									var keys = Workspace.encryption.generateKeys( ( typeof msg.args.username != 'undefined' ? msg.args.username : '' ), passphrase );
									
									var nmsg = {};
									
									for( var b in msg )
									{
										nmsg[b] = msg[b];
									}
									
									if( keys )
									{
										nmsg.type = 'callback';
										nmsg.resp = 'ok';
										nmsg.data = keys;
										
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									else
									{
										nmsg.type = 'callback';
										nmsg.resp = 'fail';
										nmsg.data = false;
										
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									
									break;
								
								case 'sha256':
									
									var passphrase = ( typeof msg.args != 'object' ? msg.args : msg.args.password );
									
									var key = Workspace.encryption.sha256( passphrase );
									
									var nmsg = {};

									for( var b in msg )
									{
										nmsg[b] = msg[b];
									}
									
									if( key )
									{
										nmsg.type = 'callback';
										nmsg.resp = 'ok';
										nmsg.data = key;
										
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									else
									{
										nmsg.type = 'callback';
										nmsg.resp = 'fail';
										nmsg.data = false;
								
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									
									break;
									
								case 'md5':
									
									var passphrase = ( typeof msg.args != 'object' ? msg.args : msg.args.password );
									
									var key = Workspace.encryption.md5( passphrase );
									
									var nmsg = {};
									
									for( var b in msg )
									{
										nmsg[b] = msg[b];
									}
									
									if( key )
									{
										nmsg.type = 'callback';
										nmsg.resp = 'ok';
										nmsg.data = key;
										
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									else
									{
										nmsg.type = 'callback';
										nmsg.resp = 'fail';
										nmsg.data = false;
								
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									
									break;
							}

						}

						break;

					case 'encrypt':

						if( msg.args )
						{
							var key = ( typeof msg.args != 'object' ? msg.args : msg.args.key );
							
							var nmsg = {};
							
							for( var b in msg )
							{
								nmsg[b] = msg[b];
							}
							
							var encrypted = ( key ? Workspace.encryption.encrypt( key ) : false );
							
							if( encrypted && Workspace.encryption.keys.client.publickey )
							{
								nmsg.type = 'callback';
								nmsg.resp = 'ok';
								nmsg.data = { 
									encrypted: encrypted,
									publickey: Workspace.encryption.keys.client.publickey
								};
								
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
							else
							{
								nmsg.type = 'callback';
								nmsg.resp = 'fail';
								nmsg.data = false;
								
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						}

						break;

					case 'decrypt':

						if( msg.args )
						{
							var key = ( typeof msg.args != 'object' ? msg.args : msg.args.key );
							
							var nmsg = {};

							for( var b in msg )
							{
								nmsg[b] = msg[b];
							}
							
							var decrypted = ( key ? Workspace.encryption.decrypt( key ) : false );
							
							if( decrypted )
							{
								nmsg.type = 'callback';
								nmsg.resp = 'ok';
								nmsg.data = { decrypted: decrypted };

								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
							else
							{
								nmsg.type = 'callback';
								nmsg.resp = 'fail';
								nmsg.data = false;
								
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						}

						break;

					case 'publickey':

						if( msg.args && typeof msg.args.encoded != 'undefined' )
						{
							Workspace.encryption.encoded = msg.args.encoded;
						}

						var keys = Workspace.encryption.getKeys();
						
						var nmsg = {};
						
						for( var b in msg )
						{
							nmsg[b] = msg[b];
						}
						
						if( keys && keys.publickey )
						{
							nmsg.type = 'callback';
							nmsg.resp = 'ok';
							nmsg.data = { publickey: keys.publickey };

							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}
						else
						{
							nmsg.type = 'callback';
							nmsg.resp = 'fail';
							nmsg.data = false;
							
							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}

						break;
				}

				break;
			// Authenticate ----------------------------------------------
			case 'authenticate':
				Authenticate.receiveMsg( msg, app );
				break;
			// Calendar
			// TODO - Permissions :
			// 1 can app read events?
			// 2 can app set events?
			case 'calendar' :
				if( msg.method == 'calendarrefresh' )
				{
					Workspace.refreshExtraWidgetContents();
				}
				else
				{
					var action = msg.data;
					if ( 'add' !== action.type ) {
						done( false, 'unknown type: ' + action.type , action.data.cid );
						return;
					}

					var data = action.data;
					var title = app.applicationName + ' wants to add a calendar event';
					Confirm( title, data.message, confirmBack );
					function confirmBack( accept ) {
						if ( accept )
							addCalendarEvent( data.event );
						else {
							done( false, 'event denied', data.cid );
						}
					}

					function addCalendarEvent( event ) {
						var mod = new Module( 'system' );
						mod.onExecuted = eventAdded;
						mod.execute( 'addcalendarevent', { event : event });
						function eventAdded( ok, res ) {
							done( 'ok' === ok, res, data.cid );
						}
					}

					function done( ok, res, cid ) {
						if ( !cid )
							return;

						var res = {
							ok       : ok,
							res      : res,
							callback : cid,
						};
						app.contentWindow.postMessage( res, '*' );
					}
				}
				break;

			// post back to whatever tab opened this tab - specialcase for treeroot / friend
			// to have live chat using hello
			case 'postout':
				console.log( 'postout', msg );
				if( !window.opener || !window.opener.postMessage )
				{
					console.log( 'window.opener.postMessage not available - dropping:', msg );
					return;
				}

				window.opener.postMessage( msg.data, '*' );
				break;
			case 'fconn':
				if( !Workspace.conn )
				{
					console.log( 'Workspace.conn - websocket not enabled, aborting' );
					return;
				}

				if( 'register' === msg.method )
				{
					// hacky check to unregister if it already exists
					// should be done when an application closes.
					// - actually, this stuff should be a permission
					// ## removed by thomas to allow several SAS per application as many apps can have several windows/instances.
					// ## initial tests showed no negative behaviour. cleanup must be done in a smarter way.
					//var regId = Workspace.conn.registeredApps[ app.authId ];
					//if ( regId )
					//	Workspace.conn.off( app.authId, regId );

					var id = Workspace.conn.on( app.authId, fconnMsg );
					Workspace.conn.registeredApps[ app.authId ] = id;
					requestBack( true );
					return;

					function fconnMsg( msg )
					{
						var wrap = {
							command: 'fconn',
							data: msg
						};
						if ( app.contentWindow && app.contentWindow.postMessage ) {
							//console.log( 'fconnMsg, posting msg to app', wrap );
							app.contentWindow.postMessage( wrap, '*' );
						}
					}
				}

				if( 'remove' === msg.method )
				{
					var regId = Workspace.conn.registeredApps[ app.authId ];
					Workspace.conn.off( app.authId, regId );
					return;
				}

				var wrap = {
					path : msg.data.path,
					authId : app.authId,
					data : msg.data.data,
				};

				if( 'request' === msg.method )
					Workspace.conn.request( wrap, requestBack );
				else
					Workspace.conn.send( wrap );

				function requestBack( res )
				{
					msg.data = res;
					msg.type = 'callback';
					msg.callback = msg.callbackId;
					if ( app.contentWindow && app.contentWindow.postMessage )
						app.contentWindow.postMessage( msg, '*' );
				}
				break;
			// System calls!
			// TODO: Permissions, not all should be able to do this!
			case 'system':
				var app = false;
				if( msg.applicationId )
					app = findApplication( msg.applicationId );
				// TODO: Permissions!!!
				// permission should probably be checked per command?
				switch( msg.command )
				{
					// Support generic callbacks
					case 'callback':
						var df = getWrapperCallback( msg.callbackId );
						if( df )
						{
							return df( msg.data ? msg.data : ( msg.error ? msg.error : null ) );
						}
						return false;
					case 'addfilesystemevent':
						if( msg.event && msg.path )
						{
							if( !Workspace.appFilesystemEvents )
							{
								Workspace.appFilesystemEvents = {};
							}
							if( !Workspace.appFilesystemEvents[ msg.event ] )
							{
								Workspace.appFilesystemEvents[ msg.event ] = [];
							}
							Workspace.appFilesystemEvents[ msg.event ].push( msg );
						}
						break;
					case 'removefilesystemevent':
						if( msg.event && msg.path )
						{
							if( Workspace.appFilesystemEvents )
							{
								if( Workspace.appFilesystemEvents[ msg.event ] )
								{
									var outEvents = [];
									var evList = Workspace.appFilesystemEvents[ msg.event ];
									for( var a = 0; a < evList.length; a++ )
									{
										var found = false;
										if( evList[a].applicationId == msg.applicationId )
										{
											if( msg.viewId )
											{
												if( evList[a].viewId == msg.viewId )
												{
													found = true;
												}
											}
											else
											{
												found = true;
											}
										}
										if( !found ) outEvents.push( evList[a] );
									}
									Workspace.appFilesystemEvents[ msg.event ] = outEvents;
								}
							}
						}
						break;
					case 'registermousedown':
						windowMouseX = msg.x;
						windowMouseY = msg.y;
						if( app && app.windows && app.windows[msg.viewId] )
						{
							var div = app.windows[ msg.viewId ];
							var x = GetElementLeft( div.content );
							var y = GetElementTop( div.content );
							windowMouseX += x;
							windowMouseY += y;
							
							// Activate window if it's not the current active one
							if( !window.currentMovable || window.currentMovable != app.windows[ msg.viewId ]._window.parentNode )
							{
								_ActivateWindow( app.windows[ msg.viewId ]._window.parentNode );
							}
						}
						// Hide context menu
						if( Workspace.contextMenuShowing )
						{
							Workspace.contextMenuShowing.hide();
							Workspace.contextMenuShowing = false;
						}
						break;
					case 'registermouseup':
						windowMouseX = msg.x;
						windowMouseY = msg.y;
						if( app && app.windows && app.windows[msg.viewId] )
						{
							var div = app.windows[ msg.viewId ];
							var x = GetElementLeft( div.content );
							var y = GetElementTop( div.content );
							windowMouseX += x;
							windowMouseY += y;
						}
						var el = document.elementFromPoint( windowMouseX, windowMouseY );
						if( el )
						{
							var clickEvent = document.createEvent( 'MouseEvents' );
							clickEvent.initEvent( 'mouseup', true, true );
							el.dispatchEvent( clickEvent );
						}
						break;
					case 'showcontextmenu':
						Workspace.showContextMenu( msg.menu, window.event, msg );
						break;
					case 'setworkspacemode':
						var mm = new Module( 'system' );
						mm.onExecuted = function( e, d )
						{
							if( e != 'ok' )
							{
								var opts = ge( 'UserMode' ).getElementsByTagName( 'option' );
								for( var b = 0; b < opts.length; b++ )
								{
									if( opts[b].value == 'normal' )
									{
										opts[b].selected = 'selected';
									}
									else opts[b].selected = '';
								}
								Workspace.workspacemode = 'normal';
							}
							else
							{
								Workspace.workspacemode = msg.mode ? msg.mode : 'normal';
							}
						}
						mm.execute( 'setsetting', { setting: 'workspacemode', data: msg.mode } );
						// TODO: Perhaps we need to do something else as well?
						break;
					case 'brutalsignout':
						document.location.reload();
						break;
					case 'keydown':
						DoorsKeyDown( msg.data );
						break;
					// Task bar stuff
					case 'task_add':
						console.log( 'Received task_add' );
						break;
					case 'task_clear_all':
						console.log( 'Received task_clear_all' );
						break;
					// End task bar stuff
					case 'setsingleinstance':
						// Add to single instances
						if( app && msg.value == true && !Friend.singleInstanceApps[ app.applicationName ] )
						{
							Friend.singleInstanceApps[ app.applicationName ] = app;
						}
						// Remove from single instances
						else if( app && msg.value == false )
						{
							var out = [];
							for( var a in Friend.singleInstanceApps )
							{
								if( a != app.applicationName )
									out[a] = Friend.singleInstanceApps[a];
							}
							Friend.singleInstanceApps = out;
						}
						break;
					case 'setclipboard':
						ClipboardSet( ( msg.value ? msg.value : '' ), ( msg.updatesystem ? true : false ) );
						break;
					case 'applicationname':
						if( app )
						{
							app.applicationDisplayName = msg.applicationname;
							for( var a = 0; a < Workspace.applications.length; a++ )
							{
								if( app.applicationId == Workspace.applications[a].applicationId )
								{
									Workspace.applications[a].applicationDisplayName = app.applicationDisplayName;
									break;
								}
							}
							var eles = ge( 'Tasks' ).getElementsByClassName( 'AppSandbox' );
							for( var a = 0; a < eles.length; a++ )
							{
								if( eles[a].ifr.applicationId == app.applicationId )
								{
									eles[a].getElementsByClassName( 'Taskname' )[0].innerHTML = app.applicationDisplayName;
									break;
								}
							}
						}
						break;
					case 'getapplicationkey':
						if( app && ( msg.authId || msg.appPath ) )
						{
							var args = { 
								authId : ( msg.systemWide ? '0' : msg.authId ) 
							};
							
							if( !args.authId && msg.appPath )
							{
								args.appPath = msg.appPath;
							}
							
							var nmsg = {};
							
							for( var a in msg ) nmsg[a] = msg[a];
							
							var m = new Module( 'system' );
							m.onExecuted = function( e, d )
							{
								//console.log( { e: e, d: JSON.parse( d ) } );
								
								if( e && e == 'ok' && d )
								{
									try 
									{ 
										var data = JSON.parse( d ); 
									
										if( data && typeof data[0] != 'undefined' )
										{
											for( var k in data )
											{
												// If found data and there is a publickey connected to it, try to decrypt with users privatekey
											
												if( data[k].Data && data[k].PublicKey )
												{
													var decrypted = Workspace.encryption.decrypt( data[k].Data );
												
													if( decrypted )
													{
														data[k].Data = decrypted;
													}
												}
												
												try 
												{ 
													if( data[k].Data )
													{
														data[k].Data = JSON.parse( data[k].Data ); 
													}
												} 
												catch( e ) {  }
											}
										}
									} 
									catch(e) 
									{  
										var data = {};
									}
									
									nmsg.type = 'callback';
									nmsg.resp = 'ok';
									nmsg.data = data;
									
									//console.log( 'app.contentWindow.postMessage: ', nmsg );
									
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
								else
								{
									nmsg.type = 'callback';
									nmsg.resp = 'fail';
									nmsg.data = { e:e, d:d };
									
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
							}
							m.execute( 'keys', args );
							
							msg.callback = false;
						}
						break;
					case 'setapplicationkey':
						//console.log( 'setapplicationkey: ', { msg: msg, app: app } );
						// TODO: Add support for saving and getting key data connected to Door.
						if( app && msg.args && ( msg.authId || msg.appPath ) )
						{
							try 
							{
								if( msg.args.data && typeof msg.args.data != 'string' )
								{
									msg.args.data = JSON.stringify( msg.args.data );
								}
							}
							catch( e ) {  }
							
							
							
							// If encrypt is true, try to encrypt with users publickey
							
							try 
							{
								if( !msg.systemWide && msg.appPath && msg.appPath.indexOf( ':' ) >= 0 && Workspace.encryption.keys.server.publickey )
								{
									var encryption_key = Workspace.encryption.keys.server.publickey;
								}
								else
								{
									var encryption_key = Workspace.encryption.keys.client.publickey;
								}
								
								if( msg.args.encrypt && msg.args.data && encryption_key )
								{
									var encrypted = Workspace.encryption.encrypt( msg.args.data, encryption_key );
												
									if( encrypted )
									{
										msg.args.data = encrypted;
										msg.args.publickey = encryption_key;
									}
								}
							}
							catch( e ) {  }
							
							var args = {
								type      : '',
								name      : msg.args.name,
								key       : msg.args.data,
								publickey : ( msg.args.publickey ? msg.args.publickey : '' ), 
								signature : ''
							}
							
							// If it's a device ... 
							if( !msg.systemWide && msg.appPath && msg.appPath.indexOf( ':' ) >= 0 )
							{
								args.appPath = msg.appPath;
							}
							// Else if it's an app
							else if( msg.authId || msg.systemWide )
							{
								args.authId = ( msg.systemWide ? '0' : msg.authId );
							}
							
							var nmsg = {};
							
							for( var a in msg ) nmsg[a] = msg[a];
							
							var m = new Module( 'system' );
							m.onExecuted = function( e, d )
							{
								//console.log( { e:e, d:d, o: args } );
								
								if( nmsg.callback )
								{
									if( e && e == 'ok' )
									{								
										nmsg.type = 'callback';
										nmsg.resp = 'ok';
										nmsg.data = d;
									
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
									else
									{
										nmsg.type = 'callback';
										nmsg.resp = 'fail';
										nmsg.data = { e:e, d:d };
									
										app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
								}
							}
							m.execute( 'userkeysupdate', args );
							
							msg.callback = false;
						}
						break;
					case 'notification':
						var nmsg = {};
						for( var a in msg ) nmsg[a] = msg[a];
						nmsg.locale = Workspace.locale;
						var cw = GetContentWindowByAppMessage( app, msg );
						if( cw )
						{
							var ccb = false;
							
							if( nmsg.clickcallback )
							{
								var vmsg = {};
								for( var a in nmsg ) vmsg[a] = nmsg[a];
								vmsg.method = 'notification';
								vmsg.callback = nmsg.clickcallback;
								vmsg.data = 'clicked';
								ccb = function()
								{
									cw.postMessage( JSON.stringify( vmsg ), '*' );
								}
							}
							
							// Sanitize title and text
							var title = msg.title ? msg.title.split( /\<[^>]*?\>/ ).join( '' ) : '';
							var text = msg.text ? msg.text.split( /\<[^>]*?\>/ ).join( '' ) : '';
							
							// Do the notification
							Notify( 
								{
									title: title,
									text: text, 
									application: app ? app.applicationName : '',
									applicationIcon: ( app && app.icon ) ? app.icon : false
								}, 
								function()
								{
									cw.postMessage( JSON.stringify( nmsg ), '*' );
								}, 
								ccb 
							);
						}
						msg.callback = false;
						break;
					case 'getlocale':
						var nmsg = {};
						for( var a in msg ) nmsg[ a ] = msg[ a ];
						nmsg.locale = Workspace.locale;
						var cw = GetContentWindowByAppMessage( app, msg );
						if( cw )
						{
							cw.postMessage( JSON.stringify( nmsg ), '*' );
						}
						msg.callback = false;
						break;
					case 'alert':
						Alert( msg.title, msg.string );
						break;
					case 'confirm':
						var nmsg = {};
						for( var a in msg ) nmsg[ a ] = msg[ a ];
						//console.log('we confirm...',nmsg);
						Confirm( 
							msg.title, 
							msg.string, 
							function( data )
							{
								if( app )
								{
									nmsg.type = 'callback';
									nmsg.data = data;
									nmsg.command = 'callback';
	
									// Module calls should remain in their view context
									var cw = GetContentWindowByAppMessage( app, msg );
	
									// Pass window id down
									if( nmsg.viewId )
									{
										nmsg.viewId = msg.viewId;
									}
									if( cw ) cw.postMessage( JSON.stringify( nmsg ), '*' );
								}
							},
							( nmsg.confirmok ? nmsg.confirmok : false ),
							( nmsg.confirmcancel ? nmsg.confirmcancel : false ),
							( nmsg.thirdButtonText ? nmsg.thirdButtonText : false ),
							( nmsg.thirdButtonReturn ? nmsg.thirdButtonReturn : false )
						);
						msg.callback = false;
						break;

					case 'reload_user_settings':
						Workspace.refreshUserSettings();
						break;

					case 'change_application_permissions':
						// TODO: This will bring up the user authentication window first!!!!
						// TODO: The user must allow, because the app does not have this permission!
						var m = new Module( 'system' );
						m.onExecuted = function( e, d )
						{
							// Tell app!
							var rmsg = {
								command: 'updateapppermissions',
								result: e
							};
							app.contentWindow.postMessage( JSON.stringify( rmsg ), '*' );
						}
						m.execute( 'updateapppermissions', { application: msg.application, data: msg.data, permissions: JSON.stringify( msg.permissions ) } );
						break;

					// Update login and tell apps
					case 'updatelogin':
						Workspace.login( msg.username, msg.password, true );
						for( var a = 0; a < Workspace.applications.length; a++ )
						{
							var nmsg = {
								command: 'userupdate',
								applicationId: msg.applicationId
							};
							Workspace.applications[a].contentWindow.postMessage( nmsg, '*' );
						}
						break;
					case 'reloadmimetypes':
						Workspace.reloadMimeTypes();
						break;
					case 'getopenscreens':
						if( app )
						{
							var screens = [];
							var s = ge( 'Screens' );
							var sl = s.getElementsByTagName( 'div' );
							for( var a = 0; a < sl.length; a++ )
							{
								if( sl[a].parentNode != s ) continue;
								if( !sl[a].className || sl[a].className.indexOf( 'Screen' ) < 0 )
									continue;
								screens.push( { id: sl[a].id, title: sl[a].screenObject._flags['title'] } );
							}
							var nmsg = {}; for( var a in msg ) nmsg[a] = msg[a];
							nmsg.screens = screens;
							app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						}
						break;
					case 'switchscreens':
						_globalScreenSwap();
						break;
					case 'nativewindow':
						if( app && msg.viewId )
						{
							// Prepare response
							var nmsg = {}; for( var a in msg ) nmsg[a] = msg[a];
							nmsg.command = 'nativewindowresponse';

							switch( msg.action )
							{
								case 'open':
									if( !msg.url ) msg.url = '';
									if( !msg.specs ) msg.specs = false;
									nmsg.response = 'fail';
									if( nativeWindows[msg.viewId] = window.open( msg.url, msg.viewId, msg.specs ) )
										nmsg.response = 'ok';
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									break;
								case 'close':
									nmsg.response = 'fail';
									if( nativeWindows[msg.viewId] )
									{
										nativeWindows[msg.viewId].close();
										// Clean house
										var nw = [];
										for( var a in nativeWindows )
										{
											if( a != msg.viewId )
												nw[a] = nativeWindows[a];
										}
										nativeWindows = nw;
										nmsg.response = 'ok';
									}
									app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									break;
							}
						}
						break;
					case 'refreshwindowbypath':
						Workspace.refreshWindowByPath( msg.path );
						break;
					case 'wallpaperimage':
						if( msg.mode == 'doors' )
						{
							Workspace.wallpaperImage = msg.image;
						}
						else
						{
							Workspace.windowWallpaperImage = msg.image;
						}
						Workspace.refreshDesktop();
						break;
					case 'savewallpaperimage':
						var m = new Module( 'system' );
						m.onExecuted = function( e )
						{
							if( e == 'ok' )
							{
								if( msg.mode == 'doors' )
								{
									Workspace.wallpaperImage = msg.image;
								}
								else
								{
									Workspace.windowWallpaperImage = msg.image;
								}
								Workspace.refreshDesktop();
							}
						}
						m.execute( 'setsetting', { setting: 'wallpaper' + msg.mode, data: msg.image } );
						break;
					// Set the local storage variable
					case 'setlocalstorage':

						break;
					// Get the local storage variable
					case 'getlocalstorage':

						break;
					case 'refreshtheme':
						Workspace.refreshTheme( msg.theme, true, msg.themeConfig ? msg.themeConfig : false );
						break;
					// Save application state
					case 'savestate':
						var m = new Module( 'system' );
						m.onExecuted = function( e, d ) { } // <- callback or so?? probably not..
						m.execute( 'savestate', { state: msg.state, authId: msg.authId } );
						break;
					case 'quit':
						if( app ) app.quit( msg.force ? msg.force : false );
						if( PollTray ) PollTray();
						break;
					case 'kill':
						if( app )
						{
							if( msg.appName )
							{
								KillApplication( msg.appName );
							}
							else if( msg.appId )
							{
								KillApplicationById( msg.appId );
							}
							else app.quit( 1 ); // quit with FORCE == 1!
						}
						break;
					case 'break':
						if( app )
						{
							var quitit = false;
							// TODO: Make this happen on num
							if( msg.appNum )
							{
								for( var a = 0; a < Workspace.applications.length; a++ )
								{
									var theApp = Workspace.applications[a];
									if( theApp.applicationNumber == msg.appNum )
									{
										theApp.contentWindow.postMessage( JSON.stringify( {
											applicationId: theApp.applicationId,
											command: 'notify',
											method: 'closewindow'
										} ), '*' );
										setTimeout( function(){ if( theApp.contentWindow ) theApp.quit(); }, 100 );
										break;
									}
								}
							}
						}
						break;
					// TODO: Permissions, not all should be able to do this!
					case 'listapplications':
						var nmsg = msg;
						var d = Workspace.listApplications();
						if( msg.callbackId )
						{
							var list = 'No running processes.';
							if( d.length )
							{
								list = '';
								for( var a = 0; a < d.length; a++ )
								{
									list += d[a].applicationNumber + '. ' + d[a].name + '<br/>';
								}
								list = { response: list };
							}
							var df = getWrapperCallback( msg.callbackId );
							return df( d ? true : false, list );
						}
						else nmsg.data = d;
						app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
						break;
					case 'refreshdocks':
						Workspace.reloadDocks();
						break;
					case 'refreshdoors':
						Workspace.refreshDesktop( false, true );
						break;
					case 'executeapplication':
						// TODO: Make "can run applications" permission
						if( 1 == 1 )
						{
							var nmsg = msg;
							function cb( response )
							{
								nmsg.method = response ? 
									'applicationexecuted' : 
									'applicationnotexecuted';
								
								if( app && app.contentWindow )
								{
									app.contentWindow.postMessage( 
										JSON.stringify( nmsg ), '*' 
									);
								}

								if( nmsg.callback )
								{
									runWrapperCallback( nmsg.callback, response );
								}
							}
							// Special case
							if( msg.path && msg.path.split( ':' )[0] == 'System' )
							{
								// Special case!
								var out = WorkspaceDormant.execute( 
									msg.executable, msg.arguments 
								);
								cb( out );
							}
							else
							{
								ExecuteApplication( msg.executable, msg.args, cb );
							}
							msg = null;
						}
						break;
					case 'librarycall':
						var j = new cAjax();
						var ex = '';
						if( msg.func )
						{
							ex += msg.func + '/';
							if( msg.args )
							{
								if( typeof( msg.args ) == 'string' )
								{
									ex += msg.args;
								}
								else if( typeof( msg.args ) == 'object' )
								{
									for( var a in msg.args )
									{
										if( a == 'command' )
											ex += msg.args[a];
										else
										{
											if( typeof( msg.args[a] ) == 'object' )
											{
												j.addVar( a, JSON.stringify( msg.args[a] ) );
											}
											else j.addVar( a, msg.args[a] );
										}
									}
								}
							}
							// Optional vars
							if( msg.vars )
							{
								for( var a in msg.vars )
									j.addVar( a, msg.vars[a] );
							}
						}
						j.open( 'post', '/' + msg.library + '/' + ex, true, true );
						if( !msg.args || ( msg.args && !msg.args.skipsession ) )
							j.addVar( 'sessionid', Workspace.sessionId );
						j.onload = function( rc, dt )
						{
							var nmsg = msg;
							nmsg.command = 'libraryresponse';
							nmsg.returnCode = rc;
							nmsg.returnData = dt;
							var cw = GetContentWindowByAppMessage( app, msg );
							if( cw ) cw.postMessage( JSON.stringify( nmsg ), '*' );
							else if( app && app.contentWindow ) app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else console.log('nowhere to take this :( ' + JSON.stringify( nmsg ) );
						}
						j.send();
						break;
					// Color pickers -------------------------------------------
					case 'colorpicker':
						var win = app.windows ? app.windows[ msg.viewId ] : false;
						var tar = win ? app.windows[ msg.targetViewId ] : false; // Target for postmessage
						
						// Create a color picker
						if( msg.method == 'new' )
						{
							// Success
							var fs = function( hex )
							{
								if( hex.length )
								{
									if( msg.successCallback )
									{
										var nmsg = {
											applicationId: msg.applicationId,
											viewId: msg.viewId,
											type: 'callback',
											data: hex,
											callback: msg.successCallback
										};
										if( tar )
											tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
										else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									}
								}
							}
							// Cancel
							var fc = function()
							{
								if( msg.failCallback )
								{
									var nmsg = {
										applicationId: msg.applicationId,
										viewId: msg.viewId,
										type: 'callback',
										callback: msg.failCallback
									};
									if( tar )
										tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
									else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								}
							}
							var c = new Friend.GUI.ColorPicker( fs, fc );
							var nmsg = {
								applicationId: msg.applicationId,
								viewId: msg.viewId,
								type: 'callback',
								callback: msg.failCallback
							};
						}
						// Just activate the color picker view
						else if( msg.method == 'activate' )
						{
							var found = false;
							for( var a = 0; a < Friend.GUI.ColorPickers.length; a++ )
							{
								if( Friend.GUI.ColorPickers[ a ].uniqueId != msg.uniqueId )
								{
									continue;
								}
								Friend.GUI.ColorPickers[ a ].view.activate();
								found = true;
								break;
							}
							if( msg.callback )
							{
								var nmsg = {
									applicationId: msg.applicationId,
									viewId: msg.viewId,
									type: 'callback',
									data: found,
									callback: msg.callback
								};
								if( tar )
									tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						}
						// Just close the color picker view
						else if( msg.method == 'close' )
						{
							var found = false;
							for( var a = 0; a < Friend.GUI.ColorPickers.length; a++ )
							{
								if( Friend.GUI.ColorPickers[ a ].uniqueId != msg.uniqueId )
								{
									continue;
								}
								Friend.GUI.ColorPickers[ a ].view.close();
								found = true;
								break;
							}
							if( msg.callback )
							{
								var nmsg = {
									applicationId: msg.applicationId,
									viewId: msg.viewId,
									type: 'callback',
									data: found,
									callback: msg.callback
								};
								if( tar )
									tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						}
						break;
					// Print dialogs -------------------------------------------
					case 'printdialog':
						var win = app.windows ? app.windows[ msg.viewId ] : false;
						var tar = win ? app.windows[msg.targetViewId] : false; // Target for postmessage
						var triggerFunc = null;
						if( msg.callbackId )
						{
							triggerFunc = function( data )
							{
								var nmsg = {
									command: 'printdialog',
									applicationId: msg.applicationId,
									viewId: msg.viewId,
									targetViewId: msg.targetViewId,
									callbackId: msg.callbackId,
									data: data
								};
								if( tar )
									tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						}
						var d = new Printdialog( msg.flags, triggerFunc );
						break;
					// File dialogs --------------------------------------------
					case 'filedialog':
						var win = app.windows ? app.windows[ msg.viewId ] : false;
						var tar = win ? app.windows[msg.targetViewId] : false; // Target for postmessage
						// No targetview id? Then just use the parent view
						if( !tar && msg.parentViewId ) 
							tar = app.windows[ msg.parentViewId ];
						
						var flags = {
							mainView:           tar ? tar : win,
							type:               msg.method,
							path:               msg.path,
							title:              msg.title,
							filename:           msg.filename,
							suffix:             msg.suffix,
							multiSelect:        msg.multiSelect,
							keyboardNavigation: msg.keyboardNavigation,
							rememberPath:       msg.rememberPath,
							triggerFunction: function( data )
							{
								var nmsg = msg;
								nmsg.data = data;
								if( tar )
									tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								else app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							}
						};
						var d = new Filedialog( flags );
						break;
					case 'opencamera':
						var win = app.windows ? app.windows[ msg.viewId ] : false;
						var tar = win ? app.windows[msg.targetViewId] : false; // Target for postmessage
						var vtitle = msg.title ? msg.title : ( msg.flags.title ? msg.flags.title : i18n('i18n_camera') );
						var vwidth = msg.width ? msg.width : ( msg.flags.width ? msg.flags.width : 480 );
						var vheight= msg.height ? msg.height : ( msg.flags.height ? msg.flags.height : 320 );
						var cview = new View({ title: vtitle, width: vwidth, height: vheight });
						cview.callback = msg.callback;
						cview.self = cview;
						cview.openCamera( false, function( data ) {
							var nmsg = {'command':'callback'};
							nmsg.data = data;
							nmsg.callback = msg.callback;
							
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else if( app && app.contentWindow )
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
								
							cview.close();
						});
						cview.onClose = function() {
							var nmsg = { 'command':'callback','closed':true, 'data':{} };
							nmsg.callback = msg.callback;
							
							if( tar )
								tar.iframe.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
							else if(app && app.contentWindow)
								app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );	
						};
						break;
				}
				break;
		}
		// Check global callback function
		if( msg && msg.callback )
		{
			var nmsg = {};
			for( var b in msg )
				nmsg[b] = msg[b];
			nmsg.type = 'callback';
			app.contentWindow.postMessage( JSON.stringify( nmsg ), '*' );
		}
	}
	// TODO: Check the flow here, to prevent infinite loops
	// Reroute message from the deep!
	else if( msg && msg.applicationId )
	{
		var app = findApplication( msg.applicationId );
		if( !app )
			return false;

		// Sometimes we want to send to a pre determined view by id.
		if( msg.destinationViewId || msg.targetViewId )
		{
			var target = msg.destinationViewId ? msg.destinationViewId : msg.targetViewId;
			var cw = GetContentWindowById( app, target );
			if( cw )
			{
				cw.postMessage( JSON.stringify( msg ), '*' );
			}
			return;
		}
		app.contentWindow.postMessage( JSON.stringify( msg ), '*' );
	}
}

/* Magic clipboard code ----------------------------------------------------- */

Friend.clipboard = '';
Friend.macCommand = false;

document.addEventListener( 'keydown', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	var t = e.target ? e.target : e.srcElement;

	if( wh == 91 )
	{
		Friend.macCommand = true;
	}

	/*if( e.ctrlKey || Friend.macCommand )
	{
		if( wh == 86 )
		{
			if( Friend.clipboard.length && Friend.clipboard != '' && Friend.clipboard.charCodeAt( 0 ) != 1 )
			{
				if( ClipboardPasteIn( t, Friend.clipboard ) )
				{
					return cancelBubble( e );
				}
			}
			dispatchEvent( t, 'paste' );
		}
		else if( wh == 67 || wh == 88 )
		{
			ClipboardSet( ClipboardGetSelectedIn( t ) );
		}
	}*/
} );

document.addEventListener( 'keyup', function( e )
{
	var wh = e.which ? e.which : e.keyCode;
	if( wh == 91 ) Friend.macCommand = false;
} );


/*document.addEventListener( 'paste', function( evt )
{
	var mimetype = '';
	var cpd = '';
	if( evt.clipboardData && evt.clipboardData.types.indexOf( 'text/plain' ) > -1 )
	{
		mimetype = 'text/plain';
	}

	//we only do text handling here for now
	if( mimetype != '' )
	{
		cpd = evt.clipboardData.getData( mimetype );

		//console.log('compare old and new in apirwrapper. new data: ',cpd,'friend prev:',Friend.prevClipboard,'friend clipboard:',Friend.clipboard);
		if( Friend.prevClipboard != cpd )
		{
			Friend.clipboard = cpd;
		}
	}
	if( typeof Application != 'undefined' ) Application.sendMessage( { type: 'system', command: 'setclipboard', value: Friend.clipboard } );
	return true;
} );*/

// Set the clipboard
function ClipboardSet( text, updatesystem )
{
	if( text == '' ) return;
	if( Friend.clipboard == text ) return;

	Friend.prevClipboard = Friend.clipboard;
	Friend.clipboard = text;

	for( var a = 0; a < Workspace.applications.length; a++ )
	{
		var app = Workspace.applications[a];
		app.contentWindow.postMessage( JSON.stringify( {
			applicationId: app.applicationId,
			command: 'updateclipboard',
			value: Friend.clipboard
		} ), '*' );
	}
	for( var a in movableWindows )
	{
		var ifr = movableWindows[a].getElementsByTagName( 'iframe' )[0];
		if( !ifr ) continue;
		ifr.contentWindow.postMessage( JSON.stringify( {
			command: 'updateclipboard',
			value: Friend.clipboard
		} ), '*' );
	}

	//ask user if he want to make this clipboard global
	if( updatesystem ) ClipboardToClientSystem();


}

function ClipboardToClientSystem()
{
	success = document.execCommand( 'copy' );
/*
	if( Friend.clipboardWidget )
	{
		//....
	}
	else
	{
		o = {
			width: 480,
			height: 200,
			valign: 'center',
			halign: 'center',
			scrolling: false,
			autosize: true
		};
		Friend.clipboardWidget = new Widget( o );
	}

	Friend.clipboardWidget.dom.innerHTML = '<div class="Padding"><h3>'+ i18n('i18n_copy_to_system_clipboard_headline') +'</h3><span>' + i18n('i18n_copy_to_system_clipboard') + '</span><textarea id="clipBoardWidgetTA" class="Rounded BackgroundNegative Padding FullWidth Negative" style="box-shadow: inset 0px 2px 10px rgba(0,0,0,0.4); border: 0; margin: 10px 0 10px 0; overflow: hidden; opacity:0.5;height: 80px;">'+ Friend.clipboard +'</textarea><button class="IconSmall Button fa-check" onclick="CopyClipboardToClientSystem()"> &nbsp;'+ i18n('i18n_yes') +'</button><button class="IconSmall Button fa-remove" onclick="CancelCopyClipboardToClientSystem()"> &nbsp;'+ i18n('i18n_negative') +'</button></div>';
	Friend.clipboardWidget.raise();
	Friend.clipboardWidget.show();
*/
}
function CopyClipboardToClientSystem( evt )
{
	myslave = ge('clipBoardWidgetTA');
	myslave.focus();
	myslave.select();
	var success = false;

	try {
		myslave.focus();
		success = document.execCommand( 'copy' );
	} catch( e ) {
		console.log( 'failed to copy to clippy', e );
	}

	if( Friend.clipboardWidget )
	{
		myslave.blur();
		ge('clipBoardWidgetTA').parentNode.removeChild( ge('clipBoardWidgetTA') );
		Friend.clipboardWidget.hide();
	}
}

function CancelCopyClipboardToClientSystem()
{
	if( Friend.clipboardWidget )
	{
		ge('clipBoardWidgetTA').parentNode.removeChild( ge('clipBoardWidgetTA') );
		Friend.clipboardWidget.hide();
	}
}

// Copy from select area to clipboard
function ClipboardGetSelectedIn( ele )
{
    var text = '';
    if( window.getSelection )
    {
        text = window.getSelection().toString();
    }
    else if( document.selection && document.selection.type != 'Control' )
    {
        text = document.selection.createRange().text;
    }
    return text;
}

// Paste to target from clipboard
function ClipboardPasteIn( ele, text )
{
	if( typeof ele.value != 'undefined' )
	{
		if( document.selection )
		{
			ele.focus();
			var sel = document.selection.createRange();
			sel.text = text;
			ele.focus();
		}
		else if( ele.selectionStart || ele.selectionStart === 0 )
		{
			var startPos = ele.selectionStart;
			var endPos = ele.selectionEnd;
			var scrollTop = ele.scrollTop;
			ele.value = ele.value.substring( 0, startPos ) +
				text + ele.value.substring( endPos, ele.value.length );
			ele.focus();
			ele.selectionStart = startPos + text.length;
			ele.selectionEnd = startPos + text.length;
			ele.scrollTop = scrollTop;
		}
		else
		{
			ele.value += text;
			ele.focus();
		}
		dispatchEvent( ele, 'change' );
		// Send paste key
		dispatchEvent( ele, 'input' );
		return true;
	}
	return false;
}

/* Done clipboard ----------------------------------------------------------- */

// Find application storage object
function findApplication( applicationId )
{
	for( var a = 0; a < Workspace.applications.length; a++ )
	{
		if( Workspace.applications[a].applicationId == applicationId )
			return Workspace.applications[a];
	}
	return false;
}

/* We need these global keys ------------------------------------------------ */

// Only for our friends
if( window.addEventListener )
{
	window.addEventListener ( 'keydown', function ( e )
	{
		if ( !e ) e = window.event;
		var k = e.which | e.keyCode;
		if ( k == 113 && e.shiftKey )
		{
			if ( typeof ( ShowLauncher ) != 'undefined' )
			{
				ShowLauncher ();
			}
			return cancelBubble ( e );
		}
		// Switch screens
		else if( k == 77 && e.ctrlKey )
		{
			_globalScreenSwap();
			return cancelBubble( e );
		}
		// Main screen
		else if( k == 78 && e.ctrlKey )
		{
			return _globalScreenSwap( 'DoorsScreen' );
		}
	});

	// Temporary to get message events on page load for login outside using an iframe
	window.addEventListener( 'message', function ( e )
	{
		if ( !e ) e = window.event;

		if( e.data && e.data.command == 'login' )
		{
			var args = {
				'keys'      : false,
				'username'  : false,
				'password'  : false,
				'sessionid' : false,
				'userid'    : false,
				'fullname'  : false,
				'remember'  : false,
				'callback'  : false,
				'event'     : false
			};

			for( key in e.data )
			{
				if( e.data[key] && typeof args[key] !== 'undefined' )
				{
					args[key] = e.data[key];
				}
			}

			console.log( 'Workspace.login() from window.addEventListener: ', args );

			// TODO: This can probably be moved somwhere everything else related to message is ...

			if( args.username )
			{
				Workspace.loginUsername = args.username;
			}

			if( args.sessionid )
			{
				Workspace.loginSessionId( args.sessionid, args.callbac, args.event );
			}

			if( typeof( args.username ) != 'undefined' )
				Workspace.login( args.username, args.password, args.remember, args.callback, args.event );
		}
	});
	
	// Blur events - allows us to track if we're clicking on a frame outside the Friend domain
	Friend.canActivateWindowOnBlur = true;
	window.addEventListener( 'blur', function( e )
	{
		// Canactivatewindowonblur is there to prevent loading elements from
		// being deactivated when they emit a blur event from their iframe
		if( !window.isMobile )
		{
			if( Friend.currentWindowHover && Friend.canActivateWindowOnBlur )
			{
				_ActivateWindowOnly( Friend.currentWindowHover );
			}
		}
	} );
}

// Global screen swap
function _globalScreenSwap( id )
{
	if( window.currentScreen )
	{
		if( !id )
		{
			return window.currentScreen.screen.screenCycle();
		}
		else
		{
			// TODO
			console.log( 'Swapping a screen by id.' );
		}
	}
}

// Do the app have the permission?
function checkAppPermission( authid, permission, value )
{
	var eles = ge( 'Tasks' ).getElementsByTagName( 'iframe' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a].authId == authid )
		{
			// JSX apps have all rights..
			if( eles[a].applicationType && eles[a].applicationType == 'jsx' )
				return true;

			for( var b = 0; b < eles[a].permissions.length; b++ )
			{
				if( eles[a].permissions[b][0] == permission )
				{
					if( value )
					{
						if( eles[a].permissions[b][1] == value )
						{
							return true;
						}
						return false;
					}
					return true;
				}
			}
		}
	}
	return false;
}

function GetContentWindowByAppMessage( app, msg )
{
	var cw = app;
	
	// Pass window id down
	if( msg.viewId )
	{
		if( app.windows[msg.viewId] )
		{
			cw = app.windows[msg.viewId].iframe;
		}
		/*else
		{
			cw = app;
			console.log( '---------------------------' );
			console.log( app, msg );
			console.log( '..........' );
		}*/
	}
	else if( msg.widgetId )
	{
		if( app.widgets[msg.widgetId] )
		{
			cw = app.widgets[msg.widgetId].iframe;
		}
	}
	if( cw.contentWindow )
		return cw.contentWindow;
	return false;
}

function GetContentWindowById( app, id )
{
	var cw = app;
	if( app.windows[id] )
	{
		cw = app.windows[id].iframe;
	}
	if( cw.contentWindow ) return cw.contentWindow;
	return false;
}

// Add Css by url
function AddCSSByUrl( csspath, callback )
{
	if( !window.cssStyles ) window.cssStyles = [];
	if( typeof( window.cssStyles[csspath] ) != 'undefined' )
	{
		// Remove existing and clean up
		var pn = window.cssStyles[csspath].parentNode;
		if( pn ) pn.removeChild( window.cssStyles[csspath] );
		var o = [];
		for( var a in window.cssStyles )
		{
			if( a != csspath )
			{
				o[a] = window.cssStyles[a];
			}
		}
		window.cssStyles = o;
	}
	// Add and register
	var s = document.createElement( 'link' );
	s.rel = 'stylesheet';
	s.href = csspath;
	if( callback ){ s.onload = function() { callback(); } }
	document.body.appendChild( s );
	window.cssStyles[csspath] = s;
}
