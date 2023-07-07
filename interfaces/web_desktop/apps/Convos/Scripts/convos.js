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
		        FUI.getElementByUniqueId( 'messages' ).refreshMessages();
		    }
		}
		// Restart polling
		Application.holdConnection();
	}
	m.send();
}
