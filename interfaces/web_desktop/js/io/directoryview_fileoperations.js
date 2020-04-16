/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

// -------------------------------------------------------------------------
// Dropping an icon on a window or an icon!
DirectoryView.prototype.doCopyOnElement = function( eles, e )
{
	var dview = this; // The view in question
	
	var mode = 'view';
	
	window.mouseDown = false;
	clearRegionIcons();
	
	var a;

	// Function to use for installing application packages
	function DInstallPackage( fileInfo )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e != 'ok' )
			{
				Notify( { title: i18n( 'i18n_failed_install_package' ), text: i18n( 'i18n_package_failed' ) + ': ' + fileInfo.Filename } );
			}
			else
			{
				Notify( { title: i18n( 'i18n_package_installed' ), text: i18n( 'i18n_package' ) + ': ' + fileInfo.Filename + ', ' + i18n( 'i18n_was_installed' ) } );
			}
		}
		m.execute( 'installpackage', { path: fileInfo.Path } );
	}

	// Check if this is a special view
	if( this.fileInfo && this.fileInfo.Path && this.fileInfo.Path.indexOf( 'System:' ) == 0 )
	{
		// Trying to install something!
		if( this.fileInfo.Path == 'System:Software/' )
		{
			for( a = 0; a < eles.length; a++ )
			{
				var f = eles[a];

				if( f.fileInfo.Filename.toLowerCase().indexOf( '.fpkg' ) > 0 )
				{
					DInstallPackage( f.fileInfo );
				}
			}
		}
		return;
	}
	// We are operating on a file directory icon?
	else if( this.object && this.object.file )
	{
		// Ok, tell function we're operating on a FileIcon
		mode = 'directory';
		
		if( !this.object.file.directoryView )
		{
			return false;
		}
		if( !this.object.file.fileInfo || ( this.object.file.fileInfo.Type != 'Directory' && this.object.file.fileInfo.Type != 'Door' ) )
		{
			if( this.object.file.fileInfo.Type == 'File' )
			{
				mode = 'view';
				
				// Redirect to view mode
				dview = this.object.file.directoryView.window.parentNode;
			}
		}
	}

	// Check some events
	if( !e ) e = window.event;

	// Register file operations here
	if( !dview.fileoperations )
		dview.fileoperations = {};
	
	var copySessionId = UniqueHash();

	// Make sure we register the ctrl key held down! Control keys tell if we copy or move (ctrl = copy)
	var ctrl = ( typeof( e ) != 'undefined' && e.ctrlKey ) ? e.ctrlKey : false;
	if( !ctrl && typeof( e ) != 'undefined' && e.shiftKey ) ctrl = true;

	// Window is the target
	if( !dview.content && !dview.object.file )
		return;
	
	var cfo = mode == 'view' ? dview.content.fileInfo : dview.object.file.fileInfo;

	var dragFromWindow = eles[0].window;

	// Can't drop stuff on myself!
	if( mode == 'view' && dview.content == eles[0].window )
	{
		// The icon to drop on
		cfo = false;

		// Check if we're dropping on a folder icon
		var divs = dview.content.getElementsByTagName( 'div' );
		var icons = [];

		var mx = windowMouseX - dview.offsetLeft;
		var my = windowMouseY - dview.offsetTop;

		for( a = 0; a < divs.length; a++ )
		{
			if( divs[a].className.indexOf( 'File' ) == 0 && divs[a].fileInfo )
			{
				var ic = divs[a];
				icons.push( ic );
				
				// Check if the mouse entered here
				if( !cfo && mx >= ic.offsetLeft && my >= ic.offsetTop && mx < ic.offsetLeft + ic.offsetWidth && my < ic.offsetTop + ic.offsetHeight )
				{
					// We found a better target!
					if( ic.fileInfo.Type == 'Directory' )
					{
						cfo = ic.fileInfo;
						break;
					}
				}
			}
		}
		
		// Bailing
		if( !cfo )
		{
			dview.content.refresh();
			dragFromWindow.refresh();
			return;
		}
	}

	// Immediately refresh source!
	var winobj = mode == 'view' ? this.windowObject : dview.directoryView.windowObject;
	Workspace.diskNotification( [ winobj, dragFromWindow ], 'refresh' );

	// Sanitize input... no folder to be dropped into themselves or their children....
	var clean = [];
	for( var i = 0; i < eles.length; i++ )
	{
		if( !cfo.Path || !eles[i].window || !eles[i].window.fileInfo || !eles[i].window.fileInfo.Path )
		{
			clean.push( eles[i] );
			continue;
		}
		if( ( '' + cfo.Path != eles[i].window.fileInfo.Path + eles[i].Title + '/') )
		{
			clean.push( eles[i] );
			for( var j in movableWindows )
			{
				if(
					movableWindows[j] && movableWindows[j].titleString &&
					( '' + movableWindows[j].titleString ).indexOf( eles[i].window.fileInfo.Path + eles[i].Title ) != -1
				)
				{
					if( movableWindows[ j ].content && movableWindows[ j ].content.directoryview )
					{
						movableWindows[j].windowObject.close();
					}
				}
			}
		}
	}

	// No items (they were cleaned out) Refresh source
	if( clean.length == 0 || ( clean.length == 1 && !clean[0] ) )
	{
		eles[0].window.refresh();
		return;
	}

	eles = clean;
	
	// Source window
	var sview = eles[0].window;

	// Info files might be added in the copy as well
	if( clean && eles[0].window && eles[0].window.allIcons )
	{
		var add = [];
		// Check all icons to be copied
		for( a = 0; a < eles[0].window.allIcons.length; a++ )
		{
			// Loop throught dropped icons
			for( var b = 0; b < eles.length; b++ )
			{
				var f = eles[0].window.allIcons[a];
				var fn = eles[b].fileInfo.Filename ? eles[b].fileInfo.Filename : eles[b].fileInfo.Title;
				if( fn.substr( fn.length - 5, 5 ).toLowerCase() == '.info' )
					continue;
				if( fn.substr( fn.length - 8, 8 ).toLowerCase() == '.dirinfo' )
					continue;
				if( f.Filename == fn + '.info' || f.Filename == fn + '.dirinfo' )
				{
					if( !f.fileInfo ) f.fileInfo = f;
					add.push( f );
				}
			}
		}
		if( add.length ) 
		{
			for( a = 0; a < add.length; a++ )
			{
				eles.push( add[a] );
			}
		}
	}

	// Examine destination
	var destinationFI = mode == 'view' ? dview.content.fileInfo : dview.object.file.fileInfo;
	var sPath = destinationFI.Path; // set path
	var dPath = eles[0].window.fileInfo ? eles[0].window.fileInfo.Path : false; // <- dropped path

	// We can't copy to self!
	if( sPath == dPath && !e.paste )
	{
		if( mode == 'view' ) dview.content.refresh();
		else if( dview.directoryView.content ) dview.directoryView.content.refresh();
		// Bailing!
		return;
	}

	// Always copy when on different volumes
	if(
		sPath && dPath &&
		destinationFI && eles[0].window.fileInfo &&
		destinationFI.Path.split( ':' )[0] != eles[0].window.fileInfo.Path.split( ':' )[0]
	)
	{
		ctrl = true;
	}
	
	// Make sure we have valid source and destination and neither of them is 
	// on System: volume and we have no ape using us....
	if( !sPath || !dPath || sPath.indexOf( 'System:' ) == 0 || dPath.indexOf( 'System:' ) == 0 )
	{
		if( eles[0].window && eles[0].window.refresh )
		{
			eles[0].window.refresh();
		}
		else 
		{
			Workspace.refreshDesktop();
		}
		if( mode == 'view' ) 
		{
			dview.content.refresh();
		}
		else if( dview.directoryView.content ) 
		{
			dview.directoryView.content.refresh();
		}
		return;
	}

	dview.fileoperations[ copySessionId ] = {
		mode:  'preparation', // Mode
		sPath: sPath,         // Source
		dPath: dPath,         // Destination
		processedFolders: {}  // The folders processed by the copy operation
	};

	// Register current open window
	var curr = window.currentMovable;
	
	function CopyCleanup()
	{ 
		_ActivateWindow( curr );
		_WindowToFront( curr );
		curr.content.refresh();
		if( sview && sview.parentNode )
		{
			sview.refresh();
		}
	}
	
	// Refresh immediately
	curr.content.refresh();
	if( sview && sview.parentNode )
	{
		sview.refresh();
	}
	

	// Open window
	if( window.isMobile )
	{
		dview.fileoperations[ copySessionId ].view = new Widget( {
			width: 'full',
			height: 'full',
			above: true,
			animate: true,
			transparent: true
		} );
	}
	else
	{
		dview.fileoperations[ copySessionId ].view = new View( {
			title:  ctrl ? i18n( 'i18n_copying_files' ) : i18n('i18n_moving_files'),
			width:  400,
			height: 145,
			'max-height': 145,
			id:     'fileops_' + copySessionId
		} );
	}

	dview.fileoperations[ copySessionId ].view.myid = copySessionId;
	dview.fileoperations[ copySessionId ].view.master = dview;

	// Load template
	dview.fileoperations[ copySessionId ].progress = new File( 'templates/file_operation.html' );
	dview.fileoperations[ copySessionId ].progress.master = dview;
	dview.fileoperations[ copySessionId ].progress.myid = copySessionId;

	// Load window template for progress bar and do stuff
	dview.fileoperations[ copySessionId ].progress.onLoad = function( data )
	{
		if( !this.master.fileoperations[ this.myid ] ) return;
		
		var w = this.master.fileoperations[ this.myid ].view;
		var windowArray = this.master.fileoperations;
		var windowArrayKey = this.myid;

		data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
		w.setContent( data );

		// Setup progress bar and register interactive elements
		var vie = this.master.fileoperations[ this.myid ].view
		var dom = window.isMobile ? vie.dom : vie.getWindowElement();
		var eled = dom.getElementsByTagName( '*' );
		var groove = false, bar = false, frame = false, progressbar = false;
		var fcb = infocontent = false, progress = false;
		for( var a = 0; a < eled.length; a++ )
		{
			if( eled[a].classList )
			{
				var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'FileCancelButton', 'InfoContents', 'Progress' ];
				for( var b = 0; b < types.length; b++ )
				{
					if( eled[a].classList.contains( types[b] ) )
					{
						switch( types[b] )
						{
							case 'ProgressBar': progressbar  = eled[a]; break;
							case 'Progress':    progress     = eled[a]; break;
							case 'Groove':      groove       = eled[a]; break;
							case 'Frame':       frame        = eled[a]; break;
							case 'Bar':         bar          = eled[a]; break;
							case 'FileCancelButton': fcb     = eled[a]; break;
							case 'InfoContents': infocontent = eled[a]; break;
						}
					}
				}
			}
		}
		
		// This is the context for file operations (cancellable)
		var series = UniqueHash();

		// Close button
		if( fcb )
		{
			// This will terminate all io processes too
			fcb.onclick = function()
			{
				w.close();
			}
		}

		// Only continue if we have all gui elements in place
		if( progressbar && groove && frame && bar && infocontent )
		{
			progressbar.style.position = 'relative';
			frame.style.width = '100%';
			frame.style.height = '40px';
			progress.style.position = 'absolute';
			progress.style.top = '0';
			progress.style.left = '0';
			progress.style.width = '100%';
			progress.style.height = '30px';
			progress.style.textAlign = 'center';
			progress.style.zIndex = 2;
			groove.style.position = 'absolute';
			groove.style.width = '100%';
			groove.style.height = '30px';
			groove.style.top = '0';
			groove.style.left = '0';
			bar.style.position = 'absolute';
			bar.style.width = '2px';
			bar.style.height = '30px';
			bar.style.top = '0';
			bar.style.left = '0';
			
			if( window.isMobile )
			{
				// Modify parent
				progressbar.parentNode.className += ' Dialog';
				progressbar.parentNode.style.background = 'rgba(0,0,0,0.6)';
				progressbar.style.position = 'absolute';
				progressbar.style.top = '40%';
				progressbar.style.width = '100%';
				
				fcb.style.display = 'block';
				fcb.style.margin = 'auto';
			}

			// Preliminary progress bar
			bar.total = eles.length;
			bar.items = eles.length;
			var handleBarRefresh = setInterval( function()
			{
				var size = Math.floor( 100 - ( 100 / bar.total * bar.items ) );
				if ( size != bar.friendSize )
				{
					bar.friendSize = size;
					bar.style.width = size + '%';
					progress.innerHTML = size + '%';
				}
			}, 100 );
			
			// Create a filecopy object
			var fileCopyObject = 
			{
				// Vars --------------------------------------------------------
				
				files: [],                // Files list
				directories:[],           // Directory list
				processedCount: 0,        // Files and folders
				processedFilesize: 0,     // Size of files
				processedDirectories: {}, // Directories that are processed
				processedFiles: {},       // Files that are prosessed
				processing: 0,
				stepsize: 10,
				stop: false,              // Whether or not to stop process
				
				// Functions ---------------------------------------------------
				
				// Check all files (type etc) - runs the show
				checkFiles: function( checkFiles )
				{
					this.processing++;       // Counting!
					var eles = [];           // Dirs first, files later
					var files = [];          // File elements
					var finFiles = [];       // Temporary "final list"
					var fsorted = [];        // Sorted list
					var a, b, found;         // Misc vars used in routines
					var typ, fnam;
				
					// Add dirs and files separately
					for( a = 0; a < checkFiles.length; a++ )
					{
						typ = checkFiles[a].fileInfo.Type.toLowerCase();
						fnam = checkFiles[a].fileInfo.Filename;
						if( typ == 'directory' )
						{
							eles.push( checkFiles[a] );
						}
						else
						{
							files.push( checkFiles[a] );
						}
					}
				
					// Make sure that .info files always comes first
					for( b = 0; b < 2; b++ )
					{
						for( a = 0; a < files.length; a++ )
						{
							fnam = files[a].fileInfo.Filename;
							if( 
								b == 0 && (
									fnam.substr( fnam.length - 5, 5 ) == '.info' ||
									fnam.substr( fnam.length - 8, 8 ) == '.dirinfo' 
								)
							)
							{
								finFiles.push( files[a] );
							}
							else if(
								b == 1 && (
									fnam.substr( fnam.length - 5, 5 ) != '.info' &&
									fnam.substr( fnam.length - 8, 8 ) != '.dirinfo'
								)
							)
							{
								finFiles.push( files[a] );
							}
						}
					}
				
					// Overwrite files with finFiles
					files = finFiles; delete finFiles;
				
					// Find .dirinfo files
					var toPush = [];
					for( b = 0; b < files.length; b++ )
					{
						found = false;
						for( a = 0; a < eles.length; a++ )
						{
							// Does directory + .dirinfo match file (the real dirinfo file)
							if( eles[a].fileInfo.Filename + '.dirinfo' == files[b].fileInfo.Filename )
							{
								// Put .dirinfo file on directory
								eles[a].infoFile = files[b];
								found = true;
								break;
							}
						}
						// We didn't find a directory for this file
						if( !found )
						{
							// Push to files to copy
							toPush.push( files[b] );
						}
					}
				
					// Clean up and put files "to push" into files for copy
					delete files;
					
					if( toPush.length )
					{
						for( a = 0; a < toPush.length; a++ )
							eles.push( toPush[a] );
					}
					delete toPush;
				
					// File infos first, go through all files for copy
					// Eles now contain directories, info files and normal files
					for( a = 0; a < eles.length; a++ )
					{
						var d = Workspace.getDoorByPath( eles[a].fileInfo.Path );
						if( d )
						{
							// Make sure we have file info
							var fin = eles[a].fileInfo;
							this.fileInfoCheck( fin );

							// Add dirs and files to queue
							var tt = fin.Type.toLowerCase();
							if( tt == 'directory' || tt == 'file' )
							{
								this.files.push( eles[a] );
								// Directories adds sub files subsequently
								if( tt == 'directory' )
								{
									// Add folder and make sub paths
									this.findSubFiles( { door: d, ele: eles[a] } );
								}
							}
						}
					}

					// Not counting anymore
					this.processing--;

					// If no more processing loops, it means we're finished!
					this.checkFinished();
				},
				// Find files in folders
				findSubFiles: function( folder, callback )
				{
					var o = this;
					
					// Counting!
					this.processing++;
					
					var d = Workspace.getDoorByPath( folder.ele.fileInfo.Path );
					if( !d )
					{
						this.processing--;
						return;
					}
					
					d.cancelId = series; // Register file operation id

					// Get icons on path
					d.getIcons( folder.ele.fileInfo, function( result )
					{
						var files = [];
						for( var z = 0; z < result.length; z++ )
						{
							// We need to have fileInfo
							o.fileInfoCheck( result[z] );
							if( result[z].Type.toLowerCase() == 'directory' )
							{
								var d = Workspace.getDoorByPath( result[z].Path );
								if( o.processedDirectories[ result[z].Path ] )
								{
									//console.log( '[fileoperations] Found a duplicate folder...' );
									continue;
								}
								o.processedDirectories[ result[z].Path ] = true;
								o.processedCount++;
								o.processedFilesize += parseInt( result[z].Filesize );
								files.push( result[z] );
								o.findSubFiles( { door: d, ele: result[z] } );
							}
							else if( result[z].Type.toLowerCase() == 'file' )
							{
								if( o.processedFiles[ result[z].Path ] )
								{
									//console.log( '[fileoperations] Found a duplicate file...' );
									continue;
								}
								o.processedFiles[ result[z].Path ] = true;
								o.processedCount++;
								o.processedFilesize += parseInt( result[z].Filesize );
								files.push( result[z] );
							}
						}
						// Put the files in the right order!
						o.checkFiles( files );
						// Done counting!
						o.processing--;
						infocontent.innerHTML = i18n( 'i18n_building_file_index' )  + ' ' + o.processedCount + '(' + humanFilesize( o.processedFilesize ) + ')';
						o.checkFinished();
					} );
				},
				// Check the fileinfo on element (every element needs one)
				fileInfoCheck: function( ele )
				{
					if( !ele.fileInfo )
					{
						ele.fileInfo = {
							Type: ele.Type,
							Path: ele.Path,
							Filesize: ele.Filesize,
							Filename: ele.Filename
						};
					}
				},
				// Copy files that have been added
				copyFiles: function()
				{
					// TODO: Performance test / question:
					//       Do we queue these, or just loop through,
					//       relying on server timeout
					if( !this.files || !this.files.length )
					{
						// No files, abort
						// Close window
						w.close();
						return false;
					}

					var fob = this;

					// Make sure our path is right
					var cfoF = cfo.Path.substr( cfo.Path.length - 1 );
					var p = '';
					if( cfoF != '/' && cfoF != ':' )
						p = '/';

					var i = 0;
					var stopAt = Math.min( this.stepsize, this.files.length );
					var fl, toPath, initNextBatch;
					var door;

					initNextBatch = false;

					var ic = new FileIcon(); 
					
					for( i = 0; i < stopAt; i++ )
					{
						fl = this.files[ i ];
						
						// Could be we have a just in time modified new path instead of path (in case of overwriting etc)
						var destPath = fl.fileInfo.NewPath ? fl.fileInfo.NewPath : fl.fileInfo.Path;
						
						toPath = cfo.Path + p + destPath.split( eles[0].window.fileInfo.Path ).join( '' );
						door = Workspace.getDoorByPath( fl.fileInfo.Path );
						door.cancelId = series;

						// Sanitation
						while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );

						if( i + 1 == stopAt ) initNextBatch = true;

						//console.log( 'Copying from: ' + fl.fileInfo.Path + ', to: ' + toPath );

						// Do the copy - we have files here only...
						ic.delCache( toPath );
						infocontent.innerHTML = 'Copying ' + fl.fileInfo.Path + '...';
						( function( nb ){
							door.dosAction( 'copy', { from: fl.fileInfo.Path, to: toPath }, function( result )
							{
								if( result.substr( 0, 3 ) != 'ok<' )
								{
									Notify( {
										title: i18n( 'i18n_filecopy_error' ),
										text: i18n( 'i18n_could_not_copy_files' ) + '<br>' + fl.fileInfo.Path + ' to ' + toPath
									} );
									fob.stop = true;
									CancelCajaxOnId( series );
									return;
								}						
								if( fob.stop ) return;
								fileCopyObject.nextStep( result, nb );
							} );
						} )( initNextBatch );
					}
				},
				createDirectories: function( reduceBar )
				{
					//update progress bar...
					if( reduceBar )
					{
						bar.items--; 
					}

					if( this.directories.length == 0 )
					{
						this.copyFiles();
					}
					else
					{
						// Make sure our path is right
						var cfoF = cfo.Path.substr( cfo.Path.length - 1 );
						var p = '';
						if( cfoF != '/' && cfoF != ':' )
							p = '/';

						var dir = this.directories.shift();
						var toPath = cfo.Path + p + dir.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
						var door = Workspace.getDoorByPath( cfo.Path );
						door.cancelId = series;

						// Sanitation
						while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );
					
						// Put it in a func
						function mkdirhere()
						{
							infocontent.innerHTML = i18n( 'i18n_creating_directory' ) + ' ' + toPath;
							door.notify = 'false';
							door.dosAction( 'makedir', { path: toPath }, function( result )
							{
								//var result = 'ok<!--separate-->'; // temp!
								var res = result.split( '<!--separate-->' );
								if( res[0] == 'ok' && !fileCopyObject.stop )
								{
									fileCopyObject.createDirectories( true );
								}
								// Failed - alert user
								else
								{
									Notify( { title: i18n( 'i18n_filecopy_error' ), text: i18n( 'i18n_could_not_make_dir' ) + ' (' + toPath + ')' } );
									w.close();
									sview.refresh();
								}
							});
						}
					
						// If dir has infofile, copy it first
						if( dir.infoFile )
						{
							// Info file is copied to parent of dir
							var ftPath = toPath.substr( 0, toPath.length - 1 ); // strip /
							var toParentPath = ftPath.indexOf( '/' ) > 0 ? ftPath.split( '/' ) : ftPath.split( ':' );
							toParentPath.pop();
							if( toParentPath.length == 1 ) toParentPath = toParentPath[0] + ':';
							else toParentPath = toParentPath.join( '/' ) + '/';
							toParentPath += dir.infoFile.Filename;
						
							//console.log( 'Copying from ' + dir.infoFile.fileInfo.Path + ', to: ' + toParentPath );
							door.dosAction( 'copy', { from: dir.infoFile.fileInfo.Path, to: toParentPath }, function( result )
							{
								//var result = 'ok<!--separate-->'; // temp!
								// TODO: Check result! If it is "fail" then stop
								var res = result.split( '<!--separate-->' );
								if( res[0] == 'ok' )
								{
									if( fileCopyObject.stop ) return;
									// Now make dir
									mkdirhere();
								}
								else
								{
									Notify( { title: i18n( 'i18n_filecopy_error' ), text: res[1] + ' (' + toPath + ')' } );
									w.close();
									sview.refresh();
								}
							} );
						}
						// Just maked ir
						else
						{
							mkdirhere();
						}
					}
				},
				nextStep: function( result, initNewRun )
				{
					var fob = this;
					if( initNewRun && fileCopyObject.files.length > this.stepsize )
					{
						var f = fileCopyObject.files;
						var nf = [];
						for( var b = this.stepsize; b < f.length; b++ )
							nf.push( f[b] );
						fileCopyObject.files = nf;
						fileCopyObject.copyFiles();
					}
					else if( initNewRun )
					{
						// Never!
					}

					// Timed refresh (don't refresh a zillion times!
					if( eles[0].window && eles[0].window.refresh )
					{
						if( this.refreshTimeout ) clearTimeout( this.refreshTimeout );
						this.refreshTimeout = setTimeout( function()
						{
							eles[0].window.refresh();
							fob.refreshTimeout = 0;
						}, 500 );
					}

					bar.items--;

					if( bar.items == 0 )
					{
						// No control key in? Delete files after copying - essentially moving the files
						if( !ctrl )
						{
							// Now delete files
							//first make the list complete again
							fob.files = fob.originalfilelist;

							w.deletable = fob.files.length;

							infocontent.innerHTML = i18n( 'i18n_cleaning_up' );

							// Delete in reverse
							var ic = new FileIcon();
							for( var b = fob.files.length - 1; b >= 0; b-- )
							{
								ic.delCache( fob.files[b].fileInfo.Path );
								d.dosAction( 'delete', { path: fob.files[b].fileInfo.Path }, function( result )
								{
									w.deletable--;
									if( w.deletable == 0 )
									{
										// Close window
										clearInterval( handleBarRefresh );
										w.close();

										// Tell Friend Core something changed
										var l = new Library( 'system.library' );
										l.cancelId = series;
										l.execute( 'file/notifychanges', { path: fob.files[0].fileInfo.Path } );
										var l = new Library( 'system.library' );
										l.cancelId = series;
										l.execute( 'file/notifychanges', { path: eles[0].window.fileInfo.Path } );
									}
								} );
							}
						}
						// Just copy! No delete! :)
						else
						{
							// Close window
							clearInterval( handleBarRefresh );
							w.close();

							// Tell Friend Core something changed
							var l = new Library( 'system.library' );
							l.cancelId = series;
							var p = winobj._window ? ( winobj._window.fileInfo.Path ? winobj._window.fileInfo.Path : winobj._window.fileInfo.Volume ) : false;
							if( p )
							{
								l.execute( 'file/notifychanges', { path: p } );
							}
						}
						// Clean out
						var arr = {};
						for( var a in windowArray )
						{
							if( a != windowArrayKey )
							{
								arr[ a ] = windowArray[ a ];
							}
						}
						arr = windowArray;
					}
				},
				// Do this when the processing loops are all done, finding files!
				checkFinished: function()
				{
					if( this.processing == 0 )
					{
						bar.total = this.files.length;
						bar.items = this.files.length;
						
						infocontent.innerHTML = i18n( 'i18n_counted' ) + ' ' + bar.items + ' ' + i18n( 'i18n_counted_files' );

						// Keep a copy as we will call copyFiles everytime after popping from our filellist
						// needs to be done to make sure directories are in place before files are copied
						// we might improve this and allow parallel processing once we have seperated files from directories and can be sure directories are processed first
						this.originalfilelist = this.files;

						// as we will handle 10 (or more) files at once we will need to create the directories first...
						// so we will take the directories out and put them into the beginning of the array after we are done

						// Set in directories and files
						var alldirs = [];
						var allfiles = [];
						for(var i = 0; i < this.files.length; i++)
						{
							if( this.files[i].fileInfo.Type == 'Directory' )
							{
								alldirs.push( this.files[i] );
							}
							else 
							{
								allfiles.push( this.files[i] );
							}
						}

						this.directories = alldirs;
						this.files = allfiles;

						// We need to create all directories before we can start tranferring files... 
						if( this.directories.length > 0 )
						{
							this.createDirectories();
						}
						else
						{
							this.copyFiles();
						}
					}
				}

			};
			
			// Start the process
			fileCopyObject.checkFiles( eles );

			// On close, stop copying
			w.onClose = function()
			{
				fileCopyObject.stop = true;
				CancelCajaxOnId( series );
				CopyCleanup();
			}
		}
		// Didn't work.. - important elements were missing in template
		else
		{
			this.master.fileoperations[ this.myid ].view.close();
		}
	}
	dview.fileoperations[ copySessionId ].progress.load();
	dview.fileoperations[ copySessionId ].mode = 'loading';
	
	// Return elements we wanted to copy
	return eles.length;
}
