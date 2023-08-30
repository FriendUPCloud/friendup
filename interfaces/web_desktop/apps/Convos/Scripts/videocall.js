// Just a global peer object
window.peer = false;
window.peerCall = false;

document.querySelector( '.HangUp' ).onclick = function(){ CloseView(); }
document.querySelector( '.Mute' ).onclick = function()
{
	let s = this;
	navigator.mediaDevices.getUserMedia( { audio: true } )
	.then( ( stream ) => {
		const localVideo = document.getElementById( 'VideoStream' );
		localVideo.srcObject = stream;
		stream.getAudioTracks().forEach( ( track ) => {
		  	if( s.classList.contains( 'Muted' ) )
			{
				s.classList.remove( 'Muted' );
				track.enabled = true;
			}
			else
			{
				s.classList.add( 'Muted' );
				track.enabled = false;
			}
		} );
	} )
	.catch( ( error ) => {
		console.error( 'Error accessing media devices:', error );
	} );
};
document.querySelector( '.Vision' ).onclick = function()
{
	let s = this;
	navigator.mediaDevices.getUserMedia( { video: true } )
	.then( ( stream ) => {
		const localVideo = document.getElementById( 'VideoStream' );
		localVideo.srcObject = stream;
		stream.getVideoTracks().forEach( ( track ) => {
		  	if( s.classList.contains( 'Muted' ) )
			{
				s.classList.remove( 'Muted' );
				track.enabled = true;
			}
			else
			{
				s.classList.add( 'Muted' );
				track.enabled = false;
			}
		} );
	} )
	.catch( ( error ) => {
		console.error( 'Error accessing media devices:', error );
	} );
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



let callList = [];
let currentVideoStream = null; // Current local stream now
let currentRemoteStream = null; // Current remote stream now
let retryTimeo = null;
let retrying = false;
let remotePeerId = false;

Application.receiveMessage = function( msg )
{
	// We were told it is safe to start calling the remote peer
	if( msg.command == 'initcall' && msg.remotePeerId && ge( 'currentPeerId' ).value == msg.peerId )
	{
		ge( 'remotePeerId' ).value = msg.remotePeerId;
		remotePeerId = msg.remotePeerId;
		
		const localVideoStream = ge( 'VideoStream' ).srcObject;
		
		retrying = true;
		
		function executeCall()
		{
			const c = peer.call( msg.remotePeerId, localVideoStream );
			if( c && c.on )
			{
				c.on( 'stream', ( remoteStream ) => {
					// Prevent readding the same
					if( !callList[ c.peer ] )
					{
						ge( 'VideoArea' ).classList.remove( 'Loading' );
						ge( 'VideoArea' ).classList.add( 'Connected' );
						const remoteVideo = ge( 'RemoteVideoStream' );
						remoteVideo.srcObject = remoteStream;
						initStreamEvents( remoteVideo );
						currentRemoteStream = remoteStream; // For safe keeping
						
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
					//console.log( 'Retrying.' );
					executeCall();
				}
			}, 250 );
		}
		executeCall();
	}
	else if( msg.command == 'poll' )
	{
		console.log( 'Was polled', msg );
	}
}
Application.run = function()
{
	let self = this;
	
	peer = new Peer();
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
								console.log( 'Retrying here.' );
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
function handleRemoteStreamEnded( e )
{
	if( e.type == 'mute' )
	{
		const remoteVideo = ge( 'RemoteVideoStream' );
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
		const remoteVideo = ge( 'RemoteVideoStream' );
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
	if( ge( 'remotePeerId' ).value )
	{
		peer.call( ge( 'remotePeerId' ).value, ge( 'VideoStream' ).srcObject );
		
		// Just nudge our friend!
		Application.sendMessage( {
			command: 'broadcast-poll',
			peerId: ge( 'remotePeerId' ).value
		} );
	}
}

// Function to start screen sharing
function startScreenShare( el, retries = 5 ) 
{
	navigator.mediaDevices.getDisplayMedia( { video: true } )
		.then( ( stream ) => {
			// Replace video track with screen sharing track
			const localVideoTrack = currentVideoStream.getVideoTracks()[0];
			localVideoTrack.stop();
			currentVideoStream.removeTrack(localVideoTrack);
			currentVideoStream.addTrack( stream.getVideoTracks()[ 0 ] );

			const localVideo = document.getElementById('VideoStream');
			localVideo.srcObject = stream;
			
			currentVideoStream = stream;
			
			document.body.classList.add( 'ScreenShare' );
			
			el.classList.add( 'On' );
			
			videoPoll();
		} )
		.catch( ( error ) => {
			console.error( 'Error accessing screen share:', error );
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

