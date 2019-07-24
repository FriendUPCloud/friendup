/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/* 
	Our menu factory can handle multiple target elements where to generate
	a working menu.
*/
var MenuFactory = {
}

// Disposable menu for mobile use ----------------------------------------------

var fullscreenMenus = {}; // We put all menus here

var FullscreenMenuClass = function( id )
{
	this.dom = null;
	if( ge( id ) )
	{
		this.dom = ge( id );
	}
	this.id = id;
	this.heading = '';
	this.clicked = null;
	this.items = [];
	fullscreenMenus[ id ] = this;
}
FullscreenMenuClass.prototype.findDom = function( callback )
{
	var self = this;
	if( !document.body || !ge( this.id ) )
	{
		return setTimeout( function()
		{
			self.findDom( self.id, callback );
		}, 5 );
	}
	else
	{
		this.dom = ge( self.id );
		this.dom.object = this;
		if( callback )
			callback();
	}
}
FullscreenMenuClass.prototype.destroy = function()
{
	if( this.dom )
	{
		if( this.dom.parentNode )
		{
			this.dom.parentNode.removeChild( this.dom );
		}
		this.dom = null;
	}
	this.items = null;
	this.heading = null;
	this.clicked = null;
	
	// Clear menu from list
	var o = {};
	for( var a in fullscreenMenus )
	{
		if( a != this.id )
			o[ a ] = fullscreenMenus[ a ];
	}
	fullscreenMenus = o;
	
	this.id = null;
	delete this;
}
FullscreenMenuClass.prototype.clear = function()
{
	if( this.dom )
		this.dom.innerHTML = '';
	this.items = [];
}
FullscreenMenuClass.prototype.addMenuItem = function( mitem )
{
	this.items.push( mitem );
}
FullscreenMenuClass.prototype.show = function( heading, men ) // With an optional menu
{	
	var self = this;
	if( !this.dom )
	{
		return this.findDom( function(){ self.show( heading, men ); } );
	}
	// Not done yet!
	if( ge( 'MobileMenuClose' ) )
		return;
	
	// Generate menu from workspace menu
	if( men && typeof( men ) == 'string' )
	{
		// First try to clone our last copy
		var f = false;
		// Just use the simple object structure
		for( var a = 0; a < Workspace.menu.length; a++ )
		{
			if( Workspace.menu[a].name == men )
			{
				f = true;
				men = Workspace.menu[a].items;
				break;
			}
		}
		if( !f ) men = false;
	}
	
	Friend.currentMenuItems = false; // <- make it regenerate
	this.dom.innerHTML = '';
	var root = document.createElement( 'div' );
	root.className = 'Menu';
	root.innerHTML = heading ? heading : ( this.heading ? this.heading : i18n( 'i18n_choose_disk' ) );
	var menuCn = document.createElement( 'ul' );
	root.appendChild( menuCn );
	// Set items to display
	var items = this.items;
	if( men ) items = men;
	
	for( var a = 0; a < items.length; a++ )
	{
		if( !items[ a ].name )
			items[ a ].name = items[ a ].innerText;
		menuCn.appendChild( this.createMenuItem( items[a] ) );
	}
	this.dom.appendChild( root );
	
	var t = this;
	var d = _addMobileMenuClose( self.dom );
	this.dom.closeMenu = d;
	this.dom.classList.add( 'Visible' );
	this.dom.scrollTop = 0;
	
	setTimeout( function(){ t.dom.classList.add( 'Showing' ); }, 5 );
}
FullscreenMenuClass.prototype.createMenuItem = function( m )
{
	var self = this;
	var mitem = m;
	var menu = document.createElement( 'li' );
	
	if( m.disabled )
	{
		menu.classList.add( 'Disabled' );
	}
	if( m.divider == true )
	{
		menu.classList.add( 'Divider' );
		menu.innerHTML = '';
	}
	else menu.innerHTML = '<span>' + ( mitem.name ? mitem.name : mitem.text ) + '</span>';
	
	menu.onclick = function()
	{
		if( this.clicked ) return;
		this.clicked = true;
		if( mitem.command ) mitem.onclick = mitem.command;
		if( mitem.onclick )
			mitem.onclick();
		else if( mitem.clickItem && mitem.clickItem.onclick )
			mitem.clickItem.onclick();
		else if( mitem.onmousedown )
			mitem.onmousedown();
		self.dom.classList.remove( 'Visible' );
		_mobileMenuClose( self.dom );
	}
	if( m.clickItem && m.clickItem.firstChild && m.clickItem.firstChild.firstChild )
	{
		var o = document.createElement( 'div' );
		o.className = m.clickItem.className;
		o.innerHTML = m.clickItem.innerHTML;
		menu.innerHTML = '<span class="IconText">' + mitem.text + '</span>';
		menu.appendChild( o );
	}
	return menu;
}
var FullscreenMenu = new FullscreenMenuClass( 'MobileMenu' );

// Add a close button
function _addMobileMenuClose( ele )
{
	if( !ele ) ele = ge( 'MobileMenu' );
	if( ele.closeMenu )
	{
		return;
	}
	if( !ge( 'MobileMenuClose' ) )
	{
		var d = document.createElement( 'span' );
		d.id = 'MobileMenuClose';
		d.className = 'MobileMenuClose Close IconMedium fa-close';
		d.style.top = '-52px';
		d.innerHTML = i18n( 'i18n_close_menu' );
		d.onclick = function()
		{
			WorkspaceMenu.close();
			_mobileMenuClose( ele );
			CheckScreenTitle();
		}
		document.body.appendChild( d );
		ele.closeMenu = d;
		setTimeout( function(){ d.style.top = '0px'; }, 5 );
		return d;
	}
	return ge( 'MobileMenuClose' );
}

// Close the menu
function _mobileMenuClose( ele )
{
	if( !ele ) ele = ge( 'MobileMenu' );
	if( !ele ) return;
	if( ele != ge( 'MobileMenu' ) && ele.object )
	{
		ele.object.destroy();
	}
	var d = ge( 'MobileMenuClose' );
	if( d )
	{
		d.style.top = '-52px';
		ele.closeMenu = false;
		setTimeout( function(){ if( d && d.parentNode ) d.parentNode.removeChild( d ); }, 500 );
	}
}

