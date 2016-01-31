/*******************************************************************************
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
*******************************************************************************/

/* DOM for NODE (to avoid bugs!)                                              */

DOMNode = function()
{
	this.childNodes = [];
	this.attributes = {};
	this.innerHTML = '';
	// Gets a dom object by id in the child elements
	this.getElementById = function( id )
	{
	}
	// Gets dom objects by classname in the child elements
	this.getElementsByClassName = function( className )
	{
	}
	// Gets a dom object by classname in the child elements
	this.getElementByClassName = function( className )
	{
	}
	// Appends a child 
	this.appendChild = function( domel )
	{
		this.childNodes.push( domel );
	}
	// Removes a child
	this.removeChild = function( domel )
	{
		var out = [];
		for( var a in this.childNodes )
		{
			if( this.childNodes[a] != domel )
				out.push( this.childNodes[a] );
		}
		this.childNodes = out;
	}
	// Creates
	this.createElement = function( type )
	{
		var ele = new DOMObject();
		ele.nodeName = type.toUpperCase();
		ele.tagName = ele.nodeName;
		return ele;
	}
	this.setAttribute = function( attr, val )
	{
		this.attributes[attr] = val;
	}
	this.getAttribute = function( attr )
	{
		if( typeof( this.attributes[attr] ) != 'undefined' )
			return this.attributes[attr];
		return false;
	}
}

// Setup the basic document ----------------------------------------------------
var document = new DOMNode();
document.body = document.createElement( 'body' );
document.appendChild( document.body );

