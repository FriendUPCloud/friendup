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

/*
requires EventEmitter and EventNode from js/util/events.js
uses .stringify and .objectify from js/util/tool.js
*/

var friendUP = window.friendUP || {};

// RTC
// holds all the actual peer objects and connections
(function( ns, undefined ) {
	ns.P2P = function( conf, onclose ) {
		if ( !( this instanceof ns.P2P ))
			return new ns.P2P( conf, onclose );
		
		console.log( 'RTC', conf );
		var self = this;
		self.id = conf.p2pId;
		self.conn = conf.conn || null;
		self.config = conf.rtc;
		self.onclose = onclose;
		
		self.rtcConf = null;
		self.peers = {};
		self.peerList = null;
		self.joined = false;
		
		self.init();
	}
	
	ns.P2P.prototype.init = function() {
		var self = this;
		console.log( 'RTC.init', self );
		if ( !self.conn ) {
			console.log( 'no conn, setup signal plx', self );
			throw new Error( 'no conn ^^^' );
		}
		
		self.conn.once( 'config', conf );
		self.conn.send({
			type : 'config',
		});
		
		function conf( e ) { self.initialize( e ); }
	}
	
	ns.P2P.prototype.initialize = function( roomConf ) {
		var self = this;
		console.log( 'RTC.initialize', roomConf );
		self.rtcConf = roomConf.conn.rtc;
		self.peerList = roomConf.peers;
		
		// do init checks
		self.initChecks = new library.rtc.P2PChecks( allChecksDone );
		self.initChecks.checkBrowser( browserResult );
		self.initChecks.checkICE( self.rtcConf.iceServers, iceResult );
		function browserResult( res ) {
			console.log( 'browser capa check result', res );
		}
		
		function iceResult( res ) {
			console.log( 'ICE check result', res );
		}
		
		function allChecksDone( err, res ) {
			console.log( 'init checks done - result', {
				err : err, 
				res : res });
			
			self.initChecks.close();
			delete self.initChecks;
			if ( err ) {
				console.log( 'init checks had errors', err );
				return;
			}
			
			self.goActive();
		}
	}
	
	ns.P2P.prototype.goActive = function() {
		var self = this;
		self.bindConn();
		self.connectPeers();
	}
	
	ns.P2P.prototype.bindConn = function() {
		var self = this;
		self.conn.on( 'join', join );
		self.conn.on( 'leave', leave );
		self.conn.on( 'close', close );
		
		function join( e ) { self.handlePeerJoin( e ); }
		function leave( e ) { self.handlePeerLeft( e ); }
		function close( e ) { self.handleClosed( e ); }
	}
	
	ns.P2P.prototype.connectPeers = function() {
		var self = this;
		console.log( 'rtc.connectpeers', self.config.peers );
		self.peerList.forEach( connect );
		function connect( peerId ) {
			var conf = {
				peerId : peerId,
				doInit : true,
			};
			self.createPeer( conf );
		}
	}
	
	ns.P2P.prototype.handlePing = function( timestamp ) {
		var self = this;
		console.log( 'handlePing', timestamp );
		var pong = {
			type : 'pong',
			data : timestamp,
		};
		self.conn.send( pong );
	}
	
	ns.P2P.prototype.handlePeerJoin = function( peer ) {
		var self = this;
		console.log( 'RTC.handlePeerJoin', peer );
		peer.doInit = false;
		self.createPeer( peer );
	}
	
	ns.P2P.prototype.handlePeerLeft = function( peer ) {
		var self = this;
		var peerId = peer.peerId;
		console.log( 'RTC.handlePeerLeft', peerId );
		self.closePeer( peerId );
	}
	
	ns.P2P.prototype.handleClosed = function() {
		var self = this;
		console.log( 'handleClosed' );
		self.close();
	}
	
	ns.P2P.prototype.restartStream = function() {
		var self = this;
		var pids = Object.keys( self.peers );
		console.log( 'restartStream', pids );
		
		// stop peers
		pids.forEach( stop );
		// get new media
		self.selfie.setupStream( streamReady );
		function streamReady() {
			// restart peers
			pids.forEach( reconnect );
		}
		
		function stop( pid ) {
			var peer = self.peers[ pid ];
			peer.stop();
		}
		
		function reconnect( pid ) {
			var peer = self.peers[ pid ];
			peer.start();
		}
	}
	
	/*
	ns.P2P.prototype.syncPeers = function( peers ) {
		var self = this;
		checkRemoved( peers );
		checkJoined( peers );
		
		function checkRemoved( peers ) {
			var localPids = Object.keys( self.peers );
			var serverPids = peers.map( getId );
			var removed = localPids.filter( notInPeers );
			removed.forEach( remove );
			function remove( pid ) {
				self.removePeer( pid );
			}
			
			function notInPeers( pid ) {
				var index = serverPids.indexOf( pid );
				return !!( -1 === index );
			}
			
			function getId( peer ) { return peer.peerId; }
		}
		
		function checkJoined( peers ) {
			var joined = peers.filter( notFound );
			joined.forEach( add );
			
			function notFound( peer ) {
				var pid = peer.peerId;
				return !self.peers[ pid ];
			}
			
			function add( peer ) {}
		}
	}
	
	ns.P2P.prototype.getRoomSync = function() {
		var self = this;
		console.log( 'getRoomSync' );
		var msg = {
			type : 'sync',
		}
		self.signal.send( msg );
	}
	
	
	ns.P2P.prototype.reconnectPeers = function() {
		var self = this;
		console.log( 'RTC.reconnectPeers' );
		for( var pid in self.peers ) {
			var peer = self.peers[ pid ];
			peer.checkFailed();
		}
	}
	*/
	
	ns.P2P.prototype.createPeer = function( data ) {
		var self = this;
		var pid = data.peerId;
		var peer = self.peers[ pid ];
		if ( peer ) {
			peer.close();
			delete self.peers[ pid ];
			self.view.removePeer( pid );
		}
		
		//if ( )
		if ( null == data.doInit )
			data.doInit = false;
		
		var peer = new library.rtc.Peer({
			id       : data.peerId,
			doInit   : data.doInit,
			signal   : self.conn,
			rtcConf  : self.rtcConf,
			onremove : onremove,
			closeCmd : closeCmd,
		});
		
		peer.on( 'nestedapp' , nestedApp );
		
		function nestedApp( e ) { self.view.addNestedApp( e ); }
		
		self.peers[ peer.id ] = peer;
		self.view.addPeer( peer );
		
		function onremove() { self.onRemovePeer( data.peerId ); }
		function closeCmd() { self.closePeer( data.peerId ); }
	}
	
	ns.P2P.prototype.onRemovePeer = function( peerId ) {
		var self = this;
		self.roomSignal.send({
			type : 'remove',
			data : {
				peerId : peerId,
			}
		});
	}
	
	ns.P2P.prototype.removePeer = function( pid ) {
		var self = this;
		var peer = self.peers[ pid ];
		if ( !peer && ( pid === self.userId )) { // yuo got removed, close
			self.close();
			return;
		}
		
		if ( !peer )
			return;
		
		self.closePeer( peer.id );
	}
	
	ns.P2P.prototype.peerLeft = function( pid ) {
		var self = this;
		var peer = self.peers[ pid ];
		if ( !peer ) {
			return;
		}
		
		self.closePeer( peer.id );
	}
	
	ns.P2P.prototype.closePeer = function( peerId ) {
		var self = this;
		var peer = self.peers[ peerId ];
		if ( !peer ) {
			console.log( 'RTC.closePeer - no peer for id', peerId );
			return;
		}
		
		delete self.peers[ peerId ];
		self.view.removePeer( peerId );
		peer.close();
	}
	
	ns.P2P.prototype.broadcast = function( msg ) {
		var self = this;
		if ( !self.conn )
			return;
		
		var wrap = {
			type : 'broadcast',
			data : msg,
		};
		
		self.conn.send( wrap );
	}
	
	ns.P2P.prototype.leave = function() {
		var self = this;
		console.log( 'rtc.leave' );
		self.close();
	}
	
	ns.P2P.prototype.close = function() {
		var self = this;
		console.log( 'rtc.close' );
		var peerIds = Object.keys( self.peers );
		peerIds.forEach( callClose );
		function callClose( peerId ) {
			self.closePeer( peerId );
		}
		
		delete self.conf;
		delete self.conn;
		
		var onclose = self.onclose;
		delete self.onclose;
		if ( onclose )
			onclose();
	}
	
})( library.rtc );

