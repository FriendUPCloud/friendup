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
	new Minesweeper( window.Application, m, i );
}

const Minesweeper = function( app, msg, iface )
{
	const self = this;
	self.app = app;
	self.main = null;
	
	self.init();
}

Minesweeper.prototype.init = function() {
	const self = this;
	self.main  = new View( {
		title: 'Minesweeper',
		width: 550,
		height: 700
	});
	
	self.main.onClose = function()
	{
		console.log( 'onClose' );
		Application.quit();
	}
	
	var tmpl = new File( 'Progdir:main.html' );
	tmpl.load();
	tmpl.onLoad = function( data )
	{
		self.main.setContent( data );
	}
}

