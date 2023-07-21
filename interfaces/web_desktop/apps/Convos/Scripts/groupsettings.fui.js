/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

class FUIGroupsettings extends FUIInvitedialog
{
	constructor( options )
	{
		super( options );
		
		this.initialized = true;
	}
	
	getClassName()
	{
		return 'FUIInvitedialog FUIGroupsettings';
	}
	
	createTitle()
	{
		let t = document.createElement( 'div' );
		t.className = 'Title';
		t.innerHTML = '<span>' + ( this.options.title ? this.options.title : i18n( 'i18n_group_settings' ) ) + '</span><span class="Close"></span>';
		return t;
	}
	
	setFormContents( element )
	{
		let f = new File( 'Progdir:Markup/groupsettings.html' );
		//f.replacements = { 'channel-name': this.options.channelName.split( /\s/ ).join( '-' ) };
		f.i18n();
		f.onLoad = function( data )
		{
			r.innerHTML = data;
			r.classList.remove( 'Loading' );
		}
		f.load();
	}
}

FUI.registerClass( 'groupsettings', FUIGroupsettings );
