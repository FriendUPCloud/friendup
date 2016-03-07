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

// DirectoryView class ------------------------------------------------------------

DirectoryView = function ( winobj )
{
	// Initial values
	this.listMode = 'iconview';

	if ( winobj )
	{
		this.InitWindow ( winobj );
		winobj.parentNode.className = winobj.parentNode.className.split ( ' IconWindow' ).join ( '' ) + ' IconWindow';
	}
}
DirectoryView.prototype.InitWindow = function ( winobj )
{
	winobj.directoryview = this;
	winobj.parentNode.className = winobj.parentNode.className.split ( ' IconWindow' ).join ( '' ) + ' IconWindow';
	winobj.redrawtimeouts = [];
	winobj.redrawBackdrop = function()
	{
		if( Workspace.windowWallpaperImage )
		{
			this.style.backgroundImage = 'url(\'' + getImageUrl( Workspace.windowWallpaperImage ) + '\')';
			this.style.backgroundPosition = 'top left';
			this.style.backgroundRepeat = 'repeat';
		}
		else
		{
			this.style.backgroundImage = '';
		}
	}
	winobj.redrawBackdrop();
	winobj.redrawIcons = function ( icons, direction )
	{
		self = this;

		// Blocking? Wait with call
		if( this.redrawing )
		{
			//if we have odler stuff, stop it
			if( this.redrawtimeouts.length > 0 )
				for(var i = 0; i < this.redrawtimeouts.length; i++)
					clearTimeout(this.redrawtimeouts[i]);
					
			//lets us wait a bit and try redrawing then
			this.redrawtimeouts.push( setTimeout( function()
			{
				winobj.redrawIcons( icons, direction );
			}, 250 ) );
		}
		this.redrawing = true;
		
		// Store
		if( icons ) this.icons = icons;
		if( direction ) this.direction = direction;
		
		// Clean icons
		var out = [];
		if( this.icons )
		{
			for( var a = 0; a < this.icons.length; a++ )
			{
				var i = this.icons[a];
				var o = {};
				for( var t in i )
				{
					switch( t )
					{
						case 'domNode':
						case '__proto__':
							break;
						default:
							o[t] = i[t];
							break;
					}
				}
				out.push( o );
			}
			
			this.icons = out;
			
			// Sort and add cleaned icons
			this.icons = sortArray( out, [ 'Title', 'Filename' ] );
		
			// Check directory listmode
			switch( this.directoryview.listMode )
			{
				case 'iconview':
				{
					setTimeout( function(){ self.redrawing = false; }, 250 );
					return this.directoryview.RedrawIconView ( this, this.icons, direction );
				}
				case 'listview':
				{
					setTimeout( function(){ self.redrawing = false; }, 250 );
					return this.directoryview.RedrawListView ( this, this.icons, direction );
				}
			}
		}
		this.redrawing = false;
		return false;
	}
	
	winobj.parentNode.rollOver = function ( eles )
	{
		//SetOpacity ( this, 0.8 );
		this.classList.add('DragTarget');
		window.targetMovable = this;
	}
	
	winobj.parentNode.rollOut = function ( eles )
	{
		this.classList.remove('DragTarget');
		//SetOpacity ( this, 1 );
	}
	
	
	//if host support drag&drop we want to use that.
	if( window.File && window.FileReader && window.FileList && window.Blob )
	{
		function handleHostDragOver( e )
		{
			e.stopPropagation();
			e.preventDefault();
			
			this.classList.add('DragTarget');
		}
		
		function handleHostDragOut( e )
		{
			this.classList.remove('DragTarget');
		}
		
		function handleHostFileSelect( e )
		{
			
			
			var files = e.dataTransfer.files||e.target.files;
			
			if( files.length < 1 ) return;

			e.stopPropagation();
			e.preventDefault();
			
			if( files && this.content && this.content.fileInfo && this.content.fileInfo.Volume )
			{
				var uworker = new Worker( 'js/io/filetransfer.js' );
				
				// Open window
				var w = new View( { 
					title:  i18n( 'i18n_copying_files' ), 
					width:  320, 
					height: 100, 
					id:     'fileops'
				} );
				
				var uprogress = new File( 'templates/file_operation.html' );

				uprogress.connectedworker = uworker;
				
				uprogress.onLoad = function( data )
				{
					data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
					w.setContent( data );
				
					w.connectedworker = this.connectedworker;
					w.onClose = function()
					{
						Doors.diskNotification( [ winobj ], 'refresh' );
						if( this.connectedworker ) this.connectedworker.postMessage({'terminate':1});
					}
				
					uprogress.myview = w;
				
					// Setup progress bar
					var eled = w.getWindowElement().getElementsByTagName( 'div' );
					var groove = false, bar = false, frame = false, progressbar = false;
					for( var a = 0; a < eled.length; a++ )
					{
						if( eled[a].className )
						{
							var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'Info' ];
							for( var b = 0; b < types.length; b++ )
							{
								if( eled[a].className.indexOf( types[b] ) == 0 )
								{
									switch( types[b] )
									{
										case 'ProgressBar': progressbar    = eled[a]; break;
										case 'Groove':      groove         = eled[a]; break;
										case 'Frame':       frame          = eled[a]; break;
										case 'Bar':         bar            = eled[a]; break;
										case 'Info':		uprogress.info = eled[a]; break;
									}
									break;
								}
							}
						}
					}
					
					
					//activate cancel button... we assume we only hav eone button in the template
					var cb = w.getWindowElement().getElementsByTagName( 'button' )[0];
					
					cb.mywindow = w;
					cb.onclick = function( e )
					{
						this.mywindow.close();
					}
					
					// Only continue if we have everything
					if( progressbar && groove && frame && bar )
					{
						progressbar.style.position = 'relative';
						frame.style.width = '100%';
						frame.style.height = '40px';
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
						
						// Preliminary progress bar
						bar.total = files.length;
						bar.items = files.length;
						uprogress.bar = bar;
					}
					uprogress.loaded = true;
					uprogress.setProgress(0);
					
					
				}
				
				
				uprogress.setProgress = function( percent ) {
					// only update display if we are loaded...
					// otherwise just drop and wait for next call to happen ;)
					if( uprogress.loaded )
					{
						uprogress.bar.style.width = Math.floor( Math.max(1,percent ) ) + '%';
						uprogress.bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
						Math.floor( percent ) + '%</div>';
					}
				};
				
				uprogress.setUnderTransport = function()
				{
					// show notice that we are transporting files to the server....
					uprogress.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">Transferring files to target volume...</div>';
					uprogress.myview.setFlag("height",125);
				}
				
				uprogress.displayError = function( msg )
				{
					uprogress.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">'+ msg +'</div>';
					uprogress.myview.setFlag("height",140);
				}
				
				uworker.onerror = function( err ) {
					console.log('Upload worker error #######');
					console.log( err );
					console.log('###########################');	
				};
				uworker.onmessage = function( e )
				{
					//console.log('Worker sends us back ------------ -');
					//console.log( e.data );
					//console.log('--------------------------------- -');
					
					
					if( e.data['progressinfo'] == 1 )
					{
						if( e.data['uploadscomplete'] == 1 )
						{
							w.close();
							winobj.refresh();
							//does not work??? Doors.diskNotification( [ winobj ], 'refresh' );
							return true;
						}
						else if( e.data['progress'] )
						{
							uprogress.setProgress( e.data['progress'] );
							if( e.data['filesundertransport'] && e.data['filesundertransport'] > 0 )
							{
								uprogress.setUnderTransport();
							}
						}
						
					}
					else if( e.data['error'] == 1 )
					{
						uprogress.displayError(e.data['errormessage']);
					}
					
				}
				
				uprogress.load();
				
				uworker.postMessage( {
					'session': Workspace.sessionId,
					'targetPath': this.content.fileInfo.Path, 
					'targetVolume': this.content.fileInfo.Volume, 
					'files': files 
				} );
			}
		}
		
		winobj.parentNode.addEventListener('dragleave', handleHostDragOut, false);
		winobj.parentNode.addEventListener('dragover', handleHostDragOver, false);
		winobj.parentNode.addEventListener('drop', handleHostFileSelect, false);
		
	} // end of check for html5 file upload capabilities
	
	
	// Dropping an icon on a window!
	winobj.parentNode.drop = function ( eles, e )
	{
		// Check some events
		if( !e ) e = window.event;
		
		var ctrl = ( typeof( e ) != 'undefined' && e.ctrlKey ) ? e.ctrlKey : false;
		
		// Window is the target
		var cfo = this.content.fileInfo;
		
		// Can't drop stuff on myself!
		if ( this.content == eles[0].window )
		{
			cfo = false;
			
			// Check if we're dropping on a folder icon
			var divs = this.content.getElementsByTagName( 'div' );
			var icons = [];
			
			var mx = windowMouseX - this.offsetLeft;
			var my = windowMouseY - this.offsetTop;
			
			for( var a = 0; a < divs.length; a++ )
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

			if( !cfo )
			{
				this.content.refresh();
				eles[0].window.refresh();
				return;
			}
		}
		
		// Immediately refresh source!	
		Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
		
		//sanitize input... no folder to be dropped into themselves or their children....
		var clean = [];
		//console.log('Our movable windows ## ## ## ## ## ## ## ## ## ## ## ');
		//console.log( movableWindows );
		//console.log('END movable windows ## ## ## ## ## ## ## ## ## ## ## ');
		
		for( var i = 0; i < eles.length; i++ )
		{
			if( !cfo.Path || !eles[i].window.fileInfo || !eles[i].window.fileInfo.Path )
			{
				clean.push( eles[i] )
				continue;
			}
			if( ( ''+cfo.Path ).indexOf( eles[i].window.fileInfo.Path + eles[i].Title ) == -1 )
			{
				clean.push( eles[i] );
				for( var j in movableWindows )
				{
					//console.log('do some checks on our item here... ' + i + '/' + j);
					//console.log( ('' + movableWindows[j].titleString ).indexOf( eles[i].window.fileInfo.Path + eles[i].Title ) );
					//console.log( ('' + eles[i].window.fileInfo.Path + eles[i].Title ).indexOf( movableWindows[j].titleString ) );
					//console.log( 'compare' );
					//console.log( movableWindows[j] == eles[i] );
					//console.log( 'moveableWindows[j]' );
					//console.log( 'Titlestring in Windows :' + movableWindows[j].titleString );
					//console.log( 'eles[i]' );
					//console.log( 'Our moved element      :' + eles[i].window.fileInfo.Path + eles[i].Title);
					//console.log( 'Source window title    :' + this.content.fileInfo.Path );

					if( 
						movableWindows[j] && movableWindows[j].titleString && 
						('' + movableWindows[j].titleString ).indexOf( eles[i].window.fileInfo.Path + eles[i].Title ) != -1 
					)
					{
						movableWindows[j].windowObject.close();
					}
				}
			}
		}
		if( clean.length == 0 ) return;
		
		eles = clean;
		var sPath = this.content.fileInfo.Path;
		var dPath = eles[0].window.fileInfo ? eles[0].window.fileInfo.Path : false;
		
		// Always copy when on different volumes
		if( 
			sPath && dPath &&
			this.content.fileInfo && eles[0].window.fileInfo &&
			this.content.fileInfo.Path.split( ':' )[0] != eles[0].window.fileInfo.Path.split( ':' )[0] 
		)
		{
			ctrl = true;
		}
		
		if( !sPath || !dPath || sPath.indexOf( 'System:' ) == 0 || dPath.indexOf( 'System:' ) == 0 )
		{
			if( eles[0].window && eles[0].window.refresh )
				eles[0].window.refresh();
			else Workspace.refreshDesktop();
			this.content.refresh();
			return;
		}
		
		// Open window
		var w = new View( { 
			title:  ctrl ? i18n( 'i18n_copying_files' ) : i18n('i18n_moving_files'), 
			width:  320, 
			height: 100, 
			id:     'fileops'
		} );
		
		// Load template
		var progress = new File( 'templates/file_operation.html' );
		progress.onLoad = function( data )
		{
			data = data.split( '{cancel}' ).join( i18n( 'i18n_cancel' ) );
			w.setContent( data );
		
			// Setup progress bar
			var eled = w.getWindowElement().getElementsByTagName( 'div' );
			var groove = false, bar = false, frame = false, progressbar = false;
			for( var a = 0; a < eled.length; a++ )
			{
				if( eled[a].className )
				{
					var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar' ];
					for( var b = 0; b < types.length; b++ )
					{
						if( eled[a].className.indexOf( types[b] ) == 0 )
						{
							switch( types[b] )
							{
								case 'ProgressBar': progressbar = eled[a]; break;
								case 'Groove':      groove      = eled[a]; break;
								case 'Frame':       frame       = eled[a]; break;
								case 'Bar':         bar         = eled[a]; break;
							}
							break;
						}
					}
				}
			}
			
			// Only continue if we have everything
			if( progressbar && groove && frame && bar )
			{
				progressbar.style.position = 'relative';
				frame.style.width = '100%';
				frame.style.height = '40px';
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
				
				// Preliminary progress bar
				bar.total = eles.length;
				bar.items = eles.length;
				
				// Create a filecopy object
				var fileCopyObject = {
					files: [],
					processing: 0,
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
					// Find files in folders
					findSubFiles: function( folder )
					{
						// Counting!
						this.processing++;
						var d = Doors.getDoorByPath( folder.ele.fileInfo.Path );
						if( !d )
						{
							this.processing--;
							return;
						}
						
						var o = this;
						
						// Get icons on path
						d.getIcons( folder.ele.fileInfo, function( result )
						{
							for( var z = 0; z < result.length; z++ )
							{
								// We need to have fileInfo
								o.fileInfoCheck( result[z] );
								if( result[z].Type.toLowerCase() == 'directory' )
								{
									var d = Doors.getDoorByPath( result[z].Path );
									o.files.push( result[z] );
									o.findSubFiles( { door: d, ele: result[z] } );
								}
								else if( result[z].Type.toLowerCase() == 'file' )
								{
									o.files.push( result[z] );
								}
							}
							// Done counting!
							o.processing--;
							o.checkFinished();
						} );
					},
					// Check all files (type etc)
					checkFiles: function( eles )
					{
						// Counting!
						this.processing++;
						
						// Collect all files!
						for( var a = 0; a < eles.length; a++ )
						{
							var d = Doors.getDoorByPath( eles[a].fileInfo.Path );
							var fin = eles[a].fileInfo;
							if( d )
							{
								// Make sure we have file info
								this.fileInfoCheck( fin );
								
								// Check type, and if folder collect files
								if( fin.Type.toLowerCase() == 'directory' )
								{
									// Add folder and make sub paths
									this.files.push( eles[a] );
									this.findSubFiles( { door: d, ele: eles[a] } );
								}
								else if( fin.Type.toLowerCase() == 'file' )
								{
									this.files.push( eles[a] );
								}
							}
						}
						
						// Not counting anymore
						this.processing--;
						
						// No more processing loops, it means we're finished!
						this.checkFinished();
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
							
							// Refresh source and target
							Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
							return false;
						}
						
						var fob = this;
						var d = Doors.getDoorByPath( this.files[0].fileInfo.Path );
						
						// Make sure our path is right
						var cfoF = cfo.Path.substr( 0, cfo.Path.length - 1 );
						var p = '';
						if( cfoF != '/' && cfoF != ':' )
							p = '/';
						

						var fl = this.files[0];
						
						var toPath = cfo.Path + p + fl.fileInfo.Path.split(eles[0].window.fileInfo.Path).join('');
						
						// Sanitation
						while( toPath.indexOf( ':/' ) >= 0 ) toPath = toPath.split( ':/' ).join ( ':' );
						while( toPath.indexOf( '//' ) >= 0 ) toPath = toPath.split( '//' ).join ( '/' );
						
						// Start with a whosh
						if( a == 0 )
						{
							bar.style.width = Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%';
							bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
								Math.floor( 100 - ( 100 / bar.total * (bar.items-1) ) ) + '%</div>';
						}
						
						// Do the copy
						d.dosAction( 'copy', { from: fl.fileInfo.Path, to: toPath }, function( result )
						{
							if( fileCopyObject.files.length > 1 )
							{
								var f = fileCopyObject.files;
								var nf = [];
								for( var b = 1; b < f.length; b++ )
									nf.push( f[b] );
								fileCopyObject.files = nf;
								fileCopyObject.copyFiles();									
							}
							
							// Initial refresh
							eles[0].window.refresh();
							bar.items--;
							bar.style.width = Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%';
							bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
								Math.floor( 100 - ( 100 / bar.total * bar.items ) ) + '%</div>';
							if( bar.items == 0 )
							{	
								// No control key in? Delete files after copying - essentially moving the files
								if( !ctrl )
								{
									// Now delete files
									//first make the list complete again
									fob.files = fob.originalfilelist;
									
									w.deletable = fob.files.length;
									bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">Cleaning up...</div>';
									
									
									// Delete in reverse
									for( var b = fob.files.length - 1; b >= 0; b-- )
									{
										console.log( 'Deleting file: ' + fob.files[b].fileInfo.Path );
										d.dosAction( 'delete', { path: fob.files[b].fileInfo.Path }, function( result )
										{
											w.deletable--;
											if( w.deletable == 0 )
											{
												// Close window
												w.close();
											
												// Refresh source and target
												Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
											}
										} );
									}
								}
								// Just copy! No delete! :)
								else
								{
									// Close window
									w.close();
								
									// Refresh source and target
									Doors.diskNotification( [ winobj, eles[0].window ], 'refresh' );
								}
							
							}
						} );
						
					},
					// Do this when the processing loops are all done!
					checkFinished: function()
					{
						if( this.processing == 0 )
						{
							bar.total = this.files.length;
							bar.items = this.files.length;
							
							//keep a copy as we will call copyFiles once after popping from our filellist
							//needs to be done to make sure directories are in place before files are copied
							//we might improve this and allow parallel processing once we have seperated files from directories and can be sure directories are processed first
							this.originalfilelist = this.files;
							this.copyFiles();						
						}
					}
				};
				fileCopyObject.checkFiles( eles );
			}
			// Didn't work..
			else
			{
				w.close();
			}
		}
		progress.load();
		
		return eles.length;
	}
}
DirectoryView.prototype.GetTitleBar = function ()
{
	if ( window.currentScreen )
	{
		return window.currentScreen.firstChild;
	}
	return false;
}
DirectoryView.prototype.RedrawIconView = function ( obj, icons, direction )
{
	// Remember scroll top
	var stop = 0;
	var slef = 0;
	if( obj.scroller )
	{
		if( obj.scroller.scrollTop )
		{
			stop = obj.scroller.scrollTop;
			slef = obj.scroller.scrollLeft;
		}
	}
	
	obj.innerHTML = '';
	if( !icons || ( icons && !icons.length ) )
		return;
	
	var sc = document.createElement ( 'div' );
	sc.style.position = 'relative';
	sc.className = 'Scroller';
	
	// TODO: We will not use overflow-x unless we turn off autosorting of icons
	if( icons[0].Type != 'Door' && icons[0].Type != 'Dormant' )
	{
		sc.style.overflowX = 'hidden';
	}
	
	obj.appendChild ( sc );
	obj.scroller = sc;
	
	var windowWidth = obj.offsetWidth;
	var windowHeight = obj.offsetHeight;
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;
	if ( !icons ) return;
	var gridX = 128;
	var gridY = 96;
	var marginTop = 0;
	var marginLeft = 0;
	
	var ue = navigator.userAgent.toLowerCase();
	if( window.isMobile )
	{
		gridX = 110;
		if( icons[0].Type != 'Door' && icons[0].Type != 'Dormant' )
		{
			marginLeft = 16;
		}
	}
	
	var iy = marginTop; var ix = marginLeft;
	var column = 0;
	var start = false;
	// Clear the window
	if ( obj.scroller && obj.scroller.innerHTML.length )
		obj.scroller.innerHTML = '';

	// Start column
	var coldom = document.createElement ( 'div' );
	obj.scroller.appendChild ( coldom );
	obj.icons = [];

	// Avoid duplicate filenames..
	var filenameBuf = [];

	// Loop through icons (if list of objects)
	if( typeof( icons[0] ) == 'object' )
	{
		for( var a = 0; a < icons.length; a++ )
		{
			// TODO: Show hidden files if we _must_
		 	var fn = icons[a].Filename ? icons[a].Filename : icons[a].Title;
			if( fn.substr( 0, 1 ) == '.' ) continue;
			
			// Skip duplicates
			var fnd = false;
			for( var z = 0; z < filenameBuf.length; z++ )
			{
				if( filenameBuf[z] == fn )
				{
					fnd = true;
					break;
				}
			}
			if( fnd ) continue;
			filenameBuf.push( fn );
			
			
			if( icons[a].ElementType == 'Config' )
			{
				if ( icons[a].Toolbar )
				{
					var t = document.createElement ( 'div' );
					t.className = 'Toolbar';
					for( var q = 0; q < icons[a].Toolbar.length; q++ )
					{
						var barP = icons[a].Toolbar[q];
						var bar = document.createElement ( 'div' );
						var icon = document.createElement ( 'img' );
						var label = document.createElement ( 'span' );
						for( var v in barP )
						{
							switch ( v )
							{
								case 'Icon':
									icon.src = barP[v];
									break;
								case 'Label':
									label.innerHTML = barP[v];
									break;
								case 'OnClick':
									bar.window = winobj;
									bar.setAttribute ( 'onclick', barP[v] );
									break;
							}
						}
						bar.appendChild( icon );
						bar.appendChild( label );
						t.appendChild( bar );
					}
					obj.parentNode.appendChild( t );
					iy = 25;
					marginTop = 25;
				}
				continue;
			}
			var file;
			if( icons[a].position )
			{
				// TODO: Read position rules and place absolutely
			}
			else
			{
				if( icons[a].Type == 'Door' && !icons[a].Mounted ) continue;
				
				file = CreateIcon( icons[a] );
				file.style.top = iy + 'px';
				file.style.left = ix + 'px';
		
				if( direction == 'vertical' )
				{
					iy += gridY;
					if( iy + gridY > windowHeight )
					{
						iy = marginTop;
						ix += gridX;
						coldom = document.createElement ( 'div' );
						obj.scroller.appendChild ( coldom );
					}
				}
				else
				{
					ix += gridX;
					if( ix + gridX > windowWidth )
					{
						iy += gridY;
						ix = marginLeft;
						coldom = document.createElement ( 'div' );
						obj.scroller.appendChild ( coldom );
					}
				}
			}
			if( typeof ( file ) == 'object' )
			{
				coldom.appendChild ( file );
				file.window = obj;
				// TODO: This doesn't work! How to get icon dropping!
				file.rollOver = function( eles )
				{
					SetOpacity( obj.domNode, 0.8 );
				}
				file.rollOut = function( eles )
				{
					SetOpacity( obj.domNode, 1 );
				}
				icons[a].domNode = file;
				obj.icons.push( icons[a] );
			}
			if( typeof ( obj.parentNode ) != 'undefined' && obj.parentNode.refreshWindow )
			{
				obj.parentNode.refreshWindow();
			}
		}
	}
	
	obj.scroller.scrollTop = stop;
	obj.scroller.scrollLeft = slef;
}

