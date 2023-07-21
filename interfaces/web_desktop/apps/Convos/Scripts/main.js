/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

serverQueue = [];

Application.run = function( msg ){
	
	this.setSingleInstance( true );

	let v = new View( {
		title: 'Convos',
		assets: [
			'Progdir:Markup/main.html'
		],
		background: 'transparent',
		width: 1100,
		height: 720,
		'min-width': 360,
		'min-height': 360,
		quitOnClose: true
	} );
	v.onClose = function()
	{
	    Application.quit();
	}
	this.view = v;
	
	if( msg.args )
	{
	    if( msg.args.sender )
	    {
	        serverQueue.push( msg.args );
	    }
	}
};

Application.receiveMessage = function( msg )
{
    if( msg.command )
    {
        if( msg.command == 'servermessage' )
        {
            this.view.sendMessage( msg.data );
        }
        else if( msg.command == 'app-ready' )
        {
            for( let a = 0; a < serverQueue.length; a++ )
            {
                this.view.sendMessage( serverQueue[ a ] );
            }
            serverQueue = [];
        }
    }
}


