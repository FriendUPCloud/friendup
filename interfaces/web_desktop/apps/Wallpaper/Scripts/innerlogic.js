/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.currentPath = 'Mountlist:';

Application.run = function( msg, iface )
{
	this.sendMessage( { command: 'getimages' } );
	scrapeImages();
	loadWallpapersFromRepo();
}

// Fetch web images
async function loadWallpapersFromRepo()
{
	let URL = 'https://repo.friendsky.cloud/?action=list&type=wallpaper';
	let m = new XMLHttpRequest();
	let args = encodeURIComponent( JSON.stringify( { mode: 'raw', url: URL } ) );
	m.open( 'GET', '/system.library/module/?module=system&command=proxyget&authid=' + Application.authId + '&args=' + args, true );
	m.onload = function()
	{
		let js = JSON.parse( this.responseText );
		ge( 'Webimages' ).innerHTML = '';
		for( let a = 0; a < js.wallpapers.length; a++ )
		{
			let w = js.wallpapers[ a ];
			for( let b = 0; b < w.wallpapers.length; b++ )
			{
				let i = w.wallpapers[ b ];
				let c = document.createElement( 'div' );
				c.className = 'MousePointer WPImage';
				let d = document.createElement( 'div' );
				d.className = 'Thumb';
				c.appendChild( d );
				d.innerHTML = '<div>' + i.split( '/' )[1] + '</div>';
				ge( 'Webimages' ).appendChild( c );
				
				let im = new Image();
				im.src = 'https://repo.friendsky.cloud/?action=get&type=wallpaper-thumbnail&item=' + i;
				im.onload = function()
				{
					d.style.backgroundImage = 'url(' + im.src + ')';
				}
				console.log( im.src );
				document.body.appendChild( im );
			}
		}
	}
	m.send();
}

Application.selectedImage = -3;
Application.mode = 'doors';

Application.wallpaperImages = [];
Application.windowImages = [];

Application.addImages = function( images )
{
	if( !images || !images.length ) return this.showImages();
	
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
	self.imageCache = false;
	this.showImages();
}

function scrapeImages()
{
	/*var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		if( e == 'ok' )
		{
			console.log( d );
		}
		else
		{
			console.log( e, d );
		}
	}
	m.execute( 'proxyget', { url: 'https://www.pexels.com/new-photos/' } );*/
	ge( 'Webimages' ).innerHTML = '<h2>' + i18n( 'i18n_unfinished' ) + '</h2>' + '<p>' + i18n( 'i18n_soon' ) + '</p>';
}

// Show the wallpaper images
let current = false;
Application.showImages = function()
{
	let self = this;
	
	function onCache( e, d )
	{
		
		if( e == 'ok' )
		{
			if( d )
			{
				try
				{
					d = JSON.parse( d );
					current = d['wallpaper'+Application.mode];
				}
				catch( e )
				{
					d = null;
				}
			}
		}
		
		let savedFound = false;
		
		let si = Application.selectedImage;
		
		let ml = ''; let found = false;
		
		let arr = Application.mode == 'doors' ? Application.wallpaperImages : 
			Application.windowImages;
		
		for( let a = 0; a < arr.length; a++ )
		{
			cl = '';
			
			if( si - 1 == a || ( si < -2 && arr[a] == current ) )
			{
				Application.selectedImage = a + 1;
				cl = ' WSelected BoxSelected';
				found = true;
			}
			let fname = arr[a].split(':')[1];
			if( typeof( fname ) != 'undefined' )
			{
				if( fname.indexOf( '/' ) > 0 )
				{
					fname = fname.split( '/' );
					fname = fname[fname.length - 1];
				}
				
				// This listed one is the current wallpaper
				if( arr[a] == d['wallpaper'+Application.mode] )
					savedFound = true;
				
				let ur = '/system.library/module/?module=system&command=thumbnail&width=568&height=320&mode=resize&authid=' + Application.authId + '&path=' + arr[a];
				
				ml += '<div class="MousePointer WPImage' + cl + '"><div class="Remove MousePointer IconSmall fa-remove" onclick="Application.removeImage(' + (a+1) + ')">&nbsp;</div><div class="Thumb" onclick="Application.setImage(' + 
					(a+1) + ');" style="background-image: url(' + 
					ur + ');"><div>' + fname + '</div></div></div>';
			}
		}
		
		// Uninitialized, set to system default
		if( Application.selectedImage == -3 )
		{
			// Use color
			if( d && d['wallpaper'+Application.mode] == 'color' )
				Application.selectedImage = -1;
			// Just keep it!
			else if ( d['wallpaper'+Application.mode] != '' )
				Application.selectedImage = -3;
			// We use default
			else Application.selectedImage = -2;
		}
		
		cl = '';
		if( !found && Application.selectedImage === -1 )
		{
			cl = ' WSelected BoxSelected';
		}
		ml += '<div class="MousePointer WPImage' + cl + '"><div class="Thumb" onclick="Application.setImage(-1);" style="background-color: ' + ( Application.mode == 'doors' ? '#2F669F' : '#ffffff' ) + ';"><div>Use background color.</div></div></div>';
		
		if( Application.mode == 'doors' )
		{
			cl = '';
			if( !found && Application.selectedImage === -2 )
				cl = ' WSelected BoxSelected';
			ml += '<div class="MousePointer WPImage' + cl + '"><div class="Thumb" onclick="Application.setImage(-2);" style="background-image: url(/webclient/gfx/theme/default_login_screen.jpg); background-size: cover"><div>Use system default.</div></div></div>';
		}
		
		// Custmo image
		if( !savedFound && current.indexOf( ':' ) > 0 )
		{
			cl = '';
			if( Application.selectedImage === -3 )
			{
				cl = ' WSelected BoxSelected';
			}
			ml += '<div class="MousePointer WPImage' + cl + '"><div class="Thumb" onclick="Application.setImage(-3);" style="background-image: url(' + getImageUrl(current) + '); background-size: cover"><div>Previously saved wallpaper.</div></div></div>';
		}
		
		ge( 'Images' ).innerHTML = ml;
	
		// Store these
		if( d )
		{
			let m = new Module( 'system' );
			m.onExecuted = function( e, d )
			{
				//console.log( e, d );
			}
			m.execute( 'setsetting', { setting: 'images' + Application.mode, data: JSON.stringify( arr ) } );
		}
	}
	
	if( !this.imageCache )
	{
		let sm = new Module( 'system' );
		sm.onExecuted = function( e, d ) 
		{
			self.imageCache = [ e, d ];
			onCache( e, d );
		}
		// Get just the wallpaper
		sm.execute( 'getsetting', { setting: 'wallpaper' + this.mode } );
	}
	else
	{
		onCache( this.imageCache[0], this.imageCache[1] );
	}
	
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
		self.imageCache = false;
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
	{
		i = arr[this.selectedImage - 1];
	}
	else if( this.selectedImage === -1 )
	{
		i = 'color';
	}
	// Current wallpaper
	else if( this.selectedImage == -3 )
	{
		i = current;
	}
	
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
	{
		i = arr[this.selectedImage - 1];
	}
	else if( this.selectedImage == -1 )
	{
		i = 'color';
	}
	// Current wallpaper
	else if( this.selectedImage == -3 )
	{
		i = current;
	}
	
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

