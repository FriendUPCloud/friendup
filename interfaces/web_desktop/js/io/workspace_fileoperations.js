/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// Delete selected files
Workspace.deleteFile = function()
{
	var self = this;
	
	var w = window.regionWindow;
	if( !window.currentMovable || ( window.currentMovable && !window.currentMovable.content.refresh ) )
		return;

	// Detached refresh object
	var rObj = {
		refresh: window.currentMovable.content.refresh,
		fileInfo: window.currentMovable.content.fileInfo
	};

	if( w )
	{
		var files = [];
		var eles = w.getElementsByTagName( 'div' );
		for( var a = 0; a < w.icons.length; a++ )
		{
			if( w.icons[a].selected )
			{
				var d = new Door();
				files.push( { fileInfo: w.icons[a], door: d.get( w.icons[a].Path ) } );
			}
		}

		// Create callback
		var cnt = files.length;

		if( cnt > 0 )
		{
			Confirm( i18n( 'i18n_sure_delete' ), i18n( 'i18n_sure_deldesc' ), function( d )
			{
				if( d == true )
				{
					// Open a window
					var v = new View( {
						title: i18n( 'i18n_deleting_files' ),
						width: 320,
						height: 100
					} );
					
					// Build the UI
					var cont = document.createElement( 'div' );
					cont.className = 'ContentFull Frame';
					cont.style.top = '10px';
					cont.style.left = '10px';
					cont.style.width = 'calc(100% - 20px)';
					cont.style.height = '30px';
					
					var frame = document.createElement( 'div' );
					frame.className = 'Groove BackgroundHighlight Rounded ContentFull';
					frame.style.top = '1px';
					frame.style.left = '1px';
					frame.style.width = 'calc(100% - 2px)';
					frame.style.height = 'calc(100% - 2px)';
					
					var bar = document.createElement( 'div' );
					bar.className = 'Bar Rounded ContentFull';
					bar.style.top = '1px';
					bar.style.left = '1px';
					bar.style.width = '0';
					bar.style.height = 'calc(100% - 2px)';
					
					var text = document.createElement( 'div' );
					bar.appendChild( text );
					
					cont.appendChild( frame );						
					cont.appendChild( bar );
					
					var stop = false;
					
					var btn = document.createElement( 'button' );
					btn.innerHTML = i18n( 'i18n_cancel' );
					btn.className = 'Button IconSmall fa-remove NoMargins';
					btn.style.position = 'absolute';
					btn.style.left = '10px';
					btn.style.top = '55px';
					btn.onclick = function()
					{
						stop = true;
					}
					
					v.content.appendChild( cont );
					v.content.appendChild( btn );
					
					var refreshTimeo = {};
					
					// Actually do the delete
					function doDeleteFiles( files, index )
					{
						// 
						if( stop || index == files.length )
						{
							// All done!
							v.close();
							return;
						}
						
						var file = files[ index ];
						
						// callback
						function nextFile( info )
						{ 
							if( !info.substr( 0, 3 ) == 'ok<' )
							{
								Notify( { title: i18n( 'i18n_could_not_delete' ), text: i18n( 'i18n_could_not_delete_files' ) + '<br>&nbsp;' + file.fileInfo.Path } );
								return;
							}
							
							var pct = Math.floor( ( index + 1 ) / files.length * 100 ) + '%';
							
							// Delayed window refresh
							if( refreshTimeo[ file.fileInfo.Path ] )
								clearTimeout( refreshTimeo[ file.fileInfo.Path ] );
							refreshTimeo[ file.fileInfo.Path ] = setTimeout( function()
							{
								Workspace.refreshWindowByPath( file.fileInfo.Path );
								refreshTimeo[ file.fileInfo.Path ] = null;
							}, 100 );
							
							bar.style.width = 'calc(' + pct + ' - 2px)';
							text.innerHTML = pct;
							
							doDeleteFiles( files, index + 1 ); 
						}
						
						var ic = new FileIcon();
						
						// Database ID
						if( file.fileInfo.ID )
						{	
							file.door.dosAction( 'delete', { 
								path: file.fileInfo.Path, pathid: file.fileInfo.ID + ( file.fileInfo.Type == 'Directory' ? '/' : '' ) 
							}, nextFile );
							
							var info = file.fileInfo.Path;
							if( info.substr( info.length - 1, 1 ) == '/' )
							info = info.substr( 0, info.length - 1 );
							
							// Try to kill the info file!
							file.door.dosAction( 'delete', { path: info + '.info' } );
							
							// Clear cache
							ic.delCache( file.fileInfo.Path );
							ic.delCache( info + '.info' );
						}
						// Dormant?
						else if ( file.fileInfo.Dormant )
						{
							file.fileInfo.Dormant.dosAction( 'delete', { path: file.fileInfo.Path }, nextFile );
							
							// Clear cache
							ic.delCache( file.fileInfo.Path );
						}
						// Path
						else
						{
							var info = file.fileInfo.Path;
							if( info.substr( info.length - 1, 1 ) == '/' )
							info = info.substr( 0, info.length - 1 );
							file.door.dosAction( 'delete', { path: file.fileInfo.Path }, nextFile );
							
							// Try to kill the info file!
							file.door.dosAction( 'delete', { path: info + '.info' }, nextFile );
							
							// Clear cache
							ic.delCache( file.fileInfo.Path );
							ic.delCache( info + '.info' );
						}
					}
					
					// Start deleting..
					doDeleteFiles( files, 0 );
				}
			} );
		}
	}
};

