/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*
	Uses the system module with the getlogs command..
*/

Sections.server_logs = function( cmd, extra )
{
	console.log( cmd, extra );
	if( cmd )
	{
		
	}
	else
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				ge( 'LogOutput' ).innerHTML = '<p>Error finding logs.</p>';
				return;
			}
			
			try
			{
				var logs = JSON.parse( d );
				logs = logs.logs;
				var str = '';
				for( var a = 0; a < logs.length; a++ )
				{
					var date = new Date( logs[ a ].DateModified );
					var year = date.getFullYear();
					var month = StrPad( date.getMonth() + 1, 2, '0' );
					var day = date.getDate();
					var fsize = Math.floor( logs[ a ].Filesize / 1024 );
					str += '<div class="HRow PaddingSmall">\
								<div class="HContent40 FloatLeft">\
									' + logs[ a ].Filename + '\
								</div>\
								<div class="HContent20 FloatLeft">\
									' + year + '-' + month + '-' + day + '\
								</div>\
								<div class="HContent20 FloatLeft">\
									' + fsize + 'kb\
								</div>\
							</div>';
				}
				ge( 'LogOutput' ).innerHTML = str;
			}
			catch( e )
			{
				ge( 'LogOutput' ).innerHTML = '<p>Error finding logs.</p>';
			}
			
		}
		m.execute( 'getlogs', { authid: Application.authId } );
	}
}
