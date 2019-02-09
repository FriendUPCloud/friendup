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
		'min-height': 400,
	} );
	
	this.mainView = w;
	
	w.onClose = function( closeWindow )
	{
		/*if( !w.saved )
		{
			Confirm( 'Are you sure?', 'By closing the application you may lose unsaved data.', function( res )
			{
				if( res.data )
				{
					Application.quit();
				}
				else
				{
					closeWindow( false );
				}
			} );
		}*/
		Application.quit();
		return false;
	}
	
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
				/*{
					name: i18n( 'menu_print_remote' ),
					command: 'print_remote'
				},*/
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
			name: i18n( 'menu_preferences' ),
			items: [
				{
					name: i18n( 'menu_preferences' ),
					command: 'showprefs'
				}/*,
				{
					name: i18n( 'menu_vr_features' ),
					command: 'togglevr'
				}*/
			]
		}
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
			// Open by path
			if( msg.args && typeof( msg.args ) != 'undefined' )
			{
				//console.log( 'What happens: ', msg.args );
				w.sendMessage( { command: 'loadfiles', files: [ { Path: msg.args } ] } );
			}
			else if( Application.sessionObject && Application.sessionObject.content )
			{
				if( Application.sessionObject.currentDocument )
				{
					w.sendMessage( { command: 'loadfiles', files: [ { Path: Application.sessionObject.currentDocument } ] } );
					return;
				}
				
				var msng = { 
					command: 'newdocument',
					content: Application.sessionObject.content,
					scrollTop: Application.sessionObject.scrollTop,
					browserPath: 'Home:Notes/'
				};
				w.sendMessage( msng );
				
				if( Application.sessionObject.currentDocument )
				{
					Application.wholeFilename = Application.sessionObject.currentDocument;
				}
				
				if( Application.sessionObject.currentDocument )
				{
					Application.mainView.setFlag( 'title', 'Notes - ' + Application.sessionObject.currentDocument );
				}
			}
			else
			{
				w.sendMessage( { 
					command: 'newdocument',
					content: '',
					browserPath: 'Home:Notes/'
				} );
			}
		} );
	}
	f.load();
	
	/*var noti = new View( { title: 'Notice', width: 300, height: 300 } );
	var cf = new File( 'Progdir:Templates/notice.html' );
	cf.onLoad = function( data )
	{
		noti.setContent( data );
	}
	cf.load();*/
}

// Return the current state of the application
Application.sessionStateGet = function()
{
	if( this.sessionObject && this.sessionObject.content )
	{
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
		//console.log( k );
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

Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	switch( msg.command )
	{
		case 'updateViewMode':
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
			break;
		case 'setfilename':
			this.wholeFilename = msg.data;
			this.mainView.setFlag( 'title', 'Notes - ' + msg.data );
			break;
		case 'newdocument':
			this.mainView.setFlag( 'title', 'Notes - ' + i18n( 'i18n_new_document' ) );
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
			this.mainView.setFlag( 'title', 'Notes - ' + this.wholeFilename );
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
			this.mainView.sendMessage( { command: 'print_iframe' } );
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
				this.mainView.setFlag( 'title', 'Notes - ' + msg.path );
			}
			break;
		case 'syncload':
			if( msg.filename )
			{
				this.wholeFilename = msg.filename;
				this.mainView.setFlag( 'title', 'Notes - ' + this.wholeFilename );
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
	}
}



