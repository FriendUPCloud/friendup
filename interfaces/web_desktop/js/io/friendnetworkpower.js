/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Friend Network Power Sharing
 * Writing Golem in 15 days
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 12/08/2018
 */

Friend = window.Friend || {};
Friend.Network = Friend.Network || {};

Friend.Network.Power =
{
	activated: false,
	connected: false,
	controlApplications: {},
	localHelpers: {},
	information: 
	{
		balance: 0,
		sharing:
		{
			online: false,
			connectedTo: 0,
			running: 0,
			percentageShared: 0,
			timeStartSharing: 0,
			timeSharing: 0, 
			earned: 0
		},
		using:
		{
			connectedTo: 0,
			running: 0,
			timeUsing: 0, 
			cost: 0,
			optimalNumberOfHelpers: 0
		}
	},
	Worker:
	{
		STATE_UNINITIALIZED: 'uninitialized',
		STATE_READY: 'ready',
		STATE_RUNNING: 'running',
		STATE_PAUSE: 'paused'
	},

	// Initialization entry
	start: function()
	{
		var self = Friend.Network.Power;

		// At least called once!
		self.inUse = true;

		// Already working?
		if ( self.activated && self.connected )
			return;

		// Wait for Friend network to be connected
		var handle = setInterval( function()
		{
			FriendNetwork.isReady( { callback: isInit } );
		}, 100 );
		function isInit( message )
		{
			if ( message.ready )
			{
				clearInterval( handle );
				doInit();
			}
		}

		function doInit()
		{
			// Friend Network general setting first
			var sm = new Module( 'system' );
			sm.onExecuted = function( e, d )
			{
				var fnet;
				if( e == 'ok' )
				{
					if( d )
					{
						try
						{
							d = JSON.parse( d );
							if ( d.friendNetwork != [] )
								fnet = d.friendNetwork;
						}
						catch( e )
						{
							d = null;
						}
					}
				}
				if ( fnet )
				{
					if ( fnet.powerSharing && fnet.powerSharing.enabled )
					{
						self.activated = true;
						self.connected = false;

						// Copy properties of settings!
						self.powerShareSettings = fnet.powerSharing;
	
						// Get user information
						FriendNetwork.getUserInformation( { callback: function( message )
						{
							self.userInformation = message.information;
						
							// Get device information
							FriendNetworkFriends.getDeviceInformation( '', function( infos )
							{
								self.deviceInformation = infos;

								// If sharing power, create the DistantHelper!
								if ( self.powerShareSettings.shareDevice )
								{							
									var options = 
									{
										name: 'Distant Helper',
										identifier: 'pHelper:' + self.userInformation.name + '#' + Math.random() * 1000000,
										userInformation: self.userInformation,
										deviceInformation: self.deviceInformation,
										powerShareSettings: self.powerShareSettings
									};
									self.distantHelper = new Friend.Network.Power.DistantHelper( options, function( response, message, extra )
									{	
										switch( message.command )
										{
										case 'newDistantHelperResponse':
											self.distantHelper.online = true;
											break;
										case 'newControlApplication':
											self.distantHelper.connectedTo++;
											break;										
										case 'controlApplicationDisconnected':
											self.distantHelper.running = 0;
											self.distantHelper.connectedTo--;
											self.distantHelper.percentageShared = 0;
											break;
										case 'run':
											self.distantHelper.running = true;
											self.distantHelper.percentageShared = self.powerShareSettings.percentageShared;
											break;							
										case 'abort':
											self.distantHelper.running = false;
											self.distantHelper.percentageShared = 0;
											break;							
										case 'pause':
											self.distantHelper.running = false;
											self.distantHelper.percentageShared = 0;
											break;							
										case 'resume':
											self.distantHelper.running = true;
											self.distantHelper.percentageShared = self.powerShareSettings.percentageShared;
											break;							
										case 'reset':
											self.distantHelper.running = false;
											self.distantHelper.percentageShared = 0;
											break;							
										}
									}, 'This should come back!' ); 	
								}

								// Create Power Widget on Workspace
								FriendNetworkFriends.createPowerWidget();
							} );
						} } );
		
						// Connectivity watchdog (can be left open in case of disconnection of the server)
						if ( !self.handleWatchDog )
						{
							self.handleWatchDog = setInterval( function()
							{
								self.watchDog();
							}, 500 );
						}
					}
				}
			};
			sm.execute( 'getsetting', { setting: 'friendNetwork' } );
		}
	},

	// Shut off the system!
	close: function()
	{
		var self = Friend.Network.Power;
		if ( !self.activated )
			return;

		self.activated = false;
		self.connected = false;
	},

	// Activates / Deactivates the system
	activate: function( activation )
	{
		if ( activation != this.activated )
		{
			if ( activation )
				this.start();
			else
				this.close();
		}
	},

	// Watch if the workspace is disconnected
	watchDog: function()
	{
		var self = Friend.Network.Power;
		var connected = Friend.User.ServerIsThere;
		if ( self.connected != connected )
		{
			self.connected = connected;
			if ( self.connected )
			{
				//self.start();		// TODO!
			}
			else
			{
				//self.close();
			}
		}
	},

	// Take into account modifications in the preferences of Friend Network
	changeFriendNetworkSettings: function( fnet )
	{
		var self = Friend.Network.Power;

		// Close everything...
		self.close();
		
		// Set a timeout for the data to be saved on the server
		setTimeout( function()
		{
			self.activate( fnet.powerSharing.enabled );
		}, 1000 );
	},
	
	registerApplication: function( options, callback, extra )
	{
		var self = Friend.Network.Power;

		var control;
		for ( var m in self.controlApplications )
		{
			control = self.controlApplications[ m ];
			if ( control.name == options.name )
			{
				callback( false,
				{
					command: 'registerApplicationResponse',
					error: true,
					message: 'ERROR - Power Application already registered.'
				}, extra );
				return false;
			}
		}

		var identifier = 'controlApp:' + options.name + '#' + Math.random() * 1000000;
		control = 
		{
			identifier: identifier,
			name: options.name,
			applicationDoor: options.applicationDoor,	// The Friend Network Disc of the application to be shared'
			helpers: {},
			numberOfHelpers: 0,
			connectedTo: 0,
			running: 0,
			loaded: 0,
			idle: 0,
			timeCreation: new Date().getTime(),
			timeConnecting: 0,
			timeConnected: 0,
			timeLoadingWorkers: 0,
			timeRunning: 0,
			timeIdle: 0,
			timeIdleStart: new Date().getTime()
		};
		self.controlApplications[ identifier ] = control;
		self.setState( control, 'disconnected' );

		// Shares the Friend Network disc
		var shareParameters = {};
		shareParameters.description = 'FriendNetwork - Internal application disc.';
		if ( options.shareParameters.description )
			shareParameters.description = options.shareParameters.description;
		shareParameters.data = {};
		if ( options.shareParameters.data )
			shareParameters.data = options.shareParameters.data;
		shareParameters.type = 'folder';
		shareParameters.password = '' + Math.random() * 1000000 + Math.random() * 1000000;
		if ( options.shareParameters.password )
			shareParameters.password = options.shareParameters.password;		// Should we allow this? 'public' folders
																				// Possibilities: OPEN application for the world to use...
																				// Drag and Drop a file, ten second later it is processed...
																				// That would be incredible.
																				//
																				// Magical Friend Network folders... 
																				//
																				// -> you drag and drop a JPG file in a folder called
																				//    'JPG to PNG', hop! converted and renamed to PNG.
																				// -> for more complex conversions (like video)
																				//    it will be SUPER FAST with power sharing on local networks
																				// -> companies can offer 'magic folder' services, you just
																				//    go in their community, and drag and drop the magic folder
																				//    from their drive to yours. A smart contract is done
																				//    saved on our decentralized block-chain ecosystem.
																				//    You now have access to their system through the folder.
																				//    Service can be free, per month, per use, per power needed etc.
																				//    Examples: 'Renderer' folder: drag a 3D file, you get an AVI
																				//              'PDFTranslator' folder: drag a Norwegian PDF you get 
																				//                 it in English
																				//              '3DSlicer' folder: you drag a STL, it opens the
																				//                 slicer, or nothing if the settings are already
																				//                 correct, slices, and send to the 3D printer.
																				// etc. Endless possibilities.
																				//              

		shareParameters.callback = handleSharedDoor;
		shareParameters.icon = options.shareParameters.icon;	
		shareParameters.name = control.applicationDoor.Title + ' on ' + self.userInformation.name;	
		control.shareParameters = shareParameters;

		control.doorOpen = false;
		FriendNetworkDoor.shareDoor( control.applicationDoor, shareParameters );	// TODO: make the API standard on both level, api.js and down!
		function handleSharedDoor( response, data, extra )
		{
			if ( response == 'ok' )							// TODO: harmonize callback format. Response = boolean
			{
				control.doorOpen = true;

				// Start scanning the network
				control.handleNetworkScan = setInterval( function()
				{
					self.scanNetworkForPower( control );
				}, 1000 );

				// Callback
				if ( callback )
				{
					control.command = 'registerApplicationResponse';
					callback( true, control, extra );
				}
			}
		}
		return identifier;
	},

	unregisterApplication: function( controlApplicationId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		
		var control = self.controlApplications[ controlApplicationId ];
		if ( !control )
		{
			callback( false, 
			{ 
				command: 'removeControlApplicationResponse',
				error: 'ERROR - Control Application not found.' 
			}, extra );
			return false;
		}
		
		if ( control.handleNetworkScan )
		{
			clearInterval( control.handleNetworkScan );
			control.handleNetworkScan = false;
		}
		if ( control.handleIdle )
		{
			clearInterval( control.handleIdle );
			control.handleIdle = false;
		}


		// Stops all helpers if some are working!
		var originalNumberOfHelpers = control.numberOfHelpers;
		if ( originalNumberOfHelpers )
		{
			var claims;
			function stopAllHelpers( force )
			{
				if ( typeof force != 'undefined' )
					options.force = force;
				var message =
				{
					command: 'quit',
					options: options
				};
				self.sendMessageToAllHelpers( control, message, function( response, data, extra )
				{
					if ( response )
					{
						control.helpers = {};
					}
					else
					{
						claims = data;
					}
				}, extra );
			}
			stopAllHelpers();
	
			var then = new Date().getTime();
			var handle = setInterval( function()
			{
				var helperCount = 0;
				for ( var s in control.helpers )
					helperCount++;
				if ( helperCount == 0 || claims )
				{
					clearInterval( handle );

					// Unshare the door
					FriendNetworkDoor.closeSharedDoor( control.shareParameters.name );

					if ( claims && !options.force )
					{
						callback( false, 
						{ 
							command: 'unregisterApplicationResponse',
							error: 'ERROR - Helpers still running.',
							claims: claims
						}, extra );
					}
					else
					{
						// Remove controlApplication from system
						self.controlApplications = CleanArray( self.controlApplications, control );
						
						// All done done nice and easy
						callback( true, 
						{
							command: 'unregisterApplicationResponse'						
						}, extra );
					}
				}
				else
				{
					var now = new Date().getTime();
					var timeout = 60 * 1000;
					if ( options.timeout )
						timeout = options.timeout;
					if ( now - then > timeout ) 		// Timeout to closure
					{					
						stopAllHelpers( true );
					}
				}
			}, 1000 );
		}
		else
		{
			// Remove controlApplication from system
			self.controlApplications = CleanArray( self.controlApplications, control );

			// No one was connected.
			callback( true, 
			{
				command: 'unregisterApplicationResponse'						
			}, extra );
		}
	},

	scanNetworkForPower: function( control )
	{
		var self = Friend.Network.Power;

		if ( control.numberOfHelpers < self.powerShareSettings.optimalNumberOfHelpers )
		{
			var hosts = FriendNetworkFriends.getHostsList();
			var quit = false;
			for ( var h = 0; h < hosts.length; h++ )
			{
				var host = hosts[ h ];
				if ( host.apps )
				{
					var apps = host.apps;
					for ( var a = 0; a < apps.length; a++ )
					{
						if ( apps[ a ].type == 'powerShare' )
						{
							var app = apps[ a ];
							var tags = [ '###power ' ];
							if ( self.powerShareSettings.askOnlyToCommunity )
								tags = [ '###communityPower ' ];

							if ( Friend.Utilities.Tags.scan( app.info.tags, tags ) )
							{
								var found = false;
								for ( var s in control.helpers )
								{
									var helper = control.helpers[ s ];
									if ( helper.appName == app.name )
									{
										found = true;
										break;
									}
								}
								if ( !found && host.name != self.userInformation.name )		// Not this machine!
								{
									var options =
									{
										name: host.name,
										description: app.description,
										control: control,
										hostURL: app.name + '@' + host.name
									};
									self.setState( control, 'connecting' );
									self.connectToDistantHelper( control.identifier, options, function( response, data, extra )
									{
										switch ( data.command )
										{
										case 'connectToDistantHelperResponse':
											if ( response )
											{
												control.connectedTo++;
												self.setState( control, 'connected' );
											}
											break;
										case 'disconnected':
											control.connectedTo--;
											if ( control.connectedTo == 0 )
												self.setState( control, 'disconnected' );
											break;
										}
									}, 'This should come back.' );
									quit = true;
									break;
								}
							};
						}
					}
					if ( quit )
						break;
				}
			}
		}
	},
	connectToDistantHelper: function( controlId, options, callback, extra )
	{
		var self = this;

		var control = self.getControlApplication( controlId, callback, extra );
		if ( !control )
			return null;

		var identifier = 'controlHelper:' + options.name + '#' + Math.random() * 1000000;
		var helperOptions =
		{
			name: options.name,
			description: options.description,
			control: control,			
			hostURL: options.hostURL,
			password: self.powerShareSettings.askOnlyToCommunity ? FriendNetworkFriends.workgroupPassword : 'public',
			identifier: identifier,
			number: control.numberOfHelpers++
		};

		var helper = new Friend.Network.Power.LocalHelper( helperOptions, function( response, data, extra ) 
		{
			switch( data.command )
			{
			case 'newHelperResponse':
				if ( response )
				{
					// Send the shared door
					var message =
					{
						command: 'connectToSharedDoor',
						doorURL: control.shareParameters.name + '@' + self.userInformation.name,
						doorType: 'folder',
						doorPassword: 'public'
					};
					self.sendMessageToHelper( helper, control, message, function( response, data, extra ) 
					{
						switch ( data.command )
						{
						case 'connectToSharedDoorResponse':
							control.timeConnecting = new Date().getTime() - control.timeConnectTo;
							if ( !control.timeConnectedStart )
								control.timeConnectedStart = new Date().getTime();

							if ( response )
							{
								data.command = 'connectToDistantHelperResponse';
								callback( true, data, extra );
							}
							else
							{
								// Timeout, then abort!
								setTimeout( function()
								{
									self.sendMessageToHelper( helper, control, { command: 'die' }, function( response, data, extra )
									{
										control.helpers = CleanArray( self.helpers, helper );
										control.numberOfHelpers--;
										
										data.command = 'connectToDistantHelperResponse';
										data.error = 'ERROR - Shared door not reachable.';
										callback( false, data, extra );
									}, extra );
								}, 10 * 1000 );
							}
							break;
						}
					}, extra );
				}
				break;
			}
		}, 'This should come back.' );
		helper.controlCallbacks = {};
		control.helpers[ helper.identifier ] = helper;
		return helper.identifier;
	},
	getControlApplication: function( controlId, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.controlApplications[ controlId ];
		if ( !control )
		{
			if ( callback )
			{
				callback( false,
				{
					command: 'connectToHelperResponse',
					error: true,
					message: 'ERROR - Power Application not found.'
				}, extra );
			}
			return null;
		}
		return control;
	},
	loadWorkers: function( controlId, name, pathOrCode, options, callback, extra )
	{	
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'loadWorkers',
				name: name,
				pathOrCode: pathOrCode,
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'loadWorkersResponse' )
				{
					if ( response )
					{
						control.loaded += data.helpers.length;
						self.setState( control, 'idle' );
					}
				}

				// Get the workerIdentifiers
				for ( var h = 0; h < data.helpers.length; h++ )
				{
					var helpr = data.helpers[ h ];
					control.helpers[ helpr.data.helper.identifier ].workerIdentifier = helpr.data.workerIdentifier;
				}

				// Send response!
				callback( response, data, extra );

			}, 'This should come back.' );
		}	
	},
	run: function( controlId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'run',
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'runResponse')				
				{
					if ( response )
					{
						control.running += data.helpers.length;
						self.setState( control, 'running' );
					}
				}

				// Send response!
				callback( response, data, extra );
				
			}, 'This should come back.' );
		}	
	},
	pause: function( controlId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'pause',
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'pauseResponse')				
				{
					if ( response )
					{
						control.idle += data.helpers.length;
						control.running -= data.helpers.length;
						self.setState( control, 'paused' );
					}
				}

				// Send response!
				callback( response, data, extra );
				
			}, 'This should come back.' );
		}	
	},
	resume: function( controlId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'resume',
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'resumeResponse')
				{
					if ( response )
					{
						control.idle -= data.helpers.length;
						control.running += data.helpers.length;
						self.setState( control, 'running' );
					}
				}

				// Send response!
				callback( response, data, extra );
				
			}, 'This should come back.' );
		}	
	},
	abort: function( controlId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'abort',
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'abortResponse')				
				{
					if ( response )
					{
						control.running -= data.helpers.length;
						control.idle += data.helpers.length;
						self.setState( control, 'idle' );
					}
				}

				// Send response!
				callback( response, data, extra );
				
			}, 'This should come back.' );
		}	
	},
	reset: function( controlId, options, callback, extra )
	{
		var self = Friend.Network.Power;
		var control = self.getControlApplication( controlId, callback, extra );
		if ( control )
		{
			var message = 
			{
				command: 'reset',
				options: options
			};
			self.sendMessageToAllHelpers( control, message, function( response, data, extra )
			{
				if( data.command == 'resetResponse')				
				{
					if ( response )
					{
						control.running -= data.helpers.length;
						control.idle += data.helpers.length;
						self.setState( control, 'idle' );
					}
				}

				// Send response!
				callback( response, data, extra );
				
			}, 'This should come back.' );
		}	
	},

	setState: function( control, state )
	{
		control.state = state;
		if ( !control.handleIdle )
		{
			control.previousTime = new Date().getTime();				
			control.handleIdle = setInterval( function()
			{
				if ( control.state == 'idle' || control.state == 'paused' )
					control.timeIdle += new Date().getTime() - control.previousTime;
				else if ( control.state == 'running' )
					control.timeRunning += new Date().getTime() - control.previousTime;
				else if ( control.state == 'connecting' )
					control.timeConnecting += new Date().getTime() - control.previousTime;

				if ( control.state == 'connected' || control.connectedTo > 0 )
					control.timeConnected += new Date().getTime() - control.previousTime;

				control.previousTime = new Date().getTime();				
			}, 500 );
		}
	},
	getInformation: function( options, callback, extra )
	{
		var self = Friend.Network.Power;

		var information, control;		
		if ( options.fromApplication )
		{
			if ( options.identifier )
			{
				control = self.getControlApplication( options.identifier, callback, extra );
				if ( control && self.powerShareSettings )
				{
					information =
					{
						powerShareSettings: self.powerShareSettings,
						state: control.state,
						connectedTo: control.connectedTo,
						loaded: control.loaded,
						running: control.running,
						idle: control.idle,
						timeConnected: control.timeConnected, 
						timeConnecting: control.timeConnecting,
						timeRunning: control.timeRunning, 
						timeIdle: control.timeIdle,
						cost: control.timeRunning * 0.000001
					};
					return information;
				}			
			}
			return Friend.ERROR;
		}
		else
		{
			// Generic information
			information =
			{
				powerShareSettings: self.powerShareSettings,
				using: [],
				sharing: false
			};

			// Add the information for each control applications
			for ( var c in self.controlApplications )
			{
				control = self.controlApplications[ c ];
				information.using.push 
				(
					{
						name: control.name,
						identifier: control.identifier,
						state: control.state,
						connectedTo: control.connectedTo,
						loaded: control.loaded,
						running: control.running,
						idle: control.idle,
						timeConnected: control.timeConnected, 
						timeConnecting: control.timeConnecting,
						timeRunning: control.timeRunning, 
						timeIdle: control.timeIdle,
						cost: control.timeRunning * 0.000001
					}
				);
			}
			// Add the information on sharing
			if ( self.distantHelper )
			{
				information.sharing = self.distantHelper.information;
			}
		}
		return information;
	},

	// Simple messagging system
	sendMessageToAllHelpers: function( controlOrId, message, callback, extra )
	{
		var self = Friend.Network.Power;

		// Get the control application
		var control = controlOrId;
		if ( typeof control == 'string' )
		{
			control = self.controlApplications[ controlOrId ];
			if ( !control )
			{
				callback( false,
				{
					command: 'sendMessageToAllHelpersResponse',
					error: 'ERROR - Power Application not found.'
				}, extra );
				return null;
			}
		}

		// Send the messages...
		var count = 0;
		var cFalse = 0;
		var returns = {};
		for ( var s in control.helpers )
		{
			var helper = control.helpers[ s ];
			var newMessage = Object.assign( {}, message );
			var returns = 
			{
				helpers: []
			}
			self.sendMessageToHelper( helper, control, newMessage, function( response, data, extra )
			{
				returns.helpers.push( 
				{
					response: response,
					data: data,
					extra: extra
				} );
				if ( !response )
				{
					cFalse++;
				}
				count++;
				if ( count == control.numberOfHelpers )
				{
					returns.command = data.command;
					returns.identifier = data.identifier;
					callback( cFalse == 0, returns, extra );
				}
			}, extra );
		}
	},
	sendMessageToHelper: function( helperOrId, controlOrId, message, callback, extra )
	{
		var self = Friend.Network.Power;

		// Get the control
		var control = controlOrId;
		if ( typeof control == 'string' )
		{
			control = self.controlApplications[ controlId ];
			if ( !control )
			{
				callback( false,
				{
					command: 'sendMessageToHelperResponse',
					error: 'ERROR - Power Application not found.'
				}, extra );
				return null;
			}
		}
		
		// Get the helper
		var helper = helperOrId;
		if ( typeof helper == 'string' )
		{
			helper = control.helpers[ helper ];
			if ( !helper )
			{
				callback( false,
				{
					command: 'sendMessageToHelperResponse',
					error: 'ERROR - LocalHelper not found.'
				}, extra );
				return null;
			}
		}
		
		// Send the message!
		if ( typeof message.identifier == 'undefined' )
			message.identifier = 'msg' + Math.random() * 1000000 + Math.random() * 1000000;
		if ( callback )
		{
			helper.controlCallbacks[ message.identifier ] = 
			{
				callback: callback,
				keepPipe: message.keepPipe
			};
		}
		message.helperNumber = helper.number;
		message.workerIdentifier = helper.workerIdentifier;
		helper.message( message, function( response, data, extra )
		{
			var cb = helper.controlCallbacks[ message.identifier ]
			if ( cb )
			{
				data.helper = helper.getSelf();
				cb.callback( response, data, extra );
				if ( !cb.keepPipe ) 
					helper.controlCallbacks = CleanArray( helper.controlCallbacks, cb );
			}
		}, extra );
		return message.identifier;
	}
};

