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

Application.currentPath = 'Mountlist:';

Application.run = function( msg, iface )
{
	this.sendMessage( { command: 'getimages' } );
}

Application.selectedImage = 0;
Application.mode = 'doors';

Application.wallpaperImages = [];
Application.windowImages = [];

Application.addImages = function( images )
{
	if( !images || !images.length ) return;
	
	for( var a = 0; a < images.length; a++ )
	{
		var found = false;
		for( var b = 0; b < this.wallpaperImages.length; b++ )
		{
			if( this.wallpaperImages[b] == images[a] )
				found = true;
		}
		if( !found )
			this.wallpaperImages.push( images[a] );
	}
	this.showImages();
}

// Show the wallpaper images
Application.showImages = function()
{
	var sm = new Module( 'system' );
	sm.onExecuted = function( e, d ) 
	{
		var ml = '';
		for( var a = 0; a < Application.wallpaperImages.length; a++ )
		{
			cl = '';
			
			console.log( d + '.....' );
			
			if( Application.selectedImage <= 0 && Application.wallpaperImages[a] == d )
				Application.selectedImage = a+1;
				
			if( Application.selectedImage - 1 == a )
			{
				cl = ' Selected';
			}
			var fname = Application.wallpaperImages[a].split(':')[1];
			if( typeof( fname ) != 'undefined' )
			{
				if( fname.indexOf( '/' ) > 0 )
					fname = fname.split( '/' )[1];
				ml += '<div class="WPImage' + cl + '"><div class="Remove IconSmall fa-remove" onclick="Application.removeImage(' + (a+1) + ')">&nbsp;</div><div class="Thumb" onclick="Application.setImage(' + 
					(a+1) + ');" style="background-image: url(' + 
					getImageUrl( Application.wallpaperImages[a] ) + ');"><div>' + fname + '</div></div></div>';
			}
		}
		ge( 'Images' ).innerHTML = ml;
	
		// Store these
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			console.log( e );
		}
		m.execute( 'setsetting', { setting: 'images' + Application.mode, data: Application.wallpaperImages } );
	}
	sm.execute( 'getsetting', { setting: 'wallpaper' + this.mode } );
	console.log( '.....' );
	
}

// Select an image
Application.setImage = function( image )
{
	this.selectedImage = image;
	this.showImages();
}

// Remove an image
Application.removeImage = function( image )
{
	var out = [];
	for( var a = 0; a < this.wallpaperImages.length; a++ )
	{
		if( image-1 == a )
			continue;
		else out.push( this.wallpaperImages[a] );
	}
	this.wallpaperImages = out;
	if( this.selectedImage < this.wallpaperImages.length ) this.selectedImage = this.wallpaperImages.length;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		Application.showImages();
	}
	m.execute( 'setsetting', { setting: 'images' + Application.Mode, data: Application.wallpaperImages } );
}

// Add image to list!
Application.addImage = function()
{
	// No image
	this.sendMessage( { command: 'addimage' } );
}

// Use current setting
Application.operationUse = function()
{
	this.sendMessage( {
		type: 'system',
		command: 'wallpaperimage',
		mode: this.mode,
		image: this.wallpaperImages[this.selectedImage-1]
	} );
}

// Use current setting
Application.operationSave = function()
{
	this.sendMessage( {
		type: 'system',
		command: 'savewallpaperimage',
		mode: this.mode,
		image: this.wallpaperImages[this.selectedImage-1]
	} );
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	
	switch( msg.command )
	{
		case 'addimages':
			this.addImages( msg.images );
			break;
		case 'setimages':
			console.log( 'Setting images' );
			this.mode = msg.mode;
			if( msg.mode == 'doors' )
			{
				this.wallpaperImages = [];
			}
			else
			{
				this.windowImages = [];
			}
			this.addImages( msg.images );
			break;
	}
}

