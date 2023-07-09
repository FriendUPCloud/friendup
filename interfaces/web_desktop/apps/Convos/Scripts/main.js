/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg ){
	let v = new View( {
		title: 'Convos',
		assets: [
			'Progdir:Markup/main.html'
		],
		background: 'transparent',
		width: 800,
		height: 600,
		quitOnClose: true,
		singleInstance: true
	} );
	v.onClose = function()
	{
	    Application.quit();
	}
	this.view = v;
	
	if( msg.args )
	{
	    setTimeout( function()
	    {
	        Application.receiveMessage( { command: 'servermessage', data: msg.args } );
        }, 1250 );
	}
};

Application.receiveMessage = function( msg )
{
    if( msg.command && msg.command == 'servermessage' )
    {
        this.view.sendMessage( msg.data );
    }
}


