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
}

// Set up our tabs!
var vtabs = new VertTabContainer( ge( 'VTabs' ) );
var tabs = [
	{
		name:  'Language',
		label: i18n('i18n_language_settings'),
		pageDiv: ge( 'VPage1' )
	},
	{
		name:  'Features',
		label: i18n('i18n_feature_settings'),
		pageDiv: ge( 'VPage2' )
	}
];
for( var a = 0; a < tabs.length; a++ )
{
	vtabs.addTab( tabs[a] );
}

function doCancel()
{
	Application.sendMessage( {
		command: 'closeprefs'
	} );
}

