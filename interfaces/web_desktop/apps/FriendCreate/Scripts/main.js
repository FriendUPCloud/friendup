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

}


function InitGui()
{
	InitTabSystem( ge( 'SiteBarTabs' ) );
	if( ge( 'SideBar' ) )
	{
		gui.sideBar = new Friend.FileBrowser( ge( 'SB_AllFiles' ), { displayFiles: true }, gui.sideBarCallbacks );
		gui.sideBar.render();
	}
}

