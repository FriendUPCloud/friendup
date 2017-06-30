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

var mainViewLoadedCbk = null;

Application.fconn = false;
Application.sas = null;
Application.sasid = null;
Application.isHost = false;
Application.colors = [ '#000000', '#ff0000', '#00aa00', '#0000ff', '#00AAff', '#AA00ff' ];
Application.colorIndex = 1; // is is for us as host.
Application.colorMap = {};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.run = function( conf, msg )
{
	Application.conf = conf;
	Application.views = {};
	Application.appEvents = {};
	Application.users = {};
	Application.username = conf.username; 
	Application.conn = new FConn();
	
	if( conf.hasOwnProperty( 'args' ) && conf.args.hasOwnProperty('sasid') )
	{
		Application.sasid = conf.args.sasid;
	}
	else
	{
		Application.isHost = true;
	}
	
	Application.displayBoard();
	
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.receiveMessage = function( msg )
{
	if( !msg.command ) return false;
	
	switch( msg.command )
	{
		// Tell other users
		case 'draw':
			Application.sas.send( {type:'draw',data:msg.payload } );
			break;
		case 'invite':
			Application.createInvite();
			break;
		// Close the invite view
		case 'closeinvite':
			if( Application.invView ) Application.invView.close();
			break;
		// Send the invite!
		case 'sendinvite':
			sendInvite( msg );
			break;
		// Accept an application share session id
		case 'sasidaccept':
			// Add root user and myself!
			// Happens only for invitees
			mainViewLoadedCbk = function()
			{
				console.log( 'We\'re adding the other users because we got asssid accept!' );
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

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.displayBoard = function()
{
	var v = new View( {
		title: i18n('i18n_title'),
		width: 800,
		height: 600
	} );
	
	this.mainView = v;
	
	// Quit when view is closed!
	v.onClose = function()
	{
		Application.quit();
	}
	
	// Load the board template for the main view
	var f = new File( 'Progdir:Templates/board.html' );
	f.onLoad = function( data )
	{
		// Set content and initialize board logic!
		v.setContent( data, function()
		{
			//board is loaded.... connect us to sasid....
			Application.initAssid();			
		} );
	}
	f.load();
	
	v.setMenuItems( [
		{
			name: i18n('i18n_file'),
			items: [
				{
					name: i18n('i18n_invite'),
					command: 'invite'
				},
				{
					name: i18n('i18n_quit'),
					command: 'quit'
				}
			]
		}
	] );
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.initAssid = function()
{
	console.log('init SAS ID');
	var conf = {
		sasid   : Application.sasid,
		onevent : Application.socketMessage,
	};
	Application.sas = new SAS( conf, Application.sasidReady );

	console.log('SAS instantiated.');
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.sasidReady = function( result )
{
	console.log('sasidReady...',result);
	if( Application.isHost )
	{
		Application.bindHostEvents();
	}
	else
	{
		Application.bindClientEvents();
	}
	Application.sas.on( 'sasid-close', Application.sasClosed );
};

Application.socketMessage = function( sm )
{
	console.log('got a socket message for us...',sm);
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.bindHostEvents = function()
{
	Application.sas.on( 'client-accept', Application.clientAccepted );
	Application.sas.on( 'client-decline', Application.clientDeclined );
	Application.sas.on( 'client-close', Application.clientClosed );
	Application.sas.on( 'draw', Application.clientMessage );
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.bindClientEvents = function()
{
	Application.sas.on( 'draw', Application.boardMessage );
	Application.sas.on( 'set-color', Application.setUserColor );
	Application.sas.on( 'user-add', Application.userAdded );
	Application.sas.on( 'user-list', Application.updateUserlist );
	Application.sas.on( 'user-remove', Application.userRemoved );
}



/* ############################################################################

	Methods for host mode...

#############################################################################*/

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.clientAccepted = function( event, identity )
{
	console.log( 'clientAccepted', {
		e : event,
		i : identity,
	});
	identity.isActive = true;
	identity.color = Application.colors[ Application.colorIndex ];

	Application.colorIndex = ( Application.colorIndex + 1 > Application.colors.length ? 0 : Application.colorIndex+1 );
	Application.users[ identity.username  ] = identity;
	
	var addedUser = {
		type : 'user-add',
		data : identity,
	}
	
	Application.sas.send( addedUser );
	Application.mainView.sendMessage( {command:'adduser', username: identity.username, color: identity.color } );
	
	Application.sendUpdatedUserList( identity.username );
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.clientDeclined = function( event, identity )
{
	Application.mainView.sendMessage({command:'user-remove',username: event});
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.clientClosed = function( event, identity )
{
	console.log( 'clientClosed', {
		e : event,
		i : identity,
	});
	var rem = {
		type : 'user-remove',
		data : identity,
	};
	
	delete Application.users[ identity.username ];

	//Application.mainView.removeUser( identity.username );

	Application.sas.send( rem );

	Application.getAssUserlist( usersBack );
	function usersBack( users ) {
		console.log( 'hepp', users );
	}
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.clientMessage = function( event, identity )
{
	event.color = ( event.color ? event.color :  ( Application.users[ event.username ].color ? Application.users[ event.username ].color : false ) );
	
	var msg = {
		type : 'draw',
		data : event
	};
	
	Application.mainView.sendMessage( {
		command: 'draw',
		username: event.username,
		px: event.px,
		py: event.py,
		cx: event.cx,
		cy: event.cy,
		color: event.color
	} );
	
	
	Application.sas.send( msg );
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.sendUpdatedUserList = function( username )
{
	var userlist = Object.keys( Application.users );
	var message = [];
	for(var i = 0; i < userlist.length; i++)
	{
		message.push( {username:userlist[i],color:Application.users[ userlist[i] ].color} );
	}
	var uptd = {
		type : 'user-list',
		data : message,
	};
	console.log( 'sendUpdatedUserList', uptd );
	Application.sas.send( uptd );
}

/* ############################################################################



	Methods for client mode...



#############################################################################*/

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #

Application.boardMessage = function( event, identity )
{
	event.command = 'draw';
	event.username = identity;
	Application.mainView.sendMessage( event );
};

Application.setUserColor = function( event, identity )
{
	event.command = 'setcolor';
	event.username = identity;
	Application.mainView.sendMessage( event );
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.userAdded = function( event, identity )
{
	event.command = 'adduser';
	event.username = identity
	Application.mainView.sendMessage( event );
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.updateUserlist = function( event, identity )
{
	console.log( 'updateUserlist', {
		e : event,
		i : identity,
	});
	event.forEach( add );
	function add( user ) {
		user.command = 'adduser';
		Application.mainView.sendMessage( user );
	}
	console.log('add the owner with BLACK!',Application.colors[0]);
	Application.mainView.sendMessage( {command:'adduser',username : identity.username, color:Application.colors[0] } )
};

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.userRemoved = function( event, identity )
{
	console.log( 'userRemoved', {
		e : event,
		i : identity,
	});
	Application.mainView.sendMessage( {command:'removeuser',username : event.username} );
};




/* ############################################################################



	Mode independent methods


#############################################################################*/

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.sasClosed = function()
{
	
	if ( Application.connectView )
		Application.connectView.close();
	
	Application.mainView.setFlag('title','DISCONNECTED - Drawing disabled - Whiteboard');
	Application.mainView.sendMessage({command:'sasclosed'});
	Application.quit();
}

// ### === # ### === # ### === # ### === # ### === # ### === # ### === # ### === #
Application.getAssUserlist = function( callback )
{
	console.log( 'getAssUserlist' );
	Application.sas.getUsers( usersBack );
	function usersBack( res ) {
		console.log( 'getAssUserlist - usersBack', res );
	}
}

// What to do when quitting? Unshare.
Application.onQuit = function()
{
	Application.sas.close();
}


// === ###  === ###  === ###  === ###  === ###  === ###  === ###  === ###  ===

/*
	Display invite dialogue
*/
Application.createInvite = function() 
{
	if( Application.invView ) return;
	
	Application.invView = new View( {
		title: 'Invite a friend!',
		width: 480,
		height: 240
	} );

	Application.invView.onClose = function()
	{
		Application.invView = false;
	}

	var f = new File( 'Progdir:Templates/invite.html' );
	f.onLoad = function( data )
	{
		Application.getAvailableUsers( Application.updateInviteeList );
		if(Application && Application.invView ) Application.invView.setContent( data );
	}
	f.load();
};

// === ###  === ###  === ###  === ###  === ###  === ###  === ###  === ###  ===
/*
	load a list of connected user to display on the invite...
*/
Application.getAvailableUsers = function( callback )
{
	var req = {
		path : 'system.library/user/activewslist/',
		data : {
			usersonly : true,
		}
	};
	Application.conn.request( req, reqBack );
	function reqBack( res ) {
		console.log( 'getAvailableUsers - reqBack', res );
		if ( !res.userlist )
			return;
		
		var users = res.userlist.map( getName ).filter( notNull );
		callback( users );
		
		function getName( user ) {
			var name = user.username;
			if ( name === self.username )
				return null;
			
			return user.username;
		}
		
		function notNull( name ) { return !!name; }
	}
};


Application.updateInviteeList = function( userlist )
{
	console.log( 'our available invitees',userlist );
	if( Application.invView && typeof Application.invView .sendMessage == 'function' ) Application.invView .sendMessage( { command : 'update_invitees', users : userlist } );
}

// === ###  === ###  === ###  === ###  === ###  === ###  === ###  === ###  ===
/*
	callback for when shared Application Session SAS event occurs
*/
Application.sharedSessionEvent = function( evt )
{
	console.log('shared session event',evt);	
};

// Sends an invite to invitees - only for owners
function sendInvite( msg )
{
	
	Application.sas.invite( msg.user, i18n('i18n_join_whiteboard'), invBack );
	function invBack( res ) {
		console.log( 'invBack', res );
		if ( !res.invited || !res.invited.length )
			return;
		
		Application.addInvited( res.invited );
	}
};

// add invited users to board....
Application.addInvited = function( invitedNames )
{
	var invited = invitedNames.map( buildUser );
	Application.mainView.sendMessage( invited );
	function buildUser( invitee ) {
		var user = {
			command	    : 'adduser',
			username    : invitee.name,
			timeInvited : Date.now(),
		};
		return user;
	}
}


