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
/** @file
 *
 * Tree application network management
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 29/09/2017
 */
Friend = window.Friend || {};
Friend.Network = Friend.Network || {};
Friend.Flags = Friend.Flags || {};

/**
 * Item: Network
 *
 * Handles network connection and communication via FriendNetwork
 *
 * @param tree (object) The Tree engine
 * @param name (string) The name of the object
 * @param flags (object) Creation flags
 *
 * Flags
 *
 * application: (object) the calling application
 * appName: (string) appName the name of the application
 * caller: (object) caller object to send the messages to
 * messages: (function) function caller's function to call for messages
 * password: (string) connection password used on both sides
 */
Friend.Network.Manager = function ( tree, name, flags )
{
	var self = this;
	this.caller = false;
	this.messages = false;
	this.appName = 'My application';
	this.password = false;
	this.treePassword = 'A_fucking_complex_password_not_in_clear_in_the_code_6545465!';
	this.clients = [ ];
	this.hostClients = [ ];
    this.treeClients = [ ];
	this.treeHostClients = [ ];
    this.treeHosting = false;
    this.hosting = false;
    this.playerCount = 0;
	this.objects = [ ];
	this.index = false;
	Friend.Tree.Items.init( this, tree, name, 'Friend.Network.Manager', flags );
	Object.assign( this, Friend.Network.Manager );
};
Friend.Network.Manager.getHosts = function ( separator, name )
{
	var self = this;
	FriendNetwork.list( function ( msg )
	{
		var list = [ ];

		// Computes the response of Friend Network, filtering with the name of the application
		for ( var a = 0; a < msg.hosts.length; a ++ )
		{
			if ( msg.hosts[a].apps )
			{
				var apps = msg.hosts[a].apps;
				for ( var b = 0; b < apps.length; b ++ )
				{
					var hostName = apps[ b ].name;
					var pos = hostName.indexOf( separator );
					if ( pos > 0 )
					{
						var appName;
						if ( name == '*' )
							appName = self.appName;
						else
							appName = hostName.substring( 0, pos );
						if ( appName == '*' || appName == self.appName )
						{
							list.push(
							{
								name: msg.hosts[ a ].name,
								hostName: hostName + '@' + msg.hosts[ a ].name
							} );
						}
					}
				}
			}
		}

		// Sends to caller
		var data =
		{
			command: 'treeSharing',
			subCommand: 'gethosts',
			list: list
		};
		self.messages.apply( self.caller, [ data ] );
	} );
};
Friend.Network.Manager.checkReady = function ()
{
	for ( var key in this.clients )
	{
		if ( ! this.clients[ key ].ready )
			return false;
	}
	for ( key in this.hostClients )
	{
		if ( ! this.hostClients[ key ].ready )
			return false;
	}
	return true;
};
Friend.Network.Manager.getCreationFlags = function ()
{
	var flags = { };
	flags.clients = this.clients;
	flags.hostClients = this.hostClients;
	flags.appName = this.appName;
	flags.playerCount = this.playerCount;
	return flags;
};
Friend.Network.Manager.getTrees = function ()
{
    return this.getHosts( '<treeShare>' );
};
Friend.Network.Manager.hostTree = function ( name, applicationName, flags )
{
	var identifier = flags.identifier;
	if ( !identifier )
		identifier = Math.random() * 1000000 + Math.random() * 1000000;	
	flags.password = this.treePassword;
	FriendNetwork.host( name, applicationName, 'application', identifier, flags, handleHost );
	
	var self = this;
    function handleHost( msg )
    {
        switch ( msg.command )
        {
            case 'friendnetwork':
                switch ( msg.subCommand )
                {
                    case 'host':
                        self.treeHosting =
                        {
                            key: msg.hostKey,
                            hostName: msg.name
						};
						self.treeHostName = msg.name;
                        break;

					case 'clientConnected':
                        // Add new client to the host
                        self.treeHostClients[ msg.key ] =
                        {
                            key: msg.key,
                            name: msg.name,
							ready: false
						};
						
                        // Relays to the application
                        self.treeShareClientCount++;
                        var message =
                        {
                            command: 'treeSharing',
                            subCommand: 'clientConnected',
                            numberOfClients: self.treeShareClientCount,
                            key: key
                        };
                        if ( self.caller && self.messages )
                            self.messages.apply( self.caller, [ message ] );

						// Send the welcome page
						self.sendHTML( msg.key, 'Progdir:Shared/index.html', 'Home:', msg.name );
                        break;

                    case 'clientDisconnected':
                        for ( var key in self.treeHostClients )
                        {
                            if ( key == msg.key )
                            {
                                self.treeShareClientCount--;
                                var message =
                                {
                                    command: 'treeSharing',
                                    subCommand: 'clientDisconnected',
                                    numberOfClients: self.treeShareClientCount,
                                    key: key
                                };
                                if ( self.caller && self.messages )
                                    self.messages.apply( self.caller, [ message ] );
                                self.treeHostClients[ key ] = false;
                            }
                            self.treeHostClients = self.utilities.cleanArray( self.treeHostClients );
                        }
                        break;

					// Private message : relays to the application
					case 'messageFromClient':
						if ( self.caller && self.messages )
							self.messages.apply( self.caller, [ msg.data ] );
						break;

					case 'fileTransfer':
						console.log( 'Friend.Network.Manager.hostTree ' + msg.response, msg );
						switch ( msg.response )
						{
							default:
								break;
						};
						if ( self.caller && self.messages )
							self.messages.apply( self.caller, [ msg.data ] );
						break;

                    default:
                        // Relays the message to application
                        if ( self.caller && self.messages )
                            self.messages.apply( self.caller, [ msg ] );
                        break;
                }
                break;
        }
    }
};

