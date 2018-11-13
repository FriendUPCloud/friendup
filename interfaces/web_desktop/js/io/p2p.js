/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
requires EventEmitter and EventNode from /webclient/js/util/events.js
requires /webclient/3rdparty/adapter.js
uses .stringify and .objectify from webclient/js/util/tool.js
*/

var friendUP = window.friendUP || {};

/* PEER - representation of a P2P connection. EventEmitter
	conf    : obj {
		id      : string, signalId.
		rtcConf : obj, Ice servers
	}
	appConn : EventNode representing a path through FriendNetwork
	onend   : called when the connection closes and cant be reestablished
	
	
	interface:
	
	send( event ) - send an event to the other Peer
	

*/

Peer = function( conf, appConn, eventSink, onend )
{
	if ( !( this instanceof Peer ))
		return new Peer( conf, appConn, onend );
	console.log( 'Peer', {
		conf    : conf,
		appConn : appConn,
		onend   : onend,
	});
	
	EventEmitter.call( this, eventSink );
	
	var self = this;
	self.id = conf.signalId;
	self.rtcConf = conf.rtc;
	self.onend = onend;
	
	self.signal = null;
	self.conn = null;
	self.metaInterval = null;
	self.syncInterval = null;
	self.syncStamp = null;
	self.doInit = null;
	
	self.pingInterval = null;
	self.pingStep = 1000 * 3;
	self.pingTimeout = 1000 * 10;
	self.pingTimeouts = {};
	self.pongs = [];
	
	self.sendQueue = [];
	
	self.init( appConn );
}

Peer.prototype = Object.create( EventEmitter.prototype );

// Public

/* send
 event : object, { type : <string>, data : <obj> }
 
 the remote peer object will emit an event of type event.type,
 passing event.data to the listener
*/
Peer.prototype.send = function( event ) {
	var self = this;
	if ( !self.conn || !self.conn.isOpen ) {
		self.sendQueue.push( event );
		return;
	}
	
	//console.log( 'Peer.send event', event );
	var msg = {
		type : 'msg',
		data : event
	}
	self.conn.send( msg );
}

Peer.prototype.reconnect = function() {
	var self = this;
	console.log( 'Peer.reconnect - NYI' );
}

Peer.prototype.close = function() {
	var self = this;
	console.log( 'Peer.close' );
	delete self.onend;
	self.closePeer();
}

// Private

Peer.prototype.init = function( parentSignal ) {
	var self = this;
	
	// websocket / signal server path
	self.signal = new EventNode(
		self.id,
		parentSignal,
		eventSink
	);
	
	function eventSink( type, event ) {
		console.log( 'Peer.eventsink', {
			t : type,
			e : event,
		});
	}
	
	self.signal.on( 'sync'         , sync );
	self.signal.on( 'sync-accept'  , syncAccept );
	self.signal.on( 'conn-ready'  , connReady );
	
	function sync( e ) { self.handleSync( e ); }
	function syncAccept( e ) { self.handleSyncAccept( e ); }
	function connReady( e ) { self.handleConnReady( e ); }
	
	self.startSync();
}

// peer sync

Peer.prototype.startSync = function() {
	var self = this;
	var now = self.syncStamp || Date.now();
	console.log( 'start sync', {
		now    : now,
		doInit : self.doInit
	});
	if ( null !== self.doInit )
		return;
	
	self.syncStamp = now;
	var sync = {
		type : 'sync',
		data : now,
	};
	
	self.signal.send( sync );
	self.syncInterval = setInterval( sendSync, 2000 );
	function sendSync() {
		if ( !self.syncInterval )
			return;
		
		//console.log( 'sending sync', sync.data );
		self.signal.send( sync );
	}
}

