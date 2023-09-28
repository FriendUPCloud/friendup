/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Just start the collaboration window, to add people to the current session
let collabWin = null;
function collabInvite()
{
	if( collabWin ) return collabWin.activate();
	
	activateCollaboration( function( hostPeerId )
	{
		collabWin = new View( {
			title: i18n( 'i18n_invite_user' ),
			width: 380,
			height: 380,
			replacements: {
				hostPeerId: hostPeerId
			},
			assets: [
				'Progdir:Templates/collaboration_invite.html',
				'Progdir:Scripts/fui.invitedialog.js',
				'Progdir:Scripts/fui.invitedialog.css',
				'Progdir:Scripts/invitedialog.js'
			]
		} );
		collabWin.onClose = function()
		{
			if( window.collabMatrix.users  )
			{
				if( window.collabMatrix.users.length == 0 )
				{
					if( window.collabMatrix.hostPeer )
					{
						window.collabMatrix.hostPeer.destroy();
					}
					else
					{
						document.body.classList.remove( 'CollabClient' );
						document.body.classList.remove( 'ConnectionEstablished' );
					}
				}
			}
			// No users at all
			else
			{
				if( window.collabMatrix.hostPeer )
				{
					window.collabMatrix.hostPeer.destroy();
				}
				else
				{
					document.body.classList.remove( 'CollabClient' );
					document.body.classList.remove( 'ConnectionEstablished' );
				}
			}
			collabWin = null;
		}
	} );
}

// Host activates collaboration mode
function activateCollaboration( cbk = false )
{
	let c = window.collabMatrix;
	if( c.hostPeer ) return; // Already have a peer
	
	// We can not host and join a collab session at the same time (yet)
	if( c.hostPeerId ) c.hostPeerId = null;
	if( c.clientPeer ) c.clientPeer.destroy();
	
	// Set up hosting peer
	c.hostPeer = new Peer();
	c.hostPeer.on( 'open', ( hostPeerId ) => {
		c.hostPeerId = hostPeerId;
		document.body.classList.add( 'CollabHost' );
		if( cbk ) cbk( hostPeerId );
		c.hostPeer.on( 'connection', function( conn )
		{
			c.hostConn = conn;
			c.hostConn.on( 'open', function()
			{
				c.hostConn.on( 'data', function( data )
				{
					if( typeof( data ) == 'object' )
					{
						if( data.command == 'hello' )
						{
							let us = new CollabUser( {
								fullname: data.fullname,
								uniqueid: data.uniqueid,
								userid: data.userid
							} );
							c.users.push( us );
							
							document.body.classList.add( 'ConnectionEstablished' );
							
							// Just send the currently shared document
							let tmsg = {
								command: 'setcurrentfile',
								filename: Application.currentFile.filename,
								path: Application.currentFile.path,
								data: Application.currentFile.editor.getValue()
							};
							c.hostConn.send( tmsg );
							
							Application.currentFile.editor.session.on( 'change', function ( delta )
							{
								if( !window.clientChanges )
								{
									c.hostConn.send( {
										command: 'change',
										delta: delta,
										time: ( new Date() ).getTime()
									} );
								}
							} );
						}
						// Comes in from the client
						else if( data.command == 'change' )
						{
							window.clientChanges = true;
							Application.currentFile.editor.session.getDocument().applyDeltas( [ data.delta ] );
							window.clientChanges = false;
							
							// Update minimap
							if( Application.currentFile.refreshBuffer )
							{
								Application.currentFile.refreshBuffer();
								Application.currentFile.refreshMinimap();
							}
						}
					}
				} );
				c.hostConn.send( {
					command: 'hello',
					fullname: Application.fullName,
					uniqueid: Application.uniqueId,
					userid: Application.userId,
					time: ( new Date() ).getTime()
				} );
			} );
		} );
	} );
	c.hostPeer.on( 'close', () => {
		c.hostPeerId = null;
		c.hostPeer = null;
		document.body.classList.remove( 'CollabHost' );
		document.body.classList.remove( 'ConnectionEstablished' );
	} );
}

