/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	var nd = new Library( 'system.library' );
	nd.execute( 'file/makedir', { path: 'Home:Notes' } );
	
	var w = new View( {
		'title'     : 'Notes',
		'width'     : 1290,
		'height'    : 800,
		'min-width' : 700,
		'min-height': 400
	} );
	
	this.mainView = w;
	
	w.onClose = function( closeWindow )
	{
		Application.quit();
		return false;
	}
	
	// Set up the main menu items ----------------------------------------------
	w.setMenuItems( [
		{
			name: i18n( 'menu_file' ),
			items: [
				{
					name: i18n( 'menu_new' ),
					command: 'new'
				},
				{
					name: i18n( 'menu_load' ),
					command: 'load'
				},
				{
					name: i18n( 'menu_save' ),
					command: 'save'
				},
				{
					name: i18n( 'menu_save_as' ),
					command: 'save_as'
				},
				{
					name: i18n( 'menu_print' ),
					command: 'print'
				},
				{
					name: i18n( 'menu_quit' ),
					command: 'quit'
				}
			]
		},
		{
			name: i18n( 'menu_document' ),
			items: [
				{
					name: i18n( 'menu_insert_image' ),
					command: 'insertimage'
				},
				{
					name: i18n( 'menu_convert_images_inline' ),
					command: 'makeinlineimages'
				}
			]
		},
		{
			name: i18n( 'menu_design' ),
			items: [
				{
					name: i18n( 'menu_design_default' ),
					command: 'design_default'
				},
				{
					name: i18n( 'menu_design_atmospheric' ),
					command: 'design_atmospheric'
				},
				{
					name: i18n( 'menu_design_dark' ),
					command: 'design_dark'
				}
			]
		}/*,
		{
			name: i18n( 'menu_preferences' ),
			items: [
				{
					name: i18n( 'menu_preferences' ),
					command: 'showprefs'
				}
			]
		}*/
	] );
	
	var f = new File( 'Progdir:Templates/maingui.html' );
	f.replacements = {
		'i18n_search' : i18n('i18n_search'),
		'i18n_find'   : i18n('i18n_find'),
		'i18n_select' : i18n('i18n_select')
	};
	f.onLoad = function( data )
	{
		w.setContent( data, function()
		{
			// Open by path ----------------------------------------------------
			if( msg.args && typeof( msg.args ) != 'undefined' )
			{
				w.sendMessage( { command: 'loadfiles', files: [ { Path: msg.args } ] } );
			}
			// We have a session object ----------------------------------------
			else if( Application.sessionObject && Application.sessionObject.content )
			{
				// Load previously active document -----------------------------
				if( Application.sessionObject.currentDocument )
				{
					w.sendMessage( { command: 'loadfiles', files: [ { Path: Application.sessionObject.currentDocument } ] } );
				}
				else
				{
					// Create instead a new document with content from session -----
					var msng = { 
						command: 'newdocument',
						content: Application.sessionObject.content,
						scrollTop: Application.sessionObject.scrollTop,
						browserPath: 'Home:Notes/'
					};
					w.sendMessage( msng );
				}
			}
			// Create a new, empty document ------------------------------------
			else
			{
				w.sendMessage( { 
					command: 'newdocument',
					content: '',
					browserPath: 'Home:Notes/'
				} );
				Application.wholeFilename = false;
			}
			Application.setCorrectTitle();
		} );
	}
	f.load();
}

// Return the current state of the application (overloaded function)
Application.sessionStateGet = function()
{
	if( this.sessionObject && this.sessionObject.content )
	{
		if( !this.sessionObject.currentDocument )
		{
			this.sessionObject.currentDocument = this.wholeFilename;
		}
		return JSON.stringify( {
			currentDocument: this.wholeFilename,
			content: this.sessionObject.content,
			scrollTop: this.sessionObject.scrollTop
		} );
	}
	return JSON.stringify( { content: '', scrollTop: 0 } );
}

Application.handleKeys = function( k, e )
{
	if( e.ctrlKey )
	{
		if( k == 79 )
		{
			this.load(); 
			return true;
		}
		else if( k == 83 )
		{
			this.save(); 
			return true;
		}
		// n (doesn't work, find a different key)
		else if( k == 78 )
		{
			this.newFile();
			return true;
		}
		else if( k == 81 )
		{
			this.quit();
			return true;
		}
		// CTRL + I
		else if( k == 73 )
		{
			this.closeFile();
			return true;
		}
	}
	return false;
}

// Toggle VR gui features
Application.toggleVR = function()
{
	
}

Application.newDocument = function()
{
	this.sessionObject = {};
	this.wholeFilename = '';
	this.mainView.setFlag( 'title', 'Notes' );
	this.mainView.sendMessage( {
		command: 'newdocument'
	} );
}

