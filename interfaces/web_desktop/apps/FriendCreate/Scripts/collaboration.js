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
						document.body.classList.remove( 'CollabMode' );
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
					document.body.classList.remove( 'CollabMode' );
				}
			}
			collabWin = null;
		}
	} );
}

function activateCollaboration( cbk )
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
	} );
	c.hostPeer.on( 'close', () => {
		c.hostPeerId = null;
		c.hostPeer = null;
		document.body.classList.remove( 'CollabHost' );
	} );
}

function receiveCollabSession( msg )
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
	} );
	c.clientPeer.on( 'close', () => {
		c.clientPeerId = null;
		c.clientPeer = null;
		document.body.classList.remove( 'CollabClient' );
	} );
}

// Collaboration user structure
class CollabUser
{
	constructor( userinfo )
	{
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

// The collab matrix holds all collaboration processes
window.collabMatrix = {
	files: {}
};

