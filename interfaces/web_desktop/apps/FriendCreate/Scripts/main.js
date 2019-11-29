var gui = {
	sideBar: null,
	sideBarCallbacks: {
		// Check a file on file extension
		checkFile( path, extension )
		{
			/*if( extension == 'apf' )
			{
				Confirm( 
					i18n( 'i18n_loading_project' ), 
					i18n( 'i18n_loading_project_desc' ), function( info )
				{
					if( info.data == true )
					{
						Application.sendMessage( {
							command: 'project_load',
							path: path
						} );
					}
					// Just load it
					else
					{
						Application.sendMessage( {
							command: 'loadfiles',
							paths: [ path ]
						} );
					}
				} );
			}
			else
			{
				var found = false;
			
				// Just switch to existing
				for( var a in Application.files )
				{
					if( Application.files[a].filename == path )
					{
						Application.setCurrentFile( a );
						found = true;
						break;
					}
				}
				if( !found )
				{
					Application.sendMessage( {
						command: 'loadfiles',
						paths: [ path ]
					} );
				}
				else
				{
					Application.refreshFilesList();
				}
			}*/
		},
		// Load a file
		loadFile( path )
		{
			/*var found = false;
			// Just switch to existing
			for( var a in Application.files )
			{
				if( Application.files[a].filename == path )
				{
					found = true;
					Application.setCurrentFile( a );
					break;
				}
			}
			if( !found )
			{
				Application.sendMessage( {
					command: 'loadfiles',
					paths: [ path ]
				} );
			}
			else
			{
				Application.refreshFilesList();
			}*/
		},
		// Do we permit?
		permitFiletype( path )
		{
			//return Application.checkFileType( path );
		}
	}
};

Application.run = function( msg )
{
	InitGui();
	InitEditArea();
}


function InitGui()
{
	InitTabs( ge( 'SideBarTabs' ) );
	if( ge( 'SideBar' ) )
	{
		gui.sideBar = new Friend.FileBrowser( ge( 'SB_AllFiles' ), { displayFiles: true }, gui.sideBarCallbacks );
		gui.sideBar.render();
	}
}

var tcounter = 0;
function InitEditArea( filename )
{
	var file = { filename: 'Empty file', filesize: 0, path: false };
	if( filename )
	{
		// Load the file
	}
	
	var p = ge( 'CodeArea' );
	var tc = p.querySelector( '.TabContainer' );
	
	var firstTab = p.querySelector( '.Tab' );
	var firstPage = p.querySelector( '.Page' );
	
	var t = document.createElement( 'div' );
	t.className = 'Tab IconSmall fa-remove';
	t.id = 'codetab_' + ( ++tcounter );
	t.innerHTML = file.filename;
	var d = document.createElement( 'div' );
	d.className = 'Page';
	if( firstTab )
	{
		tc.insertBefore( t, firstTab );
		p.insertBefore( d, firstPage );
	}
	else
	{
		( tc ? tc : p ).appendChild( t );
		p.appendChild( d );
	}
	InitTabs( ge( 'CodeArea' ) );
}


