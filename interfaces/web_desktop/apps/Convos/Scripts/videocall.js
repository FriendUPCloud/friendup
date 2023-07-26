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
	if( msg.command == 'initcall' && msg.peerId == ge( 'peerId' ).value )
	{
		if( !window.peer )
		{
			return setTimeout( function()
			{
				Application.receiveMessage( msg );
			}, 100 );
		}
		
		const localVideoStream = ge( 'VideoStream' ).srcObject;
		retrying = true;
		
		remotePeerId = msg.remotePeerId;
		
		function executeCall()
		{
			const c = peer.call( msg.remotePeerId, localVideoStream );
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
			clearTimeout( retryTimeo );
			retryTimeo = setTimeout( function()
			{
				if( retrying )
				{
					//console.log( '[Host] Retrying..' );
					executeCall();
				}
			}, 250 );
		}
		executeCall();
	}
	else if( msg.command == 'poll' )
	{
	}
}
Application.run = function()
{
	let self = this;
	
	peer = new Peer();
	/*peer.on( 'error', ( err ) => {
		console.log( 'Peer error: ', err );
	} );
	peer.on( 'disconnected', ( err ) => {
		console.log( 'Peer disconnected: ', err );
	} );
	peer.on( 'peer-unavailable', ( err ) => {
		console.log( 'Peer became unavailable: ', err );
	} );
	peer.on( 'connection', ( err ) => {
		console.log( 'Peer connection info: ', err );
	} );
	peer.on( 'close', ( err ) => {
		console.log( 'Peer closed: ', err );
	} );*/
	peer.on( 'open', (peerId) => {
		ge( 'peerId' ).value = peerId;
	  
		//console.log( '[All] We opened a peer.' );
		
		const localVideo = ge( 'VideoStream' );
		navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
			.then( ( stream ) => {
				localVideo.srcObject = stream;
				
				currentVideoStream = stream;
				const remoteVideo = ge( 'RemoteVideoStream' );
				
				// Set up call event so we can be called
				peer.on( 'call', ( c ) => {
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
							//console.log( '[Client] Streaming now.' );
							callList[ c.peer ] = c;
							currentRemoteStream = remoteStream; // For safe keeping
						}
					} );
					//console.log( '[Client] We were called, doing stream' );
					c.on( 'data', ( data ) => {
						console.log( 'We got data after call stream: ', data );
					} ),
					c.on( 'error', ( err ) => {
						console.log( 'Call error...', err );
					} );
				} );
				/*peer.on( 'error', ( err ) => {
					console.log( 'Error with calling remote.', err );
				} );*/
			} )
			.catch( ( error ) => {
				console.error( 'Error accessing media devices:', error );
			} );
		// We are starting the stream, so broadcast call
		if( !ge( 'currentPeerId' ).value )
		{
			//console.log( '[Host] Broadcasting our peer id: ' + ge( 'peerId' ).value );
			self.sendMessage( {
				command: 'broadcast-call',
				peerId: ge( 'peerId' ).value
			} );
		}
		// We have a currentPeerId from remote, so tell we got it
		else
		{
			//console.log( '[Client] Accepting remote peer id: ' + ge( 'currentPeerId' ).value );
			ge( 'VideoStream' ).parentNode.classList.add( 'Loading' );
			Application.sendMessage( {
				command: 'broadcast-received',
				peerId: ge( 'currentPeerId' ).value,
				remotePeerId: ge( 'peerId' ).value
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
	// Call client
	if( remotePeerId )
	{
		peer.call( remotePeerId, ge( 'VideoStream' ).srcObject );
	}
	// Call host
	else
	{
		peer.call( ge( 'currentPeerId' ).value, ge( 'VideoStream' ).srcObject );
	}
	/*Application.sendMessage( {
		command: 'broadcast-poll',
		peerId: ge( 'peerId' ).value
	} );*/
}

// Function to start screen sharing
function startScreenShare( el ) 
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
		});
}

// Function to stop screen sharing and return to video call
function stopScreenShare( el ) 
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
		});
}

