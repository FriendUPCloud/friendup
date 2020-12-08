/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

FUI.View = function( object )
{
	this.initialize( 'View' );
	
	let self = this;
	
	this.flags = object;
	this.flags.invisible = true;
	this.messagePort = this.viewObject = new View( this.flags );
	this.viewObject.setContent( '' );
	this.viewObject.onClose = function()
	{
		self.executeEvent( 'close' );
	}
}

FUI.View.prototype = FUI.BaseClass.prototype;

FUI.View.prototype.onPropertySet = function( property, value, callback )
{
	switch( property )
	{
		case 'showing':
			this.viewObject.setFlag( 'invisible', value ? false : true );
			break;
	}
	if( callback )
		callback( false );
}


FUI.View.prototype.onMethod = function( method, value, callback )
{
	if( this[ 'method' + method ] )
	{
		this[ 'method' + method ]( value, callback );
	}
	if( callback )
		return callback( false );
	return false;
}

// Set the gui on window!
FUI.View.prototype.methodsetgui = function( value, callback )
{
	this.viewObject.sendMessage( {
		command: 'fui',
		fuiCommand: 'setgui',
		gui: value,
		callback: callback ? addCallback( callback ) : false
	} );
}

FUI.View.Renderers = {};

FUI.View.Renderers.html5 = function( gridObject )
{
	this.grid = gridObject;
	this.domNodes = [];
}