// Makes a listview
DirectoryView.prototype.RedrawListView = function( obj, icons, direction )
{
	obj.direction = direction ? direction : 'horizontal';
	icons = icons ? icons : obj.icons;
	if( !icons ) return;
		
	// Make sure we have a listview columns header bar
	var headers = { 
		'filename' : 'Filename',
		'size'     : 'Size',
		'date'     : 'Date',
		'flags'    : 'Flags'
	};
	
	// Default widths
	var defwidths = {
		'filename' : '45%',
		'size'     : '20%',
		'date'     : '25%',
		'flags'    : '10%'
	};
	
	var divs = obj.getElementsByTagName( 'div' );
	//if ( divs.length == 1 && divs[0].className == 'Scroller' )
	//{
		obj.innerHTML = '';
		divs = [];
	//}
	
	// Setup the listview for the first time
	if( !divs.length )
	{
		var lvie = document.createElement( 'div' );
		lvie.className = 'Listview';
		var head = document.createElement( 'div' );
		head.className = 'Headers';
		for( var a in headers )
		{
			var d = document.createElement( 'div' );
			d.className = 'Header';
			d.innerHTML = headers[a];
			d.style.width = defwidths[a];
			head.appendChild ( d );
		}
		lvie.appendChild ( head );
		
		// Add icon container
		var cicn = document.createElement( 'div' );
		cicn.className = 'ScrollArea Icons';
		lvie.appendChild ( cicn );
		
		// Add icon content container
		var icnt = document.createElement( 'div' );
		icnt.className = 'Scroller';
		obj.scroller = icnt;
		cicn.appendChild ( icnt );
		
		// Add footer
		var foot = document.createElement( 'div' );
		foot.className = 'Footer';
		lvie.appendChild ( foot );
		
		// Add listview
		obj.appendChild ( lvie );
		divs = obj.getElementsByTagName( 'div' );
	}
	// Get icon container
	var icnt = false;
	for( var a = 0; a < divs.length; a++ )
	{
		if( divs[a].className == 'Scroller' )
		{
			icnt = divs[a];
			break;
		}
	}
	// Major error
	if( !icnt ) return false;
	
	// Clear list
	icnt.innerHTML = '';
	var bts = 0;
	
	// Fill the list (TODO: Repopulate existing listview to reduce flicker)
	if( typeof( icons[0] ) == 'object' )
	{
		for( var a = 0; a < icons.length; a++ )
		{
			var t = icons[a].Title ? icons[a].Title : icons[a].Filename;
			
			if( t.split ( ' ' ).join ( '' ).length == 0 ) t = 'Unnamed';
			
			var r = document.createElement ( 'div' );
			r.className = 'Row';
			for( var b in headers )
			{
				var c = document.createElement ( 'div' );
				switch( b )
				{
					case 'filename':
						c.innerHTML = t;
						break;
					case 'size':
						c.innerHTML = icons[a].Filesize ? humanFilesize ( icons[a].Filesize ) : '&nbsp;';
						c.style.textAlign = 'right';
						break;
					case 'date':
						c.innerHTML = icons[a].DateCreated;
						c.style.textAlign = 'right';
						break;
					case 'flags':
						c.innerHTML = icons[a].Flags ? icons[a].Flags : '****';
						c.style.textAlign = 'center';
						break;
					default:
						c.innerHTML = headers[b];
						break;
				}
				c.className = 'Column';
				c.style.width = defwidths[b];
				r.appendChild ( c );
			}
			bts += icons[a].Filesize ? parseInt( icons[a].Filesize ) : 0;
			if ( a % 2 == 0 ) r.className += ' Odd';
			icnt.appendChild( r );
			var f = CreateIcon( icons[a] );
			f.associateWithElement( r );
		}
	}
	
	// Position the rows
	var t = 0;
	var ds = icnt.getElementsByTagName ( 'div' );
	for( var a = 0; a < ds.length; a++ )
	{
		if( ds[a].className.substr ( 0, 3 ) == 'Row' )
		{
			ds[a].style.top = t + 'px';
			t += 30;
		}
	}
	
	var filesize = humanFilesize ( bts );
	foot.innerHTML = icons.length + ' icons listed with a total of ' + filesize + '.';
	
	if( typeof( obj.parentNode ) != 'undefined' && obj.parentNode.refreshWindow )
	{
		obj.parentNode.refreshWindow ();
	}
}

