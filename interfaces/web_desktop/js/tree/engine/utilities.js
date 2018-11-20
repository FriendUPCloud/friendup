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
 * Tree engine Utilities
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 18/08/2017
 */
Friend = window.Friend || {};

Friend.Tree.Utilities = function( flags )
{
    this.tree = flags.tree;
	this.renderer = flags.renderer;
	Object.assign( this, Friend.Tree.Utilities );
};
Friend.Tree.Utilities.getUniqueIdentifier = function( name )
{
	var time = new Date().getTime();
	return name + '<' + time + Math.random() * 1000000 +'>';
};
Friend.Tree.Utilities.round = function ( number, decimals )
{
	var power = Math.pow( 10, decimals );
	var result = Math.round( number * power ) / power;
	return result;
};
Friend.Tree.Utilities.convertToHex = function ( number, decimals, prefix )
{
	var result = number.toString( 16 );
	while ( decimals && result.length < decimals )
		 result = '0' + result;
	if ( prefix )
		result = '0x' + result;
	return result;
};
Friend.Tree.Utilities.getPath = function ( path )
{
	var doubleDot = path.indexOf( ':' );
	if ( doubleDot >= 0 )
	{
		if ( path.substring( 0, doubleDot ) == 'Progdir' )
			path = getImageUrl( path );
	}
	return path;
};
Friend.Tree.Utilities.getFileName = function ( path )
{
	var slash = path.lastIndexOf( '/' );
	if ( slash >= 0 )
		return path.substring( slash + 1 );
	var doubleDot = path.indexOf( ':' );
	if ( doubleDot >= 0 )
		return path.substring( doubleDot + 1 );
	return path;
};
Friend.Tree.Utilities.getFileExtension = function ( path )
{
	var filename = this.getFileName( path );	
	var dot = filename.lastIndexOf( '.' );
	if ( dot >= 0 )
		return filename.substring( dot + 1 );
	return '';
};
Friend.Tree.Utilities.getNextPowerOfTwo = function ( v )
{
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
};
Friend.Tree.Utilities.isPowerOfTwo=function ( n )
{
	return n && (n & (n - 1)) === 0;
};
Friend.Tree.Utilities.assignToObject = function( destination, source )
{
	// Find the class from the name
	var klass = this.getClass( source );

	// Assigns the values
	for ( var property in klass )
		destination[ property ] = klass[ property ];

	return destination;
};
Friend.Tree.Utilities.getClass = function( source )
{
	// Assign the functions of the class
	var start = 0;
	var end = source.indexOf( '.' );
	if ( end < 0 )
		end = 10000;
	var klass = window[ source.substring( start, end ) ];
	if ( typeof klass == 'undefined' )
		return null;
	while( end < source.length )
	{
		start = end + 1;
		end = source.indexOf( '.', start );
		if ( end < 0 )
			end = 10000;
		klass = klass[ source.substring( start, end ) ];
		if ( typeof klass == 'undefined' )
			return null;
	};
	return klass;
};
Friend.Tree.Utilities.replaceObjectsByNames = function ( root, destination, object, safe )
{
	for ( var key in object )
	{
		var subObject = object[ key ];
		switch ( key )
		{
			case 'collisions':
			case 'processes':
				destination[ key ] = this.replaceObjectsByNames( root, [], subObject, true );
				break;
			case 'sound':
			case 'image':
				destination[ key ] = subObject;
				break;
			default:
				if ( this.isArray( subObject ) )
					destination[ key ] = this.replaceObjectsByNames( root, [], subObject, safe );
				else if ( this.isObject( subObject ) )
				{
					if ( subObject.className )
						destination[ key ] = { class: subObject.className, name: subObject.name, identifier: subObject.identifier };
					else if ( safe )
						destination[ key ] = this.replaceObjectsByNames( root, {}, subObject, safe );
					/*
					else if ( key == 'with' )
						destination[ key ] = this.replaceObjectsByNames( root, [], subObject, key );
					else if ( key == 'params' )
						destination[ key ] = this.replaceObjectsByNames( root, {}, subObject, key );
					*/
				}
				else
					destination[ key ] = subObject;
				break;
		}
	}
	return destination;
}
Friend.Tree.Utilities.replaceNamesByObjects = function ( root, object, destination )
{
	for ( var key in object )
	{
		var subObject = object[ key ];
		switch ( key )
		{
			case 'root':
                destination[ key ] = root;
                break;
			case 'caller':
				destination[ key ] = root.findItemFromName( subObject.name, root );
				break;
			default:
				if ( this.isObject( subObject ) )
				{
					if ( subObject.className )
						console.log( 'TODO: replaceNameByObject, replace by the real object...' );
					else if ( subObject.name && subObject.class )
					 	destination[ key ] = root.findItemFromNameAndClassName( subObject.name, subObject.class );
					else
						destination[ key ] = this.replaceNamesByObjects( root, subObject, {} );
				}
				else if ( this.isArray( subObject ) )
					destination[ key ] = this.replaceNamesByObjects( root, subObject, [] );
				else
					destination[ key ] = subObject;

				break;
		}
	}
	return destination;
};
Friend.Tree.Utilities.isObject = function( item )
{
    return typeof item != 'undefined' ? (typeof item === "object" && !Array.isArray(item) && item !== null) : false;
};
Friend.Tree.Utilities.isArray = function( item )
{
    return typeof item != 'undefined' ? item.constructor == Array : false;
};
Friend.Tree.Utilities.updateCommonProperties = function( object, flags )
{
	var refresh = false;
    if ( object[ flags[ property ] ] )
    {
        if ( object[ property ] != flags[ property ] )
        {
            object[ property ] = flags[ property ];
            refresh = true;
        }
	}
	return refresh;
};
Friend.Tree.Utilities.convertImageToBase64 = function( image )
{
	var canvas = document.createElement( 'canvas' );
	canvas.width = image.width;
	canvas.height = image.height;
	var context = canvas.getContext( '2d' );
	context.drawImage( image, 0, 0, image.width, image.height );
	return canvas.toDataURL();
};
Friend.Tree.Utilities.getPixelColor = function( imageData, x, y, width, height )
{
	var precision = 3;

	var red = 0;
	var green = 0;
	var blue = 0;
	var alpha = 0;
	var imageWidth = imageData.width;
	var data = imageData.data;
	for ( var xx = 0; xx < precision; xx += 1 )
	{
		for ( var yy = 0; yy < precision; yy += 1 )
		{
			//var data = context.getImageData( , , 1, 1 ).data;
			var xxx = Math.floor( x + ( width / precision ) * xx );
			var yyy = Math.floor( y + ( height / precision ) * yy );
			var address = ( xxx + yyy * imageWidth ) * 4; 			
			red += data[ address ];
			green += data[ address + 1 ];
			blue += data[ address + 2 ];
		}
	}
	precision = precision * precision;
	var result =
	{
		red: Math.floor( red / precision ),
		green: Math.floor( green / precision ),
		blue: Math.floor( blue / precision )
	};
	return result;
};
Friend.Tree.Utilities.getColorString = function( r, g, b )
{
	var red = Math.floor( r ).toString( 16 );
	if ( red.length == 1 )
		red = '0' + red;
	var green = Math.floor( g ).toString( 16 );
	if ( green.length == 1 )
		green = '0' + green;
	var blue = Math.floor( b ).toString( 16 );
	if ( blue.length == 1 )
		blue = '0' + blue;
	return '#' + red + green +  blue;
};
Friend.Tree.Utilities.getColorsFromString = function( color )
{
	var colors;
	if ( color.substring( 0, 1 ) == '#' )
	{
		colors = {};
		colors.red = parseInt( color.substring( 1, 3 ), 16 );
		colors.green = parseInt( color.substring( 3, 5 ), 16 );
		colors.blue = parseInt( color.substring( 5, 7 ), 16 );
	}
	return colors;
};
Friend.Tree.Utilities.multiplyRGBString = function( RGB, rMult, gMult, bMult )
{
	var colors = this.getColorsFromString( RGB );
	if ( typeof rMult != 'undefined' )
		colors.red *= Math.min( 255, rMult );
	if ( typeof gMult != 'undefined' )
		colors.green *= Math.min( 255, gMult );
	if ( typeof bMult != 'undefined' )
		colors.blue *= Math.min( 255, bMult );
	return this.getColorString( colors.red, colors.green, colors.blue );;
};

