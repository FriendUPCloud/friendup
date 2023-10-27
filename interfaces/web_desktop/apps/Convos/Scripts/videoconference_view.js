/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Just a global peer object
window.peer = false;
window.peerCall = false;
currentScreenShare = null;

Application.run = function()
{
	let self = this;
	
	peer = new Peer( {
        secure: true, 
        port: 443
    } );
	peer.on( 'open', ( peerId ) => {
		ge( 'currentPeerId' ).value = peerId;
	  
		const localVideo = ge( 'VideoStream' );
		navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
			.then( ( stream ) => {
				localVideo.srcObject = stream;
				
				currentVideoStream = stream;
				const remoteVideo = ge( 'RemoteVideoStream' );
				
				let doRetrying = true;
				let doRetryTimeo = false;
				
				// Set up call event so we can be called
				function executeCall2()
				{
					peer.on( 'call', ( c ) => {
						if( c && c.on )
						{
							// Answer the call and display remote stream
							callList = [];
							c.answer( stream );
							c.on( 'stream', ( remoteStream ) => {
								// Prevent readding the same
								if( !callList[ c.peer ] )
								{
									ge( 'VideoArea' ).classList.remove( 'Loading' );
									ge( 'VideoArea' ).classList.add( 'Connected' );
									remoteVideo.srcObject = remoteStream;
									initStreamEvents( remoteVideo );
									callList[ c.peer ] = c;
									currentRemoteStream = remoteStream; // For safe keeping
								}
								doRetrying = false;
							} );
							c.on( 'data', ( data ) => {
								console.log( 'We got data after call stream: ', data );
							} ),
							c.on( 'error', ( err ) => {
								console.log( 'Call error...', err );
							} );
						}
						clearTimeout( doRetryTimeo );
						doRetryTimeo = setTimeout( function()
						{
							if( doRetrying )
							{
								executeCall2();
							}
						}, 250 );
					} );
				}
				executeCall2();
			} )
			.catch( ( error ) => {
				console.error( 'Error accessing media devices:', error );
			} );
		// We are starting the stream, so broadcast call
		if( !ge( 'remotePeerId' ).value )
		{
			self.sendMessage( {
				command: 'broadcast-call',
				peerId: ge( 'currentPeerId' ).value
			} );
		}
		// We have a currentPeerId from remote, so tell we got it
		else
		{
			ge( 'VideoStream' ).parentNode.classList.add( 'Loading' );
			Application.sendMessage( {
				command: 'broadcast-received',
				peerId: ge( 'currentPeerId' ).value,
				remotePeerId: ge( 'remotePeerId' ).value
			} );
		}
	} );
}

//--- Notes --------------------------------------------------------------- 1. -

/*
	
*/

