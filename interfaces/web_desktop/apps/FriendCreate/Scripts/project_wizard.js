/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

Application.run = function()
{
	phaseOne();
}

// Phase one is to select what type of project you want to create
function phaseOne()
{
	var types = [
		{
			type: 'game',
			title: 'i18n_game',
			description: 'i18n_game_desc'
		},
		{
			type: 'gui',
			title: 'i18n_gui_application',
			description: 'i18n_gui_application_desc'
		},
		{
			type: 'shell',
			title: 'i18n_shell_application',
			description: 'i18n_shell_application_desc'
		}
	];
	
	ge( 'MainArea' ).innerHTML = '';
	
	var cont = document.createElement( 'div' );
	cont.className = 'ContentFull ScrollArea Padding';
	ge( 'MainArea' ).appendChild( cont );
	
	for( var a = 0; a < types.length; a++ )
	{
		var d = document.createElement( 'div' );
		d.className = 'ProjectType BackgroundHeavy MousePointer Rounded BordersDefault Padding MarginRight MarginBottom';
		
		var lab = document.createElement( 'div' );
		lab.className = 'ProjectTypeLabel';
		lab.innerHTML = i18n( types[a].title );
		
		var des = document.createElement( 'div' );
		des.className = 'ProjectTypeDescription';
		des.innerHTML = i18n( types[a].description );
		
		d.appendChild( lab );
		d.appendChild( des );
		cont.appendChild( d );
		
		d.type = types[a].type;
		
		d.onmouseover = function()
		{
			this.classList.remove( 'BackgroundHeavy' );
			this.classList.add( 'BackgroundHeavier' );
		}
		d.onmouseout = function()
		{
			this.classList.remove( 'BackgroundHeavier' );
			this.classList.add( 'BackgroundHeavy' );
		}
		d.onclick = function()
		{
			createProject( this.type );
		}
	}
}

// Actually create the project
function createProject( type )
{
	var flags = {
		path: 'Mountlist:',
		type: 'path',
		title: i18n( 'i18n_select_where_to_create_folder' ),
		triggerFunction: func
	};
	function func( p )
	{
		if( p == 'Mountlist:' )
			p = 'Home:';
		Application.sendMessage( {
			command: 'project_create',
			type: type,
			path: p
		} );
	}
	new Filedialog( flags );
}