Friend.Tree.Utilities.trimString = function( str )
{
	while( str.substring( 0, 1 ) == ' ' )
		str = str.substring( 1 );
	while( str.substring( str.length - 1 ) == ' ' )
		str = str.substring( 0, str.length - 1 );
	return str;
};

Friend.Tree.Utilities.getSizeFromString = function( item, parent, propertyName, sizeString )
{
	var token, open, start, close, end, newItem, value;
	var destination = "" + sizeString;
	
	// Nothing to do: returns the current value
	if ( sizeString == 'none' )
		return item[ propertyName ];

	// Remove 'auto'
	start = destination.indexOf( '(auto)' );
	if ( start >= 0 )
	{
		destination = destination.substring( 0, start ) + destination.substring( start + 6 );
	}

	// Direct size
	end = destination.indexOf( 'px' );
	while ( end >= 0 )
	{
		// Makes sure there is a number before		
		if ( end > 0 && this.isNumber( destination.charAt( end - 1 ) ) )
		{
			// Removes the 'px', leave the number
			destination = destination.substring( 0, end ) + destination.substring( end + 2 );
			end = destination.indexOf( 'px' );
		}
	}

	// Percentages
	end = destination.indexOf( '%' );
	while ( end >= 0 )
	{
		// Get the number
		start = end - 1;
		while ( start >= 0 )
		{
			if ( !this.isNumber( destination.charAt( start ) ) )
				break;
			start--;
		}
		start++;
		var s = destination.substring( start, end );
		value = parseInt( s ) / 100;
		value = value * parent[ propertyName ];

		// Removes the '%', poke the resulting value
		destination = destination.substring( 0, start ) + value + destination.substring( end + 1 );
		end = destination.indexOf( '%', end );
	}

	// Computes the various tokens
	var tokens = [ '.width(', '.height(', 'depth(' ];	
	var functions = [ 'getWidth', 'getHeight', 'getDepth(' ];	
	for ( var t = 0; t < tokens.length; t++ )
	{
		token = tokens[ t ];
		start = destination.indexOf( token );
		while ( start >= 0 )
		{
			// Simple token?
			if ( token.indexOf( '(' ) < 0 )
			{

			}
			else
			{
				// Get the name of the object before the token, objectName.token(
				dot = start - 1;
				open = start + token.length;
				if ( start > 0 )
				{
					if ( destination.charAt( --start ) == '.' )
					{
						while ( start > 0 && ( this.isLetter( destination.charAt( start ) ) || this.isNumber( destination.charAt( start ) ) ) )
							start--;
						start++;
					}
				}
				if ( start == dot )
				{
					Friend.Tree.log( item, { level: Friend.Tree.ERRORLEVEL_BREAK, error: 'Syntax error in position string ' + positionString } );
				}
				else
				{
					name = destination.substring( start, dot );
					if ( name == 'this' )
						newItem = item;
					else
						newItem = parent.findFromName( name );
					close = destination.indexOf( ')', open ); 	// TODO: handle multiple parentheses
					if ( close >= 0 )
						close++;
				}
			}
			value = 0;
			if ( close >= open )
			{
				switch ( functions[ t ] )				
				{
					case 'getWidth':
						value = newItem.width;
						break;
					case 'getHeight':
						value = newItem.height;
						break;					
					case 'getDepth':
						value = newItem.depth;
						break;					
					default:
						Friend.Tree.log( item, { level: Friend.Tree.ERRORLEVEL_BREAK, error: 'Syntax error in size string at position ' + start + ':' + sizeString } );
						break;
				}
				destination = destination.substring( 0, open ) + Math.floor( value ) + destination.substring( close );
			}
			open = destination.indexOf( token, open );
		}
	}

	// Calc -> keep the content in brackets
	start = destination.indexOf( 'calc(' );
	while ( start >= 0 )
	{
		// Finds the closing brackets
		close = destination.indexOf( ')', start );
		if ( close > start )
		{
			destination = destination.substring( 0, start ) + destination.substring( start + 5, close ) + destination.substring( close + 1 );
		}		
		start = destination.indexOf( 'calc(' );			// Should not happen, but who knows!
	}

	// Calculates the result
	var result = eval( destination );
	return result;
};
Friend.tree.Utilities.getPositionFromString = function( item, parent, propertyName, positionString )
{
	// Nothing to do: returns the current value
	if ( sizeString == 'none' )
		return item[ propertyName ];

	var destination = '' + positionString;
	var tokens = [ 'left', 'right', 'center', 'top', 'bottom', 'front', 'back', 'width(', 'height(', 'depth(' ];
	var functions = [ 'getLeft', 'getRight', 'getCenter', 'getTop', 'getBottom', 'getFront', 'getBack', 'getWidth', 'getHeight', 'getDepth' ];
	var open, start, close, newItem;
	for ( var t = 0; t < tokens.length; t++ )
	{
		var token = tokens[ t ];
		start = destination.indexOf( token );
		while ( start >= 0 )
		{
			// Simple token
			if ( token.indexOf( '(' ) < 0 )
			{
				value = this[ functions[ t ]( item, parent, propertyName ) ];
				open = start;			
				close = start + token.length;
			}
			else
			{
				// Get the name of the object before the token, objectName.token(
				open = start;
				if ( start > 0 )
				{
					if ( destination.charAt( --start ) == '.' )
					{
						while ( start > 0 && this.isLetter( destination.charAt( start ) ) || this.isNumber( destination.charAt( start ) ) )
							start--;
						start++;
					}
				}
				if ( start == open )
				{
					Friend.Tree.log( item, { level: Friend.Tree.ERRORLEVEL_BREAK, error: 'Syntax error in position string ' + positionString } );
				}
				else
				{
					name = destination.substring( start, open );
					if ( name == 'this' )
						newItem = item;
					else
						newItem = parent.findFromName( name );
					close = destination.indexOf( ')', open ); 	// TODO: handle multiple parentheses
					if ( close >= 0 )
						close++;
				}
			}
			value = 0;
			if ( close >= open )
			{
				switch ( functions[ t ] )
				{
					case 'getLeft':
						value = 0;
						break;
					case 'getFront':
						value = 0;
						break;
					case 'getRight':
						value = parent.width - item.width;
						break;
					case 'getBack':
						value = parent.width - item.width;
						break;
					case 'getTop':
						value = 0;
						break;
					case 'getBottom':
						value = parent.height - item.height;
						break;
					case 'getCenter':
						if ( propertyName == 'x' )
							value = parent.width / 2 - item.width / 2;
						else if ( propertyName == 'y' )
							value = parent.height / 2 - item.height / 2;
						else if ( propertyName == 'z' )
							value = parent.depth / 2 - item.depth / 2;
						break;
					case 'getWidth':
						value = newItem.width;
						break;
					case 'getHeight':
						value = newItem.height;
						break;
					case 'getDepth':
						value = newItem.depth;
						break;
					default:
						Friend.Tree.log( item, { level: Friend.Tree.ERRORLEVEL_BREAK, error: 'Syntax error in position string ' + positionString } );
						break;
				}
			}
			destination = destination.substring( 0, start ) + Math.floor( value ) + destination.substring( close );
			start = destination.indexOf( token, start );
		}
	}

	// Calc -> keep the content in brackets
	start = destination.indexOf( 'calc(' );
	while ( start >= 0 )
	{
		close = destination.indexOf( ')', start );
		if ( close > start )
			destination = destination.substring( 0, start ) + destination.substring( start + 5, close ) + destination.substring( close + 1 );
		start = destination.indexOf( 'calc(' );			// Should not happen, but who knows!
	}

	// Calculates the result
	var result = eval( destination );
	return result;
};

