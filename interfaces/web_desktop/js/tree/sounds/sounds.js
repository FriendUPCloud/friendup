/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 * Tree engine sound elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Sounds = Friend.Tree.Sounds || {};
Friend.Tree.Sounds.RenderItems = Friend.Tree.Sounds.RenderItems || {};

Friend.Tree.Sounds.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/sounds/soundsProcesses.js",
        "/webclient/js/tree/sounds/soundsSound.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
