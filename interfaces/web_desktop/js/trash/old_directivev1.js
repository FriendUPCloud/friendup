/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* Execute a server directive ----------------------------------------------- */

function ExecuteDirective ( directive, data )
{
	var j = new cAjax();
	j.open( 'post', 'admin.php?module=files&command=directive', true, true );
	j.addVar( 'query', directive );
	if ( typeof( data ) == 'object' )
		j.addVar( 'jsondata', JSON.stringify ( data ) );
	else j.addVar( 'data', data );
	j.onload = function()
	{
		if( this.returnCode == 'ok' )
		{
			// DUMB fuck API v1 check
			if( this.returnData.match( /API[\s]+\=[\s]+['"]v1['"]/ ) )
			{
				var d = this.returnData;
				var ifr = document.createElement( 'iframe' );
				ifr.setAttribute( 'sandbox', 'allow-same-origin allow-forms allow-scripts allow-pointer-lock' );
				ifr.onload = function()
				{
					var doc;
					if( this.contentDocument )
						doc = this.contentDocument;
					else doc = this.contentWindow.document;
					
					// Assign API
					doc.api = FriendAPI;
					
					// Add script (without script tags)
					var scr = doc.createElement( 'script' );
					scr.innerHTML = d.split( /\<[/]{0,}script[^>]*\>/i ).join ( '' );
					doc.body.appendChild( scr );
					
					AddApplicationFrame( data, ifr );
				}
				document.body.appendChild( ifr );
			}
			else
			{
				RunScripts( this.returnData );
			}
		}
		else Ac2Alert( i18n('Could not interpret directive.')  );
	}
	j.send ();
}

