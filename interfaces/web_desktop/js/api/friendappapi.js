/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Friend New API definition - Application level
 * 
 * @author FL (Francois Lionet)
 * @date first pushed on 19/08/2018
 */

Friend = window.Friend || {};

// Returns the documentation about this function...
Friend.getFunctionDocumentation = function( functionPath, options, callback, extra )
{
};
Friend.includeCode = function( code, callback, extra )
{
	var blob = new Blob( [ code ], { type: 'plain/text' } );
	var urlCreator = window.URL || window.webkitURL;
	var url = urlCreator.createObjectURL( blob );

	var element = document.createElement( 'script' );
	element.onload = onLoad;
	element.onError = onError;					// Not on all browsers
	element.src = url;
	var head = document.getElementsByTagName( 'head' )[ 0 ];
	head.appendChild( element ); 		// Adds to the document

	function onLoad()
	{
		callback( true, code, extra );
	};
	function onError()
	{
		callback( false, 'ERROR - Unknown error', extra );
	};
}
Friend.exportAPI = function( applicationId, options, callback, extra )
{
	var args = [];
	var callback;
	for ( var a = 0; a < arguments.length; a++ )
	{
		if ( a == 2 )
		{
			callback = arguments[ a ];
			args.push( doInclude );
		}
		else
			args.push( arguments[ a ] )
	}
	CallLowLevelAPI( args, 'Friend.getAPI', [ 'applicationId', 'options', 'callback', 'extra' ], { tags: '#direct #callback ' } );
	function doInclude( response, data, extra )
	{
		if ( response )
		{
			Friend.includeCode( data, callback, extra );
		}
		else
		{
			callback( response, data, extra );
		}
	}
};