// A LocalHelper, control side
Friend.Network.Power.LocalHelper = function( options, callback, extra )
{
	var self = this;

	self.control = options.control;
	self.name = options.name;
	self.description = options.description;
	self.hostURL = options.hostURL;
	self.appName = self.hostURL.substring( 0, self.hostURL.indexOf( '@' ) );

	self.hostType = 'powerShare';
	self.password = options.password;
	self.connecting = true;
	self.connected = false;
	self.identifier = options.identifier;
	if ( !self.identifier )
		self.identifier = 'controlHelper' + options.name + '#' + Math.random() * 1000000;
	self.extra = extra;
	self.pending = [];
	self.callbacks = {};
	
	// Connects to host
	FriendNetwork.connectToHost
	( 
		{ 
			url: self.hostURL, 
			hostType: 'powerShare', 
			p2p: true, 
			encryptMessages: true, 
			callback: handleMessages 
		} 
	);
	return self;

	// Handles FriendNetwork messages
	function handleMessages( msg )
	{
		switch ( msg.subCommand )
		{
		case 'getCredentials':
			FriendNetwork.sendCredentials( { key: msg.key, password: self.password, encrypted: false } );		// TODO: See why false!
			break;

		case 'connected':
			self.connected = true;
			self.connecting = false;
			self.ready = false;
			self.communicationKey = msg.key;
			callback( true, 
			{
				helper: self.getSelf(),
				identifier: self.identifier,
				command: 'newHelperResponse',
			}, self.extra );
			break;

		case 'hostDisconnected':
			self.connected = false;
			self.ready = false;
			callback( true, 
			{
				helper: self.getSelf(),
				identifier: self.identifier,
				command: 'disconnected',
			}, self.extra );
			break;

		case 'error':
			self.connected = false;
			self.ready = false;
			callback( false,
			{
				helper: self.getSelf(),
				identifier: self.identifier,
				command: 'error',
				error: 'ERROR - Network error.'
			}, self.extra );
			break;

		// Message from helper
		case 'messageFromHost':
			var message = msg.data;

			// 'On the fly' actions...
			switch ( message.command )
			{
			case 'setSharedDoorResponse':
				if ( message.response )
				{
					self.ready = true;
				}
				break;
			case 'loadHelperResponse':
			case 'abortResponse':
			case 'resetResponse':
			case 'pauseResponse':
			case 'resumeResponse':
				self.running = message.response;
				break;
			case 'quitResponse':
				if ( message.response )
				{
					// He is OK, disconnect! Not OK, claims transmitted...
					FriendNetwork.disconnectFromHost( { key: self.communicationKey } );
				}
				break;
			}

			// Clean pending list / Send response to control
			if ( message.command.substring( message.command.length - 8 ) == 'Response' )
			{
				for ( var p = 0; p < self.pending.length; p++ )
				{
					var pending = self.pending[ p ];
					if ( pending.command + 'Response' == message.command && pending.identifier == message.identifier )
						self.pending.splice( p, 1 );

					var cb = self.callbacks[ message.identifier ];
					if ( cb )
					{
						message.helper = self;
						cb( message.response, message, message.extra );
					}
					break;
				}
			}
			break;

		default:
			break;
		}
	}
};
Friend.Network.Power.LocalHelper.prototype.message = function( message, callback, extra )
{
	var self = this;
	self.sendMessageToDistantHelper( message, callback, extra );
};
Friend.Network.Power.LocalHelper.prototype.sendMessageToDistantHelper = function( message, callback, extra )
{
	var self = this;

	if ( !message.identifier )
		message.identifier = 'msg' + Math.random() * 1000000 + Math.random() * 1000000;
	message.extra = extra;
	if ( callback )
		self.callbacks[ message.identifier ] = callback;		
	self.pending.push( message );	
	FriendNetwork.send( { key: self.communicationKey, data: message } );

	// A timeout on each message, variable
	var timeout = 1000 * 1000;		// TODO: change!
	if ( message.timeout )
		timeout = message.timeout;
	setTimeout( function()
	{
		for ( var p = 0; p < self.pending.length; p++ )
		{
			var pending = self.pending[ p ];
			if ( pending == message )
			{
				self.pending.splice( p, 1 );
				var cb = self.callbacks[ pending.identifier ];
				if ( cb )
				{
					cb( false, 
					{ 
						command: pending.command + 'Reponse', 
						identifier: pending.identifier,
						error: 'ERROR - Timeout.',
						helper: self.getSelf()
					}, pending.extra );
					self.callbacks = CleanArray( self.callbacks, cb );
				}
			}
			break;
		}
	}, timeout );
};
Friend.Network.Power.LocalHelper.prototype.getSelf = function()
{
	var self = this;
	
	var mySelf =
	{
		identifier: self.identifier,
		name: self.name,
		appName: self.appName,
		communicationKey: self.comnmunicationKey,
		connected: self.connected,
		connecting: self.connecting,
		ready: self.ready,
		description: self.description,
		extra: self.extra,
		hostType: self.hostType,
		hostURL: self.hostURL
	};
	return mySelf;
};