// Create a directoryview on a div / Window (shortcut func (deprecated?))
function CreateDirectoryView( winobj )
{
	var w = new DirectoryView( winobj );
	return w;
}

// Icon class ------------------------------------------------------------------

FileIcon = function( fileInfo )
{
	this.Init ( fileInfo );
}

FileIcon.prototype.Init = function( fileInfo )
{
	// Create the file icon div
	this.file = document.createElement( 'div' );
	var file = this.file;
	file.className = 'File';
	file.style.position = 'absolute';
	
	// Attach this object to dom element
	file.object = this;

	// Get the file extension, if any
	var extension = fileInfo.Filename ? fileInfo.Filename.split('.') : false;
	if( typeof( extension ) == 'object' && extension.length > 1 )
	{
		extension = extension[extension.length-1].toLowerCase();
	}
	else extension = '';
	
	
	// Create the div that holds the actual icon
	icon = document.createElement ( 'div' );
	icon.className = 'Icon';
	iconInner = document.createElement ( 'div' );
	if( fileInfo.Icon )
	{
		iconInner.className = fileInfo.Icon;
	}
	else if( fileInfo.IconFile )
	{
		iconInner.className = 'Custom';
		iconInner.style.backgroundImage = 'url(' + fileInfo.IconFile + ')';
	}
	else
	{
		switch( extension )
		{
			case 'jpg':
				iconInner.className = 'TypeJPG';
				break;
			case 'jpeg':
				iconInner.className = 'TypeJPEG';
				break;
			case 'png':
				iconInner.className = 'TypePNG';
				break;
			case 'gif':
				iconInner.className = 'TypeGIF';
				break;
			case 'odt':
			case 'abw':
			case 'docx':
			case 'doc':
				iconInner.className = 'TypeDOC';
				break;
			case 'pdf':
				iconInner.className = 'TypePDF';
				break;
			case 'txt':
				iconInner.className = 'TypeTXT';
				break;
			case 'avi':
				iconInner.className = 'TypeAVI';
				break;
			case 'mp4':
				iconInner.className = 'TypeMP4';
				break;
			case 'mov':
				iconInner.className = 'TypeMOV';
				break;
			case 'mpeg':
				iconInner.className = 'TypeMPEG';
				break;
			case 'mp3':
				iconInner.className = 'TypeMP3';
				break;
			case 'wav':
				iconInner.className = 'TypeWAV';
				break;
			case 'ogg':
				iconInner.className = 'TypeOGG';
				break;
			case 'jsx':
				iconInner.className = 'TypeJSX';
				break;
			case 'js':
				iconInner.className = 'TypeJS';
				break;
			case 'run':
				iconInner.className = 'TypeRUN';
				break;
			case 'html':
				iconInner.className = 'TypeHTML';
				break;
			default:
				switch( fileInfo.MetaType )
				{
					case 'Meta':
						iconInner.className = 'Application';
						break;
					case 'Directory':
						if( fileInfo.Title == 'Upload' )
						{
							iconInner.className = 'Directory Upload';
						}
						else iconInner.className = 'Directory';
						break;
					default:
						iconInner.className = 'File';
				}
				if( typeof ( fileInfo.Type ) != 'undefined' )
					iconInner.className += ' ' + fileInfo.Type;
				break;
		}
	}

	// Create the title
	title = document.createElement( 'a' );
	title.className = 'Title';
	title.innerHTML = fileInfo.Title ? fileInfo.Title : 
		( fileInfo.Filename ? fileInfo.Filename : 'Uten navn' );
	title.title = title.innerHTML;
	file.title = title.title;


	



	// Cook at 225°C for 45 minutes
	icon.appendChild( iconInner );
	file.appendChild( icon );
	file.appendChild( title );
	
	file.fileInfo = fileInfo;
	file.extension = extension;
	file.Title = title.innerText;

	if(extension && fileInfo.Filename)
	{
		download = document.createElement('a');		
		download.className = 'Download';
		download.innerHTML = ''; //fileInfo.Filename;
		download.title = 'Drag icon to download file';
		download.setAttribute('data-filename', fileInfo.Filename);
		
		download.setAttribute('data-downloadurl', 'application/octec-stream:'+ fileInfo.Filename +':'+ document.location.protocol +'//'+ document.location.host +'/system.library/file/read?mode=rb&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( fileInfo.Path ) +'');		
		download.setAttribute('draggable','true');
		download.setAttribute('href',document.location.protocol +'//'+ document.location.host +'/system.library/file/read?mode=rb&sessionid=' + Workspace.sessionId + '&path='+ encodeURIComponent( fileInfo.Path ))
		download.setAttribute('onclick', 'return false;');
		
		//console.log('Download attribute set to ' + download.getAttribute('data-downloadurl'));
		
		file.appendChild( download );
		download.addEventListener("mousedown", function(e) {
			//nothing to be done here...
			//e.target.className = e.target.className + ' Clicked';
			e.stopPropagation();
		});

		download.addEventListener("dragstart",function(e){
			
				e.stopPropagation();
			
				e.target.className = 'Download Active';
				console.log('OUr new className is ' + e.target.className );
				e.target.innerHTML = e.target.getAttribute('data-filename');
				
				var fd = false;
				if(e.target.dataset == 'undefined')
					fd = this.getAttribute('data-downloadurl');
				else
					fd = this.dataset.downloadurl;
	
				if(fd && e && e.dataTransfer)
				{
					//e.dataTransfer.effectAllowed = 'copy';
					//e.dataTransfer.dropEffect = 'copy';
					e.dataTransfer.setData('DownloadURL', fd);
				}			
		},true);
		download.addEventListener("dragend", function(e) {
			//console.log('drag ended');
			e.target.className = 'Download';
			e.target.innerHTML = '';
			e.stopPropagation();
		});	
		download.addEventListener("mouseup", function(e) {
			e.target.className = 'Download';
			e.target.innerHTML = '';
			e.stopPropagation();
		});			
	}
	else
	{
		//console.log('no extension and filename? ',extension,fileInfo.Filename);
	}
	


	file.rollOver = function ( eles )
	{
		this.classList.add('DragTarget');
	}
	
	file.rollOut = function ( eles )
	{
		this.classList.remove('DragTarget');
	}
	
	// Attach events
	file.onmousedown = function( e )
	{
		if(e.target.className == 'Download') return;
		
		console.log('file mousedown trggered',e.target.className);
		if( !e ) e = window.event;
		if( this.window )
		{
			var rc = 0;
			if( e.which ) rc = ( e.which == 3 );
			else if( e.button ) rc = ( e.button == 2 );
			if( !rc )
			{
				window.mouseDown = this;
			}
		}
		
		// Use the right click!
		if( e.button != 0 )
			return false;
		
		// Activate screen on click
		SetScreenByWindowElement( this );
		
		e.stopPropagation();

	}

	// This one driggers dropping icons! (believe it or not)
	file.onmouseup = function( e )
	{
		if(e.target.className == 'Download') return;
		
		if( mousePointer && mousePointer.elements.length )
		{
			// Drop on an icon on a workbench icon
			if( window.targetMovable == ge( 'Doors' ) )
			{
				// TODO: Implement desktop dropping!
			}
			// Drop an icon on top of another normal window icon
			else if( window.targetMovable && window.targetMovable.id )
			{
				// TODO: Implement icon dropping!
			}
		}
		window.targetMovable = false;
	}
	file.onclick = function( e )
	{
		if( !e ) e = window.event;
		var sh = e.shiftKey || e.ctrlKey;
		if( !sh )
		{
			clearRegionIcons();
		}
		if( this.window )
		{
			_ActivateWindow( this.window.parentNode, false, e );
		}
		this.className = this.className.indexOf ( ' Selected' ) >= 0 ? ( this.className.split ( ' Selected' ).join ( '' ) ) : ( this.className + ' Selected' );
	}
	file.onselectstart = function( e )
	{
		return cancelBubble( e );
	}
	
	file.onmouseout = function( e )
	{
		if ( !e ) e = window.event;
		if ( window.mouseDown == this )
		{
			mousePointer.pickup ( this );
			window.mouseDown = 4;
			return cancelBubble ( e );
		}
	}
	file.ondblclick = function( event )
	{
		if( !event ) event = window.event;
		
		// File extension
		if( this.fileInfo && this.fileInfo.Path )
		{
			var ext = this.fileInfo.Path.split( '.' );
			if( ext.length > 1 )
			{
				ext = '.' + ext[ext.length-1].toLowerCase();
		
				// Check mimetypes
				for( var a in Workspace.mimeTypes )
				{
					var mt = Workspace.mimeTypes[a];
					for( var b in mt.types )
					{
						if( ext == mt.types[b].toLowerCase() )
						{
							return ExecuteApplication( mt.executable, this.fileInfo.Path );
						}
					}
				}
			}
		}
		
		// Do the default
		OpenWindowByFileinfo( this.fileInfo, event );
	}
	file.associateWithElement = function ( div )
	{
		var t = this;
		div.onclick = function () { t.onclick (); };
		div.onmouseup = function () { t.onmouseup (); };
		div.onmousedown = function () { t.onmousedown (); };
		div.onmouseout = function () { t.onmouseout (); };
		div.onselectstart = function () { t.onselectstart (); };
		div.ondblclick = function () { t.ondblclick () };
	}
	
	// Let's make it possible also for touch interfaqces
	if( file.addEventListener )
	{
		file.addEventListener( 'touchstart', function( event )
		{
			if( window.clickElement == file )
			{
				file.ondblclick( event ); 
				Doors.closeDrivePanel();
				window.clickElement = null;
			}
			window.clickElement = file; 
			setTimeout( function()
			{
				window.clickElement = null;
			}, 250 );
			
		}, false );
	}
	else 
	{
		file.attachEvent( 'ontouchstart', function( event )
		{
			if( window.clickElement == file )
			{
				file.ondblclick( event ); 
				Doors.closeDrivePanel();
				window.clickElement = null;
			}
			window.clickElement = file; 
			setTimeout( function()
			{
				window.clickElement = null;
			}, 250 );
			
		}, false );
	}
}

function RefreshWindowGauge( win, finfo )
{
	if( win.content ) win = win.content
	if( !win.fileInfo && finfo ) win.fileInfo = finfo;
	if( !win.fileInfo ) return;
	var wt = win.fileInfo.Path ? win.fileInfo.Path : win.fileInfo.Title;
	var isVolume = wt.substr( wt.length - 1, 1 ) == ':' ? true : false;
	if( isVolume )
	{
		var m = new Module( 'system' );
		m.onExecuted = function( e, d )
		{
			if( e == 'ok' )
			{
				var dj = JSON.parse( d );
				win.parentNode.volumeGauge.style.height = Math.floor( dj.Used / dj.Filesize * 100 ) + '%';
			}
		}
		var pth = wt.indexOf( ':' ) > 0 ? wt : ( wt + ':' );
		m.execute( 'volumeinfo', { path: pth } );
	}
}

// Opens a window based on the fileInfo (type etc)
function OpenWindowByFileinfo( fileInfo, event, iconObject )
{
	if( !iconObject )
	{
		var ext = fileInfo.Path ? fileInfo.Path.split( '.' ) : fileInfo.Title.split( '.' );
		ext = ext[ext.length-1];
		iconObject = {
			Title: fileInfo.Title,
			Filename: fileInfo.Filename,
			Filesize: fileInfo.Filesize,
			Path: fileInfo.Path,
			extension: ext,
			fileInfo: fileInfo
		};
	}
	
	if( fileInfo.Type == 'Dormant' )
	{
		var command = fileInfo.Command ? 'command='+fileInfo.Command : '';
		var fid = typeof( fileInfo.ID ) != 'undefined' ? fileInfo.ID : '1';
		
		var wt =  fileInfo.Path ? fileInfo.Path : fileInfo.Title;
		
		var win = new View( {
			'title'    : wt, 
			'width'    : 480, 
			'height'   : 180, 
			'memorize' : true,
			'id'       : fileInfo.Path ? fileInfo.Path : fileInfo.Title,
			'volume'   : wt.substr( wt.length - 1, 1 ) == ':' ? true : false
		} );
		
		fileInfo.Dormant.addWindow( win );
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>' );
		var we = win.getWindowElement();
		we.parentFile = iconObject;
		we.parentWindow = iconObject.window;
		we.fileInfo = fileInfo;
		CreateDirectoryView ( we );
		
		we.refresh = function()
		{
			var fi = fileInfo ? fileInfo : iconObject;
			var t = fi && fi.Path ? fi.Path : fi.Volume;
			fileInfo.Dormant.getDirectory( t, function( icons ){
				we.redrawIcons( icons, we.direction );
				win.addEvent( 'resize', function()
				{
					we.redrawIcons( win.icons, we.direction );
				} );
				RefreshWindowGauge( win );
			} );
		}
		we.refresh ();
	}
	else if( fileInfo.Type == 'DormantFunction' )
	{
		fileInfo.Dormant.execute( fileInfo.Title ? fileInfo.Title : fileInfo.Filename );
	}
	else if( iconObject.extension == 'mp3' || iconObject.extension == 'ogg' )
	{
		var rr = iconObject;
		
		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename, 
			width    : 320, 
			height   : 100, 
			memorize : true
		} );
		
		// TODO: This will be the only way
		//if( typeof( DoorLocal ) != 'undefined' && this.fileInfo.Door && this.fileInfo.Door.get == DoorLocal.prototype.get )
		//{
			win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><iframe style="border: 0; position: absolute; top: 0; left: 0; height: 100%; width: 100%" src="/system.library/file/read?mode=rb&sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '"></iframe></div>' );
	}
	else if( iconObject.extension == 'jpg' || iconObject.extension == 'png' || iconObject.extension == 'gif' )
	{
		var rr = iconObject;
		
		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename, 
			width    : 650, 
			height   : 512, 
			memorize : true
		} );
		
		var num = ( Math.random() * 1000 ) + ( ( new Date() ).getTime() ) + ( Math.random() * 1000 );
		
		// TODO: This will be the only way
		//console.log( this.fileInfo.Door.prototype == DoorLocal.prototype ? 'yes' : 'no' );
		/*if( typeof( DoorLocal ) != 'undefined' && this.fileInfo.Door && this.fileInfo.Door.get == DoorLocal.prototype.get )
		{*/
			win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url(\'/system.library/file/read?mode=rb&sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '\'); background-position: center; background-size: contain; background-repeat: no-repeat; background-color: black"></div>' );
	}
	else if( iconObject.extension == 'mov' || iconObject.extension == 'avi' || iconObject.extension == 'mp4' || iconObject.extension == 'mpg' )
	{
		var rr = iconObject;
		
		var win = new View ( {
			title    : iconObject.Title ? iconObject.Title : iconObject.Filename, 
			width    : 650, 
			height   : 512, 
			memorize : true
		} );
		
		var num = ( Math.random() * 1000 ) + ( ( new Date() ).getTime() ) + ( Math.random() * 1000 );
		
		win.setContent( '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%" class="LoadingAnimation"><video id="target_' + num + '" style="position: absolute; top: 0; left: 0; width: 100%; height: auto;" src="/system.library/file/read?sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&mode=rb" autoplay="autoplay"></video></div>' );
	}
	// Executing executable javascript
	else if( iconObject.extension == 'jsx' )
	{
		var f = new File( fileInfo.Path );
		f.fileInfo = fileInfo;
		f.path = fileInfo.Path;
		f.onLoad = function( data )
		{
			var title = fileInfo.Title ? fileInfo.Title : 
				( fileInfo.Filename ? fileInfo.Filename : fileInfo.Path );
			
			// Run as a normal app
			if( data.match( /Application.run/i ) )
			{
				ExecuteJSX( data, title, false, iconObject.Path );
			}
			// Run in a window
			else
			{
				var w = new View( {
					title: title,
					width:  640,
					height: 480
				} );
				w.setJSXContent( data, title );
			}
		}
		f.load();
	}
	// We've clicked on a directory!
	else if( fileInfo.MetaType == 'Directory' )
	{
		var wt = fileInfo.Path ? fileInfo.Path : fileInfo.Title;
		if ( fileInfo.Type == 'Directory' && wt.substr( wt.length - 1, 1 ) != ':' && wt.substr( wt.length - 1, 1 ) != '/' )
			wt += '/';
		wt = wt.split( ':/' ).join ( ':' );
		
		var id = fileInfo.Type + '_' + ( fileInfo.ID ? fileInfo.ID : fileInfo.Path );
		
		// TODO: Make it work!
		console.log( 'Opening directory!!' );
		console.log( id );
		
		// Is this a volume?
		var isVolume = wt.substr( wt.length - 1, 1 ) == ':' ? true : false;
		
		var w = new View ( {
			'title'    : wt, 
			'width'    : 480, 
			'height'   : 180, 
			'memorize' : true,
			'id'       : id,
			'volume'   : isVolume
		} );
		
		// Ok, window probably was already opened, try to activate window
		if( !w.ready )
		{
			// Activate existing window with the same id...
			if( movableWindows[id] )
			{
				_ActivateWindow( movableWindows[id] );
				_WindowToFront( movableWindows[id] );
			}
			var wo = movableWindows[id];
			if( wo.content )
				wo = wo.content;
			wo.refresh();
			return false;
		}
		
		// Get legacy win element
		var win = w.getWindowElement();
		win.innerHTML = '<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" class="LoadingAnimation"></div>';
		win.parentFile = iconObject;
		win.parentWindow = iconObject.window;
		win.fileInfo = fileInfo;
		if( !win.fileInfo.Volume )
		{
			if( win.fileInfo.Path )		
				win.fileInfo.Volume = win.fileInfo.Path.split( ':' )[0] + ':';
		}
		
		// Create a directory view on window
		CreateDirectoryView ( win );
		
		// Special case - the fileInfo object has a door!
		if( fileInfo.Door )
		{
			var dr = fileInfo.Door;
			if( !dr.getIcons ) return;
			var fi = fileInfo;
			
			// Get some volume info!
			RefreshWindowGauge( win );
			
			// Connect winbdow and door together
			fileInfo.Door.window = win;
			win.Door = fileInfo.Door;
			
			win.refresh = function()
			{
				dr.getIcons( fi, function( icons )
					{
						//console.log('### callback called.... redraw em ### '); console.log( win); console.log( icons );
						// Assign door to each icon
						for( var t in icons )
						{
							
							if( win.Door.instantiate )
							{
								icons[t].Door = win.Door.instantiate();
							}
							else
							{
								// TODO: What happened? No instantiation?
								console.log( 'Failed to make door.' );
								console.log( win.Door );
							}
						}
						win.redrawIcons( icons, win.direction );
						w.addEvent( 'resize', function()
						{
							win.redrawIcons( win.icons, win.direction );
						} );
						RefreshWindowGauge( win );
					}
				);
			}
		}
		// No door, implement standard refresh
		else
		{
			win.refresh = function ()
			{
				var j = new cAjax ();
				j.open( 'POST', '/system.library/file/dir', true, true );
				j.addVar( 'path', fileInfo.Path );
				j.fileInfo = fileInfo;
				j.file = iconObject;
				j.win = iconObject;
				j.onload = function ()
				{
					var content;
					// New mode
					if ( this.returnCode == 'ok' )
					{
						try
						{
							content = JSON.parse(this.returnData||"null");
						}
						catch ( e ){};
					}
					// Legacy mode.. 
					// TODO: REMOVE FROM ALL PLUGINS AND MODS!
					else 
					{
						try
						{
							content = JSON.parse(this.responseText() || "null");
						}
						catch ( e ){}
					}
				
					if ( content )
					{
						var w = this.win;
						w.redrawIcons( content, w.direction );
						w.file = this.file;
						w.AddEvent ( 'resize', function ()
						{
							w.redrawIcons( content, w.direction );
						} );
					}
					RefreshWindowGauge( win );
				}
				j.send ();
			}
		}
		win.refresh ();
	}
	// TODO: Check mime type!
	else if ( fileInfo.MetaType == 'File' )
	{
		if( fileInfo.Type.toLowerCase() == 'executable' )
		{
			ExecuteApplication( fileInfo.fileName ? fileInfo.fileName : 
				( fileInfo.Filename ? fileInfo.Filename : fileInfo.Title ) );
		}
		else
		{
			var fid = typeof ( fileInfo.ID ) != 'undefined' ? 
				fileInfo.ID : fileInfo.Filename;
			var cmd = ( typeof ( fileInfo.Command ) != 'undefined' && fileInfo.Command != 'undefined' ) ? 
				fileInfo.Command : 'file';
	
			var win = new View ( {
				'title'    : iconObject.Title ? iconObject.Title : iconObject.Filename,
				'width'    : 330, 
				'height'   : 180, 
				'memorize' : true,
				'id'       : fileInfo.MetaType + '_' + fid
			} );
	
			win.parentFile = iconObject;
			win.setContent ( '<iframe style="background: #e0e0e0; position: absolute; top: 0; \
				left: 0; width: 100%; height: 100%; border: 0" \
				src="/system.library/file/read?sessionid=' + Workspace.sessionId + '&path=' + fileInfo.Path + '&mode=rb"></iframe>' );
			win.parentWindow = iconObject.window;
		}
	}
	
	cancelBubble( event );
}