Peer.prototype.handleSync = function( remoteStamp ) {
	var self = this;
	console.log( 'handleSync', {
		remote : remoteStamp,
		doInit : self.doInit,
	});
	// sync has already been set, ignore
	if ( null != self.doInit )
		return;
	
	// invalid remote stamp, drop
	if ( null == remoteStamp ) {
		console.log( 'nullstamp, wut?', remoteStamp );
		return;
	}
	
	// same stamp, reroll
	if ( self.syncStamp === remoteStamp ) {
		self.stopSync();
		var delay = ( Math.floor( Math.random() * 20 ) + 1 ); // we dont want a 0ms delay
		console.log( 'handleSync - equal, reroll', delay );
		setTimeout( restart, delay );
		function restart() {
			self.startSync();
		}
		
		return;
	}
	
	self.acceptSync( remoteStamp );
}

Peer.prototype.acceptSync = function( remoteStamp ) {
	var self = this;
	console.log( 'acceptSync', {
		local  : self.syncStamp,
		remote : remoteStamp,
		doInit : self.doInit,
	});
	
	if ( null == self.syncStamp )
		self.syncStamp = Date.now();
	
	var accept = {
		type : 'sync-accept',
		data : [
			self.syncStamp,
			remoteStamp,
		],
	};
	self.signal.send( accept );
	
	if ( null == self.doInit )
		self.setDoInit( self.syncStamp, remoteStamp );
}

Peer.prototype.handleSyncAccept = function( stamps ) {
	var self = this;
	console.log( 'syncAccept',{
		s : stamps,
		t : self.syncStamp,
	});
	if ( !self.syncStamp )
		return;
	
	var remote = ( stamps[0] === self.syncStamp ) ? stamps[ 1 ] : stamps[ 0 ];
	self.setDoInit( self.syncStamp, remote );
}

Peer.prototype.stopSync = function() {
	var self = this;
	console.log( 'stopSync', self.syncInterval );
	self.syncStamp = null;
	if ( null == self.syncInterval )
		return;
	
	clearInterval( self.syncInterval );
	self.syncInterval = null;
}

Peer.prototype.setDoInit = function( localStamp, remoteStamp ) {
	var self = this;
	console.log( 'sync - setDoInit', {
		l : localStamp,
		r : remoteStamp,
	});
	
	if ( localStamp < remoteStamp )
		self.doInit = true;
	else
		self.doInit = false;
	
	self.stopSync();
	self.setupSession();
}

Peer.prototype.setupSession = function() {
	var self = this;
	console.log( 'setupSession', self );
	self.session = new Session(
		'primary',
		self.rtcConf,
		self.doInit,
		self.signal
	);
	
	self.session.on( 'state', stateChange );
	self.session.on( 'error', error );
	if ( !self.doInit ) {
		var chan = self.session.openChannel( 'conn' );
		self.bindConn( chan );
	} else
		self.session.once( 'datachannel', conn );
	
	function stateChange( e ) { console.log( 'peer session state change', e ); }
	function error( e ) { console.log( 'peer session error', e ); }
	function conn( e ) { self.bindConn( e ); }
	
	/*
	if ( self.doInit )
	{
		if ( self.remoteConnReady )
			self.startConn();
	}
	else
	{
		self.signal.send(
		{
			type: 'conn-ready',
			data: true
		});
	}
	*/
}

Peer.prototype.handleConnReady = function( isReady ) {
	var self = this;
	console.log( 'handleConnReady', isReady );
	if ( self.session )
		self.startConn();
	else
		self.remoteConnReady = isReady;
}

Peer.prototype.bindConn = function( conn ) {
	var self = this;
	console.log( 'bindConn', conn );
	self.conn = new DataChannel( 'conn', conn, connSink );
	self.conn.once( 'open', dataOpen );
	function connSink( type, data ) {
		console.log( 'connSink', {
			t : type,
			d : data,
		});
	}
	
	function dataOpen( time ) {
		console.log( 'dataOpen', time );
		self.startPing();
		self.executeSendQueue();
	}
	
	self.conn.on( 'msg'         , msg );
	self.conn.on( 'recycle'     , recycle );
	self.conn.on( 'reconnect'   , reconnect );
	self.conn.on( 'start'       , start );
	self.conn.on( 'stop'        , stop );
	self.conn.on( 'close'       , closed );
	self.conn.on( 'ping'        , ping );
	self.conn.on( 'pong'        , pong );
	
	function msg( e ) { self.handleMsg( e ); }
	function recycle( e ) { self.handleRecycle( e ); }
	function reconnect( e ) { self.handleReconnect( e ); }
	function start( e ) { self.handleStart(); }
	function stop( e ) { self.handleStop( e ); }
	function closed( e ) { self.closeCmd(); }
	function ping( e ) { self.handlePing( e ); }
	function pong( e ) { self.handlePong( e ); }
}

