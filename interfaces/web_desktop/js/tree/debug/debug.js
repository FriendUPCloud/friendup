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
 * Tree engine debiugging items
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Debug = Friend.Tree.Debug || {};
Friend.Tree.Debug.RenderItems = Friend.Tree.Debug.RenderItems || {};

Friend.Tree.Debug.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/debug/debugDebugger.js",
        "/webclient/js/tree/debug/debugFps.js",
        "/webclient/js/tree/debug/debugRendererControl.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
