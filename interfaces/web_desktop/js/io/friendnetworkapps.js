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
 * Friend Network Application API
 * 
 * Enables any application to connect in peer-to-peer to other applications.
 * 
 * Like a game, an application can establish in Friend a direct peer-to-peer
 * connection to any (large networks will need more work! see below!) number of users.
 * Linked to my recent work on the FriendNetworkShare API, any Friend application 
 * will in a near future, (if you let me work on it Hogne)...
 * - have a live and fast messaging system (ping time: 20/30ms on decent internet?)
 * - stream data to the network, but only to a few number of users at the same time
 *   (maybe not with the iterative servers seen below...)
 * - open live video and audio communication (with Espen's help!)
 * - Send text messages and files, those message appearing in the 
 *   Friend Network widget at the bottom of your screen
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 23/04/2018
 */
 
var Friend = window.Friend || {};
 
FriendNetworkApps =
{
    applications: {},

    // System level calls
    init: function()
    {
    },
    close: function()
    {

    },

    /**
     * Register application
     * 
     * Register to an application on the network.
     * 
     * appInformation
     * {
     *    name: 'ApplicationName',  The name of the application
     *    title: 'A cool game!,     A description string
     *    image: base64,            A base64 string containing an icon 
     *                              for the application. Can be undefined
     *    description: 'A game I made'  A descriptive text of the app. Can be simple HTML.
     *    version: 1.45,                 (number) The version of the app. 
     *    running: false,           A boolean indicating if the application is running.
     *    acceptRunning: false      A boolen indicating if the application 
     *                              accept addtional connections while it is already 
     *                              in 'running' mode. 
     * }
     * userInformation
     * {
     *    name: 'username',         The username of the current user
     *    fullName: 'Your Name',    The full name of the current user
     *    description: 'Play with me!'   A description string that will be visible 
     *                                   to the people who browse users when connecting.
     *                                   Can be simple HTML.
     * }
     * Any or all of these parameters can be left blank. This function will
     * put appropriate data in them.
     * This function may check the network for further checking on the application
     * in a future version.
     * 
     * @param appInformation (object) information about the application. Can be undefined.
     * @param userInformation (object) information about the user. Can be undefined.
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK,
     *     false: application not found
     * 
     * callback in case of error
     */
    registerApplication: function( appInformation, userInformation, password, callback, extra )
    {
        var identifier = this.getIdentifier( this.applications, appInformation.name );
        this.applications[ identifier ] = 
        {
            identifier: identifier,
            name: appInformation.name,
            appInformation: appInformation,
            userInformation: userInformation,
            password: password,
            isApplicationHost: false,
            onLine: false,
            running: false,
            users: {},
            connected: {},
            runningUsers: {},
            runningUsersArray: [],
            callback: callback,
            extra: extra
        };
        callback( 'registerApplicationResponse', identifier, extra );
    },

    /**
     * Close application
     * 
     * Closes a currently registered application
     * 
     * This function closes all live connections, and conceal the host.
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param userInformation (object) information about the user. Can be undefined.
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK,
     *     false: application not found
     * 
     * callback in case of error
     */
    closeApplication: function( appIdentifier, callback, extra )
    {
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
            return;
        }

        // Close running connections
        this.closeRunningConnections( appIdentifier, function( response, data, extra )
        {
            callback( response, data, extra );
        }, extra );

        // Close connections
        this.closeConnections( appIdentifier, function( response, data, extra )
        {
            callback( response, data, extra );
        }, extra );

        // Close registration to host updates
        if ( application.hostSubscriptionIdentifier )
        {
            FriendNetwork.unsubscribeFromHostListUpdates( { identifier: application.hostSubscriptionIdentifier } );
        }

        // Clean array
        this.applications = this.cleanArray( this.applications, application );
    },

    closeConnections: function( appIdentifier, callback, extra )
    {
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
            return;
        }

        // Close the connected users
        for ( var p in application.users )
            this.closeUser( appIdentifier, p );
        
        // Close the host
        this.closeHost( appIdentifier );
    },

    closeRunningConnections: function( appIdentifier, callback, extra )
    {
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
            return;
        }

        // Close the running users if open
        this.closeRunningUsers( application );

        // Close the running host if open
        this.closeRunningHost( application );
    },

    /**
     * Open a host for the application
     * 
     * Even if Friend network is a peer-to-peer network, it needs a user to 
     * 'host' the application. This user is the one who's name is exposed
     * on the network, and he will be visible for this application on the network.
     * The host is the 'conductor' of the show. He gathers the users who want
     * to connect, and organize the connections.
     * But unlike an orchestra conductor who stays in control while the orchestra 
     * is playing, the host of a Friend Network enabled application joins the 
     * orchestra when the music starts playing.
     * For a game for example, this means that once an application is launched,
     * even if the original host of the session disappears, the session will carry
     * on playing with one player left for a game for example, until everyone quits.
     * In future versions, Friend Network will 'adapt' as much as possible when
     * a user connects or disconnects in the middle of a session.
     * The Tree engine supports live update of connection or disconnection of new users.
     * 
     * Concern about the number of users in one session.
     * Due to the peer-to-peer nature of Friend Network, a direct connection must
     * be established between each user. Each user has a host, so that he can accept
     * new connection requests, and is a client of ALL the other users.
     * The system produces an exponantial (not sure of that) number of connection
     * on the network and a charge for the servers. We have to do some testing
     * once the system works. On both local network and internet, the goal being
     * to know how many simulatenous users the system can handle without too much
     * load. 
     * I think that when he has time, Espen and I should discuss about this. I should
     * explain to him what I have done with his work, and as a network expert he will
     * certainly have good advice.
     * A solution to this problem would be a 'iteration' of the servers: once the 
     * number reaches a critical level, a user is selected (from speed certainly)
     * to become a server: he will connect to the X most 'popular' users and relay 
     * their messages, acting as a local switch. Being 'grouped', several user streams
     * could be transmited all at once, thus reducing the number of connections.
     * But we would loose the notion of peer-to-peer... :( but who cares!
     * 
     * A concern:
     * Due to the peer-to-peer nature of the system, ANY LAUNCHED APPLICATION
     * THAT HAS AT LEAST ONE LIVE SESSION CAN STAY ALIVE FOREVER!
     * (This looks like sci-fi Hogne!)
     * For the moment, this is not a problem :) . But if the system works, and if Friend
     * and Friend Network become a success, this can be!
     * May be a safety mechanism in Friend Network and Friend? This could be a
     * source of danger for the network, with unremovable 'sticky apps', that could
     * eventually be nasty. Make the original host of the application stay in control?
     * But he would have to be _always_ connected, and this is not good! Friend user's
     * machines are much more often switched off than servers.
     * 
     * What is all this?
     * Hogne, this is your dream of Liquid Applications turning into reality!
     * Application that live on the network, like animals... Liquid Applications hosted
     * by Liquid Servers... You saw it all! But I the one who makes it! :P (well, this is
     * only the upper crust of the cake you have been baking since 4 years.. :)
     * 
     * We _really_ are writing the future of Internet! This is so fucking amazing!
     *
     * 
     * 
     * 
     * 
     * This function closes all live connections, and conceal the host.
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK
     *     false: application not found.
     * callback:
     *     command: 'networkCommand', 
     *     data: parameters, 
     *     extra: the extra parameter 
     * This function will trigger callback messages during the life of the 
     * application on the network.
     * 
     * List of commands and parameters:
     * 
     * 'openHost'
     * 
     * Always called once as first event.
     * 
     * parameters: (boolean) true when the host is online, false if an error
     *                       occured.
     * 
     * 'newUser'
     * 
     * Called when a new user connects to the host.
     * 
     * parameters: (object) An object containing information about the user.
     * {
     *     name: 'userName', the user name of the disconnected user
     *     identifier: (string) id, the identifier of the user
     *     userDescription: (object) information about the user
     *                               {
     *                                   name: 'userName', 
     *                                   fullName: 'The user's name',
     *                                   description: 'A string entered by the user just 
     *                                                 before connecting'
     *                               }
     * }
     * 
     * 'userDisconnected'
     * 
     * Called when a user has disconnected (in the middle of running or not)
     * 
     * parameters: (object) An object containing information about the user.
     * {
     *     name: 'userName', the user name of the disconnected user
     *     identifier: (string) id, the identifier of the user
     *     userDescription: (object) information abbout the user
     * }
     * 
     * IN CASE OF ERROR
     * 
     * Command is 'ERR_ERROR_MESSAGE'
     * Parameters null or eventual error message parameters
     */
    openHost: function( appIdentifier, callback, extra )
    {
        // Find the application
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
            return false;
        }
        // Host already open?
        if ( application.hostKey )
        {
            callback( 'ERR_ALREADY_OPEN', null, extra );
            return false;
        }

        // The host is connected to himself!
        application.connected = {};
        application.connectedNumber = 0;

        // Open the host
        FriendNetwork.startHosting
        (  
            {
                name: application.name,
                connectionType: 'jsx',
                description: application.appInformation.title,
                password: application.password,
                data: 
                { 
                    image: application.image ? application.image : false,
                    applicationHost: true
                },
                callback: handleHost
            }
        );

        // Host management
        function handleHost( msg )
        {
            var connected;
            var self = FriendNetworkApps;
            switch ( msg.command )
            {
                case 'friendnetwork':
                    switch ( msg.subCommand )
                    {
                        // Host properly created
                        case 'host':
                            application.hostKey = msg.hostKey; 
                            application.onLine = true;
                            application.isApplicationHost = true;
                            // Call above
                            application.callback( 'openHost', msg.hostKey, application.extra );
                            break;

                        // New client connected
                        case 'clientConnected':
                            application.connected[ msg.key ] = 
                            {
                                name: msg.name,
                                key: msg.key,
                                identifier: msg.key
                            };
                            application.connectedNumber++;
                            break;

                        // Client disconnected
                        case 'clientDisconnected':
                            connected = application.connected[ msg.key ];
                            if ( connected )
                            {
                                // Clean array
                                application.connected = self.cleanArray( application.connected, connected );
                                application.connectedNumber--;

                                // Send message to application
                                application.callback( 'userDisconnected', 
                                { 
                                    identifier: connected.identifier, 
                                    userInformation: connected.userInformation 
                                }, application.extra );
                            }
                            break;
                
                        // Error: removes host
                        case 'error':
                            application.onLine = false;
                            application.hostKey = false;
                        
                            // Send message to application
                            application.callback( 'ERR_NETWORK_ERROR', msg.error, application.extra );
                            break;

                        // Handle commands
                        case 'messageFromClient':
                            connected = application.connected[ msg.key ];
                            data = msg.data;
                            switch ( msg.data.command )
                            {
                                case 'information':
                                    connected.userInformation = data.data;

                                    // User is connected!
                                    application.callback( 'newUser', { name: connected.name, identifier: connected.identifier, userInformation: connected.userInformation }, application.extra );

                                    // Reply to message
                                    var response = 
                                    {
                                        command: 'informationResponse',
                                        isApplicationHost: application.isApplicationHost,
                                        appRunning: application.running,
                                        userInformation: application.userInformation,
                                        extra: data.extra
                                    };
                                    FriendNetwork.send( { key: msg.key, data: response } );
                                    break;

                                case 'hostCreated':
                                    connected.hostKey = data.hostKey;
                                    connected.hostName = data.hostName;
                                    
                                    // One host less to open!
                                    application.runningHostsCount--;
                                    break;

                                case 'connectedToHosts':
                                    application.connectToHostsCount--;
                                    break;

                                default:
                                    break;
                            }
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        }
    },

    /**
     * Remove an application from the network
     * 
     * Closes all connections and conceals the host if this session was a host.
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK
     *     false: application not found.
     * 
     * callback: only for error
     */
    closeHost: function( appIdentifier, callback, extra )
    {
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', extra );
            return;
        }

        // Close the main host
        if ( application.hostKey )
        {
            FriendNetwork.disposeHosting( { key: application.hostKey } );
            application.hostKey = false;
            application.onLine = false;
        }

        // Close the connections with clients
        for ( var c in application.connected )
        {
            var connected = application.connected[ c ];
            FriendNetwork.disconnectFromHost( { key: connected.key } );
        }

        // Close running hosts
        if ( application.runningHostKey )
        {
            FriendNetwork.disposeHosting( { key: application.runningHostKey } );
        }

        application.connected = {};
    },

    /**
     * Connects to host (called internally to connect to other users)
     * 
     * This function establishes the connection with a user hosting an application.
     * Once the connection is established, it remains inactive until the host of the 
     * application has started the session.
     * It then starts to transmit messages through the callback.
     * 
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK
     *     false: application not found.
     * 
     * callback:
     *     command: 'networkCommand', 
     *     data: parameters, 
     *     extra: the extra parameter 
     * 
     * List of commands and parameters:
     * 
     * 'disconnectedFromUser'
     * 
     * Called if the connection with a user has been lost.
     * parameters: (boolean) the 'user' structure of the user
     * 
     * 'newUser'
     * 
     * Called when a new user connects to the host.
     * 
     * parameters: (object) An object containing information about the user.
     * {
     *     name: 'userName', the user name of the disconnected user
     *     identifier: (string) id, the identifier of the user
     *     userDescription: (object) information about the user
     *                               {
     *                                   name: 'userName', 
     *                                   fullName: 'The user's name',
     *                                   description: 'A string entered by the user just 
     *                                                 before connecting'
     *                               }
     * }
     * 
     * 'connectToUser'
     * 
     * This is the first message, and it indicates if the connection was a success.
     * 
     * parameters: (object) Information about the user
     *                      {
     *                          identifier: the identifier of the user
     *                          name: the username of the user
     *                          userInformation: 
     *                          {
     *                              fullName: the full name of the user,
     *                              description: a description of the user
     *                              image: (can be null) an icon for the user
     *                          }
     *                      }
     * 
     * 'disconnectedFromUser'
     * 
     * Called when a user has disconnected (in the middle of running or not)
     * 
     * parameters: (object) An object containing information about the user.
     * {
     *     name: 'userName', the user name of the disconnected user
     *     identifier: (string) id, the identifier of the user
     *     userDescription: (object) information abbout the user
     * }
     * 
     * IN CASE OF ERROR
     * 
     * Command is 'ERR_ERROR_MESSAGE'
     * Parameters: (object)
     * {
     *     identifier: the identifier of the user
     *     error: eventual extra paramaters
     * }
     * 
     */
    connectToUser: function( appIdentifier, nameHost, callback, extra )
    {   
        var self = FriendNetworkApps;

        // Find the application
        var application = this.applications[ appIdentifier ];
        if ( !application )
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
        }
        FriendNetwork.connectToHost( { url: nameHost, hostType: 'application', p2p: true, encryptMessages: false, callback: handleMessages } );

        // Handle application user messages
        function handleMessages( msg )
        {
            var user;
            switch ( msg.subCommand )
            {
                case 'getCredentials':
                    FriendNetwork.sendCredentials( { key: msg.key, password: application.password, encrypted: true } );
                    break;

                case 'connected':
                    user =
                    {
                        identifier: msg.key,
                        key: msg.key,
                        hostName: nameHost,
                        connecting: true,
                        callback: callback,
                        callbackExtra: extra
                    };
                    application.users[ msg.key ] = user;

                    // Send information about himself
                    var information = 
                    {
                        command: 'information',
                        identifier: user.identifier,
                        data: application.userInformation,
                    };
                    FriendNetwork.send( { key: msg.key, data: information } );
                    break;

                case 'hostDisconnected':
                    // Remove from list
                    user = application.users[ msg.key ];
                    if ( user )
                    {
                        application.users = self.cleanArray( application.users, user );
                        application.callback( 'userDisconnected', { identifier: user.identifier, name: user.name, userInformation: user.userInformation }, application.extra );
                    }
                    break;

                case 'messageFromHost':
                    user = application.users[ msg.key ];
                    data = msg.data;
                    if ( user )
                    {
                        switch ( data.command )
                        {
                            // The host has answered, we are connected!
                            case 'informationResponse':
                                user.connecting = false;
                                user.connected = true;
                                user.userInformation = data.userInformation;
                                user.isApplicationHost = data.isApplicationHost;
                                user.name = data.userInformation.name;
                                user.callback = callback;
                                user.callbackExtra = extra;
                                application.callback( 'connectToUser', { identifier: user.identifier, name: user.name, userInformation: user.userInformation }, application.extra );
                                break;

                            case 'applicationLaunched':
                                application.userNumber = data.userNumber;
                                self.openRunningHost( application, user, callback, extra );
                                break;

                            case 'connectToHosts':
                                // A list to connect to? ( > 2 players )
                                application.connectToRunningHostCount = 0;
                                for ( var c = 0; c < data.connectTo.length; c++ )
                                {
                                    application.connectToRunningHostCount++;
                                    self.connectToRunningHost( application, user, data.connectTo[ c ] );
                                }

                                // Set an interval to check the connections
                                var handle = setInterval( function()
                                {
                                    if ( application.connectToRunningHostCount == 0 )
                                    {
                                        clearInterval( handle );

                                        // Indicates the host that we are ready for next step!
                                        var message = 
                                        {
                                            command: 'connectedToHosts',
                                            identifier: user.identifier
                                        };
                                        FriendNetwork.send( { key: msg.key, data: message } );
                                    }
                                }, 50 );
                                break;

                            default:
                                break;
                        }
                    }
                    break;

                case 'error':
                    user = application.users[ msg.key ];
                    if ( user )
                    {
                        application.users[ msg.key ] = false;
                        application.users = self.cleanArray( application.users );
                        application.callback( 'ERR_NETWORK_ERROR', { identifier: user.identifier, error: msg.error }, application.extra );
                    }
                    else
                    {
                        // No user, error before the user was created => connection has failed -> initial response
                        application.callback( 'connectToUser', { identifier: false }, application.extra );
                    }
                    break;

                default:
                    break;
            }
        }
        return false;
    },
    openRunningHost: function( application, connected, callback, callbackExtra )
    {
        // Host already created?
        if ( application.runningHostKey && !application.runningHostConnecting )
        {
            var message = 
            { 
                command: 'hostCreated', 
                identifier: application.runningHostIdentifier,
                hostKey: application.runningHostKey,
                hostName: application.runningHostName
            };
            FriendNetwork.send( { key: connected.key, data: message } );
            return;
        }

        // Open the host
        application.runningHostName = 'running-' + application.name;
        application.runningHostConnecting = true;
        application.runningHostOnLine = false;
        application.runningHostKey = 0;
        application.runningUsersNumber = 0;
        application.runningUsers = {};
        FriendNetwork.startHosting
        (  
            {
                name: application.runningHostName,
                connectionType: 'runningHost',
                description: application.name,
                password: application.password,
                callback: handleHost
            }
        );

        // Host management
        function handleHost( msg )
        {
            var self = FriendNetworkApps;
            switch ( msg.command )
            {
                case 'friendnetwork':
                    switch ( msg.subCommand )
                    {
                        // Host properly created
                        case 'host':
                            application.runningHostConnecting = false;
                            application.runningHostKey = msg.hostKey;
                            application.runningHostIdentifier = msg.hostKey;
                            application.runningHostOnLine = true;
                            application.runningHostName = msg.name;

                            // Indicates to the other side that the host has been created
                            if ( connected )
                            {
                                var message = 
                                { 
                                    command: 'hostCreated', 
                                    identifier: application.runningHostIdentifier,
                                    hostKey: application.runningHostKey,
                                    hostName: application.runningHostName,
                                    userInformation: application.userInformation,
                                };
                                FriendNetwork.send( { key: connected.key, data: message } );
                            }
                            else
                            {
                                // We were creating our own host
                                application.runningHostsCount--;
                            }
                            break;

                        // New client connected
                        case 'clientConnected':
                            application.runningUsers[ msg.key ] = 
                            {
                                name: msg.name,
                                key: msg.key,
                                identifier: msg.key
                            };
                            application.runningUsersNumber++;
                            break;

                        // Client disconnected
                        case 'clientDisconnected':
                            runningUser = application.runningUsers[ msg.key ];
                            if ( runningUser )
                            {
                                // Clean array
                                application.runningUsers = self.cleanArray( application.runningUsers, runningUser );
                                application.runningUsersNumber--;

                                // Send message to application
                                application.callback( 'runningUserDisconnected', 
                                { 
                                    userNumber: runningUser.userNumber,
                                    userInformation: runningUser.userInformation 
                                }, application.extra );
                            }
                            break;
                
                        // Error: removes host
                        case 'error':
                            runningUser = application.runningUsers[ msg.key ];
                            if ( runningUser )
                            {
                                application.callback( 'userDisconnected', 
                                { 
                                    name: runningUser.name,
                                    identifier: runningUser.identifier, 
                                    userInformation: runningUser.userInformation ? runningUser.userInformation : 'No information' 
                                }, application.extra );
                                application.runningUsers = self.cleanArray( connected.runningUsers, runningUser );
                                application.numberOfRunningUsers--;
                            }
                            else
                            {
                                application.runningHostKey = 0;
                                application.runningHostOnLine = false;
                            }
                        
                            // Send message to application
                            application.callback( 'ERR_NETWORK_ERROR', msg.error, application.extra );
                            break;

                        // Handle commands
                        case 'messageFromClient':
                            runningUser = application.runningUsers[ msg.key ];
                            data = msg.data;
                            switch ( data.command )
                            {
                                case 'information':
                                    runningUser.userNumber = data.userNumber;
                                    runningUser.userInformation = data.userInformation;

                                    // Reply to message
                                    var response = 
                                    {
                                        command: 'informationResponse',
                                        userInformation: application.userInformation,
                                        userNumber: application.userNumber 
                                    };
                                    FriendNetwork.send( { key: msg.key, data: response } );
                                    break;

                                case 'applicationStart':
                                    application.applicationStartCount--;
                                    break;

                                case 'message':
                                    application.callback( data.data.command, { userNumber: data.userNumber, data: data.data }, application.extra );
                                    break;

                                default:
                                    break;
                            }
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        }
    },
    closeRunningHost: function( application )
    {
        if ( application.runningHostKey )
        {
            FriendNetwork.disposeHosting( { key: application.runningHostKey } );
            application.runningHostKey = false;
            application.runningHostOnLine = false;
        }
    },
    connectToRunningHost: function( application, user, nameHost, callback, extra )
    {
        var self = FriendNetworkApps;

        FriendNetwork.connectToHost( { url: nameHost, hostType: 'runningHost', p2p: true, encryptMessages: false, callback: handleMessages } );

        // Handle application user messages
        var runningUser;
        function handleMessages( msg )
        {
            switch ( msg.subCommand )
            {
                case 'getCredentials':
                    FriendNetwork.sendCredentials( { key: msg.key, password: application.password, encrypted: true } );
                    break;

                case 'connected':
                    runningUser =
                    {
                        identifier: msg.key,
                        key: msg.key,
                        hostName: nameHost, 
                        connecting: true,
                        connected: false
                    };
                    application.runningUsers[ msg.key ] = runningUser;
                    application.runningUsersNumber++;

                    // Send information about himself
                    var information = 
                    {
                        command: 'information',
                        identifier: runningUser.identifier,
                        userInformation: application.userInformation,
                        userNumber: application.userNumber
                    };
                    FriendNetwork.send( { key: msg.key, data: information } );
                    break;

                case 'hostDisconnected':
                    // Remove from list
                    runningUser = application.runningUsers[ msg.key ];
                    if ( runningUser )
                    {
                        application.runningUsers = self.cleanArray( application.runningUsers, application.runningUsers[ msg.key ] );
                        application.callback( 'runningUserDisconnected', { userNumber: runningUser.userNumber, userInformation: runningUser.userInformation }, application.extra );
                    }
                    break;

                case 'messageFromHost':
                    runningUser = application.runningUsers[ msg.key ];
                    data = msg.data;
                    if ( runningUser )
                    {
                        switch ( data.command )
                        {
                            // The host has answered, we are connected!
                            case 'informationResponse':
                                runningUser.connecting = false;
                                runningUser.connected = true;
                                runningUser.userInformation = data.userInformation;
                                runningUser.userNumber = data.userNumber;
                                runningUser.name = data.userInformation.name;
                                runningUser.callback = user.callback;
                                runningUser.callbackExtra = user.extra;
                                application.connectToRunningHostCount--;
                                break;

                            case 'applicationReady':
                                // Create a sorted version of the users array
                                var userList = [];
                                for ( var p = 0; p < application.runningUsersNumber + 1; p++ )
                                {
                                    for ( var u in application.runningUsers )
                                    {
                                        if ( p == application.runningUsers[ u ].userNumber )
                                        {
                                            userList.push( application.runningUsers[ u ] );
                                            break;
                                        }
                                        else if ( p == application.userNumber )
                                        {
                                            // Create a fake user for the current player
                                            var newUser =
                                            {
                                                name: application.userInformation.name,
                                                identifier: '<---current user--->',
                                                key: false,
                                                userNumber: application.userNumber,
                                                userInformation: application.userInformation
                                            };
                                            userList.push( newUser );
                                        }
                                    }
                                }
                                application.runningUsersArray = userList;
                                application.callback( data.command, { userNumber: application.userNumber, usersNumber: application.runningUsersNumber + 1, users: userList }, application.extra );
                                break;

                            case 'applicationStart':
                                application.applicationStartCount--;
                                break;

                            // Message from other side!
                            case 'message':
                                application.callback( data.data.command, { userNumber: data.userNumber, data: data.data }, application.extra );
                                break;

                            default:
                                break;
                        }
                    }
                    break;

                case 'error':
                    runningUser = application.runningUsers[ msg.key ];
                    if ( runningUser )
                    {
                        application.runningUser = self.cleanArray( application.runningUsers, runningUser );
                        application.callback( 'ERR_NETWORK_ERROR', { identifier: runningUser.identifier, error: msg.error }, application.extra );
                    }
                    else
                    {
                        // No user, error before the user was created => connection has failed -> initial response
                        application.callback( 'connectToUser', { identifier: false }, application.extra );
                    }
                    break;

                default:
                    break;
            }
        }
        return false;
    },
    closeRunningUsers: function( application )
    {
        for ( var u in application.runningUsers )
        {
            FriendNetwork.disconnectFromHost( { key: application.runningUsers[ u ].key } );
        }
        application.runningUsers = {};
    },
    establishConnections: function( appIdentifier, callback, extra )
    {
        var self = FriendNetworkApps;
        var application = this.applications[ appIdentifier ];
        if ( !application )    
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', false, extra );
            return false;
        }
        if ( application.connectedNumber == 0 )
        {
            callback( 'ERR_NO_CONNECTED_USERS', false, extra );
            return false;
        }

        // Send a 'application launched' message to all connected users, affecting them with a userNumber
        var connectedNumber = 0;
        application.state = 'launched';
        for ( var u in application.connected )
        {
            var connected = application.connected[ u ];
            connected.userNumber = connectedNumber + 1;     // Application host is always #0
            var message = 
            {
                command: 'applicationLaunched',
                userNumber: connected.userNumber
            };
            FriendNetwork.send( { key: connected.key, data: message } );
            connectedNumber++;
        }

        // Create its own host
        connectedNumber++;
        application.userNumber = 0;
        application.runningHostsCount = connectedNumber;
        this.openRunningHost( application, false, callback, extra );
        
        // Set interval to check that all hosts have been created. 
        // Will stop when all hosts have been creates. May take seconds... 
        // TODO: Include timeout!
        var handle = setInterval( function()
        {
            if ( application.runningHostsCount == 0 )
            {
                clearInterval( handle );

                // Make an ordered list, without himself
                var connectedList = [];
                for ( var c in application.connected )
                {
                    connectedList.push( application.connected[ c ] );
                }
                if ( connectedNumber > 2 )
                {
                    application.connectToHostsCount = 0;
                    for ( c = 0; c < connectedList.length; c++  )
                    {
                        var connected = connectedList.connected[ c ];

                        // Build the list to connect to
                        var connectTo = [];
                        var connectToNumber = connectedList.length - 1 - c;   // Not to himself! One less at each step
                        
                        // Take the hosts above him
                        for ( var cc = 0; cc < connectToNumber; cc++ )
                            connectTo.push( connectedList[ c + cc ].name );

                        // Send the message
                        var message = 
                        {
                            command: 'connectToHosts',
                            connectTo: connectTo
                        };
                        FriendNetwork.send( { key: connected.key, data: message } );
                        application.connectToHostsCount++;
                    }
                }
                else
                {
                    // Should be only one!
                    for ( var c in application.connected )
                    {
                        application.connectToHostsCount = 1;
                        var message = 
                        {
                            command: 'connectToHosts',
                            connectTo: [ application.runningHostName ]
                        };
                        FriendNetwork.send( { key: application.connected[ c ].key, data: message } );
                    }
                }
                // Set an interval to check that everyone has connected (Timeout!)
                var handle2 = setInterval( function()
                {
                    if ( application.connectToHostsCount == 0 )
                    {
                        clearInterval( handle2 );

                        // Send 'applicationReady' to all connected users
                        for ( var u in application.runningUsers )
                        {
                            var message =
                            {
                                command: 'applicationReady'
                            };
                            FriendNetwork.send( { key: application.runningUsers[ u ].key, data: message } );
                        }

                        // Create a sorted version of the users array
                        var userList = [];
                        
                        // Create a fake user for the current player, host is always user #0
                        var newUser =
                        {
                            name: application.userInformation.name,
                            identifier: '<---current user--->',
                            key: false,
                            userInformation: application.userInformation,
                            userNumber: 0
                        };
                        userList.push( newUser );

                        // Add the other users
                        for ( var p = 0; p < application.runningUsersNumber; p++ )
                        {
                            for ( u in application.runningUsers )
                            {
                                var runningUser = application.runningUsers[ u ];
                                if ( p + 1 == runningUser.userNumber )
                                {
                                    userList.push( runningUser );
                                    break;
                                }
                            }
                        }
                        application.runningUsersArray = userList;

                        // Send 'applicationReady' above
                        application.callback( 'applicationReady', { users: userList, userNumber: application.userNumber, usersNumber: application.runningUsersNumber + 1 }, application.extra );
                    }
                }, 50 );
            }
        }, 50 );
    },
    sendMessageToAll: function( appIdentifier, message, callback, extra )
    {
        var self = FriendNetworkApps;
        var application = this.applications[ appIdentifier ];
        if ( application )            
        {
            var data =
            {
                command: 'message', 
                userNumber: application.userNumber,
                data: message
            };
            for ( var r in application.runningUsers )
            {
                var runningUser = application.runningUsers[ r ];
                if ( runningUser.key )
                    FriendNetwork.send( { key: runningUser.key, data: data } );
            }
        }
    },
    startApplication: function( appIdentifier, callback, extra )
    {
        var self = FriendNetworkApps;
        var application = this.applications[ appIdentifier ];
        if ( application )            
        {
            var data =
            {
                command: 'applicationStart', 
                userNumber: application.userNumber
            };
            application.applicationStartCount = 0;
            for ( var r in application.runningUsers )
            {
                application.applicationStartCount++;
                var runningUser = application.runningUsers[ r ];
                if ( runningUser.key )
                    FriendNetwork.send( { key: runningUser.key, data: data } );
            }

            // Wait for all the others to have started
            var handle = setInterval( function()
            {
                if ( application.applicationStartCount == 0 )
                {
                    clearInterval( handle );
                    application.callback( 'applicationStart', {}, application.extra );
                }
            }, 50 );
        }
    },

    /**
     * Close the connection with a user
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param userIdentifier (string) The identifier of the user
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK
     *     false: application not found or error.
     * 
     * callback: only for error
     */
    closeUser: function( appIdentifier, userIdentifier, callback, extra )
    {
        var application = this.applications[ appIdentifier ];
        if ( !application )    
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', null, extra );
            return;
        }
        
        var user = application.users[ user ];
        if ( !user )
        {
            if ( callback )
                callback( 'ERR_PLAYER_NOT_FOUND', null, extra );
            return;
        }
        
        // Disconnects
        FriendNetwork.disconnectFromHost( { key: user.key } );
        application.users = self.cleanArray( self.users, user.identifier );
        return false;
    },

    /**
     * Get a list of hosts for this application
     * 
     * @param appIdentifier (string) The identifier of the application
     * @param filters (object) can be undefined. Filters to apply on the search:
     *                         {
     *                             find: 'name',     if defined, the name of the host
     *                                               will have to contain this text
     *                             versionBelow: 1.5 if defined, versions of the 
     *                                               application over this value 
     *                                               will be rejected.
     *                             versionAbove: 1.5 if defined, versions of the 
     *                                               application under this value 
     *                                               will be rejected.
     *                         } 
     * @param callback (function) function to call 
     * @param extra (any) An extra parameter that is returned in the callback message
     * @return 
     * immediate:
     *     true: OK
     *     false: application not found.
     * 
     * callback: 
     * 
     * The list of hosts found or error.
     * 
     * parameters: (array)
     * [
     *     {
     *         name: (string) the username of the host
     *         nameHost: (string) the Friend Network host name
     *         title: (string) the description title of the application
     *         appInformation: (object) information about the application
     *         userInformation: (object) information about the user
     *     }
     * ]
     */
    getHosts: function( appIdentifier, filters, registerToUpdates, callback, extra )
    {
        var self = FriendNetworkApps;
        var application = this.applications[ appIdentifier ];
        if ( !application )    
        {
            callback( 'ERR_APPLICATION_NOT_FOUND', extra );
            return false;
        }

        // Subscribes to host list change
        if ( false && !application.subscribedToHostChanges )
        {
            application.previousHostList = false;
		    //FriendNetwork.subscribeToHostListUpdates( { callback: updateHosts } );        // TODO: debug later! See with Espen...
        }
        self.previousHostList = false;
        FriendNetwork.listHosts( { callback: function( msg ){ doListHosts( msg.hosts ); } } );
        function updateHosts( msg ) 
        {
            if ( msg.subCommand == 'subscribeToHostListUpdatesResponse' )
            {
                self.hostSubscriptionIdentifier = msg.identifier;
            }
            else if ( msg.subCommand == 'hostsUpdate' )
            {
                doListHosts( [ msg.host ] );
            }
        }
        function doListHosts( hosts )
        {
            var list = [];

            // Computes the response of Friend Network, filtering with the name of the application
            for ( var a = 0; a < hosts.length; a++ )
            {
                var host = hosts[ a ];
                if ( host.apps )
                {
                    var apps = host.apps;
                    for ( var b = 0; b < apps.length; b ++ )
                    {
                        if ( apps[ b ].type == 'jsx' )
                        {
                            var descApp = apps[ b ];

                            if ( descApp.name == application.name && descApp.info.applicationHost )
                            {
                                // Filter from name                          
                                if ( filters && filters[ 'find' ] )
                                {
                                    if ( descApp.name.indexOf( filters[ 'find' ] ) < 0 )
                                    {
                                        continue;
                                    }
                                }
                                // Running indicated?
                                if ( filters && filters[ 'running' ] )
                                {
                                    if ( filters[ 'running' ] == 'yes' && !descApp.info.running )
                                        continue;
                                    else if ( !filters[ 'running' ] == 'yes' && descApp.info.running )
                                        continue;
                                }
                                // Version number
                                if ( typeof filters[ 'versionAbove' ] != 'undefined' )
                                {
                                    if ( descApp.info.version < typeof filters[ 'versionAbove' ] )
                                        continue;
                                }
                                if ( typeof filters[ 'versionBelow' ] != 'undefined' )
                                {
                                    if ( descApp.info.version >= filters[ 'versionBelow' ] )
                                        continue;
                                }
                                list.push
                                (
                                    {
                                        name: host.name,
                                        nameHost: application.name + '@' + host.name,
                                        title: descApp.description,
                                        appInformation: descApp.info,
                                        userInformation: host.info
                                    }
                                );
                            }
                        }
                    }
                }
            } 

            // Is there some differences with the previous list?
            var changed = false;
            if ( !self.previousHostList )
            {
                //if ( self.hostSubscriptionIdentifier )
                self.previousHostList = list;
                callback( 'getHostsResponse', list, extra );
            }
            else
            {
                if ( list.length != self.previousHostList.length )
                    changed = true;
                else
                {
                    // All of new list in all list?
                    var found, l1, l2;
                    for ( l1 = 0; l1 < list.length; l1++ )
                    {
                        found = false;
                        for ( l2 = 0; l2 < self.previousHostList.length; l2++ )
                        {
                            if ( list[ l1 ].nameHost == self.previousHostList[ l2 ].nameHost )
                            {
                                found = true;
                                break;
                            }
                        }
                        if ( !found )
                        {
                            changed = true;
                            break;
                        }
                    }
                    // All of previous list in new list?
                    if ( !changed )
                    {
                        for ( l1 = 0; l1 < self.previousHostList.length; l1++ )
                        {
                            found = false;
                            for ( l2 = 0; l2 < list.length; l2++ )
                            {
                                if ( self.previousHostList[ l1 ].nameHost == list[ l2 ].nameHost )
                                {
                                    found = true;
                                    break;
                                }
                            }
                            if ( !found )
                            {
                                changed = true;
                                break;
                            }
                        }
                    }
                }
                if ( changed )
                {
                    callback( 'getHostsResponse', list, extra );
                }
                self.previousHostList = list;
            }
        }
    },

    // Returns a unique key
	getIdentifier: function( keys, id )
	{
		var key = id + '-' + Math.random() * 999999;
		while( typeof( keys[ key ] ) != 'undefined' )
			key = id + '-' + Math.random() * 999999;
		keys[ key ] = true;
		return key;
	},

	// Cleans a key array
	cleanArray: function( keys, exclude )
	{
		var out = [ ];
		for ( var key in keys )
		{
			if ( keys[ key ] && keys[ key ] != exclude )
				out[ key ] = keys[ key ];
		}
		return out;
    }
};