// Send files to the connected tree
Friend.Network.Manager.sendFiles = function( key, list, destinationPath, hostName, finalReponse )
{
	if ( !finalResponse )
		finalResponse = 'fileTransferSuccessfull';
	FriendNetwork.transferFiles( key, list, destinationPath, finalResponse );
};

// Ask for files to the connected tree
Friend.Network.Manager.getFiles = function( key, list, destinationPath, hostName, finalResponse )
{
	if ( !finalResponse )
		finalResponse = 'fileTransferSuccessfull';
	FriendNetwork.demandFileTransfer( key, list, destinationPath, finalResponse );
};

// Send a HTML file and all the files associated with it
Friend.Network.Manager.getWelcomePage = function( key )
{
	this.getFiles( key, [],	'Home:', 'Welcome' );
};

// Send a HTML file and all the files associated with it
Friend.Network.Manager.sendHTML = function( key, path, destinationPath, hostName )
{
	// Extracts the name of the file
	var name = Friend.Utilities.getFilenameFromPath( path );

	// Loads the file
	var html = new File( path );
	html.onLoad = function( source )
	{
		// Get the list of links to external files
		var list = Friend.Utilities.extractFriendPaths( source );
		
		// Add the current file first position in the list of files to transmit
		var copy = [];
		copy.push(  
		{
			name: name,
			path: path,
			data: source,
			destinationPath: 'Home:'
		} );
	
		// Converts the list for FriendNetwork
		for ( var f = 0; f < list.length; f++ )
		{
			copy.push( 
			{
				name: Friend.Utilities.getFilenameFromPath( list[ f ] ),
				path: getImageUrl( list[ f ] ),				
				destinationPath: 'Home:',
				info: list[ f ]
			} );
		}

		// Call FriendNetwork
		FriendNetwork.transferFiles( key, copy, destinationPath, 'welcome' );
	}
	html.load();
};

