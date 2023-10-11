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
collabUserLimit = 6; // 6 users right now

// Maintain some things
window.addEventListener( 'keyup', _collab_maintain );
window.addEventListener( 'mouseup', _collab_maintain );
function _collab_maintain( e )
{
	let f = Application.currentFile;
	if( !f ) return;
	let c = window.collabMatrix;
	
	// Client || no collab
	if( !document.body.classList.contains( 'CollabHost' ) )
	{
		if( !document.body.classList.contains( 'CollabClient' ) )
			return;
		// Collab client
		if( !f.remote ) return;
		c.clientConn.send( {
			command: 'update',
			uniqueId: f.uniqueId,
			cursorpos: f.editor.getCursorPosition(),
			useruniqueid: Application.uniqueId
		} );
	}
	if( !f.hasCollaboration ) return;
	c.sendFromHost( {
		command: 'update',
		uniqueId: f.uniqueId,
		cursorpos: f.editor.getCursorPosition(),
		useruniqueid: Application.uniqueId
	} );
};


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
	
	Application.sendMessage( {
		command: 'refreshmenu',
		options: { collaborating: true }
	} );
	
	// Set up hosting peer
	c.hostPeer = new Peer( {
        secure: true, 
        port: 443
    } );
	c.hostPeer.on( 'open', ( hostPeerId ) => {
		c.hostPeerId = hostPeerId;
		document.body.classList.add( 'CollabHost' );
		if( cbk ) cbk( hostPeerId );
		c.hostPeer.on( 'connection', function( conn )
		{
			let o = { conn: conn };
			c.hostConn.push( o );
			conn.on( 'open', function()
			{
				conn.on( 'data', function( data )
				{
					if( typeof( data ) == 'object' )
					{
						if( data.command == 'hello' )
						{
							c.addUser( new CollabUser( {
								fullname: data.fullname,
								uniqueid: data.uniqueid,
								userid: data.userid,
								conn: conn
							} ) );
							document.body.classList.add( 'ConnectionEstablished' );
							if( collabWin )
								collabWin.close();
						}
						else if( data.command == 'update' )
						{
							let file = getFileById( data.uniqueId );
							if( file && data.cursorpos )
							{
								c.updateUserCursor( data.useruniqueid, data.cursorpos, file );
							}
						}
						// Comes in from the client
						else if( data.command == 'change' )
						{
							let file = allFiles[ data.uniqueId ];
							if( file )
							{
								c.updateUserCursor( data.useruniqueid, data.cursorpos, file );
								window.applyingClientChanges = true;
								file.editor.session.getDocument().applyDeltas( [ data.delta ] );
								
								// Only if we are on the same row, do a merge to keep master copy!
								// DANGEROUS! (Fixed with cursor line block)
								if( data.delta.start.row == file.editor.getCursorPosition().row )
								{
									// Send affected buffers
									// a) Get data block
									let block = '';
									let codeLen = file.editor.session.getLength;
									let starty = data.delta.start.row + 1;
									let endy = data.delta.end.row + 1;
									for( let yi = starty; yi <= endy; yi++ )
										 block += file.editor.session.getLine( yi - 1 );
									
									// Merge to all clients
									c.sendFromHost( {
										command: 'merge',
										mergeBlocks: [
											{ 
												blockRange: {
													startRow: starty - 1,
													endRow: endy - 1
												}, 
												data: block
											}
										],
										filePath: file.filePath,
										uniqueId: file.uniqueId,
										time: ( new Date() ).getTime()
									} );
								}
								// Update the other participants
								else
								{
									for( let i = 0; i < c.hostConn.length; i++ )
									{
										if( c.hostConn[ i ].conn != conn )
										{
											c.hostConn[ i ].conn.send( data );
											c.hostConn[ i ].conn.send( {
												command: 'update',
												uniqueId: file.uniqueId,
												cursorpos: file.editor.getCursorPosition(),
												useruniqueid: Application.uniqueId
											} );
										}
									}
								}
								
								window.applyingClientChanges = false;
								
								// Update minimap
								setTimeout( function()
								{
									if( file.refreshBuffer )
									{
										file.refreshBuffer();
										file.refreshMinimap();
									}
								}, 5 );
							}
						}
						else if( data.command == 'disconnect' )
						{
							let c = window.collabMatrix;
							c.removeUser( data.useruniqueid );
						}
					}
				} );
				conn.send( {
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

// Add a file for collaboration
function hostAddCollaborationOnFile( file )
{
	let c = window.collabMatrix;
	
	file.hasCollaboration = true;
	
	// Just send the currently shared document
	let tmsg = {
		command: 'setcollabfile',
		filename: file.filename,
		filePath: file.path,
		uniqueId: file.uniqueId,
		cursorpos: file.editor.getCursorPosition(),
		useruniqueid: Application.uniqueId,
		data: file.editor.getValue()
	};
	c.sendFromHost( tmsg );
	
	file.changeFunc = function ( delta )
	{
		if( !window.applyingClientChanges )
		{
			c.sendFromHost( {
				command: 'change',
				filePath: file.path,
				uniqueId: file.uniqueId,
				delta: delta,
				useruniqueid: Application.uniqueId,
				cursorpos: file.editor.getCursorPosition(),
				time: ( new Date() ).getTime()
			} );
		}
	};
	// Host exec
	file.execFunc = function( e )
	{
		if( !e ) e = window.event;
		if( e && e.which )
		{
			if( e.key == 'ArrowUp' ) return true;
			else if( e.key == 'ArrowDown' ) return true;			
		}
		let p = file.editor.getCursorPosition();
		for( let i in c.users )
		{
			if( c.users[ i ].marker && c.users[ i ].userinfo.uniqueid != Application.uniqueId )
			{
				if( p.row == c.users[ i ].markerPosition.row )
				{
					if( e && e.stopPropagation ) e.stopPropagation();
					cancelBubble( e );
					return { command: "null", passEvent: false };
				}
			}
		}
		return true;
	}
	file.keyboardHandler = function( data, hash, keyString, keyCode, event )
	{
		return file.execFunc( event );
	}
	file.editor.session.on( 'change', file.changeFunc );
	file.editor.session.on( 'exec', file.execFunc );
	file.editor.keyBinding.addKeyboardHandler( { handleKeyboard: file.keyboardHandler } );
	
	ge( 'CollaborationSwitch' ).classList.add( 'On' );
}

function hostRemCollaborationOnFile( file )
{
	let c = window.collabMatrix;
	file.hasCollaboration = false;
	
	// Just send the currently shared document
	let tmsg = {
		command: 'remcollabfile',
		filename: file.filename,
		filePath: file.path,
		uniqueId: file.uniqueId
	};
	c.sendFromHost( tmsg );
	file.editor.session.off( 'change', file.changeFunc );
	file.editor.keyBinding.removeKeyboardHandler( file.keyboardHandler );
	file.editor.session.off( 'exec', file.execFunc );
	
	ge( 'CollaborationSwitch' ).classList.remove( 'On' );
}

// Client functions ------------------------------------------------------------

// Client receives collaboration session from a host
function receiveCollabSession( msg, cbk = false )
{
	let c = window.collabMatrix;
	if( c.clientPeer ) return; // Already have a peer
	
	Application.sendMessage( {
		command: 'refreshmenu',
		options: { collaborating: true }
	} );
	
	// We cannot host and join a collab session at the same time (yet)
	if( c.hostPeer )
		c.hostPeer.destroy();
	
	c.hostPeerId = msg.hostPeerId;
	
	// Set up hosting peer
	c.clientPeer = new Peer( {
        secure: true, 
        port: 443
    } );
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
						c.addUser( us );
					}
					else if( data.command == 'disconnect' )
					{
						let o = {};
						for( let a in allFiles )
						{
							if( allFiles[ a ].remote )
							{
								try
								{
									allFiles[a].editor.destroy();
									allFiles[a].tabClose();
								}
								catch( e )
								{}
							}
							else
							{
								o[ a ] = allFiles[ a ];
							}
						}
						allFiles = o;
						let c = window.collabMatrix;
						if( c.clientPeer )
							c.clientPeer.destroy();
						document.body.classList.remove( 'CollabClient' );
						document.body.classList.remove( 'ConnectionEstablished' );
						
						Application.sendMessage( {
							command: 'refreshmenu',
							options: { collaborating: false }
						} );
					}
					else if( data.command == 'remcollabfile' )
					{
						// DO IT!
						let f = getFileById( data.uniqueId );
						if( f ) 
						{
							f.editor.destroy();
							f.tabClose();
						}
					}
					else if( data.command == 'setcollabfile' )
					{
						let f = RemoteFile( data.filePath, data.uniqueId ); 
						if( f )
						{
							f.filename = data.filename;
							f.updateTab();
							f.editor.setValue( data.data );
							f.editor.clearSelection();
							f.changeFunc = function( delta )
							{
								if( !window.applyingHostChanges )
								{
										c.clientConn.send( {
											command: 'change',
											useruniqueid: Application.uniqueId,
											delta: delta,
											filePath: f.path,
											uniqueId: f.uniqueId,
											cursorpos: f.editor.getCursorPosition(),
											time: ( new Date() ).getTime()
										} );
									}
							}
							// Client exec
							f.execFunc = function( e )
							{
								if( !e ) e = window.event;
								if( e && e.which )
								{
									if( e.key == 'ArrowUp' ) return true;
									else if( e.key == 'ArrowDown' ) return true;			
								}
								
								// Host exec
								let p = f.editor.getCursorPosition();
								for( let i in c.users )
								{
									if( c.users[ i ].marker )
									{
										if( p.row == c.users[ i ].markerPosition.row )
										{
											e.stopPropagation();
											cancelBubble( e );
											return false;
										}
									}
								}
							}
							f.keyboardHandler = function( data, hash, keyString, keyCode, event )
							{
								return f.execFunc( event );
							}
							f.editor.session.on( 'change', f.changeFunc );
							f.editor.session.on( 'exec', f.execFunc );
							f.editor.keyBinding.addKeyboardHandler( { handleKeyboard: f.keyboardHandler } );
							c.updateUserCursor( data.useruniqueid, data.cursorpos, f );
							RefreshFiletypeSelect();
						}
					}
					// Merge comes from host, and updates lines of code
					// to the original source state, with a simple merge
					else if( data.command == 'merge' )
					{
						let file = getFileById( data.uniqueId );
						if( file )
						{
							c.addKeyboardEvent( {
								type: 'merge',
								data: data.mergeBlocks[0].data,
								row: data.mergeBlocks[0].blockRange.startRow,
								time: data.time,
								localtime: ( new Date() ).getTime(), // Local time
								file: file
							} );
						}
					}
					// Change
					else if( data.command == 'change' )
					{
						let file = getFileById( data.uniqueId );
						if( file )
						{
							c.addKeyboardEvent( {
								type: 'change',
								delta: data.delta,
								time: data.time,
								localtime: ( new Date() ).getTime(), // Local time
								file: file
							} );
							c.updateUserCursor( data.useruniqueid, data.cursorpos, file );
						}
					}
					else if( data.command == 'update' )
					{
						let file = getFileById( data.uniqueId );
						if( file && data.cursorpos )
						{
							c.updateUserCursor( data.useruniqueid, data.cursorpos, file );
						}
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
	if( c.hostPeer )
	{
		c.sendFromHost( {
			command: 'disconnect',
			time: ( new Date() ).getTime()
		} );
	}
	// Client
	else if( c.clientConn )
	{
		c.clientConn.send( {
			command: 'disconnect',
			time: ( new Date() ).getTime(),
			useruniqueid: Application.uniqueId
		} );
	}
	for( let a in allFiles )
	{
		if( allFiles[ a ].hasCollaboration )
		{
			hostRemCollaborationOnFile( allFiles[ a ] );
		}
	}
	for( let a = 0; a < c.users.length; a++ )
	{
		if( c.users[ a ].marker )
		{
			c.users[ a ].session.removeMarker( c.users[ a ].marker );
		}
	}
	
	setTimeout( function()
	{
		let c = window.collabMatrix;
		if( c.hostPeer )
			c.hostPeer.destroy();
		if( c.clientPeer )
			c.clientPeer.destroy();
		document.body.classList.remove( 'CollabHost' );
		document.body.classList.remove( 'ConnectionEstablished' );
	}, 25 );
	Application.sendMessage( {
		command: 'refreshmenu',
		options: { collaborating: false }
	} );
}

// Collaboration user structure
class CollabUser
{
	constructor( userinfo )
	{
		this.userinfo = userinfo;
		if( this.userinfo.conn )
		{
			this.conn = this.userinfo.conn;
			this.userinfo.conn = null;
		}
	}
}

// The collab matrix holds all collaboration processes -------------------------
window.collabMatrix = {
	files: {},
	users: [],
	hostConn: [],
	keyboard: {
		shift: false,
		ctrl: false,
		alt: false,
		altgr: false,
		meta: false
	},
	// Only support 6 users right now
	palette: [
		'User1',
		'User2',
		'User3',
		'User4',
		'User5',
		'User6'
	],
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
			window.applyingHostChanges = true;
			evt.file.editor.session.getDocument().applyDeltas( [ evt.delta ] );
			window.applyingHostChanges = false;
			
			// Update minimap
			if( evt.file.refreshBuffer )
			{
				evt.file.refreshBuffer();
				evt.file.refreshMinimap();
			}
		}
		else if( evt.type == 'merge' )
		{
			let range = new ace.Range( 
				evt.row, 0,
				evt.row, Number.MAX_VALUE
			);
			
			// Write that line
			window.applyingHostChanges = true;
			evt.file.editor.session.replace( range, evt.data );
			window.applyingHostChanges = false;
			
			// Update minimap
			if( evt.file.refreshBuffer )
			{
				evt.file.refreshBuffer();
				evt.file.refreshMinimap();
			}
		}
	},
	addUser( cuser )
	{
		for( let a = 0; a < this.users.length; a++ )
		{
			if( this.users[ a ].userinfo.uniqueid == cuser.userinfo.uniqueid )
				return false;
		}
		this.users.push( cuser );
		this.refreshUsers();
	},
	kick( uniqueid )
	{
		let self = this;
		Confirm( i18n( 'i18n_are_you_sure' ), i18n( 'i18n_this_will_remove_user_from_collab_sess' ), function( d )
		{
			if( !d.data ) return;
			for( let a = 0; a < self.users.length; a++ )
			{
				if( self.users[ a ].userinfo.uniqueid == uniqueid )
				{
					self.users[ a ].conn.send( {
						command: 'disconnect',
						time: ( new Date() ).getTime()
					} );
				}
			}
			setTimeout( function()
			{
				self.removeUser( uniqueid );
			}, 50 );
		} );
	},
	removeUser( uniqueid )
	{
		let o = [];
		for( let a = 0; a < this.users.length; a++ )
		{
			if( this.users[ a ].userinfo.uniqueid != uniqueid )
				o.push( this.users[ a ] );
			else
			{
				if( this.users[ a ].marker )
				{
					this.users[ a ].session.removeMarker( this.users[ a ].marker );
				}
			}
		}
		this.users = o;
		if( this.users.length == 0 )
		{
			document.body.classList.remove( 'ConnectionEstablished' );
		}
		this.refreshUsers();
	},
	refreshUsers()
	{
		let b = ge( 'Participants' ).querySelector( '.body' );
		let str = '';
		for( let a = 0; a < this.users.length; a++ )
		{
			if( !this.users[ a ].color )
			{
				this.users[ a ].color = this.palette[ a % this.palette.length ];
			}
			let cl = this.users[ a ].color;
			str += '<div class="Participant""><div class="Knob"><span class="' + cl + '"></span></div><div class="Name">' + this.users[ a ].userinfo.fullname + '</div><div class="Kick" onclick="window.collabMatrix.kick(\'' + this.users[a].userinfo.uniqueid + '\')"></div></div>';
		}
		b.innerHTML = str;
	},
	sendFromHost( msg )
	{
		for( let i = 0; i < this.hostConn.length; i++ )
		{
			this.hostConn[ i ].conn.send( msg );
		}
	},
	updateUserCursor( useruniqueid, cursorpos, file )
	{
		let marker = null;
		let u = null;
		for( let i in this.users )
		{
			if( this.users[ i ].userinfo.uniqueid == useruniqueid )
			{
				u = this.users[ i ];
			}
		}
		// Unknown user
		if( !u ) return;
		
		// Remove previous marker
		if( u.marker )
		{
			u.session.removeMarker( u.marker );
			u.marker = null;
		}
		
		// Add new marker in the right color
		u.marker = file.editor.session.addMarker( 
			new ace.Range(cursorpos.row, 0, cursorpos.row, Number.MAX_SAFE_INTEGER ), 
			u.color, "fullLine" 
		);
		u.markerPosition = cursorpos;
		u.session = file.editor.session;
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
	if( document.body.classList.contains( 'CollabHost' ) && window.collabMatrix.hostConn.length )
	{
		window.collabMatrix.sendFromHost( {
			command: 'ping',
			fullname: Application.fullName,
			uniqueid: Application.uniqueId,
			userid: Application.userId,
			time: ( new Date() ).getTime()
		} );
	}
}, 1000 );