// A Helper Application, helper side
Friend.Network.Power.DistantHelper = function( options, callback, extra )
{
	var self = this;

	self.name = options.userInformation.name;
	self.userInformation = options.userInformation;
	self.deviceInformation = options.deviceInformation;
	self.powerShareSettings = options.powerShareSettings;
	self.information =
	{
		name: self.name,
		state: 'disconnected',
		online: false,
		connectedTo: 0,
		running: 0,
		percentageShared: 0,
		timeIdle: 0,
		timeConnected: 0,
		timeDisconnected: 0, 
		timeConnecting: 0, 
		timeRunning: 0, 
		earned: 0
	};

	if ( self.powerShareSettings.shareOnlyWithCommunity )
	{
		self.community = FriendNetworkFriends.workgroup;		// YUK!
		self.password = FriendNetworkFriends.workgroupPassword;	// Encode password! No password in clear in strings!
		self.tags = '#communityPower ';
	}
	else
	{
		self.community = '';
		self.password = options.password;
		if ( !self.password )
			self.password = '' + Math.random() * 1000000 + Math.random() * 1000000;
		tags = '#power ';
	}
	self.identifier = options.identifier;
	if ( !self.identifier )
		self.identifier = 'helper' + self.name + '#' + Math.random() * 1000000;
	self.extra = extra;
	self.controlApplications = {};
	self.pending = [];
	self.callbacks = {};
	self.workers = {};
	self.setState( 'connecting' );

	self.communicationHostName = self.name + '<power>' + Math.random() * 1000000;
	FriendNetwork.startHosting
	(
		{
			name: self.communicationHostName,
			connectionType: 'powerShare',
			description: self.userInformation.description,
			password: self.password,
			data:
			{
				workgroup: self.community,
				machineInfos: self.machineInfos,
				percentageShared: self.powerShareSettings.percentageShared,
				tags: self.tags,
				image: self.userInformation.image
			},
			callback: handleCommunicationHost
		}
	);

	function handleCommunicationHost( msg )
	{
		var control, message, done;
		var workr = null, workrError = false;

		switch ( msg.subCommand )
		{
		// Host properly created
		case 'host':
			console.log( 'Friend Network Power: host opened.' );
			self.communicationKey = msg.hostKey;
			self.connected = true;
			self.connecting = false;
			self.information.online = true;
			self.setState( 'idle' );
			callback( true, 
			{ 
				helper: self,
				identifier: self.identifier,
				command: 'newDistantHelperResponse' 
			}, self.extra );
			break;

		// New control application connected
		case 'clientConnected':
			console.log( 'Friend Network Power: ' + msg.name + ' connected' );
			control =
			{
				name: msg.name,
				communicationKey: msg.key,
				pending: [],
				callbacks: {},
				identifier: msg.key,
				extra: false
			};
			self.controlApplications[ msg.key ] = control;
			self.setState( 'connecting' );
			break;

		// Control Application disconnected
		case 'clientDisconnected':
			control = self.controlApplications[ msg.key ];
			if ( control )
			{
				console.log( 'Friend Network Power: ' + self.controlApplications[ msg.key ].name + ' disconnected' );

				self.controlApplications = CleanArray( self.controlApplications, control );
				callback( true, 
				{ 
					helper: self,
					identifier: control.identifier,
					command: 'controlApplicationDisconnected', 
					name: control.name
				}, control.extra );
				
				// Stops the worker
				if ( control.worker )
				{
					control.worker.worker.terminate();
					self.workers = CleanArray( self.workers, control.worker );
				}
			}
			else
			{
				console.log( 'Friend Network Power: should not happen!' );							
				callback( false, 
				{ 
					helper: self,
					identifier: self.identifier,
					command: 'error', 
					error: 'Error - Unknown.'
				}, self.extra );
			}
			self.information.connectedTo--;
			self.information.running--;
			break;

		// Error: removes share
		case 'error':
			control = self.controlApplications[ msg.key ];
			if ( control )
			{
				console.log( 'Friend Network Power: ' + self.controlApplications[ msg.key ].name + ' error' );

				// Stops the worker
				if ( control.worker )
				{
					control.worker.worker.terminate();
					self.workers = CleanArray( self.workers, control.worker );
				}
				self.controlApplications = CleanArray( self.controlApplications, control );

				// Callback
				callback( false, 
				{ 
					helper: self,
					identifier: control.identifier,
					command: 'error', 
					error: 'ERROR - Power Application disconnected.'
				}, control.extra );
			}
			else
			{
				console.log( 'Friend Network Power: error!' );							
				callback( false, 
				{ 
					helper: self,
					identifier: self.identifier,
					command: 'error', 
					error: 'ERROR - Network error.'
				}, self.extra );
			}
			self.information.online = false;
			self.information.connectedTo = 0;
			self.information.running = 0;
			self.setState( 'disconnected' );
			break;

		// Handle commands
		case 'messageFromClient':
			done = false;
			control = self.controlApplications[ msg.key ];
			if ( control )
			{
				message = msg.data;
				switch ( message.command )
				{
				case 'connectToSharedDoor':
					self.doorURL = message.doorURL;

					// Connect to door!
					FriendNetworkDoor.connectToDoor
					( 
						FriendNetwork.getHostNameFromURL( self.doorURL ), 
						FriendNetwork.getAppNameFromURL( self.doorURL ), 
						message.doorType, 
						message.doorPassword,										
						function( response, connection )
						{
							if ( response == 'connected' )
							{
								self.ready = true;
								self.doorConnection = connection;
								self.sharedDoor = connection.door;		
								self.information.connectedTo++;
								self.setState( 'idle' );
								callback( true, 
								{
									helper: self,
									identifier: control.identifier,
									command: 'newControlApplication',				
									name: msg.name,
									sharedDoor: self.sharedDoor.getDoor()
								}, self.extra );
								self.sendMessageToLocalHelper( control,
								{
									identifier: message.identifier,
									command: message.command + 'Response',
									response: true
								}, null, message.extra );
							}
							else
							{
								self.sendMessageToLocalHelper( 
								{
									identifier: message.identifier,
									command: message.command + 'Response',
									response: false,
									error: 'ERROR - Cannot connect to shared door.'
								}, null, message.extra );
							}
						}
					);			
					break;

				case 'loadWorkers':	
					doLoadWorker( message.name, message.pathOrCode );
					break;

				case 'sendMessage':				
				case 'run':
				case 'abort':
				case 'pause':
				case 'resume':
					workr = self.workers[ message.workerIdentifier ];
					if ( workr )
					{
						workr.worker.postMessage( message );
					}
					else
					{
						workrError = true;
					}
					done = true;
					break;
					
				case 'reset':
					workr = self.workers[ message.workerIdentifier ];
					if ( workr )
					{
						if ( message.options.force )
						{
							// Stops the worker, and restarts it!
							workr.worker.terminate();
							self.workers = CleanArray( self.workers, workr );
							doLoadWorker( workr.name, workr.code, true );
						}
						else
						{
							workr.worker.postMessage( message );
						}
					}
					else
					{
						workrError = true;
					}
					done = true;
					break;

				case 'quit':
					workr = self.workers[ message.workerIdentifier ];
					if ( message.options.force )
					{
						if ( workr )
						{
							// Stops the worker
							workr.worker.terminate();
						}

						// Disconnect from the door
						FriendNetworkDoor.disconnectFromDoor( FriendNetwork.getHostNameFromURL( self.doorURL ), FriendNetwork.getAppNameFromURL( self.doorURL ) );
						self.information.running = 0;
						self.information.connectedTo--;
						self.setState( 'idle' );

						// Inform the other side
						self.sendMessageToLocalHelper( control,
						{
							identifier: message.identifier,
							command: 'quitResponse',
							response: true
						}, null, message.extra );
						self.workers = CleanArray( self.workers, workr );
					}
					else
					{
						workr.worker.postMessage( message );
					}
					done = true;
					break;
				}

				// Responses: return to sender!
				if ( !done && message.command.substring( message.command.length - 8 ) == 'Response' )
				{
					for ( var p = 0; p < control.pending.length; p++ )
					{
						var pending = control.pending[ p ];
						if ( pending.command == message.command && pending.identifier == message.identifier )
						{
							control.pending.splice( p );
							var cb = control.callbacks[ pending.identifier ];
							if ( cb )
							{
								control.callbacks = CleanArray( control.callbacks, cb );
								message.helper = self;
								cb( true, message, message.extra );
							}
						}
					}
				}

				// If error with a worker
				if ( workrError )
				{
					self.sendMessageToLocalHelper( control,
					{
						identifier: message.identifier,
						command: message.command + 'Response',
						response: false,
						error: 'ERROR - Worker not found.'
					}, null, message.extra );
				}
				break;
			}
			break;
		}
		function doLoadWorker( name, pathOrCode, newCode )
		{
			var workerIdentifier = name + '|' + message.identifier;
			var worker = self.workers[ workerIdentifier ];
			if ( !worker )
			{
				// A path, or some code?
				if ( !newCode && pathOrCode.indexOf( '// Friend.Worker direct code.' ) < 0 )
				{
					// Load the file, must be present on the shared disc
					Friend.DOS.loadFile( pathOrCode, { binary: false }, function( response, data, extra )
					{
						if ( response )
						{
							doLoad( data );
						}
						else
						{
							callback( false, 
							{
								helper: self,
								identifier: control.identifier,
								command: 'loadWorkers',
								path: msg.pathOrCode,
								description: msg.description,
								error: 'ERROR - Worker source code not found.'
							}, self.extra );
							self.sendMessageToLocalHelper( control,
							{
								identifier: message.identifier,
								command: 'loadWorkersResponse',
								response: false,
								error: 'ERROR - Worker source code not found.'
							}, message.extra );
						}
					} );
				}
				else
				{
					doLoad( pathOrCode );
				}
			}
			else
			{
				callback( false, 
				{
					helper: self,
					identifier: control.identifier,
					command: 'loadWorkers',
					path: msg.path,
					description: msg.description,
					error: 'ERROR - Worker already running.'
				}, self.extra );
				self.sendMessageToLocalHelper( control,
				{
					identifier: message.identifier,
					command: 'loadWorkersResponse',
					response: false,
					error: 'ERROR - Worker already running.'
				}, message.extra );
			}
			function doLoad( workerCode )
			{
				var optionsJSON = JSON.stringify( message.options );
				var code = Friend.Network.Power.workerInitializationCode + workerCode;
				code += '\n';
				code += '// Create the Worker object...\n';
				code += 'Friend.worker = new Friend.Worker( "' + name + '", "' + workerIdentifier + '", "' + optionsJSON + '" ); \n';

				var blob = new Blob( [ code ], { type: 'application/javascript' } );
				var urlCreator = window.URL || window.webkitURL;
				var workerObject = new Worker( urlCreator.createObjectURL( blob ) );
				if ( workerObject )
				{
					self.workers[ workerIdentifier ] =
					{
						name: name,
						identifier: workerIdentifier,
						worker: workerObject,
						blob: blob,
						code: code,
						state: Friend.Network.Power.Worker.STATE_UNINITIALIZED,
						initializationExtra: message.extra,
						initializationOptions: message.options,
						APICalls: Friend.Network.Power.friendAPI,
						callbacks: {}
					};
					control.worker = self.workers[ workerIdentifier ];
					workerObject.onmessage = handleWorkerMessages;
					workerObject.onerror = handleWorkerErrors;
					workerObject.postMessage
					(
						{
							command: 'loadWorkers',
							name: name,
							identifier: message.identifier,
							workerIdentifier: workerIdentifier,
							options: message.options
						}
					);
				}
			}
		}
		function handleWorkerMessages( e )
		{
			var workerMessage = e.data;
			var worker = self.workers[ workerMessage.workerIdentifier ];
			if ( !worker )
			{
				console.log( '*** Should NEVER happen!' );
			}
			switch( workerMessage.command )
			{
				case 'loadWorkersResponse':
					if ( workerMessage.response )
					{
						self.information.loaded++;
						self.setState( 'idle' );

						callback( true, 
						{
							helper: self,
							identifier: control.identifier,
							command: 'loadWorkers',
							workerIdentifier: workerMessage.identifier,
							response: true,
							data: workerMessage.identifier
						}, self.extra );
						self.sendMessageToLocalHelper( control,
						{
							identifier: message.identifier,
							workerIdentifier: workerMessage.workerIdentifier,
							command: 'loadWorkersResponse',
							response: true,
							data: workerMessage.data
						}, worker.initializationExtra );
						return;
					}
					break;
				case 'runResponse':
					if ( workerMessage.response )
					{
						self.information.running++;
						self.setState( 'running' );
					}
					break;
				case 'restartResponse':
					if ( workerMessage.response )
					{
						self.information.running--;
						self.setState( 'idle' );
					}
					break;
				case 'abortResponse':
					if ( workerMessage.response )
					{
						self.information.running--;
						self.setState( 'idle' );
					}
					break;
				case 'pauseResponse':
					if ( workerMessage.response )
					{
						self.information.running--;
						self.setState( 'paused' );
					}
					break;
				case 'resumeResponse':
					if ( workerMessage.response )
					{
						self.information.running++;
						self.setState( 'running' );
					}
					break;
				case 'quitResponse':
					if ( workerMessage.response || worker.quitOptions.force )
					{
						// Disconnect from the door
						FriendNetworkDoor.disconnectFromDoor( FriendNetwork.getHostNameFromURL( self.doorURL ), FriendNetwork.getAppNameFromURL( self.doorURL ) );
						self.information.running = 0;
						self.information.connectedTo--;
						self.setState( 'idle' );
					}
					break;

				case 'callAPI':
					if ( worker.APICalls[ workerMessage.functionPath ] )
					{
						callAPIFunction( worker, workerMessage, function( response, data, extra )
						{
							worker.postMessage
							(
								{
									workerIdentifier: workerMessage.workeridentifier,
									workerCallbackId: workerMessage.workerCallbackId,
									command: workerMessage.command + 'Response',									
									response: response,
									data: data,
									extra: extra
								}
							);
						}, workerMessage.extra );
					}
					break;
				case 'sendMessage':
					workerMessage.identifier = self.identifier;
					worker.callbacks[ workerMessage.workerCallbackId ] = workerMessage;
					self.sendMessageToLocalHelper( control, workerMessage, workerMessage.extra );
					break;
			}

			// Transmit the message above
			callback( true, 
			{
				helper: self,
				identifier: control.identifier,
				command: workerMessage.command,
				workerIdentifier: workerMessage.identifier,
				response: workerMessage.response,
				data: workerMessage.data
			}, self.extra );
			self.sendMessageToLocalHelper( control,
			{
				identifier: workerMessage.identifier,
				command: workerMessage.command,
				workerIdentifier: workerMessage.workerIdentifier,
				response: workerMessage.response,
				data: workerMessage.data
			}, message.extra );
		}
	}
	function handleWorkerErrors( error )
	{
		for ( var w in self.workers )
		{
			var worker = self.workers[ w ];
			if ( worker.blob == error.filename )
			{
				// Transmit the message above
				callback( false, 
				{
					helper: self,
					identifier: control.identifier,
					workerIdentifier: worker.identifier,
					command: 'error',
					response: false,
					data: { error: error.message, lineno: error.lineno }
				}, self.extra );
				self.sendMessageToLocalHelper( control,
				{
					identifier: message.identifier,
					workerIdentifier: worker.identifier,
					command: 'error',
					response: error.message,
					data: { error: error.message, lineno: error.lineno }
				}, message.extra );
				self.setState( 'idle' );
			}
		}
	}		

	function callAPIFunction( worker, workerMessage, callback, extra )
	{
		// Call the function
		var definition = Friend.APIDefinition[ workerMessage.method ];
		if ( definition )
		{
			// Replace callback by local callback
			if ( definition.callbackPosition >= 0 )
				workerMessage.arguments[ definition.callbackPosition ] = thisCallback;

			// Up to 10 arguments (Javascript -> pass more in objects)
			switch ( definition.numberOfArguments )
			{
				case 0:
					ret = definition.klass();
					break;
				case 1:
					ret = definition.klass( msg.arguments[ 0 ] );
					break;
				case 2:
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ] );
					break;
				case 3:
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ] );
					break;
				case 4:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ] );
					break;
				case 5:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ] );
					break;
				case 6:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ],
											msg.arguments[ 5 ] );
					break;
				case 7:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ],
											msg.arguments[ 5 ],
											msg.arguments[ 6 ] );
					break;
				case 8:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ],
											msg.arguments[ 5 ],
											msg.arguments[ 6 ],
											msg.arguments[ 7 ] );
					break;
				case 9:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ],
											msg.arguments[ 5 ],
											msg.arguments[ 6 ],
											msg.arguments[ 7 ],
											msg.arguments[ 8 ] );
					break;
				case 10:	
					ret = definition.klass( msg.arguments[ 0 ], 
											msg.arguments[ 1 ],
											msg.arguments[ 2 ],
											msg.arguments[ 3 ],
											msg.arguments[ 4 ],
											msg.arguments[ 5 ],
											msg.arguments[ 6 ],
											msg.arguments[ 7 ],
											msg.arguments[ 8 ],
											msg.arguments[ 9 ] );
					break;
			}

			// If value is by return, send the message back...
			if ( definition.isDirect )
			{
				// Except for double access functions, when it is returned by callback.
				if ( ret != Friend.NORETURN )
				{
					callback( true, ret, workerMessage.extra );
				}
			}
			function thisCallback( response, data, extra )
			{
				callback( response, data, extra );
			}
		}
		else
		{
			// API Function not found
			callback( false, 
			{
				command: workerMessage.command,
				method: workerMessage.method,
				response: false,
				data: { error: 'ERROR - Function not available.' },
			}, workerMessage.extra ); 
		}
	}
};
Friend.Network.Power.DistantHelper.prototype.close = function()
{
	var self = this;
	if ( self.handleIdle )
	{
		clearInterval( self.handleIdle );
		self.handleIdle = false;
	}
};
Friend.Network.Power.DistantHelper.prototype.setState = function( state )
{
	var self = this;
	self.information.state = state;
	if ( !self.handleIdle )
	{
		self.previousTime = new Date().getTime();				
		self.handleIdle = setInterval( function()
		{
			var now = new Date().getTime();
			self.information.earned = self.information.timeRunning * 0.000005;
			if ( self.information.state != 'running' )
				self.information.percentageShared = 0;
			if ( self.information.state == 'idle' || self.information.state == 'paused' )
				self.information.timeIdle += now - self.previousTime;
			else if ( self.information.state == 'running' )
			{
				self.information.timeRunning += now - self.previousTime;
				self.information.percentageShared = self.powerShareSettings.percentageShared;
			}
			else if ( self.information.state == 'connecting' )
				self.information.timeConnecting += now - self.previousTime;
			else if ( self.information.state == 'disconnected' )
				self.information.timeDisconnected += now - self.previousTime;

			if ( self.information.state == 'connected' || self.connectedTo > 0 )
				self.timeConnected += now - self.previousTime;

			self.previousTime = now;				
		}, 500 );
	}
},
Friend.Network.Power.DistantHelper.prototype.message = function( controlId, message, callback, extra )
{
	var self = this;

	var control = self.controlApplications[ controlId ];
	if ( !control )
	{
		callback( false, 
		{
			helper: self,
			identifier: message.identifier,
			command: message.command + 'Response',
			error: 'ERROR - Control Application not found.'
		}, extra );
		return;
	}
	// Eventually intercept the message...
	self.sendMessageToLocalHelper( control, message, callback, extra );
};
Friend.Network.Power.DistantHelper.prototype.sendMessageToLocalHelper = function( control, message, callback, extra )
{
	var self = this;

	if ( typeof message.identifier == 'undefined' )
		message.identifier = 'msg' + Math.random() * 1000000 + Math.random() * 1000000;
	message.extra = extra;
	if ( callback )
		control.callbacks[ message.identifier ] = callback;
	FriendNetwork.send( { key: control.communicationKey, data: message } );

	// A timeout on each message, variable
	self.pending.push( message );
	var timeout = 10 * 1000;
	if ( message.timeout )
		timeout = message.timeout;
	setTimeout( function()
	{
		for ( var p = 0; p < control.pending.length; p++ )
		{
			var pending = control.pending[ p ];
			if ( pending == message )
			{
				control.pending.splice( p, 1 );
				var cb = control.callbacks[ pending.identifier ];
				if ( cb )
				{
					control.callbacks = CleanArray( control.callbacks, cb );
					cb( false, 
					{
						helper: self,
						identifier: pending.identifier,
						command: message.command + 'Response',
						error: 'ERROR - Timeout.'
					}, message.extra );
				}
			}
			break;
		}
	}, timeout );
	return message.identifier;
};