// PEER
Peer = function( conf ) {
	if ( !( this instanceof Peer ))
		return new Peer( conf );
	
	library.component.EventEmitter.call( this );
	
	var self = this;
	self.conf = conf;
	self.id = conf.id;
	self.doInit = conf.doInit;
	self.rtcConf = conf.rtcConf;
	self.onremove = conf.onremove; // when the remote peer initiates a close, call this
	self.closeCmd = conf.closeCmd; // closing from this end
	self.signal = null; // conf.signal is parent
	
	self.channels = {}; // data channels
	
	self.metaInterval = null;
	
	self.init( conf.signal );
}

Peer.prototype = Object.create( library.component.EventEmitter.prototype );

// Public

Peer.prototype.checkFailed = function() {
	var self = this;
	console.log( 'Peer.checkReconnect', self.channels );
	for ( var sid in self.channels )
		check( sid );
	
	function check( sid ) {
		var sess = self.channels[ sid ];
		var rtcState = sess.conn.iceConnectionState;
		console.log( 'check', { sid : sid , state : rtcState });
		if ( 'failed' !== rtcState )
			return;
		
		console.log( 'failed channel, reconnecting', sess );
		self.recycleChannel( sid );
	}
}

Peer.prototype.start = function() {
	var self = this;
	console.log( 'Peer.start', self.channels );
	if ( self.doInit )
		self.syncMeta();
	else {
		self.metaSyncDone = false;
		sendStart();
	}
	
	function sendStart() {
		var msg = {
			type : 'start',
		};
		self.signal.send( msg );
	}
}

Peer.prototype.restart = function() {
	var self = this;
	console.log( 'Peer.restart', self.channels );
	for ( var sid in self.channels )
		recycle( sid );
	
	function recycle( sid ) {
		if ( 'ping' === sid )
			return;
		
		self.recycleChannel( sid );
	}
}

Peer.prototype.stop = function() {
	var self = this;
	sendStop();
	self.closeAllChannels();
	
	function sendStop() {
		var msg = {
			type : 'stop',
		};
		self.signal.send( msg );
	}
}

// Private

Peer.prototype.init = function( parentSignal ) {
	var self = this;
	
	// websocket to signal server
	self.signal = new EventNode(
		self.id,
		parentSignal,
		eventSink
	);
	
	self.signal.on( 'ping'         , signalPing );
	self.signal.on( 'meta'         , meta );
	self.signal.on( 'recycle'      , recycle );
	self.signal.on( 'reconnect'    , reconnect );
	self.signal.on( 'start'        , start );
	self.signal.on( 'stop'         , stop );
	self.signal.on( 'leave'        , leave );
	self.signal.on( 'close'        , closed );
	
	function signalPing( e ) { self.handleSignalPing( e ); }
	function meta( e ) { self.handleMeta( e ); }
	function recycle( e ) { self.handleRecycle( e ); }
	function reconnect( e ) { self.handleReconnect( e ); }
	function start( e ) { self.handleStart(); }
	function stop( e ) { self.handleStop( e ); }
	function leave( e ) { console.log( 'peer left?' ); }
	function closed( e ) { self.closeCmd(); }
	
	function eventSink( e ) { console.log( 'unhandled peer signal event', e ); }
	
	// lets go
	self.start();
}

Peer.prototype.createChannel = function( type ) {
	var self = this;
	if ( !type )
		type = 'stream';
	
	if ( self.channels[ type ])
		self.closeChannel( type );
	
	var channel = new Session({
		type      : type,
		doInit    : self.doInit,
		rtc       : self.rtcConf,
		signal    : self.signal,
		modifySDP : modSDP,
	});
	self.channels[ type ] = channel;
	
	channel.on( 'open'  , open );
	channel.on( 'end'   , ended );
	channel.on( 'state' , stateChange );
	channel.on( 'error' , sessionError );
	
	function open( e ) { self.channelOpen( e, type ); }
	function ended( e ) { self.channelEnded( e, type ); }
	function stateChange( e ) { self.handleSessionStateChange( e, type ); }
	function sessionError( e ) { self.handleSessionError( e, type ); }
}

Peer.prototype.handleReconnect = function( sid ) {
	var self = this;
	console.log( 'Peer.handleReconnect', sid );
	self.showSelfie( null, sid );
}

Peer.prototype.handleRecycle = function( sid ) {
	var self = this;
	console.log( 'Peer.handleRecycle', sid );
	self.closeChannel( sid );
	self.createChannel( sid );
	if ( self.doInit )
		self.showSelfie( null, sid );
	else
		sendReconnect( sid );
	
	function sendReconnect( sid ) {
		var msg = {
			type : 'reconnect',
			data : sid,
		};
		self.signal.send( msg );
	}
}

Peer.prototype.recycleChannel = function( sid ) {
	var self = this;
	console.log( 'Peer.recycleChannel', sid );
	self.closeChannel( sid );
	self.createChannel( sid );
	var msg = {
		type : 'recycle',
		data : sid,
	};
	self.signal.send( msg );
}

Peer.prototype.handleStart = function() {
	var self = this;
	console.log( 'Peer.handleStart' );
	self.syncMeta();
}

Peer.prototype.handleStop = function( sid ) {
	var self = this;
	console.log( 'Peer.handleStop', sid );
	self.closeAllChannels();
}

Peer.prototype.closeAllChannels = function() {
	var self = this;
	console.log( 'closeAllChannels' );
	self.metaSyncDone = false;
	for ( var sid in self.channels )
		self.closeChannel( sid );
}

Peer.prototype.closeChannel = function( sid ) {
	var self = this;
	console.log( 'Peer.closeChannel', sid );
	var sess = self.channels[ sid ];
	self.channels[ sid ] = null;
	sess.close();
}

