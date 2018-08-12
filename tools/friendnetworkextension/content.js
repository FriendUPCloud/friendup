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

console.log( 'content.js loaded' );

FriendNetworkExtension = function() 
{
	const self = this;
	self.init();
}

FriendNetworkExtension.prototype.init = function() 
{
	const self = this;
	console.log( 'FriendNetworkExtension.init' );

	self.messageMap = 
	{
		init      : init,
		ready     : isReady,
		getDrives : getDrives
	};
	function isReady( e, r ) { self.handleIsReady( e, r ); }	
	function getDrives( e, r ) { self.getDrives( e, r ); }	
	function init( retData, reqId ) 
	{
		console.log( 'FriendNetworkExtension - init msg', 
		{
			retData : retData,
			reqId   : reqId 
		} );
		
		self.webReturn = retData;
		const init = 
		{
			type : reqId,
			data : true,
		};
		self.sendToFriend( init );
	}

	window.addEventListener( 'message', onMessage );
	function onMessage( e ) 
	{
		const msg = e.data;
		if ( !msg )
			return;

		console.log( 'FriendNetworkExtension - Message', msg );
		if ( msg.type == 'friendnetwork')
		{			
			let reqId = msg.type;
			let event = msg.data;
			const handler = self.messageMap[ event.type ];
			if ( !handler ) 
			{
				console.log( 'handleWebMsg - no handler for event', event );
				return;
			}			
			handler( event.data, reqId );
		}		
	}
	self.port = chrome.runtime.connect();
	self.backgroundMessageMap = 
	{

	};
	self.port.onMessage.addListener( function( event )
	{
		debugger;
		console.log( 'FriendNetworkExtension - handleBackgroundMsg', event );
		const handler = self.backgroundMessageMap[ event.type ];
		if ( !handler ) 
		{
			console.log( 'FriendNetworkExtension - backgroundMessage - no handler for', event );
			return;
		}		
		handler( event.data );
	} );

	// Connects to the native application	
	/*var hostName = "cloud.friendup.friend";
	self.portNative = chrome.runtime.connectNative( hostName );
	self.portNative.onMessage.addListener( onNativeMessage );
	self.portNative.onDisconnect.addListener( onNativeDisconnected );  
	function onNativeMessage( e ) { self.handleNativeMessage( e ); }
	function onNativeDisconnected( e ) { self.handleNativeDisconnected( e ); }
	*/
}
FriendNetworkExtension.prototype.handleNativeMessage = function( msg ) 
{
	console.log( 'FriendNetworkExtension - Received native message: ' + msg );
	//this.sendToWeb( msg );
}

FriendNetworkExtension.prototype.handleNativeDisconnected = function( msg ) 
{
	console.log( 'FriendNetworkExtension - Native application disconnected!' );
	this.portNative = null;
}

FriendNetworkExtension.prototype.handleIsReady = function( e, reqId ) 
{
	const self = this;
	console.log( 'FriendNetworkExtension - handleIsReady', reqId );
	const isReady = 
	{
		type : reqId,
		data : true,
	};
	self.sendToFriend( isReady );
}

FriendNetworkExtension.prototype.sendToFriend = function( event ) 
{
	const self = this;
	console.log( 'FriendNetworkExtension - sendToFriend', event );
	if ( !event )
		return;
	
	self.webReturn.data.data = event;
	const str = JSON.stringify( self.webReturn );
	window.parent.postMessage( str, self.webReturn.origin );
	delete self.webReturn.data.data;
}

FriendNetworkExtension.prototype.sendToBackground = function( event ) 
{
	const self = this;
	console.log( 'FriendNetworkExtension - sendToBackground', event );
	if ( !event )
		return;
	
	self.port.postMessage( event );
}
window.FriendNetworkExtension = new FriendNetworkExtension();
