// Just a global peer object
window.peer = false;

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

let callList = [];

Application.receiveMessage = function( msg )
{
	// We were told it is safe to start calling the remote peer
	if( msg.command == 'initcall' && msg.peerId == ge( 'peerId' ).value )
	{
		console.log( '[Host] Initializing call. ' );
		if( !window.peer )
		{
			return setTimeout( function()
			{
				Application.receiveMessage( msg );
			}, 100 );
		}
		
		const localVideoStream = ge( 'VideoStream' ).srcObject;
		console.log( '[Host] Calling: ' + msg.remotePeerId );
		
		let retires = 10;
		
		function executeCall()
		{
			const c = peer.call( msg.remotePeerId, localVideoStream );
			c.on( 'stream', ( remoteStream ) => {
				// Prevent readding the same
				if( !callList[ c.peer ] )
				{
					console.log( 'What: ', remoteStream );
					ge( 'VideoArea' ).classList.remove( 'Loading' );
					ge( 'VideoArea' ).classList.add( 'Connected' );
					const remoteVideo = ge( 'RemoteVideoStream' );
					remoteVideo.srcObject = remoteStream;
					initStreamEvents( remoteVideo );
					
					// In case of reconnects (this happens when remote goes away)
					remoteVideo.classList.remove( 'Hidden' );
					console.log( '[host] We have started the stream to client.' );
					
					callList[ c.peer ] = c;
				}
				else
				{
					console.log( 'Already called steam...' );
				}
			} );
			c.on( 'error', ( err ) => {
				console.log( 'Error with connecting to remote stream.', err );
			} );
			setTimeout( function()
			{
				if( retries-- > 0 )
				{
					console.log( '[Host] Retry (' + ( retries + 1 ) + ' retries left.).' );
					executeCall();
				}
			}, 250 );
		}
		executeCall();
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
	  
		console.log( '[All] We opened a peer.' );
		
		const localVideo = ge( 'VideoStream' );
		navigator.mediaDevices.getUserMedia( { video: true, audio: true } )
			.then( ( stream ) => {
				localVideo.srcObject = stream;
				
				// Set up call event so we can be called
				peer.on( 'call', ( c ) => {
					// Answer the call and display remote stream
					c.answer( stream );
					c.on( 'stream', ( remoteStream ) => {
						// Prevent readding the same
						if( !callList[ c.peer ] )
						{
							ge( 'VideoArea' ).classList.remove( 'Loading' );
							ge( 'VideoArea' ).classList.add( 'Connected' );
							const remoteVideo = ge( 'RemoteVideoStream' );
							remoteVideo.srcObject = remoteStream;
							initStreamEvents( remoteVideo );
							console.log( '[Client] Streaming now.' );
							callList[ c.peer ] = c;
						}
					} );
					console.log( '[Client] We were called, doing stream' );
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
			console.log( '[Host] Broadcasting our peer id: ' + ge( 'peerId' ).value );
			self.sendMessage( {
				command: 'broadcast-call',
				peerId: ge( 'peerId' ).value
			} );
		}
		// We have a currentPeerId from remote, so tell we got it
		else
		{
			console.log( '[Client] Accepting remote peer id: ' + ge( 'currentPeerId' ).value );
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
		remoteVideo.classList.add( 'Hidden' );
		console.log( 'mute: ', e );
	}
	else
	{
		console.log( 'End: ', e );
	}
	
}
function handleRemoteStreamMuted( e )
{
	if( e.type == 'mute' )
	{
		const remoteVideo = ge( 'RemoteVideoStream' );
		remoteVideo.classList.add( 'Hidden' );
		console.log( 'mute 2: ', e );
	}
	else
	{
		console.log( 'End: ', e );
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
		console.log( 'Video Element Error: ', e );
	}
	obj.srcObject.getTracks().forEach( ( track ) => {
	  track.onended = handleRemoteStreamEnded;
	  track.onmute = handleRemoteStreamMuted;
	  track.onerror = function( e )
	  {
	  	console.log( 'What is it?', e );
	  }
	});
}