// Prints a file
Application.print = function()
{
	if( !Application.wholeFilename )
	{
		Alert( i18n( 'i18n_print_alert' ), i18n( 'i18n_not_saved_cant_print' ) );
		return;
	}
	/*if( this.printDialog ) return;
	var w = new View( {
		title: 'Print preview',
		width: 700,
		height: 800
	} );
	this.printDialog = w;
	*/
	Application.mainView.sendMessage( {
		command: 'print',
		path: Application.wholeFilename
	} );
}

// Loads a file
Application.load = function()
{
	if( this.fileDialog ) return;
	
	var flags = {
		multiSelect: false,
		suffix: 'html',
		triggerFunction: function( arr )
		{
			if( arr )
			{
				Application.mainView.sendMessage( {
					command: 'loadfiles',
					files: arr
				} );
				Application.wholeFilename = arr[0].Path;
				Application.mainView.setFlag( 'title', 'Notes - ' + Application.wholeFilename );
			}
			Application.fileDialog = false;
		},
		path: false,
		mainView: this.mainView,
		type: 'load',
		suffix: [ 'html', 'htm' ]	
	};
	
	var f = new Filedialog( flags );
	this.fileDialog = f;
}

Application.saveAs = function()
{
	this.prevFilename = this.wholeFilename;
	this.wholeFilename = false;
	this.save( 'saveas' );
}

// Saves current file
Application.save = function( mode )
{
	if( this.wholeFilename )
	{
		Application.mainView.sendMessage( {
			command: 'savefile',
			path: Application.wholeFilename
		} );
	}
	else
	{
		var flags = {
			type: 'save',
			triggerFunction: function( fname )
			{
				if( !fname || !fname.length )
				{
					if( Application.prevFilename )
					{
						Application.wholeFilename = Application.prevFilename;
						Application.prevFilename = false;
					}
					return;
				}
				
				if( fname.indexOf( '.' ) < 0 )
					fname += '.html';
				Application.mainView.sendMessage( {
					command: 'savefile',
					path: fname
				} );
				Application.wholeFilename = fname;
				Application.mainView.setFlag( 'title', 'Notes - ' + fname );
			},
			mainView: this.mainView,
			title: mode == 'saveas' ? i18n( 'i18n_save_as' ) : i18n( 'i18n_save' ),
			suffix: [ 'html', 'htm' ]
		};
	
		var f = new Filedialog( flags );
	}
}

Application.insertImage = function( file )
{
	this.mainView.sendMessage( {
		command: 'insertimage',
		path: file
	} );
}

Application.showPrefs = function()
{
	if( this.pwin ) 
	{
		return this.pwin.activate();
	}
	this.pwin = new View( {
		title: i18n('i18n_preferences'),
		width: 800,
		height: 500,
		id: 'authorprefswin'
	} );
	
	this.pwin.onClose = function()
	{
		Application.pwin = false;
	}
	
	var f = new File( 'Progdir:Templates/preferences.html' );
	f.onLoad = function( data )
	{
		Application.pwin.setContent( data );
	}
	f.i18n();
	f.load();
}

function sanitizeFilename( data )
{
	if( !data ) return i18n( 'i18n_new_document' );
	var filename = data.split( ':' )[1];
	if( filename.indexOf( '/' ) > 0 )
		filename = filename.split( '/' ).join( ' - ' );
	
	filename = filename.split( ' - ' );
	
	// Special for notes, remove first folder
	var ar = [];
	for( var a = 1; a < filename.length; a++ )
	{
		ar.push( filename[ a ] );
	}
	filename = ar.join( ' - ' );
	
	// Join
	filename = filename.split( '.' );
	filename.pop();
	filename = filename.join( '.' );
	
	return filename;
}

