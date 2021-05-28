/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = ( m, i ) => {
	new CallThings( window.Application, m, i );
}

const CallThings = function( app, msg, iface )
{
	const self = this;
	console.log( 'CallThings', [ app, msg, iface ]);
	self.app = app;
	self.main = null;
	
	self.init();
}

CallThings.prototype.init = function() {
	const self = this;
	self.main  = new View( {
		title: i18n( 'i18n_callthings' ),
		width: 500,
		height: 600
	});
	
	self.main.onClose = function()
	{
		console.log( 'onClose' );
		Application.quit();
	}
	
	var tmpl = new File( 'Progdir:Templates/mainview.html' );
	tmpl.load();
	tmpl.onLoad = function( data )
	{
		self.main.setContent( data );
	}
	
	// Set app in single mode
	self.app.setSingleInstance( true );
}

Application.receiveMessage = function( msg )
{
	/*
	if( msg.command )
	{
		if( msg.command == 'cancelappwindow' )
		{
			this.mv.sendMessage( msg );
		}
		if( msg.command == 'updateapppermissions' )
		{
			this.mv.sendMessage( msg );
		}
	}
	*/
}

