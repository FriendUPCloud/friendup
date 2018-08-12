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

chrome.runtime.onConnect.addListener( connection );
function connection( port ) 
{
	console.log( 'background.connection' );
	port.onMessage.addListener( onMessage );
	
	function onMessage( e ) 
	{
		console.log( 'FriendNetworkExtension - onMessage', e );
	}	
}

chrome.runtime.onInstalled.addListener( installed );
function installed( e ) 
{
	console.log( 'FriendNetworkExtension - onInstalled', e );

	chrome.runtime.onMessageExternal.addListener
	(
		function( request, sender, sendResponse ) 
		{
			var message;
			try
			{
				message = JSON.parse( request );
			}
			catch( e )
			{
				console.log( 'Error in JSON.', request );
			};
			if ( message )
			{
				console.log( 'Message from Friend (' + message.command + '):', message );
				FriendNetworkExtension.handleMessagesFromFriend( message, function( response )
				{
					console.log( 'Message to Friend (' + response.command + '):', response );
					sendResponse( JSON.stringify( response ) ) ;
				} );
			}
			return true;
		}
	);
	
	// Connects to the native application	
	FriendNetworkExtension.init();	
}
FriendNetworkExtension = 
{
	init: function()
	{
		var self = this;
		self.ready = false;

		self.hostName = "cloud.friendup.friendnativeapplication";
		self.portNative = chrome.runtime.connectNative( self.hostName );
		self.portNative.onMessage.addListener( self.onNativeMessage );
		self.portNative.onDisconnect.addListener( self.onNativeDisconnected );  
	},
	onNativeMessage: function( message )
	{
		var self = FriendNetworkExtension;

		console.log( 'Message from native application (' + message.command + '):', message );
		switch ( message.command )
		{
			case 'ready':
				self.ready = true;
				break;
			default:
				self.callback( message );
				break;
		}
	},
	onNativeDisconnected: function( message )
	{
		var self = FriendNetworkExtension;

		console.log( 'FriendNetworkExtension - disconnected.' );
		self.ready = false;
	},
	handleMessagesFromFriend: function( message, callback )
	{
		var self = FriendNetworkExtension;

		// Intercept messages for the extension itself...
		// ...
		self.callback = callback;
		self.sendMessageToNativeApplication( message );
	},
	sendMessageToNativeApplication: function( message ) 
	{
		var self = FriendNetworkExtension;
		console.log( 'Message to native application: (' + message.command + '):', message );
		self.portNative.postMessage( JSON.stringify( message ) );
	}
};