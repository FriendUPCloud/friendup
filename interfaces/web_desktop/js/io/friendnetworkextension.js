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
 * Interface with the Chrome FriendNetwork extension
 *
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 10/07/2018
 */
var Friend = window.Friend || {};

FriendNetworkExtension =
{	
	mobile: false,
	connected: false,
	extensionId: "okahidaepcpocpncmkmdeophajjjckco", // chrome app id

	init: function( callback )
	{
		var self = FriendNetworkExtension;
		if ( !self.connected )
		{			
			self.messageCallbacks = {};
			var message =
			{
				type: 'friendnetwork',
				command: 'init'
			};
			if ( typeof chrome != 'undefined' && chrome.runtime )
			{
				//chrome.runtime.connect( self.extensionId );
				self.sendMessage( message, function( response ) 
				{
					if ( response.command == 'initResponse' && response.status == 'ready' )
					{
						self.connected = true;
						if ( callback )
							callback( true );
					}
					else
					{
						if ( callback )
							callback( false );
					} 
				}, { force: true } );
			}
			else if ( window.isMobile )
			{
				self.mobile = false;
				callback( false );
				/*
				self.sendMessage( message, function( response ) 
				{
					if ( response )
					{
						//clearInterval( handle );
						if ( response.command == 'initResponse' && response.status == 'ready' )
						{
							self.connected = true;
							if ( callback )
								callback( true );
						}
						else
						{
							if ( callback )
								callback( false );
						} 
					}
				}, { force: true } );
				*/
			}
			else
			{
				callback( false );
			}
		}
		else
		{
			if ( callback )
				callback( true );
		}
	},
	close: function()
	{
	},
	sendMessage: function( message, callback, flags )
	{
		var self = FriendNetworkExtension;
		if ( self.connected || ( flags && flags.force ) )
		{
			message.identifier = Math.random() * 1000000 + '|' + Math.random() * 1000000;
			if ( typeof flags != 'undefined' && flags.keepCallback )
				message.identifier += '<keepCb>';
			self.messageCallbacks[ message.identifier ] = callback;			
			if ( self.mobile )
			{
				/*
				var json = CallFriendApp( 'onFriendNetworkMessage', JSON.stringify( message ) );
				var response;
				try
				{
					response = JSON.parse( json );
				}
				catch( e ){};
				console.log( 'Received response from Friend Android App (' + message.command + ') ' + json );
				if ( response )
				{
					var cb = self.messageCallbacks[ response.identifier ];
					if ( response.identifier.indexOf( '<keepCb>' ) < 0 )
						self.messageCallbacks = self.cleanArray( self.messageCallbacks, cb );
					cb( response );
				}
				else
				{
					console.log( 'JSON error in response from Friend Android App:' + json );
				}
				*/
			}
			else
			{
				chrome.runtime.sendMessage( self.extensionId, JSON.stringify( message ), function( json ) 
				{
					var response;
					try
					{
						response = JSON.parse( json );
					}
					catch( e ){};
					if ( response )
					{
						console.log( 'Received response from Friend Network extension (' + response.command + ')', response );
						var cb = self.messageCallbacks[ response.identifier ];
						if ( response.identifier.indexOf( '<keepCb>' ) < 0 )
							self.messageCallbacks = self.cleanArray( self.messageCallbacks, cb );
						cb( response );
					}
					else
					{
						console.log( 'JSON error in response from Friend Network extension.', json );
					}
				} );
			}
			return;
		}
		callback( { command: 'error', error: 'ERROR - Extension not connected.' } );
	},
	cleanCallback: function( identifier )
	{
		var self = FriendNetworkExtension;
		var callback = self.messageCallbacks[ identifier ];
		if ( callback )
		{
			self.messageCallbacks = self.cleanArray( self.messageCallbacks, callback );
		}
	},
	cleanArray: function( keys, exclude )
	{
		var out = [ ];
		for ( var key in keys )
		{
			if ( keys[ key ] && keys[ key ] != exclude )
				out[ key ] = keys[ key ];
		}
		return out;
	},

}