Peer.prototype.handleMsg = function( event ) {
	var self = this;
	//console.log( 'Peer.handleMsg', event );
	self.emit( event.type, event.data );
}

Peer.prototype.executeSendQueue = function() {
	var self = this;
	//console.log( 'execute send queue', self.sendQueue );
	self.sendQueue.forEach( send );
	function send( event ) {
		self.send( event );
	}
}

Peer.prototype.startPing = function() {
	var self = this;
	if ( self.pingInterval )
		self.stopPing();
	
	self.pingInterval = setInterval( sendPing, self.pingStep );
	function sendPing() {
		if ( null == self.pingInterval )
			return;
		
		self.sendPing();
	}
}

Peer.prototype.sendPing = function() {
	var self = this;
	var stamp = Date.now();
	var ping = {
		type : 'ping',
		data : stamp,
	};
	
	self.conn.send( ping );
	self.pingTimeouts[ stamp ] = setTimeout( timeout, self.pingTimeout );
	function timeout() {
		var timer = self.pingTimeouts[ stamp ];
		if ( null == timer )
			return;
		
		delete self.pingTimeouts[ stamp ];
		self.setConnectionTimeout();
	}
}

Peer.prototype.handlePing = function( stamp ) {
	var self = this;
	var pong = {
		type : 'pong',
		data : stamp,
	};
	self.conn.send( pong );
}

Peer.prototype.handlePong = function( stamp ) {
	var self = this;
	var now = Date.now();
	var timer = self.pingTimeouts[ stamp ];
	if ( null == timer )
		return; // it has already timed out
	
	clearTimeout( timer );
	delete self.pingTimeouts[ stamp ];
	
	stamp = parseInt( stamp, 10 );
	var pingTime = now - stamp;
	//console.log( 'handlePong - pingTime', pingTime );
	//self.emit( 'ping', pingTime );
}

Peer.prototype.stopPing = function( ) {
	var self = this;
	console.log( 'alpha.stopPing' );
	if ( self.pingInterval )
		clearInterval( self.pingInterval );
	
	self.pingInterval = null;
	
	if ( null == self.pingTimeouts )
		return;
	
	var timeouts = Object.keys( self.pingTimeouts );
	timeouts.forEach( clear );
	self.pingTimeouts = {};
	function clear( stamp ) {
		if ( !stamp )
			return;
		
		var timer = self.pingTimeouts[ stamp ];
		delete self.pingTimeouts[ timer ];
		clearTimeout( timer );
	}
}

Peer.prototype.setConnectionTimeout = function() {
	var self = this;
	//console.log( 'setConnectionTimeout' );
}

Peer.prototype.handleReconnect = function( sid ) {
	var self = this;
	console.log( 'Peer.handleReconnect', sid );
	self.showSelfie( null, sid );
}

Peer.prototype.handleRecycle = function( sid ) {
	var self = this;
	console.log( 'Peer.handleRecycle', self.doInit );
	self.closeSession( sid );
	self.createSession( sid );
	if ( self.doInit )
		self.showSelfie( null, sid );
	else
		sendReconnect( sid );
	
	function sendReconnect( sid ) {
		var msg = {
			type : 'reconnect',
			data : sid,
		};
		self.send( msg );
	}
}

Peer.prototype.recycleSession = function( sid ) {
	var self = this;
	console.log( 'Peer.recycleSession', sid );
	self.closeSession( sid );
	self.createSession( sid );
	var msg = {
		type : 'recycle',
		data : sid,
	};
	self.send( msg );
}

