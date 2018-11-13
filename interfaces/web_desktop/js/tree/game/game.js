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
 * Tree engine game items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Game = Friend.Tree.Game || {};
Friend.Tree.Game.RenderItems = Friend.Tree.Game.RenderItems || {};

Friend.Tree.Game.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/game/gameBitmap.js",
        "/webclient/js/tree/game/gameMap.js",
        "/webclient/js/tree/game/gameMultiplayer.js",
        "/webclient/js/tree/game/gameProcesses.js",
        "/webclient/js/tree/game/gameSprite.js",
        "/webclient/js/tree/game/gameSprite3D.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
