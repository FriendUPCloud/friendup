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

// Network class that handles Friend Core to Friend Core connections as well as
// our encrypted WebRTC based peer-to-peer network

var thisIsSelf;
FriendNetwork = {
	// Vars
	onlineStatus: false,
	sessions: [], // List of applications and processes that use the friend network
	conn : null, // network connection
	// Methods
	init: function( host, sessionId )
	{
		console.log( 'FriendNetwork.init' );
		/*
		hostMeta is optinal, and is used to make your host human readable on the network
		hostMeta can contain:
			name, <string>
			description, <string>
			apps, [ <string>, .. ]
			imagePath, <string>
			
		hostMeta can also be updated later with .updateMeta
		*/
		var hostMeta = hostMeta || {
			name        : 'yeppers',
			description : 'fastly done in a port',
			apps        : [{
				id          : 'asds34fsdsdfa4wfwdsf',
				name        : 'hepp',
				description : 'The super hepp app'
			}, ],
			imagePath   : 'friend://path.to/image?', // ( not what a real path
			                                         // looks like, probably? )
		};
		
		this.conn = new NetworkConn(
			host,
			sessionId,
			eventSink, // events that do not have a registered listener get sent here
			onOpen,
			onEnd,
			hostMeta
		);
		
		thisIsSelf = this;
		
		this.conn.on( 'connect', connectRequest );
		this.conn.on( 'disconnect', remoteDisconnected );
		
		function connectRequest( data, hostId )
		{
			console.log( 'handleConnectionRequest', {
				data   : data,
				hostId : hostId,
			});
		}
		
		function remoteDisconnected( data, hostId )
		{
			console.log( 'handleRemoteDisconnected', {
				data   : data,
				hostId : hostId,
			});
		}
		
		function eventSink( type, data, source )
		{
			console.log( 'FriendNetwork - unhandled network event', {
				type       : type,
				data       : data,
				sourceHost : source,
			});
		}
		
		function onOpen( networkId ) // self hostId
		{
			// this clients networkId, might want to save it :?
			console.log( 'FriendNetwork - connection is open', networkId );
		}
		
		function onEnd( e )
		{
			// network connection has given up trying to reconnect
			// .reconnect() not yet implemented
			console.log( 'FriendNetwork conn onEnd', e );
		}
		
	},
	// Lists the available hosts
	listHosts: function( msg )
	{
		if ( !this.conn )
			return;
		
		// a list of hosts
		/*
		hostId,
		isPublic,
			+ meta data
		*/
		this.conn.getHosts( hostsBack );
		function hostsBack( err, res )
		{
			console.log( 'hostsBack', err, res );
			var response = {
				command : 'listhosts',
				response : !!err ? 'error' : 'ok',
				hosts    : res,
			};
			if ( err )
				response.error = err;
			
			msg.callback( response );
		}
		
		/*
		var hosts = [ 'Hogne', 'Thomas', 'Espen' ];
		if ( msg.callback )
		{
			msg.callback({ command: 'listhosts', response: 'ok', hosts: hosts });
		}
		*/
	},
	// Starts hosting session
	startHosting: function( msg )
	{
		// No permanent callback
		if( !msg.listener )
		{
			console.log( 'Won\'t host without a server listener..' );
			return false;
		}
		
		console.log( 'startHosting', msg );
		
		// add session for app
		var key = this.addSession( msg.applicationId, msg.name, msg.description, 'client' );
		
		// broadcast on network
		var app = {
			id          : key,
			name        : msg.name,
			description : msg.description,
		};
		console.log( 'expose', app );
		thisIsSelf.conn.expose( [ app ] );
		
		// Find application and where to send message
		var app = findApplication( msg.applicationId );
		var cw = GetContentWindowByAppMessage( app, msg );
		// listen for network events for this app
		thisIsSelf.conn.on( app.key, function( data, hostId )
		{
			console.log( 'startHosting listener', {
				data : data,
				hostId : hostId,
				key : key,
			});
			var nmsg = {
				applicationId: msg.applicationId,
				applicationName: msg.applicationName,
				type: 'callback',
				callback: msg.listener,
				data: { command: 'friendnetwork', data: data, hostId: hostId }
			};
			cw.postMessage( JSON.stringify( nmsg ), '*' );
		} );
		
		// Send to the callback confirmation that the connexion is established or not
		if( msg.callback )
		{
			msg.callback( { command: 'starthosting', response: 'ok', name: msg.name, key: key } );
		}
	},
	// Dispose hosting session (from its name)
	disposeHosting: function( msg )
	{
		var key = this.getSessionFromName( msg.name );
		if ( key && this.sessions[ key ].type == 'host' )
		{
			var name = this.sessions[ key ].name;
			this.removeSession( key );
			if ( msg.callback )
			{
				msg.callback( {command: 'disposehosting', response: 'ok', name: name } );
			}
		}
		else
		{
			if ( msg.callback )
			{
				msg.callback( {command: 'disposehosting', response: 'fail'} );
			}
		}
	},
	// Connect to distant host
	connectToHost: function( msg )
	{
		var key = this.addSession( msg.applicationId, msg.name, '', 'client' );
		
		// All your good stuff goes here
		// Send to the callback confirmation that the connexion is established or not, with the key and the name
		if ( msg.callback )
		{
			msg.callback( { command: 'connecttohost', response: 'ok', name: msg.name, key: key } );
		}
	},
	// Send data to distant host (from the key)
	send: function( msg )
	{
		console.log( 'fnet.send', msg );
		if( this.sessions[ msg.key ] && this.sessions[ msg.key ].type == 'client' )
		{
			this.conn.send( msg.host, msg.event, function()
			{
				if( msg.callback )
					msg.callback( { command: 'send', response: 'ok', key: msg.key, data: msg.data } );
			});
			if ( this.callback )
			{
				msg.callback();
			}
		}
		else
		{
			if( this.callback )
			{
				msg.callback( { command: 'send', response: 'fail' } );
			}
		}
	},
	// Return a session key from its name
	getSessionFromName: function( name )
	{
		for ( var key in this.sessions )
		{
			if ( this.sessions[ key ].name == name )
			{
				return key;
			}
		}
		return false;
	},
	// Add a new session by applicationid and name
	addSession: function( applicationId, name, description, type )
	{
		if( !applicationId ) return false;
		if( !name ) return false;
		if( !type ) return false;
		console.log( 'Got through.' );
		if( !description ) description = '';
		var key = applicationId + Math.random( 0, 999 );
		while( typeof( this.sessions[ key ] ) != 'undefined' )
			key = Sha256.hash( ( applicationId + Math.random( 0, 999 ) + Math.random( 0, 999 ) ) + "" );
		this.sessions[ key ] = {
			applicationId: applicationId,
			// "domain name"
			name: name,
			// Literal description
			description: description,
			// Client or host
			type: type
		};
		return key;
	},
	// Remove a session by key
	removeSession: function( key )
	{
		var out = [];
		for( var a in this.sessions )
		{
			if( a != key ) out[ a ] = this.sessions[ a ];
		}
		this.sessions = out;
	},
	// Get online status of a session / the network
	getStatus: function()
	{
		return this.onlineStatus;
	}
};

