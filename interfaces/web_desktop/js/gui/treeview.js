/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Creates a tree view list ----------------------------------------------------

/**
 * A simple GUI treeview
 * @author Hogne Titlestad
 * @param list array list of elements to be put in tree
 * @param treename string name the tree with a unique name
 * @param flags object of flags
**/
function Treeview( list, treename, flags )
{
	if( !flags )
	{
		flags = {};
	}
	
	var tt = this;
	
	if( flags.currentItem ) this.currentItem = flags.currentItem;
	else this.currentItem = false;
	
	// Resulting object
	var out = {};
	
	// Create list based on hierarchical node tree
	function _hierarchy( list )
	{
		var ul = document.createElement( 'div' );
		ul.className = 'TreeListNode';
		var openFound = false;
		for( var a in list )
		{
			var li = document.createElement( 'div' );
			li.className = 'TreeListItem';
			li.innerHTML = list[a].name;
			li.name = list[a].name;
			li.identifier = list[a].identifier;
			if( li.identifier == tt.currentItem )
			{
				li.classList.add( 'Current' );
				li.classList.add( 'Open' );
				li.open = true;
				openFound = true;
			}
			li.onclick = function( e )
			{
				Application.receiveMessage( {
					command: 'treeview',
					treeview: treename,
					identifier: this.identifier ? this.identifier : '',
					value: this.name
				} );
				tt.currentItem = this.identifier;
				return cancelBubble( e );
			}
			if( list[a].children )
			{
				li.classList.add( 'Children' );
				var s = _hierarchy( list[a].children );
				if( s.open ) 
				{
					li.classList.add( 'Open' );
					openFound = true;
				}
				li.onclick = function( e )
				{
					if( this.open )
					{
						this.open = false;
						this.classList.remove( 'Open' );
					}
					else
					{
						this.open = true;
						this.classList.add( 'Open' );
					}
					Application.receiveMessage( {
						command: 'treeview',
						treeview: treename,
						identifier: this.identifier ? this.identifier : '',
						value: this.name
					} );
					return cancelBubble( e );
				}
				li.appendChild( s );
			}
			ul.appendChild( li );
		}
		if( openFound ) ul.open = true;
		return ul;
	}
	
	// Alphabetical list, traverse and make index
	function tree_traverse_object( obj, depth )
	{
		if( !depth ) depth = 0;
		var subDepth = depth + 1;
		var subs = 0;
		var ul = document.createElement( 'div' );
		ul.className = 'TreeListNode';
		for( var a in obj )
		{
			var li = document.createElement( 'div' );
			li.className = 'TreeListItem';
			li.children = 0;
			li.innerHTML = isNaN( a ) ? a : obj[a];
			if( isNaN( a ) )
			{
				var children = tree_traverse_object( obj[a], subDepth );
				if( children )
				{
					li.open = false;
					li.classList.add( 'Children' );
					li.onclick = function( e )
					{
						if( this.open )
						{
							this.open = false;
							this.classList.remove( 'Open' );
						}
						else
						{
							this.open = true;
							this.classList.add( 'Open' );
						}
						return cancelBubble( e );
					}
					li.appendChild( children );
				}
				else
				{
					li.onclick = function( e )
					{
						Application.receiveMessage( {
							command: 'treeview',
							treeview: treename,
							value: this.innerHTML
						} );
						return cancelBubble( e );
					}
				}
			}
			else
			{
				li.onclick = function( e )
				{
					Application.receiveMessage( {
						command: 'treeview',
						treeview: treename,
						value: this.innerHTML
					} );
					return cancelBubble( e );
				}
			}
			ul.appendChild( li );
			subs++;
		}
		if( subs > 0 ) return ul;
		return false;
	}
	if( flags && flags.alphabetical )
	{
		// Generate two dimensional list
		// TODO: Let the alphabet follow a locale
		var alphabet = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZæÆøØåÅ';
		for( var al = 0; al < alphabet.length; al += 2 )
		{
			var work = [];
			var sLet = alphabet.substr( al,   1 );
			var uLet = alphabet.substr( al+1, 1 );
			for( var a = 0; a < list.length; a++ )
			{
				var flet = list[a].substr( 0, 1 );
				if( flet == sLet || flet == uLet )
				{
					if( typeof( out[uLet] ) != 'object' )
						out[uLet] = [];
					out[uLet].push( list[a] );
				}
				else
				{
					work.push( list[a] );
				}
			}
			list = work;
		}
		return tree_traverse_object( out );
	}
	else
	{
		var ul = _hierarchy( list );
		return ul;
	}
}

