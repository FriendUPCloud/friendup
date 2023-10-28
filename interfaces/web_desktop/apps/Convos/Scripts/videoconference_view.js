/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

window.peer = null;             // Just a global peer object
let currentScreenShare = null;      // Are we screen sharing?
let callList = [];              //
let currentVideoStream = null;  // Current local stream now
let retryTimeo = null;          //
let retrying = false;           //
let remotePeers = {};           // Remote peers
let remotePeerCount = 0;        // Count remote peers

// Window initializing
Application.run = function()
{
	let self = this;
	
	// Create a peer Id for others to reach
	peer = new Peer( {
        secure: true, 
        port: 443
    } );
	peer.on( 'open', ( peerId ) => {
		ge( 'currentPeerId' ).value = peerId;
	  	console.log( '@Application.run: Peer is \'open\'' );
	  	// Get camera audio and video
		const localVideo = ge( 'VideoStream' );
		navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
			.then( ( stream ) => {
				localVideo.srcObject = stream;
				
				currentVideoStream = stream;
				
				let doRetrying = true;
				let doRetryTimeo = false;
				
				// Set up call event so we can be called
				function executeCall2()
				{
					console.log( '@Application.run: Setting up listener on \'call\'' );
					peer.on( 'call', ( c ) => {
						if( c && c.on )
						{
							console.log( '@Something is happening \'call\'' );
							// Answer the call and display remote stream
							callList = [];
							c.answer( stream );
							c.on( 'stream', ( remoteStream ) => {
								// Prevent readding the same
								if( !callList[ c.peer ] )
								{
									callList[ c.peer ] = c;
									
									ge( 'VideoArea' ).classList.remove( 'Loading' );
									ge( 'VideoArea' ).classList.add( 'Connected' );
									
									// Set up in remote peers
									let rvd = document.createElement( 'video' );
									rvd.setAttribute( 'muted', '' );
									rvd.setAttribute( 'autoplay', 'autoplay' );
									rvd.srcObject = remoteStream;
									ge( 'RemoteStreams' ).appendChild( rvd );
									initStreamEvents( rvd );
									remotePeers[ c.peer ] = {
										peerId: c.peer,
										remoteStream: remoteStream,
										remoteVideo: rvd
									};
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
						else
						{
							console.log( '@Preparing to retry on \'call\'' );
							clearTimeout( doRetryTimeo );
							doRetryTimeo = setTimeout( function()
							{
								if( doRetrying )
								{
									console.log( 'Retrying..' );
									executeCall2();
								}
							}, 500 );
						}
					} );
				}
				executeCall2();
			} )
			.catch( ( error ) => {
				console.error( 'Error accessing media devices:', error );
			} );
		// We are starting the stream, so broadcast call
		if( ge( 'ishost' ).value == '1' )
		{
			self.sendMessage( {
				command: 'broadcast-call',
				conference: {
					id: ge( 'conferenceId' ).value,
					name: ge( 'conferenceName' ).value,
					peerId: ge( 'currentPeerId' ).value
				}
			} );
		}
		// We have a currentPeerId from remote, so tell we got it
		else
		{
			ge( 'VideoStream' ).parentNode.classList.add( 'Loading' );
			// Send back that we received call, with user info and peer id
			Application.sendMessage( {
				command: 'broadcast-received',
				conferenceId: ge( 'conferenceId' ).value, // host conference id
				ownerId: ge( 'ownerId' ).value,
				user: {
					id: Application.userId,
					name: Application.fullName,
					peerId: ge( 'currentPeerId' ).value // user's peer id
				}
			} );
		}
	} );
}

function muteAudioVideo( type = false )
{
	let astate = document.querySelector( '.Mute' );
	let vstate = document.querySelector( '.Vision' );

	navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
	.then( ( stream ) => {
		const localVideo = document.getElementById( 'VideoStream' );
		localVideo.srcObject = stream;
		currentVideoStream = stream;
		
		const audtrack = stream.getAudioTracks()[0];
		const vidtrack = stream.getVideoTracks()[0];
		
		if( currentScreenShare )
		{
			vidtrack = currentScreenShare.getVideoTracks()[0];
		}
		
		// Sync audio with button state
		if( type == 'audio' )
		{
			if( astate.classList.contains( 'Muted' ) )
			{
				ge( 'VideoArea' ).classList.remove( 'NoAudio' );
				astate.classList.remove( 'Muted' );
				audtrack.enabled = true;
			}
			else
			{
				ge( 'VideoArea' ).classList.add( 'NoAudio' );
				astate.classList.add( 'Muted' );
				audtrack.enabled = false;
				audtrack.stop();
			}
			// Continue audio (video disabled audio normally)
			if( vstate.classList.contains( 'Muted' ) )
			{
				const audioOnlyStream = new MediaStream([audtrack]);
			    localVideo.srcObject = audioOnlyStream;
		    }
		}
	  	// Sync video with button state
	  	if( type == 'video' )
	  	{
			if( vstate.classList.contains( 'Muted' ) )
			{
				ge( 'VideoArea' ).classList.remove( 'NoVideo' );
				vstate.classList.remove( 'Muted' );
				vidtrack.enabled = true;
			}
			else
			{
				ge( 'VideoArea' ).classList.add( 'NoVideo' );
				vstate.classList.add( 'Muted' );
				vidtrack.enabled = false;
				vidtrack.stop();
			}
			// Continue audio (video disabled audio normally)
			if( !astate.classList.contains( 'Muted' ) )
			{
				if( vstate.classList.contains( 'Muted' ) )
				{
					const audioOnlyStream = new MediaStream([audtrack]);
				    localVideo.srcObject = audioOnlyStream;
			    }
			}
		}
		videoPoll();
		setTimeout( function(){ videoPoll(); }, 100 );
	} )
	.catch( ( error ) => {
		console.error( 'Error accessing media devices:', error );
	} );
}

document.querySelector( '.HangUp' ).onclick = function()
{
	CloseView(); 
}

document.querySelector( '.Mute' ).onclick = function()
{
	muteAudioVideo( 'audio' );
};

document.querySelector( '.Vision' ).onclick = function()
{
	muteAudioVideo( 'video' );
};

document.querySelector( '.ScreenShare' ).onclick = function()
{
	if( this.classList.contains( 'On' ) )
	{
		stopScreenShare( this );	
	}
	else
	{
		startScreenShare( this );	
	}
};

// Get messages ----------------------------------------------------------------

Application.receiveMessage = function( msg )
{
	// We were told it is safe to start calling the remote peer
	if( msg.command == 'initcall' && msg.hostPeerId && ge( 'currentPeerId' ).value == msg.hostPeerId )
	{
		console.log( 'Got initcall: ' + msg.hostPeerId + ' :: ' + msg.userPeerId );
		
		remotePeerCount++;;
		
		const localVideoStream = ge( 'VideoStream' ).srcObject;
		
		retrying = true;
		
		let retryTimeo = null;
		let timeo = 750; // Initial timeout
		
		function executeCall()
		{
			console.log( '@Invitee: Calling host: ' + msg.userPeerId );
			const c = peer.call( msg.userPeerId, localVideoStream );
			if( c && c.on )
			{
				c.on( 'stream', ( remoteStream ) => {
					// Prevent readding the same
					if( !callList[ c.peer ] )
					{
						console.log( '@Invitee - We are initing stream!' );
						ge( 'VideoArea' ).classList.remove( 'Loading' );
						ge( 'VideoArea' ).classList.add( 'Connected' );
						
						// Set up in remote peers
						let rvd = document.createElement( 'video' );
						rvd.setAttribute( 'muted', '' );
						rvd.setAttribute( 'autoplay', 'autoplay' );
						rvd.srcObject = remoteStream;
						ge( 'RemoteStreams' ).appendChild( rvd );
						initStreamEvents( rvd );
						remotePeers[ c.peer ] = {
							peerId: c.peer,
							remoteStream: remoteStream,
							remoteVideo: rvd
						};
						
						// In case of reconnects (this happens when remote goes away)
						callList[ c.peer ] = c;
					}
					retrying = false;
				} );
				c.on( 'error', ( err ) => {
					console.log( 'Error with connecting to remote stream.', err );
				} );
			}
			clearTimeout( retryTimeo );
			retryTimeo = setTimeout( function()
			{
				if( retrying )
				{
					console.log( '@Retrying.' );
					executeCall();
				}
			}, timeo );
			
			timeo -= 250;
			if( timeo < 500 ) timeo = 500;
		}
		executeCall();
	}
	else if( msg.command == 'poll' )
	{
		console.log( 'Was polled', msg );
	}
}

// Helpers ---------------------------------------------------------------------

function handleRemoteStreamEnded( e )
{
	if( e.type == 'mute' )
	{
		//const remoteVideo = ge( 'RemoteVideoStream' );
		//console.log( 'mute: ', e );
	}
	else
	{
		//console.log( 'End: ', e );
	}
	
}
function handleRemoteStreamMuted( e )
{
	if( e.type == 'mute' )
	{
		//const remoteVideo = ge( 'RemoteVideoStream' );
		//console.log( 'mute 2: ', e );
	}
	else
	{
		//console.log( 'End: ', e );
	}
}
function initStreamEvents( obj )
{
	/*peer.on( 'mute', ( err ) => {
		console.log( 'Mute - event with remote stream.', err );
	} );
	peer.on( 'ended', ( err ) => {
		console.log( 'Ended - event with remote stream.', err );
	} );*/
	obj.onerror = function( e )
	{
		//console.log( 'Video Element Error: ', e );
	}
	obj.srcObject.getTracks().forEach( ( track ) => {
		track.onended = handleRemoteStreamEnded;
		track.onmute = handleRemoteStreamMuted;
		track.onerror = function( e )
		{
			//console.log( 'What is it?', e );
		}
	});
}

function videoPoll()
{
	// Call the other
	if( remotePeerCount > 0 )
	{
		//peer.call( ge( 'remotePeerId' ).value, ge( 'VideoStream' ).srcObject );
		
		/*// Just nudge our friend!
		Application.sendMessage( {
			command: 'broadcast-poll',
			peerId: ge( 'remotePeerId' ).value
		} );*/
	}
}

// Function to start screen sharing
function startScreenShare( el, retries = 5 ) 
{
	navigator.mediaDevices.getDisplayMedia( { video: true, auto: true } )
		.then( ( stream ) => {
			// Replace video track with screen sharing track
			const localVideoTrack = currentVideoStream.getVideoTracks()[0];
			localVideoTrack.stop();
			
			currentScreenShare = stream;
			
			currentVideoStream.removeTrack(localVideoTrack);
			currentVideoStream.addTrack( stream.getVideoTracks()[ 0 ] );
			
			// Access the audio track from the 'stream' variable
	      	stream.addTrack( currentVideoStream.getAudioTracks()[0] );

			const localVideo = document.getElementById('VideoStream');
			localVideo.srcObject = stream;
			
			currentVideoStream = stream;
			
			document.body.classList.add( 'ScreenShare' );
			
			el.classList.add( 'On' );
			
			videoPoll();
		} )
		.catch( ( error ) => {
			return;
			if( retries > 0 )
			{
				return setTimeout( function()
				{
					startScreenShare( el, retries - 1 );
				}, 100 );
			}
		});
}

// Function to stop screen sharing and return to video call
function stopScreenShare( el, retries = 5 ) 
{
	navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
		.then( ( stream ) => {
			
			currentScreenShare = null;
			
			// Replace screen sharing track with video track
			const screenShareTrack = currentVideoStream.getVideoTracks()[ 0 ];
			screenShareTrack.stop();
			currentVideoStream.removeTrack( screenShareTrack );
			currentVideoStream.addTrack( stream.getVideoTracks()[ 0 ] );

			const localVideo = document.getElementById('VideoStream');
			localVideo.srcObject = stream;
			
			currentVideoStream = stream;
			
			document.body.classList.remove( 'ScreenShare' );
			
			el.classList.remove( 'On' );
			
			videoPoll();
		} )
		.catch( ( error ) => {
			console.error( 'Error accessing user media:', error );
			if( retries > 0 )
			{
				return setTimeout( function()
				{
					stopScreenShare( el, retries - 1 );
				}, 100 );
			}
		});
}

//--- Notes --------------------------------------------------------------------

/*
	
*/

