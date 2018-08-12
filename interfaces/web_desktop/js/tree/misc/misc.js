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
 * Tree engine interface elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 16/04/2018
 */
Friend = window.Friend || {};
Friend.Tree.Misc = Friend.Tree.Misc || {};
Friend.Tree.Misc.RenderItems = Friend.Tree.Misc.RenderItems || {};

Friend.Tree.Misc.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/misc/ace.js"
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};

