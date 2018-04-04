/*©agpl*************************************************************************
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