Peer.prototype.handleSignalPing = function( pingTime ) {
	var self = this;
	if (( 0 === pingTime ) || ( null == pingTime ))
		setTimeoutState();
	
	if ( -1 === pingTime )
		setErrorState();
	
	var ping = {
		type : 'ping',
		data : pingTime,
	};
	sendSignal( ping );
	
	function setTimeoutState() {
		var timeout = {
			type : 'timeout',
		};
		sendSignal( timeout );
	}
	
	function setErrorState() {
		var error = {
			type : 'error',
		};
		sendSignal( error );
	}
	
	function sendSignal( event ) {
		var state = {
			type : 'signal',
			data : event,
		};
		self.emit( 'state', state );
	}
}

Peer.prototype.syncMeta = function() {
	var self = this;
	console.log( 'Peer.syncMeta', self.doInit );
	if ( self.metaInterval )
		window.clearInterval( self.metaInterval );
	
	self.metaSyncDone = false;
	self.sendMeta();
	self.metaInterval = window.setInterval( resendMeta, 500 );
	function resendMeta() {
		self.sendMeta();
	}
}

Peer.prototype.sendMeta = function() {
	var self = this;
	if ( self.metaInterval ) {
		clearInterval( self.metaInterval );
		self.metaInterval = null;
	}
	
	var meta = {
		isChrome : self.selfie.isChrome,
		isFirefox : self.selfie.isFirefox,
		state : {
			
		},
	};
	console.log( 'sendMeta', meta );
	self.signal.send({
		type : 'meta',
		data : meta,
	});
}

Peer.prototype.handleMeta = function( meta ) {
	var self = this;
	console.log( 'handleMeta', {
		meta : meta,
		msd : self.metaSyncDone,
		doInit : self.doInit,
	});
	if ( self.metaSyncDone ) {
		self.updateMeta( meta );
		return;
	}
	
	if ( self.metaInterval ) {
		window.clearTimeout( self.metaInterval );
		self.metaInterval = null;
	}
	
	if ( !self.doInit )
		self.sendMeta();
	
	self.metaSyncDone = true;
	self.updateMeta( meta );
	var signalState = {
		type : 'signal',
		data : {
			type : 'nominal',
		},
	};
	self.emit( 'state', signalState );
	self.initializeChannels();
}

Peer.prototype.updateMeta = function( data ) {
	var self = this;
	console.log( 'updateMeta', data );
	if ( data.state )
		updateState( data.state );
	
	self.isChromePair = ( !data.isFirefox && !self.selfie.isFirefox );
	self.emit( 'meta', data );
	
	function updateState( state ) {
		if ( null != state.isMuted )
			self.setRemoteMute( state.isMuted );
		
		if ( null != state.isBlinded )
			self.setRemoteBlind( state.isBlinded );
	}
}

Peer.prototype.initializeChannels = function() {
	var self = this;
	console.log( 'initializeChannels' );
	self.createChannel( 'default' );
}

Peer.prototype.handleSessionStateChange = function( event ) {
	var self = this;
	//console.log( 'rtc.handlseSessionStateChange', event );
	if ( 'error' === event.type )
		self.handleSessionError( event );
	
	var rtcState = {
		type : 'rtc',
		data : event,
	};
	
	self.emit( 'state', rtcState );
}

Peer.prototype.handleSessionError = function( event ) {
	var self = this;
	console.log( 'handleSessionError', event );
}

Peer.prototype.emitChannelState = function( state ) {
	var self = this;
	console.log( 'emitChannelState', state );
	return;
	
	if ( state )
		self.streamState = state;
	
	state = state || self.streamState;
	var tracks = getTracks();
	var constraints = getConstraints();
	
	var streamState = {
		type : 'stream',
		data : {
			type : state,
			tracks : tracks,
			constraints : constraints,
		}
	};
	
	self.emit( 'state', streamState );
	
	function getTracks() {
		var at = self.getAudioTrack();
		var vt = self.getVideoTrack();
		
		var atState = at ? at.readyState : 'unknown';
		var vtState = vt ? vt.readyState : 'unknown';
		
		if (( 'live' === atState ) && ( self.remoteMute ))
			atState = 'paused';
		
		if (( 'live' === vtState ) && ( self.remoteBlind ))
			vtState = 'paused';
		
		return {
			audio : atState,
			video : vtState,
		};
	}
	
	function getConstraints() {
		return self.constraints || null;
	}
}

Peer.prototype.remove = function() {
	var self = this;
	self.onremove();
}

Peer.prototype.close = function() {
	var self = this;
	if ( self.metaInterval ) {
		window.clearInterval( self.metaInterval );
		self.metaInterval = null;
	}
	
	self.releaseStream();
	self.release(); // component.EventEmitter
	self.selfie.off( self.streamHandlerId );
	//self.selfie.off( self.qualityHandlerId );
	delete self.selfie;
	
	delete self.onremove;
	delete self.closeCmd;
	
	closeChannels();
	self.signal.close();
	delete self.signal;
	
	function closeChannels() {
		for ( var type in self.channels ) {
			var sess = self.channels[ type ];
			sess.close();
		}
	}
}


// SESSION
Session = function( conf ) {
	if( !( this instanceof Session ))
		return new Session( conf );
	
	library.component.EventEmitter.call( this );
	
	var self = this;
	self.type = conf.type;
	self.id = 'session-' + self.type;
	self.doInit = conf.doInit || false;
	self.rtc = conf.rtc;
	self.signal = conf.signal;
	
	// peer connection, holder of things
	self.conn = null;
	
	self.negotiationWaiting = false;
	self.negotiationTimeout = null;
	self.negotiationTimer = 1000 * 10;
	self.denyNegotiation = false;
	
	// data channels
	self.channels = {};
	
	// ping
	self.pingChannel = null;
	self.pingInterval = null;
	self.pingStep = 1000 * 3;
	self.pings = [];
	self.pingsIndex = 0;
	self.pingsMax = 5;
	
	// rtc specific logging ( automatic host / client prefix )
	self.spam = true;
	
	self.init();
}

Session.prototype = Object.create( library.component.EventEmitter.prototype );

// Public

Session.prototype.openChannel = function( id ) {
	var self = this;
	console.log( 'openChannel', id );
}

Session.prototype.closeChannel = function( id ) {
	var self = this;
	console.log( 'closeChannel', id );
}

Session.prototype.renegotiate = function() {
	var self = this;
	console.log( 'Session.renegotiate - doInit', self.doInit );
	self.tryNegotiation();
}

// Private

Session.prototype.stateTypeMap = {
	'nominal'             : 'nominal',
	'host-negotiation'    : 'waiting',
	'client-negotiation'  : 'waiting',
	'negotiation-waiting' : 'waiting',
	'ICE-gathering'       : 'waiting',
	'ICE-checking'        : 'waiting',
	'ICE-disconnected'    : 'waiting',
	'ICE-failed'          : 'error',
	'closed'              : 'closed',
	'ping'                : 'ping',
	'derp'                : 'error', // something lol'd
};

