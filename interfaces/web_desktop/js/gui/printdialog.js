/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Printdialog = function( flags, triggerfunc )
{
	var title = i18n( 'i18n_print' );
	if( !flags ) flags = {};
	if( flags.title )
		title = flags.title;
	
	var m = new Module( 'print' );
	m.onExecuted = function( e, d )
	{
		if( e != 'ok' )
		{
			Alert( i18n( 'i18n_print_failed' ), i18n( 'i18n_system_administrator_no_printers' ) );
			return;
		}
		try
		{
			var v = new View( {
				title: title,
				width: 700,
				height: 400
			} );
			
			var printers = JSON.parse( d );
		
			console.log( printers );
			var out = '';
			for( var a = 0; a < printers.length; a++ )
			{
				out += '<div class="Printer HRow BorderBottom">';
				out += '<p class="Padding"><strong>' + printers[a].name + '</strong></p>';
				out += '</div>';
			}
		
			var f = new File( 'System:templates/print.html' );
			f.replacements = { 'printers': out };
			f.i18n();
			f.onLoad = function( data )
			{
				v.setContent( data );
			}
			f.load();
		
		}
		// TODO: Make unique error message
		catch( e )
		{
			Alert( i18n( 'i18n_print_failed' ), i18n( 'i18n_system_administrator_no_printers' ) );
			return;
		}
	}
	m.execute( 'listprinters' );
};
