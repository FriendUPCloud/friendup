var currentUser = 0;
var mainViewLoaded = false;
var mainViewLoadedCbk = false;
document.title = 'jumparound.js';

Application.run = function( msg )
{
	// Identify the user
	currentUser = msg.username;
	
	// Create a new view to put the game in
	this.mainView = new View( {
		title: 'Jump Around',
		width: 640,
		height: 480
	} );
	
	//console.log( 'connecting ws to FC' );
	//new FAPConn( conf );
	
	// Setup a application shared session
	var areq = this.areq = new AssidRequest( {
		events: [ 'keydown', 'keyup', 'touchstart', 'touchend' ],
		eventOwner: 'owner' // Only owner acts on input events
	} );
	
	// When closing, quit application
	this.mainView.onClose = function()
	{
		Application.quit();
	}
	
	// When quitting, first terminate websocket session..
	this.onQuit = function()
	{
		this.areq.unshare();
	}
	
	// Add the menu
	this.mainView.setMenuItems( [
		{
			name: 'Game',
			items: [
				{
					name: 'Invite player',
					command: 'invite'
				},
				{
					name: 'Quit',
					command: 'quit'
				}
			]
		}
	] );
	
	// Load game screen
	var f = new File( 'Progdir:Templates/game.html' );
	f.onLoad = function( data )
	{
		// Set content and then run callback once content is loaded
		Application.mainView.setContent( data, function()
		{
			// If there are args, we have an invite and should run invitee kode
			if ( msg.args )
			{
				// client endpoint for event will be sued
				areq.isHost = false;
	
				// Is it a host (tell child view)?
				Application.mainView.sendMessage( { command: 'ishost', value: areq.isHost, 'disableLogic': !areq.isHost && areq.flags.eventOwner == 'owner' } );
				
				// Register the assid
				areq.applicationId = msg.args.sasid;
				
				// This is the handler for incoming events
				function handler( bundle )
				{
					var e = bundle.data;
					e.identity = bundle.identity;
					console.log( 'hostHandler', e );
					if( e.type == 'keyup' || e.type == 'keydown' )
					{
						Application.areq.distributeSharedEvent( e.type, e );
					}
					// Set the coords on user
					else if( e.x >= 0 && e.y >= 0 && e.identity )
					{
						Application.mainView.sendMessage( {
							command: 'setcoords',
							username: e.username,
							x: e.x,
							y: e.y,
							sprite: e.sprite
						} );
					}
				}
				// Share events with owner
				areq.shareEvents( msg.args, handler );
			}
			// Nope on args, we are owner, initialize session
			else
			{
				// host endpoint for events will be used
				areq.isHost = true;
				
				// Is it a host (tell child view)?
				Application.mainView.sendMessage( { command: 'ishost', value: areq.isHost, 'disableLogic': !areq.isHost && areq.flags.eventOwner == 'owner' } );
				
				// Handler for incoming events
				function handler( bundle )
				{
					var e = bundle.data;
					e.identity = bundle.identity;
					console.log( 'client handler', e );
					if( e.type == 'keyup' || e.type == 'keydown' || e.type == 'touchstart' || e.type == 'touchend' )
					{
						AssidRequest.prototype.distributeSharedEvent( e.type, e );
					}
				}
				
				// Share application with other users
				areq.share( handler );
			}
			
			// Some late coming stuff
			mainViewLoaded = true;
			if( mainViewLoadedCbk )
			{
				console.log( 'Adding users with callback' );
				mainViewLoadedCbk();
			}
			
			// Add root user
			if( Application.areq.isHost )
			{
				Application.mainView.sendMessage( {
					command: 'adduser',
					username: Application.username
				} );
				console.log( 'We added owner.' );
			}
		} );
	}
	f.load();
	
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		// What to do?
		case 'updatecoords':
			if( this.areq.isHost )
			{
				// Just send the bloody thing to the others
				this.areq.sendEvent( msg.payload );
			}
			break;
		case 'invite':
			InvitePlayer();
			break;
		case 'closeinvite':
			if( invView ) invView.close();
			break;
		case 'sendinvite':
			if( invView ) invView.close();
			sendInvite( msg );
			break;
		// Accept an application share session id
		case 'sasidaccept':
			// Add root user and myself!
			// Happens only for invitees
			mainViewLoadedCbk = function()
			{
				//console.log( 'We\'re adding the other users because we got asssid accept!' );
				Application.mainView.sendMessage( {
					command: 'adduser',
					username: msg.data.identity
				} );
				Application.mainView.sendMessage( {
					command: 'adduser',
					username: Application.username
				} );
				mainViewLoadedCbk = null;
			}
			if( mainViewLoaded ) mainViewLoadedCbk();
			console.log( 'Assid accepted: ', msg );
			break;
	}
}

var invView = false;
function InvitePlayer()
{
	if( invView ) return false;
	var v = new View( {
		title: 'Invite a player to the game',
		width: 320,
		height: 105
	} );
	invView = v;
	v.onClose = function()
	{
		invView = false;
	}
	var f = new File( 'Progdir:Templates/invite.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}

// Sends an invite to invitees - only for owners
function sendInvite( msg )
{
	Application.areq.sendInvite( msg.user, 'Do you want to join a game of JumpAround?', invBack );
	function invBack( res )
	{
		//
		if ( !res.invited ) {
			console.log( 'sendInvite - res, noone invited', res );
			return;
		}
		
		res.invited.forEach( add );
		function add( user )
		{
			Application.mainView.sendMessage({
				command  : 'adduser',
				username : user.name,
			});
		}
		//console.log( 'User ' + res.UsersAdded + ' accepted invite. Being added!' );
		/*
		Application.mainView.sendMessage( {
			command: 'adduser',
			username: res.invited[0].name,
		} );
		*/
	}
}