Session.prototype.init = function() {
	var self = this;
	var roomConf = {
		type : self.id,
		signal : self.signal,
	};
	self.signal = new EventNode(
		self.id,
		self.signal,
		eventSink,
	);
	self.signal.on( 'sdp', sdpReceived );
	self.signal.on( 'candidate', iceCandidateReceived );
	self.signal.on( 'negotiate', handleNegotiate );
	
	function sdpReceived( msg ) { self.sdpReceived( msg ); }
	function iceCandidateReceived( msg ) { self.iceCandidateReceived( msg ); }
	function handleNegotiate( msg ) { self.handleNegotiate( msg ); }
	
	function eventSink( e ) { self.log( 'unhandled signal event', e ); }
	
	var peerConf = {
		iceServers : self.rtc.iceServers,
		//iceTransportPolicy : 'relay',
	};
	
	console.log( 'peerConf', peerConf );
	self.conn = new window.RTCPeerConnection( peerConf );
	self.conn.onconnectionstatechange = connStateChange;
	self.conn.onaddstream = streamAdded;
	self.conn.ontrack = onTrack;
	self.conn.ondatachannel = dataChannel;
	self.conn.onicecandidate = iceCandidate;
	self.conn.oniceconnectionstatechange = iceConnectionChange;
	self.conn.onicegatheringstatechange = iceGatheringChange;
	self.conn.identityresult = identityResult;
	self.conn.onidpassertionerror = idpAssertionError;
	self.conn.onidpvalidationerror = idpValidationError;
	self.conn.onnegotiationneeded = negotiationNeeded;
	self.conn.onpeeridentity = peerIdentity;
	self.conn.onremovestream = streamRemoved;
	self.conn.onsignalingstatechange = signalStateChange;
	
	function connStateChange( e ) { self.connectionStateChange( e ); }
	function streamAdded( e ) { self.log( 'streamAdded ????', e ); }
	function onTrack( e ) { self.log( 'onTrack ????', e ) }
	function dataChannel( e ) { self.dataChannelAdded( e ); }
	function iceCandidate( e ) { self.iceCandidate( e ); }
	function iceConnectionChange( e ) { self.iceConnectionStateChange( e ); }
	function iceGatheringChange( e ) { self.iceGatheringStateChange( e ); }
	function identityResult( e ) { self.log( 'NYI - identityResult event', e ); }
	function idpAssertionError( e ) { self.log( 'NYI - idpAssertionError', e ); }
	function idpValidationError( e ) { self.log( 'NYI - idpValidationError', e ); }
	function negotiationNeeded( e ) { self.negotiationNeeded( e ); }
	function peerIdentity( e ) { self.log( 'NYI - peerIdentity event', e ); }
	function streamRemoved( e ) { self.streamRemoved( e ); }
	function signalStateChange( e ) { self.signalStateChange( e ); }
	
	if ( self.doInit )
		self.openPingChannel();
}

