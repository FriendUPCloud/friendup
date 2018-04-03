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
 * Tree engine Tree management elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.RenderItems = Friend.Tree.RenderItems || {};

Friend.Tree.initTreeLife = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/tree/treeEmpty.js",
        "/webclient/js/tree/tree/treeRendererImage.js",
        "/webclient/js/tree/tree/treeTree.js",
        "/webclient/js/tree/tree/treePixelizer.js",
        "/webclient/js/tree/tree/treeAsciiArt.js",
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