Peer.prototype.handleStart = function() {
	var self = this;
	console.log( 'Peer.handleStart' );
	
}

Peer.prototype.handleStop = function( sid ) {
	var self = this;
	console.log( 'Peer.handleStop', sid );
	self.closeAllSessions();
}

Peer.prototype.closeSession = function( sid ) {
	var self = this;
	console.log( 'Peer.closeSession', sid );
	var sess = self.sessions[ sid ];
	delete self.sessions[ sid ];
	sess.close();
}

Peer.prototype.handleSessionStateChange = function( event ) {
	var self = this;
	//console.log( 'rtc.handlseSessionStateChange', event );
	if ( 'error' === event.type )
		self.handleSessionError( event );
	
	self.emit( 'rtc-state', rtcState );
}

Peer.prototype.handleSessionError = function( event ) {
	var self = this;
	console.log( 'handleSessionError', event );
	
}

Peer.prototype.closePeer = function() {
	var self = this;
	console.log( 'Peer.close' );
	self.stopSync();
	self.stopPing();
	if ( self.metaInterval ) {
		window.clearInterval( self.metaInterval );
		self.metaInterval = null;
	}
	
	self.release(); // component.EventEmitter
	delete self.onremove;
	delete self.closeCmd;
	
	if ( self.signal )
		self.signal.close();
	if ( self.conn )
		self.conn.close();
	
	delete self.signal;
	delete self.conn;
	
	if ( self.session )
		self.session.close();
	
	delete self.session;
}


/* SESSION - sets up and maintains a webRTC.RTCPeerConnection. EventEmitter

	id : string, must be the samme for both sides of the p2p connection
	ICEconf : list of ICE servers, STUN and TURN
	doInit : bool, decides if this side will set up the connection or not.
		should match doInit in the peer.
		
	parentSignal : EventNode representing a path through the FriendNetwork.
		Used for inital setup and renegoatiation of connection

*/

Session = function( id, ICEconf, doInit, parentSignal ) {
	if( !( this instanceof Session ))
		return new Session( id, ICEconf, doInit, signal );
	
	EventEmitter.call( this );
	
	var self = this;
	self.id = id;
	self.doInit = doInit;
	self.rtc = ICEconf;
	
	// peer connection, holder of things
	self.signal = null;
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
	
	self.init( parentSignal );
}

Session.prototype = Object.create( EventEmitter.prototype );

// Public

Session.prototype.openChannel = function( label, opts ) {
	var self = this;
	console.log( 'openChannel', label );
	return self.createDataChannel( label, opts );
}