Application.setCorrectTitle = function()
{
	if( this.currentViewMode == 'files' )
	{
		var cand = '';
		if( this.browserPath )
		{
			cand = this.browserPath;
			if( cand.indexOf( '/' ) > 0 )
			{
				cand = cand.split( '/' );
				cand.pop();
				cand = cand.join( '/' );
				if( cand.indexOf( '/' ) > 0 )
				{
					cand = cand.split( '/' ).pop();
				}
				else
				{
					cand = cand.split( ':' ).pop();
				}
				if( cand == 'Notes' )
					cand = i18n( 'i18n_uncategorized' );
			}
			else
			{
				cand = i18n( 'i18n_uncategorized' );
			}
		}
		else
		{
			cand = i18n( 'i18n_uncategorized' );
		}
		Application.mainView.setFlag( 'title', 'Notes - ' + cand );
	}
	else if( this.currentViewMode == 'root' )
	{
		Application.mainView.setFlag( 'title', 'Notes - ' + i18n( 'i18n_categories' ) );
	}
	else
	{
		Application.mainView.setFlag( 'title', 'Notes - ' + sanitizeFilename( Application.wholeFilename ) );
	}
}

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'updateViewMode':
			this.currentViewMode = msg.mode;
			if( isMobile )
			{
				var mode = msg.mode;
				if( mode == 'notes' || mode == 'files' )
				{
					var v = this.mainView;
					v.showBackButton( true, function()
					{
						v.sendMessage( { command: 'mobilebackbutton' } );
					} );
				}
				else
				{
					this.mainView.showBackButton( false );
				}
			}
			this.browserPath = msg.browserPath;
			this.setCorrectTitle();
			break;
		case 'setfilename':
			var oldWhole = this.wholeFilename;
			this.wholeFilename = msg.data;

			if( msg.rename && oldWhole != this.wholeFilename )
			{
				// Get the filename component
				var filenameComponent = this.wholeFilename;
				if( filenameComponent.indexOf( ':' ) > 0 )
				{
					filenameComponent = filenameComponent.split( ':' )[1];
				}
				if( filenameComponent.indexOf( '/' ) > 0 )
				{
					filenameComponent = filenameComponent.split( '/' ).pop();
				}
				var ocomp = filenameComponent;
				
				var newFile = oldWhole.substr( -13, 13 ) == '/unnamed.html';
				
				// Don't use a filename already taken
				var docPath = this.wholeFilename.substr( 0, this.wholeFilename.length - filenameComponent.length );
				var dr = new Door( docPath );
				var ics = dr.getIcons( function( items )
				{
					var found = false;
					var num = 2;
					do
					{
						found = false;
						for( var a = 0; a < items.length; a++ )
						{
							if( !newFile && items[ a ].Filename == oldWhole ) continue;
							if( items[ a ].Filename == filenameComponent )
							{
								if( docPath + filenameComponent == msg.rename )
								{
									Application.wholeFilename = msg.rename;
									Application.setCorrectTitle();
									return;
								}
								var comps = ocomp.split( '.' );
								filenameComponent = comps[0] + ' ' + ( num++ ) + '.' + comps[1];
								found = true;
							}
						}
					}
					while( found );
					
					// Make the change
					let l = new Library( 'system.library' );
					l.onExecuted = function( e, d )
					{
						if( e == 'ok' )
						{
							Application.mainView.sendMessage( {
								command: 'setcurrentdocument',
								path: docPath + filenameComponent
							} );
							Application.setCorrectTitle();
						}
					}
					l.execute( 'file/rename', { path: oldWhole, newname: filenameComponent } );
				} );
			}
			else
			{
				this.setCorrectTitle();
			}
			break;
		case 'newdocument':
			this.wholeFilename = '';
			break;
		case 'applystyle':
			this.mainView.sendMessage( msg );
			break;
		case 'togglevr':
			this.toggleVR();
			break;
		case 'closeprefs':
			this.pwin.close();
			this.pwin = false;
			break;
		case 'currentfile':
			this.fileName = msg.filename;
			this.path = msg.path;
			this.wholeFilename = msg.path + msg.filename;
			this.setCorrectTitle();
			break;
		case 'openfile':
			this.load();
			break;
		case 'keydown':
			this.handleKeys( msg.key, { ctrlKey: msg.ctrlKey } );
			break;
		case 'quit':
			this.quit();
			break;
		case 'new':
			this.newDocument();
			break;
		case 'print':
			var p = new Printdialog( {
				path: this.wholeFilename
			} );
			//this.mainView.sendMessage( { command: 'print_iframe' } );
			break;
		case 'print_remote':
			this.print();
			break;
		case 'remembercontent':
			this.sessionObject.content = msg.data;
			this.sessionObject.scrollTop = msg.scrollTop;
			if( msg.path )
			{
				this.wholeFilename = msg.path;
				this.setCorrectTitle();
			}
			break;
		case 'syncload':
			if( msg.filename )
			{
				this.wholeFilename = msg.filename;
				this.setCorrectTitle();
			}
			break;
		case 'load':
			this.load();
			break;
		case 'save':
			this.save();
			break;
		case 'save_as':
			this.saveAs();
			break;
		// Make sure we can activate window
		case 'activate':
			this.mainView.activate();
			break;
		// Show preferences
		case 'showprefs':
			this.showPrefs();
			break;
		case 'makeinlineimages':
			this.mainView.sendMessage( msg );
			break;
		case 'insertimage':
			var f = new Filedialog( this.mainView, function( items )
			{
				for( var a = 0; a < items.length; a++ )
				{
					Application.insertImage( items[a].Path );
				}
			}, 'Mountlist:', 'load' );
			break;
		case 'design_default':
		case 'design_atmospheric':
		case 'design_dark':
			this.mainView.sendMessage( msg );
			break;
	}
}



