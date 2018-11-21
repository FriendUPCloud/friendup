/*©agpl*************************************************************************
 *                                                                              *
 * Friend Unifying Platform                                                     *
 * ------------------------                                                     *
 *                                                                              *
 * Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *
 * Hillevaagsveien 14, 4016 Stavanger, Norway                                   *
 * Tel.: (+47) 40 72 96 56                                                      *
 * Mail: developer@friendup.cloud                                               *
 *                                                                              *
 *****************************************************************************©*/

Application.run = function( msg )
{
	var self = this;
	
	this.mainView = new View(
		title: 'Workflows',
		width: 1200,
		height: 960
	);
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		self.mainView.setContent( data );
	}
	f.load();
}