Friend.Network.Power.friendAPI =
{
	'Friend.DOS.readFile': true
};
Friend.Network.Power.workerInitializationCode = "													\n\
/*©agpl**************************************************************************					\n\
 *                                                                              *					\n\
 * Friend Unifying Platform                                                     *					\n\
 * ------------------------                                                     *					\n\
 *                                                                              *					\n\
 * Copyright (c) Friend Software Labs AS, all rights reserved 2014-2017         *					\n\
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *					\n\
 * Tel.: (+47) 40 72 96 56                                                      *					\n\
 * Mail: info@friendos.com                                                      *					\n\
 *                                                                              *					\n\
 *****************************************************************************©*/					\n\
/** @file																							\n\
 *																									\n\
 * Friend Network Worker base code																	\n\
 * List of functions available to workers															\n\
 *																									\n\
 * @author FL (Francois Lionet)																		\n\
 * @date first pushed on 12/08/2018																	\n\
 */																									\n\
																									\n\
Friend = {};																						\n\
Friend.DOS = {};																					\n\
Friend.DOS.readFile = function( path, options, callback, extra )									\n\
{																									\n\
debugger;																							\n\
	var callbackIdentifier = workerIdentifier + '|' + Math.random() * 1000000;						\n\
	var message =																					\n\
	{																								\n\
		command: 'callAPI',																			\n\
		workerIdentifier: workerIdentifier,															\n\
		workerCallbackId: callbackIdentifier,														\n\
		functionPath: path,																			\n\
		options: options,																			\n\
		extra: extra																				\n\
	};																								\n\
	Friend.worker.callbacks[ callbackIdentifier ] = callback;										\n\
	postMessage( message );																			\n\
}																									\n\
																									\n\
onmessage = function( e )																			\n\
{																									\n\
	Friend.Worker.dispatchMessage( e.data );														\n\
}																									\n\
																									\n\
//																									\n\
// Default Friend.Worker object																		\n\
//																									\n\
Friend.Worker = function( name, identifier, options, callback, extra )								\n\
{																									\n\
	this.name = name;																				\n\
	this.identifier = identifier;																	\n\
	this.options = options;																			\n\
	this.callbacks = {};																			\n\																									\n\
};																									\n\
Friend.Worker.dispatchMessage = function( message )													\n\
{																									\n\
	// Find the callback!																			\n\
	if ( message.workerCallbackId )																	\n\
	{																								\n\
		var callback = Friend.worker.callbacks[ message.workerCallbackId ];									\n\
		if ( callback )																				\n\
		{																							\n\
			// Remove the callback																	\n\
			var temp = {};																			\n\
			for ( var c in Friend.worker.callbacks )												\n\
			{																						\n\
				if ( c != message.workerCallbackId )												\n\
					temp[ c ] = Friend.worker.callbacks[ c ];										\n\
			}																						\n\
			Friend.worker.callbacks = temp;															\n\
																									\n\
			// Callback!																			\n\
			callback.apply( Friend.worker, [ message.response, message.data, message.extra ] );		\n\
		}																							\n\
	}																								\n\
	else																							\n\
	{																								\n\
		// No callback, a command?																	\n\
		switch( message.command )																	\n\
		{																							\n\
		case 'loadWorkers':																			\n\
			Friend.worker = new Friend.Worker														\n\
			( 																						\n\
				message.name, 																		\n\
				message.workerIdentifier,															\n\
				message.options																		\n\
			);																						\n\
			Friend.Worker.onLoad.apply( Friend.worker, [ message.options, doCallback, message.extra ] );													\n\
			break;																					\n\
		case 'run':																					\n\
			Friend.Worker.onRun.apply( Friend.worker, [ message.options, doCallback, message.extra ] );													\n\
			break;																					\n\
		case 'abort':																				\n\
			Friend.Worker.onAbort.apply( Friend.worker, [ message.options, doCallback, message.extra ] );					\n\
			break;																					\n\
		case 'reset':																				\n\
			Friend.Worker.onReset.apply( Friend.worker, [ message.options, doCallback, message.extra ] );					\n\
			break;																					\n\
		case 'quit':																				\n\
			Friend.Worker.onQuit.apply( Friend.worker, [ message.options, doCallback, message.extra ] );					\n\
			break;																					\n\
		case 'pause':																				\n\
			Friend.Worker.onPause.apply( Friend.worker, [ message.options, doCallback, message.extra ] );					\n\
			break;																					\n\
		case 'resume':																				\n\
			Friend.Worker.onResume.apply( Friend.worker, [ message.options, doCallback, message.extra ] );					\n\
			break;																					\n\
		default:																					\n\
			// Not found, generic message.															\n\
			Friend.Worker.onMessage.apply( Friend.worker, [ message, doCallback, message.extra ] );							\n\
			break;																					\n\
		}																							\n\
	}																								\n\																									\n\
	// Send the response to Friend, he will transmit! 												\n\
	function doCallback( response, data, extra )													\n\
	{																								\n\
		// Send the response to Friend, he will transmit! 											\n\
		postMessage																					\n\
		(																							\n\
			{																						\n\
				identifier: message.identifier,														\n\
				workerIdentifier: this.identifier,													\n\
				command: message.command + 'Response',												\n\
				response: response,																	\n\
				data: data,																			\n\
				extra: extra																		\n\
			}																						\n\
		);																							\n\
	} 																								\n\
}																									\n\
Friend.Worker.onLoad = function( options, callback, extra )											\n\
{																									\n\
	callback.apply( this, [ true, {}, extra ] );																	\n\
};																									\n\
Friend.Worker.onRun = function( options, callback, extra )											\n\
{																									\n\
	callback.apply( this, [ false, { error: 'ERROR - Function not implemented.'}, extra ] );						\n\
};																									\n\
Friend.Worker.onAbort = function( options, callback, extra )										\n\
{																									\n\
	callback.apply( this, [ true, {}, extra ] );																	\n\
};																									\n\
Friend.Worker.onReset = function( options, callback, extra )										\n\
{																									\n\
	callback.apply( this, [ true, {}, extra ] );																	\n\
};																									\n\
Friend.Worker.onQuit = function( options, callback, extra )											\n\
{																									\n\
	callback.apply( this, [ true, {}, extra ] );													\n\
};																									\n\
Friend.Worker.onPause = function( options, callback, extra )										\n\
{																									\n\
	callback.apply( this, [ false, { error: 'ERROR - Function not implemented.'}, extra ] );						\n\
};																									\n\
Friend.Worker.onResume = function( options, callback, extra )										\n\
{																									\n\
	callback.apply( this, [ false, { error: 'ERROR - Function not implemented.'}, extra ] );						\n\
};																									\n\
Friend.Worker.onMessage = function( message, callback, extra )										\n\
{																									\n\
	callback.apply( this, [ false, { error: 'ERROR - Function not implemented.'}, extra ] );						\n\
};																									\n\
																									\n\
																									\n\
//////////////////////////////////////////////////////////////////									\n\
// 																									\n\
// And now, for something completely different, your code! :)										\n\
//																									\n\
";


// Add this to the end of /web_desktop/js/io/friendnetworkpower.js
Friend.Network.Power.pawel = function( options, callback, extra )
{
	// Get Friend Network settings
	var sm = new Module( 'system' );
	sm.onExecuted = function( e, d )
	{
		var settings;
		if ( e == 'ok' )
		{
			if( d )
			{
				try
				{
					d = JSON.parse( d );
					if ( d.friendNetwork != [] )
						settings = d.friendNetwork;
				}
				catch( e )
				{
					d = null;
				}
			}

			if ( settings )
			{
				// Get the avatar
				sm = new Module( 'system' );
				sm.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						if( d )
						{
							try
							{
								d = JSON.parse( d );
							}
							catch( e )
							{
								d = null;
							}
						}
					}
					if ( d.avatar )
					{
						callback( true, d.avatar, extra );
					}
				}
				sm.execute( 'getsetting', { setting: 'avatar' } );
			}
		}
	}
	sm.execute( 'getsetting', { setting: 'friendNetwork' } );
}
Friend.addToAPI( 'Friend.Network.Power.pawel', [ 'options', 'callback', 'extra' ], { tags: '#callback ' } );
