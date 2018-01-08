/*©lgpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Lesser General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Lesser General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/

// THIS FILE USES web_desktop/js/oo.js! Make changes and sync there!

// Base namespace
oo = function (){};

/**
 * Inheritance with multiple inheritance support
 *
 * synopsis: var func = ( new oo.Base() ).inherit();
 *
 * object {OO object}
 *
 */
 
oo.prototype.createInheritanceCaller = function( inh, f )
{
	return function()
	{
		for( var t = 0; t < inh.length; t++ )
		{
			if ( inh[ t ] && inh[ t ].apply )
			{
				var z = inh[ t ].apply( this, arguments );
				if ( typeof( z ) != 'undefined' ) return z;
			}
			else
			{
				//console.log( 'createInheritanceCaller exception: ' + f, inh[ t ] );
			}
		}
		return undefined;
	}
}
oo.prototype.inherit = function()
{
	var args = [];
	var self = this;
	for( var a = 0; a < arguments.length; a++ )
		args.push( arguments[a] );

	// Multiple inheritance
	var obj = function()
	{
		// Inheritance stack
		var inheritance = {};
		
		// Go through all parents
		// Keep child first in stack
		for( var b = 0; b < args.length; b++ )
		{
			var row = args[ b ];
		
			// Replace all functions with an inheritance stack array caller
			for( var a in row )
			{
				// Silly splat! Splat splat splat!
				if( !inheritance[ a ] )
				{
					// Add main function to the top of the array
					var inh = false;
					if( !this[ a ] )
						inh = [ row[ a ] ];
					else inh = [ this[ a ] ];
					inheritance[ a ] = inh;
					// Replace main function with an array caller
					this[ a ] = self.createInheritanceCaller( inh, a );
					// If top of caller array is the row, skip to next row
					if( row[ a ] == inh )
						continue;
				}
				// Add inherited function to the array
				inheritance[ a ].push( row[ a ] );
			}
			// Check inheritors (parent -> parents)!
			if( typeof( row ) != 'undefined' && row.getInheritors )
			{
				var inheritors = row.getInheritors();
				for( var a in inheritors )
				{
					for( var c in inheritors[ a ] )
					{
						if( inheritance[ c ] )
						{
							inheritance[ c ].push( inheritors[ a ][ c ] );
						}
					}
				}
			}
		}
		// Run constructor
		if( this.construct ) this.construct();
	}
	obj.prototype.getInheritors = function()
	{
		return args;
	}
	// Just copy all methods from parent
	for( var a = 0; a < arguments.length; a++ )
	{
		var row = arguments[ a ];
		for( var a in row )
		{
			if( !obj.prototype[ a ] )
			{
				obj.prototype[ a ] = row[ a ];
			}
		}
	}
	return obj;
}

// Export oo
module.exports = oo;

