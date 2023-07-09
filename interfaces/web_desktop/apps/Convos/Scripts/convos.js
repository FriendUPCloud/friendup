/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

window.Convos = {
	outgoing: [],
	sounds: {}
};

Application.run = function( msg )
{
	this.holdConnection( { method: 'messages', roomType: 'jeanie' } );
	// We loaded!
	this.sendMessage( { command: 'app-ready' } );
} 

Application.receiveMessage = function( msg )
{
    if( msg.sender )
    {
        let overview = FUI.getElementByUniqueId( 'convos' );
        overview.activateDirectMessage( msg.sender );
    }
}

Application.playSound = function( snd )
{
    if( !Convos.sounds[ snd ] )
    {
        Convos.sounds[ snd ] = new AudioObject( snd, function()
        {
            Convos.sounds[ snd ].play();
        } );
    }
    else
    {
        Convos.sounds[ snd ].play();
    }
}

// Start polling
Application.holdConnection = function( flags )
{
	let self = this;
	
	let args = {};
	
	// Apply flags
	if( flags )
	{
	    for( let a in flags )
	        args[ a ] = flags[ a ];
	}
	
	let pid = Math.floor( Math.random() * 1000 );
	
	// Push outgoing messages to args
	if( Convos.outgoing.length )
	{
		args.outgoing = Convos.outgoing;
		Convos.outgoing = [];
		//console.log( 'REGISTERING OUTGOING MESSAGES (' + pid + ').' );
	}
	
	if( args.outgoing || args.method )
    {
        //console.log( '[skip long poll] We are going for it!' );
    }
    else
    {
        //console.log( '[long poll mode] We are in long poll mode!' );
    }
	
	// In this case, we are blocking new calls (longpolling)
	if( !( args.outgoing || args.method ) )
	{
	    if( this.blocking )
	    {
            //console.log( '[blocking] We are blocking this call. (' + pid + ')' );
	        return;
        }
    	this.blocking = true;
	}
	
	let now = Math.floor( new Date().getTime() / 1000 );
	
	let m = new XMLHttpRequest();
	m.open( 'POST', '/system.library/module/?module=system&command=convos&authid=' + Application.authId + '&args=' + JSON.stringify( args ), true );
	m.onload = function( data )
	{
	    if( args.outgoing && args.outgoing.length )
	    {
	        // Alert the other user
            let musers = [];
            let messages = [];
            for( let b = 0; b < args.outgoing.length; b++ )
            {
                let found = false;
                for( let c = 0; c < musers.length; c++ )
                {
                    if( args.outgoing[ b ].targetId == musers[ c ] )
                    {
                        found = musers[ c ];
                        break;
                    }
                }
                if( !found )
                {
                    musers.push( args.outgoing[ b ].targetId );
                    messages.push( args.outgoing[ b ].message );
                }
            }
            
            if( musers.length > 0 )
            {
                for( let b = 0; b < musers.length; b++ )
                {
                    if( typeof( musers[ b ] ) != 'undefined' )
                    {
                        let amsg = {
                            'appname': 'Convos',
                            'dstuniqueid': musers[ b ],
                            'msg': '{"sender":"' + Application.fullName + '","message":"' + messages[ b ] + '"}'
                        };
                        let m = new Library( 'system.library' );
                        m.execute( 'user/session/sendmsg', amsg );
                    }
                }
            }
	    }
	
	    if( self.blocking && !( args.outgoing || args.method ) )
    	    self.blocking = false;
	    
	    if( this.response )
		{
		    let js = JSON.parse( this.response.split( '<!--separate-->' )[1] );
		    if( js && js.response == 1 )
		    {
		        if( js.messages && js.messages.length > 0 )
		        {
		            let mess = FUI.getElementByUniqueId( 'messages' );
		            mess.addMessages( js.messages );
		            if( mess.clearQueue ) mess.clearQueue();
		        }
		    }
		    // Response from longpolling
		    else if( js && js.response == 200 )
		    {
		        // Good.
		    }
		}
		// Restart polling
		Application.holdConnection();
	}
	m.send();
}
