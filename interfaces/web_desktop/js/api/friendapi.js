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
 * Friend New API definition - Low level
 * 
 * This source must be the second after namespace.js!
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 19/08/2018
 */

// Root of the API
Friend = window.Friend || {};

// Current versions of the API
Friend.APIVersion = '1.2';
Friend.APIVersionMinimal = '1.2';			// We might want to change that one day when the number of versions gets too high
											// but we should not really...

// API Variables
Friend.APIDefinition = {};
Friend.NORETURN = 'noReturn';
Friend.ERROR = 'error';

// Friend API engine - only possible in Javascript! (Y) :)
//////////////////////////////////////////////////////////////////////////////

// To be called at first pass of Javascript
Friend.addToAPI = function( functionPath, argumentNames, properties, parentClass )
{
	var definition = {};

	definition.functionName = functionPath.substring( functionPath.lastIndexOf( '.' ) + 1 );
	definition.functionPath = functionPath;
	definition.argumentNames = argumentNames;		// Can be ommited
	definition.properties = properties;
	if ( !parentClass )
		parentClass = Friend;

	// Find the position of the callback
	definition.callbackPosition = -1;
	for ( var n = 0; n < argumentNames.length; n++ )
	{
		if ( argumentNames[ n ] == 'callback' )
		{
			definition.callbackPosition = n;
			break;
		}
	}
	definition.numberOfArguments = argumentNames.length;
	definition.isDirect = ( properties.tags.indexOf( '#direct' ) >= 0 );
	definition.isCallback = ( properties.tags.indexOf( '#callback' ) >= 0 );

	// Find the function
	var functionClass;
	if ( properties.redirection )
	{
		functionClass = GetClass( properties.redirection.functionPath, parentClass );
	}
	else
	{
		functionClass = GetClass( functionPath, parentClass );
	}

	// Add to API!
	if ( functionClass )
	{
		definition.klass = functionClass;
		parentClass.APIDefinition[ functionPath ] = definition;
		return true;
	}
	return 'ERROR - API function not found: ' + functionPath;
};

Friend.removeFromAPI = function( functionPath )
{
	if ( Friend.APIDefinition[ functionPath ] )
	{
		Friend.APIDefinition = Friend.Utilities.cleanArray( Friend.APIDefinition, Friend.APIDefinition[ functionPath ] );
		return true;
	}
	console.log( 'ERROR - API function not found: ' + functionPath );
	return false;
}

