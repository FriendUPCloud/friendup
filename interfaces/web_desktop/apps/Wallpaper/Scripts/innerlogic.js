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

Application.selectedImage = -3;
Application.mode = 'doors';

Application.wallpaperImages = [];
Application.windowImages = [];

Application.addImages = function( images )
{
	if( !images || !images.length ) return;
	
	var arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
	
	for( var a = 0; a < images.length; a++ )
	{
		var found = false;
		for( var b = 0; b < arr.length; b++ )
		{
			if( arr[b] == images[a] )
				found = true;
		}
		if( !found )
			arr.push( images[a] );
	}
	this.showImages();
}

// Show the wallpaper images
Application.showImages = function()
{
	var sm = new Module( 'system' );
	sm.onExecuted = function( e, d ) 
	{
		var current = false;
		if( e == 'ok' )
		{
			if( d )
			{
				d = JSON.parse( d );
				current = d['wallpaper'+Application.mode];
			}
		}
		
		var si = Application.selectedImage;
		
		var ml = ''; var found = false;
		
		var arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
		
		for( var a = 0; a < arr.length; a++ )
		{
			cl = '';
			
			if( si - 1 == a || ( si < -2 && arr[a] == current ) )
			{
				Application.selectedImage = a + 1;
				cl = ' Selected';
				found = true;
			}
			var fname = arr[a].split(':')[1];
			if( typeof( fname ) != 'undefined' )
			{
				if( fname.indexOf( '/' ) > 0 )
				{
					fname = fname.split( '/' );
					fname = fname[fname.length - 1];
				}
				ml += '<div class="WPImage' + cl + '"><div class="Remove IconSmall fa-remove" onclick="Application.removeImage(' + (a+1) + ')">&nbsp;</div><div class="Thumb" onclick="Application.setImage(' + 
					(a+1) + ');" style="background-image: url(' + 
					getImageUrl( arr[a] ) + ');"><div>' + fname + '</div></div></div>';
			}
		}
		
		// Uninitialized, set to system default
		if( Application.selectedImage == -3 )
		{
			if( d && d['wallpaper'+Application.mode] == 'color' )
				Application.selectedImage = -1;
			else Application.selectedImage = -2;
		}
		
		cl = '';
		if( !found && Application.selectedImage == -1 )
			cl = ' Selected';
		ml += '<div class="WPImage' + cl + '"><div class="Thumb" onclick="Application.setImage(-1);" style="background-color: ' + ( Application.mode == 'doors' ? '#2F669F' : '#ffffff' ) + ';"><div>Use background color.</div></div></div>';
		
		if( Application.mode == 'doors' )
		{
			cl = '';
			if( !found && Application.selectedImage == -2 )
				cl = ' Selected';
			ml += '<div class="WPImage' + cl + '"><div class="Thumb" onclick="Application.setImage(-2);" style="background-image: url(/webclient/gfx/theme/default_login_screen.jpg); background-size: cover"><div>Use system default.</div></div></div>';
		}
		
		ge( 'Images' ).innerHTML = ml;
	
		// Store these
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			//console.log( e );
		}
		m.execute( 'setsetting', { setting: 'images' + Application.mode, data: arr } );
	}
	sm.execute( 'getsetting', { setting: 'wallpaper' + this.mode } );
	
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
	var arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
	var out = [];
	for( var a = 0; a < arr.length; a++ )
	{
		if( image - 1 == a )
			continue;
		else out.push( arr[a] );
	}
	arr = out;
	if( this.selectedImage < arr.length ) this.selectedImage = arr.length;
	
	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		Application.showImages();
	}
	m.execute( 'setsetting', { setting: 'images' + Application.Mode, data: arr } );
	
	if( Application.mode == 'doors' )
		Application.wallpaperImages = arr;
	else Application.windowImages = arr;
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
	var arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
	
	// Weird stuff!
	var i = '';
	if( this.selectedImage >= 0 )
		i = arr[this.selectedImage - 1];
	else if( this.selectedImage === -1 )
		i = 'color';
	
	this.sendMessage( {
		type: 'system',
		command: 'wallpaperimage',
		mode: this.mode,
		image: i
	} );
}

// Use current setting
Application.operationSave = function()
{
	var arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
	
	// Weird stuff!
	var i = '';
	if( this.selectedImage >= 0 )
		i = arr[this.selectedImage - 1];
	else if( this.selectedImage == -1 )
		i = 'color';
	
	this.sendMessage( {
		type: 'system',
		command: 'savewallpaperimage',
		mode: this.mode,
		image: i
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

