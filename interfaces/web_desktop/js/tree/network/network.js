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
 * Tree engine network elements
 *
 * @author FL (Francois Lionet)
 * @date first pushed on 04/03/2018
 */
Friend = window.Friend || {};
Friend.Tree.Network = Friend.Tree.Network || {};
Friend.Tree.Network.RenderItems = Friend.Tree.Network.RenderItems || {};

Friend.Tree.Network.init = function( callback )
{
	var scriptList =
	[
        "/webclient/js/tree/network/networkChooseTree.js",
        "/webclient/js/tree/network/networkManager.js",
        "/webclient/js/tree/network/networkProcesses.js",
        "/webclient/js/tree/network/networkDormant.js",
    ];
	Friend.Tree.include( scriptList, function( response )
	{
		callback( response );
	} );
};