Session.prototype.closeChannel = function( label ) {
	var self = this;
	console.log( 'closeChannel', label );
	self.closeDataChannel( label );
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

Session.prototype.init = function( parentSignal ) {
	var self = this;
	self.signal = new EventNode(
		self.id,
		parentSignal,
		eventSink
	);
	self.signal.on( 'sdp', sdpReceived );
	self.signal.on( 'candidate', iceCandidateReceived );
	self.signal.on( 'negotiate', handleNegotiate );
	
	function sdpReceived( msg ) { self.sdpReceived( msg ); }
	function iceCandidateReceived( msg ) { self.iceCandidateReceived( msg ); }
	function handleNegotiate( msg ) { self.handleNegotiate( msg ); }
	
	function eventSink() { self.log( 'unhandled signal event', arguments ); }
	
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
		self.setLocalDescription( offer );
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
		self.setLocalDescription( reply );
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

Session.prototype.createDataChannel = function( label, opts ) {
	var self = this;
	if ( !label )
		throw new Error( 'rtc.createDataChannel - no label' );
	
	self.log( 'createDataChannel', label );
	var channel = self.conn.createDataChannel( label, opts );
	self.channels[ label ] = channel;
	return channel;
}

Session.prototype.closeDataChannel = function( label ) {
	var self = this;
	self.log( 'closeDataChannel', label );
	var channel = self.channels[ label ];
	if ( !channel )
		return;
	
	delete self.channels[ label ];
	channel.close();
}

Session.prototype.dataChannelAdded = function( e ) {
	var self = this;
	self.log( 'datachannelAdded', e );
	self.emit( 'datachannel', e.channel );
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

/* DataChannel - convenience wrapper for a webRTC.RTCDataChannel. EventEmitter.
	
	label     : string - name of channel, not used for anyting in particular atm
	conn      : rtc.DataChannel
	eventSink : fn, listener - receives unhandled events
	
	interface:
	
	send( event )
	
	close
	
*/
DataChannel = function( label, conn, eventSink ) {
	var self = this;
	self.label = label;
	self.conn = conn;
	EventEmitter.call( self, eventSink );
	
	self.isOpen = false;
	self.eventQueue = [];
	
	self.init();
}

DataChannel.prototype = Object.create( EventEmitter.prototype );

// Public

DataChannel.prototype.send = function( event ) {
	var self = this;
	var wrap = {
		type : 'event',
		data : event,
	};
	self.sendOnChannel( wrap );
}

DataChannel.prototype.close = function() {
	var self = this;
	try {
		self.conn.close();
	} catch( e ) { console.log( 'dataChannel.close exep', e ); }
	
	self.unbind();
	self.closeEventEmitter();
	delete self.conn;
}

// Private

DataChannel.prototype.init = function() {
	var self = this;
	self.conn.onopen = onOpen;
	self.conn.onerror = onError;
	self.conn.onmessage = onMessage;
	self.conn.onclose = onClose;
	
	function onOpen( e ) {
		console.log( 'DataChannel.onopen' );
		self.isOpen = true;
		self.eventQueue.forEach( send )
		self.emit( 'open', Date.now() );
		
		function send( event ) {
			self.sendOnChannel( event );
		}
	}
	function onError( e ) { console.log( 'datachannel.onError', e ); }
	function onMessage( e ) { self.handleMessage( e ); }
	function onClose( e ) {
		self.isOpen = false;
		self.emit( 'closed', self.conn );
	}
}

DataChannel.prototype.unbind = function() {
	var self = this;
	self.conn.onopen = null;
	self.conn.onerror = null;
	self.conn.onmessage = null;
	self.conn.onclose = null;
}

DataChannel.prototype.handleMessage = function( e ) {
	var self = this;
	//console.log( 'DataChannel.handleMessage', e );
	var event = friendUP.tool.objectify( e.data );
	if ( !event )
		return;
	
	var type = event.type;
	var data = event.data;
	if ( 'event' === type )
		self.emit( data.type, data.data );
	else
		console.log( 'unknown datachannel message', event );
}

DataChannel.prototype.sendOnChannel = function( event ) {
	var self = this;
	if ( !self.isOpen ){
		self.eventQueue.push( event );
		return;
	}
	
	if ( !self.conn )
		return; // closed
	
	if ( 'open' !== self.conn.readyState ) {
		self.eventQueue.push( event );
		return;
	}
	
	var str = friendUP.tool.stringify( event );
	try {
		self.conn.send( str );
	} catch ( e ) {
		console.log( 'DataChannel.send exp', {
			exp   : e,
			event : event,
			str   : str,
		});
	}
}

/* P2P - not useful yet :p
	Is intended as a wrapper to manage multiple peer connections

*/
P2P = function( conf, onclose ) {
	if ( !( this instanceof P2P ))
		return new P2P( conf, onclose );
	
	console.log( 'P2P', conf );
	var self = this;
	self.rtcConf = conf.rtcConf;
	self.peerList = conf.peers;
	self.onclose = onclose;
	
	self.conn = null;
	self.peers = {};
	self.joined = false;
	
	self.init();
}

// Public

P2P.prototype.addPeer = function( peerId ) {
	var self = this;
	console.log( 'P2P.addPeer', peerId );
}

P2P.prototype.removePeer = function( peerId ) {
	var self = this;
	console.log( 'P2P.removePeer', peerId );
}

// peerId : null to restart all
P2P.prototype.restartConnection = function( peerId ) {
	var self = this;
	var pids = [];
	if ( peerId )
		pids.push( peerId );
	else
		pids = Object.keys( self.peers );
	
	console.log( 'restartStream', pids );
	// stop peers
	pids.forEach( stop );
	pids.forEach( reconnect );
	
	function stop( pid ) {
		var peer = self.peers[ pid ];
		peer.stop();
	}
	
	function reconnect( pid ) {
		var peer = self.peers[ pid ];
		peer.start();
	}
}

// Private

P2P.prototype.init = function( parentConn ) {
	var self = this;
	console.log( 'P2P.init', self );
	return;
	
	self.conn = new EventNode(
		self.id,
		parentConn,
		eventSink
	);
	
	function conf( e ) { self.initialize( e ); }
	function eventSink() { console.log( 'P2P - unhandled event', arguments ); }
}

P2P.prototype.goActive = function() {
	var self = this;
	self.bindConn();
	self.connectPeers();
}

P2P.prototype.bindConn = function() {
	var self = this;
	self.conn.on( 'join', join );
	self.conn.on( 'leave', leave );
	self.conn.on( 'close', close );
	
	function join( e ) { self.handlePeerJoin( e ); }
	function leave( e ) { self.handlePeerLeft( e ); }
	function close( e ) { self.handleClosed( e ); }
}

P2P.prototype.connectPeers = function() {
	var self = this;
	console.log( 'rtc.connectpeers', self.peerList );
	self.peerList.forEach( connect );
	function connect( peerId ) {
		var conf = {
			peerId : peerId,
			doInit : true,
		};
		self.createPeer( conf );
	}
}

P2P.prototype.handlePing = function( timestamp ) {
	var self = this;
	console.log( 'handlePing', timestamp );
	var pong = {
		type : 'pong',
		data : timestamp,
	};
	self.conn.send( pong );
}

P2P.prototype.handlePeerJoin = function( peer ) {
	var self = this;
	console.log( 'RTC.handlePeerJoin', peer );
	peer.doInit = false;
	self.createPeer( peer );
}

P2P.prototype.handlePeerLeft = function( peer ) {
	var self = this;
	var peerId = peer.peerId;
	console.log( 'RTC.handlePeerLeft', peerId );
	self.closePeer( peerId );
}

P2P.prototype.handleClosed = function() {
	var self = this;
	console.log( 'handleClosed' );
	self.close();
}

P2P.prototype.createPeer = function( data ) {
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
	
	var peer = new Peer({
		id       : data.peerId,
		doInit   : data.doInit,
		signal   : self.conn,
		rtcConf  : self.rtcConf,
		onremove : onremove,
		closeCmd : closeCmd,
	});
	
	self.peers[ peer.id ] = peer;
	
	function onremove() { self.onRemovePeer( data.peerId ); }
	function closeCmd() { self.closePeer( data.peerId ); }
}

P2P.prototype.onRemovePeer = function( peerId ) {
	var self = this;
	self.roomSignal.send({
		type : 'remove',
		data : {
			peerId : peerId,
		}
	});
}

P2P.prototype.removePeer = function( pid ) {
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

P2P.prototype.peerLeft = function( pid ) {
	var self = this;
	var peer = self.peers[ pid ];
	if ( !peer ) {
		return;
	}
	
	self.closePeer( peer.id );
}

P2P.prototype.closePeer = function( peerId ) {
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

P2P.prototype.broadcast = function( msg ) {
	var self = this;
	if ( !self.conn )
		return;
	
	var wrap = {
		type : 'broadcast',
		data : msg,
	};
	
	self.conn.send( wrap );
}

P2P.prototype.leave = function() {
	var self = this;
	console.log( 'rtc.leave' );
	self.close();
}

P2P.prototype.close = function() {
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
	new BrowserCheck( checkBack );
	function checkBack( res ) {
		console.log( 'browser checkback', res );
		checkErrors( res );
		self.setCheckDone( 'browser', res );
		
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
	new ICECheck( conf, stepBack, doneBack );
	
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
	if ( self.hasError )
		ondone( self.checksDone, null );
	else
		ondone( null, self.checksDone );
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