Friend.Network.Manager.connectToTree = function ( name, flags )
{
	var self = this;
	var flags = { p2p: this.p2p };
	FriendNetwork.connect( name, 'application', flags, handleClients );

	function handleClients( msg )
	{
		//debugger;
		if ( msg.command == 'friendnetwork' )
		{
			switch ( msg.subCommand )
			{
				case 'getCredentials':
					FriendNetwork.sendCredentials( msg.key, self.treePassword );
					break;
				case 'connected':
					var client =
					{
						key: msg.key,
						hostName: msg.hostName,
						ready: false
					};
					self.treeClients[ msg.key ] = client;
					self.treeClients[ msg.key ].ready = true;

					// Relays to the application
                    var message =
                    {
                        command: 'treeSharing',
                        subCommand: 'connected',
                        key: msg.key,
                        hostName: msg.hostName
                    };
					if ( self.caller && self.messages )
						self.messages.apply( self.caller, [ msg ] );
					break;
				case 'hostDisconnected':
					for ( var key in self.treeClients )
					{
						if ( key == msg.key )
						{
							var message =
							{
								command: 'treeSharing',
								subCommand: 'hostDisconnected',
								key: key,
								hostName: self.treeClients[ key ].hostName
							};
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ message ] );
							self.treeClients[ c ] = false;
						}
						this.treeClients = self.utilities.cleanArray( this.treeClients );
					}
					break;

				case 'messageFromHost':
					switch ( msg.data.subCommand )
					{
						case 'create':
							self.itemCreate( msg.data );
							break;
						case 'update':
							self.doUpdate( msg.data );
							break;
						case 'destroy':
							self.itemDestroy( msg.data );
							break;
						default:
							// Private message : relays to the application
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg.data ] );
							break;
					}
					break;

				case 'fileTransfer':
					switch ( msg.response )
					{
						case 'fileDownloadProgress':
							console.log( 'Friend.Network.Manager - fileTransfer downloading: ' +  msg.fileProgress, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
						default:
							console.log( 'Friend.Network.Manager - File transfer: ' + msg.response, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
					};
					break;

				case 'treeShare':
					switch ( msg.response )
					{
						default:
							console.log( 'Friend.Network.Manager.connectToTree - treeShare: ' + msg.response, msg );
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ msg ] );
							break;
					};
					break;
				
				default:
					// Relays to the application
					if ( self.caller && self.messages )
						self.messages.apply( self.caller, [ msg ] );
					break;
			}
		}
	}
};