// Check if a character is a number
Friend.Tree.Utilities.isNumber = function( c ) 
{
	var charWithoutAccent = removeDiacriticFromChar( c );
	return charWithoutAccent.match(/[0-9]/);
};

// Check if a character (UNICODE) is a letter (does not work for Chinese and Japanese)
Friend.Tree.Utilities.isLetter = function( c ) 
{
	var charWithoutAccent = removeDiacriticFromChar( c );
	return charWithoutAccent.match(/[a-z]/i);
};
Friend.Tree.Utilities.defaultDiacriticsRemovalap = 
[
    {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
    {'base':'AA','letters':'\uA732'},
    {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
    {'base':'AO','letters':'\uA734'},
    {'base':'AU','letters':'\uA736'},
    {'base':'AV','letters':'\uA738\uA73A'},
    {'base':'AY','letters':'\uA73C'},
    {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
    {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
    {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
    {'base':'DZ','letters':'\u01F1\u01C4'},
    {'base':'Dz','letters':'\u01F2\u01C5'},
    {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
    {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
    {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
    {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
    {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
    {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
    {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
    {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
    {'base':'LJ','letters':'\u01C7'},
    {'base':'Lj','letters':'\u01C8'},
    {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
    {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
    {'base':'NJ','letters':'\u01CA'},
    {'base':'Nj','letters':'\u01CB'},
    {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
    {'base':'OI','letters':'\u01A2'},
    {'base':'OO','letters':'\uA74E'},
    {'base':'OU','letters':'\u0222'},
    {'base':'OE','letters':'\u008C\u0152'},
    {'base':'oe','letters':'\u009C\u0153'},
    {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
    {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
    {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
    {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
    {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
    {'base':'TZ','letters':'\uA728'},
    {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
    {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
    {'base':'VY','letters':'\uA760'},
    {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
    {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
    {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
    {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
    {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
    {'base':'aa','letters':'\uA733'},
    {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
    {'base':'ao','letters':'\uA735'},
    {'base':'au','letters':'\uA737'},
    {'base':'av','letters':'\uA739\uA73B'},
    {'base':'ay','letters':'\uA73D'},
    {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
    {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
    {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
    {'base':'dz','letters':'\u01F3\u01C6'},
    {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
    {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
    {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
    {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
    {'base':'hv','letters':'\u0195'},
    {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
    {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
    {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
    {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
    {'base':'lj','letters':'\u01C9'},
    {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
    {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
    {'base':'nj','letters':'\u01CC'},
    {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
    {'base':'oi','letters':'\u01A3'},
    {'base':'ou','letters':'\u0223'},
    {'base':'oo','letters':'\uA74F'},
    {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
    {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
    {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
    {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
    {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
    {'base':'tz','letters':'\uA729'},
    {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
    {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
    {'base':'vy','letters':'\uA761'},
    {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
    {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
    {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
    {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
];
// Initialize the array when source loads...
Friend.Tree.Utilities.diacriticsMap = {};
for ( var i=0; i < Friend.Tree.Utilities.defaultDiacriticsRemovalap.length; i++ )
{
    var letters = Friend.Tree.Utilities.defaultDiacriticsRemovalap[i].letters.split( "" );
    for ( var j = 0; j < letters.length ; j++ )
	{
        Friend.Tree.Utilities.diacriticsMap[ letters[ j ] ] = Friend.Tree.Utilities.defaultDiacriticsRemovalap[ i ].base;
    }
}
Friend.Tree.Utilities.removeDiacriticFromChar = function( c ) 
{
    return this.diacriticsMap[ c ] || c; 
};


/**
 * rotateCoords
 *
 * Rotates a set of coordinates around a point
 *
 * @param (object) coords object containing the x: and y: coordinates
 * @param (number) rotation center x coordinate
 * @param (number) rotation center y coordinate
 * @param (number) angle rotation angle, in degrees
 */
Friend.Tree.Utilities.rotateCoords = function ( coords, xCenter, yCenter, angle )
{
	for ( var i = 0; i < coords.length; i ++ )
	{
		var x = coords[ i ].x - xCenter;
		var y = coords[ i ].y - yCenter;
		coords[ i ].x = x * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) - y * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + xCenter;
		coords[ i ].y = y * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) + x * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + yCenter;
	}
	return coords;
};
Friend.Tree.Utilities.rotateCoord = function ( x, y, xCenter, yCenter, angle )
{
    var coords = { };
    x -= xCenter;
    y -= yCenter;
    coords.x = x * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) - y * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + xCenter;
    coords.y = y * Math.cos( - angle * Friend.Tree.DEGREETORADIAN ) + x * Math.sin( - angle * Friend.Tree.DEGREETORADIAN ) + yCenter;
    return coords;
};
Friend.Tree.Utilities.rotateCoordinates = function ( x, y, distance, angle )
{
	var coords = { };
	coords.x = x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	coords.y = y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	return coords;
};
Friend.Tree.Utilities.rotate = function ( coords, angle, rayX, rayY )
{
	coords.x = coords.x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * rayX;
	coords.y = coords.y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * rayY;
	return coords;
};

/**
 * setPositionFromObject
 *
 *
 */
Friend.Tree.Utilities.setPositionFromObject = function ( object, parent, distance, angle, flags )
{
	if ( typeof flags == 'undefined' )
		flags = Friend.Tree.FLAG_SETX | Friend.Tree.FLAG_SETY | Friend.Tree.FLAG_SETANGLE;

	var x, y, rotation;
	if ( ( flags & Friend.Tree.FLAG_SETX ) != 0 )
		x = parent.x + Math.cos( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	if ( ( flags & Friend.Tree.FLAG_SETY ) != 0 )
		y = parent.y - Math.sin( angle * Friend.Tree.DEGREETORADIAN ) * distance;
	if ( ( flags & Friend.Tree.FLAG_SETANGLE ) != 0 )
		rotation = parent.rotation;

	parent.setCoordinates( x, y );
	// parent.setRotation( rotation ); // TODO
	return true;
};


/**
 * cleanArray
 *
 * Cleans the properties of an object used as an array
 * Explores the properties and only keep the non-false ones
 *
 * @param (object) arr the object to clean
 * @return (object) the cleaned object
 */
Friend.Tree.Utilities.cleanArray = function ( arr, exclude )
{
	var temp = {};
	for ( var key in arr )
	{
		if ( arr[ key ] && arr[ key ] != exclude )
			temp[ key ] = arr[ key ];
	}
	return temp;
};

/**
 * setFlags
 *
 * Sets a list of flags in an object
 *
 * @param (object) object the item to modify
 * @param (object) flags the list of properties
 */
Friend.Tree.Utilities.setFlags = function ( object, flags, theme )
{
	if ( theme )
	{
		for ( var f in theme )
		{
			if ( typeof object[ f ] != 'undefined' )
				object[ f ] = theme[ f ];
		}
	}
	if ( flags )
	{
		for ( var f in flags )
		{
			if ( typeof object[ f ] != 'undefined' )
				object[ f ] = flags[ f ];
		}
	}
	return true;
};
Friend.Tree.Utilities.forceFlags = function ( object, property, flags )
{
	if ( typeof object[ property ] == 'undefined' )
		object[ property ] = {};	
	if ( flags )
	{
		var destination = object[ property ];
		for ( var f in flags )
		{
			if ( typeof destination[ f ] == 'undefined' )
				destination[ f ] = flags[ f ];
		}
	}
	return true;
};
Friend.Tree.Utilities.computeProperties = function ( flags, item, variables )
{
	var previousItem = variables.previousItem;
	var parentItem = variables.parentItem;
	var treeWidth = variables.treeWidth;
	var treeHeight = variables.treeHeight;
	var self = this;
	for ( var p in flags )
	{
		if ( typeof flags[ p ] == 'string' )
		{
			if ( flags[ p ].substring( 0, 5 ) == 'eval:' )
			{
				try
				{
					flags[ p ] = eval( flags[ p ].substring( 5 ) );
				}
				catch (e)
				{
					flags[ p ] = 0;
					Friend.Tree.log( item,
					{
						error: 'error while evaluating ' + flags[ p ]
					} );
				}
				finally {}
			}
		}
	}
	return flags;

	function widthToParent( delta )
	{
		return parentItem.width - flags.x + delta;
	};
	function heightToParent( delta )
	{
		return parentItem.height - flags.y + delta;
	};
};

/**
 * Handy Rect object
 *
 * @param xOrRect (object or number) Rect object to copy or x coordinate
 * @param y (number) x Coordinate
 * @param width (number) width
 * @param height (number) height
 * @return (object) the newly created rect
 */
Friend.Tree.Utilities.Rect = function( xOrRect, y, width, height, flags )
{
	if ( typeof xOrRect == 'undefined' )
	{
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}
	else if ( typeof xOrRect == 'object' )
	{
		this.x = xOrRect.x;
		this.y = xOrRect.y;
		this.width = xOrRect.width;
		this.height = xOrRect.height;
	}
	else
	{
		this.x = xOrRect;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	Object.assign( this, Friend.Tree.Utilities.Rect );
	return this;
};

/**
 * isPointIn
 *
 * Checks if a point is within the rectangle
 *
 * @param (number) x horizontal coordinate
 * @param (number) y vertical coordinate
 * @return (boolean) true if the point is within the rectangle, false if outside
 */
Friend.Tree.Utilities.Rect.isPointIn = function ( x, y )
{
	return ( x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height );
};

Friend.Tree.Utilities.Rect.getCenter = function ()
{
	var coords = 
	{
		x: ( this.left + this.width ) / 2,
		y: ( this.top + this.height ) / 2
	}
	return coords;
};

Friend.Tree.Utilities.Rect.getRayCoords = function ( flags, angle )
{
	var center = this.getCenter( flags );
	var coords = Friend.Tree.Utilities.rotate( center, angle, this.width, this.height );
	return coords;
};

/**
 * move
 *
 * Adds an offset to the x and y coordinates of the rectangle
 *
 * @param (number) x signed distance to add to horizontal coordinate
 * @param (number) y signed distance to add to the vbertical coordinate
 */
Friend.Tree.Utilities.Rect.move = function ( x, y )
{
	this.x += x;
	this.y += y;
};

/**
 * zoom
 *
 * Multiplies the width and height by a zoom factor
 *
 * @param (number) zoom multiplication factor
 */
Friend.Tree.Utilities.Rect.zoom = function ( zoom )
{
	//this.x *= zoom;
	//this.y *= zoom;
	this.width *= zoom;
	this.height *= zoom;
};

/**
 * shrink
 *
 * Increase or decreases a rectangle
 *
 * @param (number) deltaX horizontal shrink factor
 * @param (number) deltaY vertical shrink factor
 */
Friend.Tree.Utilities.Rect.shrink = function ( deltaX, deltaY )
{
	if ( typeof deltaY == ' undefined' )
		deltaY = deltaX;
	this.x += deltaX / 2;
	this.y += deltaY / 2;
	this.width -= deltaX;
	this.height -= deltaY;
};

/** clip
 *
 * Sets the context clipping rectangle to the rect
 *
 * @param (object) context drawing context
 */
Friend.Tree.Utilities.Rect.clip = function ( flags )
{
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y );
	flags.rendererItem.closePath( flags );
	flags.rendererItem.clip( flags );
};
Friend.Tree.Utilities.Rect.saveContext = function ( flags )
{
	flags.rendererItem.save( flags );
};
Friend.Tree.Utilities.Rect.restoreContext = function ( flags )
{
	flags.rendererItem.restore( flags );
};
Friend.Tree.Utilities.Rect.drawDiagonal = function ( flags, color, size, directions )
{
	flags.rendererItem.setLineWidth( flags, 1);
	flags.rendererItem.setStrokeStyle( flags, color );
	if ( directions & Friend.Tree.DIAGONAL_TOPLEFT_BOTTOMRIGHT )
	{
		flags.rendererItem.beginPath( flags );
		flags.rendererItem.moveTo( flags, this.x, this.y );
		flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
		flags.rendererItem.stroke( flags );
	    flags.rendererItem.closePath();
	}
	if ( directions & Friend.Tree.DIAGONAL_TOPRIGHT_BOTTOMLEFT )
	{
		flags.rendererItem.beginPath( flags );
		flags.rendererItem.moveTo( flags, this.x + this.width, this.y );
		flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
		flags.rendererItem.stroke( flags );
	    flags.rendererItem.closePath();
	}
};

/**
 * drawHilightedBox
 *
 * Draw a box with light reflections
 *
 * @param (object) context drawing context
 * @param (string) color background color
 * @param (string) brightColor bright side color
 * @param (string) darkColor dark side color
 */
Friend.Tree.Utilities.Rect.drawHilightedBox = function ( flags, color, brightColor, darkColor )
{
	flags.rendererItem.setFillStyle( flags, color);
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height);
	flags.rendererItem.setLineWidth( flags, 1);
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
	flags.rendererItem.setStrokeStyle( flags, brightColor );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, this.x + this.width, this.y );
	flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
	flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
	flags.rendererItem.setStrokeStyle( flags, darkColor);
	flags.rendererItem.stroke( flags );
    flags.rendererItem.closePath();
};

/**
 * drawBox
 *
 * Draws a simple box with border
 *
 * @param (object) context drawing context
 * @param (string) color box color
 * @param (string) borderColor color of the border
 * @param (number) borderSize size of the border in pixels (0 = no border)
 */
Friend.Tree.Utilities.Rect.drawBox = function ( flags, color, borderColor, borderSize )
{
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height );
	if ( borderSize && borderColor )
	{	
		this.width -= borderSize;
		this.height -= borderSize;
		this.drawRectangle( flags, borderColor, borderSize );
		this.width += borderSize;
		this.height += borderSize;
	}
};

Friend.Tree.Utilities.Rect.clear = function ( flags )
{
	flags.rendererItem.clearRect( flags, this.x, this.y, this.width, this.height );
};

/**
 * drawEllipse
 *
 * Draws a simple ellipse
 *
 * @param (object) context drawing context
 * @param (string) color circle color
 * @param (string) borderColor color of the border
 * @param (number) borderSize size of the border in pixels (0 = no border)
 */
Friend.Tree.Utilities.Rect.drawEllipse = function ( flags, fillColor, borderColor, borderSize )
{
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.ellipse( flags, this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, - Math.PI, Math.PI );
	if ( typeof fillColor != 'undefined' )
	{
		flags.rendererItem.setFillStyle( flags, fillColor );
		flags.rendererItem.fill( flags );
	}
	if ( borderSize && borderColor )
	{
		flags.rendererItem.setLineWidth( flags, borderSize );
		flags.rendererItem.setStrokeStyle( flags, borderColor );
		flags.rendererItem.stroke( flags );
	}
    flags.rendererItem.closePath();
};

/**
 * drawRay
 *
 * Draws a ray from center to circumference of an ellipse
 *
 * @param (object) context drawing context
 * @param (number) angle
 * @param (string) color color of the ray
 * @param (string) size of the ray
 */
Friend.Tree.Utilities.Rect.drawRay = function ( flags, angle, color, size )
{
	var center = this.getCenter();
	var coords = this.rotate( coords, angle, this.width, this.height );
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, center.x, center.y );
	flags.rendererItem.lineTo( flags, coords.x, coords.y );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.closePath();
};
Friend.Tree.Utilities.Rect.drawLine = function ( flags, x1, y1, x2, y2, color, size )
{
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
	flags.rendererItem.beginPath( flags );
	flags.rendererItem.moveTo( flags, x1, y1 );
	flags.rendererItem.lineTo( flags, x2, y2 );
	flags.rendererItem.stroke( flags );
	flags.rendererItem.closePath();
};

/**
 * drawRectangle
 *
 * Draw a simple wire rectangle in one color, no borders
 *
 * @param (object) context drawing context
 * @param (string) color drawing color
 * @param (number) size of the pen
 */
Friend.Tree.Utilities.Rect.drawRectangle = function ( flags, color, size )
{
	flags.rendererItem.setLineWidth( flags, size );
	flags.rendererItem.setStrokeStyle( flags, color );
    flags.rendererItem.beginPath();
	flags.rendererItem.rect( flags, this.x, this.y, this.width, this.height );
    flags.rendererItem.stroke( flags );
};

/**
 * draw mosaic
 *
 * Fills the rectangle with a repitition of a bitmap
 *
 * @param (object) context drawing context
 * @param (string) image
 */
Friend.Tree.Utilities.Rect.drawMosaic = function ( flags, image, xOffset, yOffset )
{
//    flags.renderer.save( flags );
//    this.clip( flags );
    var nx = Math.floor( this.width / image.width ) + 1;
    var ny = Math.floor( this.height / image.height ) + 1;

    if ( typeof xOffset === 'undefined' )
        xOffset = 0;
    if ( typeof yOffset === 'undefined' )
        yOffset = 0;
    for ( var y = 0; y <= ny; y++  )
    {
        for ( var x = 0; x <= nx; x++ )
        {
            flags.rendererItem.drawImage( flags, image, this.x + x * image.width + xOffset, this.y + y * image.height + yOffset, image.width, image.height );
        }
    }
//	flags.renderer.restore( flags );
};

/**
 * fillRectangle
 *
 * Draw a simple rectangle in one color, no borders
 *
 * @param (object) context drawing context
 * @param (string) color drawing color
 * @param (number) size of the pen
 */
Friend.Tree.Utilities.Rect.fillRectangle = function ( flags, color )
{
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fillRect( flags, this.x, this.y, this.width, this.height );
};

/**
 * setAlpha
 *
 * Changes the gllobal alpha
 *
 * @param (object) context drawing context
 * @param (number) new alpha value
 */
Friend.Tree.Utilities.Rect.setAlpha = function ( flags, alpha )
{
	flags.rendererItem.setSetAlpha( flags, alpha );
};

/**
 * isRectIn
 *
 * Check for the intersection of two rect objects
 *
 * @param (object) rect the other rect to test
 * @return (boolean) true is intersection, false if not
 */
Friend.Tree.Utilities.Rect.isRectIn = function ( rect )
{
	if ( this.x - this.width > rect.x - rect.hotSpotX )
	{
		if ( this.x < rect.x + rect.width )
		{
			if ( this.y + this.height > rect.y - rect.hotSpotY )
			{
				if ( this.y < rect.y + rect.height )
				{
					return true;
				}
			}
		}
	}
	return false;
};

/**
 * drawFilledTriangle
 *
 * Draw a triangle the size of the rectangle
 *
 * @param (object) context the drawing context
 * @param (string) direction of the triangle 'left', 'top', 'bottom', 'right'
 * @param (string) color color of the triangle
 */
Friend.Tree.Utilities.Rect.drawFilledTriangle = function ( flags, direction, color )
{
	flags.rendererItem.beginPath();
	switch ( direction )
	{
		case 'left':
			flags.rendererItem.moveTo( flags, this.x, this.y + this.height / 2 );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
			break;
		case 'top':
			flags.rendererItem.moveTo( flags, this.x + this.width / 2, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
			break;
		case 'right':
			flags.rendererItem.moveTo( flags, this.x + this.width, this.y + this.height / 2 );
			flags.rendererItem.lineTo( flags, this.x, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y );
			break;
		case 'bottom':
			flags.rendererItem.moveTo( flags, this.x + this.width / 2, this.y + this.height );
			flags.rendererItem.lineTo( flags, this.x, this.y );
			flags.rendererItem.lineTo( flags, this.x + this.width, this.y );
			break;
	}
	flags.rendererItem.closePath( flags);
	flags.rendererItem.setFillStyle( flags, color );
	flags.rendererItem.fill( flags );
};

Friend.Tree.Utilities.Rect.drawImage = function ( properties, image, hAlign, vAlign )
{
	var width = image.width;
	var height = image.height;
	if ( width > this.width )
	{
		ratio = this.width / image.width;
		width = this.width;
		height = image.height * ratio;
	}
	if ( height > this.height )
	{
		ratio = this.height / image.height;
		height = this.height;
		width = image.width * ratio;
	}

	var x, y;
    switch ( hAlign )
    {
    case 'left':
        x = this.x;
        break;
    case 'right':
        x = this.x + this.width - width;
        break;
    default:
        x = this.x + this.width / 2 - width / 2;
        break;
    }
    switch ( vAlign )
    {
    case 'top':
        y = this.y;
        break;
    case 'bottom':
        y = this.y + this.height - height;
        break;
    default:
        y = this.y + this.height / 2 - height / 2;
        break;
    }
	properties.rendererItem.drawImage( properties, image, x, y, width, height );
};

/**
 * drawText
 *
 * Draws a clipped text in the rectangle
 */
Friend.Tree.Utilities.Rect.drawText = function ( flags, text, font, color, hAlign, vAlign, size )
{
    // Clips to the rectangle
	flags.rendererItem.save();
	this.clip( flags );

    // Computes horizontal alignment
    var x, y;
    switch ( hAlign )
    {
    case 'left':
        x = this.x;
        break;
    case 'right':
    case 'end':
        x = this.x + this.width;
        break;
    default:
        hAlign = 'center';
        x = this.x + this.width / 2;
        break;
    }

    // Computes vertical alignment
    switch ( vAlign )
    {
    case 'top':
    case 'hanging':
        y = this.y;
        break;
    case 'bottom':
    case 'alphabetic':
        y = this.y + this.height;
        break;
    default:
        vAlign = 'middle';
        y = this.y + this.height / 2;
        break;
    }

    // Draw text
    flags.rendererItem.drawText( flags, x, y, text, font, color, hAlign, vAlign, size );

    // Restores renderer
    flags.rendererItem.restore( flags );
};


// Extracts the name a file from its path
Friend.Tree.Utilities.getFilenameFromPath = function( path )
{
	var position = path.lastIndexOf( '/' );
	if ( position < 0 )
		position = path.indexOf( ':' );
	return path.substring( position + 1 );
};	

// Extracts path from a file
Friend.Tree.Utilities.extractFriendPaths = function( source, tokens )
{
	if ( typeof tokens == 'undefined' )
	{
		tokens = 
		[
			'Progdir:',
			'System:',
			'Home:'
		];
	}
	var list = [];
	for ( var t = 0; t < tokens.length; t++ )
	{
		var token = tokens[ t ];
		var position = source.indexOf( token );
		while( position >= 0 )
		{
			var end = source.indexOf( '"', position );
			if ( end < 0 )
				end = source.indexOf( "'", position );
			if ( end > position )
			{
				list.push( source.substring( position, end ) );
				position = source.indexOf( token, position + 1 );
			}
		}
	}
	return list;
};

// Replace paths in a file
Friend.Tree.Utilities.replaceFriendPaths = function( source, replaceList )
{
	// Replacement loop
	for ( var r = 0; r < replaceList.length; r++ )
	{
		var replacement = replaceList[ r ];
		var start = source.indexOf( replacement.search );
		while ( start >= 0 )
		{
			var end = start + replacement.search.length;
			source = source.substring( 0, start ) + replacement.replace + source.substring( end );
			start = source.indexOf( replacement.search, end );
		}
	}
	return source;
};

Friend.Tree.Utilities.measureText = function( text, font )
{
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );
	context.font = font;
	return context.measureText( text );
};
Friend.Tree.Utilities.getFontFamily = function( font )
{
	var pos = font.indexOf( 'px' );
	if ( pos >= 0 )
	{
		pos += 2;
		while( pos < font.length && font.charAt( pos ) == ' ' )
			pos++;
		if ( pos < font.length )
		{
			var start = pos;
			while( pos < font.length && font.charAt( pos ) != ' ' )
				pos++;	
			if ( pos > start )
				return font.substring( start, pos );
		}
	}
	return 'Arial';
};
Friend.Tree.Utilities.getFontSize = function( font )
{
	var px = font.indexOf( 'px' );
	return parseInt( font.substring( 0, px ), 10 );
};
Friend.Tree.Utilities.getFontWeight = function( font )
{
	var weights = [ 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900' ];
	for ( var w = 0; w < weights.length; w++ )
	{
		if ( font.indexOf( weights[ w ] ) >= 0 )
			return weigths[ w ];
	}
	return '';
};
Friend.Tree.Utilities.getFontStyle = function( font )
{
	var styles = [ 'normal', 'italic', 'oblique' ];
	for ( var s = 0; s < styles.length; s++ )
	{
		if ( font.indexOf( styles[ s ] ) >= 0 )
			return styles[ s ];
	}
	return 'normal';
};
Friend.Tree.Utilities.setFontSize = function( fontString, newSize )
{
	var pos = fontString.indexOf( 'px' );
	if ( pos >= 0 )
	{
		fontString = '' + newSize + fontString.substring( pos );
	}
	return fontString;
};


// Good random number generator
/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.
  
  If you want to use this as a substitute for Math.random(), use the random()
  method like so:
  
  var m = new MersenneTwister();
  var randomNumber = m.random();
  
  You can also call the other genrand_{foo}() methods on the instance.
  If you want to use a specific seed in order to get a repeatable random
  sequence, pass an integer into the constructor:
  var m = new MersenneTwister(123);
  and that will always produce the same random sequence.
  Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

Friend.Tree.Utilities.MersenneTwister = function(seed) 
{
	if (seed == undefined) 
	{
	  seed = new Date().getTime();
	} 
	/* Period parameters */  
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;   /* constant vector a */
	this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
	this.LOWER_MASK = 0x7fffffff; /* least significant r bits */
   
	this.mt = new Array(this.N); /* the array for the state vector */
	this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */
  
	this.init_genrand(seed);
};
/* initializes mt[N] with a seed */
Friend.Tree.Utilities.MersenneTwister.prototype.init_genrand = function(s) 
{
	this.mt[0] = s >>> 0;
	for (this.mti=1; this.mti<this.N; this.mti++) 
	{
		var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
	 	this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
};
   
/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
Friend.Tree.Utilities.MersenneTwister.prototype.init_by_array = function(init_key, key_length) 
{
	var i, j, k;
	this.init_genrand(19650218);
	i=1; j=0;
	k = (this.N>key_length ? this.N : key_length);
	for (; k; k--) {
	  var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30)
	  this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
		+ init_key[j] + j; /* non linear */
	  this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
	  i++; j++;
	  if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	  if (j>=key_length) j=0;
	}
	for (k=this.N-1; k; k--) {
	  var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
	  this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
		- i; /* non linear */
	  this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
	  i++;
	  if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	}
  
	this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */ 
};
   
/* generates a random number on [0,0xffffffff]-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_int32 = function() 
{
	var y;
	var mag01 = new Array(0x0, this.MATRIX_A);
	/* mag01[x] = x * MATRIX_A  for x=0,1 */
  
	if (this.mti >= this.N) { /* generate N words at one time */
	  var kk;
  
	  if (this.mti == this.N+1)   /* if init_genrand() has not been called, */
		this.init_genrand(5489); /* a default initial seed is used */
  
	  for (kk=0;kk<this.N-this.M;kk++) {
		y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
		this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
	  }
	  for (;kk<this.N-1;kk++) {
		y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
		this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
	  }
	  y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
	  this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];
  
	  this.mti = 0;
	}
  
	y = this.mt[this.mti++];
  
	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);
  
	return y >>> 0;
};
   
/* generates a random number on [0,0x7fffffff]-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_int31 = function() 
{
	return (this.genrand_int32()>>>1);
};

/* generates a random number on [0,1]-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_real1 = function() 
{
	return this.genrand_int32()*(1.0/4294967295.0); 
	/* divided by 2^32-1 */ 
};

/* generates a random number on [0,1)-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.random = function() 
{
	return this.genrand_int32()*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_real3 = function() 
{
	return (this.genrand_int32() + 0.5)*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/
Friend.Tree.Utilities.MersenneTwister.prototype.genrand_res53 = function() 
{ 
	var a=this.genrand_int32()>>>5, b=this.genrand_int32()>>>6; 
	return(a*67108864.0+b)*(1.0/9007199254740992.0); 
};
/* These real versions are due to Isaku Wada, 2002/01/09 added */