/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function()
{
	setTimeout( function()
	{
		ge( 'SearchId' ).focus();
	}, 20 );
	
	window.addEventListener( 'keydown', function( e )
	{
		if( e.which == 27 )
		{
			CloseView();
		}
	}, false );
}

function searchFor()
{
	var keys = ge( 'SearchId' ).value;
	
	Application.sendMessage( {
		command: 'search',
		keywords: keys
	} );
}

function replaceNum( what )
{
	var keys = ge( 'SearchId' ).value;
	var whar = ge( 'SearchReplace' ).value;
	
	if( ge( 'replaceall' ).checked )
	{
		Application.sendMessage( {
			command: 'replace',
			all: true,
			keywords: keys,
			replacement: whar
		} );
	}
	else
	{
		Application.sendMessage( {
			command: 'replace',
			all: false,
			keywords: keys,
			replacement: whar
		} );
	}
}

ge( 'SearchId' ).onkeydown = function( e )
{
	var w = e.which ? e.which : e.keyCode;
	if( w == 13 )
	{
		searchFor();
		ge( 'SearchId' ).blur();
		ge( 'searchFor' ).focus();
	}
}