// Create an icon (fast way) and return the dom element
function CreateIcon( fileInfo )
{
	var c = new FileIcon ( fileInfo );
	return c.file;
}

// Helper functions ------------------------------------------------------------

// Some global keys for directoryviews
function CheckDoorsKeys ( e )
{
	if ( !e ) e = window.event;
	var k = e.which | e.keyCode;
	switch ( k )
	{
		case 46:
			DoorsDeleteFiles ();
			break;
	}
}

// Delete files in a file view (from selected icons)
function DoorsDeleteFiles ( )
{
	var w = window.regionWindow;
	if ( w && w.icons && w.icons.length )
	{
		var num = 0;
		var icons = new Array ();
		for( var a = 0; a < w.icons.length; a++ )
		{
			if ( w.icons[a].domNode.className.indexOf ( ' Selected' ) > 0 )
			{
				icons.push ( w.icons[a].domNode.fileInfo );
				num++;
			}
		}
		if ( num > 0 )
		{
			if ( confirm ( 'Er du sikker på at du vil legge ' + num + ' fil(er) i søppel?' ) )
			{
				var j = new cAjax ();
				j.open ( 'post', 'admin.php?module=files&command=delete', true, true );
				j.addVar ( 'fileInfo', JSON.stringify ( jsonSafeObject ( icons ) ) );
				j.onload = function ()
				{
					if ( this.returnCode == 'ok' )
					{
						if ( window.regionWindow )
						{
							if ( window.regionWindow == ge ( 'Doors' ) )
								RefreshDesktop ();
							else if( window.regionWindow.redrawIcons )
							{
								window.regionWindow.redrawIcons();
							}
							else if( window.regionWindow.windowObject && window.regionWindow.windowObject.redrawIcons )
							{
								window.regionWindow.windowObject.redrawIcons();
							}
						}
					}
					else alert ( 'En feil oppsto under slettingen.' );
				}
				j.send ();
			}
		}
	}
}