// Multiplayer game handling
Friend.Network.Manager.host = function ( mainHost )
{
	//debugger;
	var self = this;
	if ( typeof mainHost == 'undefined' )
	{
		this.hostName = this.appName + '<treeHost>' + Math.random() * 1000000 + Math.random() * 1000000;
		this.mainHost = true;
	}
	else
	{
		this.hostName = this.appName + '<treeClient>' + Math.random() * 1000000 + Math.random() * 1000000;
		this.mainHost = false;
	}
	FriendNetwork.host( this.hostName, this.password, handleHost );

	function handleHost( msg )
	{
		switch ( msg.command )
		{
			case 'friendnetwork':
				switch ( msg.subCommand )
				{
					case 'host':
						self.hosting =
						{
							key: msg.hostKey,
							hostName: msg.name
						};
						break;

					case 'clientConnected':

						// Sends the name of hosts to connect to to the new client
						var ready = true;
						if ( self.mainHost )
						{
							var list = [ ];
							for ( var key in self.hostClients )
								list.push( self.hostClients[ key ].hostName );
							if ( list.length > 0 )
							{
								var data =
								{
									command: 'multiplayer',
									subCommand: 'hostsToConnect',
									hostNames: list
								};
								FriendNetwork.send( msg.key, data );
								ready = false;							// hostClient will only be ready when connected to all the other hosts
							}
						}
						// Add new client to the host
						self.hostClients[ msg.key ] =
						{
							key: msg.key,
							name: msg.name,
							ready: ready,
							number: self.playerCount
						};
						msg.number = self.playerCount ++;

						// Send his own player number
						var data =
						{
							command: 'multiplayer',
							subCommand: 'iamplayer',
							playerNumber: self.playerCount
						};
						FriendNetwork.send( msg.key, data );

						// Relays to the application
						if ( self.caller && self.messages )
							self.messages.apply( self.caller, [ msg ] );
						break;

					case 'clientDisconnected':
						for ( var key in self.hostClients )
						{
							if ( key == msg.key )
							{
								var message =
								{
									command: 'multiplayer',
									subCommand: 'playerDisconnected',
									playerNumber: self.hostClients[ key ].playerNumber,
									key: key
								};
								if ( self.caller && self.messages )
									self.messages.apply( self.caller, [ message ] );
								self.hostClients[ key ] = false;
							}
							self.hostClients = self.utilities.cleanArray( self.hostClients );
						}
						break;

					case 'messageFromClient':
						if ( msg.data.command == 'multiplayer' )
						{
							switch ( msg.data.subCommand )
							{
								case 'ready':
									self.hostClients[ msg.key ].ready = true;
									break;
								case 'hereIsMyHost':
									self.hostClients[ msg.key ].hostName = msg.data.hostName;
									break;
								case 'create':
									self.itemCreate( msg.data );
									break;
								case 'update':
									self.doUpdate( msg.data );
									break;
								case 'destroy':
									self.itemDestroy( msg.data );
									break;
								default:
									// Private message : relays to the application
									if ( self.caller && self.messages )
										self.messages.apply( self.caller, [ msg.data ] );
									break;
							}
						}
						break;
					default:
						// Relays the message to application
						if ( self.caller && self.messages )
							self.messages.apply( self.caller, [ msg ] );
						break;
				}
				break;
		}
	}
};
Friend.Network.Manager.connect = function ( name, mainClient, openHost )
{
	var self = this;
	FriendNetwork.connect( name, this.p2p, [ '<treeHost>', '<treeClient>' ], handleClients );

	function handleClients( msg )
	{
		if ( msg.command == 'friendnetwork' )
		{
			switch ( msg.subCommand )
			{
				case 'getCredentials':
					FriendNetwork.sendCredentials( msg.key, self.password );
					break;
				case 'connected':
					var client =
					{
						key: msg.key,
						hostName: msg.hostName,
						mainClient: mainClient,
						ready: false
					};
					self.clients[ msg.key ] = client;
					if ( mainClient )
						self.mainClient = client;
					if ( openHost )
					{
						// Open host
						self.hostName = self.appName + '<fgameclient>' + Math.random() * 1000000 + Math.random() * 1000000;
						self.host.apply( self, [ true ] );

						// Wait for host to be established
						var interval = setInterval( checkHostCreation, 200 );
						function checkHostCreation()
						{
							if ( self.hosting )
							{
								FriendNetwork.send( client.key,
								{
									command: 'multiplayer',
									subCommand: 'hereIsMyHost',
									hostName: self.hosting.hostName
								} );
								self.clients[ msg.key ].ready = true;
								clearInterval( interval );
							}
						}
					}
					else
					{
						self.clients[ msg.key ].ready = true;
					}
					// Relays to the application
					if ( self.caller && self.messages )
						self.messages.apply( self.caller, [ msg ] );
					break;
				case 'hostDisconnected':
					for ( var key in self.clients )
					{
						if ( key == msg.key )
						{
							var message =
							{
								command: 'multiplayer',
								subCommand: 'hostDisconnected',
								playerNumber: self.clients[ key ].playerNumber,
								key: key,
								hostName: self.clients[ key ].hostName
							};
							if ( self.caller && self.messages )
								self.messages.apply( self.caller, [ message ] );
							self.clients[ key ] = false;
						}
						this.clients = self.utilities.cleanArray( this.clients );
					}
					break;
				case 'messageFromHost':
					if ( msg.data.command == 'multiplayer' )
					{
						switch ( msg.data.subCommand )
						{
							case 'iamplayer':
								if ( self.clients[ msg.key ] )
									self.clients[ msg.key ].playerNumber = msg.data.playerNumber;
								break;
							case 'startgame':
								// Current player
								self.playerNumber = msg.data.playerNumber;
								self.numberOfPlayers = msg.data.numberOfPlayers;
								// Prepare the message for application
								var message =
								{
									command: 'multiplayer',
									subCommand: 'startgame',
									playerNumber: msg.data.playerNumber,
									numberOfPlayers: msg.data.numberOfPlayers,
									multiPlayer: self
								};
								// Relays to the application
								if ( self.caller && self.messages )
									self.messages.apply( self.caller, [ message ] );
								break;
							case 'hostsToConnect':
								var numberToConnect = msg.data.hostNames.length;
								for ( var i = 0; i < msg.data.hostNames.length; i++ )
									self.connect.apply( self, [ msg.data.hostNames[ i ], false, false ] );
								self.clients[ msg.key ].ready = false;
								var interval = setInterval( checkHostConnection, 200 );
								function checkHostConnection()
								{
									for ( var key in self.clients )
									{
										if ( ! self.clients[ key ].checked )
										{
											for ( var j = 0; j < msg.data.hostNames.length; j ++ )
											{
												if ( msg.data.hostNames[ j ] == self.clients[ key ].hostName )
												{
													self.clients[ key ].checked = true;
													numberToConnect --;
													if ( numberToConnect == 0 )
													{
														FriendNetwork.send( msg.key,
														{
															command: 'multiplayer',
															subCommand: 'ready'
														} );
														self.clients[ msg.key ].ready = true;
														clearInterval( interval );
													}
												}
											}
										}
									}
								}
								break;
							case 'create':
								self.itemCreate( msg.data );
								break;
							case 'update':
								self.doUpdate( msg.data );
								break;
							case 'destroy':
								self.itemDestroy( msg.data );
								break;
							default:
								// Private message : relays to the application
								if ( self.caller && self.messages )
									self.messages.apply( self.caller, [ msg.data ] );
								break;
						}
					}
					break;
				default:
					// Relays to the application
					if ( self.caller && self.messages )
						self.messages.apply( self.caller, [ msg ] );
					break;
			}
		}
	}
};
Friend.Network.Manager.multiPlayerSend = function ( subCommand, message )
{
	message.command = 'multiplayer';
	message.subCommand = subCommand;
	for ( var key in this.hostClients )
		FriendNetwork.send( key, message );
	for ( key in this.clients )
		FriendNetwork.send( key, message );
};
Friend.Network.Manager.registerItem = function ( item )
{
	this.objects[ item.identifier ] = item;
};
Friend.Network.Manager.itemCreate = function ( data )
{
	// Turns the names of objects into real objects
	data.creationFlags = this.utilities.replaceNamesByObjects( this.root, data.creationFlags, {} );
	data.creationFlags.fromNetwork = true;
	data.creationFlags.identifier = this.getLocalIdentifier( data.identifier );
	data.creationFlags.currentTree  = this.findItemFromName( data.creationFlags.root );
	var message =
	{
		command: 'multiplayer',
		subCommand: 'create',
		data: data
	};

	// Have the application create the object
	var item = this.messages.apply( this.caller, [ message ] );
};
Friend.Network.Manager.getLocalIdentifier = function ( identifier )
{
	var pos = identifier.indexOf( '<userseparator>' );
	if ( pos )
		return Application.username + identifier.substring( pos );
};
Friend.Network.Manager.doUpdate = function ( data )
{
	// Turns the names of objects into real objects
	var flags = this.utilities.replaceNamesByObjects( this.root, data.flags, {} );

	// Update: call the processes of the object with the flags
	flags.delay = 0;
	var identifier = this.getLocalIdentifier( data.identifier );
	if ( this.objects[ identifier ] )
	{
		flags.fromNetwork = true;
		flags.refresh = true;
		this.tree.processItem( this.objects[ identifier ], 0, flags );
	}
};
Friend.Network.Manager.itemDestroy = function ( data )
{
	var identifier = this.getLocalIdentifier( data.identifier );
	if ( this.objects[ identifier ] )
	{
		this.objects[ identifier ].fromNetwork = true;
		this.tree.addToDestroy( this.objects[ identifier ] );
		this.objects[ identifier ] = false;
		this.objects = this.utilities.cleanArray( this.objects );

		// Tell the application about it
		var message =
		{
			command: 'multiplayer',
			subCommand: 'destroy',
			data: data
		};
		var item = this.messages.apply( this.caller, [ message ] );
	}
};
Friend.Network.Manager.processUp = function ( flags )
{
	if ( flags.command == 'destroy' && flags.itemEvent == this )
	{
		this.close();
	}
	return this.startProcess( flags, [ ] );
};
Friend.Network.Manager.processDown = function ( flags )
{
	return this.endProcess( flags, [ ] );
};
Friend.Network.Manager.close = function ()
{
	if ( this.hosting )
		FriendNetwork.dispose( this.hosting.key );
	for ( var key in this.clients )
		FriendNetwork.disconnect( key );
	this.hosting = false;
	this.clients = [ ];
};
