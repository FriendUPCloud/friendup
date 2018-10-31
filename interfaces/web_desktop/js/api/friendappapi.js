/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
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
