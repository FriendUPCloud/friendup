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
			function doPrint( printer )
			{
				var m = new Module( 'print' );
				m.onExecuted = function( e, d )
				{
					if( e == 'ok' )
					{
						Alert( i18n( 'i18n_print_sent' ), i18n( 'i18n_print_sent_to_printer' ) );
						v.close();
					}
					else
					{
						Alert( i18n( 'i18n_print_error' ), i18n( 'i18n_print_error_desc' ) );
					}							
				}
				m.execute( 'print', { file: flags.path, id: printer.id } );
			}
			
			var printers = JSON.parse( d );

			// Just print when the only printer available has no confirmation flag
			if( printers.length == 1 && printers[0].Confirmation != true )
			{
				doPrint( printers[ 0 ] );
				return;
			}
			
			var v = new View( {
				title: title,
				width: 700,
				height: 400
			} );
			
			v.onClose = function()
			{
				if( flags.mainView )
					flags.mainView.activate();
			}

			var f = new File( 'System:templates/print.html' );
			f.i18n();
			f.onLoad = function( data )
			{
				v.setContent( data, function()
				{
					var printersList = v.content.getElementsByClassName( 'Printers' );
					if( printersList )
					{
						printersList = printersList[0];
						for( var a = 0; a < printers.length; a++ )
						{
							var d = document.createElement( 'div' );
							d.innerHTML = '<div class="Padding"><span class="IconSmall FloatLeft fa-print"></span> <strong>' + printers[a].name + '</strong></div>';
							d.className = 'Printer HRow BorderBottom' + ( a == 0 ? ' Selected' : '' );
							d.onclick = function()
							{
								selectIt( this );
							}
							d.printer = printers[a];
							printersList.appendChild( d );
						}
						
						function selectIt( dr )
						{
							for( var a = 0; a < printersList.childNodes.length; a++ )
							{
								if( printersList.childNodes[ a ] == dr )
								{
									dr.classList.add( 'Selected' );
								}
								else if( printersList.childNodes[ a ].classList )
								{
									printersList.childNodes[ a ].classList.remove( 'Selected' );
								}
							}
						}
					}
					
					var print = v.content.getElementsByClassName( 'print-button' );
					if( print.length )
					{
						print[0].onclick = function()
						{
							if( printersList )
							{
								var printer = printersList.getElementsByClassName( 'Selected' );
								if( printer.length )
								{
									if( printer[0].printer )
									{
										doPrint( printer[0].printer );
									}
								}
							}
						}
					}
					
					var cancel = v.content.getElementsByClassName( 'fa-remove' );
					if( cancel.length )
					{
						cancel[0].onclick = function()
						{
							v.close();
							if( triggerfunc )
							{	
								triggerfunc( false );
							}
						}
					}
				} );
				
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