// Create a sourcecode with the API definition, to add to your view/iFrame
Friend.getAPI = function( applicationId, options, callback, extra )
{
	var source = "";
	source += "/*******************************************************************************\n";
 	source += "*                                                                              *\n";
 	source += "* Friend Unifying Platform                                                     *\n";
 	source += "* ------------------------                                                     *\n";
 	source += "*                                                                              *\n";
 	source += "* Copyright 2014-2017 Friend Software Labs AS, all rights reserved.            *\n";
 	source += "* Hillevaagsveien 14, 4016 Stavanger, Norway                                   *\n";
 	source += "* Tel.: (+47) 40 72 96 56                                                      *\n";
 	source += "* Mail: info@friendos.com                                                      *\n";
 	source += "*                                                                              *\n";
 	source += "********************************************************************************/\n";
	source += "/** @file\n";
 	source += "*\n";
 	source += "* Friend API - Application level\n";
 	source += "*/\n";

	// Get the good version...
	var version = Friend.APIVersion;
	if ( options.version )
		version = options.version;
	var pos = version.indexOf( '.' );
	if ( Friend.APIVersion == version )
	{
		// Simple, use the current API
		doExport( Friend.APIDefinition, Friend );
	}
	else
	{
		// Convert dots into underscore
		while ( pos >= 0 )
		{
			version = version.substring( 0, pos ) + '_' + version.substring( pos + 1 );
			pos = version.indexOf( '.', pos + 1 );
		};

		// Load file from server
		Friend.DOS.loadFile( 'System:js/api/apiv' + version + '.js', {}, function( response, data, extra )
		{
			if ( !response )
			{
				callback( false, 'ERROR - API not found.', extra );
			}

			// Creates the APIDefinition from the code
			var fakeFriend = 
			{ 
				Friend: {}
			};
			var scanner = new Friend.Utilities.TextScanner( data, {} );
			var definition = {};
			var line = scanner.getLine( { next: true } );
			while( line )
			{
				if ( line.indexOf( 'Friend.' ) == 0 )
				{
					// Direct source?
					if ( line.indexOf( 'Friend.APIDirectSources' ) == 0 ) 	
					{
						var pos = line.indexOf( 'System:' );
						if ( pos )
						{
							var end = line.indexOf( "'", pos );
							fakeFriend.APIDirectSource.push( line.substring( start, end ) );
						}
					}
					else if ( line.indexOf( 'Friend.addToAPI' ) == 0 )
					{
						// Function definitions
						var parser = new Friend.Utilities.CodeParser( line, {} );
						parser.setSection( '(', ')' );
						var functionPath = parser.getNextToken().value;
						var parameters = parser.getNextToken().value;
						var options = parser.GetNextToken();
						var error = Friend.addToAPI( functionPath, parameters, options, fakeFriend );
						if ( error )
						{
							callback( false, error, extra );
							return;
						}
					}
				}
			};
			doExport( definition, fakeFriend );	
		} );
	}
	function doExport( definition, parent )
	{
		// HOGNE: We need to filter the entry based on the authorisations of the application!		
		if ( true )
		{
			// Only specific APIs?
			if ( options.APIs && options.APIs.length )
			{
				for ( var a = 0; a < options.APIs.length; a++ )
				{
					var api = options.APIs[ a ];
					for ( var d = 0; d < parent.APIDefinition.length; d++ )
					{
						var definition = parent.APIDefinition[ d ];
						if ( definition.indexOf( api ) == 0 )
						{
							doExportDefinition( definition, parent );
						}
					}
				}
			}
			else
			{
				// All the APIs
				for ( var d in Friend.APIDefinition )
				{
					doExportDefinition( Friend.APIDefinition[ d ], parent );			
				}
			}

			// Add the functions defined in plain in the sourcecode -> duplication up and down...
			if ( !options.noDirectCode )
			{
				for ( var s = 0; s < parent.APIDirectSources.length; s++ )
				{
					var path = parent.APIDirectSources[ s ];
					Friend.DOS.loadFile( path, {}, function( response, code, extra )
					{
						if ( response )
						{
							var markerStart = 'APIDIRECTCODESTART';
							var markerEnd = 'APIDIRECTCODEEND';
							var start = code.indexOf( markerStart );
							if ( start >= 0 )
							{
								var end = code.indexOf( markerEnd );
								if ( end >= 0 )
								{
									code = code.substring( start + markerStart.length, end );
									source += code;
								}
							}
							callback( true, source, extra );
						}
						else
						{	
							callback( false, 'ERROR - Cannot load source from server.', extra );
							console.log( 'ERROR - Cannot load source from server: ' + path );
						}
					} );
				}
			}
			else
			{
				callback( true, source, extra );
			}
		}
	}
	function doExportDefinition( definition )
	{
		// Check that the class is already defined
		var dot = definition.functionPath.indexOf( '.' );
		while ( dot >= 0 )
		{
			var name = definition.functionPath.substring( 0, dot );
			if ( source.indexOf( name + '.' ) < 0 )
			{
				source += name + ' = window.' + name + ' || {};\n'; 
			}
			dot = definition.functionPath.indexOf( '.', dot + 1 );
		}
		
		// Call the API!
		source += definition.functionPath + ' = function( ';
		for ( var p = 0; p < definition.argumentNames.length; p++ )
		{
			if ( p > 0 )
				source += ', ';
			source += definition.argumentNames[ p ];
		}
		source += ' )\n';
		source += '{\n';

		source += '	CallLowLevelAPI( arguments, ';
		source += "'" + definition.functionPath + "', [ ";
		for ( p = 0; p < definition.argumentNames.length; p++ )
		{
			if ( p > 0 )
				source += ', ';
			source += "'" + definition.argumentNames[ p ] + "'";
		}
		source += " ],{ tags: '" + definition.properties.tags + "' } );\n";
		source += '};\n';
	}
}

