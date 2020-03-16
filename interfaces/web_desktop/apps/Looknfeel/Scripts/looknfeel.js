/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Start her up!
Application.run = function( msg, iface )
{
	var w = new View( {
		title: i18n( 'i18n_look_and_feel_title' ),
		width: 700,
		height: 600
	} );
	this.mainView = w;
	
	var f = new File( 'Progdir:Templates/gui.html' );
	
	var icons = [
		'archive', 'at', 'bank', 'calendar', 'envelope', 'folder', 'image', 
		'industry', 'leaf', 'life-ring', 'lightbulb-o', 'map', 'mortar-board', 
		'newspaper-o', 'music', 'paint-brush', 'paper-plane', 'pencil', 'phone',
		'pie-chart', 'podcast', 'print', 'puzzle-piece', 'shield', 'ship', 
		'shopping-bag', 'shopping-basket', 'shopping-cart', 'sitemap',
		'social-home', 'star', 'sticky-note', 'tachometer', 'terminal',
		'truck', 'tty'
	];
	var out = '<div class="Choice"><span>Default</span></div>';
	for( var a = 0; a < icons.length; a++ )
	{
		out += '<div class="Choice"><span class="IconSmall fa-' + icons[ a ] + '"></span></div>';
	}
	f.replacements = { 'workspace_labels': out };
	
	f.i18n();
	
	f.onLoad = function( data )
	{
		w.setContent( data );
	}
	f.load();

	// Set app in single mode
	this.setSingleInstance( true );	
	
	w.onClose = function()
	{
		Application.quit();
	}
}