// Refresh a directoryview (window)
function RefreshDirectoryView ( win )
{
	// Is it the workbench window?
	if ( win == ge ( 'Doors' ) )
	{
		RefreshDesktop ();
	}
	// If now, see if it's a normal window
	else
	{
		if( win.redrawIcons )
			win.redrawIcons();
		else if ( win.windowObject && win.windowObject.redrawIcons )
			win.windowObject.redrawIcons();
		else
		{
			console.log('Could not refresh directory view.'); console.log( win );
		}
	}
}

// Loads data using a frame instead...
Frameloader = function( auth, pelement )
{
	this.pelement = pelement;
	this.url = '';
	this.vars = [];
	
	var i = document.createElement( 'iframe' );
	i.className = 'Frameloader';
	this.pelement.appendChild( i );
	this.frame = i;
	
	this.open = function( url )
	{		
		this.url = url;
	}
	this.addVar = function( k, v )
	{
		this.vars[ k ] = v;
	}
	this.load = function()
	{
		var u = this.url;
		var s = '?';
		if ( u.indexOf( '?' ) > 0 ) s = '&';
		for( var a in this.vars )
		{
			u += s+a+'='+encodeURIComponent( this.vars[a] );
			s = '&';
		}
		this.frame.src = u + '&authkey=' + auth + '&frameloaderand=' + Math.random(0,99999)+ '.' + Math.random(0,99999) + '.' + ( new Date() ).getTime();
	}
}

// Load image
Imageloader = function( auth, pelement )
{
	this.pelement = pelement;
	this.url = '';
	this.vars = [];
	
	var i = document.createElement( 'div' );
	i.className = 'Scroller';
	this.pelement.appendChild( i );
	this.scroller = i;
	
	this.open = function( url )
	{		
		this.url = url;
	}
	this.addVar = function( k, v )
	{
		this.vars[ k ] = v;
	}
	this.load = function()
	{
		var u = this.url;
		var s = '?';
		if ( u.indexOf( '?' ) > 0 ) s = '&';
		for( var a in this.vars )
		{
			u += s+a+'='+encodeURIComponent( this.vars[a] );
			s = '&';
		}
		this.scroller.innerHTML = '<img src="' + u + '&authkey=' + auth + '&imageloaderand=' + Math.random(0,99999)+ '.' + Math.random(0,99999) + '.' + ( new Date() ).getTime() + '" class="Imageloader"/>';
	}
}

if ( window.addEventListener )
	window.addEventListener ( 'keydown', CheckDoorsKeys );
else window.attachEvent ( 'onkeydown', CheckDoorsKeys );


