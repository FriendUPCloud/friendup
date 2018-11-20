/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

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

