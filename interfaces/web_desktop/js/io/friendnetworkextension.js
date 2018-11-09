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