Session.prototype.startStatSpam = function() {
	var self = this;
	if ( !self.spam )
		return;
	
	self.statInterval = window.setInterval( stats, 60000 );
	function stats() {
		if ( !self.conn ) {
			window.clearInterval( self.statInterval );
			return;
		}
		
		if ( !self.conn.getStats ) {
			console.log( 'rtc conn does not have .stats();')
			return;
		}
		
		self.conn.getStats()
			.then( success )
			.catch( error );
			
		function success( stats ) {
			console.log( 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' );
			var stats = stats.result();
			stats.forEach( showAndTell );
			function showAndTell( statItem ) {
				console.log( '------------------------', statItem );
				var names = statItem.names();
				names.forEach( showStat );
				function showStat( name ) {
					console.log( name, statItem.stat( name ));
				}
			}
		}
		function error( err ) { console.log( 'stats error', err ); }
	}
}

Session.prototype.connectionStateChange = function( e ) {
	var self = this;
	self.log( 'connectionStateChange', e );
}

Session.prototype.createDataChannel = function( id ) {
	var self = this;
	if ( !id )
		throw new Error( 'rtc.createDataChannel - no id' );
	
	self.log( 'createDataChannel' );
	var channel = self.conn.createDataChannel( id );
	self.channels[ channel.label ] = channel;
	return channel;
}

Session.prototype.closeDataChannel = function( id ) {
	var self = this;
	self.log( 'closeDataChannel - NYI', id );
}

Session.prototype.iceCandidate = function( e ) {
	var self = this;
	var msg = {
		type : 'candidate',
		data : e.candidate,
	};
	self.log( 'sending ice candidate', msg );
	self.signal.send( msg );
}

Session.prototype.iceConnectionStateChange = function( e ) {
	var self = this;
	self.log( 'iceConnectionChange', e );
	self.log( 'iceConnectionState', self.conn.iceConnectionState );
	self.log( 'iceGatheringState', self.conn.iceGatheringState );
	self.setState();
}

Session.prototype.iceGatheringStateChange = function( e ) {
	var self = this;
	self.log( 'iceGatheringStateChange', e );
	self.log( 'iceGatheringState', self.conn.iceGatheringState );
}

Session.prototype.negotiationNeeded = function( e ) {
	var self = this;
	self.log( 'negotiation needed', self.conn.signalingState );
	self.tryNegotiation();
}

Session.prototype.tryNegotiation = function() {
	var self = this;
	self.log( 'tryNegotiation' );
	self.setState( 'negotiation-waiting' );
	if ( self.conn.signalingState !== 'stable' ) {
		self.negotiationWaiting = true;
		return;
	}
	
	if ( !self.doInit ) {
		self.requestNegotiation();
		return;
	}
	
	if ( self.negotiationTimeout ) {
		self.log( 'waiting for negotiation timeout' );
		return;
	}
	
	self.createOffer();
}

Session.prototype.requestNegotiation = function() {
	var self = this;
	var req = {
		type : 'negotiate',
		data : 'request',
	};
	self.log( '.requestNegotiation', req );
	if ( !self.signal )
		return;
	
	self.signal.send( req );
}

Session.prototype.negotiationAccepted = function() {
	var self = this;
	self.log( 'negotiation accepted, creating offer' );
	self.createOffer();
}

Session.prototype.negotiationDenied = function() {
	var self = this;
	self.log( 'negotiation denied - retrying in a bit' );
	window.setTimeout( retryNeg, 3000 );
	function retryNeg() {
		self.requestNegotiation();
	}
}

Session.prototype.createOffer = function() {
	var self = this;
	self.log( 'createOffer', self.conn.signalingState );
	self.negotiationWaiting = false;
	
	if ( self.doInit ) {
		self.denyNegotiation = true;
		self.setState( 'host-negotiation' );
	} else
		self.setState( 'client-negotiation' );
	
	self.conn.createOffer()
		.then( offerReady )
		.catch( offErr );
	function offerReady( offer ) {
		var sdp = self.modifySDP( offer );
		self.setLocalDescription( sdp );
	}
	
	function offErr( err ) {
		self.log( 'createOfferErr', err );
	}
}

Session.prototype.setLocalDescription = function( desc ) {
	var self = this;
	self.log( 'local SDP' );
	self.logSDP( desc, 'local' );
	self.conn.setLocalDescription( desc )
		.then( sendDesc )
		.catch( setLDErr );
	function sendDesc() {
		self.log( 'local description set', self.conn.signalingState );
		self.sendDescription();
	}
	function setLDErr( err ) {
		self.log( 'error setting local description', err );
	}
}

Session.prototype.toggleSDPActivePassive = function( sdpObj ) {
	var self = this;
	self.log( 'toggleSDPActivePassive', sdpObj );
	var sdp = sdpObj.sdp;
	var match = sdp.match( /(a=setup:(active))|(a=setup:(passive))/ );
	self.log( 'active:passive', match );
	if ( match[ 2 ]) // active matched
		sdp = replace( sdp, 'active', 'passive' );
	else
		sdp = replace( sdp, 'passive', 'active' );
	
	sdpObj.sdp = sdp;
	return sdpObj;
	
	function replace( sdp, replace, withThis ) {
		var base = 'a=setup:';
		replace = base + replace;
		withThis = base + withThis;
		self.log( 'replaceing', { r : replace, w : withThis });
		return sdp.replace( replace, withThis );
	}
}

Session.prototype.logSDP = function( sdp, type ) {
	var self = this;
	if ( 'local' !== type  ) {
		var localSdp = self.conn.localDescription;
		if ( localSdp && !!localSdp.type )
			self.logSDP( localSdp, 'local' );
	}
	
	if ( !sdp || !sdp.sdp )
		return;
	
	var match = sdp.sdp.match( /a=setup:.*/ );
	var asetup = '';
	if ( match )
		asetup = match[ 0 ];
	
	self.log( 'SDP', { 
		'type'         : type,
		'signal state' : self.conn.signalingState,
		'a=setup:'     : asetup,
		'sdp'          : sdp,
	});
}

Session.prototype.sendDescription = function() {
	var self = this;
	if ( self.inOfferProcess ) {
		self.log( 'inOfferProcess.true - not sending SDP', self.conn.signalingState );
		return;
	}
	
	if ( 'have-local-offer' === self.conn.signalingState )
		self.inOfferProcess = true;
	
	var desc = {
		type : 'sdp',
		data : self.conn.localDescription,
	};
	self.log( 'sendDescription', desc );
	self.signal.send( desc );
}

Session.prototype.sdpReceived = function( sdp ) {
	var self = this;
	self.log( 'sdpReceived', sdp );
	if ( sdp.type === 'offer' ) {
		self.handleRemoteOffer( sdp );
		return;
	}
	
	if (( sdp.type === 'answer' ) || ( sdp.type === 'pranswer' )) {
		self.handleRemoteAnswer( sdp );
		return;
	}
	
	self.log( 'unhandled sdp type', sdp );
}

Session.prototype.handleRemoteOffer = function( sdp ) {
	var self = this;
	self.logSDP( sdp, 'remote offer' );
	
	if (
		!(( self.conn.signalingState === 'stable' )
		|| ( self.conn.signalingState === 'have-remote-offer' ))
	) {
		self.log( 'handleRemoteOffer - signaling not in a receptive state',
			{ t : sdp.type, s : self.conn.signalingState });
		return;
		
		// possibly do rollback here when ( if ) its supported by the browser
	}
	
	var remoteOffer = new window.RTCSessionDescription( sdp );
	self.conn.setRemoteDescription( remoteOffer )
		.then( createAnswer )
		.catch( err );
		
	function createAnswer() {
		self.log( 'remote offer set', remoteOffer );
		if ( self.negotiationTimeout ) {
			self.log( 'clear neg timeout' );
			window.clearTimeout( self.negotiationTimeout );
			self.negotiationTimeout = null;
		}
			
		self.createAnswer();
	}
	
	function err( e ) {
		self.log( 'remoteOffer err', e );
	}
}

Session.prototype.handleRemoteAnswer = function( sdp ) {
	var self = this;
	var state = self.conn.signalingState;
	self.logSDP( sdp, 'remote answer' );
	if (
		!(( state === 'have-local-offer' )
		|| ( state === 'have-remote-pranswer'))
	) {
		self.log( 'handleRemoteAnswer - signaling not in a receptive state',
			{ t : sdp.type, s : self.conn.signalingState });
		return;
		
		// possibly do rollback here when its supported by the browser
	}
	
	self.inOfferProcess = false;
	var remoteAnswer = new window.RTCSessionDescription( sdp );
	self.conn.setRemoteDescription( remoteAnswer )
		.then( yep )
		.catch( nope );
		
	function yep( res ) {
		self.log( 'handleRemoteAnswer - remote answer set', res );
		if ( self.doInit )
			self.denyNegotiation = false;
	}
	
	function nope( err ) {
		self.log( 'error setting remote SDP answer: ', err );
		var errTest = 'DOMException: Failed to set remote answer sdp:'
		+ ' Failed to push down transport description:'
		+ ' Failed to set ssl role for the channel.';
		
		if ( err ) {
			sdp = self.toggleSDPActivePassive( sdp );
			self.handleRemoteAnswer( sdp );
		}
	}
}

Session.prototype.rollbackSignalingState = function() {
	var self = this;
	var opt = {
		type : 'rollback',
		sdp : null,
	};
	
	var rollback = new window.RTCSessionDescription();
	rollback.type = 'rollback';
	self.conn.setLocalDescription( rollback )
		.then( goodie )
		.catch( oopsie );
	
	function goodie() {
		console.log( 'rollback done' );
	}
	
	function oopsie( err ) {
		console.log( 'trollback failed', err );
	}
}

Session.prototype.createAnswer = function() {
	var self = this;
	self.log( 'createAnwer' );
	self.conn.createAnswer()
		.then( success )
		.catch( err );
		
	function success( reply ) {
		self.log( 'answer created', reply );
		var sdp = self.modifySDP( reply );
		self.setLocalDescription( sdp );
	}
	
	function err(  e ) {
		self.log( 'create answer err', e );
	}
}

Session.prototype.iceCandidateReceived = function( candidate ) {
	var self = this;
	self.log( 'iceCandidateReceived', candidate );
	if ( !candidate ) {
		self.log( 'iceCandidateReceived - null candidate\
		 - other side is done sending', candidate );
		return;
	}
	var ICECandidate = new window.RTCIceCandidate( candidate );
	self.conn.addIceCandidate( ICECandidate )
		.then( iceCandidateAdded )
		.catch( addIceCandidateErr );
	
	function iceCandidateAdded() {
		//self.log( 'iceCandidateAdded' );
	}
	
	function addIceCandidateErr( err ) {
		self.log( 'add ice candidate err', err );
	}
}

Session.prototype.handleNegotiate = function( data ) {
	var self = this;
	self.log( 'handleNegotiate', data );
	if ( data === 'request' ) {
		self.answerNegotiation();
		return;
	}
	
	if ( data === 'accept' ) {
		self.negotiationAccepted();
		return;
	}
	
	if ( data === 'deny' ) {
		self.negotiationDenied();
		return;
	}
	
	self.log( 'unknown negotiation event', data );
}

Session.prototype.answerNegotiation = function() {
	var self = this;
	if ( allowNegotiation() )
		accept();
	else
		deny();
	
	function accept() {
		self.log( 'accept client negotiation', {
			timeout : self.negotiationTimeout,
			timer : self.negotiationTimer
		});
		
		self.setState( 'client-negotiation' );
		self.negotiationTimeout = window.setTimeout( clear, self.negotiationTimer );
		send( 'accept' );
		function clear() {
			self.negotiationTimeout = null;
			self.log( 'negotiation timeout cleared', self.negotiationTimeout );
			self.setState();
		}
	}
	
	function deny() {
		self.log( 'deny client negotiation' );
		send( 'deny');
	}
	
	function send( answer ) {
		var res = {
			type : 'negotiate',
			data : answer,
		};
		self.signal.send( res );
	}
	
	function allowNegotiation() {
		self.log( 'allowNegotiation', {
			state : self.conn.signalingState,
			timeout : self.negotiationTimeout,
			deny : self.denyNegotiation,
			timer : self.negotiationTimer,
		});
		return (( self.conn.signalingState === 'stable' ) &&
			!self.negotiationTimeout &&
			!self.denyNegotiation );
	}
}

Session.prototype.dataChannelAdded = function( e ) {
	var self = this;
	self.log( 'datachannel event', e );
	var channel = e.channel;
	if ( 'ping' === channel.label ) {
		self.log( 'dataChannelAdded - ping' );
		self.bindPingChannel( channel, pingChannelOpen );
	}
	
	function pingChannelOpen() { self.startPing(); }
}

Session.prototype.openPingChannel = function() {
	var self = this;
	var chan = self.createDataChannel( 'ping' );
	self.bindPingChannel( chan, onOpen );
	function onOpen() {
		self.startPing();
	}
}

Session.prototype.startPing = function() {
	var self = this;
	self.pingInterval = window.setInterval( sendPing, self.pingStep );
	function sendPing() {
		self.sendPing();
	}
}

Session.prototype.sendPing = function( type, timestamp ) {
	var self = this;
	if ( !self.pingChannel || 'open' !== self.pingChannel.readyState ) {
		self.log( 'ping is closed' );
		self.setState( 'ping', null );
		self.stopPing();
		return;
	}
	
	type = type || 'ping';
	timestamp = timestamp || Date.now();
	var ping = {
		type : type,
		data : timestamp,
	};
	var pingStr = friendUP.tool.stringify( ping );
	self.pingChannel.send( pingStr );
}

Session.prototype.stopPing = function() {
	var self = this;
	if ( !self.pingInterval )
		return;
	
	window.clearInterval( self.pingInterval );
	self.pingInterval = null;
}

Session.prototype.handlePong = function( then ) {
	var self = this;
	if (( 0 === then ) || ( null === then )) {
		emit( then );
		return;
	}
	
	var now = Date.now();
	var ping = now - then;
	self.updatePingAverage( ping );
	emit( ping );
	
	function emit( ping ) { self.setState( 'ping', ping ); }
}

Session.prototype.updatePingAverage = function( ping ) {
	var self = this;
	ping = parseInt( ping );
	if ( window.isNaN( ping ))
		return;
	
	self.pingsIndex++;
	if ( self.pingsMax < ( self.pingsIndex + 1 ))
		self.pingsIndex = 0;
	
	self.pings[ self.pingsIndex ] = ping;
	var total = self.pings.reduce( add );
	var plen = self.pings.length;
	var avg = total / plen;
	var averagePing = Math.ceil( avg );
	var negTimer = 100 + ( averagePing * 5 );
	self.negotiationTimer = negTimer;
	
	function add( a, b ) {
		return a + b;
	}
}

Session.prototype.bindPingChannel = function( chan, onOpen ) {
	var self = this;
	if ( self.pingChannel )
		throw new Error( 'ping channel already bound' );
	
	chan.onopen = open;
	chan.onerror = err;
	chan.onclose = close;
	chan.onmessage = message;
	
	self.pingChannel = chan;
	
	function open( e ) {
		self.log( 'ping channel is open', e );
		if ( onOpen )
			onOpen();
	}
	
	function err( e ) {
		self.log( 'ping channel err', e );
		self.releasePingChannel();
	}
	
	function close( e ) {
		self.log( 'ping channel closed', e );
		self.releasePingChannel();
	}
	
	function message( e ) {
		var msg = friendUP.tool.objectify( e.data );
		if ( 'ping' === msg.type )
			handlePing( msg.data );
		else
			self.handlePong( msg.data );
		
		function handlePing( timestamp ) {
			self.sendPing( 'pong', timestamp );
		}
	}
}

Session.prototype.releasePingChannel = function() {
	var self = this;
	self.log( 'releasePingChannel' );
	if ( !self.pingChannel )
		return;
	
	delete self.channels[ 'ping' ];
	
	var chan = self.pingChannel;
	self.pingChannel = null;
	chan.onopen = null;
	chan.onerror = null;
	chan.onclose = null;
	chan.onmessage = null;
	
	if ( 'open' === chan.readyState )
		chan.close();
}

Session.prototype.signalStateChange = function( e ) {
	var self = this;
	if ( 'stable' !== self.conn.signalingState )
		return;
	
	if ( self.negotiationWaiting )
		self.tryNegotiation();
	else
		self.setState();
}

Session.prototype.getState = function() {
	var self = this;
	var iceConn = nominalize( self.conn.iceConnectionState, 'ICE' );
	var iceGather = nominalize( self.conn.iceGatheringState, 'ICE' );
	var signal = nominalize( self.conn.signalingState, 'conn' );
	
	self.log( 'getState', {
		iceConn : self.conn.iceConnectionState,
		iceGather : self.conn.iceGatheringState,
		signal : self.conn.signalingState,
	});
	
	if ( 'nominal' !== iceConn )
		return iceConn;
	
	if ( 'nominal' !== iceGather )
		return iceGather;
	
	return signal;
	
	function nominalize( state, prefix ) {
		if (( 'stable' === state )
			|| ( 'connected' === state )
			|| ( 'complete' === state )
			|| ( 'completed' === state )
		) return 'nominal';
		
		if ( prefix )
			return prefix + '-' + state;
		
		return state;
	}
}

Session.prototype.setState = function( state, data ) {
	var self = this;
	if ( !self.conn )
		state = 'closed';
	
	if ( !state )
		state = self.getState();
	
	var type = self.stateTypeMap[ state ];
	if ( !type ) {
		self.log( 'setState - no type found for', { s : state, valid : self.stateTypeMap });
		type = 'waiting';
	}
	
	data = data || null;
	var stateEvent = {
		type : type,
		data : {
			state : state,
			data : data,
		},
	};
	
	self.emit( 'state', stateEvent );
}

Session.prototype.close = function() {
	var self = this;
	self.log( '(rtc)session.close' );
	
	self.stopPing();
	self.setState( 'closed' );
	self.release(); // event listeners
	closeRTC();
	closeSignal();
	
	delete self.modifySDP;
	delete self.rtc;
	delete self.type;
	delete self.doInit;
	
	function closeRTC() {
		if ( !self.conn )
			return;
		
		if ( 'closed' !== self.conn.signalingState )
			self.conn.close();
		
		self.clearConn();
		delete self.conn;
	}
	
	function closeSignal() {
		if ( self.signal )
			self.signal.close();
		
		delete self.signal;
	}
}

Session.prototype.clearConn = function() {
	var self = this;
	if ( !self.conn )
		return;
	
	self.conn.onconnectionstatechange = null;
	self.conn.onaddstream = null;
	self.conn.ontrack = null;
	self.conn.ondatachannel = null;
	self.conn.onicecandidate = null;
	self.conn.oniceconnectionstatechange = null;
	self.conn.onicegatheringstatechange = null;
	self.conn.identityresult = null;
	self.conn.onidpassertionerror = null;
	self.conn.onidpvalidationerror = null;
	self.conn.onnegotiationneeded = null;
	self.conn.onpeeridentity = null;
	self.conn.onremovestream = null;
	self.conn.onsignalingstatechange = null;
}

Session.prototype.log = function( string, value ) {
	var self = this;
	if ( !self.spam )
		return;
	
	if ( self.doInit )
		string = 'rtc.host : ' + string;
	else
		string = 'rtc.client : ' + string;
	
	var time = new window.Date();
	var sec = time.getSeconds();
	var ms = time.getMilliseconds();
	sec = pad( sec, 2 );
	ms = pad( ms, 3 );
	string = ':' + sec + '.' + ms + ' ' + string;
	console.log( string, value );
	
	function pad( str, len ) {
		str = str.toString();
		len = len || 2;
		var pd = 3 - str.length;
		if ( !pd )
			return str;
		
		var arr = new Array( pd );
		arr.push( str );
		return arr.join( '0' );
	}
}

Session.prototype.err = function( source, e ) {
	var self = this;
	console.log( source, {
		error : e,
		host : self.doInit.toString(),
	});
}

// Initchecks
P2PChecks = function( ondone ) {
	if ( !( this instanceof P2PChecks ))
		return new P2PChecks( ondone );
	
	var self = this;
	self.ondone = ondone;
	
	self.hasError = false;
	self.canContinue = true;
	self.checksDone = null;
	self.isDone = false;
	
	self.init();
}

// Public

P2PChecks.prototype.close = function() {
	var self = this;
	self.isDone = true;
	delete self.ondone;
}

P2PChecks.prototype.checkBrowser = function( callback ) {
	var self = this;
	new library.rtc.BrowserCheck( checkBack );
	function checkBack( res ) {
		self.ui.updateBrowserCheck( res );
		checkErrors( res );
		self.setCheckDone( 'browser' );
		
		function checkErrors( res ) {
			var bErr = res.support.type;
			var success = true;
			var isCrit = false;
			
			// check browser
			if ( 'success' !== bErr ) {
				success = false;
				isCrit = 'error' === bErr;
			}
			
			// check capabilities
			var capKeys = Object.keys( res.capabilities );
			var hasCapErr = capKeys.some( failed );
			function failed( key ) { return !res.capabilities[ key ]; }
			if ( hasCapErr ) {
				success = false;
				isCrit = true;
			}
			
			// report back
			if ( !success )
				self.setHasError( isCrit );
			
			callback( !isCrit );
		}
	}
}


// dont use
P2PChecks.prototype.checkSignal = function( conn, type ) {
	var self = this;
	if ( 'host' === type )
		self.ui.showHostSignal();
	
	var type = type + '-signal';
	self.startingCheck( type );
	var uptd = {
		desc : conn.url,
	};
	updateUi( uptd );
	var localState = {
		open : conn.onopen,
		close : conn.onclose,
	};
	conn.onopen = onopen;
	conn.onclose = onclose;
	localState.checkTimeout = window.setTimeout( resultTimeout, 20000 );
	
	function onopen() {
		restoreHandlers();
		cancelResultTimeout();
		if ( self.isDone )
			return;
		
		var success = {
			type : 'success',
			message : '',
		};
		updateUi( success );
		self.setCheckDone( type );
		conn.onopen.apply( this, arguments );
	}
	
	function onclose( errMsg ) {
		errMsg = errMsg || 'connection error';
		restoreHandlers();
		cancelResultTimeout();
		if ( self.isDone )
			return;
		
		var err = {
			type : 'error',
			message : errMsg,
		}
		updateUi( err );
		self.setHasError( true );
		self.setCheckDone( type );
		conn.onclose.apply( this, arguments );
	}
	
	function resultTimeout() {
		localState.checkTimeout = null;
		conn.close();
		onclose( 'connection timeout' );
	}
	
	function cancelResultTimeout() {
		if ( !localState.checkTimeout ) {
			console.log( 'no localState.checkTimeout?????', localState );
			return;
		}
		
		window.clearTimeout( localState.checkTimeout );
		localState.checkTimeout = null;
	}
	
	function restoreHandlers() {
		if ( !localState.open )
			return;
		
		conn.onopen = localState.open;
		conn.onclose = localState.close;
		
		delete localState.open;
		delete localState.close;
	}
	
	function updateUi( uptd ) {
		if ( 'host-signal' === type )
			self.ui.updateHostSignal(  uptd );
		if ( 'room-signal' === type )
			self.ui.updateRoomSignal( uptd );
	}
}

P2PChecks.prototype.checkICE = function( conf, callback ) {
	var self = this;
	var results = {
		ok       : true,
		error    : '',
		canRelay : false,
		servers  : [],
	};
	
	var turnPass = false;
	self.startingCheck( 'ice-servers' );
	new library.rtc.ICECheck( conf, stepBack, doneBack );
	
	function stepBack( result ) {
		if ( self.isDone )
			return;
		
		if ( result.err )
			results.ok = false;
		
		var canRealy = checkHasRelay( result.types );
		if ( canRealy && !result.err  ) {
			results.canRelay = true;
			turnPass = true;
		}
		
		var res = {
			ok      : !result.err,
			error   : result.err || '',
			server  : result.server,
			types   : result.types,
		};
		
		results.servers.push( res );
		
		function checkHasRelay( types ) {
			types.some( isRelay );
			function isRelay( type ) {
				return 'relay' === type;
			}
		}
	}
	
	function doneBack() {
		if ( callback )
			callback( results );
		
		self.setCheckDone( 'ice-servers', results );
	}
}

// Private

P2PChecks.prototype.init = function() {
	var self = this;
	self.checksDone = {
		'ice-servers'  : null,
	};
}

P2PChecks.prototype.setHasError = function() {
	var self = this;
	self.hasError = true;
}

P2PChecks.prototype.startingCheck = function( id ) {
	var self = this;
	self.checksDone[ id ] = false;
}

P2PChecks.prototype.setCheckDone = function( id, result ) {
	var self = this;
	self.checksDone[ id ] = result;
	if ( !isDone() )
		return;
	
	self.done();
	
	function isDone() {
		var ids = Object.keys( self.checksDone );
		return ids.every( done );
		
		function done( id ) {
			return !!self.checksDone[ id ];
		}
	}
}

P2PChecks.prototype.done = function() {
	var self = this;
	if ( self.isDone )
		return;
	
	self.isDone = true;
	var ondone = self.ondone;
	delete self.ondone;
	ondone( self.checksDone );
}


//
// ICECheck
ICECheck = function( conf, stepBack, doneBack ) {
	if ( !( this instanceof ICECheck ))
		return new ICECheck( conf );
	
	var self = this;
	self.conf = conf;
	self.stepBack = stepBack;
	self.doneBack = doneBack;
	
	self.timeoutMS = 1000 * 20; // 20 sec
	
	self.init();
}

ICECheck.prototype.init = function() {
	var self = this;
	self.checks = 0;
	self.conf.forEach( check );
	
	function check( server ) {
		self.checkServer( server, checkBack );
		function checkBack( res ) {
			if ( res.ret )
				return;
			
			self.checks++;
			var err = res.err;
			var ret = {
				err    : err || null,
				types  : res.types,
				server : server,
			};
			self.stepBack( ret );
			
			checkDone();
		}
	}
	
	function checkDone() {
		console.log( 'checkDone', { c : self.checks, l : self.conf.length })
		if ( self.checks === self.conf.length )
			self.done();
	}
}

ICECheck.prototype.checkServer = function( server, checkBack ) {
	var self = this;
	var conf = {
		iceServers : [ server ],
	};
	
	new window.Promise( checkTheICE )
		.then( result )
		.catch( result );
	
	function checkTheICE( resolve, reject ) {
		var returned = false;
		var result = {
			err   : '',
			types : [],
		};
		
		var timeout = window.setTimeout( checkTimedOut, self.timeoutMS );
		var test = new window.RTCPeerConnection( conf );
		test.onicecandidate = onICE;
		test.createDataChannel( 'test' );
		test.createOffer()
			.then( offerCreated )
			.catch( offerFailed );
		
		function offerCreated( offer ) {
			test.setLocalDescription( offer );
		}
		
		function offerFailed( err ) {
			error( 'offer failed' );
		}
		
		function onICE( e ) {
			if ( !e.candidate || !e.candidate.candidate )
				return;
			
			var sdp = e.candidate.candidate;
			var typs = sdp.match( /typ\s[a-z]+\s/gi );
			if ( typs )
				console.log( 'ICE-check - typs', {
					s : server.urls[ 0 ],
					t : typs[ 0 ] });
			
			// fail on 'typ host'
			if ( -1 !== sdp.indexOf( 'typ host' ))
				return;
			
			success();
		}
		
		function checkTimedOut() {
			error( 'timeout' );
		}
		
		function success() {
			var res = {
				ret : returned,
				err : null,
			};
			resolve( res );
			clear();
		}
		
		function error( err ) {
			var res = {
				ret : returned,
				err : err,
			};
			reject( res );
			clear();
		}
		
		function clear() {
			returned = true;
			try {
				test.close();
			} catch( e ) {
				console.log( 'test.close exep, but we dont really care, lol', e );
			}
			if ( timeout )
				window.clearTimeout( timeout );
			timeout = null;
		}
	}
	
	function result( res ) { checkBack( res ); }
	//function pass( res ) { checkBack( res ); }
	//function fail( res ) { checkBack( res ); }
}

ICECheck.prototype.done = function() {
	var self = this;
	var doneBack = self.doneBack;
	delete self.conf;
	delete self.stepBack;
	delete self.doneBack;
	doneBack();
}


//
// Browser check
BrowserCheck = function( onResult ) {
	if ( !( this instanceof BrowserCheck ))
		return new BrowserCheck();
	
	var self = this;
	self.onresult = onResult;
	self.browser = null;
	self.version = null;
	self.isMobile = false;
	self.isVR = false;
	self.is = {};
	self.capabilities = {
		webRTC   : null,
		audioAPI : null,
	};
	self.init();
}

// Public

// Private

BrowserCheck.prototype.supportMap = {
	'ie'      : 'error',
	'edge'    : 'error',
	'opera'   : 'warning',
	'safari'  : 'error',
	'firefox' : 'warning',
	'chrome'  : 'success',
	'blink'   : 'success',
	'samsung' : 'success',
	'android' : 'warning',
}

BrowserCheck.prototype.supportString = {
	'error'   : 'unsupported',
	'warning' : 'experimental support',
	'success' : 'full support',
}

BrowserCheck.prototype.init = function() {
	var self = this;
	self.checkMobile();
	if ( self.isMobile )
		self.mangleMobile();
	else
		self.identifyDesktopBrowser();
	
	self.checkVR();
	self.checkCapabilities();
	self.done();
}

BrowserCheck.prototype.mangleMobile = function() {
	var self = this;
	var uaId = self.getApprovedUAId();
	if ( uaId )
		self.is[ uaId ] = true;
	else
		self.is[ self.isMobile ] = true;
}

BrowserCheck.prototype.identifyDesktopBrowser = function() {
	var self = this;
	var is = self.is || {};
	is[ 'ie' ] = !!document.documentMode; // old ie
	is[ 'edge' ] = !is[ 'ie ' ] && !!window.StyleMedia; // new ie. They both fail, lol
	is[ 'opera' ] = ( !!window.opr && !!window.opr.addons )
		|| window.opera
		|| navigator.userAgent.indexOf( ' OPR/' ) >= 0;
	is[ 'safari' ] = Object.prototype.toString.call( window.HTMLElement )
		.indexOf( 'Constructor' ) > 0;
	is[ 'firefox' ] = !!window.InstallTrigger;
	is[ 'chrome' ] = !!window.chrome && !!window.chrome.webstore;
	is[ 'blink' ] = ( is[ 'chrome' ] || is[ 'opera' ] ) && !!window.CSS;
	if ( is[ 'blink' ]) {
		is[ 'chrome' ] = false;
		is[ 'opera' ] = false;
	}
	
	self.is = is;
}

BrowserCheck.prototype.checkCapabilities = function() {
	var self = this;
	var cap = {};
	cap[ 'webAudio' ] = !!window.AudioContext;
	cap[ 'webRTC' ] = !!window.RTCPeerConnection;
	cap[ 'mediaDevices' ] = !!window.navigator.mediaDevices;
	if ( cap[ 'mediaDevices' ]) {
		cap[ 'getUserMedia' ] = !!window.navigator.mediaDevices.getUserMedia;
		cap[ 'enumerateDevices' ] = !!window.navigator.mediaDevices.enumerateDevices;
	}
	
	self.cap = cap;
}

BrowserCheck.prototype.checkMobile = function() {
	var self = this;
	var tokens = [
		'Android',
		'webOS',
		'iPhone',
		'iPad',
		'iPod',
		'BlackBerry',
		'IEMobile',
		'Opera Mini',
		'Mobile',
		'mobile',
		'CriOS',
	];
	var rxStr = tokens.join( '|' );
	var rx = new RegExp( rxStr, '' );
	var match = navigator.userAgent.match( rx );
	if ( match )
		self.isMobile = match[ 0 ];
}

BrowserCheck.prototype.getApprovedUAId = function() {
	var self = this;
	var tokens = [
		'Chrome',
		'Samsung',
	];
	var rxStr = tokens.join( '|' );
	var rx = new RegExp( rxStr, 'i' );
	var match = navigator.userAgent.match( rx );
	if ( match )
		return match[ 0 ];
	
	return '';
}

BrowserCheck.prototype.checkVR = function() {
	var self = this;
	var match = navigator.userAgent.match( /VR/ );
	if ( match )
		self.isVR = true;
}

BrowserCheck.prototype.done = function() {
	var self = this;
	var browser = getBrowser();
	var supType = 'unknown' === browser
		? 'error'
		: ( self.supportMap[ browser.toLowerCase() ] || 'error' );
	if ( self.isMobile ) {
		browser += ' ' + self.isMobile;
	}
	
	if ( self.isVR ) {
		browser += ' VR';
		if ( 'success' === supType )
			supType = 'warning';
	}
	
	var supString = self.supportString[ supType ];
	var support = {
		type  : supType,
		message : supString,
	};
	
	var res = {
		browser      : browser,
		support      : support,
		capabilities : self.cap,
	};
	var onresult = self.onresult;
	delete self.onresult;
	onresult( res );
	
	function getBrowser() {
		for ( var browser in self.is )
			if ( !!self.is[ browser ])
				return browser;
			
		return 'unknown';
	}
}

BrowserCheck.prototype.close = function() {
	var self = this;
	delete self.onresult;
}