// Client receives collaboration session from a host
function receiveCollabSession( msg, cbk = false )
{
	let c = window.collabMatrix;
	if( c.clientPeer ) return; // Already have a peer
	
	// We cannot host and join a collab session at the same time (yet)
	if( c.hostPeer )
		c.hostPeer.destroy();
	
	c.hostPeerId = msg.hostPeerId;
	
	// Set up hosting peer
	c.clientPeer = new Peer();
	c.clientPeer.on( 'open', ( clientPeerId ) => {
		c.clientPeerId = clientPeerId;
		
		document.body.classList.add( 'CollabClient' );
		
		if( cbk ) cbk( clientPeerId );
		
		c.clientConn = c.clientPeer.connect( c.hostPeerId );
		c.clientConn.on( 'open', function()
		{
			// We are connected..
			c.clientConn.on( 'data', function( data )
			{
				// Receiving an object
				if( typeof( data ) == 'object' )
				{
					if( data.command == 'hello' )
					{
						document.body.classList.add( 'ConnectionEstablished' );
						
						let us = new CollabUser( {
							fullname: data.fullname,
							uniqueid: data.uniqueid,
							userid: data.userid
						} );
						c.users.push( us );
					}
					else if( data.command == 'setcurrentfile' )
					{
						let f = new EditorFile();
						f.remote = true;
						f.filename = data.filename;
						f.path = data.path;
						f.updateTab();
						f.editor.setValue( data.data );
						f.editor.clearSelection();
						f.editor.session.on( 'change', function( delta )
						{
							if( !window.hostChanges )
							{
								c.clientConn.send( {
									command: 'change',
									delta: delta,
									time: ( new Date() ).getTime()
								} );
							}
						} );
						
						
						RefreshFiletypeSelect();
					}
					// Change
					else if( data.command == 'change' )
					{
						c.addKeyboardEvent( {
							type: 'change',
							delta: data.delta,
							time: data.time,
							localtime: ( new Date() ).getTime() // Local time
						} );
					}
					// Just ping
					else if( data.command == 'ping' )
					{
						c.addKeyboardEvent( {
							type: 'ping',
							time: data.time,                    // Remote time
							localtime: ( new Date() ).getTime() // Local time
						} );
					}
				}
			} );
			c.clientConn.send( {
				command: 'hello',
				fullname: Application.fullName,
				uniqueid: Application.uniqueId,
				userid: Application.userId,
				time: ( new Date() ).getTime()
			} );
		} );
	} );
	c.clientPeer.on( 'close', () => {
		c.clientPeerId = null;
		c.clientPeer = null;
		document.body.classList.remove( 'CollabClient' );
		document.body.classList.remove( 'ConnectionEstablished' );
	} );
}

function disconnectCollaboration()
{
	let c = window.collabMatrix;
	if( c.clientPeer )
		c.clientPeer.destroy();
	if( c.hostPeer )
		c.hostPeer.destroy();
	document.body.classList.remove( 'CollabHost' );
	document.body.classList.remove( 'CollabClient' );
	document.body.classList.remove( 'ConnectionEstablished' );
}

// Collaboration user structure
class CollabUser
{
	constructor( userinfo )
	{
		this.userinfo = userinfo;
	}
}

// Collaboration file structure
class CollabFile
{
	constructor()
	{
	
	}
	
	addUser( userObject )
	{
		this.users.push( userObject );
	}
}

// The collab matrix holds all collaboration processes -------------------------
window.collabMatrix = {
	files: {},
	users: [],
	keyboard: {
		shift: false,
		ctrl: false,
		alt: false,
		altgr: false,
		meta: false
	},
	eventLock: false,
	keyboardEvents: [],
	addKeyboardEvent( evt )
	{
		let self = this;
		// Incoming event is added by remote time
		if( this.eventLock )
			return setTimeout( function(){ self.addKeyboardEvent( evt ); }, 25 );
		this.eventLock = true;
		this.keyboardEvents.push( evt );
		// Sort and process
		this.processKeyboardEvents( function() { self.eventLock = false; } );
	},
	// Process by delay (500ms)
	processKeyboardEvents( cbk = false )
	{
		let self = this;
		
		let sortList = [];
		let maxTime = -1;
		for( let a = 0; a < self.keyboardEvents.length; a++ )
		{
			if( self.keyboardEvents[ a ].time > maxTime )
				maxTime = self.keyboardEvents[ a ].time;
			sortList[ self.keyboardEvents[ a ].time ] = self.keyboardEvents[ a ];
		}
		let outList = []; // List to not be processed
		let execOrder = []; // List of unique time slots to be processed // TODO Double check that they are unique
		let execEvents = {}; // List of events to be processed
		for( let a in sortList )
		{
			// if the event is half a second old, execute immediately and in order
			if( maxTime - a > 250 )
			{
				execOrder.push( a );
				execEvents[ a ] = sortList[ a ];
			}
			else
			{
				outList.push( sortList[ a ] );
			}
		}
		self.keyboardEvents = outList; // This contains the untouched events
		
		// Sorts the events by time
		execOrder.sort();
		for( let a = 0; a < execOrder.length; a++ )
			self.executeEvent( execEvents[ execOrder[ a ] ] );
		
		// Done
		if( cbk ){ cbk(); }
	},
	executeEvent( evt )
	{
		let self = this;
		
		if( evt.type == 'change' )
		{
			window.hostChanges = true;
			Application.currentFile.editor.session.getDocument().applyDeltas( [ evt.delta ] );
			window.hostChanges = false;
			// Update minimap
			if( Application.currentFile.refreshBuffer )
			{
				Application.currentFile.refreshBuffer();
				Application.currentFile.refreshMinimap();
			}
		}
	}
};
// Poll collab events
window.collabMatrix.intr = setInterval( function()
{
	if( window.collabMatrix.eventLock )
		return;
	window.collabMatrix.eventLock = true;
	window.collabMatrix.processKeyboardEvents( function(){ window.collabMatrix.eventLock = false; } );
}, 500 );
// Poll collab events
window.collabMatrix.intr = setInterval( function()
{
	if( document.body.classList.contains( 'CollabHost' ) && window.collabMatrix.hostConn )
	{
		window.collabMatrix.hostConn.send( {
			command: 'ping',
			fullname: Application.fullName,
			uniqueid: Application.uniqueId,
			userid: Application.userId,
			time: ( new Date() ).getTime()
		} );
	}
	
}, 1000 );

