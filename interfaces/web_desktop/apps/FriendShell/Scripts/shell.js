/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*******************************************************************************
*                                                                              *
* The FriendUP simple shell client                                             *
* --------------------------------                                             *
*                                                                              *
* version: 1.0                                                                 *
*                                                                              *
*******************************************************************************/

// Extend the applicatino object with a run function
Application.run = function( packet ) 
{
	this.fileName = 'test1';
	var w = new View( { 
		title:  'New Shell', 
		width:  650,
		height: 340,
		scrollable: true,
		transparent: true
	} );
	this.view = w;
	w.onClose = function(){ Application.quit(); }
	
	// Setup terminal shell instance
	if ( typeof ( window.shell_instances ) == 'undefined' )
		window.shell_instances = [];
	for( var a = 1; a < 9999; a++ )
	{
		if ( typeof ( window.shell_instances[a] ) == 'undefined' || !window.shell_instances[a] )
		{
			window.shell_instances[a] = true;
			break;
		}
	}
	w.instanceId = a;
	w.setFlag( 'title', 'New Shell' );
	w.currentPath = 'System:';
	w.currentCLI = false;
	w.cliTemplate = false;
	w.instanceNum = a;
	w.getInstanceNum = function()
	{
		return this.instanceNum;
	}
	w.onClose = function()
	{
		function doQuit()
		{
			w.onClose = null;
			Application.quit();
		}
		
		var msg = {
			command: 'quit_shell',
			callbackId: addCallback( doQuit )
		};
		
		w.sendMessage( msg );
		return false;
	}

	// Load resources
	var f = new File( 'Progdir:Templates/terminal.html' );
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			if( packet.args )
			{
				w.sendMessage( {
					command: 'execute',
					args: packet.args
				} );
			}
		} );
	}
	f.load();
};

Application.receiveMessage = function( msg )
{
	if( msg.command )
	{
		switch( msg.command )
		{
			case 'activate':
				this.view.activate();
				break;
			case 'quit':
				this.quit();
				break;
			case 'listapplications':
				this.view.sendMessage( { command: 'applicationlist', data: msg.data } );
				break;
			case 'settitle':
				this.view.setFlag( 'title', msg.text );
				break;
		}
	}
};