// Called by APIWrapper.js
Friend.callAPIFunction = function( msg )
{
	// Get information from message
	var messageInfo = {};
	if( msg.applicationId )
	{
		messageInfo.view = GetContentWindowByAppMessage( findApplication( msg.applicationId ), msg );
		messageInfo.applicationId = msg.applicationId;
		if( msg.applicationName )
			messageInfo.applicationName = msg.applicationName;
		messageInfo.viewId = msg.viewId;
		messageInfo.callback = msg.callback;
	}

	// Call the function
	var definition = Friend.APIDefinition[ msg.method ];
	if( definition )
	{
		// Replace callback by local callback
		if( definition.callbackPosition >= 0 )
			msg.arguments[ definition.callbackPosition ] = thisCallback;

		// Up to 10 arguments (Javascript -> pass more in objects)
		switch( definition.numberOfArguments )
		{
			case 0:
				ret = definition.klass();
				break;
			case 1:
				ret = definition.klass( msg.arguments[ 0 ] );
				break;
			case 2:
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ] );
				break;
			case 3:
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ] );
				break;
			case 4:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ] );
				break;
			case 5:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ] );
				break;
			case 6:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ],
										msg.arguments[ 5 ] );
				break;
			case 7:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ],
										msg.arguments[ 5 ],
										msg.arguments[ 6 ] );
				break;
			case 8:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ],
										msg.arguments[ 5 ],
										msg.arguments[ 6 ],
										msg.arguments[ 7 ] );
				break;
			case 9:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ],
										msg.arguments[ 5 ],
										msg.arguments[ 6 ],
										msg.arguments[ 7 ],
										msg.arguments[ 8 ] );
				break;
			case 10:	
				ret = definition.klass( msg.arguments[ 0 ], 
										msg.arguments[ 1 ],
										msg.arguments[ 2 ],
										msg.arguments[ 3 ],
										msg.arguments[ 4 ],
										msg.arguments[ 5 ],
										msg.arguments[ 6 ],
										msg.arguments[ 7 ],
										msg.arguments[ 8 ],
										msg.arguments[ 9 ] );
				break;
		}

		// If value is by return, send the message back...
		if( definition.isDirect )
		{
			// Except for double access functions, when it is returned by callback.
			if( ret != Friend.NORETURN )
			{
				var nmsg = 
				{
					command: definition.functionName + 'Response',
					response: ret == Friend.ERROR ? false : true,
					data: ret,
					extra: msg.extra,
					isFriendAPI: true
				};
				sendItBack( nmsg );
			}
		}
		function thisCallback( response, data, extra )
		{
			var nmsg = 
			{
				command: definition.functionName + 'Response',
				response: response,
				data: data,
				extra: extra,
				isFriendAPI: true
			};
			sendItBack( nmsg );
		}
	}
	else
	{
		// API Function not found
		var functionName = msg.method.substring( msg.method.lastIndexOf( '.' ) + 1 );
		var nmsg = 
		{
			command: functionName + 'Response',
			response: false,
			data: 
			{
				error: 'ERROR - API function not found.'
			},
			extra: false,
			isFriendAPI: true
		};
		sendItBack( nmsg );
	}
	function sendItBack( message )
	{
		if ( typeof messageInfo.callback == 'function' )
		{
			messageInfo.callback( message );
			return;
		}
		if ( messageInfo.view )
		{
			if ( typeof messageInfo.callback == 'string' )
			{
				message.type = 'callback';
				message.callback = messageInfo.callback;
			}
			message.applicationId = messageInfo.applicationId;
			message.viewId = messageInfo.viewId;
			messageInfo.view.postMessage( JSON.stringify( message ), '*' );
		}
	}
};

GetClass = function( source, root )
{
	var start = 0;
	var end = source.indexOf( '.' );
	if ( end < 0 ) 
		end = source.length;
	var klass = window[ source.substring( start, end ) ];
	if ( typeof klass == 'undefined' )
		return null;
	while( end < source.length )
	{
		start = end + 1;
		end = source.indexOf( '.', start ), source.length;
		if ( end < 0 ) 
			end = source.length;
		klass = klass[ source.substring( start, end ) ];
		if ( typeof klass == 'undefined' )
			return null;
	};
	return klass;
};

// Returns the documentation about this function...
Friend.getFunctionDocumentation = function( functionPath, options, callback, extra )
{
};

Friend.addToAPI( 'Friend.getAPI', [ 'applicationId', 'options', 'callback', 'extra' ], { tags: '#callback ' } );
Friend.addToAPI( 'Friend.getFunctionDocumenation', [ 'functionPath', 'options', 'callback', 'extra' ], { tags: '#direct #callback ' } );


